"""Faits normalisés du modèle ; aucune décision précalculée exportée en SQL."""
import json

def literal(value):return "'"+str(value).replace("'","''")+"'"

def load(admin,fixture):
    s=fixture.s
    data={name:[] for name in ('actor','object','hab','founder','member','admission','protection','derogation')}
    for a in s.acteurs.values():
        data['actor'].append(dict(id=a.id,person=a.personne or a.id,active=a.actif and not a.decede,
                                  verified=a.identite_renforcee,authority=a.id in s.autorite_derogation))
    for o in s.objets.values():
        data['object'].append(dict(id=o.id,space=o.espace,title=o.titre,owner=o.titulaire,parent=o.copie_de,purged=o.purge,
                                  non_liftable=o.consentement_retire or o.effacement_legal,sensitive=o.sensible))
    for h in s.habs.values():
        if h.perimetre[0] not in ('objet','contenu') or h.excl_fondateurs and any(h.excl_fondateurs.values()):
            raise ValueError('Périmètre/fondateur hors traduction ciblée')
        if h.beneficiaire[0] not in ('acteur','groupe'):
            raise ValueError('Bénéficiaire hors traduction ciblée')
        data['hab'].append(dict(id=h.id,nature=h.nature,kind=h.type,author=h.auteur,
          beneficiary_kind=h.beneficiaire[0],beneficiary=h.beneficiaire[1],scope_kind=h.perimetre[0],scope=h.perimetre[1],
          role=h.role,active=h.etat=='active',deadline=h.echeance,reshare=h.repartager,actions=sorted(h.actions),exclusions=sorted(h.exclusions)))
        for a,deadline in h.fondateurs.items():data['founder'].append(dict(hab=h.id,actor=a,deadline=deadline))
    for g in s.groupes.values():
        for a in g.membres:data['member'].append(dict(group_id=g.id,actor=a))
    for d in s.admissions.values():
        data['admission'].append(dict(id=d.id,hab=d.hab,actor=d.acteur,admitter=d.admis_par,nature=d.nature,
         active=d.etat=='active',automatic=d.auto,exclusions=sorted(d.exclusions)))
    for p in s.protections.values():
        if p.type not in ('embargo_existence','embargo_contenu','interdiction_existence','interdiction_action'):
            raise ValueError('Protection hors traduction ciblée')
        if any(b[0]!='acteur' for b in p.beneficiaires):raise ValueError('Bénéficiaire protection hors traduction ciblée')
        data['protection'].append(dict(id=p.id,target=p.cible,kind=p.type,active=p.etat=='active',deadline=p.fin,
          allowed=sorted(p.gardiens|{b[1] for b in p.beneficiaires}),recipients=sorted(p.destinataires),actions=sorted(p.actions)))
    for d in s.derogations.values():
        data['derogation'].append(dict(id=d.id,beneficiary=d.beneficiaire,targets=sorted(d.cibles),operations=sorted(d.operations),
          purpose=d.finalite,active=d.etat=='active',start_day=d.debut,end_day=d.fin,approvers=list(d.approbateurs)))
    sql=['BEGIN','SELECT 1 FROM pt01.authority WHERE id=1 FOR UPDATE',
         'TRUNCATE '+','.join('pt02_auth.'+n for n in data)+',pt02_auth.clock',
         f'INSERT INTO pt02_auth.clock VALUES(1,{int(s.now)})']
    for name,rows in data.items():
        if rows:sql.append(f'INSERT INTO pt02_auth.{name} SELECT * FROM json_populate_recordset(NULL::pt02_auth.{name},'
                           +literal(json.dumps(rows,ensure_ascii=False))+')')
    sql+=['UPDATE pt01.authority SET epoch=epoch+1','SELECT pt02_auth.compile_projection()','COMMIT']
    admin.query('; '.join(sql))

def compare(admin,server,harness,fixture,actor,oid,expected,purpose=None):
    load(admin,fixture)
    oracle=fixture.s.acces(actor,oid,'voir',finalite=purpose)
    assert oracle.ok==expected,('attendu texte vs modèle',actor,oid,oracle)
    response=harness.request(server,'/rel/'+actor+'/'+oid+('/'+purpose.replace(' ','_') if purpose else ''))
    payload=json.loads(response['body'])
    assert (response['status']==200)==expected,('SQL vs attendu',actor,oid,response)
    if expected:assert payload['id']==oid
    else:assert payload=={'error':'introuvable'}
    harness.event('comparaison_relationnelle',actor=actor,object_id=oid,expected=expected,
                  oracle_ok=oracle.ok,sql_http_status=response['status'],purpose=purpose)

def hi(admin,server,h,f):
    grant=f.deleg('RS',('acteur','V'),['voir'],('objet',f.o))
    assert f.s.habs[grant].nature=='HI'
    compare(admin,server,h,f,'V',f.o,True)
    f.ok(f.s.clore('R0',f.h_RS))
    compare(admin,server,h,f,'V',f.o,True)  # HI survit au signataire.

def hp(admin,server,h,f):
    base=f.deleg('TIT',('acteur','V'),['voir'],('objet',f.priv),repartager=True)
    derived=f.deleg('V',('acteur','W'),['voir'],('objet',f.priv))
    assert f.s.habs[derived].nature=='HP'
    compare(admin,server,h,f,'W',f.priv,True)
    f.ok(f.s.clore('TIT',base))
    compare(admin,server,h,f,'W',f.priv,False)
    # Éprouve une projection dépendante restée active : le fondement canonique coupe l'accès.
    admin.query('BEGIN; SELECT 1 FROM pt01.authority WHERE id=1 FOR UPDATE; UPDATE pt02_auth.hab SET active=true WHERE id='
                +literal(derived)+'; UPDATE pt01.authority SET epoch=epoch+1; COMMIT')
    assert h.request(server,'/rel/W/'+f.priv)['status']==404

