-- Bucket de stockage pour le filet de sécurité de la dictée vocale :
-- l'enregistrement audio complet d'une session (webm), uploadé uniquement à
-- l'arrêt explicite de la dictée. Chemin : {exemplaireId}/{transcriptionId}/{sessionId}.webm
--
-- Policy ouverte anon, cohérente avec la posture déjà assumée sur le reste du
-- schéma rebond (pas une décision de sécurité prise ici) — pas le modèle
-- auth.uid()/propriétaire utilisé par le bucket de l'app tree.

insert into storage.buckets (id, name, public)
values ('rebond-dictation-audio', 'rebond-dictation-audio', false)
on conflict (id) do nothing;

drop policy if exists "rebond_dictation_audio_public_all" on storage.objects;
create policy "rebond_dictation_audio_public_all" on storage.objects
  for all
  to anon, authenticated
  using (bucket_id = 'rebond-dictation-audio')
  with check (bucket_id = 'rebond-dictation-audio');
