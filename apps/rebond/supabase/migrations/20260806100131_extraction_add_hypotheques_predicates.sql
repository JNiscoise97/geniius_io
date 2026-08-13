-- Extension du référentiel de prédicats Extraction pour couvrir les actes
-- hypothécaires/notariés (vente, succession) — 2026-08-10, après avis
-- explicitement demandé et tranché : PAS de module hypotheques_assertions
-- séparé (voir mémoire agent project_extraction_module) — on étend le même
-- référentiel unique, exactement comme entity_type a déjà été étendu 3 fois
-- (person -> document -> place -> event) au fil des besoins réels. Strictement
-- additif : aucune ligne existante modifiée, zéro impact sur l'état civil
-- (un acte d'état civil n'utilisera jamais ces nouveaux codes).
--
-- Choix délibérément PAS ajoutés maintenant (doctrine "ne pas figer le
-- référentiel avant volume réel", un seul acte testé à ce stade) : bornage
-- (nord/sud/est/ouest — un seul "boundary" plutôt que 4 codes directionnels,
-- direction encodée dans value_text), statut hypothécaire de l'immeuble,
-- mandat/procuration, autorisation administrative spécifique (ex. décision
-- du Gouverneur) — tous couverts par "other"+raw_relation pour ce premier
-- passage, à promouvoir en prédicats dédiés seulement si le besoin se
-- confirme sur plusieurs actes.
--
-- seller/buyer/deceased/heir/usufructuary/sale_price rejoignent la couche
-- event_relations existante (subject = event, comme actor/before_person/
-- presented_person/present_at) : une vente ou une succession a plusieurs
-- rôles à relier entre eux, exactement le cas d'usage déjà couvert par la
-- doctrine event ("à utiliser avec parcimonie... action avec plusieurs
-- rôles distincts à relier").

insert into rebond.ref_assertion_predicates (code, label, ordre) values
  -- Faits stables sur une personne
  ('marital_regime', 'Régime matrimonial', 60),
  ('area', 'Superficie (d''un lieu/bien)', 61),
  ('boundary', 'Limite / bornage (d''un lieu/bien)', 62),
  -- Relations d'événement (subject = event)
  ('seller', 'Vendeur (dans une vente)', 63),
  ('buyer', 'Acheteur (dans une vente)', 64),
  ('deceased', 'Défunt (dans une succession)', 65),
  ('heir', 'Héritier (dans une succession)', 66),
  ('usufructuary', 'Usufruitier', 67),
  ('sale_price', 'Prix de vente', 68),
  -- Caractéristiques du document/contexte (subject = document)
  ('registration_date', 'Date d''enregistrement', 69),
  ('registration_place', 'Lieu d''enregistrement', 70),
  ('registration_volume', 'Volume d''enregistrement', 71),
  ('registration_folio', 'Folio d''enregistrement', 72),
  ('registration_number', 'Numéro d''enregistrement', 73)
on conflict (code) do nothing;
