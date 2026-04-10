---
id: s01
title: Ton lien avec l’Inde
kind: chapter

questions:
  - id: c1
    type: qcu
    prompt: Savais-tu déjà que notre famille a un lien ancien avec l’Inde ?
    options:
      - value: oui-clairement
        label: Oui, clairement
      - value: un-peu
        label: Oui, mais seulement en partie
      - value: non
        label: Non, je le découvre
      - value: pas-sur
        label: Je n’étais pas sûr(e)
    evaluation:
      kind: submit_only

  - id: c2
    type: qcu
    prompt: Es-tu déjà allé(e) en Inde ?
    options:
      - value: oui-une-fois
        label: Oui, une fois
      - value: oui-plusieurs
        label: Oui, plusieurs fois
      - value: non
        label: Non
    evaluation:
      kind: submit_only
    navigation:
      branches:
        - when: { op: equals, value: oui-une-fois }
          goto: c3
        - when: { op: equals, value: oui-plusieurs }
          goto: c3
        - when: { op: equals, value: non }
          goto: c3b

  - id: c3
    type: long
    prompt: En quelle(s) année(s) ou période(s) es-tu allé(e) en Inde ?
    placeholder: "Ex : 2013, vers 1998, entre 2005 et 2010…"
    evaluation:
      kind: submit_only

  - id: c4
    type: select
    prompt: Dans quel(s) cadre(s) y es-tu allé(e) ?
    multiple: true
    options:
      - value: famille
        label: Voyage familial
      - value: personnel
        label: Voyage personnel
      - value: spirituel
        label: Voyage spirituel / religieux
      - value: etudes
        label: Études
      - value: travail
        label: Travail
      - value: tourisme
        label: Tourisme
      - value: autre
        label: Autre
    evaluation:
      kind: submit_only

  - id: c5
    type: long
    prompt: Quelles villes ou régions as-tu visitées ?
    media:
      - kind: image
        src: /src/content/activities/media/carte_inde.jpg
        alt: Carte de l'Inde
    placeholder: "Ex : Chennai, Pondichéry, Mumbai, Gujarat…"
    evaluation:
      kind: submit_only

  - id: c6
    type: photo
    prompt: As-tu une photo de toi en Inde à partager ?
    consentText: J’accepte de partager cette photo dans le cadre de la collecte familiale.
    upload:
      bucket: activity-collect-photos
      folder: collect-lien-participant-inde
    note:
      enabled: true
      placeholder: "Ajoute un contexte si possible"
    evaluation:
      kind: manual_review

  - id: c7
    type: qcu
    prompt: As-tu vu le Taj Mahal ?
    options:
      - value: oui
        label: Oui
      - value: non
        label: Non
      - value: pas-sur
        label: Je ne suis pas sûr(e)
    evaluation:
      kind: submit_only
    navigation:
      branches:
        - when: { op: equals, value: oui }
          goto: c7a
        - when: { op: equals, value: non }
          goto: c8
        - when: { op: equals, value: pas-sur }
          goto: c8

  - id: c7a
    type: photo
    prompt: As-tu une photo de toi devant le Taj Mahal à partager ?
    consentText: J’accepte de partager cette photo dans le cadre de la collecte familiale.
    upload:
      bucket: activity-collect-photos
      folder: collect-lien-participant-inde
    note:
      enabled: true
      placeholder: "Ajoute un contexte si possible"
    evaluation:
      kind: manual_review
    navigation:
      next: c8

  - id: c3b
    type: qcu
    prompt: Aimerais-tu aller en Inde un jour ?
    options:
      - value: oui-beaucoup
        label: Oui, beaucoup
      - value: oui-peut-etre
        label: Oui, peut-être
      - value: non
        label: Non
      - value: ne-sais-pas
        label: Je ne sais pas
    evaluation:
      kind: submit_only

  - id: c8
    type: qcu
    prompt: Des membres de ta famille ont-ils été en Inde ?
    options:
      - value: oui
        label: Oui
      - value: non
        label: Non
      - value: ne-sais-pas
        label: Je ne sais pas
    evaluation:
      kind: submit_only
    navigation:
      branches:
        - when: { op: equals, value: oui }
          goto: c9
        - when: { op: equals, value: non }
          goto: c10
        - when: { op: equals, value: ne-sais-pas }
          goto: c10

  - id: c9
    type: long
    prompt: Si oui, peux-tu indiquer qui, où et quand pour chacun ?
    placeholder: "Même approximatif : prénom, lieu, période…"
    evaluation:
      kind: submit_only

  - id: c10
    type: long
    prompt: Ce voyage, ou cette histoire, est-elle importante pour toi ? Pourquoi ?
    placeholder: "Tu peux parler de fierté, de curiosité, d’identité…"
    evaluation:
      kind: submit_only

  - id: c11
    type: long
    prompt: Y a-t-il une personne de la famille que je devrais interroger sur ce sujet ?
    placeholder: "Prénom, surnom, branche familiale…"
    evaluation:
      kind: submit_only

  - id: c12
    type: long
    prompt: Y a-t-il autre chose que tu aimerais partager sur le lien entre notre famille et l’Inde ?
    placeholder: "Un souvenir, une idée, un ressenti…"
    evaluation:
      kind: submit_only
---
Test