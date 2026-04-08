---
id: s02
title: Vagues d’arrivée des indiens à La Réunion
kind: chapter

questions:
  - id: q5
    type: qcu
    prompt: À ton avis, l’immigration indienne à La Réunion s’est faite en combien de grandes vagues ?
    options:
      - value: "2"
        label: 2
      - value: "3"
        label: 3
      - value: "5"
        label: 5
    evaluation:
      kind: auto_correct
      answer: "5"
      retry: true
      maxAttempts: 2
      points: 15
      penaltyEnabled: true
      penaltyByAttempt: [7]
    feedback:
      explanationMarkdown: |
        Il y a eu **cinq grandes vagues** d’immigration indienne à La Réunion.

  - id: q6
    type: qcu
    prompt: À quelle vague correspond l’arrivée de notre famille à La Réunion ?
    options:
      - value: premiere
        label: Les premières arrivées (Indo-portugaises)
      - value: engagisme
        label: L’engagisme après l’abolition
      - value: recente
        label: Les arrivées après 1960
    evaluation:
      kind: auto_correct
      answer: engagisme
      points: 20
    feedback:
      explanationMarkdown: |
        Notre famille arrive dans le cadre de **l’engagisme**, après l’abolition de l’esclavage en 1848.

        👉🏾 Des travailleurs sous contrat sont alors recrutés en Inde pour remplacer la main-d’œuvre.

        C’est dans ce contexte que nos ancêtres arrivent à La Réunion.

  - id: info-vagues-1
    type: info
    prompt: Les cinq grandes vagues d’arrivée
    bodyMarkdown: |
      L’immigration indienne à La Réunion s’est faite en **cinq grandes vagues** :

      1. **Les Indo-portugaises (XVIIe siècle)**
      Des femmes originaires des comptoirs portugais en Inde, comme Goa, présentes dès les débuts du peuplement de notre île.

      2. **L’engagisme (XIXe siècle)**
      Des travailleurs sous contrat, venus remplacer la main-d’œuvre après 1848.
      👉🏾 C’est dans cette vague que se situe notre famille.

      3. **Les “Zarabs” (XIXe siècle)**
      Des commerçants musulmans venus du Gujarat.

      4. **Diversification des arrivées (fin XIXe / début XXe)**
      D’autres groupes indiens continuent d’arriver à La Réunion, issus de différentes régions et de différents milieux.

      5. **Les rapatriés des comptoirs français (années 1960)**
      Après la rétrocession de Pondichéry, Karikal, Mahé…
    evaluation:
      kind: none

  - id: q7
    type: qcu
    prompt: En quelle année les parents de Covindou arrivent-ils à La Réunion ?
    options:
      - value: "1759"
        label: 1759
      - value: "1859"
        label: 1859
      - value: "1959"
        label: 1959
    evaluation:
      kind: auto_correct
      answer: "1859"
      retry: true
      maxAttempts: 2
      points: 20
      penaltyEnabled: true
      penaltyByAttempt: [10]
    feedback:
      explanationMarkdown: |
        Ils arrivent en **1859**.

        Leur numéro matricule permet d’identifier leur année d’arrivée
        et leur bateau.

        C’est un élément clé pour reconstituer leur histoire.
---
Test