-- Corpus réduit : graphe parenté/protection, pas le moteur V1.6 complet.
CREATE ROLE pt02_reader LOGIN NOSUPERUSER NOBYPASSRLS;
GRANT USAGE ON SCHEMA pt01 TO pt02_reader;
CREATE TABLE pt01.search_fixture(id integer PRIMARY KEY,title text NOT NULL,facet text NOT NULL,
 parent_id integer REFERENCES pt01.search_fixture(id),protected boolean NOT NULL DEFAULT false);
INSERT INTO pt01.search_fixture VALUES(1,'alpha','science',NULL,false),(2,'secret','private',NULL,true),
 (3,'beta','science',NULL,false),(4,'copie_secret','private',2,false);
CREATE FUNCTION pt01.visible_fixture(p_time timestamptz) RETURNS TABLE(id integer,title text,facet text)
LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,pt01 AS $$
 WITH RECURSIVE ancestry AS (
 SELECT id AS target,id,parent_id,protected,ARRAY[id] AS visited FROM pt01.search_fixture
 UNION ALL SELECT a.target,p.id,p.parent_id,p.protected,a.visited||p.id
 FROM ancestry a JOIN pt01.search_fixture p ON p.id=a.parent_id WHERE NOT p.id=ANY(a.visited)
 ) SELECT o.id,o.title,o.facet FROM pt01.search_fixture o
 WHERE session_user='pt02_reader'
 AND EXISTS(SELECT 1 FROM pt01.grant_fixture WHERE object_id=1 AND active AND p_time<expires_at)
 AND NOT EXISTS(SELECT 1 FROM ancestry a WHERE a.target=o.id AND a.protected)
$$;
CREATE FUNCTION pt01.render_fixture(p_id integer,p_offset integer) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pt01 AS $$
DECLARE result json; t timestamptz; deadline timestamptz;
BEGIN
 PERFORM 1 FROM pt01.authority WHERE id=1 FOR SHARE;
 t := clock_timestamp();
 SELECT expires_at INTO deadline FROM pt01.grant_fixture WHERE object_id=1;
 IF p_id IS NOT NULL THEN
  SELECT json_build_object('id',id,'title',title) INTO result FROM pt01.visible_fixture(t) WHERE id=p_id;
  RETURN json_build_object('payload',result,'checked_at',t,'expires_at',deadline);
 END IF;
 SELECT json_build_object('items',(SELECT coalesce(json_agg(x),'[]'::json) FROM
   (SELECT id,title FROM pt01.visible_fixture(t) ORDER BY title,id LIMIT 1 OFFSET p_offset) x),
   'count',(SELECT count(*) FROM pt01.visible_fixture(t)),
   'facets',(SELECT coalesce(json_agg(x),'[]'::json) FROM
      (SELECT facet,count(*) AS count FROM pt01.visible_fixture(t) GROUP BY facet ORDER BY facet) x),
   'suggestions',(SELECT coalesce(json_agg(title ORDER BY title),'[]'::json) FROM pt01.visible_fixture(t))) INTO result;
 RETURN json_build_object('payload',result,'checked_at',t,'expires_at',deadline);
END $$;
REVOKE ALL ON FUNCTION pt01.visible_fixture(timestamptz),pt01.render_fixture(integer,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION pt01.render_fixture(integer,integer) TO pt02_reader;

CREATE TABLE pt01.link_fixture(source integer REFERENCES pt01.search_fixture(id),
 target integer REFERENCES pt01.search_fixture(id),PRIMARY KEY(source,target));
-- Collision cachée réelle, conservée pour les états jumeaux.
INSERT INTO pt01.link_fixture VALUES(1,2);
CREATE FUNCTION pt01.create_link_fixture(p_source integer,p_target integer) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pt01 AS $$
DECLARE t timestamptz; inserted integer;
BEGIN
 PERFORM 1 FROM pt01.authority WHERE id=1 FOR SHARE;
 t:=clock_timestamp();
 -- Même refus avant toute tentative FK/UQ sur des extrémités non admissibles.
 IF NOT EXISTS(SELECT 1 FROM pt01.visible_fixture(t) WHERE id=p_source)
    OR NOT EXISTS(SELECT 1 FROM pt01.visible_fixture(t) WHERE id=p_target) THEN RETURN 'introuvable'; END IF;
 INSERT INTO pt01.link_fixture VALUES(p_source,p_target) ON CONFLICT DO NOTHING;
 GET DIAGNOSTICS inserted=ROW_COUNT;
 -- Contrôle temporel final de la mutation sous gardes, après la préparation.
 t:=clock_timestamp();
 IF NOT EXISTS(SELECT 1 FROM pt01.visible_fixture(t) WHERE id=p_source)
    OR NOT EXISTS(SELECT 1 FROM pt01.visible_fixture(t) WHERE id=p_target) THEN
    RAISE EXCEPTION 'introuvable' USING ERRCODE='42501';
 END IF;
 RETURN CASE WHEN inserted=1 THEN 'cree' ELSE 'conflit_visible' END;
END $$;
REVOKE ALL ON FUNCTION pt01.create_link_fixture(integer,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION pt01.create_link_fixture(integer,integer) TO pt02_reader;
