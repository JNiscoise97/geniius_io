---
id: s01
title: Notre lien avec l’Inde
kind: chapter

questions:
  - id: info-intro-1
    type: info
    prompt: Ce que l’on croit savoir
    bodyMarkdown: >
      Beaucoup de descendants ont longtemps pensé que **Gromèr Covindou** était née en Inde.
      En réalité, l’histoire est plus subtile : ce sont ses parents, et plus tard le père de ses enfants,
      qui rattachent directement cette branche familiale à l’Inde.
    evaluation:
      kind: none
    feedback:
      submittedTitle: Information lue

  - id: q1
    type: qcu
    prompt: Gromèr Covindou TANJAMA est née…
    options:
      - value: inde
        label: en Inde
      - value: reunion
        label: à La Réunion
      - value: maurice
        label: à l’île Maurice
    evaluation:
      kind: auto_correct
      answer: reunion
      retry: false
      points: 10
      compareMode: exact
    feedback:
      explanationMarkdown: >
        Gromèr Covindou est née **à La Réunion** en 1868.
        C’est une confusion fréquente dans la famille, car son histoire reste profondément liée à l’Inde par son entourage.

  - id: q2
    type: qcm
    prompt: Quels personnages de cette histoire sont directement nés en Inde ?
    options:
      - value: covindou
        label: Covindou
      - value: ariapoutri
        label: Ariapoutri, sa mère
      - value: pere-enfants
        label: Le père des enfants de Covindou
      - value: candassamy
        label: Candassamy, fils de Covindou
    evaluation:
      kind: auto_correct
      answer:
        - ariapoutri
        - pere-enfants
      retry: true
      maxAttempts: 2
      points: 15
      penaltyEnabled: true
      penaltyByAttempt: [3, 6]
      compareMode: set
    feedback:
      explanationMarkdown: >
        **Ariapoutri** est née en Inde avant de venir à La Réunion.
        Le **père des enfants de Covindou**, dont le nom ne nous est pas parvenu,
        était lui aussi un engagé indien né en Inde.
        En revanche, **Covindou** et **Candassamy** sont nés à La Réunion.

  - id: info-transition-1
    type: info
    prompt: Une histoire familiale dans une histoire plus vaste
    bodyMarkdown: >
      Ariapoutri n’est pas un cas isolé.
      Son arrivée à La Réunion s’inscrit dans l’histoire de **l’engagisme**,
      un système de travail sous contrat qui s’est développé après l’abolition de l’esclavage.
    evaluation:
      kind: none
    feedback:
      submittedTitle: Information lue

  - id: q3
    type: truefalse
    prompt: Après l’abolition de l’esclavage, les colonies ont fait venir des travailleurs sous contrat pour remplacer une partie de la main-d’œuvre servile.
    evaluation:
      kind: auto_correct
      answer: true
      retry: false
      points: 10
    feedback:
      explanationMarkdown: >
        **Vrai.**
        C’est précisément dans ce contexte que se développe l’**engagisme**.
        À La Réunion, des engagés indiens, africains et chinois sont recrutés pour travailler notamment dans les plantations.

  - id: q4
    type: qcu
    prompt: Ariapoutri vient à La Réunion dans le cadre…
    options:
      - value: voyage-loisir
        label: d’un voyage personnel
      - value: contrat
        label: d’un contrat de travail
      - value: mission-religieuse
        label: d’une mission religieuse
    evaluation:
      kind: auto_correct
      answer: contrat
      retry: false
      points: 10
      compareMode: exact
    feedback:
      explanationMarkdown: >
        **Bonne réponse : d’un contrat de travail.**
        Ariapoutri fait partie des milliers d’Indiens venus à La Réunion comme travailleurs engagés.

  - id: q5
    type: qcm
    prompt: Dans quels espaces du monde le système de l’engagisme indien a-t-il aussi existé ?
    options:
      - value: ocean-indien
        label: Dans l’océan Indien
      - value: caraibes
        label: Dans les Caraïbes
      - value: afrique-sud
        label: En Afrique du Sud
      - value: europe-occidentale
        label: Dans l’Europe occidentale
    evaluation:
      kind: auto_correct
      answer:
        - ocean-indien
        - caraibes
        - afrique-sud
      retry: true
      maxAttempts: 2
      points: 20
      penaltyEnabled: true
      penaltyByAttempt: [4, 8]
      compareMode: set
    feedback:
      explanationMarkdown: >
        **Bonne réponse : l’océan Indien, les Caraïbes et l’Afrique du Sud.**
        C’est l’un des aspects les plus frappants de cette histoire :
        l’engagisme indien ne concerne pas seulement La Réunion,
        mais un système colonial déployé dans de nombreux territoires du monde.

  - id: q6
    type: fill
    prompt: "Complète : Le système qui a amené à La Réunion des travailleurs sous contrat après l’abolition de l’esclavage s’appelle l’__________."
    placeholder: "Ex: engagisme"
    evaluation:
      kind: auto_correct
      answer: "engagisme"
      retry: true
      maxAttempts: 2
      points: 15
      compareMode: normalized
    feedback:
      explanationMarkdown: >
        Le mot attendu était **engagisme**.
        Ce terme désigne le système de recrutement et de mise au travail de personnes engagées sous contrat,
        notamment venues d’Inde vers de nombreuses colonies.

  - id: info-transition-2
    type: info
    prompt: Une surprise au cœur de notre propre famille
    bodyMarkdown: >
      Maintenant que le contexte est posé, revenons à **Covindou**.
      Car le plus étonnant est peut-être là : au centre d’une famille qui se sent reliée à l’Inde,
      elle-même n’a jamais vu ce pays.
    evaluation:
      kind: none
    feedback:
      submittedTitle: Information lue

  - id: q7
    type: truefalse
    prompt: Covindou a déjà voyagé en Inde au cours de sa vie.
    evaluation:
      kind: auto_correct
      answer: false
      retry: true
      maxAttempts: 2
      points: 10
      penaltyEnabled: true
      penaltyByAttempt: [2, 5]
    feedback:
      explanationMarkdown: >
        **Faux.**
        Covindou n’a jamais traversé la mer.
        C’est un élément marquant, car beaucoup de descendants associent spontanément sa personne à l’Inde.

  - id: q8
    type: qcu
    prompt: Le père des enfants de Covindou…
    options:
      - value: reste-reunion
        label: est resté à La Réunion toute sa vie
      - value: repart-inde
        label: est reparti en Inde
      - value: part-france
        label: est parti en métropole
    evaluation:
      kind: auto_correct
      answer: repart-inde
      retry: false
      points: 15
      compareMode: exact
    feedback:
      explanationMarkdown: >
        **Bonne réponse : il est reparti en Inde.**
        Son nom ne nous est pas parvenu, mais la mémoire familiale a conservé ce fait important.
        Cela montre que le lien avec l’Inde n’était pas seulement un héritage du passé :
        il restait encore vivant dans la génération de Covindou.

  - id: q9
    type: qcu
    prompt: Pourquoi Covindou n’est-elle finalement jamais partie en Inde ?
    options:
      - value: refus-principe
        label: Elle refusait par principe de quitter La Réunion
      - value: tempete
        label: Une tempête l’a dissuadée au moment du départ
      - value: pas-passeport
        label: Elle n’avait pas les documents nécessaires
    evaluation:
      kind: auto_correct
      answer: tempete
      retry: true
      maxAttempts: 2
      points: 20
      penaltyEnabled: true
      penaltyByAttempt: [4, 8]
      compareMode: exact
    feedback:
      explanationMarkdown: >
        **Bonne réponse : une tempête l’a dissuadée.**
        Quelques jours avant le départ, une tempête a frappé.
        Covindou, qui n’avait jamais pris la mer, a été saisie par la peur pour elle et ses enfants.
        Elle a donc choisi de rester à La Réunion, tandis que son compagnon repartait seul en Inde.

  - id: q10
    type: short
    prompt: "Écris le prénom de cette femme au centre de notre histoire familiale, née à La Réunion mais profondément liée à l’Inde."
    placeholder: "Ex: Covindou"
    evaluation:
      kind: auto_correct
      answer: "Covindou"
      retry: true
      maxAttempts: 2
      points: 10
      compareMode: normalized
    feedback:
      explanationMarkdown: >
        Le prénom attendu était **Covindou**.
        Cette dernière question résume bien tout le paradoxe du quiz :
        une femme née à La Réunion, qui n’a jamais vu l’Inde,
        mais qui se trouve pourtant au cœur de notre lien familial avec cette terre d’origine.
---

Tu viens de parcourir une histoire familiale qui dépasse largement le cadre de la famille seule.

Notre lien avec l’Inde ne se résume ni à un prénom, ni à une origine lointaine :
il s’inscrit dans l’histoire mondiale de l’engagisme, dans les choix de vie de nos ancêtres,
et dans la mémoire transmise jusqu’à nous.
