---
id: z98
title: Zone 98 — Géographie
theme: geographie
questions:
  - id: q1
    type: qcu
    prompt: "Quelle est la capitale du Japon ?"
    options: ["Pékin", "Séoul", "Tokyo", "Bangkok"]
    answer: "Tokyo"
    points: 10
    penaltyEnabled: false
    penalty: 0
    retry: false

  - id: q2
    type: qcm
    prompt: "Quels sont des continents ?"
    options: ["Afrique", "Europe", "Groenland", "Asie", "Australie"]
    answer: ["Afrique", "Europe", "Asie", "Australie"]
    points: 15
    penaltyEnabled: true
    penalty: 5
    retry: true

  - id: q3
    type: truefalse
    prompt: "L’Amazonie se situe en Afrique."
    answer: false
    points: 5
    penaltyEnabled: false
    penalty: 0
    retry: true

  - id: q4
    type: numeric
    prompt: "Combien y a-t-il d’océans sur Terre ?"
    answer: 5
    tolerance: 0
    points: 10
    penaltyEnabled: false
    penalty: 0
    retry: false

  - id: q5
    type: short
    prompt: "Quel fleuve traverse Paris ?"
    answer: "Seine"
    mode: normalized
    points: 10
    penaltyEnabled: false
    penalty: 0
    retry: true

  - id: q6
    type: fill
    prompt: "Complète : Le plus grand désert chaud du monde est le ________."
    answer: "Sahara"
    mode: normalized
    points: 10
    penaltyEnabled: false
    penalty: 0
    retry: false

  - id: q7
    type: photo
    prompt: "Prenez en photo un élément naturel (ciel, arbre, pierre, eau…)."
    points: 15
    retry: false
    upload:
      bucket: connect-public
      folder: "answers"
    consentText: "Nous acceptons l’utilisation de cette photo par l’organisateur."

---

Zone Géographie. Le monde est votre terrain de jeu.