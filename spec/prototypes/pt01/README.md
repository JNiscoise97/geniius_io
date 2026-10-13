# PT01 — Écritures et révocations concurrentes

Banc PostgreSQL réel, corpus synthétique isolé. Python standard sur l’hôte ; `psql` dans le conteneur ; aucun pilote Python à installer. Docker Desktop doit être démarré. L’image `postgres:18` est téléchargée puis son identifiant exact est consigné ; la version majeure n’est pas une sélection de pile de production.

Exécuter depuis la racine : `python spec/prototypes/pt01/run.py`. La variante `--image postgres:18-alpine` est aussi admise ; l’image exacte est consignée dans les résultats. Le runner crée un conteneur de nom unique, sans port publié, réseau externe désactivé et sans montage de fichiers hôte ; seules des données synthétiques sont copiées dans le conteneur. Mémoire plafonnée à 512 Mio et CPU à une unité pour ce banc, pas pour la production. Les rôles synthétiques se connectent par socket interne ; l’authentification de production n’est pas simulée. Le conteneur créé par ce runner est retiré en fin d’exécution ; aucune autre instance n’est supprimée.

Résultats : `docs/architecture/prototypes/PT01_RESULTATS.json` et rapport associé. Les ordonnancements utilisent plusieurs processus `psql` et le constat de verrous PostgreSQL, pas seulement une attente chronométrée supposée démontrer un conflit.

Portée réduite : autorisation binaire par objet, époque globale, version/activité/dépendance directe/outbox/reçu. Ce n’est pas le MLD complet, pas tout V1.6 et pas une API de production. Une vérification différée d’expiration précède le commit PostgreSQL mais ne prouve pas à elle seule la borne temporelle jusqu’à écriture WAL/visibilité effective. Ce point doit être qualifié au verdict SEC-01. Les erreurs/délais de non-divulgation, les flux HTTP et la famine relèvent des autres prototypes/preuves.
