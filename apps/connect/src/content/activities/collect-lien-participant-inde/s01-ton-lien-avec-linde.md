---
id: s01
title: Ton lien avec l’Inde
kind: chapter

questions:
  - id: c1
    type: select
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
    multiple: false
    evaluation:
      kind: submit_only
    feedback:
      submittedTitle: Réponse enregistrée

  - id: c2
    type: select
    prompt: Es-tu déjà allé(e) en Inde ?
    options:
      - value: oui-une-fois
        label: Oui, une fois
      - value: oui-plusieurs
        label: Oui, plusieurs fois
      - value: non
        label: Non
      - value: pas-moi-mais-proches
        label: Non, mais des proches ou des membres de la famille y sont allés
    multiple: false
    evaluation:
      kind: submit_only
    feedback:
      submittedTitle: Réponse enregistrée

  - id: c3
    type: long
    prompt: Raconte ce que tu sais des voyages en Inde dans la famille.
    placeholder: "Tu peux citer des personnes, des périodes, des souvenirs, des récits entendus, ou simplement dire que tu ne sais pas grand-chose."
    evaluation:
      kind: submit_only
    feedback:
      submittedTitle: Récit enregistré

  - id: c4
    type: short
    prompt: Si toi ou des proches êtes déjà allés en Inde, peux-tu indiquer les années ou périodes dont tu te souviens ?
    placeholder: "Ex: 2013, vers 1998, entre 2005 et 2010, je ne sais plus exactement…"
    evaluation:
      kind: submit_only
    feedback:
      submittedTitle: Périodes enregistrées

  - id: c5
    type: long
    prompt: Ce voyage (ou cette histoire) est-elle importante pour toi ? Pourquoi ?
    placeholder: "Tu peux parler de fierté, de curiosité, d’identité, de transmission, d’émotion, ou de tout autre ressenti."
    evaluation:
      kind: submit_only
    feedback:
      submittedTitle: Réponse enregistrée

  - id: c6
    type: long
    prompt: As-tu un souvenir, une anecdote, une parole de parent ou une image mentale que tu associes à l’Inde dans notre famille ?
    placeholder: "Même un détail apparemment simple peut être précieux."
    evaluation:
      kind: submit_only
    feedback:
      submittedTitle: Souvenir enregistré

  - id: c7
    type: short
    prompt: Y a-t-il une personne de la famille que je devrais interroger sur ce sujet ?
    placeholder: "Prénom, surnom, branche familiale, ou quelques repères pour l’identifier."
    evaluation:
      kind: submit_only
    feedback:
      submittedTitle: Piste enregistrée

  - id: c8
    type: photo
    prompt: As-tu une photo liée à l’Inde à partager ?
    consentText: J’accepte de partager cette photo dans le cadre de la collecte familiale sur notre lien avec l’Inde.
    upload:
      bucket: connect-public
      folder: inde-terre-mere-collect
    note:
      enabled: true
      placeholder: "Ajoute si possible un contexte : qui apparaît, où, quand, et ce que représente cette photo."
    evaluation:
      kind: manual_review
      reviewLabel: Vérifier la cohérence de la photo partagée
    feedback:
      submittedTitle: Photo enregistrée
      explanationMarkdown: >
        Merci. Ta photo a bien été enregistrée.
        Elle pourra enrichir l’album souvenir et la reconstitution de cette mémoire familiale.
---

Merci pour ta contribution.

Même une réponse partielle, un souvenir flou ou un simple nom peut aider à reconstituer une chronologie,
retrouver des témoins, ou mieux comprendre la façon dont notre famille a continué à entretenir un lien avec l’Inde.
