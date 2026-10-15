-- Traduction relationnelle de lecture ciblée, pas le MPD complet.
CREATE SCHEMA pt02_auth;
GRANT USAGE ON SCHEMA pt02_auth TO pt02_reader;
CREATE TABLE pt02_auth.clock(id integer PRIMARY KEY,day integer NOT NULL);
CREATE TABLE pt02_auth.actor(id text PRIMARY KEY,person text NOT NULL,active boolean,verified boolean,authority boolean);
CREATE TABLE pt02_auth.object(id text PRIMARY KEY,space text,title text,owner text,parent text,purged boolean,non_liftable boolean,sensitive boolean);
CREATE TABLE pt02_auth.hab(id text PRIMARY KEY,nature text,kind text,author text,beneficiary_kind text,
 beneficiary text,scope_kind text,scope text,role text,active boolean,deadline integer,reshare boolean,actions text[],exclusions text[]);
CREATE TABLE pt02_auth.founder(hab text REFERENCES pt02_auth.hab(id),actor text REFERENCES pt02_auth.actor(id),deadline integer,PRIMARY KEY(hab,actor));
CREATE TABLE pt02_auth.member(group_id text,actor text REFERENCES pt02_auth.actor(id),PRIMARY KEY(group_id,actor));
CREATE TABLE pt02_auth.admission(id text PRIMARY KEY,hab text REFERENCES pt02_auth.hab(id),actor text,admitter text,nature text,active boolean,automatic boolean,exclusions text[]);
CREATE TABLE pt02_auth.protection(id text PRIMARY KEY,target text REFERENCES pt02_auth.object(id),kind text,active boolean,deadline integer,allowed text[],recipients text[],actions text[]);
CREATE TABLE pt02_auth.derogation(id text PRIMARY KEY,beneficiary text,targets text[],operations text[],purpose text,active boolean,start_day integer,end_day integer,approvers text[]);

CREATE FUNCTION pt02_auth.same_person(a text,b text) RETURNS boolean
LANGUAGE sql SET search_path=pg_catalog,pt02_auth AS $$
 SELECT EXISTS(SELECT 1 FROM pt02_auth.actor x JOIN pt02_auth.actor y ON x.person=y.person WHERE x.id=a AND y.id=b)
$$;
CREATE FUNCTION pt02_auth.right_see(a text,o_id text,t integer,seen text[] DEFAULT ARRAY[]::text[],need_reshare boolean DEFAULT false)
RETURNS boolean LANGUAGE plpgsql SET search_path=pg_catalog,pt02_auth AS $$
DECLARE o pt02_auth.object%ROWTYPE; h pt02_auth.hab%ROWTYPE; f record; admitted boolean;
BEGIN
 IF cardinality(seen)>16 OR NOT EXISTS(SELECT 1 FROM pt02_auth.actor WHERE id=a AND active) THEN RETURN false; END IF;
 SELECT * INTO o FROM pt02_auth.object WHERE id=o_id;
 IF NOT FOUND OR o.purged THEN RETURN false; END IF;
 IF EXISTS(WITH RECURSIVE ancestors AS (
   SELECT id,parent,ARRAY[id] AS visited FROM pt02_auth.object WHERE id=o_id
   UNION ALL SELECT x.id,x.parent,z.visited||x.id FROM ancestors z
    JOIN pt02_auth.object x ON x.id=z.parent WHERE NOT x.id=ANY(z.visited)
 ) SELECT 1 FROM ancestors WHERE parent IS NOT NULL AND
   (parent=ANY(visited) OR NOT EXISTS(SELECT 1 FROM pt02_auth.object WHERE id=ancestors.parent))) THEN RETURN false; END IF;
 IF o.owner IS NOT NULL AND pt02_auth.same_person(a,o.owner) THEN RETURN true; END IF;
 FOR h IN SELECT * FROM pt02_auth.hab WHERE active AND (deadline IS NULL OR t<deadline) AND NOT id=ANY(seen) LOOP
  IF NOT ((h.scope_kind='objet' AND h.scope=o_id) OR (h.scope_kind='contenu' AND h.scope=o.space AND o.owner IS NULL)) OR o_id=ANY(h.exclusions) THEN CONTINUE; END IF;
  IF h.kind='appartenance' THEN
   IF o.owner IS NULL AND pt02_auth.same_person(a,h.beneficiary) AND h.role IN ('RS','collaborateur','lecteur')
      AND (NOT need_reshare OR h.role='RS') THEN RETURN true; END IF;
   CONTINUE;
  END IF;
  IF NOT 'voir'=ANY(h.actions) OR (need_reshare AND NOT h.reshare) THEN CONTINUE; END IF;
  admitted:=h.beneficiary_kind='acteur' AND pt02_auth.same_person(a,h.beneficiary);
  IF h.beneficiary_kind='groupe' AND NOT pt02_auth.same_person(a,h.author) THEN
   admitted:=EXISTS(SELECT 1 FROM pt02_auth.member m JOIN pt02_auth.admission d ON d.hab=h.id
     WHERE m.group_id=h.beneficiary AND pt02_auth.same_person(m.actor,a) AND pt02_auth.same_person(d.actor,a)
       AND d.active AND NOT o_id=ANY(d.exclusions) AND (NOT d.automatic OR NOT o.sensitive)
       AND (d.nature='HI' OR (NOT d.automatic AND pt02_auth.right_see(d.admitter,o_id,t,seen||h.id,true))));
  END IF;
  IF NOT admitted THEN CONTINUE; END IF;
  IF h.nature='HI' AND o.owner IS NULL THEN RETURN true; END IF;
  IF h.nature='HP' THEN
   FOR f IN SELECT * FROM pt02_auth.founder WHERE hab=h.id AND (deadline IS NULL OR t<deadline) LOOP
    IF pt02_auth.right_see(f.actor,o_id,t,seen||h.id,true) THEN RETURN true; END IF;
   END LOOP;
  END IF;
 END LOOP;
 RETURN false;
