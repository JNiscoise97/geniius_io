---
id: z96
title: Zone 96 — Arts
theme: arts
questions:
  - id: q1
    type: qcu
    prompt: "Qui a peint 'La Nuit étoilée' ?"
    options: ["Claude Monet", "Vincent van Gogh", "Pablo Picasso", "Salvador Dalí"]
    answer: "Vincent van Gogh"
    points: 10
    penaltyEnabled: false
    penalty: 0
    retry: false

  - id: q2
    type: qcm
    prompt: "Quels sont des instruments à cordes ?"
    options: ["Violon", "Piano", "Guitare", "Flûte", "Harpe"]
    answer: ["Violon", "Guitare", "Harpe"]
    points: 15
    penaltyEnabled: true
    penalty: 5
    retry: true

  - id: q3
    type: truefalse
    prompt: "Le cinéma est apparu avant la photographie."
    answer: false
    points: 5
    penaltyEnabled: false
    penalty: 0
    retry: true

  - id: q4
    type: numeric
    prompt: "Combien y a-t-il de notes principales dans une gamme musicale classique ?"
    answer: 7
    tolerance: 0
    points: 10
    penaltyEnabled: false
    penalty: 0
    retry: true

  - id: q5
    type: short
    prompt: "Quel artiste est surnommé 'Le Roi de la Pop' ?"
    answer: "Michael Jackson"
    mode: normalized
    points: 10
    penaltyEnabled: false
    penalty: 0
    retry: true

  - id: q6
    type: fill
    prompt: "Complète : La Joconde est exposée au musée du ________."
    answer: "Louvre"
    mode: normalized
    points: 10
    penaltyEnabled: false
    penalty: 0
    retry: false

  - id: q7
    type: photo
    prompt: "Prenez en photo quelque chose de créatif autour de vous."
    points: 15
    retry: false
    upload:
      bucket: connect-public
      folder: "answers"
    consentText: "Nous acceptons l’utilisation de cette photo par l’organisateur."

---

Zone Arts. Observez, écoutez, créez…