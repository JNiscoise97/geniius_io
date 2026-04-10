---
id: s02
title: Ce que les documents nous montrent
kind: chapter
questions:

  - id: q5
    type: qcm
    prompt: Dans quelles communes retrouve-t-on Gromèr Covindou dans les documents ?
    options:
      - value: saintdenis
        label: Saint-Denis
      - value: saintpaul
        label: Saint-Paul
      - value: troisbassins
        label: Trois-Bassins
      - value: saintleu
        label: Saint-Leu
      - value: saintlouis
        label: Saint-Louis
    evaluation:
      kind: auto_correct
      answer:
        - saintleu
        - troisbassins
      compareMode: set
      points: 15
      retry: true
      maxAttempts: 2
      penaltyEnabled: true
      penaltyByAttempt: [7]
    feedback:
      explanationMarkdown: |
        Gromèr Covindou apparaît dans les documents à **Saint-Leu** puis à **Trois-Bassins**.

        Ces deux communes sont liées aux habitations sucrières de l’ouest.

  - id: info-5
    type: info
    prompt: Une commune relativement récente
    bodyMarkdown: |
      La commune de **Trois-Bassins** n’existe pas encore à la naissance de Gromèr Covindou.

      Elle est créée en **1897**, à partir de territoires appartenant auparavant à **Saint-Leu** et **Saint-Paul**.

      Avant cela, la zone correspond à un espace de ravines et de concessions agricoles progressivement mis en valeur.

      Cela explique pourquoi les documents anciens peuvent mentionner des lieux différents pour un même secteur.

    evaluation:
      kind: none

  - id: q6
    type: qcu
    prompt: À quel établissement est-elle principalement liée ?
    options:
      - value: grande-ravine
        label: Grande Ravine (Trois-Bassins)
      - value: legol
        label: Le Gol (Saint-Louis)
      - value: stella
        label: Stella (Saint-Leu)
    evaluation:
      kind: auto_correct
      answer: grande-ravine
      points: 15
    feedback:
      explanationMarkdown: |
        Gromèr Covindou est liée à l’établissement de **Grande Ravine**.

        Ce lieu structure l’organisation du travail agricole après l’abolition.
  
  - id: info-grande-ravine-1
    type: info
    prompt: Etalissement Grande Ravine
    media:
      - kind: image
        src: /src/content/activities/media/grande-ravine.jpg
        alt: Etalissement Grande Ravine
    bodyMarkdown: |
        L’établissement de **Grande Ravine**, créé en 1829, appartenait à l’origine à la famille **DEGUIGNÉ**, qui y faisait travailler près de 200 esclaves d’origines diverses.

        En 1846, l’usine est vendue aux frères **GAUTHIER**. Après l’abolition de l’esclavage en 1848, ils remplacent la main-d’œuvre servile par des engagés, venus notamment d’Inde, d’Afrique et de Chine.

        En 1887, l’établissement compte 202 engagés, dont environ trois quarts sont d’origine indienne.

        Le développement de cette activité sucrière contribue à structurer le territoire. La commune de **Trois-Bassins** est ainsi créée en 1897, dans un contexte de dynamisation du secteur.

        En 1909, l’établissement ferme, suite à la ruine de ses propriétaires. La propriété est alors morcelée, et une partie des anciens travailleurs s’y installe durablement.

    evaluation:
      kind: none

  - id: q7
    type: qcu
    prompt: A-t-on retrouvé un mariage civil pour Gromèr Covindou ?
    options:
      - value: oui
        label: Oui
      - value: non
        label: Non
    evaluation:
      kind: auto_correct
      answer: non
      points: 10
    feedback:
      explanationMarkdown: |
        Aucun mariage civil n’a été retrouvé pour Gromèr Covindou.

  - id: q8
    type: qcu
    prompt: Combien d’enfants a-t-elle eu ?
    options:
      - value: "2"
        label: 2 enfants
      - value: "4"
        label: 4 enfants
      - value: "6"
        label: 6 enfants
    evaluation:
      kind: auto_correct
      answer: "6"
      points: 15
    feedback:
      explanationMarkdown: |
        Elle a eu **6 enfants** entre 1885 et 1897. Deux de ses enfants n'ont pas survécu.

        Elle est la déclarante pour chacun d’eux.

  - id: info-8
    type: info
    prompt: Des habitations liées aux propriétés sucrières
    bodyMarkdown: |
      Les actes de naissance de ses enfants précisent les lieux exacts :

      • **1885** - maison d’Augustin CERVEAUX  
      • **1889, 1891, 1893, 1895, 1897** - maisons situées sur l’emplacement du sieur de CHATEAUVIEUX  

      Ces lieux correspondent à des propriétés agricoles liées aux habitations sucrières.

    evaluation:
      kind: none

  - id: info-9
    type: info
    prompt: Des lieux de vie très précis
    bodyMarkdown: |
      Les dénombrements permettent de situer Gromèr Covindou avec précision :

      • **1907** - Saint-Leu  
      Quartier Colimaçons, Petite Ravine, chemin de ligne au-dessous  

      • **1920** - Trois-Bassins  
      Bas de la Grande Ravine  

      • **1921** - Trois-Bassins  
      Petite Ravine, établissement  

      Ces informations permettent de suivre ses déplacements au fil du temps.

    evaluation:
      kind: none

  - id: info-10
    type: info
    prompt: Un nom qui varie selon les actes
    bodyMarkdown: |
      Le nom de Gromèr Covindou n’est pas toujours écrit de la même manière dans les documents.

        On le retrouve sous différentes formes : Covindou, Covindin, Govindaman, Govindama, mais aussi Tanjama ou Tandiemain.

        Ces variations viennent de la façon dont les officiers d’état civil entendent et retranscrivent les noms.

        À cette époque, l’orthographe n’est pas fixée, ce qui peut compliquer les recherches.

    evaluation:
      kind: none

  - id: info-11
    type: info
    prompt: Le matricule, un repère fiable
    bodyMarkdown: |
      Gromèr Covindou possède un **numéro de matricule**, même si elle est née à La Réunion.

      Contrairement à une idée reçue, ces numéros ne concernent pas uniquement les engagés arrivés d’Inde.

      Ils permettent de suivre un individu dans les archives sans se fier uniquement à son nom.

      Les noms peuvent varier d’un acte à l’autre : selon la compréhension de l’officier d’état civil, l’orthographe ou la retranscription.

      Le matricule devient alors un repère beaucoup plus fiable.

    evaluation:
      kind: none

---
Test