END $$;
CREATE FUNCTION pt02_auth.allowed(a text,o_id text,p_purpose text,t integer) RETURNS boolean
LANGUAGE plpgsql SET search_path=pg_catalog,pt02_auth AS $$
DECLARE o pt02_auth.object%ROWTYPE; p record; d record; approvers_ok boolean;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pt02_auth.actor WHERE id=a AND active) THEN RETURN false; END IF;
 SELECT * INTO o FROM pt02_auth.object WHERE id=o_id;
 IF NOT FOUND OR o.purged THEN RETURN false; END IF;
 -- Non-levables de tous les ascendants, purgés compris.
 IF EXISTS(WITH RECURSIVE ancestors AS (
   SELECT id,parent,non_liftable,ARRAY[id] AS visited FROM pt02_auth.object WHERE id=o_id
   UNION ALL SELECT x.id,x.parent,x.non_liftable,z.visited||x.id FROM ancestors z
    JOIN pt02_auth.object x ON x.id=z.parent WHERE NOT x.id=ANY(z.visited)
 ) SELECT 1 FROM ancestors WHERE non_liftable) THEN RETURN false; END IF;
 -- Ce corpus de dérogation est limité aux cibles sans protection interne.
 IF NOT EXISTS(SELECT 1 FROM pt02_auth.protection WHERE target=o_id AND active AND (deadline IS NULL OR t<deadline)) THEN
  FOR d IN SELECT * FROM pt02_auth.derogation WHERE active AND beneficiary=a AND o_id=ANY(targets)
   AND 'voir'=ANY(operations) AND purpose=p_purpose AND start_day<=t AND t<end_day LOOP
   SELECT cardinality(d.approvers)>=CASE WHEN o.owner IS NOT NULL OR o.sensitive OR d.purpose NOT IN ('diagnostic technique','vérification d’intégrité') THEN 2 ELSE 1 END
     AND cardinality(d.approvers)=(SELECT count(DISTINCT person) FROM pt02_auth.actor WHERE id=ANY(d.approvers))
     AND NOT EXISTS(SELECT 1 FROM unnest(d.approvers) x
     WHERE NOT EXISTS(SELECT 1 FROM pt02_auth.actor WHERE id=x AND verified)
       OR pt02_auth.same_person(x,a) OR pt02_auth.same_person(x,o.owner)) INTO approvers_ok;
   IF approvers_ok THEN RETURN true; END IF;
  END LOOP;
 END IF;
 FOR p IN SELECT * FROM pt02_auth.protection WHERE target=o_id AND active AND (deadline IS NULL OR t<deadline) LOOP
  IF p.kind IN ('embargo_existence','embargo_contenu') AND NOT EXISTS(SELECT 1 FROM unnest(p.allowed) x WHERE pt02_auth.same_person(x,a)) THEN RETURN false; END IF;
  IF p.kind='interdiction_existence' AND EXISTS(SELECT 1 FROM unnest(p.recipients) x WHERE pt02_auth.same_person(x,a)) THEN RETURN false; END IF;
  IF p.kind='interdiction_action' AND 'voir'=ANY(p.actions) AND EXISTS(SELECT 1 FROM unnest(p.recipients) x WHERE pt02_auth.same_person(x,a)) THEN RETURN false; END IF;
 END LOOP;
 RETURN pt02_auth.right_see(a,o_id,t);
