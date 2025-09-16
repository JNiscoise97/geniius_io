select *
from v_acteurs_enrichis
where role = 'mention'
and lien is null
and note is null