---
id: s01
title: Démo — La Réunion
kind: chapter

questions:
  - id: q1
    type: qcu
    prompt: Quel volcan actif emblématique se trouve à La Réunion ?
    options:
      - value: piton-neiges
        label: Le Piton des Neiges
      - value: piton-fournaise
        label: Le Piton de la Fournaise
      - value: mont-blanc
        label: Le Mont Blanc
    evaluation:
      kind: auto_correct
      answer: piton-fournaise
      retry: false
      points: 10
      compareMode: exact
    feedback:
      explanationMarkdown: >
        Le Piton de la Fournaise est l’un des volcans les plus actifs au monde.
        Le Piton des Neiges, lui, est plus ancien et n’est plus actif.

  - id: q2
    type: qcm
    prompt: Parmi les éléments suivants, lesquels sont des cirques de La Réunion ?
    options:
      - value: mafate
        label: Mafate
      - value: cilaos
        label: Cilaos
      - value: salazie
        label: Salazie
      - value: carbet
        label: Carbet
      - value: takamaka
        label: Takamaka
    evaluation:
      kind: auto_correct
      answer:
        - mafate
        - cilaos
        - salazie
      retry: true
      maxAttempts: 2
      points: 15
      penaltyEnabled: true
      penaltyByAttempt: [3, 6]
      compareMode: set
    feedback:
      explanationMarkdown: >
        Les trois grands cirques de La Réunion sont Mafate, Cilaos et Salazie.
        Takamaka est une vallée spectaculaire, mais pas un cirque.

  - id: q3
    type: truefalse
    prompt: Saint-Denis est la capitale administrative de La Réunion.
    evaluation:
      kind: auto_correct
      answer: true
      retry: false
      points: 10
    feedback:
      explanationMarkdown: >
        Oui. Saint-Denis est le chef-lieu de La Réunion et concentre de nombreuses fonctions administratives.

  - id: q4
    type: numeric
    prompt: Combien y a-t-il de cirques principaux à La Réunion ?
    inputMode: integer
    min: 0
    max: 10
    evaluation:
      kind: auto_correct
      answer: 3
      tolerance: 0
      retry: true
      maxAttempts: 2
      points: 10
      penaltyEnabled: true
      penaltyByAttempt: [2, 4]
    feedback:
      explanationMarkdown: >
        Il y a trois cirques principaux à La Réunion : Mafate, Cilaos et Salazie.

  - id: q5
    type: short
    prompt: Quel est le chef-lieu de La Réunion ?
    placeholder: "Ex: Saint-Denis"
    evaluation:
      kind: auto_correct
      answer: "Saint-Denis"
      retry: true
      maxAttempts: 2
      points: 10
      compareMode: normalized
    feedback:
      explanationMarkdown: >
        Le chef-lieu de La Réunion est Saint-Denis, situé dans le nord de l’île.

  - id: q6
    type: fill
    prompt: "Complète : Le volcan actif de La Réunion est le Piton de la ________."
    placeholder: "Ex: Fournaise"
    evaluation:
      kind: auto_correct
      answer: "Fournaise"
      retry: true
      maxAttempts: 2
      points: 10
      compareMode: normalized
    feedback:
      explanationMarkdown: >
        On dit bien le Piton de la Fournaise.

  - id: q7
    type: select
    prompt: Dans quelle zone de l’île se situe principalement Cilaos ?
    options:
      - value: nord
        label: Nord
      - value: sud
        label: Sud
      - value: centre
        label: Centre
      - value: ouest
        label: Ouest
    multiple: false
    evaluation:
      kind: auto_correct
      answer: centre
      retry: false
      points: 10
      compareMode: exact
    feedback:
      explanationMarkdown: >
        Cilaos se situe dans l’intérieur de l’île, au centre.

  - id: q8
    type: select
    prompt: Quels lieux suivants sont situés à La Réunion ?
    options:
      - value: saint-denis
        label: Saint-Denis
      - value: saint-pierre
        label: Saint-Pierre
      - value: cilaos
        label: Cilaos
      - value: marseille
        label: Marseille
      - value: lyon
        label: Lyon
    multiple: true
    evaluation:
      kind: auto_correct
      answer:
        - saint-denis
        - saint-pierre
        - cilaos
      retry: true
      maxAttempts: 2
      points: 15
      penaltyEnabled: true
      penaltyByAttempt: [3, 6]
      compareMode: set
    feedback:
      explanationMarkdown: >
        Saint-Denis, Saint-Pierre et Cilaos se trouvent à La Réunion.
        Marseille et Lyon sont en métropole.

  - id: q9
    type: date
    prompt: Entre une date de fête ou de voyage marquant ton lien à La Réunion.
    evaluation:
      kind: submit_only
      points: 5
    feedback:
      submittedTitle: Date enregistrée
      explanationMarkdown: >
        Cette question sert surtout à tester la saisie de date dans le mode learn.

  - id: q10
    type: info
    prompt: Petit repère sur La Réunion
    bodyMarkdown: >
      La Réunion est une île de l’océan Indien. Son relief, son volcan, ses cirques
      et la diversité de ses paysages en font un territoire très singulier.
      Cette carte sert à tester le type "info" dans le parcours.
    evaluation:
      kind: none
    feedback:
      submittedTitle: Information lue

  - id: q11
    type: photo
    prompt: Partage une photo simple qui évoque La Réunion pour toi.
    consentText: J’accepte de partager cette photo dans le cadre de cette activité de démonstration.
    upload:
      bucket: connect-public
      folder: learn-demo
    note:
      enabled: true
      placeholder: "Tu peux ajouter un petit contexte : lieu, année, souvenir..."
    evaluation:
      kind: manual_review
      points: 10
      reviewLabel: Vérification de la photo envoyée
    feedback:
      submittedTitle: Photo enregistrée
      explanationMarkdown: >
        Merci. Ta photo a bien été envoyée.
        Elle sera relue avant attribution des points.

  - id: q12
    type: photo
    prompt: Partage une photo liée à La Réunion et indique son niveau de valeur souvenir.
    consentText: J’accepte de partager cette photo dans le cadre de cette activité de démonstration.
    upload:
      bucket: connect-public
      folder: learn-demo
    tier:
      label: Quel type de photo partages-tu ?
      options:
        - value: 1
          label: Paysage
          points: 5
        - value: 2
          label: Famille
          points: 10
        - value: 3
          label: Souvenir marquant
          points: 15
    note:
      enabled: true
      placeholder: "Tu peux ajouter un petit contexte : lieu, année, souvenir..."
    evaluation:
      kind: manual_review
      reviewLabel: Vérifier la photo et le niveau déclaré
    feedback:
      submittedTitle: Photo enregistrée
      explanationMarkdown: >
        Merci. Ta photo a bien été envoyée.
        Les points seront attribués après validation par l’organisateur.

  - id: q13
    type: photo
    prompt: Prends une photo d’un élément du quotidien réunionnais autour de toi.
    consentText: J’accepte de transmettre cette photo pour validation dans le cadre de l’activité.
    upload:
      bucket: connect-public
      folder: learn-demo
    tier:
      label: Quel type d’élément as-tu photographié ?
      options:
        - value: 1
          label: Aliment ou plat
          points: 5
        - value: 2
          label: Paysage ou lieu
          points: 10
        - value: 3
          label: Scène de vie ou moment familial
          points: 20
    note:
      enabled: true
      placeholder: "Explique rapidement ce que montre la photo."
    evaluation:
      kind: manual_review
      reviewLabel: Vérifier la cohérence de la photo et de la catégorie choisie
    feedback:
      submittedTitle: Photo enregistrée
      explanationMarkdown: >
        La photo a bien été enregistrée.
        Après vérification, les points correspondants seront attribués.
---

Cette section permet de tester tous les types de questions actuellement prévus dans le mode learn, autour d’une même thématique : La Réunion.