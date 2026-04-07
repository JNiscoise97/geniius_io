---
id: s01
title: Démo
kind: chapter

questions:
  - id: q1
    type: qcu
    prompt: Lors de la dernière cousinade, de qui descendaient les personnes habillées en rouge ?
    options:
      - value: coundiaman
        label: Coundiaman
      - value: barlama
        label: Barlama
      - value: olive
        label: Olive
    evaluation:
      kind: auto_correct
      answer: barlama
      retry: false
      points: 10
      compareMode: exact
    feedback:
      explanationMarkdown: >
        Les personnes habillées en rouge représentaient les descendants de Barlama appelée aussi Manicon.
        Cette répartition permettait de visualiser les branches familiales.

  - id: q2
    type: truefalse
    prompt: Notre arrière-grand-mère commune Covindou est née en Inde.
    evaluation:
      kind: auto_correct
      answer: false
      retry: true
      maxAttempts: 2
      points: 10
    feedback:
      explanationMarkdown: >
        Non. La question de l’Inde concerne les origines familiales plus larges,
        mais Covindou elle-même n’y est pas née.

  - id: q3
    type: short
    prompt: "Écris le prénom de notre arrière-grand-mère commune."
    placeholder: "Ex: Covindou"
    evaluation:
      kind: auto_correct
      answer: "Covindou"
      retry: true
      points: 15
      maxAttempts: 3
      penaltyEnabled: true
      penaltyByAttempt: [2, 5, 10]
      compareMode: normalized
    feedback:
      explanationMarkdown: >
        Le prénom attendu était Covindou.
---

Tu peux prendre ton temps. L’idée est de raviver les souvenirs, pas de te piéger.