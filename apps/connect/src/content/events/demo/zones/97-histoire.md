---
id: z97
title: Zone 97 — Histoire
theme: histoire
questions:
  - id: q1
    type: qcu
    prompt: "En quelle année débute la Révolution française ?"
    options: ["1789", "1792", "1804", "1815"]
    answer: "1789"
    points: 10
    penaltyEnabled: false
    penalty: 0
    retry: false

  - id: q2
    type: qcm
    prompt: "Quels personnages ont été empereurs ?"
    options: ["Napoléon Bonaparte", "Charlemagne", "Louis XIV", "Jules César"]
    answer: ["Napoléon Bonaparte", "Charlemagne", "Jules César"]
    points: 15
    penaltyEnabled: true
    penalty: 5
    retry: true

  - id: q3
    type: truefalse
    prompt: "La Première Guerre mondiale commence en 1914."
    answer: true
    points: 5
    penaltyEnabled: false
    penalty: 0
    retry: false

  - id: q4
    type: numeric
    prompt: "En quelle année Christophe Colomb arrive-t-il en Amérique ?"
    answer: 1492
    tolerance: 0
    points: 10
    penaltyEnabled: false
    penalty: 0
    retry: true

  - id: q5
    type: short
    prompt: "Quel mur est tombé en 1989 ?"
    answer: "Mur de Berlin"
    mode: normalized
    points: 10
    penaltyEnabled: false
    penalty: 0
    retry: true

  - id: q6
    type: fill
    prompt: "Complète : La Seconde Guerre mondiale se termine en ________."
    answer: "1945"
    mode: normalized
    points: 10
    penaltyEnabled: false
    penalty: 0
    retry: false

  - id: q7
    type: photo
    prompt: "Photo défi : trouvez un objet qui évoque le passé."
    points: 15
    retry: false
    upload:
      bucket: connect-public
      folder: "answers"
    consentText: "Nous acceptons l’utilisation de cette photo par l’organisateur."

---

Zone Histoire. Regardez derrière vous pour comprendre le présent.