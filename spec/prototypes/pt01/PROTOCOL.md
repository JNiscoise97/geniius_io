# PT01 — Protocole temporel ratifié

Le Core possède la transaction et le rôle technique `pt01_writer`. Le demandeur HTTP ne possède pas de session SQL. Le runner Python représente ce Core ; les scénarios inspectent ses résultats internes provisoires.

Pour une commande isolée, le runner envoie BEGIN, write_fixture, finalize_fixture puis COMMIT. Pour les ordonnancements concurrents, BEGIN et les mutations peuvent être séparés ; le runner ajoute le contrôle final comme dernière instruction métier devant COMMIT. Aucun succès ne doit être communiqué au demandeur avant confirmation du commit. Le marqueur de fin de requête n'est lu qu'après le bloc SQL complet ; une erreur de finalisation fait échouer l'appel et annule la transaction.

write_fixture acquiert une garde d'autorité partagée puis une garde d'objet, vérifie l'accès initial et prépare atomiquement les effets. finalize_fixture utilise un nouvel instant serveur commun aux versions de la transaction et contrôle leurs fondements sous les gardes conservées. Le certificat est écrit dans la même transaction. Le trigger différé ne décide plus l'instant temporel : il refuse un commit dépourvu de certificat. SET CONSTRAINTS avant finalisation échoue. Aucun ajout de mutation métier n'est admis après finalisation par le protocole Core ; ce rôle SQL est de confiance.

La révocation prend une garde exclusive jusqu'au commit. Une échéance après contrôle final n'annule pas rétroactivement la mutation, conformément à DC-AUTH-01 ; une nouvelle lecture ou opération réévalue son accès actuel. Après abandon, le certificat et tous les effets disparaissent. Une reprise recommence la transaction et l'autorisation.

PT01-12 injecte une pause entre finalisation et commit : contournement de l'autofinalisation Python réservé au test, pas interface client. Le test constate l'absence de visibilité préalable, la conservation de la garde face à la révocation et la chronologie serveur. Les contre-exemples de l'ancienne borne physique restent archivés.

Limites : rôle technique compromis, API HTTP, non-divulgation temporelle, famine, topologie multi-hôte, MLD complet et moteur d'autorisation V1.6 non couverts. Une mise en production doit implémenter et éprouver ce protocole dans le Core réel.
