```md
---
id: z99
title: Zone — Culture générale
theme: culture
questions:
  # 1) QCU — 1 seule bonne réponse — pas de retry
  - id: q1
    type: qcu
    prompt: "Quel est le plus grand océan de la planète ?"
    options: ["Atlantique", "Pacifique", "Indien", "Arctique"]
    answer: "Pacifique"
    points: 10
    penaltyEnabled: false
    penalty: 0
    retry: false

  # 2) QCM — plusieurs bonnes réponses — retry autorisé, pénalité si faux
  - id: q2
    type: qcm
    prompt: "Quels sont des pays d’Europe ?"
    options: ["Portugal", "Maroc", "Suède", "Canada", "Grèce", "Japon"]
    answer: ["Portugal", "Suède", "Grèce"]
    points: 15
    penaltyEnabled: true
    penalty: 5
    retry: true

  # 3) Vrai / Faux — retry autorisé
  - id: q3
    type: truefalse
    prompt: "Le Nil est plus long que l’Amazone."
    answer: true
    points: 10
    penaltyEnabled: false
    penalty: 0
    retry: true

  # 4) Numeric — tolérance 0 — retry autorisé
  - id: q4
    type: numeric
    prompt: "Combien y a-t-il de continents sur Terre (modèle 7 continents) ?"
    answer: 7
    tolerance: 0
    points: 10
    penaltyEnabled: false
    penalty: 0
    retry: true

  # 5) Short — mode normalized — retry autorisé
  - id: q5
    type: short
    prompt: "Quel est le nom de la planète la plus proche du Soleil ?"
    answer: "Mercure"
    mode: normalized
    points: 10
    penaltyEnabled: false
    penalty: 0
    retry: true

  # 6) Fill — mode normalized — pas de retry
  - id: q6
    type: fill
    prompt: "Complète : L’eau bout à ________ °C au niveau de la mer."
    answer: "100"
    mode: normalized
    points: 10
    penaltyEnabled: false
    penalty: 0
    retry: false

  # 7) QCU — retry autorisé, pénalité si faux
  - id: q7
    type: qcu
    prompt: "Qui a peint la Joconde ?"
    options: ["Vincent van Gogh", "Pablo Picasso", "Léonard de Vinci", "Claude Monet"]
    answer: "Léonard de Vinci"
    points: 10
    penaltyEnabled: true
    penalty: 3
    retry: true

  # 8) QCM — pas de retry
  - id: q8
    type: qcm
    prompt: "Quels sont des mammifères ?"
    options: ["Dauphin", "Tortue", "Chauve-souris", "Crocodile", "Baleine", "Grenouille"]
    answer: ["Dauphin", "Chauve-souris", "Baleine"]
    points: 15
    penaltyEnabled: false
    penalty: 0
    retry: false

  # 9) True/False — pas de retry
  - id: q9
    type: truefalse
    prompt: "La Tour Eiffel se trouve à Londres."
    answer: false
    points: 5
    penaltyEnabled: false
    penalty: 0
    retry: false

  # 10) Numeric — petite tolérance — pas de retry
  - id: q10
    type: numeric
    prompt: "En quelle année l’homme a-t-il marché pour la première fois sur la Lune ? (± 1 an)"
    answer: 1969
    tolerance: 1
    points: 10
    penaltyEnabled: false
    penalty: 0
    retry: false

  # 11) Short — mode exact — pas de retry
  - id: q11
    type: short
    prompt: "Réponds exactement : écris le symbole chimique de l’or."
    answer: "Au"
    mode: exact
    points: 5
    penaltyEnabled: false
    penalty: 0
    retry: false

  # 12) Fill — mode normalized — retry autorisé
  - id: q12
    type: fill
    prompt: "Complète : La capitale de l’Espagne est ________."
    answer: "Madrid"
    mode: normalized
    points: 10
    penaltyEnabled: false
    penalty: 0
    retry: true

  # 13) Photo — pas de retry
  - id: q13
    type: photo
    prompt: "Prends en photo un objet qui affiche l’heure (montre, horloge, téléphone…)."
    points: 15
    retry: false
    upload:
      bucket: connect-public
      folder: "answers"
    consentText: "Nous acceptons que cette photo soit utilisée par l’organisateur (retour en images)."

  # 14) Photo — tier (bonus selon niveau) + note
  - id: q14
    type: photo
    prompt: "Photo défi : montre 1, 2 ou 3 choses 'rondes' dans la même photo."
    points: 0
    retry: false
    upload:
      bucket: connect-public
      folder: "answers"
    tier:
      label: "Combien d’objets ronds visibles ?"
      options:
        - value: 1
          label: "1 objet rond"
          points: 10
        - value: 2
          label: "2 objets ronds"
          points: 20
        - value: 3
          label: "3 objets ronds"
          points: 35
    note:
      enabled: true
      placeholder: "Optionnel : liste les objets (ex: ballon, assiette, pièce)"
    consentText: "Nous acceptons l’utilisation de cette photo par l’organisateur."

  # 15) QCU — pas de retry
  - id: q15
    type: qcu
    prompt: "Quel est l’organe principal de la respiration chez l’être humain ?"
    options: ["Foie", "Cœur", "Poumons", "Reins"]
    answer: "Poumons"
    points: 10
    penaltyEnabled: false
    penalty: 0
    retry: false

---
Bienvenue dans la zone Culture générale. Lisez bien chaque consigne.

Dans cette zone, vous allez répondre à plusieurs types de questions.
Certaines autorisent une deuxième tentative, d’autres non.
```
