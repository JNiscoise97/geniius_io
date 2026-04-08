---
id: s03
title: Une histoire mondiale
kind: chapter

questions:
  - id: info-2
    type: info
    prompt: Et si notre histoire n’était pas unique ?
    bodyMarkdown: |
      On pourrait croire que cette histoire est propre à La Réunion.

      En réalité, elle fait partie d’un phénomène **mondial**.

      👉🏾 Les mêmes bateaux
      👉🏾 Les mêmes contrats
      👉🏾 Les mêmes origines

      Mais des destinations différentes.
    evaluation:
      kind: none

  - id: q8
    type: qcm
    prompt: Dans quelles régions du monde retrouve-t-on aussi des descendants d’engagés indiens ?
    options:
      - value: caraibes
        label: Caraïbes (Guadeloupe, Trinidad, Guyana…)
      - value: europe
        label: Europe occidentale
      - value: afrique
        label: Afrique du Sud, Tanzanie
      - value: ocean-indien
        label: Océan Indien (Maurice, La Réunion…)
    evaluation:
      kind: auto_correct
      answer:
        - caraibes
        - afrique
        - ocean-indien
      retry: true
      maxAttempts: 2
      points: 20
      penaltyEnabled: true
      penaltyByAttempt: [4, 8]
      compareMode: set
    feedback:
      explanationMarkdown: |
        On retrouve cette histoire dans les **Caraïbes**, en **Afrique** et dans l’**océan Indien**.

        👉🏾 Des familles comme la nôtre existent aujourd’hui à Maurice, Trinidad, Guyana ou encore en Afrique du Sud.

        Notre histoire fait partie d’un réseau mondial.

  - id: info-monde-1
    type: info
    prompt: L’ampleur du phénomène
    bodyMarkdown: |
      On retrouve cette histoire dans les **Caraïbes**, en **Afrique** et dans l’**océan Indien**.

      Mais ce qui est impressionnant, c’est l’ampleur du phénomène 👇

      🌊 **Océan Indien**
      Maurice : plus de 450 000 arrivées
      La Réunion : plus de 120 000
      Seychelles : quelques milliers

      🌴 **Caraïbes**
      Guyana : environ 240 000
      Trinidad & Tobago : plus de 140 000
      Jamaïque, Suriname, Guadeloupe, Martinique : des dizaines de milliers

      🌍 **Afrique**
      Afrique du Sud : plus de 150 000
      Afrique de l’Est : plusieurs dizaines de milliers

      🌏 **Asie / Pacifique**
      Malaisie : près de 400 000
      Fidji : environ 60 000
      Sri Lanka : important flux tamoul

      Des familles comme la nôtre existent aujourd’hui à Maurice, Trinidad, Guyana ou Fidji.
    evaluation:
      kind: none

  - id: q9
    type: qcu
    prompt: À ton avis, combien d’Indiens ont été envoyés dans les colonies au XIXe siècle ?
    options:
      - value: "100000"
        label: environ 100 000
      - value: "500000"
        label: environ 500 000
      - value: "1500000"
        label: plus d’un million
    evaluation:
      kind: auto_correct
      answer: "1500000"
      points: 15
    feedback:
      explanationMarkdown: |
        Plus d’**un million d’Indiens** ont été déplacés.

        C’est l’un des plus grands mouvements migratoires organisés du XIXe siècle.
        
        Et pourtant, cette histoire reste encore peu connue.

---
Test