---
id: s01
title: Où tout commence
kind: chapter

questions:
  - id: q1
    type: truefalse
    prompt: Gromèr Covindou est née en Inde.
    evaluation:
      kind: auto_correct
      answer: false
      points: 10
    feedback:
      explanationMarkdown: |
        Gromèr Covindou est née à **La Réunion**.

        Son acte de décès le confirme clairement.

        Si beaucoup pensent qu’elle est née en Inde, c’est parce que, même sans jamais y avoir vécu, tout en elle en portait la trace : la langue qu’elle parlait, les personnes qui l’entouraient, les gestes de son quotidien et ses traditions.

  - id: q2
    type: qcm
    prompt: Dans sa famille proche, qui est réellement né en Inde ?
    options:
      - value: salleyen
        label: Son père, Salléyen Vaillaydon
      - value: ariapoutri
        label: Sa mère, Ariapoutri Tanjama
      - value: pere-enfants
        label: Le père de ses enfants
      - value: candassamy
        label: Son fils, Candassamy
      - value: molotte
        label: Sa fille, appelée en famille Molotte
    evaluation:
      kind: auto_correct
      answer:
        - salleyen
        - ariapoutri
        - pere-enfants
      retry: true
      maxAttempts: 2
      points: 15
      penaltyEnabled: true
      penaltyByAttempt: [3, 6]
      compareMode: set
    feedback:
      explanationMarkdown: |
        Son **père**, sa **mère** et le **père de ses enfants** sont nés en Inde.

        Ses parents sont arrivés à La Réunion avec leurs premiers enfants.

        Covindou, elle, est née **bien après leur arrivée sur l’île**.
  - id: q3
    type: qcu
    prompt: Que nous apprend le fait que Covindou soit née à La Réunion ?
    options:
      - value: inde
        label: Que la famille n’a jamais quitté l’Inde
      - value: premiere-generation
        label: Qu’elle fait partie de la première génération née sur l’île
      - value: retour
        label: Que la famille est retournée vivre en Inde
    evaluation:
      kind: auto_correct
      answer: premiere-generation
      points: 10
    feedback:
      explanationMarkdown: |
        Covindou est née à La Réunion, alors que ses parents étaient nés en Inde.

        👉🏾 Elle fait donc partie de la **première génération née sur l’île**.

        Cela marque déjà un basculement dans l’histoire familiale.

  - id: info-1
    type: info
    prompt: Une histoire qui dépasse la famille
    bodyMarkdown: |
      Cette histoire ne concerne pas uniquement notre famille.

      Elle s’inscrit dans un phénomène beaucoup plus large.

      L’arrivée d’Indiens à La Réunion ne s’est pas faite en une seule fois, mais à travers **plusieurs vagues de migration**.

      Et certaines sont bien plus anciennes qu’on ne l’imagine.
    evaluation:
      kind: none
  
  - id: q4
    type: qcu
    prompt: À ton avis, l’arrivée des Indiens à La Réunion s’est faite comment ?
    options:
      - value: une-vague
        label: En une seule grande vague
      - value: plusieurs-vagues
        label: En plusieurs vagues successives
    evaluation:
      kind: auto_correct
      answer: plusieurs-vagues
      points: 10
    feedback:
      explanationMarkdown: |
        L’arrivée des Indiens à La Réunion s’est faite en **plusieurs vagues**.

        Certaines sont anciennes, d’autres plus récentes.

        👉🏾 C’est ce que nous allons découvrir ensuite.
---
Test