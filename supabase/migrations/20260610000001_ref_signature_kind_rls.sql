-- Fix: ref_signature_kind a été créée avec RLS activée (par défaut sur ce projet) mais sans
-- policy de lecture, ce qui fait que l'API (anon/authenticated) reçoit toujours un tableau vide
-- -> le picker "Type" de signature n'affiche aucune proposition et le label reste un uuid.
--
-- On aligne sur le comportement des autres tables de référence (ex: ref_confiance), lisibles
-- publiquement.

alter table public.ref_signature_kind enable row level security;

drop policy if exists "ref_signature_kind_public_read" on public.ref_signature_kind;

create policy "ref_signature_kind_public_read"
on public.ref_signature_kind
for select
to anon, authenticated
using (true);

-- Reprise du backfill confidence_ref : les anciens codes texte (ex: "high") étaient
-- en minuscules alors que ref_confiance utilise des codes en majuscules (ex: "HIGH"),
-- donc le rapprochement exact de la migration précédente n'avait rien trouvé.
update public.ec_transcription_signatures s
set confidence_ref = c.id
from public.ref_confiance c
where s.confidence_ref is null
  and s.confidence is not null
  and upper(c.code) = upper(s.confidence);