def group(admin,server,h,f):
    f.ok(f.s.creer_groupe('ADM','P','G'))
    f.ok(f.s.ajouter_membre('ADM','G','V'))
    grant=f.deleg('RS',('groupe','G'),['voir'],('objet',f.o),mode='approbation')
    compare(admin,server,h,f,'V',f.o,False)
    f.ok(f.s.admettre('RS',grant,'V'))
    compare(admin,server,h,f,'V',f.o,True)
    f.ok(f.s.retirer_membre('ADM','G','V'))
    compare(admin,server,h,f,'V',f.o,False)
    f.ok(f.s.ajouter_membre('ADM','G','V'))
    compare(admin,server,h,f,'V',f.o,False)  # Admission close ne ressuscite pas.

def derogation(admin,server,h,f):
    f.ok(f.s.accorder_derogation(('SUP1',),'INV',[f.o],['voir'],'diagnostic technique','ticket',7))
    compare(admin,server,h,f,'INV',f.o,False)
    compare(admin,server,h,f,'INV',f.o,True,'diagnostic technique')
    f.s.avancer(8)
    compare(admin,server,h,f,'INV',f.o,False,'diagnostic technique')

def copies(admin,server,h,f):
    copy=f.ok(f.s.reutiliser('RS2',f.o,'Q'))
    compare(admin,server,h,f,'RS2',copy,True)
    protection=f.ok(f.s.creer_protection('RS','embargo_existence',f.o))
    compare(admin,server,h,f,'RS2',copy,False)
    f.ok(f.s.lever_protection('RS',protection))
    compare(admin,server,h,f,'RS2',copy,False)  # Héritage ne se lève pas avec l'original.
def expiry(admin,server,h,f):
    grant=f.deleg('RS',('acteur','V'),['voir'],('objet',f.o),echeance=3)
    compare(admin,server,h,f,'V',f.o,True)
    f.s.avancer(4)
    compare(admin,server,h,f,'V',f.o,False)
    admin.query('BEGIN; SELECT 1 FROM pt01.authority WHERE id=1 FOR UPDATE; UPDATE pt02_auth.hab SET active=true WHERE id='
                +literal(grant)+'; UPDATE pt01.authority SET epoch=epoch+1; COMMIT')
    assert h.request(server,'/rel/V/'+f.o)['status']==404
def person(admin,server,h,f):
    f.s.ajouter_acteur('Vb',personne='V')
    f.deleg('TIT',('acteur','V'),['voir'],('objet',f.priv))
    compare(admin,server,h,f,'V',f.priv,True)
    compare(admin,server,h,f,'Vb',f.priv,True)
def current_level(admin,server,h,f):
    f.ok(f.s.accorder_derogation(('SUP1',),'INV',[f.o],['voir'],'diagnostic technique','ticket',7))
    compare(admin,server,h,f,'INV',f.o,True,'diagnostic technique')
    f.s.objets[f.o].sensible=True
    compare(admin,server,h,f,'INV',f.o,False,'diagnostic technique')
def non_liftable(admin,server,h,f):
    copy=f.ok(f.s.reutiliser('RS2',f.o,'Q'))
    compare(admin,server,h,f,'RS2',copy,True)
    f.s.objets[f.o].consentement_retire=True
    f.s.objets[f.o].purge=True
    compare(admin,server,h,f,'RS2',copy,False)
def missing_ancestor(admin,server,h,f):
    copy=f.ok(f.s.reutiliser('RS2',f.o,'Q'))
    compare(admin,server,h,f,'RS2',copy,True)
    admin.query('BEGIN; SELECT 1 FROM pt01.authority WHERE id=1 FOR UPDATE; UPDATE pt02_auth.object SET parent=\'absent\' WHERE id='
                +literal(copy)+'; UPDATE pt01.authority SET epoch=epoch+1; COMMIT')
    assert h.request(server,'/rel/RS2/'+copy)['status']==404
def stale_projection(admin,server,h,f):
    f.deleg('RS',('acteur','V'),['voir'],('objet',f.o))
    compare(admin,server,h,f,'V',f.o,True)
    admin.query('UPDATE pt01.authority SET epoch=epoch+1')
    assert h.request(server,'/rel/V/'+f.o)['status']==404
    admin.query('BEGIN; SELECT pt02_auth.compile_projection(); COMMIT')
    assert h.request(server,'/rel/V/'+f.o)['status']==200
def time_projection(admin,server,h,f):
    f.deleg('RS',('acteur','V'),['voir'],('objet',f.o),echeance=3)
    compare(admin,server,h,f,'V',f.o,True)
    admin.query('BEGIN; SELECT 1 FROM pt01.authority WHERE id=1 FOR UPDATE; UPDATE pt02_auth.clock SET day=4; COMMIT')
    assert h.request(server,'/rel/V/'+f.o)['status']==404
def projection_role(admin,server,h,f):
    for sql in ('SELECT pt02_auth.compile_projection()', 'UPDATE pt02_auth.projection_generation SET ready=true'):
        with h.db.Session('pt02_reader') as s:
            try:s.query(sql)
            except h.db.DBError as exc:assert 'permission denied' in str(exc)
            else:raise AssertionError('Rôle technique lecteur modifie la projection')