END $$;
CREATE FUNCTION pt02_auth.render(a text,o_id text,purpose text) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pt02_auth AS $$
DECLARE result json; t integer;
BEGIN
 IF session_user<>'pt02_reader' THEN RETURN NULL; END IF;
 PERFORM 1 FROM pt01.authority WHERE id=1 FOR SHARE;
 SELECT day INTO t FROM pt02_auth.clock WHERE id=1;
 IF t IS NULL THEN RETURN NULL; END IF;
 IF pt02_auth.allowed(a,o_id,purpose,t) THEN
  SELECT json_build_object('id',id,'title',title) INTO result FROM pt02_auth.object WHERE id=o_id;
 END IF;
 RETURN result;
END $$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA pt02_auth FROM PUBLIC;
GRANT EXECUTE ON FUNCTION pt02_auth.render(text,text,text) TO pt02_reader;

-- Projection compilée uniquement depuis le calcul SQL, jamais depuis l'oracle Python.
CREATE TABLE pt02_auth.projection(actor text,object_id text,purpose text NOT NULL,PRIMARY KEY(actor,object_id,purpose));
CREATE TABLE pt02_auth.projection_generation(id integer PRIMARY KEY,epoch bigint,day integer,ready boolean);
CREATE FUNCTION pt02_auth.compile_projection() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pt02_auth AS $$
DECLARE t integer; e bigint;
BEGIN
 PERFORM 1 FROM pt01.authority WHERE id=1 FOR UPDATE;
 SELECT day INTO t FROM pt02_auth.clock WHERE id=1;
 SELECT epoch INTO e FROM pt01.authority WHERE id=1;
 TRUNCATE pt02_auth.projection,pt02_auth.projection_generation;
 IF t IS NULL THEN RETURN; END IF;
 INSERT INTO pt02_auth.projection
 SELECT a.id,o.id,p.purpose FROM pt02_auth.actor a CROSS JOIN pt02_auth.object o
 CROSS JOIN (SELECT ''::text AS purpose UNION SELECT DISTINCT purpose FROM pt02_auth.derogation) p
 WHERE pt02_auth.allowed(a.id,o.id,NULLIF(p.purpose,''),t);
 INSERT INTO pt02_auth.projection_generation VALUES(1,e,t,true);
END $$;
REVOKE ALL ON FUNCTION pt02_auth.compile_projection() FROM PUBLIC;
CREATE OR REPLACE FUNCTION pt02_auth.render(a text,o_id text,purpose text) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pt02_auth AS $$
DECLARE result json; t integer; e bigint;
BEGIN
 IF session_user<>'pt02_reader' THEN RETURN NULL; END IF;
 SELECT epoch INTO e FROM pt01.authority WHERE id=1 FOR SHARE;
 SELECT day INTO t FROM pt02_auth.clock WHERE id=1;
 IF NOT EXISTS(SELECT 1 FROM pt02_auth.projection_generation WHERE id=1 AND ready AND epoch=e AND day=t) THEN RETURN NULL; END IF;
 -- Un refus consulte uniquement la clé admissible : pas le contenu/fondements de la cible cachée.
 IF EXISTS(SELECT 1 FROM pt02_auth.projection p WHERE p.actor=a AND p.object_id=o_id AND p.purpose=coalesce(render.purpose,'')) THEN
  SELECT json_build_object('id',id,'title',title) INTO result FROM pt02_auth.object WHERE id=o_id AND NOT purged;
 END IF;
 RETURN result;
END $$;
