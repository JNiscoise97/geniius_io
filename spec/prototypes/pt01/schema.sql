-- PT01 : schéma synthétique réduit, pas le MPD GENIIUS ni tout V1.6.
CREATE ROLE pt01_writer LOGIN NOSUPERUSER NOBYPASSRLS;
CREATE ROLE pt01_revoker LOGIN NOSUPERUSER NOBYPASSRLS;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
CREATE SCHEMA pt01;
REVOKE ALL ON SCHEMA pt01 FROM PUBLIC;
GRANT USAGE ON SCHEMA pt01 TO pt01_writer, pt01_revoker;
CREATE TABLE pt01.authority(id integer PRIMARY KEY CHECK(id=1), epoch bigint NOT NULL);
INSERT INTO pt01.authority VALUES (1,1);
CREATE TABLE pt01.grant_fixture(object_id integer PRIMARY KEY, active boolean NOT NULL, expires_at timestamptz NOT NULL);
CREATE TABLE pt01.object_fixture(id integer PRIMARY KEY, version integer NOT NULL, value text NOT NULL);
CREATE TABLE pt01.version_fixture(object_id integer NOT NULL, version integer NOT NULL, value text NOT NULL,
 command_id text NOT NULL UNIQUE, epoch bigint NOT NULL, validation_time timestamptz NOT NULL, PRIMARY KEY(object_id,version));
CREATE TABLE pt01.activity_fixture(command_id text PRIMARY KEY, actor text NOT NULL, object_id integer NOT NULL);
CREATE TABLE pt01.dependency_fixture(amont integer NOT NULL, aval integer NOT NULL, impacted boolean NOT NULL DEFAULT false, PRIMARY KEY(amont,aval));
CREATE TABLE pt01.outbox_fixture(command_id text PRIMARY KEY, kind text NOT NULL);
CREATE TABLE pt01.receipt_fixture(command_id text PRIMARY KEY, object_id integer NOT NULL, expected_version integer NOT NULL, value text NOT NULL);
CREATE TABLE pt01.final_check_fixture(command_id text PRIMARY KEY, checked_at timestamptz NOT NULL);
INSERT INTO pt01.object_fixture VALUES(1,0,'initial'),(2,0,'independent');
INSERT INTO pt01.grant_fixture VALUES(1,true,'infinity'),(2,true,'infinity');
INSERT INTO pt01.dependency_fixture VALUES(1,2,false);

CREATE FUNCTION pt01.write_fixture(p_object integer,p_expected integer,p_value text,p_command text) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pt01 AS $$
DECLARE e bigint; v integer; r pt01.receipt_fixture%ROWTYPE; t timestamptz;
BEGIN
 IF session_user <> 'pt01_writer' THEN RETURN 'introuvable'; END IF;
 -- La garde précède les lectures d'autorité ; READ COMMITTED est imposé par le runner.
 SELECT epoch INTO e FROM pt01.authority WHERE id=1 FOR SHARE;
 t := clock_timestamp();
 IF NOT EXISTS(SELECT 1 FROM pt01.grant_fixture g JOIN pt01.object_fixture o ON o.id=g.object_id
   WHERE g.object_id=p_object AND g.active AND t<g.expires_at) THEN RETURN 'introuvable'; END IF;
 SELECT version INTO v FROM pt01.object_fixture WHERE id=p_object FOR UPDATE;
 SELECT * INTO r FROM pt01.receipt_fixture WHERE command_id=p_command;
 IF FOUND THEN
   IF r.object_id=p_object AND r.expected_version=p_expected AND r.value=p_value THEN RETURN 'deja_integre'; END IF;
   RETURN 'conflit_commande';
 END IF;
 IF v<>p_expected THEN RETURN 'conflit_version'; END IF;
 INSERT INTO pt01.activity_fixture VALUES(p_command,session_user,p_object);
 INSERT INTO pt01.version_fixture VALUES(p_object,v+1,p_value,p_command,e,t);
 UPDATE pt01.object_fixture SET version=v+1,value=p_value WHERE id=p_object;
 UPDATE pt01.dependency_fixture SET impacted=true WHERE amont=p_object;
 INSERT INTO pt01.outbox_fixture VALUES(p_command,'propagation');
 INSERT INTO pt01.receipt_fixture VALUES(p_command,p_object,p_expected,p_value);
 RETURN 'integre';
END $$;

CREATE FUNCTION pt01.revoke_fixture(p_object integer) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pt01 AS $$
DECLARE e bigint;
BEGIN
 IF session_user<>'pt01_revoker' THEN RAISE EXCEPTION 'introuvable' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM pt01.authority WHERE id=1 FOR UPDATE;
 UPDATE pt01.grant_fixture SET active=false WHERE object_id=p_object;
 UPDATE pt01.authority SET epoch=epoch+1 WHERE id=1 RETURNING epoch INTO e;
 RETURN e;
END $$;

CREATE FUNCTION pt01.current_view(p_object integer) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pt01 AS $$
DECLARE result text;
BEGIN
 IF session_user<>'pt01_writer' THEN RETURN 'introuvable'; END IF;
 PERFORM 1 FROM pt01.authority WHERE id=1 FOR SHARE;
 SELECT o.value INTO result FROM pt01.object_fixture o JOIN pt01.grant_fixture g ON g.object_id=o.id
 WHERE o.id=p_object AND g.active AND clock_timestamp()<g.expires_at;
 RETURN coalesce(result,'introuvable');
END $$;

CREATE FUNCTION pt01.check_at_commit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pt01 AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pt01.final_check_fixture WHERE command_id=NEW.command_id) THEN
   RAISE EXCEPTION 'introuvable' USING ERRCODE='42501';
 END IF;
 RETURN NULL;
END $$;
-- Le Core appelle cette dernière instruction métier avant COMMIT.
-- Le rôle SQL est celui du Core de confiance, jamais celui du demandeur HTTP.
CREATE FUNCTION pt01.finalize_fixture() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pt01 AS $$
DECLARE t timestamptz := clock_timestamp();
BEGIN
 IF session_user <> 'pt01_writer' THEN RAISE EXCEPTION 'introuvable' USING ERRCODE='42501'; END IF;
 IF EXISTS(SELECT 1 FROM pt01.version_fixture v JOIN pt01.grant_fixture g ON g.object_id=v.object_id
   WHERE v.xmin=pg_current_xact_id()::text::xid AND (NOT g.active OR t>=g.expires_at)) THEN
   RAISE EXCEPTION 'introuvable' USING ERRCODE='42501';
 END IF;
 INSERT INTO pt01.final_check_fixture
 SELECT command_id,t FROM pt01.version_fixture WHERE xmin=pg_current_xact_id()::text::xid
 ON CONFLICT(command_id) DO UPDATE SET checked_at=EXCLUDED.checked_at;
END $$;
CREATE CONSTRAINT TRIGGER current_grant_before_commit AFTER INSERT ON pt01.version_fixture
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION pt01.check_at_commit();
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA pt01 FROM PUBLIC;
GRANT EXECUTE ON FUNCTION pt01.write_fixture(integer,integer,text,text),pt01.current_view(integer) TO pt01_writer;
GRANT EXECUTE ON FUNCTION pt01.finalize_fixture() TO pt01_writer;
GRANT EXECUTE ON FUNCTION pt01.revoke_fixture(integer) TO pt01_revoker;
