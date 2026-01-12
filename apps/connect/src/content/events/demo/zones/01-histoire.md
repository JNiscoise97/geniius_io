---
id: z01
title: Zone 1 — Histoire
theme: histoire
questions:
  # QCU (1 seule bonne réponse) — pas de retry
  - id: q1
    type: qcu
    prompt: "En quelle année a lieu l’abolition de l’esclavage (décret) ?"
    options: ["1848", "1804", "1789", "1914"]
    answer: "1848"
    points: 10
    penaltyEnabled: false
    penalty: 0
    retry: false

  # QCM (plusieurs réponses) — retry autorisé, + petite pénalité si faux
  - id: q2
    type: qcm
    prompt: "Sélectionne les couleurs possibles pour une équipe."
    options: ["rouge", "vert", "blanc", "bleu", "jaune", "violet"]
    answer: ["rouge", "vert", "blanc", "bleu", "jaune"]
    points: 15
    penaltyEnabled: true
    penalty: 5
    retry: true

  # Vrai / Faux — retry autorisé
  - id: q3
    type: truefalse
    prompt: "La Réunion apprend l’abolition immédiatement en avril 1848."
    answer: false
    points: 10
    penaltyEnabled: false
    penalty: 0
    retry: true

  # Numeric — retry autorisé (tolérance 0)
  - id: q4
    type: numeric
    prompt: "Combien de couleurs minimum dans une équipe ?"
    answer: 3
    tolerance: 0
    points: 10
    penaltyEnabled: false
    penalty: 0
    retry: true

  # Numeric — pas de retry, petite tolérance
  - id: q5
    type: numeric
    prompt: "Combien de zones l’organisateur a-t-il découpé pour le jeu ?"
    answer: 6
    tolerance: 0
    points: 10
    penaltyEnabled: false
    penalty: 0
    retry: false

  # Short answer — retry autorisé, comparaison normalisée
  - id: q6
    type: short
    prompt: "Quel est le nom du projet ?"
    answer: "Connect"
    mode: normalized
    points: 10
    penaltyEnabled: false
    penalty: 0
    retry: true

  # Fill-in-the-blank — pas de retry, comparaison normalisée
  - id: q7
    type: fill
    prompt: "Complète : Une équipe utilise un seul ________ pour jouer."
    answer: "téléphone"
    mode: normalized
    points: 10
    penaltyEnabled: false
    penalty: 0
    retry: false

  # QCU — retry autorisé, pénalité si faux (ex : question “piège”)
  - id: q8
    type: qcu
    prompt: "Combien de personnes maximum dans une équipe ?"
    options: ["4", "5", "6", "7"]
    answer: "6"
    points: 10
    penaltyEnabled: true
    penalty: 3
    retry: true

  # QCM — pas de retry
  - id: q9
    type: qcm
    prompt: "Quels éléments sont requis pour créer une équipe ?"
    options:
      [
        "Nom d’équipe",
        "Prénom de chaque participant",
        "Couleur de chaque participant",
        "Numéro de passeport",
        "Code d’accès (DOB/PIN)"
      ]
    answer: ["Nom d’équipe", "Prénom de chaque participant", "Couleur de chaque participant", "Code d’accès (DOB/PIN)"]
    points: 15
    penaltyEnabled: false
    penalty: 0
    retry: false

  # Short answer — pas de retry, exact (pour tester le mode exact)
  - id: q10
    type: short
    prompt: "Réponds exactement : écris le mot 'OK'."
    answer: "OK"
    mode: exact
    points: 5
    penaltyEnabled: false
    penalty: 0
    retry: false
  
  - id: q11
    type: photo
    prompt: "Prends en photo la personne la plus âgée présente aujourd’hui."
    points: 20
    retry: false
    upload:
      bucket: connect-public
      folder: "answers"
    consentText: "Nous acceptons que cette photo soit utilisée par l’organisateur (retour en images)."
  
  - id: q12
    type: photo
    prompt: "Réunis une chaîne familiale sur une photo (3/4/5 générations)."
    points: 0
    retry: false
    upload:
      bucket: connect-public
      folder: "answers"
    tier:
      label: "Combien de générations sur la photo ?"
      options:
        - value: 3
          label: "3 générations"
          points: 20
        - value: 4
          label: "4 générations"
          points: 40
        - value: 5
          label: "5 générations"
          points: 60
    note:
      enabled: true
      placeholder: "Optionnel : prénoms / lien (ex: Mamie Jo, maman Sarah, bébé Léa)"
    consentText: "Nous acceptons l’utilisation de cette photo par l’organisateur."


---
Bienvenue dans la zone Histoire. Lisez les éléments autour de vous…

Dans cette zone, vous allez répondre à plusieurs types de questions.
Certaines autorisent une deuxième tentative, d’autres non.
