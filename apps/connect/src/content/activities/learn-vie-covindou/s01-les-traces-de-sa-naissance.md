---
id: s01
title: Les traces de sa naissance
kind: chapter
questions:

  - id: q1
    type: numeric
    prompt: En quelle année est née Gromèr Covindou ?
    evaluation:
      kind: auto_correct
      answer: 1868
      points: 20
    feedback:
      explanationMarkdown: |
        Gromèr Covindou est née en **1868** à Saint-Leu.

        👉🏽 Mais cette information ne provient pas d’un acte de naissance classique.

  - id: info-1
    type: info
    prompt: Une naissance… sans acte
    bodyMarkdown: |
      Gromèr Covindou est née le **16 mai 1868**.

      👉🏽 Si tu cherches son acte de naissance à cette date, tu ne le trouveras pas.

      Elle n’a **pas d’acte de naissance**.

      En **1898**, elle saisit le **Tribunal de Saint-Pierre** pour faire établir officiellement son identité.

      👉🏽 Une enquête est alors menée pour confirmer son année de naissance.

      Le **jour exact**, lui, est connu grâce à son **acte de baptême**.

    evaluation:
      kind: none

  - id: q2
    type: qcu
    prompt: Que sait-on de ses parents ?
    options:
      - value: reunion
        label: Ils sont nés à La Réunion
      - value: inde
        label: Ils sont nés en Inde et arrivés sous contrat
      - value: inconnus
        label: Ils sont inconnus
    evaluation:
      kind: auto_correct
      answer: inde
      points: 10
    feedback:
      explanationMarkdown: |
        Ses parents sont nés en **Inde** et sont arrivés à La Réunion sous contrat d’engagement en 1859.

        👉🏽 Covindou appartient à la première génération née sur l’île.

  - id: q2bis
    type: qcu
    prompt: Quels sont les noms de ses parents ?
    options:
      - value: faux1
        label: Vardapin Kichenin et Ponou Tanjama
      - value: faux2
        label: Augustin Claire Virama et Barlama Tanjama
      - value: correct
        label: Salléyen Vaillaydon et Ariapoutri Tanjama
      - value: faux3
        label: Virassamy Tanjama et Soupaman Vellaye 
    evaluation:
      kind: auto_correct
      answer: correct
      points: 20
      retry: true
      maxAttempts: 3
      penaltyEnabled: true
      penaltyByAttempt: [5, 10]
    feedback:
      explanationMarkdown: |
        Sa mère est **Ariapoutri Tanjama** et son père **Salléyen Vaillaydon**.

  - id: info-2
    type: info
    prompt: Une transmission particulière
    bodyMarkdown: |
      Gromèr Covindou porte le nom **TANJAMA**, qui lui vient de sa mère.

      👉🏽 À cette époque, chez les engagés indiens à La Réunion, les mères sont très souvent mentionnées à l’état civil… mais beaucoup plus rarement les pères.

      Plusieurs raisons peuvent l’expliquer :

      • des unions non officialisées par mariage civil  
      • des situations administratives instables  
      • des pères absents des déclarations  

      👉🏽 Résultat : le nom transmis est le plus souvent celui de la mère.

      Les mariages civils sont également **rares chez les engagés**, même lorsque le père est présent dans le foyer.

    evaluation:
      kind: none

  - id: q3
    type: truefalse
    prompt: Gromèr Covindou a grandi sans frères ni sœurs.
    evaluation:
      kind: auto_correct
      answer: false
      points: 10
    feedback:
      explanationMarkdown: |
        Covindou avait **au moins 3 frères et 1 sœur**.

        👉🏽 Plusieurs d’entre eux ont eu une descendance importante,
        aujourd’hui présente à Trois-Bassins, Saint-Leu, Saint-Louis (Le Gol) et Saint-Paul (Villèle).

        👉🏽 Il semble qu’elle ait été la **dernière fille** de sa mère.

  - id: info-3
    type: info
    prompt: Une fratrie aux nombreuses branches
    bodyMarkdown: |
      Ariapoutri Tanjama a eu plusieurs enfants :

      • **Souprayen TANJAMA** (né en Inde en 1852)  
      → descendants : AMASSY, LATCHIMY, ROCROU, TOPEYEN, RAMSAMINAICK PAJANIAYE  
      → beaucoup connaissent son petit-fils Tamby Virapin (Tamby Zano)

      • **Sinagaliny TANJAMA** (née vers 1858)  
      → épouse AYEMPERMAL SINGARLINGOM  
      → descendants : POÏNAPIN, CAROUMBIN VIRAPIN, SINATAMBY  

      • **Sillamoutou TANJAMA** (né à Saint-Leu vers 1865)  
      → descendants : COMARIN, LATCHIMY, VIRANAIKEN, SEVAGAMY, BIJOUX, SINNY PALANY  

    evaluation:
      kind: none

  - id: q4
    type: truefalse
    prompt: Seuls les engagés arrivés d’Inde avaient un numéro de matricule.
    evaluation:
      kind: auto_correct
      answer: false
      points: 10
    feedback:
      explanationMarkdown: |
        Gromèr Covindou, bien que née à La Réunion, possédait elle aussi un **numéro de matricule**.

        👉🏽 Contrairement à une idée reçue, ces numéros ne concernaient pas uniquement les engagés arrivés d’Inde.

  - id: info-4
    type: info
    prompt: Les numéros de matricule
    bodyMarkdown: |
      Les numéros de matricule étaient utilisés par l’administration coloniale pour **identifier et suivre les travailleurs**.

      👉🏽 Ils concernent d’abord les engagés arrivés d’Inde.

      Mais ils peuvent aussi être attribués à des personnes **nées sur l’île**, notamment lorsqu’elles sont intégrées dans le système des habitations.

      👉🏽 Ces numéros permettent notamment de suivre un individu dans les archives, sans se fier uniquement à son nom.

      Car les noms peuvent varier d’un acte à l’autre : selon la compréhension de l’officier d’état civil, l’orthographe, ou encore la manière dont ils sont retranscrits.

      Le matricule devient alors un repère beaucoup plus fiable pour reconstituer un parcours.

    evaluation:
      kind: none

---
Test