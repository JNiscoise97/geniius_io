"""Campagne préspécifiée : même URL sur deux états métier jumeaux."""
from concurrent.futures import ThreadPoolExecutor
import json
import random
import statistics
from pathlib import Path
from types import SimpleNamespace
from outils import jumeau_sans
import relational_probe
from statistics_probe import percentile

def exercise(admin,server,h):
    plan=json.loads(Path(__file__).with_name('nf10_campaign.json').read_text(encoding='utf-8'))
    h.event('manifeste_campagne',version=plan['version'],plan=plan)
    for family in plan['familles']:
        f=h.build_model()
        if family=='personnel_cache':actor='LEC';target=f.priv
        elif family=='hp_rompue':
            base=f.deleg('TIT',('acteur','V'),['voir'],('objet',f.priv),repartager=True)
            f.deleg('V',('acteur','W'),['voir'],('objet',f.priv))
            f.ok(f.s.clore('TIT',base));actor='W';target=f.priv
        else:
            target=f.ok(f.s.reutiliser('RS2',f.o,'Q'))
            f.ok(f.s.creer_protection('RS','embargo_existence',f.o));actor='RS2'
        twin=SimpleNamespace(s=jumeau_sans(f.s,target))
        assert not f.s.acces(actor,target,'voir').ok and not twin.s.acces(actor,target,'voir').ok
        path='/rel/'+actor+'/'+target
        for concurrency in plan['concurrences']:
            samples=[]
            rng=random.Random(plan['seed']+concurrency)
            with ThreadPoolExecutor(max_workers=concurrency) as pool:
                for first in range(0,plan['paires_par_famille_et_palier'],concurrency):
                    worlds=['hidden','absent'];rng.shuffle(worlds)
                    observations={}
                    for world in worlds:
                        relational_probe.load(admin,f if world=='hidden' else twin)
                        h.event('etat_jumeau_installe',family=family,world=world,first=first,concurrency=concurrency)
                        observations[world]=list(pool.map(lambda _:h.request(server,path),range(concurrency)))
                    for offset in range(concurrency):
                        hidden=observations['hidden'][offset];absent=observations['absent'][offset]
                        assert hidden['status']==absent['status']==404
                        assert hidden['headers']==absent['headers'] and hidden['body']==absent['body']
                        samples.append({'index':first+offset,'hidden_ms':hidden['duration_ns']/1e6,'absent_ms':absent['duration_ns']/1e6})
            train=samples[:plan['paires_apprentissage']];test=samples[plan['paires_apprentissage']:]
            hm=statistics.median(x['hidden_ms'] for x in train);am=statistics.median(x['absent_ms'] for x in train)
            threshold=(hm+am)/2;direction=hm>=am
            correct=sum(((x['hidden_ms']>=threshold)==direction)+((x['absent_ms']>=threshold)!=direction) for x in test)
            diffs=[x['hidden_ms']-x['absent_ms'] for x in samples];observed=abs(statistics.mean(diffs))
            rng=random.Random(plan['seed']+concurrency)
            exceed=sum(abs(statistics.mean(d*(1 if rng.getrandbits(1) else -1) for d in diffs))>=observed for _ in range(plan['permutations']))
            result={'family':family,'concurrency':concurrency,'pairs':len(samples),'samples':samples,
                    'hidden_median_ms':statistics.median(x['hidden_ms'] for x in samples),
                    'absent_median_ms':statistics.median(x['absent_ms'] for x in samples),
                    'hidden_p95_ms':percentile([x['hidden_ms'] for x in samples],.95),
                    'absent_p95_ms':percentile([x['absent_ms'] for x in samples],.95),
                    'permutation_p_exploratory':(exceed+1)/(plan['permutations']+1),
                    'classifier_correct':correct,'classifier_test_observations':2*len(test),
                    'classifier_accuracy':correct/(2*len(test)),'NF10_conforme':False}
            h.event('diagnostic_jumeaux',result=result)
