-- Édition et ajout manuel d'assertions (2026-08-09), sur demande explicite :
-- une assertion générée par l'IA doit pouvoir être corrigée plutôt que
-- seulement validée/rejetée, et l'utilisateur doit pouvoir ajouter un fait
-- que l'extraction a manqué. Les deux cas produisent une assertion dont le
-- contenu est directement écrit/corrigé par un humain — origin les
-- distingue des assertions encore telles que l'IA les a produites.
--
-- Une assertion éditée bascule sur origin='manual' (le contenu affiché
-- n'est plus ce que l'IA a dit, mais ce que l'humain a corrigé) ET
-- status='validated' (éditer, c'est déjà valider le contenu qu'on vient
-- d'écrire soi-même) — voir extraction.service.ts, updateAssertion().

alter table rebond.transcription_assertions
  add column if not exists origin text not null default 'ai';

alter table rebond.transcription_assertions
  add constraint chk_transcription_assertions_origin check (origin in ('ai', 'manual'));

comment on column rebond.transcription_assertions.origin is
  '''ai'' = produite par l''extraction IA, jamais modifiée depuis. ''manual'' = ajoutée ou corrigée directement par un humain (contenu qui ne vient plus tel quel de la réponse du modèle).';
