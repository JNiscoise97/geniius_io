# GENIIUS --- Dictionnaire de données V1.0

**Source normative :** `GENIIUS_MCD_V1_1_CANONIQUE.md`\
**Statut :** dictionnaire de données conceptuel --- entrée du futur MLD\
**Principe directeur :** expliciter sans dégrader le MCD ; ne pas
inventer les choix physiques.

## 0. Frontière du document

Ce dictionnaire décrit le **sens des données**. Il ne décide pas encore
de la table SQL, du type PostgreSQL, de la stratégie RLS, de l'index, du
stockage graphe ou du format physique des identifiants.

Quand le MCD ne fixe pas une propriété, le dictionnaire marque **À
DÉCIDER AU MLD**. Cette mention est volontaire : elle empêche qu'une
commodité d'implémentation devienne silencieusement une règle métier.

Les invariants du MCD restent supérieurs, notamment : `PERSONNE` ne
reçoit pas de `date_naissance`, `profession` ou `résidence` intrinsèque
; les relations historiques restent des assertions ; référence,
filiation et rapprochement restent distincts ; compte, acteur et
personne restent distincts ; acquisition, production et justification
restent distinctes.

## 1. Contrôle de couverture

Le dictionnaire recense **164 entités/objets conceptuels**, **212
associations**, **125 règles de gestion**, **3 types composés** et **49
domaines de valeurs**.

  Domaine                                                        Entités / objets   Associations   RG
  ------------------------------------------------------------ ------------------ -------------- ----
  A --- Socle transversal                                                      15             18    0
  B --- Espaces, comptes, droits, gouvernance                                  26             18    0
  C --- Sources et hiérarchie documentaire                                     15             20    0
  D --- Lecture : transcription, annotation, mention, traces                    5              8    0
  E --- Entités historiques                                                    16              7    0
  F --- Identification et identité                                              7             10    0
  G --- Assertions, valeurs et interprétations                                  5             17    0
  H --- Validation, débat, crédit, réputation                                  11             14    0
  I --- Reconstruction et cohérence documentaire                                3              8    0
  J --- Journal (mémoire)                                                       7             15    0
  K --- Echo (recherche)                                                       19             23    0
  L --- Tree                                                                    5              9    0
  M --- Connect                                                                 4              5    0
  N --- Atlas (spatialité)                                                      2              7    0
  O --- Analyse, corpus, reproductibilité                                       6             10    0
  P --- Publication, pérennité, interopérabilité                                5              7    0
  Q --- Organisation personnelle, veille, notifications                         9             11    0
  R --- Référentiels et concepts                                                4              5    0

## 2. Statuts utilisés dans les fiches

-   **Canonique** : explicitement présent dans le MCD.
-   **Consolidé** : ajouté par les corrections canoniques/crash-tests du
    MCD V1.1.
-   **À DÉCIDER AU MLD** : le MCD impose le sens mais ne fixe pas encore
    la représentation logique/physique.

## 3. Règles transversales du dictionnaire

1.  Une valeur historique contestable est une assertion, pas un attribut
    intrinsèque de l'entité.
2.  Une modification scientifique crée un nouvel état/version ; elle ne
    réécrit pas silencieusement l'ancien.
3.  Les droits, provenance et dépendances doivent rester adressables
    indépendamment du contenu.
4.  Une association réifiée peut elle-même être gouvernée, versionnée ou
    citée lorsque le MCD l'exige.
5.  La nullabilité ne doit jamais transformer « inconnu », « non
    recherché », « illisible », « refusé » ou « non applicable » en un
    même état implicite.
6.  La suppression physique sera définie au MLD ; aucune cascade
    destructive ne doit effacer une provenance ou une citation légitime.

# Domaine A --- Socle transversal

**Couverture : 15 entités/objets, 18 associations, 0 règles RG.**

## OBJET

**Définition.** Super-type abstrait de tout objet de connaissance ou de
travail identifiable, versionnable, citable et soumis à des droits.

**Nature :** Entité/structure conceptuelle non déclarée comme
spécialisation d'`OBJET`.

### Attributs / propriétés explicitement nommés

  ---------------------------------------------------------------------------------------------------------
  Propriété source                                                 Définition au   Type       Obligatoire ?
                                                                   stade           logique    
                                                                   dictionnaire               
  ---------------------------------------------------------------- --------------- ---------- -------------
  `#id_objet`                                                      Propriété       **À        **À DÉCIDER**
                                                                   explicitement   DÉCIDER AU 
                                                                   portée par le   MLD**      
                                                                   MCD. Sa                    
                                                                   sémantique                 
                                                                   détaillée doit             
                                                                   respecter la               
                                                                   définition de              
                                                                   l'objet et les             
                                                                   RG du domaine.             

  `uri_persistante`                                                Propriété       **À        **À DÉCIDER**
                                                                   explicitement   DÉCIDER AU 
                                                                   portée par le   MLD**      
                                                                   MCD. Sa                    
                                                                   sémantique                 
                                                                   détaillée doit             
                                                                   respecter la               
                                                                   définition de              
                                                                   l'objet et les             
                                                                   RG du domaine.             

  `type_objet`                                                     Propriété       **À        **À DÉCIDER**
                                                                   explicitement   DÉCIDER AU 
                                                                   portée par le   MLD**      
                                                                   MCD. Sa                    
                                                                   sémantique                 
                                                                   détaillée doit             
                                                                   respecter la               
                                                                   définition de              
                                                                   l'objet et les             
                                                                   RG du domaine.             

  `date_creation (temps épistémique)`                              Propriété       **À        **À DÉCIDER**
                                                                   explicitement   DÉCIDER AU 
                                                                   portée par le   MLD**      
                                                                   MCD. Sa                    
                                                                   sémantique                 
                                                                   détaillée doit             
                                                                   respecter la               
                                                                   définition de              
                                                                   l'objet et les             
                                                                   RG du domaine.             

  `etat_cycle_vie ⟨D-01⟩`                                          Propriété       **À        **À DÉCIDER**
                                                                   explicitement   DÉCIDER AU 
                                                                   portée par le   MLD**      
                                                                   MCD. Sa                    
                                                                   sémantique                 
                                                                   détaillée doit             
                                                                   respecter la               
                                                                   définition de              
                                                                   l'objet et les             
                                                                   RG du domaine.             

  `etat_examen ⟨D-02⟩`                                             Propriété       **À        **À DÉCIDER**
                                                                   explicitement   DÉCIDER AU 
                                                                   portée par le   MLD**      
                                                                   MCD. Sa                    
                                                                   sémantique                 
                                                                   détaillée doit             
                                                                   respecter la               
                                                                   définition de              
                                                                   l'objet et les             
                                                                   RG du domaine.             

  `statut_validation ⟨D-03⟩ (dérivé du dernier ACTE_EVALUATION)`   Propriété       **À        **À DÉCIDER**
                                                                   explicitement   DÉCIDER AU 
                                                                   portée par le   MLD**      
                                                                   MCD. Sa                    
                                                                   sémantique                 
                                                                   détaillée doit             
                                                                   respecter la               
                                                                   définition de              
                                                                   l'objet et les             
                                                                   RG du domaine.             

  `visibilite ⟨D-04⟩`                                              Propriété       **À        **À DÉCIDER**
                                                                   explicitement   DÉCIDER AU 
                                                                   portée par le   MLD**      
                                                                   MCD. Sa                    
                                                                   sémantique                 
                                                                   détaillée doit             
                                                                   respecter la               
                                                                   définition de              
                                                                   l'objet et les             
                                                                   RG du domaine.             

  `decouvrabilite ⟨D-05⟩`                                          Propriété       **À        **À DÉCIDER**
                                                                   explicitement   DÉCIDER AU 
                                                                   portée par le   MLD**      
                                                                   MCD. Sa                    
                                                                   sémantique                 
                                                                   détaillée doit             
                                                                   respecter la               
                                                                   définition de              
                                                                   l'objet et les             
                                                                   RG du domaine.             

  `libelle_technique`                                              Propriété       **À        **À DÉCIDER**
                                                                   explicitement   DÉCIDER AU 
                                                                   portée par le   MLD**      
                                                                   MCD. Sa                    
                                                                   sémantique                 
                                                                   détaillée doit             
                                                                   respecter la               
                                                                   définition de              
                                                                   l'objet et les             
                                                                   RG du domaine.             
  ---------------------------------------------------------------------------------------------------------

### Associations connues

  ----------------------------------------------------------------------------------
  Association                             Cardinalités            Propriétés portées
                                          conceptuelles           
  --------------------------------------- ----------------------- ------------------
  `CONTENIR (lieu de production)`         ESPACE (0,n) --- OBJET  ---
                                          (1,1)                   

  `REFERENCER (contexte d’utilisation)`   ESPACE (0,n) --- OBJET  date, motif
                                          (0,n)                   

  `AVOIR_VERSION`                         OBJET (1,n) ---         ---
                                          VERSION_OBJET (1,1)     

  `DEPENDRE (aval)`                       OBJET (0,n) ---         ---
                                          DEPENDANCE (1,1)        

  `DEPENDRE (amont)`                      OBJET (0,n) ---         ---
                                          DEPENDANCE (1,1)        

  `DERIVER (objet dérivé)`                OBJET (0,n) ---         ---
                                          FILIATION (1,1)         

  `VISER`                                 OBJET (0,n) ---         ---
                                          REFERENCE_PERSISTANTE   
                                          (1,1)                   

  `IDENTIFIER_EXT`                        OBJET (0,n) ---         ---
                                          IDENTIFIANT_EXTERNE     
                                          (1,1)                   
  ----------------------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## VERSION_OBJET

**Définition.** État figé d'un objet à un moment épistémique. Jamais
modifiée, jamais supprimée hors obligation légale.

**Nature :** Entité/structure conceptuelle non déclarée comme
spécialisation d'`OBJET`.

### Attributs / propriétés explicitement nommés

  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  Propriété source                                                                                                                              Définition au   Type      Obligatoire ?
                                                                                                                                                stade           logique   
                                                                                                                                                dictionnaire              
  --------------------------------------------------------------------------------------------------------------------------------------------- --------------- --------- -------------
  `#id_version`                                                                                                                                 Propriété       **À       **À DÉCIDER**
                                                                                                                                                explicitement   DÉCIDER   
                                                                                                                                                portée par le   AU MLD**  
                                                                                                                                                MCD. Sa                   
                                                                                                                                                sémantique                
                                                                                                                                                détaillée doit            
                                                                                                                                                respecter la              
                                                                                                                                                définition de             
                                                                                                                                                l'objet et les            
                                                                                                                                                RG du domaine.            

  `numero`                                                                                                                                      Propriété       **À       **À DÉCIDER**
                                                                                                                                                explicitement   DÉCIDER   
                                                                                                                                                portée par le   AU MLD**  
                                                                                                                                                MCD. Sa                   
                                                                                                                                                sémantique                
                                                                                                                                                détaillée doit            
                                                                                                                                                respecter la              
                                                                                                                                                définition de             
                                                                                                                                                l'objet et les            
                                                                                                                                                RG du domaine.            

  `date_debut_validite`                                                                                                                         Propriété       **À       **À DÉCIDER**
                                                                                                                                                explicitement   DÉCIDER   
                                                                                                                                                portée par le   AU MLD**  
                                                                                                                                                MCD. Sa                   
                                                                                                                                                sémantique                
                                                                                                                                                détaillée doit            
                                                                                                                                                respecter la              
                                                                                                                                                définition de             
                                                                                                                                                l'objet et les            
                                                                                                                                                RG du domaine.            

  `date_fin_validite`                                                                                                                           Propriété       **À       **À DÉCIDER**
                                                                                                                                                explicitement   DÉCIDER   
                                                                                                                                                portée par le   AU MLD**  
                                                                                                                                                MCD. Sa                   
                                                                                                                                                sémantique                
                                                                                                                                                détaillée doit            
                                                                                                                                                respecter la              
                                                                                                                                                définition de             
                                                                                                                                                l'objet et les            
                                                                                                                                                RG du domaine.            

  `etat_fige (contenu sérialisé de l’objet)`                                                                                                    Propriété       **À       **À DÉCIDER**
                                                                                                                                                explicitement   DÉCIDER   
                                                                                                                                                portée par le   AU MLD**  
                                                                                                                                                MCD. Sa                   
                                                                                                                                                sémantique                
                                                                                                                                                détaillée doit            
                                                                                                                                                respecter la              
                                                                                                                                                définition de             
                                                                                                                                                l'objet et les            
                                                                                                                                                RG du domaine.            

  `nature_changement {création, correction technique, changement scientifique, changement de statut, changement de gouvernance, restriction}`   Propriété       **À       **À DÉCIDER**
                                                                                                                                                explicitement   DÉCIDER   
                                                                                                                                                portée par le   AU MLD**  
                                                                                                                                                MCD. Sa                   
                                                                                                                                                sémantique                
                                                                                                                                                détaillée doit            
                                                                                                                                                respecter la              
                                                                                                                                                définition de             
                                                                                                                                                l'objet et les            
                                                                                                                                                RG du domaine.            

  `motif`                                                                                                                                       Propriété       **À       **À DÉCIDER**
                                                                                                                                                explicitement   DÉCIDER   
                                                                                                                                                portée par le   AU MLD**  
                                                                                                                                                MCD. Sa                   
                                                                                                                                                sémantique                
                                                                                                                                                détaillée doit            
                                                                                                                                                respecter la              
                                                                                                                                                définition de             
                                                                                                                                                l'objet et les            
                                                                                                                                                RG du domaine.            
  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `AVOIR_VERSION`         OBJET (1,n) ---         ---
                          VERSION_OBJET (1,1)     

  `PRECEDER`              VERSION_OBJET (0,1) --- ---
                          VERSION_OBJET (0,1)     

  `PRODUIRE`              ACTIVITE (0,n) ---      ---
                          VERSION_OBJET (1,1)     

  `UTILISER_ENTREE`       ACTIVITE (0,n) ---      rôle de l'entrée
                          VERSION_OBJET (0,n)     

  `UTILISER_VERSION`      VERSION_OBJET (0,n) --- ---
                          DEPENDANCE (0,1)        

  `DERIVER (origine)`     VERSION_OBJET (0,n) --- ---
                          FILIATION (1,1)         

  `FIGER_SUR`             VERSION_OBJET (0,n) --- ---
                          REFERENCE_PERSISTANTE   
                          (0,1)                   
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## ACTIVITE

**Définition.** Acte de production ou de transformation (humain, assisté
ou automatique). Porte la provenance « qui, quand, comment, avec quel
moteur ».

**Nature :** Entité/structure conceptuelle non déclarée comme
spécialisation d'`OBJET`.

### Attributs / propriétés explicitement nommés

  ----------------------------------------------------------------------------------------------------------
  Propriété source                                                  Définition au   Type       Obligatoire ?
                                                                    stade           logique    
                                                                    dictionnaire               
  ----------------------------------------------------------------- --------------- ---------- -------------
  `#id_activite`                                                    Propriété       **À        **À DÉCIDER**
                                                                    explicitement   DÉCIDER AU 
                                                                    portée par le   MLD**      
                                                                    MCD. Sa                    
                                                                    sémantique                 
                                                                    détaillée doit             
                                                                    respecter la               
                                                                    définition de              
                                                                    l'objet et les             
                                                                    RG du domaine.             

  `type_activite ⟨D-06⟩`                                            Propriété       **À        **À DÉCIDER**
                                                                    explicitement   DÉCIDER AU 
                                                                    portée par le   MLD**      
                                                                    MCD. Sa                    
                                                                    sémantique                 
                                                                    détaillée doit             
                                                                    respecter la               
                                                                    définition de              
                                                                    l'objet et les             
                                                                    RG du domaine.             

  `date_debut`                                                      Propriété       **À        **À DÉCIDER**
                                                                    explicitement   DÉCIDER AU 
                                                                    portée par le   MLD**      
                                                                    MCD. Sa                    
                                                                    sémantique                 
                                                                    détaillée doit             
                                                                    respecter la               
                                                                    définition de              
                                                                    l'objet et les             
                                                                    RG du domaine.             

  `date_fin`                                                        Propriété       **À        **À DÉCIDER**
                                                                    explicitement   DÉCIDER AU 
                                                                    portée par le   MLD**      
                                                                    MCD. Sa                    
                                                                    sémantique                 
                                                                    détaillée doit             
                                                                    respecter la               
                                                                    définition de              
                                                                    l'objet et les             
                                                                    RG du domaine.             

  `mode {manuel, assisté, automatique}`                             Propriété       **À        **À DÉCIDER**
                                                                    explicitement   DÉCIDER AU 
                                                                    portée par le   MLD**      
                                                                    MCD. Sa                    
                                                                    sémantique                 
                                                                    détaillée doit             
                                                                    respecter la               
                                                                    définition de              
                                                                    l'objet et les             
                                                                    RG du domaine.             

  `declenchement {explicite, planifié, automatique léger}`          Propriété       **À        **À DÉCIDER**
                                                                    explicitement   DÉCIDER AU 
                                                                    portée par le   MLD**      
                                                                    MCD. Sa                    
                                                                    sémantique                 
                                                                    détaillée doit             
                                                                    respecter la               
                                                                    définition de              
                                                                    l'objet et les             
                                                                    RG du domaine.             

  `moteur`                                                          Propriété       **À        **À DÉCIDER**
                                                                    explicitement   DÉCIDER AU 
                                                                    portée par le   MLD**      
                                                                    MCD. Sa                    
                                                                    sémantique                 
                                                                    détaillée doit             
                                                                    respecter la               
                                                                    définition de              
                                                                    l'objet et les             
                                                                    RG du domaine.             

  `version_moteur`                                                  Propriété       **À        **À DÉCIDER**
                                                                    explicitement   DÉCIDER AU 
                                                                    portée par le   MLD**      
                                                                    MCD. Sa                    
                                                                    sémantique                 
                                                                    détaillée doit             
                                                                    respecter la               
                                                                    définition de              
                                                                    l'objet et les             
                                                                    RG du domaine.             

  `parametres_decisifs`                                             Propriété       **À        **À DÉCIDER**
                                                                    explicitement   DÉCIDER AU 
                                                                    portée par le   MLD**      
                                                                    MCD. Sa                    
                                                                    sémantique                 
                                                                    détaillée doit             
                                                                    respecter la               
                                                                    définition de              
                                                                    l'objet et les             
                                                                    RG du domaine.             

  `ia_generative (booléen)`                                         Propriété       **À        **À DÉCIDER**
                                                                    explicitement   DÉCIDER AU 
                                                                    portée par le   MLD**      
                                                                    MCD. Sa                    
                                                                    sémantique                 
                                                                    détaillée doit             
                                                                    respecter la               
                                                                    définition de              
                                                                    l'objet et les             
                                                                    RG du domaine.             

  `intervention_humaine {aucune, examen, correction, validation}`   Propriété       **À        **À DÉCIDER**
                                                                    explicitement   DÉCIDER AU 
                                                                    portée par le   MLD**      
                                                                    MCD. Sa                    
                                                                    sémantique                 
                                                                    détaillée doit             
                                                                    respecter la               
                                                                    définition de              
                                                                    l'objet et les             
                                                                    RG du domaine.             

  `mode_lecture {assistée, indépendante/aveugle, sans objet}`       Propriété       **À        **À DÉCIDER**
                                                                    explicitement   DÉCIDER AU 
                                                                    portée par le   MLD**      
                                                                    MCD. Sa                    
                                                                    sémantique                 
                                                                    détaillée doit             
                                                                    respecter la               
                                                                    définition de              
                                                                    l'objet et les             
                                                                    RG du domaine.             
  ----------------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `PRODUIRE`              ACTIVITE (0,n) ---      ---
                          VERSION_OBJET (1,1)     

  `UTILISER_ENTREE`       ACTIVITE (0,n) ---      rôle de l'entrée
                          VERSION_OBJET (0,n)     

  `REALISER`              UTILISATEUR (0,n) ---   ---
                          ACTIVITE (0,1)          

  `APPLIQUER`             ACTIVITE (0,n) ---      version de méthode
                          METHODE (0,n)           
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## DEPENDANCE

**Définition.** Association porteuse : un objet aval dépend d'un objet
amont. Fonde la propagation des corrections.

**Nature :** Entité/structure conceptuelle non déclarée comme
spécialisation d'`OBJET`.

### Attributs / propriétés explicitement nommés

  ---------------------------------------------------------------------------------------------------------------------------------
  Propriété source                                                                          Définition au   Type      Obligatoire ?
                                                                                            stade           logique   
                                                                                            dictionnaire              
  ----------------------------------------------------------------------------------------- --------------- --------- -------------
  `#id_dependance`                                                                          Propriété       **À       **À DÉCIDER**
                                                                                            explicitement   DÉCIDER   
                                                                                            portée par le   AU MLD**  
                                                                                            MCD. Sa                   
                                                                                            sémantique                
                                                                                            détaillée doit            
                                                                                            respecter la              
                                                                                            définition de             
                                                                                            l'objet et les            
                                                                                            RG du domaine.            

  `type_dependance ⟨D-07⟩`                                                                  Propriété       **À       **À DÉCIDER**
                                                                                            explicitement   DÉCIDER   
                                                                                            portée par le   AU MLD**  
                                                                                            MCD. Sa                   
                                                                                            sémantique                
                                                                                            détaillée doit            
                                                                                            respecter la              
                                                                                            définition de             
                                                                                            l'objet et les            
                                                                                            RG du domaine.            

  `role_probatoire ⟨D-08⟩`                                                                  Propriété       **À       **À DÉCIDER**
                                                                                            explicitement   DÉCIDER   
                                                                                            portée par le   AU MLD**  
                                                                                            MCD. Sa                   
                                                                                            sémantique                
                                                                                            détaillée doit            
                                                                                            respecter la              
                                                                                            définition de             
                                                                                            l'objet et les            
                                                                                            RG du domaine.            

  `etat_impact {inchangé, potentiellement affecté, à réexaminer, invalidé, à recalculer}`   Propriété       **À       **À DÉCIDER**
                                                                                            explicitement   DÉCIDER   
                                                                                            portée par le   AU MLD**  
                                                                                            MCD. Sa                   
                                                                                            sémantique                
                                                                                            détaillée doit            
                                                                                            respecter la              
                                                                                            définition de             
                                                                                            l'objet et les            
                                                                                            RG du domaine.            

  `date_signalement`                                                                        Propriété       **À       **À DÉCIDER**
                                                                                            explicitement   DÉCIDER   
                                                                                            portée par le   AU MLD**  
                                                                                            MCD. Sa                   
                                                                                            sémantique                
                                                                                            détaillée doit            
                                                                                            respecter la              
                                                                                            définition de             
                                                                                            l'objet et les            
                                                                                            RG du domaine.            
  ---------------------------------------------------------------------------------------------------------------------------------

### Associations connues

  Association          Cardinalités conceptuelles                 Propriétés portées
  -------------------- ------------------------------------------ --------------------
  `DEPENDRE (aval)`    OBJET (0,n) --- DEPENDANCE (1,1)           ---
  `DEPENDRE (amont)`   OBJET (0,n) --- DEPENDANCE (1,1)           ---
  `UTILISER_VERSION`   VERSION_OBJET (0,n) --- DEPENDANCE (0,1)   ---

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## FILIATION

**Définition.** Association porteuse : un objet dérive d'une version
d'un autre objet, généralement dans un autre espace (contribution,
import, restauration).

**Nature :** Entité/structure conceptuelle non déclarée comme
spécialisation d'`OBJET`.

### Attributs / propriétés explicitement nommés

  -------------------------------------------------------------------------------------------------------------------------------------------------
  Propriété source                                                                                          Définition au   Type      Obligatoire ?
                                                                                                            stade           logique   
                                                                                                            dictionnaire              
  --------------------------------------------------------------------------------------------------------- --------------- --------- -------------
  `#id_filiation`                                                                                           Propriété       **À       **À DÉCIDER**
                                                                                                            explicitement   DÉCIDER   
                                                                                                            portée par le   AU MLD**  
                                                                                                            MCD. Sa                   
                                                                                                            sémantique                
                                                                                                            détaillée doit            
                                                                                                            respecter la              
                                                                                                            définition de             
                                                                                                            l'objet et les            
                                                                                                            RG du domaine.            

  `type_filiation {contribution, import, échange Tree↔Tree, restauration, réutilisation}`                   Propriété       **À       **À DÉCIDER**
                                                                                                            explicitement   DÉCIDER   
                                                                                                            portée par le   AU MLD**  
                                                                                                            MCD. Sa                   
                                                                                                            sémantique                
                                                                                                            détaillée doit            
                                                                                                            respecter la              
                                                                                                            définition de             
                                                                                                            l'objet et les            
                                                                                                            RG du domaine.            

  `etat_divergence {alignés, divergents, mise à jour proposée, mise à jour importée, divergence assumée}`   Propriété       **À       **À DÉCIDER**
                                                                                                            explicitement   DÉCIDER   
                                                                                                            portée par le   AU MLD**  
                                                                                                            MCD. Sa                   
                                                                                                            sémantique                
                                                                                                            détaillée doit            
                                                                                                            respecter la              
                                                                                                            définition de             
                                                                                                            l'objet et les            
                                                                                                            RG du domaine.            

  `date_constat`                                                                                            Propriété       **À       **À DÉCIDER**
                                                                                                            explicitement   DÉCIDER   
                                                                                                            portée par le   AU MLD**  
                                                                                                            MCD. Sa                   
                                                                                                            sémantique                
                                                                                                            détaillée doit            
                                                                                                            respecter la              
                                                                                                            définition de             
                                                                                                            l'objet et les            
                                                                                                            RG du domaine.            
  -------------------------------------------------------------------------------------------------------------------------------------------------

### Associations connues

  Association                Cardinalités conceptuelles                 Propriétés portées
  -------------------------- ------------------------------------------ --------------------
  `DERIVER (objet dérivé)`   OBJET (0,n) --- FILIATION (1,1)            ---
  `DERIVER (origine)`        VERSION_OBJET (0,n) --- FILIATION (1,1)    ---
  `RESULTER`                 OPERATION_FLUX (0,n) --- FILIATION (0,1)   ---

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## REFERENCE_PERSISTANTE

**Définition.** Lien profond durable vers un objet, éventuellement figé
sur une version et un fragment.

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -------------------------------------------------------------------------------------
  Propriété source                          Définition au   Type logique  Obligatoire ?
                                            stade                         
                                            dictionnaire                  
  ----------------------------------------- --------------- ------------- -------------
  `#id_reference`                           Propriété       **À DÉCIDER   **À DÉCIDER**
                                            explicitement   AU MLD**      
                                            portée par le                 
                                            MCD. Sa                       
                                            sémantique                    
                                            détaillée doit                
                                            respecter la                  
                                            définition de                 
                                            l'objet et les                
                                            RG du domaine.                

  `identifiant (persistant, résoluble)`     Propriété       **À DÉCIDER   **À DÉCIDER**
                                            explicitement   AU MLD**      
                                            portée par le                 
                                            MCD. Sa                       
                                            sémantique                    
                                            détaillée doit                
                                            respecter la                  
                                            définition de                 
                                            l'objet et les                
                                            RG du domaine.                

  `mode {courant, figé}`                    Propriété       **À DÉCIDER   **À DÉCIDER**
                                            explicitement   AU MLD**      
                                            portée par le                 
                                            MCD. Sa                       
                                            sémantique                    
                                            détaillée doit                
                                            respecter la                  
                                            définition de                 
                                            l'objet et les                
                                            RG du domaine.                

  `fragment (ligne, minute, coordonnées)`   Propriété       **À DÉCIDER   **À DÉCIDER**
                                            explicitement   AU MLD**      
                                            portée par le                 
                                            MCD. Sa                       
                                            sémantique                    
                                            détaillée doit                
                                            respecter la                  
                                            définition de                 
                                            l'objet et les                
                                            RG du domaine.                
  -------------------------------------------------------------------------------------

### Associations connues

  Association          Cardinalités conceptuelles                            Propriétés portées
  -------------------- ----------------------------------------------------- --------------------
  `VISER`              OBJET (0,n) --- REFERENCE_PERSISTANTE (1,1)           ---
  `FIGER_SUR`          VERSION_OBJET (0,n) --- REFERENCE_PERSISTANTE (0,1)   ---
  `POINTER_FRAGMENT`   ZONE (0,n) --- REFERENCE_PERSISTANTE (0,1)            ---

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## IDENTIFIANT_EXTERNE

**Définition.** Identifiant ou lien d'un objet dans un système tiers.

**Nature :** Entité/structure conceptuelle non déclarée comme
spécialisation d'`OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------------------------------------------------------
  Propriété source                                                                Définition au   Type      Obligatoire ?
                                                                                  stade           logique   
                                                                                  dictionnaire              
  ------------------------------------------------------------------------------- --------------- --------- -------------
  `#id_identifiant_externe`                                                       Propriété       **À       **À DÉCIDER**
                                                                                  explicitement   DÉCIDER   
                                                                                  portée par le   AU MLD**  
                                                                                  MCD. Sa                   
                                                                                  sémantique                
                                                                                  détaillée doit            
                                                                                  respecter la              
                                                                                  définition de             
                                                                                  l'objet et les            
                                                                                  RG du domaine.            

  `systeme`                                                                       Propriété       **À       **À DÉCIDER**
                                                                                  explicitement   DÉCIDER   
                                                                                  portée par le   AU MLD**  
                                                                                  MCD. Sa                   
                                                                                  sémantique                
                                                                                  détaillée doit            
                                                                                  respecter la              
                                                                                  définition de             
                                                                                  l'objet et les            
                                                                                  RG du domaine.            

  `valeur`                                                                        Propriété       **À       **À DÉCIDER**
                                                                                  explicitement   DÉCIDER   
                                                                                  portée par le   AU MLD**  
                                                                                  MCD. Sa                   
                                                                                  sémantique                
                                                                                  détaillée doit            
                                                                                  respecter la              
                                                                                  définition de             
                                                                                  l'objet et les            
                                                                                  RG du domaine.            

  `type {identifiant officiel, lien externe déclaré, correspondance candidate}`   Propriété       **À       **À DÉCIDER**
                                                                                  explicitement   DÉCIDER   
                                                                                  portée par le   AU MLD**  
                                                                                  MCD. Sa                   
                                                                                  sémantique                
                                                                                  détaillée doit            
                                                                                  respecter la              
                                                                                  définition de             
                                                                                  l'objet et les            
                                                                                  RG du domaine.            

  `statut {actif, obsolète, contesté}`                                            Propriété       **À       **À DÉCIDER**
                                                                                  explicitement   DÉCIDER   
                                                                                  portée par le   AU MLD**  
                                                                                  MCD. Sa                   
                                                                                  sémantique                
                                                                                  détaillée doit            
                                                                                  respecter la              
                                                                                  définition de             
                                                                                  l'objet et les            
                                                                                  RG du domaine.            

  `date_constat`                                                                  Propriété       **À       **À DÉCIDER**
                                                                                  explicitement   DÉCIDER   
                                                                                  portée par le   AU MLD**  
                                                                                  MCD. Sa                   
                                                                                  sémantique                
                                                                                  détaillée doit            
                                                                                  respecter la              
                                                                                  définition de             
                                                                                  l'objet et les            
                                                                                  RG du domaine.            
  -----------------------------------------------------------------------------------------------------------------------

### Associations connues

  Association        Cardinalités conceptuelles                  Propriétés portées
  ------------------ ------------------------------------------- --------------------
  `IDENTIFIER_EXT`   OBJET (0,n) --- IDENTIFIANT_EXTERNE (1,1)   ---

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## REFERENCE_INTER_ESPACE

**Définition.** Un espace utilise un objet ou une identité gouverné dans
un autre espace sans copie et sans transfert de connaissance.

**Nature :** association porteuse.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------
  Propriété source  Définition au     Type logique      Obligatoire ?
                    stade                               
                    dictionnaire                        
  ----------------- ----------------- ----------------- -----------------
  `date`            Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `motif`           Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `état courant`    Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         
  -----------------------------------------------------------------------

### Associations connues

Aucune association du tableau du domaine n'a été automatiquement
rattachée à ce nom ; vérifier les associations transversales du socle et
les consolidations canoniques.

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## ETAT_REFERENCE_EXTERNE

**Définition.** État temporel d'une référence externe.

**Nature :** historique.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------------------------------------------------------
  Propriété source                                                                Définition au   Type      Obligatoire ?
                                                                                  stade           logique   
                                                                                  dictionnaire              
  ------------------------------------------------------------------------------- --------------- --------- -------------
  `état {active, cible révisée, redirigée, retirée, inaccessible, non résolue}`   Propriété       **À       **À DÉCIDER**
                                                                                  explicitement   DÉCIDER   
                                                                                  portée par le   AU MLD**  
                                                                                  MCD. Sa                   
                                                                                  sémantique                
                                                                                  détaillée doit            
                                                                                  respecter la              
                                                                                  définition de             
                                                                                  l'objet et les            
                                                                                  RG du domaine.            

  `date`                                                                          Propriété       **À       **À DÉCIDER**
                                                                                  explicitement   DÉCIDER   
                                                                                  portée par le   AU MLD**  
                                                                                  MCD. Sa                   
                                                                                  sémantique                
                                                                                  détaillée doit            
                                                                                  respecter la              
                                                                                  définition de             
                                                                                  l'objet et les            
                                                                                  RG du domaine.            

  `motif`                                                                         Propriété       **À       **À DÉCIDER**
                                                                                  explicitement   DÉCIDER   
                                                                                  portée par le   AU MLD**  
                                                                                  MCD. Sa                   
                                                                                  sémantique                
                                                                                  détaillée doit            
                                                                                  respecter la              
                                                                                  définition de             
                                                                                  l'objet et les            
                                                                                  RG du domaine.            
  -----------------------------------------------------------------------------------------------------------------------

### Associations connues

Aucune association du tableau du domaine n'a été automatiquement
rattachée à ce nom ; vérifier les associations transversales du socle et
les consolidations canoniques.

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## DEPENDANCE_PRODUCTION

**Définition.** Ce qui a effectivement servi à produire un objet ou une
conclusion.

**Nature :** spécialisation de DEPENDANCE.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------
  Propriété source  Définition au     Type logique      Obligatoire ?
                    stade                               
                    dictionnaire                        
  ----------------- ----------------- ----------------- -----------------
  `rôle`            Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `version amont`   Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         
  -----------------------------------------------------------------------

### Associations connues

Aucune association du tableau du domaine n'a été automatiquement
rattachée à ce nom ; vérifier les associations transversales du socle et
les consolidations canoniques.

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## DEPENDANCE_JUSTIFICATION

**Définition.** Ce qui justifie actuellement une assertion,
interprétation ou conclusion.

**Nature :** spécialisation de DEPENDANCE.

### Attributs / propriétés explicitement nommés

  ----------------------------------------------------------------------
  Propriété source    Définition au    Type logique     Obligatoire ?
                      stade                             
                      dictionnaire                      
  ------------------- ---------------- ---------------- ----------------
  `rôle probatoire`   Propriété        **À DÉCIDER AU   **À DÉCIDER**
                      explicitement    MLD**            
                      portée par le                     
                      MCD. Sa                           
                      sémantique                        
                      détaillée doit                    
                      respecter la                      
                      définition de                     
                      l'objet et les                    
                      RG du domaine.                    

  `version amont`     Propriété        **À DÉCIDER AU   **À DÉCIDER**
                      explicitement    MLD**            
                      portée par le                     
                      MCD. Sa                           
                      sémantique                        
                      détaillée doit                    
                      respecter la                      
                      définition de                     
                      l'objet et les                    
                      RG du domaine.                    
  ----------------------------------------------------------------------

### Associations connues

Aucune association du tableau du domaine n'a été automatiquement
rattachée à ce nom ; vérifier les associations transversales du socle et
les consolidations canoniques.

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## DEPENDANCE_RAISONNEMENT

**Définition.** Arête du graphe logique permettant notamment la
détection de cycles.

**Nature :** spécialisation de DEPENDANCE.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------
  Propriété source  Définition au     Type logique      Obligatoire ?
                    stade                               
                    dictionnaire                        
  ----------------- ----------------- ----------------- -----------------
  `sens`            Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `nature`          Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         
  -----------------------------------------------------------------------

### Associations connues

Aucune association du tableau du domaine n'a été automatiquement
rattachée à ce nom ; vérifier les associations transversales du socle et
les consolidations canoniques.

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## BASE_JUSTIFICATIVE

**Définition.** Ensemble versionné des éléments actuellement invoqués
pour justifier une production scientifique.

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------
  Propriété source  Définition au     Type logique      Obligatoire ?
                    stade                               
                    dictionnaire                        
  ----------------- ----------------- ----------------- -----------------
  `portée`          Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `date`            Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `statut`          Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         
  -----------------------------------------------------------------------

### Associations connues

Aucune association du tableau du domaine n'a été automatiquement
rattachée à ce nom ; vérifier les associations transversales du socle et
les consolidations canoniques.

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## ACQUISITION_INFORMATION

**Définition.** Entrée d'une information dans GENIIUS par import,
saisie, transmission ou réutilisation.

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ------------------------------------------------------------------------
  Propriété source   Définition au     Type logique      Obligatoire ?
                     stade                               
                     dictionnaire                        
  ------------------ ----------------- ----------------- -----------------
  `mode`             Propriété         **À DÉCIDER AU    **À DÉCIDER**
                     explicitement     MLD**             
                     portée par le                       
                     MCD. Sa                             
                     sémantique                          
                     détaillée doit                      
                     respecter la                        
                     définition de                       
                     l'objet et les RG                   
                     du domaine.                         

  `date`             Propriété         **À DÉCIDER AU    **À DÉCIDER**
                     explicitement     MLD**             
                     portée par le                       
                     MCD. Sa                             
                     sémantique                          
                     détaillée doit                      
                     respecter la                        
                     définition de                       
                     l'objet et les RG                   
                     du domaine.                         

  `fournisseur`      Propriété         **À DÉCIDER AU    **À DÉCIDER**
                     explicitement     MLD**             
                     portée par le                       
                     MCD. Sa                             
                     sémantique                          
                     détaillée doit                      
                     respecter la                        
                     définition de                       
                     l'objet et les RG                   
                     du domaine.                         

  `lot`              Propriété         **À DÉCIDER AU    **À DÉCIDER**
                     explicitement     MLD**             
                     portée par le                       
                     MCD. Sa                             
                     sémantique                          
                     détaillée doit                      
                     respecter la                        
                     définition de                       
                     l'objet et les RG                   
                     du domaine.                         

  `transformation`   Propriété         **À DÉCIDER AU    **À DÉCIDER**
                     explicitement     MLD**             
                     portée par le                       
                     MCD. Sa                             
                     sémantique                          
                     détaillée doit                      
                     respecter la                        
                     définition de                       
                     l'objet et les RG                   
                     du domaine.                         
  ------------------------------------------------------------------------

### Associations connues

Aucune association du tableau du domaine n'a été automatiquement
rattachée à ce nom ; vérifier les associations transversales du socle et
les consolidations canoniques.

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## ACQUISITION_DOCUMENTAIRE

**Définition.** Acquisition d'un document/reproduction/fichier,
distincte de son origine historique.

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -------------------------------------------------------------------------
  Propriété source          Définition au   Type logique    Obligatoire ?
                            stade                           
                            dictionnaire                    
  ------------------------- --------------- --------------- ---------------
  `mode`                    Propriété       **À DÉCIDER AU  **À DÉCIDER**
                            explicitement   MLD**           
                            portée par le                   
                            MCD. Sa                         
                            sémantique                      
                            détaillée doit                  
                            respecter la                    
                            définition de                   
                            l'objet et les                  
                            RG du domaine.                  

  `date`                    Propriété       **À DÉCIDER AU  **À DÉCIDER**
                            explicitement   MLD**           
                            portée par le                   
                            MCD. Sa                         
                            sémantique                      
                            détaillée doit                  
                            respecter la                    
                            définition de                   
                            l'objet et les                  
                            RG du domaine.                  

  `détenteur/fournisseur`   Propriété       **À DÉCIDER AU  **À DÉCIDER**
                            explicitement   MLD**           
                            portée par le                   
                            MCD. Sa                         
                            sémantique                      
                            détaillée doit                  
                            respecter la                    
                            définition de                   
                            l'objet et les                  
                            RG du domaine.                  

  `conditions`              Propriété       **À DÉCIDER AU  **À DÉCIDER**
                            explicitement   MLD**           
                            portée par le                   
                            MCD. Sa                         
                            sémantique                      
                            détaillée doit                  
                            respecter la                    
                            définition de                   
                            l'objet et les                  
                            RG du domaine.                  
  -------------------------------------------------------------------------

### Associations connues

Aucune association du tableau du domaine n'a été automatiquement
rattachée à ce nom ; vérifier les associations transversales du socle et
les consolidations canoniques.

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## Associations --- domaine A

  ----------------------------------------------------------------------------------
  Association                             Cardinalités du MCD     Propriétés portées
  --------------------------------------- ----------------------- ------------------
  `CONTENIR (lieu de production)`         ESPACE (0,n) --- OBJET  ---
                                          (1,1)                   

  `REFERENCER (contexte d’utilisation)`   ESPACE (0,n) --- OBJET  date, motif
                                          (0,n)                   

  `AVOIR_VERSION`                         OBJET (1,n) ---         ---
                                          VERSION_OBJET (1,1)     

  `PRECEDER`                              VERSION_OBJET (0,1) --- ---
                                          VERSION_OBJET (0,1)     

  `PRODUIRE`                              ACTIVITE (0,n) ---      ---
                                          VERSION_OBJET (1,1)     

  `UTILISER_ENTREE`                       ACTIVITE (0,n) ---      rôle de l'entrée
                                          VERSION_OBJET (0,n)     

  `REALISER`                              UTILISATEUR (0,n) ---   ---
                                          ACTIVITE (0,1)          

  `APPLIQUER`                             ACTIVITE (0,n) ---      version de méthode
                                          METHODE (0,n)           

  `DEPENDRE (aval)`                       OBJET (0,n) ---         ---
                                          DEPENDANCE (1,1)        

  `DEPENDRE (amont)`                      OBJET (0,n) ---         ---
                                          DEPENDANCE (1,1)        

  `UTILISER_VERSION`                      VERSION_OBJET (0,n) --- ---
                                          DEPENDANCE (0,1)        

  `DERIVER (objet dérivé)`                OBJET (0,n) ---         ---
                                          FILIATION (1,1)         

  `DERIVER (origine)`                     VERSION_OBJET (0,n) --- ---
                                          FILIATION (1,1)         

  `RESULTER`                              OPERATION_FLUX (0,n)    ---
                                          --- FILIATION (0,1)     

  `VISER`                                 OBJET (0,n) ---         ---
                                          REFERENCE_PERSISTANTE   
                                          (1,1)                   

  `FIGER_SUR`                             VERSION_OBJET (0,n) --- ---
                                          REFERENCE_PERSISTANTE   
                                          (0,1)                   

  `POINTER_FRAGMENT`                      ZONE (0,n) ---          ---
                                          REFERENCE_PERSISTANTE   
                                          (0,1)                   

  `IDENTIFIER_EXT`                        OBJET (0,n) ---         ---
                                          IDENTIFIANT_EXTERNE     
                                          (1,1)                   
  ----------------------------------------------------------------------------------

## Règles de gestion --- domaine A

# Domaine B --- Espaces, comptes, droits, gouvernance

**Couverture : 26 entités/objets, 18 associations, 0 règles RG.**

## UTILISATEUR

**Définition.** Compte. Distinct de toute PERSONNE historique (§ 67).

**Nature :** Entité/structure conceptuelle non déclarée comme
spécialisation d'`OBJET`.

### Attributs / propriétés explicitement nommés

  --------------------------------------------------------------------------------------------------------
  Propriété source                                                Définition au   Type       Obligatoire ?
                                                                  stade           logique    
                                                                  dictionnaire               
  --------------------------------------------------------------- --------------- ---------- -------------
  `#id_utilisateur`                                               Propriété       **À        **À DÉCIDER**
                                                                  explicitement   DÉCIDER AU 
                                                                  portée par le   MLD**      
                                                                  MCD. Sa                    
                                                                  sémantique                 
                                                                  détaillée doit             
                                                                  respecter la               
                                                                  définition de              
                                                                  l'objet et les             
                                                                  RG du domaine.             

  `identite_civile (interne)`                                     Propriété       **À        **À DÉCIDER**
                                                                  explicitement   DÉCIDER AU 
                                                                  portée par le   MLD**      
                                                                  MCD. Sa                    
                                                                  sémantique                 
                                                                  détaillée doit             
                                                                  respecter la               
                                                                  définition de              
                                                                  l'objet et les             
                                                                  RG du domaine.             

  `email`                                                         Propriété       **À        **À DÉCIDER**
                                                                  explicitement   DÉCIDER AU 
                                                                  portée par le   MLD**      
                                                                  MCD. Sa                    
                                                                  sémantique                 
                                                                  détaillée doit             
                                                                  respecter la               
                                                                  définition de              
                                                                  l'objet et les             
                                                                  RG du domaine.             

  `niveau_verification_identite {aucun, standard, renforcé}`      Propriété       **À        **À DÉCIDER**
                                                                  explicitement   DÉCIDER AU 
                                                                  portée par le   MLD**      
                                                                  MCD. Sa                    
                                                                  sémantique                 
                                                                  détaillée doit             
                                                                  respecter la               
                                                                  définition de              
                                                                  l'objet et les             
                                                                  RG du domaine.             

  `mode_affichage_public {nom réel, pseudonyme stable, masqué}`   Propriété       **À        **À DÉCIDER**
                                                                  explicitement   DÉCIDER AU 
                                                                  portée par le   MLD**      
                                                                  MCD. Sa                    
                                                                  sémantique                 
                                                                  détaillée doit             
                                                                  respecter la               
                                                                  définition de              
                                                                  l'objet et les             
                                                                  RG du domaine.             

  `pseudonyme`                                                    Propriété       **À        **À DÉCIDER**
                                                                  explicitement   DÉCIDER AU 
                                                                  portée par le   MLD**      
                                                                  MCD. Sa                    
                                                                  sémantique                 
                                                                  détaillée doit             
                                                                  respecter la               
                                                                  définition de              
                                                                  l'objet et les             
                                                                  RG du domaine.             

  `categories_sollicitation_acceptees`                            Propriété       **À        **À DÉCIDER**
                                                                  explicitement   DÉCIDER AU 
                                                                  portée par le   MLD**      
                                                                  MCD. Sa                    
                                                                  sémantique                 
                                                                  détaillée doit             
                                                                  respecter la               
                                                                  définition de              
                                                                  l'objet et les             
                                                                  RG du domaine.             

  `date_inscription`                                              Propriété       **À        **À DÉCIDER**
                                                                  explicitement   DÉCIDER AU 
                                                                  portée par le   MLD**      
                                                                  MCD. Sa                    
                                                                  sémantique                 
                                                                  détaillée doit             
                                                                  respecter la               
                                                                  définition de              
                                                                  l'objet et les             
                                                                  RG du domaine.             

  `etat_compte`                                                   Propriété       **À        **À DÉCIDER**
                                                                  explicitement   DÉCIDER AU 
                                                                  portée par le   MLD**      
                                                                  MCD. Sa                    
                                                                  sémantique                 
                                                                  détaillée doit             
                                                                  respecter la               
                                                                  définition de              
                                                                  l'objet et les             
                                                                  RG du domaine.             
  --------------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `APPARTENIR`            UTILISATEUR (0,n) ---   role_espace
                          ESPACE (0,n)            {propriétaire,
                                                  administrateur,
                                                  responsable
                                                  scientifique,
                                                  collaborateur, invité,
                                                  lecteur}, date_debut,
                                                  date_fin

  `ATTRIBUER_ROLE`        UTILISATEUR (0,n) ---   role_gouvernance
                          ESPACE (0,n)            {contributeur,
                                                  validateur, référent
                                                  communautaire,
                                                  modérateur,
                                                  administrateur
                                                  technique}, procedure,
                                                  date, domaine (→
                                                  DOMAINE_EXPERTISE)

  `MEMBRE_GROUPE`         UTILISATEUR (0,n) ---   date_debut, date_fin
                          GROUPE (0,n)            

  `BENEFICIER`            REGLE_ACCES (1,1) ---   ---
                          UTILISATEUR (0,n) ou    
                          GROUPE (0,n) ; aucun si 
                          public                  

  `EXPRIMER`              UTILISATEUR (0,n) ---   ---
                          VOLONTE_NUMERIQUE (1,1) 

  `REVENDIQUER`           UTILISATEUR (0,n) ---   ---
                          REVENDICATION (1,1) --- 
                          PERSONNE (0,n)          

  `TRANSFERER`            ESPACE (0,n) ---        ---
                          TRANSFERT_GOUVERNANCE   
                          (1,1) ; cédant          
                          UTILISATEUR (0,n) ---   
                          (1,1) ; cessionnaire    
                          UTILISATEUR (0,n) ---   
                          (1,1)                   

  `DESIGNER`              DESIGNATION_GARDE (1,1) ---
                          --- OBJET (0,n) ;       
                          désigné UTILISATEUR     
                          (0,n) --- (0,1) ou      
                          PERSONNE (0,n) ---      
                          (0,1) (destinataire     
                          futur)                  

  `DECLARER_INTERET`      UTILISATEUR (0,n) ---   ---
                          LIEN_INTERET (1,1) ---  
                          OBJET (0,n)             

  `SOUSCRIRE`             UTILISATEUR (0,n) ou    ---
                          ESPACE (0,n) ---        
                          ABONNEMENT (1,1)        

  `BLOQUER`               UTILISATEUR (0,n) ---   date
                          UTILISATEUR (0,n)       
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## ESPACE

**Définition.** Régime de gouvernance dans lequel vivent des objets. Le
Core partagé et la publication publique sont des espaces.

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -------------------------------------------------------------------------
  Propriété source       Définition au    Type logique     Obligatoire ?
                         stade                             
                         dictionnaire                      
  ---------------------- ---------------- ---------------- ----------------
  `type_espace ⟨D-09⟩`   Propriété        **À DÉCIDER AU   **À DÉCIDER**
                         explicitement    MLD**            
                         portée par le                     
                         MCD. Sa                           
                         sémantique                        
                         détaillée doit                    
                         respecter la                      
                         définition de                     
                         l'objet et les                    
                         RG du domaine.                    

  `nom`                  Propriété        **À DÉCIDER AU   **À DÉCIDER**
                         explicitement    MLD**            
                         portée par le                     
                         MCD. Sa                           
                         sémantique                        
                         détaillée doit                    
                         respecter la                      
                         définition de                     
                         l'objet et les                    
                         RG du domaine.                    

  `regime_gouvernance`   Propriété        **À DÉCIDER AU   **À DÉCIDER**
                         explicitement    MLD**            
                         portée par le                     
                         MCD. Sa                           
                         sémantique                        
                         détaillée doit                    
                         respecter la                      
                         définition de                     
                         l'objet et les                    
                         RG du domaine.                    

  `date_creation`        Propriété        **À DÉCIDER AU   **À DÉCIDER**
                         explicitement    MLD**            
                         portée par le                     
                         MCD. Sa                           
                         sémantique                        
                         détaillée doit                    
                         respecter la                      
                         définition de                     
                         l'objet et les                    
                         RG du domaine.                    
  -------------------------------------------------------------------------

### Associations connues

  -------------------------------------------------------------------------------------
  Association                              Cardinalités            Propriétés portées
                                           conceptuelles           
  ---------------------------------------- ----------------------- --------------------
  `APPARTENIR`                             UTILISATEUR (0,n) ---   role_espace
                                           ESPACE (0,n)            {propriétaire,
                                                                   administrateur,
                                                                   responsable
                                                                   scientifique,
                                                                   collaborateur,
                                                                   invité, lecteur},
                                                                   date_debut, date_fin

  `ATTRIBUER_ROLE`                         UTILISATEUR (0,n) ---   role_gouvernance
                                           ESPACE (0,n)            {contributeur,
                                                                   validateur, référent
                                                                   communautaire,
                                                                   modérateur,
                                                                   administrateur
                                                                   technique},
                                                                   procedure, date,
                                                                   domaine (→
                                                                   DOMAINE_EXPERTISE)

  `PORTER_SUR_OBJET / PORTER_SUR_ESPACE`   REGLE_ACCES (1,1) ---   ---
                                           OBJET (0,n) ou ESPACE   
                                           (0,n)                   

  `CONSENTIR`                              PERSONNE (0,n) ---      ---
                                           CONSENTEMENT (1,1) ;    
                                           CONSENTEMENT (0,1) ---  
                                           OBJET (0,n) ou ESPACE   
                                           (0,n)                   

  `TRANSFERER`                             ESPACE (0,n) ---        ---
                                           TRANSFERT_GOUVERNANCE   
                                           (1,1) ; cédant          
                                           UTILISATEUR (0,n) ---   
                                           (1,1) ; cessionnaire    
                                           UTILISATEUR (0,n) ---   
                                           (1,1)                   

  `SOUSCRIRE`                              UTILISATEUR (0,n) ou    ---
                                           ESPACE (0,n) ---        
                                           ABONNEMENT (1,1)        
  -------------------------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## PROJET

**Définition.** ⊂ ESPACE. Projet de recherche ou de mémoire (cf. domaine
K).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------
  Propriété source  Définition au     Type logique      Obligatoire ?
                    stade                               
                    dictionnaire                        
  ----------------- ----------------- ----------------- -----------------
  `voir § 14`       Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  -----------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `FINANCER`              PROJET (0,n) ---        ---
                          FINANCEMENT (1,1) ;     
                          FINANCEMENT (0,1) ---   
                          ORGANISATION (0,n)      

  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## COMMUNAUTE

**Définition.** ⊂ ESPACE. Espace de coopération autour d'un objet
historique, documentaire ou méthodologique (§ 57).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------
  Propriété source        Définition au   Type logique    Obligatoire ?
                          stade                           
                          dictionnaire                    
  ----------------------- --------------- --------------- ---------------
  `objet_focal (texte)`   Propriété       **À DÉCIDER AU  **À DÉCIDER**
                          explicitement   MLD**           
                          portée par le                   
                          MCD. Sa                         
                          sémantique                      
                          détaillée doit                  
                          respecter la                    
                          définition de                   
                          l'objet et les                  
                          RG du domaine.                  

  `charte`                Propriété       **À DÉCIDER AU  **À DÉCIDER**
                          explicitement   MLD**           
                          portée par le                   
                          MCD. Sa                         
                          sémantique                      
                          détaillée doit                  
                          respecter la                    
                          définition de                   
                          l'objet et les                  
                          RG du domaine.                  
  -----------------------------------------------------------------------

### Associations connues

Aucune association du tableau du domaine n'a été automatiquement
rattachée à ce nom ; vérifier les associations transversales du socle et
les consolidations canoniques.

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## ESPACE_ORGANISATION

**Définition.** ⊂ ESPACE. Structure adhérente : association,
laboratoire, service d'archives, collectivité, entreprise, cabinet (§
65).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------
  Propriété source     Définition au    Type logique     Obligatoire ?
                       stade                             
                       dictionnaire                      
  -------------------- ---------------- ---------------- ----------------
  `nature_structure`   Propriété        **À DÉCIDER AU   **À DÉCIDER**
                       explicitement    MLD**            
                       portée par le                     
                       MCD. Sa                           
                       sémantique                        
                       détaillée doit                    
                       respecter la                      
                       définition de                     
                       l'objet et les                    
                       RG du domaine.                    

  `forme_juridique`    Propriété        **À DÉCIDER AU   **À DÉCIDER**
                       explicitement    MLD**            
                       portée par le                     
                       MCD. Sa                           
                       sémantique                        
                       détaillée doit                    
                       respecter la                      
                       définition de                     
                       l'objet et les                    
                       RG du domaine.                    
  -----------------------------------------------------------------------

### Associations connues

Aucune association du tableau du domaine n'a été automatiquement
rattachée à ce nom ; vérifier les associations transversales du socle et
les consolidations canoniques.

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## GROUPE

**Définition.** Ensemble nommé d'utilisateurs : famille, cercle invité,
équipe. Sert aux droits et à l'indépendance des validateurs.

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -------------------------------------------------------------------------------------------------
  Propriété source                                        Définition au   Type        Obligatoire ?
                                                          stade           logique     
                                                          dictionnaire                
  ------------------------------------------------------- --------------- ----------- -------------
  `nom`                                                   Propriété       **À DÉCIDER **À DÉCIDER**
                                                          explicitement   AU MLD**    
                                                          portée par le               
                                                          MCD. Sa                     
                                                          sémantique                  
                                                          détaillée doit              
                                                          respecter la                
                                                          définition de               
                                                          l'objet et les              
                                                          RG du domaine.              

  `type_groupe {famille, cercle invité, équipe, autre}`   Propriété       **À DÉCIDER **À DÉCIDER**
                                                          explicitement   AU MLD**    
                                                          portée par le               
                                                          MCD. Sa                     
                                                          sémantique                  
                                                          détaillée doit              
                                                          respecter la                
                                                          définition de               
                                                          l'objet et les              
                                                          RG du domaine.              
  -------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `MEMBRE_GROUPE`         UTILISATEUR (0,n) ---   date_debut, date_fin
                          GROUPE (0,n)            

  `BENEFICIER`            REGLE_ACCES (1,1) ---   ---
                          UTILISATEUR (0,n) ou    
                          GROUPE (0,n) ; aucun si 
                          public                  
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## REGLE_ACCES

**Définition.** Permission granulaire : qui peut faire quoi, sur quelle
portée, pour combien de temps (§ 62).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------------------------------------------
  Propriété source                                                   Définition au   Type       Obligatoire ?
                                                                     stade           logique    
                                                                     dictionnaire               
  ------------------------------------------------------------------ --------------- ---------- -------------
  `action ⟨D-10⟩`                                                    Propriété       **À        **À DÉCIDER**
                                                                     explicitement   DÉCIDER AU 
                                                                     portée par le   MLD**      
                                                                     MCD. Sa                    
                                                                     sémantique                 
                                                                     détaillée doit             
                                                                     respecter la               
                                                                     définition de              
                                                                     l'objet et les             
                                                                     RG du domaine.             

  `type_beneficiaire {utilisateur, groupe, rôle d’espace, public}`   Propriété       **À        **À DÉCIDER**
                                                                     explicitement   DÉCIDER AU 
                                                                     portée par le   MLD**      
                                                                     MCD. Sa                    
                                                                     sémantique                 
                                                                     détaillée doit             
                                                                     respecter la               
                                                                     définition de              
                                                                     l'objet et les             
                                                                     RG du domaine.             

  `date_debut`                                                       Propriété       **À        **À DÉCIDER**
                                                                     explicitement   DÉCIDER AU 
                                                                     portée par le   MLD**      
                                                                     MCD. Sa                    
                                                                     sémantique                 
                                                                     détaillée doit             
                                                                     respecter la               
                                                                     définition de              
                                                                     l'objet et les             
                                                                     RG du domaine.             

  `date_fin`                                                         Propriété       **À        **À DÉCIDER**
                                                                     explicitement   DÉCIDER AU 
                                                                     portée par le   MLD**      
                                                                     MCD. Sa                    
                                                                     sémantique                 
                                                                     détaillée doit             
                                                                     respecter la               
                                                                     définition de              
                                                                     l'objet et les             
                                                                     RG du domaine.             

  `condition`                                                        Propriété       **À        **À DÉCIDER**
                                                                     explicitement   DÉCIDER AU 
                                                                     portée par le   MLD**      
                                                                     MCD. Sa                    
                                                                     sémantique                 
                                                                     détaillée doit             
                                                                     respecter la               
                                                                     définition de              
                                                                     l'objet et les             
                                                                     RG du domaine.             

  `sensibilite`                                                      Propriété       **À        **À DÉCIDER**
                                                                     explicitement   DÉCIDER AU 
                                                                     portée par le   MLD**      
                                                                     MCD. Sa                    
                                                                     sémantique                 
                                                                     détaillée doit             
                                                                     respecter la               
                                                                     définition de              
                                                                     l'objet et les             
                                                                     RG du domaine.             
  -----------------------------------------------------------------------------------------------------------

### Associations connues

  ------------------------------------------------------------------------------
  Association                              Cardinalités       Propriétés portées
                                           conceptuelles      
  ---------------------------------------- ------------------ ------------------
  `PORTER_SUR_OBJET / PORTER_SUR_ESPACE`   REGLE_ACCES (1,1)  ---
                                           --- OBJET (0,n) ou 
                                           ESPACE (0,n)       

  `BENEFICIER`                             REGLE_ACCES (1,1)  ---
                                           --- UTILISATEUR    
                                           (0,n) ou GROUPE    
                                           (0,n) ; aucun si   
                                           public             
  ------------------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## LICENCE

**Définition.** Référentiel de licences, appliquées par composant (§
80).

**Nature :** Entité/structure conceptuelle non déclarée comme
spécialisation d'`OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------
  Propriété source        Définition au   Type logique    Obligatoire ?
                          stade                           
                          dictionnaire                    
  ----------------------- --------------- --------------- ---------------
  `#code_licence`         Propriété       **À DÉCIDER AU  **À DÉCIDER**
                          explicitement   MLD**           
                          portée par le                   
                          MCD. Sa                         
                          sémantique                      
                          détaillée doit                  
                          respecter la                    
                          définition de                   
                          l'objet et les                  
                          RG du domaine.                  

  `libelle`               Propriété       **À DÉCIDER AU  **À DÉCIDER**
                          explicitement   MLD**           
                          portée par le                   
                          MCD. Sa                         
                          sémantique                      
                          détaillée doit                  
                          respecter la                    
                          définition de                   
                          l'objet et les                  
                          RG du domaine.                  

  `redistribution`        Propriété       **À DÉCIDER AU  **À DÉCIDER**
                          explicitement   MLD**           
                          portée par le                   
                          MCD. Sa                         
                          sémantique                      
                          détaillée doit                  
                          respecter la                    
                          définition de                   
                          l'objet et les                  
                          RG du domaine.                  

  `modification`          Propriété       **À DÉCIDER AU  **À DÉCIDER**
                          explicitement   MLD**           
                          portée par le                   
                          MCD. Sa                         
                          sémantique                      
                          détaillée doit                  
                          respecter la                    
                          définition de                   
                          l'objet et les                  
                          RG du domaine.                  

  `usage_commercial`      Propriété       **À DÉCIDER AU  **À DÉCIDER**
                          explicitement   MLD**           
                          portée par le                   
                          MCD. Sa                         
                          sémantique                      
                          détaillée doit                  
                          respecter la                    
                          définition de                   
                          l'objet et les                  
                          RG du domaine.                  

  `attribution_requise`   Propriété       **À DÉCIDER AU  **À DÉCIDER**
                          explicitement   MLD**           
                          portée par le                   
                          MCD. Sa                         
                          sémantique                      
                          détaillée doit                  
                          respecter la                    
                          définition de                   
                          l'objet et les                  
                          RG du domaine.                  
  -----------------------------------------------------------------------

### Associations connues

  Association      Cardinalités conceptuelles      Propriétés portées
  ---------------- ------------------------------- --------------------
  `SOUS_LICENCE`   OBJET (0,1) --- LICENCE (0,n)   ---

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## EMBARGO

**Définition.** Restriction temporaire ou conditionnelle.

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  --------------------------------------------------------------------------------------------------------------
  Propriété source                                                      Définition au   Type       Obligatoire ?
                                                                        stade           logique    
                                                                        dictionnaire               
  --------------------------------------------------------------------- --------------- ---------- -------------
  `portee {média, transcription, information, usage, existence même}`   Propriété       **À        **À DÉCIDER**
                                                                        explicitement   DÉCIDER AU 
                                                                        portée par le   MLD**      
                                                                        MCD. Sa                    
                                                                        sémantique                 
                                                                        détaillée doit             
                                                                        respecter la               
                                                                        définition de              
                                                                        l'objet et les             
                                                                        RG du domaine.             

  `date_fin`                                                            Propriété       **À        **À DÉCIDER**
                                                                        explicitement   DÉCIDER AU 
                                                                        portée par le   MLD**      
                                                                        MCD. Sa                    
                                                                        sémantique                 
                                                                        détaillée doit             
                                                                        respecter la               
                                                                        définition de              
                                                                        l'objet et les             
                                                                        RG du domaine.             

  `condition_levee`                                                     Propriété       **À        **À DÉCIDER**
                                                                        explicitement   DÉCIDER AU 
                                                                        portée par le   MLD**      
                                                                        MCD. Sa                    
                                                                        sémantique                 
                                                                        détaillée doit             
                                                                        respecter la               
                                                                        définition de              
                                                                        l'objet et les             
                                                                        RG du domaine.             

  `motif`                                                               Propriété       **À        **À DÉCIDER**
                                                                        explicitement   DÉCIDER AU 
                                                                        portée par le   MLD**      
                                                                        MCD. Sa                    
                                                                        sémantique                 
                                                                        détaillée doit             
                                                                        respecter la               
                                                                        définition de              
                                                                        l'objet et les             
                                                                        RG du domaine.             

  `statut {actif, levé, expiré}`                                        Propriété       **À        **À DÉCIDER**
                                                                        explicitement   DÉCIDER AU 
                                                                        portée par le   MLD**      
                                                                        MCD. Sa                    
                                                                        sémantique                 
                                                                        détaillée doit             
                                                                        respecter la               
                                                                        définition de              
                                                                        l'objet et les             
                                                                        RG du domaine.             
  --------------------------------------------------------------------------------------------------------------

### Associations connues

  Association     Cardinalités conceptuelles      Propriétés portées
  --------------- ------------------------------- --------------------
  `RESTREINDRE`   OBJET (0,n) --- EMBARGO (1,1)   ---

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## CLASSIFICATION

**Définition.** Référentiel des catégories de données (§ 96) qui
alimente droits, export, IA, partage.

**Nature :** Entité/structure conceptuelle non déclarée comme
spécialisation d'`OBJET`.

### Attributs / propriétés explicitement nommés

  ------------------------------------------------------------------------
  Propriété source         Définition au   Type logique    Obligatoire ?
                           stade                           
                           dictionnaire                    
  ------------------------ --------------- --------------- ---------------
  `#code_classification`   Propriété       **À DÉCIDER AU  **À DÉCIDER**
                           explicitement   MLD**           
                           portée par le                   
                           MCD. Sa                         
                           sémantique                      
                           détaillée doit                  
                           respecter la                    
                           définition de                   
                           l'objet et les                  
                           RG du domaine.                  

  `libelle`                Propriété       **À DÉCIDER AU  **À DÉCIDER**
                           explicitement   MLD**           
                           portée par le                   
                           MCD. Sa                         
                           sémantique                      
                           détaillée doit                  
                           respecter la                    
                           définition de                   
                           l'objet et les                  
                           RG du domaine.                  
  ------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `CLASSER`               OBJET (0,n) ---         origine {déclarée,
                          CLASSIFICATION (0,n)    déduite}

  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## MASQUAGE

**Définition.** Transformation de protection d'un objet (§ 70).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ----------------------------------------------------------------------------------------------
  Propriété source                                     Définition au   Type        Obligatoire ?
                                                       stade           logique     
                                                       dictionnaire                
  ---------------------------------------------------- --------------- ----------- -------------
  `type {masquage, pseudonymisation, anonymisation}`   Propriété       **À DÉCIDER **À DÉCIDER**
                                                       explicitement   AU MLD**    
                                                       portée par le               
                                                       MCD. Sa                     
                                                       sémantique                  
                                                       détaillée doit              
                                                       respecter la                
                                                       définition de               
                                                       l'objet et les              
                                                       RG du domaine.              

  `pseudonyme_attribue`                                Propriété       **À DÉCIDER **À DÉCIDER**
                                                       explicitement   AU MLD**    
                                                       portée par le               
                                                       MCD. Sa                     
                                                       sémantique                  
                                                       détaillée doit              
                                                       respecter la                
                                                       définition de               
                                                       l'objet et les              
                                                       RG du domaine.              

  `perimetre`                                          Propriété       **À DÉCIDER **À DÉCIDER**
                                                       explicitement   AU MLD**    
                                                       portée par le               
                                                       MCD. Sa                     
                                                       sémantique                  
                                                       détaillée doit              
                                                       respecter la                
                                                       définition de               
                                                       l'objet et les              
                                                       RG du domaine.              

  `date`                                               Propriété       **À DÉCIDER **À DÉCIDER**
                                                       explicitement   AU MLD**    
                                                       portée par le               
                                                       MCD. Sa                     
                                                       sémantique                  
                                                       détaillée doit              
                                                       respecter la                
                                                       définition de               
                                                       l'objet et les              
                                                       RG du domaine.              
  ----------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `MASQUER`               OBJET (0,n) ---         ---
                          MASQUAGE (1,1)          
                          (original) ; OBJET      
                          (0,1) --- MASQUAGE      
                          (0,1) (version          
                          publique)               

  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## CONSENTEMENT

**Définition.** Consentement explicite, versionné, horodaté (§ 24.16, §
72).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  --------------------------------------------------------------------------------------------------------------------------------------------------------
  Propriété source                                                                                                 Définition au   Type      Obligatoire ?
                                                                                                                   stade           logique   
                                                                                                                   dictionnaire              
  ---------------------------------------------------------------------------------------------------------------- --------------- --------- -------------
  `portee {enregistrement, transcription, usage familial, usage projet, publication, usage posthume, biométrie}`   Propriété       **À       **À DÉCIDER**
                                                                                                                   explicitement   DÉCIDER   
                                                                                                                   portée par le   AU MLD**  
                                                                                                                   MCD. Sa                   
                                                                                                                   sémantique                
                                                                                                                   détaillée doit            
                                                                                                                   respecter la              
                                                                                                                   définition de             
                                                                                                                   l'objet et les            
                                                                                                                   RG du domaine.            

  `decision {accordé, refusé, retiré}`                                                                             Propriété       **À       **À DÉCIDER**
                                                                                                                   explicitement   DÉCIDER   
                                                                                                                   portée par le   AU MLD**  
                                                                                                                   MCD. Sa                   
                                                                                                                   sémantique                
                                                                                                                   détaillée doit            
                                                                                                                   respecter la              
                                                                                                                   définition de             
                                                                                                                   l'objet et les            
                                                                                                                   RG du domaine.            

  `texte_version`                                                                                                  Propriété       **À       **À DÉCIDER**
                                                                                                                   explicitement   DÉCIDER   
                                                                                                                   portée par le   AU MLD**  
                                                                                                                   MCD. Sa                   
                                                                                                                   sémantique                
                                                                                                                   détaillée doit            
                                                                                                                   respecter la              
                                                                                                                   définition de             
                                                                                                                   l'objet et les            
                                                                                                                   RG du domaine.            

  `horodatage`                                                                                                     Propriété       **À       **À DÉCIDER**
                                                                                                                   explicitement   DÉCIDER   
                                                                                                                   portée par le   AU MLD**  
                                                                                                                   MCD. Sa                   
                                                                                                                   sémantique                
                                                                                                                   détaillée doit            
                                                                                                                   respecter la              
                                                                                                                   définition de             
                                                                                                                   l'objet et les            
                                                                                                                   RG du domaine.            

  `mode_recueil`                                                                                                   Propriété       **À       **À DÉCIDER**
                                                                                                                   explicitement   DÉCIDER   
                                                                                                                   portée par le   AU MLD**  
                                                                                                                   MCD. Sa                   
                                                                                                                   sémantique                
                                                                                                                   détaillée doit            
                                                                                                                   respecter la              
                                                                                                                   définition de             
                                                                                                                   l'objet et les            
                                                                                                                   RG du domaine.            
  --------------------------------------------------------------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `CONSENTIR`             PERSONNE (0,n) ---      ---
                          CONSENTEMENT (1,1) ;    
                          CONSENTEMENT (0,1) ---  
                          OBJET (0,n) ou ESPACE   
                          (0,n)                   

  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## VOLONTE_NUMERIQUE

**Définition.** Volonté d'un utilisateur sur ses contenus, par catégorie
ou projet (§ 72).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ------------------------------------------------------------------------------------------------------------------------------------------
  Propriété source                                                                                   Définition au   Type      Obligatoire ?
                                                                                                     stade           logique   
                                                                                                     dictionnaire              
  -------------------------------------------------------------------------------------------------- --------------- --------- -------------
  `action {conserver, transmettre, publier, remettre, supprimer, transmettre les enregistrements}`   Propriété       **À       **À DÉCIDER**
                                                                                                     explicitement   DÉCIDER   
                                                                                                     portée par le   AU MLD**  
                                                                                                     MCD. Sa                   
                                                                                                     sémantique                
                                                                                                     détaillée doit            
                                                                                                     respecter la              
                                                                                                     définition de             
                                                                                                     l'objet et les            
                                                                                                     RG du domaine.            

  `perimetre`                                                                                        Propriété       **À       **À DÉCIDER**
                                                                                                     explicitement   DÉCIDER   
                                                                                                     portée par le   AU MLD**  
                                                                                                     MCD. Sa                   
                                                                                                     sémantique                
                                                                                                     détaillée doit            
                                                                                                     respecter la              
                                                                                                     définition de             
                                                                                                     l'objet et les            
                                                                                                     RG du domaine.            

  `beneficiaire`                                                                                     Propriété       **À       **À DÉCIDER**
                                                                                                     explicitement   DÉCIDER   
                                                                                                     portée par le   AU MLD**  
                                                                                                     MCD. Sa                   
                                                                                                     sémantique                
                                                                                                     détaillée doit            
                                                                                                     respecter la              
                                                                                                     définition de             
                                                                                                     l'objet et les            
                                                                                                     RG du domaine.            

  `condition_declenchement`                                                                          Propriété       **À       **À DÉCIDER**
                                                                                                     explicitement   DÉCIDER   
                                                                                                     portée par le   AU MLD**  
                                                                                                     MCD. Sa                   
                                                                                                     sémantique                
                                                                                                     détaillée doit            
                                                                                                     respecter la              
                                                                                                     définition de             
                                                                                                     l'objet et les            
                                                                                                     RG du domaine.            
  ------------------------------------------------------------------------------------------------------------------------------------------

### Associations connues

  Association   Cardinalités conceptuelles                      Propriétés portées
  ------------- ----------------------------------------------- --------------------
  `EXPRIMER`    UTILISATEUR (0,n) --- VOLONTE_NUMERIQUE (1,1)   ---

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## REVENDICATION

**Définition.** Lien vérifié « je suis cette personne » entre un compte
et une PERSONNE (§ 67).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -------------------------------------------------------------------------------------
  Propriété source                          Définition au   Type logique  Obligatoire ?
                                            stade                         
                                            dictionnaire                  
  ----------------------------------------- --------------- ------------- -------------
  `niveau_verification`                     Propriété       **À DÉCIDER   **À DÉCIDER**
                                            explicitement   AU MLD**      
                                            portée par le                 
                                            MCD. Sa                       
                                            sémantique                    
                                            détaillée doit                
                                            respecter la                  
                                            définition de                 
                                            l'objet et les                
                                            RG du domaine.                

  `date`                                    Propriété       **À DÉCIDER   **À DÉCIDER**
                                            explicitement   AU MLD**      
                                            portée par le                 
                                            MCD. Sa                       
                                            sémantique                    
                                            détaillée doit                
                                            respecter la                  
                                            définition de                 
                                            l'objet et les                
                                            RG du domaine.                

  `statut {déclarée, vérifiée, révoquée}`   Propriété       **À DÉCIDER   **À DÉCIDER**
                                            explicitement   AU MLD**      
                                            portée par le                 
                                            MCD. Sa                       
                                            sémantique                    
                                            détaillée doit                
                                            respecter la                  
                                            définition de                 
                                            l'objet et les                
                                            RG du domaine.                
  -------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `REVENDIQUER`           UTILISATEUR (0,n) ---   ---
                          REVENDICATION (1,1) --- 
                          PERSONNE (0,n)          

  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## TRANSFERT_GOUVERNANCE

**Définition.** Transfert historisé de la gouvernance d'un espace (§
65.1).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------
  Propriété source  Définition au     Type logique      Obligatoire ?
                    stade                               
                    dictionnaire                        
  ----------------- ----------------- ----------------- -----------------
  `date`            Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `perimetre`       Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `exclusions`      Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `conditions`      Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `autorisation`    Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         
  -----------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `TRANSFERER`            ESPACE (0,n) ---        ---
                          TRANSFERT_GOUVERNANCE   
                          (1,1) ; cédant          
                          UTILISATEUR (0,n) ---   
                          (1,1) ; cessionnaire    
                          UTILISATEUR (0,n) ---   
                          (1,1)                   

  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## DESIGNATION_GARDE

**Définition.** Désignation d'un rôle de garde ou de succession sur un
objet ou un espace (§ 24.15, § 25.18, § 89).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  --------------------------------------------------------------------------------------------
  Propriété source                                   Définition au   Type        Obligatoire ?
                                                     stade           logique     
                                                     dictionnaire                
  -------------------------------------------------- --------------- ----------- -------------
  `role ⟨D-11⟩`                                      Propriété       **À DÉCIDER **À DÉCIDER**
                                                     explicitement   AU MLD**    
                                                     portée par le               
                                                     MCD. Sa                     
                                                     sémantique                  
                                                     détaillée doit              
                                                     respecter la                
                                                     définition de               
                                                     l'objet et les              
                                                     RG du domaine.              

  `condition_effet {immédiat, décès, date, autre}`   Propriété       **À DÉCIDER **À DÉCIDER**
                                                     explicitement   AU MLD**    
                                                     portée par le               
                                                     MCD. Sa                     
                                                     sémantique                  
                                                     détaillée doit              
                                                     respecter la                
                                                     définition de               
                                                     l'objet et les              
                                                     RG du domaine.              

  `date_effet`                                       Propriété       **À DÉCIDER **À DÉCIDER**
                                                     explicitement   AU MLD**    
                                                     portée par le               
                                                     MCD. Sa                     
                                                     sémantique                  
                                                     détaillée doit              
                                                     respecter la                
                                                     définition de               
                                                     l'objet et les              
                                                     RG du domaine.              

  `statut {prévue, effective, révoquée}`             Propriété       **À DÉCIDER **À DÉCIDER**
                                                     explicitement   AU MLD**    
                                                     portée par le               
                                                     MCD. Sa                     
                                                     sémantique                  
                                                     détaillée doit              
                                                     respecter la                
                                                     définition de               
                                                     l'objet et les              
                                                     RG du domaine.              
  --------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `DESIGNER`              DESIGNATION_GARDE (1,1) ---
                          --- OBJET (0,n) ;       
                          désigné UTILISATEUR     
                          (0,n) --- (0,1) ou      
                          PERSONNE (0,n) ---      
                          (0,1) (destinataire     
                          futur)                  

  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## LIEN_INTERET

**Définition.** Lien déclaré entre un utilisateur et ce qu'il évalue (§
55.1).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  Propriété source                                                                                                                 Définition au   Type      Obligatoire ?
                                                                                                                                   stade           logique   
                                                                                                                                   dictionnaire              
  -------------------------------------------------------------------------------------------------------------------------------- --------------- --------- -------------
  `type {valide sa propre famille, propriétaire du fonds, membre du projet évalué, participant à l’événement, financeur, autre}`   Propriété       **À       **À DÉCIDER**
                                                                                                                                   explicitement   DÉCIDER   
                                                                                                                                   portée par le   AU MLD**  
                                                                                                                                   MCD. Sa                   
                                                                                                                                   sémantique                
                                                                                                                                   détaillée doit            
                                                                                                                                   respecter la              
                                                                                                                                   définition de             
                                                                                                                                   l'objet et les            
                                                                                                                                   RG du domaine.            

  `date_declaration`                                                                                                               Propriété       **À       **À DÉCIDER**
                                                                                                                                   explicitement   DÉCIDER   
                                                                                                                                   portée par le   AU MLD**  
                                                                                                                                   MCD. Sa                   
                                                                                                                                   sémantique                
                                                                                                                                   détaillée doit            
                                                                                                                                   respecter la              
                                                                                                                                   définition de             
                                                                                                                                   l'objet et les            
                                                                                                                                   RG du domaine.            
  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `DECLARER_INTERET`      UTILISATEUR (0,n) ---   ---
                          LIEN_INTERET (1,1) ---  
                          OBJET (0,n)             

  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## FINANCEMENT

**Définition.** Source de financement d'un projet, comme provenance (§
55, Q213).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  --------------------------------------------------------------------------------------------------------------------------------------------
  Propriété source                                                                                     Définition au   Type      Obligatoire ?
                                                                                                       stade           logique   
                                                                                                       dictionnaire              
  ---------------------------------------------------------------------------------------------------- --------------- --------- -------------
  `type {autofinancement, association, université, collectivité, subvention, mécénat, crowdfunding}`   Propriété       **À       **À DÉCIDER**
                                                                                                       explicitement   DÉCIDER   
                                                                                                       portée par le   AU MLD**  
                                                                                                       MCD. Sa                   
                                                                                                       sémantique                
                                                                                                       détaillée doit            
                                                                                                       respecter la              
                                                                                                       définition de             
                                                                                                       l'objet et les            
                                                                                                       RG du domaine.            

  `montant (VALEUR)`                                                                                   Propriété       **À       **À DÉCIDER**
                                                                                                       explicitement   DÉCIDER   
                                                                                                       portée par le   AU MLD**  
                                                                                                       MCD. Sa                   
                                                                                                       sémantique                
                                                                                                       détaillée doit            
                                                                                                       respecter la              
                                                                                                       définition de             
                                                                                                       l'objet et les            
                                                                                                       RG du domaine.            

  `periode`                                                                                            Propriété       **À       **À DÉCIDER**
                                                                                                       explicitement   DÉCIDER   
                                                                                                       portée par le   AU MLD**  
                                                                                                       MCD. Sa                   
                                                                                                       sémantique                
                                                                                                       détaillée doit            
                                                                                                       respecter la              
                                                                                                       définition de             
                                                                                                       l'objet et les            
                                                                                                       RG du domaine.            

  `obligations`                                                                                        Propriété       **À       **À DÉCIDER**
                                                                                                       explicitement   DÉCIDER   
                                                                                                       portée par le   AU MLD**  
                                                                                                       MCD. Sa                   
                                                                                                       sémantique                
                                                                                                       détaillée doit            
                                                                                                       respecter la              
                                                                                                       définition de             
                                                                                                       l'objet et les            
                                                                                                       RG du domaine.            
  --------------------------------------------------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `FINANCER`              PROJET (0,n) ---        ---
                          FINANCEMENT (1,1) ;     
                          FINANCEMENT (0,1) ---   
                          ORGANISATION (0,n)      

  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## ABONNEMENT

**Définition.** Droit d'usage acheté (stockage, calcul, quotas).

**Nature :** Entité/structure conceptuelle non déclarée comme
spécialisation d'`OBJET`.

### Attributs / propriétés explicitement nommés

  ------------------------------------------------------------------------
  Propriété source   Définition au     Type logique      Obligatoire ?
                     stade                               
                     dictionnaire                        
  ------------------ ----------------- ----------------- -----------------
  `#id_abonnement`   Propriété         **À DÉCIDER AU    **À DÉCIDER**
                     explicitement     MLD**             
                     portée par le                       
                     MCD. Sa                             
                     sémantique                          
                     détaillée doit                      
                     respecter la                        
                     définition de                       
                     l'objet et les RG                   
                     du domaine.                         

  `offre`            Propriété         **À DÉCIDER AU    **À DÉCIDER**
                     explicitement     MLD**             
                     portée par le                       
                     MCD. Sa                             
                     sémantique                          
                     détaillée doit                      
                     respecter la                        
                     définition de                       
                     l'objet et les RG                   
                     du domaine.                         

  `quotas`           Propriété         **À DÉCIDER AU    **À DÉCIDER**
                     explicitement     MLD**             
                     portée par le                       
                     MCD. Sa                             
                     sémantique                          
                     détaillée doit                      
                     respecter la                        
                     définition de                       
                     l'objet et les RG                   
                     du domaine.                         

  `credits_calcul`   Propriété         **À DÉCIDER AU    **À DÉCIDER**
                     explicitement     MLD**             
                     portée par le                       
                     MCD. Sa                             
                     sémantique                          
                     détaillée doit                      
                     respecter la                        
                     définition de                       
                     l'objet et les RG                   
                     du domaine.                         

  `date_debut`       Propriété         **À DÉCIDER AU    **À DÉCIDER**
                     explicitement     MLD**             
                     portée par le                       
                     MCD. Sa                             
                     sémantique                          
                     détaillée doit                      
                     respecter la                        
                     définition de                       
                     l'objet et les RG                   
                     du domaine.                         

  `date_fin`         Propriété         **À DÉCIDER AU    **À DÉCIDER**
                     explicitement     MLD**             
                     portée par le                       
                     MCD. Sa                             
                     sémantique                          
                     détaillée doit                      
                     respecter la                        
                     définition de                       
                     l'objet et les RG                   
                     du domaine.                         
  ------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `SOUSCRIRE`             UTILISATEUR (0,n) ou    ---
                          ESPACE (0,n) ---        
                          ABONNEMENT (1,1)        

  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## COMPTE

**Définition.** Identité technique d'authentification et d'accès.

**Nature :** Entité/structure conceptuelle non déclarée comme
spécialisation d'`OBJET`.

### Attributs / propriétés explicitement nommés

  ---------------------------------------------------------------------------
  Propriété source            Définition au   Type logique    Obligatoire ?
                              stade                           
                              dictionnaire                    
  --------------------------- --------------- --------------- ---------------
  `identifiants techniques`   Propriété       **À DÉCIDER AU  **À DÉCIDER**
                              explicitement   MLD**           
                              portée par le                   
                              MCD. Sa                         
                              sémantique                      
                              détaillée doit                  
                              respecter la                    
                              définition de                   
                              l'objet et les                  
                              RG du domaine.                  

  `état`                      Propriété       **À DÉCIDER AU  **À DÉCIDER**
                              explicitement   MLD**           
                              portée par le                   
                              MCD. Sa                         
                              sémantique                      
                              détaillée doit                  
                              respecter la                    
                              définition de                   
                              l'objet et les                  
                              RG du domaine.                  

  `dates`                     Propriété       **À DÉCIDER AU  **À DÉCIDER**
                              explicitement   MLD**           
                              portée par le                   
                              MCD. Sa                         
                              sémantique                      
                              détaillée doit                  
                              respecter la                    
                              définition de                   
                              l'objet et les                  
                              RG du domaine.                  
  ---------------------------------------------------------------------------

### Associations connues

Aucune association du tableau du domaine n'a été automatiquement
rattachée à ce nom ; vérifier les associations transversales du socle et
les consolidations canoniques.

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## ACTEUR_GENIIUS

**Définition.** Identité contributive/scientifique durable : chercheur,
transcripteur, validateur, déposant, organisation représentée.

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ------------------------------------------------------------------------------
  Propriété source                 Définition au   Type logique   Obligatoire ?
                                   stade                          
                                   dictionnaire                   
  -------------------------------- --------------- -------------- --------------
  `nom/pseudonyme d’attribution`   Propriété       **À DÉCIDER AU **À DÉCIDER**
                                   explicitement   MLD**          
                                   portée par le                  
                                   MCD. Sa                        
                                   sémantique                     
                                   détaillée doit                 
                                   respecter la                   
                                   définition de                  
                                   l'objet et les                 
                                   RG du domaine.                 

  `statut`                         Propriété       **À DÉCIDER AU **À DÉCIDER**
                                   explicitement   MLD**          
                                   portée par le                  
                                   MCD. Sa                        
                                   sémantique                     
                                   détaillée doit                 
                                   respecter la                   
                                   définition de                  
                                   l'objet et les                 
                                   RG du domaine.                 

  `période d’activité`             Propriété       **À DÉCIDER AU **À DÉCIDER**
                                   explicitement   MLD**          
                                   portée par le                  
                                   MCD. Sa                        
                                   sémantique                     
                                   détaillée doit                 
                                   respecter la                   
                                   définition de                  
                                   l'objet et les                 
                                   RG du domaine.                 
  ------------------------------------------------------------------------------

### Associations connues

Aucune association du tableau du domaine n'a été automatiquement
rattachée à ce nom ; vérifier les associations transversales du socle et
les consolidations canoniques.

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## LIEN_COMPTE_ACTEUR

**Définition.** Association temporelle entre un compte et un acteur.

**Nature :** Entité/structure conceptuelle non déclarée comme
spécialisation d'`OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------
  Propriété source        Définition au   Type logique    Obligatoire ?
                          stade                           
                          dictionnaire                    
  ----------------------- --------------- --------------- ---------------
  `date_debut`            Propriété       **À DÉCIDER AU  **À DÉCIDER**
                          explicitement   MLD**           
                          portée par le                   
                          MCD. Sa                         
                          sémantique                      
                          détaillée doit                  
                          respecter la                    
                          définition de                   
                          l'objet et les                  
                          RG du domaine.                  

  `date_fin`              Propriété       **À DÉCIDER AU  **À DÉCIDER**
                          explicitement   MLD**           
                          portée par le                   
                          MCD. Sa                         
                          sémantique                      
                          détaillée doit                  
                          respecter la                    
                          définition de                   
                          l'objet et les                  
                          RG du domaine.                  

  `niveau_verification`   Propriété       **À DÉCIDER AU  **À DÉCIDER**
                          explicitement   MLD**           
                          portée par le                   
                          MCD. Sa                         
                          sémantique                      
                          détaillée doit                  
                          respecter la                    
                          définition de                   
                          l'objet et les                  
                          RG du domaine.                  
  -----------------------------------------------------------------------

### Associations connues

Aucune association du tableau du domaine n'a été automatiquement
rattachée à ce nom ; vérifier les associations transversales du socle et
les consolidations canoniques.

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## LIEN_COMPTE_PERSONNE

**Définition.** Lien vérifié et révocable entre un compte et une
PERSONNE; ne confère pas la propriété de la vérité sur cette personne.

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------
  Propriété source  Définition au     Type logique      Obligatoire ?
                    stade                               
                    dictionnaire                        
  ----------------- ----------------- ----------------- -----------------
  `méthode`         Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `date`            Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `statut`          Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `niveau`          Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         
  -----------------------------------------------------------------------

### Associations connues

Aucune association du tableau du domaine n'a été automatiquement
rattachée à ce nom ; vérifier les associations transversales du socle et
les consolidations canoniques.

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## DECISION_APPLICABILITE_DROIT

**Définition.** Décide si une restriction amont reste applicable à un
dérivé.

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ------------------------------------------------------------------------------------------------------------------------------
  Propriété source                                                                       Définition au   Type      Obligatoire ?
                                                                                         stade           logique   
                                                                                         dictionnaire              
  -------------------------------------------------------------------------------------- --------------- --------- -------------
  `{applicable, partiellement applicable, non applicable, indéterminée, à réexaminer}`   Propriété       **À       **À DÉCIDER**
                                                                                         explicitement   DÉCIDER   
                                                                                         portée par le   AU MLD**  
                                                                                         MCD. Sa                   
                                                                                         sémantique                
                                                                                         détaillée doit            
                                                                                         respecter la              
                                                                                         définition de             
                                                                                         l'objet et les            
                                                                                         RG du domaine.            

  `fondement`                                                                            Propriété       **À       **À DÉCIDER**
                                                                                         explicitement   DÉCIDER   
                                                                                         portée par le   AU MLD**  
                                                                                         MCD. Sa                   
                                                                                         sémantique                
                                                                                         détaillée doit            
                                                                                         respecter la              
                                                                                         définition de             
                                                                                         l'objet et les            
                                                                                         RG du domaine.            

  `date`                                                                                 Propriété       **À       **À DÉCIDER**
                                                                                         explicitement   DÉCIDER   
                                                                                         portée par le   AU MLD**  
                                                                                         MCD. Sa                   
                                                                                         sémantique                
                                                                                         détaillée doit            
                                                                                         respecter la              
                                                                                         définition de             
                                                                                         l'objet et les            
                                                                                         RG du domaine.            
  ------------------------------------------------------------------------------------------------------------------------------

### Associations connues

Aucune association du tableau du domaine n'a été automatiquement
rattachée à ce nom ; vérifier les associations transversales du socle et
les consolidations canoniques.

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## CONTEXTE_EVALUATION

**Définition.** Contexte d'une décision d'accès/diffusion/opération.

**Nature :** Entité/structure conceptuelle non déclarée comme
spécialisation d'`OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------
  Propriété source  Définition au     Type logique      Obligatoire ?
                    stade                               
                    dictionnaire                        
  ----------------- ----------------- ----------------- -----------------
  `acteur`          Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `audience`        Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `espace`          Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `projet`          Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `rôle`            Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `instant`         Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `opération`       Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `finalité`        Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `canal`           Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         
  -----------------------------------------------------------------------

### Associations connues

Aucune association du tableau du domaine n'a été automatiquement
rattachée à ce nom ; vérifier les associations transversales du socle et
les consolidations canoniques.

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## EVALUATION_DIFFUSABILITE

**Définition.** Décision sur la possibilité de diffuser un résultat dans
un contexte, après détermination des contraintes applicables.

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------
  Propriété source     Définition au    Type logique     Obligatoire ?
                       stade                             
                       dictionnaire                      
  -------------------- ---------------- ---------------- ----------------
  `décision`           Propriété        **À DÉCIDER AU   **À DÉCIDER**
                       explicitement    MLD**            
                       portée par le                     
                       MCD. Sa                           
                       sémantique                        
                       détaillée doit                    
                       respecter la                      
                       définition de                     
                       l'objet et les                    
                       RG du domaine.                    

  `motif`              Propriété        **À DÉCIDER AU   **À DÉCIDER**
                       explicitement    MLD**            
                       portée par le                     
                       MCD. Sa                           
                       sémantique                        
                       détaillée doit                    
                       respecter la                      
                       définition de                     
                       l'objet et les                    
                       RG du domaine.                    

  `risque_inference`   Propriété        **À DÉCIDER AU   **À DÉCIDER**
                       explicitement    MLD**            
                       portée par le                     
                       MCD. Sa                           
                       sémantique                        
                       détaillée doit                    
                       respecter la                      
                       définition de                     
                       l'objet et les                    
                       RG du domaine.                    

  `date`               Propriété        **À DÉCIDER AU   **À DÉCIDER**
                       explicitement    MLD**            
                       portée par le                     
                       MCD. Sa                           
                       sémantique                        
                       détaillée doit                    
                       respecter la                      
                       définition de                     
                       l'objet et les                    
                       RG du domaine.                    
  -----------------------------------------------------------------------

### Associations connues

Aucune association du tableau du domaine n'a été automatiquement
rattachée à ce nom ; vérifier les associations transversales du socle et
les consolidations canoniques.

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## Associations --- domaine B

  -------------------------------------------------------------------------------------
  Association                              Cardinalités du MCD     Propriétés portées
  ---------------------------------------- ----------------------- --------------------
  `APPARTENIR`                             UTILISATEUR (0,n) ---   role_espace
                                           ESPACE (0,n)            {propriétaire,
                                                                   administrateur,
                                                                   responsable
                                                                   scientifique,
                                                                   collaborateur,
                                                                   invité, lecteur},
                                                                   date_debut, date_fin

  `ATTRIBUER_ROLE`                         UTILISATEUR (0,n) ---   role_gouvernance
                                           ESPACE (0,n)            {contributeur,
                                                                   validateur, référent
                                                                   communautaire,
                                                                   modérateur,
                                                                   administrateur
                                                                   technique},
                                                                   procedure, date,
                                                                   domaine (→
                                                                   DOMAINE_EXPERTISE)

  `MEMBRE_GROUPE`                          UTILISATEUR (0,n) ---   date_debut, date_fin
                                           GROUPE (0,n)            

  `PORTER_SUR_OBJET / PORTER_SUR_ESPACE`   REGLE_ACCES (1,1) ---   ---
                                           OBJET (0,n) ou ESPACE   
                                           (0,n)                   

  `BENEFICIER`                             REGLE_ACCES (1,1) ---   ---
                                           UTILISATEUR (0,n) ou    
                                           GROUPE (0,n) ; aucun si 
                                           public                  

  `SOUS_LICENCE`                           OBJET (0,1) --- LICENCE ---
                                           (0,n)                   

  `RESTREINDRE`                            OBJET (0,n) --- EMBARGO ---
                                           (1,1)                   

  `CLASSER`                                OBJET (0,n) ---         origine {déclarée,
                                           CLASSIFICATION (0,n)    déduite}

  `MASQUER`                                OBJET (0,n) ---         ---
                                           MASQUAGE (1,1)          
                                           (original) ; OBJET      
                                           (0,1) --- MASQUAGE      
                                           (0,1) (version          
                                           publique)               

  `CONSENTIR`                              PERSONNE (0,n) ---      ---
                                           CONSENTEMENT (1,1) ;    
                                           CONSENTEMENT (0,1) ---  
                                           OBJET (0,n) ou ESPACE   
                                           (0,n)                   

  `EXPRIMER`                               UTILISATEUR (0,n) ---   ---
                                           VOLONTE_NUMERIQUE (1,1) 

  `REVENDIQUER`                            UTILISATEUR (0,n) ---   ---
                                           REVENDICATION (1,1) --- 
                                           PERSONNE (0,n)          

  `TRANSFERER`                             ESPACE (0,n) ---        ---
                                           TRANSFERT_GOUVERNANCE   
                                           (1,1) ; cédant          
                                           UTILISATEUR (0,n) ---   
                                           (1,1) ; cessionnaire    
                                           UTILISATEUR (0,n) ---   
                                           (1,1)                   

  `DESIGNER`                               DESIGNATION_GARDE (1,1) ---
                                           --- OBJET (0,n) ;       
                                           désigné UTILISATEUR     
                                           (0,n) --- (0,1) ou      
                                           PERSONNE (0,n) ---      
                                           (0,1) (destinataire     
                                           futur)                  

  `DECLARER_INTERET`                       UTILISATEUR (0,n) ---   ---
                                           LIEN_INTERET (1,1) ---  
                                           OBJET (0,n)             

  `FINANCER`                               PROJET (0,n) ---        ---
                                           FINANCEMENT (1,1) ;     
                                           FINANCEMENT (0,1) ---   
                                           ORGANISATION (0,n)      

  `SOUSCRIRE`                              UTILISATEUR (0,n) ou    ---
                                           ESPACE (0,n) ---        
                                           ABONNEMENT (1,1)        

  `BLOQUER`                                UTILISATEUR (0,n) ---   date
                                           UTILISATEUR (0,n)       
  -------------------------------------------------------------------------------------

## Règles de gestion --- domaine B

# Domaine C --- Sources et hiérarchie documentaire

**Couverture : 15 entités/objets, 20 associations, 0 règles RG.**

## DOCUMENT

**Définition.** Unité intellectuelle : un acte, un registre, une
photographie, un enregistrement, un témoignage. Existe même s'il est
perdu ou seulement prescrit.

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ----------------------------------------------------------------------------------------------------------
  Propriété source                                                  Définition au   Type       Obligatoire ?
                                                                    stade           logique    
                                                                    dictionnaire               
  ----------------------------------------------------------------- --------------- ---------- -------------
  `titre_forge`                                                     Propriété       **À        **À DÉCIDER**
                                                                    explicitement   DÉCIDER AU 
                                                                    portée par le   MLD**      
                                                                    MCD. Sa                    
                                                                    sémantique                 
                                                                    détaillée doit             
                                                                    respecter la               
                                                                    définition de              
                                                                    l'objet et les             
                                                                    RG du domaine.             

  `nature ⟨D-12⟩`                                                   Propriété       **À        **À DÉCIDER**
                                                                    explicitement   DÉCIDER AU 
                                                                    portée par le   MLD**      
                                                                    MCD. Sa                    
                                                                    sémantique                 
                                                                    détaillée doit             
                                                                    respecter la               
                                                                    définition de              
                                                                    l'objet et les             
                                                                    RG du domaine.             

  `type_documentaire (→ CONCEPT)`                                   Propriété       **À        **À DÉCIDER**
                                                                    explicitement   DÉCIDER AU 
                                                                    portée par le   MLD**      
                                                                    MCD. Sa                    
                                                                    sémantique                 
                                                                    détaillée doit             
                                                                    respecter la               
                                                                    définition de              
                                                                    l'objet et les             
                                                                    RG du domaine.             

  `date_production (DATE_HIST)`                                     Propriété       **À        **À DÉCIDER**
                                                                    explicitement   DÉCIDER AU 
                                                                    portée par le   MLD**      
                                                                    MCD. Sa                    
                                                                    sémantique                 
                                                                    détaillée doit             
                                                                    respecter la               
                                                                    définition de              
                                                                    l'objet et les             
                                                                    RG du domaine.             

  `langues`                                                         Propriété       **À        **À DÉCIDER**
                                                                    explicitement   DÉCIDER AU 
                                                                    portée par le   MLD**      
                                                                    MCD. Sa                    
                                                                    sémantique                 
                                                                    détaillée doit             
                                                                    respecter la               
                                                                    définition de              
                                                                    l'objet et les             
                                                                    RG du domaine.             

  `statut_existence ⟨D-13⟩`                                         Propriété       **À        **À DÉCIDER**
                                                                    explicitement   DÉCIDER AU 
                                                                    portée par le   MLD**      
                                                                    MCD. Sa                    
                                                                    sémantique                 
                                                                    détaillée doit             
                                                                    respecter la               
                                                                    définition de              
                                                                    l'objet et les             
                                                                    RG du domaine.             

  `accessibilite {accessible, restreint, inaccessible, inconnue}`   Propriété       **À        **À DÉCIDER**
                                                                    explicitement   DÉCIDER AU 
                                                                    portée par le   MLD**      
                                                                    MCD. Sa                    
                                                                    sémantique                 
                                                                    détaillée doit             
                                                                    respecter la               
                                                                    définition de              
                                                                    l'objet et les             
                                                                    RG du domaine.             

  `description`                                                     Propriété       **À        **À DÉCIDER**
                                                                    explicitement   DÉCIDER AU 
                                                                    portée par le   MLD**      
                                                                    MCD. Sa                    
                                                                    sémantique                 
                                                                    détaillée doit             
                                                                    respecter la               
                                                                    définition de              
                                                                    l'objet et les             
                                                                    RG du domaine.             

  `etat_provenance ⟨D-14⟩`                                          Propriété       **À        **À DÉCIDER**
                                                                    explicitement   DÉCIDER AU 
                                                                    portée par le   MLD**      
                                                                    MCD. Sa                    
                                                                    sémantique                 
                                                                    détaillée doit             
                                                                    respecter la               
                                                                    définition de              
                                                                    l'objet et les             
                                                                    RG du domaine.             
  ----------------------------------------------------------------------------------------------------------

### Associations connues

  ------------------------------------------------------------------------
  Association            Cardinalités conceptuelles Propriétés portées
  ---------------------- -------------------------- ----------------------
  `INCARNER`             DOCUMENT (0,n) ---         ---
                         EXEMPLAIRE (1,1)           

  `COTER`                OBJET (DOCUMENT,           ---
                         EXEMPLAIRE ou              
                         UNITE_ARCHIVISTIQUE) (0,n) 
                         ---                        
                         IDENTIFIANT_DOCUMENTAIRE   
                         (1,1)                      

  `ACCEDER`              OBJET (DOCUMENT ou         ---
                         REPRODUCTION) (0,n) ---    
                         LOCALISATION_EN_LIGNE      
                         (1,1)                      

  `CITER_DOC`            DOCUMENT citant (0,n) ---  ---
                         CITATION_DOCUMENTAIRE      
                         (1,1) ; DOCUMENT cité      
                         (0,n) --- (1,1) ;          
                         CITATION_DOCUMENTAIRE      
                         (0,n) --- ZONE (0,n)       
                         (ancrage)                  

  `PRESCRIRE`            NORME (0,n) ---            ---
                         PRESCRIPTION (1,1) ;       
                         PRESCRIPTION (0,1) ---     
                         DOCUMENT (0,n)             
  ------------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## EXEMPLAIRE

**Définition.** Support matériel d'un document : original, minute,
expédition, double de greffe, tirage photo, album.

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ------------------------------------------------------------------------------------------------------------------------------------------------------------
  Propriété source                                                                                                     Définition au   Type      Obligatoire ?
                                                                                                                       stade           logique   
                                                                                                                       dictionnaire              
  -------------------------------------------------------------------------------------------------------------------- --------------- --------- -------------
  `type_exemplaire {original, minute, expédition, copie authentique, duplicata, copie privée, tirage, album, autre}`   Propriété       **À       **À DÉCIDER**
                                                                                                                       explicitement   DÉCIDER   
                                                                                                                       portée par le   AU MLD**  
                                                                                                                       MCD. Sa                   
                                                                                                                       sémantique                
                                                                                                                       détaillée doit            
                                                                                                                       respecter la              
                                                                                                                       définition de             
                                                                                                                       l'objet et les            
                                                                                                                       RG du domaine.            

  `description_materielle`                                                                                             Propriété       **À       **À DÉCIDER**
                                                                                                                       explicitement   DÉCIDER   
                                                                                                                       portée par le   AU MLD**  
                                                                                                                       MCD. Sa                   
                                                                                                                       sémantique                
                                                                                                                       détaillée doit            
                                                                                                                       respecter la              
                                                                                                                       définition de             
                                                                                                                       l'objet et les            
                                                                                                                       RG du domaine.            

  `etat_conservation`                                                                                                  Propriété       **À       **À DÉCIDER**
                                                                                                                       explicitement   DÉCIDER   
                                                                                                                       portée par le   AU MLD**  
                                                                                                                       MCD. Sa                   
                                                                                                                       sémantique                
                                                                                                                       détaillée doit            
                                                                                                                       respecter la              
                                                                                                                       définition de             
                                                                                                                       l'objet et les            
                                                                                                                       RG du domaine.            

  `nb_pages_declare`                                                                                                   Propriété       **À       **À DÉCIDER**
                                                                                                                       explicitement   DÉCIDER   
                                                                                                                       portée par le   AU MLD**  
                                                                                                                       MCD. Sa                   
                                                                                                                       sémantique                
                                                                                                                       détaillée doit            
                                                                                                                       respecter la              
                                                                                                                       définition de             
                                                                                                                       l'objet et les            
                                                                                                                       RG du domaine.            
  ------------------------------------------------------------------------------------------------------------------------------------------------------------

### Associations connues

  ------------------------------------------------------------------------
  Association            Cardinalités conceptuelles Propriétés portées
  ---------------------- -------------------------- ----------------------
  `INCARNER`             DOCUMENT (0,n) ---         ---
                         EXEMPLAIRE (1,1)           

  `COMPORTER`            EXEMPLAIRE (0,n) --- PAGE  ---
                         (1,1)                      

  `LOCALISER`            EXEMPLAIRE (0,n) ---       type_ordre ⟨D-18⟩,
                         UNITE_ARCHIVISTIQUE (0,n)  rang, periode

  `COTER`                OBJET (DOCUMENT,           ---
                         EXEMPLAIRE ou              
                         UNITE_ARCHIVISTIQUE) (0,n) 
                         ---                        
                         IDENTIFIANT_DOCUMENTAIRE   
                         (1,1)                      

  `REPRODUIRE`           EXEMPLAIRE (0,n) ---       ---
                         REPRODUCTION (0,1)         

  `OCCUPER`              EMPLACEMENT (0,n) ---      periode, type_ordre
                         EXEMPLAIRE (photo) (0,n)   
  ------------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## UNITE_ARCHIVISTIQUE

**Définition.** Niveau de description archivistique (fonds, série,
sous-série, article, registre, dossier, pièce). Granularité progressive.

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ---------------------------------------------------------------------------------------------------------------------
  Propriété source                                                              Définition au   Type      Obligatoire ?
                                                                                stade           logique   
                                                                                dictionnaire              
  ----------------------------------------------------------------------------- --------------- --------- -------------
  `niveau {fonds, série, sous-série, article/cote, registre, dossier, pièce}`   Propriété       **À       **À DÉCIDER**
                                                                                explicitement   DÉCIDER   
                                                                                portée par le   AU MLD**  
                                                                                MCD. Sa                   
                                                                                sémantique                
                                                                                détaillée doit            
                                                                                respecter la              
                                                                                définition de             
                                                                                l'objet et les            
                                                                                RG du domaine.            

  `intitule`                                                                    Propriété       **À       **À DÉCIDER**
                                                                                explicitement   DÉCIDER   
                                                                                portée par le   AU MLD**  
                                                                                MCD. Sa                   
                                                                                sémantique                
                                                                                détaillée doit            
                                                                                respecter la              
                                                                                définition de             
                                                                                l'objet et les            
                                                                                RG du domaine.            

  `dates_extremes (DATE_HIST)`                                                  Propriété       **À       **À DÉCIDER**
                                                                                explicitement   DÉCIDER   
                                                                                portée par le   AU MLD**  
                                                                                MCD. Sa                   
                                                                                sémantique                
                                                                                détaillée doit            
                                                                                respecter la              
                                                                                définition de             
                                                                                l'objet et les            
                                                                                RG du domaine.            

  `description`                                                                 Propriété       **À       **À DÉCIDER**
                                                                                explicitement   DÉCIDER   
                                                                                portée par le   AU MLD**  
                                                                                MCD. Sa                   
                                                                                sémantique                
                                                                                détaillée doit            
                                                                                respecter la              
                                                                                définition de             
                                                                                l'objet et les            
                                                                                RG du domaine.            
  ---------------------------------------------------------------------------------------------------------------------

### Associations connues

  ------------------------------------------------------------------------
  Association            Cardinalités conceptuelles Propriétés portées
  ---------------------- -------------------------- ----------------------
  `LOCALISER`            EXEMPLAIRE (0,n) ---       type_ordre ⟨D-18⟩,
                         UNITE_ARCHIVISTIQUE (0,n)  rang, periode

  `CLASSER_DANS`         UNITE_ARCHIVISTIQUE enfant type_ordre ⟨D-18⟩,
                         (0,n) ---                  rang, periode
                         UNITE_ARCHIVISTIQUE parent 
                         (0,n)                      

  `CONSERVER`            UNITE_ARCHIVISTIQUE (0,1)  (historisé par
                         --- ORGANISATION (0,n)     versions)

  `COTER`                OBJET (DOCUMENT,           ---
                         EXEMPLAIRE ou              
                         UNITE_ARCHIVISTIQUE) (0,n) 
                         ---                        
                         IDENTIFIANT_DOCUMENTAIRE   
                         (1,1)                      
  ------------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## IDENTIFIANT_DOCUMENTAIRE

**Définition.** Cote ou identifiant successif, historisé (« cote ≠
identité »).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ----------------------------------------------------------------------------------------------------------------------------------
  Propriété source                                                                           Définition au   Type      Obligatoire ?
                                                                                             stade           logique   
                                                                                             dictionnaire              
  ------------------------------------------------------------------------------------------ --------------- --------- -------------
  `valeur`                                                                                   Propriété       **À       **À DÉCIDER**
                                                                                             explicitement   DÉCIDER   
                                                                                             portée par le   AU MLD**  
                                                                                             MCD. Sa                   
                                                                                             sémantique                
                                                                                             détaillée doit            
                                                                                             respecter la              
                                                                                             définition de             
                                                                                             l'objet et les            
                                                                                             RG du domaine.            

  `type {cote actuelle, ancienne cote, identifiant historique, numéro d’acte, ARK, autre}`   Propriété       **À       **À DÉCIDER**
                                                                                             explicitement   DÉCIDER   
                                                                                             portée par le   AU MLD**  
                                                                                             MCD. Sa                   
                                                                                             sémantique                
                                                                                             détaillée doit            
                                                                                             respecter la              
                                                                                             définition de             
                                                                                             l'objet et les            
                                                                                             RG du domaine.            

  `institution_emettrice`                                                                    Propriété       **À       **À DÉCIDER**
                                                                                             explicitement   DÉCIDER   
                                                                                             portée par le   AU MLD**  
                                                                                             MCD. Sa                   
                                                                                             sémantique                
                                                                                             détaillée doit            
                                                                                             respecter la              
                                                                                             définition de             
                                                                                             l'objet et les            
                                                                                             RG du domaine.            

  `date_debut`                                                                               Propriété       **À       **À DÉCIDER**
                                                                                             explicitement   DÉCIDER   
                                                                                             portée par le   AU MLD**  
                                                                                             MCD. Sa                   
                                                                                             sémantique                
                                                                                             détaillée doit            
                                                                                             respecter la              
                                                                                             définition de             
                                                                                             l'objet et les            
                                                                                             RG du domaine.            

  `date_fin`                                                                                 Propriété       **À       **À DÉCIDER**
                                                                                             explicitement   DÉCIDER   
                                                                                             portée par le   AU MLD**  
                                                                                             MCD. Sa                   
                                                                                             sémantique                
                                                                                             détaillée doit            
                                                                                             respecter la              
                                                                                             définition de             
                                                                                             l'objet et les            
                                                                                             RG du domaine.            
  ----------------------------------------------------------------------------------------------------------------------------------

### Associations connues

  ------------------------------------------------------------------------
  Association            Cardinalités conceptuelles Propriétés portées
  ---------------------- -------------------------- ----------------------
  `COTER`                OBJET (DOCUMENT,           ---
                         EXEMPLAIRE ou              
                         UNITE_ARCHIVISTIQUE) (0,n) 
                         ---                        
                         IDENTIFIANT_DOCUMENTAIRE   
                         (1,1)                      

  ------------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## LOCALISATION_EN_LIGNE

**Définition.** Adresse d'accès en ligne historisée, avec état d'accès
observé (§ 98).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ------------------------------------------------------------------------------------------
  Propriété source                                Définition au   Type logique Obligatoire ?
                                                  stade                        
                                                  dictionnaire                 
  ----------------------------------------------- --------------- ------------ -------------
  `adresse`                                       Propriété       **À DÉCIDER  **À DÉCIDER**
                                                  explicitement   AU MLD**     
                                                  portée par le                
                                                  MCD. Sa                      
                                                  sémantique                   
                                                  détaillée doit               
                                                  respecter la                 
                                                  définition de                
                                                  l'objet et les               
                                                  RG du domaine.               

  `type {URL, ARK, DOI, manifeste IIIF, autre}`   Propriété       **À DÉCIDER  **À DÉCIDER**
                                                  explicitement   AU MLD**     
                                                  portée par le                
                                                  MCD. Sa                      
                                                  sémantique                   
                                                  détaillée doit               
                                                  respecter la                 
                                                  définition de                
                                                  l'objet et les               
                                                  RG du domaine.               

  `plateforme`                                    Propriété       **À DÉCIDER  **À DÉCIDER**
                                                  explicitement   AU MLD**     
                                                  portée par le                
                                                  MCD. Sa                      
                                                  sémantique                   
                                                  détaillée doit               
                                                  respecter la                 
                                                  définition de                
                                                  l'objet et les               
                                                  RG du domaine.               

  `date_debut`                                    Propriété       **À DÉCIDER  **À DÉCIDER**
                                                  explicitement   AU MLD**     
                                                  portée par le                
                                                  MCD. Sa                      
                                                  sémantique                   
                                                  détaillée doit               
                                                  respecter la                 
                                                  définition de                
                                                  l'objet et les               
                                                  RG du domaine.               

  `date_fin`                                      Propriété       **À DÉCIDER  **À DÉCIDER**
                                                  explicitement   AU MLD**     
                                                  portée par le                
                                                  MCD. Sa                      
                                                  sémantique                   
                                                  détaillée doit               
                                                  respecter la                 
                                                  définition de                
                                                  l'objet et les               
                                                  RG du domaine.               

  `etat_acces ⟨D-15⟩`                             Propriété       **À DÉCIDER  **À DÉCIDER**
                                                  explicitement   AU MLD**     
                                                  portée par le                
                                                  MCD. Sa                      
                                                  sémantique                   
                                                  détaillée doit               
                                                  respecter la                 
                                                  définition de                
                                                  l'objet et les               
                                                  RG du domaine.               

  `date_observation`                              Propriété       **À DÉCIDER  **À DÉCIDER**
                                                  explicitement   AU MLD**     
                                                  portée par le                
                                                  MCD. Sa                      
                                                  sémantique                   
                                                  détaillée doit               
                                                  respecter la                 
                                                  définition de                
                                                  l'objet et les               
                                                  RG du domaine.               
  ------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `ACCEDER`               OBJET (DOCUMENT ou      ---
                          REPRODUCTION) (0,n) --- 
                          LOCALISATION_EN_LIGNE   
                          (1,1)                   

  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## PAGE

**Définition.** Face physique d'un exemplaire (folio, recto/verso, page
d'album).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ------------------------------------------------------------------------------------
  Propriété source                         Définition au   Type logique  Obligatoire ?
                                           stade                         
                                           dictionnaire                  
  ---------------------------------------- --------------- ------------- -------------
  `numero`                                 Propriété       **À DÉCIDER   **À DÉCIDER**
                                           explicitement   AU MLD**      
                                           portée par le                 
                                           MCD. Sa                       
                                           sémantique                    
                                           détaillée doit                
                                           respecter la                  
                                           définition de                 
                                           l'objet et les                
                                           RG du domaine.                

  `folio`                                  Propriété       **À DÉCIDER   **À DÉCIDER**
                                           explicitement   AU MLD**      
                                           portée par le                 
                                           MCD. Sa                       
                                           sémantique                    
                                           détaillée doit                
                                           respecter la                  
                                           définition de                 
                                           l'objet et les                
                                           RG du domaine.                

  `face {recto, verso, sans objet}`        Propriété       **À DÉCIDER   **À DÉCIDER**
                                           explicitement   AU MLD**      
                                           portée par le                 
                                           MCD. Sa                       
                                           sémantique                    
                                           détaillée doit                
                                           respecter la                  
                                           définition de                 
                                           l'objet et les                
                                           RG du domaine.                

  `rang`                                   Propriété       **À DÉCIDER   **À DÉCIDER**
                                           explicitement   AU MLD**      
                                           portée par le                 
                                           MCD. Sa                       
                                           sémantique                    
                                           détaillée doit                
                                           respecter la                  
                                           définition de                 
                                           l'objet et les                
                                           RG du domaine.                

  `etat {présente, absente, endommagée}`   Propriété       **À DÉCIDER   **À DÉCIDER**
                                           explicitement   AU MLD**      
                                           portée par le                 
                                           MCD. Sa                       
                                           sémantique                    
                                           détaillée doit                
                                           respecter la                  
                                           définition de                 
                                           l'objet et les                
                                           RG du domaine.                
  ------------------------------------------------------------------------------------

### Associations connues

  Association   Cardinalités conceptuelles         Propriétés portées
  ------------- ---------------------------------- --------------------
  `COMPORTER`   EXEMPLAIRE (0,n) --- PAGE (1,1)    ---
  `MONTRER`     VUE (0,n) --- PAGE (0,n)           ---
  `SITUER`      ZONE (0,1) --- PAGE (0,n)          ---
  `OFFRIR`      PAGE (0,n) --- EMPLACEMENT (1,1)   ---

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## REPRODUCTION

**Définition.** Reproduction d'un exemplaire ou transformation d'une
autre reproduction ; maillon de la lignée de reproduction (§ 18).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ------------------------------------------------------------------------
  Propriété source         Définition au   Type logique    Obligatoire ?
                           stade                           
                           dictionnaire                    
  ------------------------ --------------- --------------- ---------------
  `type ⟨D-16⟩`            Propriété       **À DÉCIDER AU  **À DÉCIDER**
                           explicitement   MLD**           
                           portée par le                   
                           MCD. Sa                         
                           sémantique                      
                           détaillée doit                  
                           respecter la                    
                           définition de                   
                           l'objet et les                  
                           RG du domaine.                  

  `date`                   Propriété       **À DÉCIDER AU  **À DÉCIDER**
                           explicitement   MLD**           
                           portée par le                   
                           MCD. Sa                         
                           sémantique                      
                           détaillée doit                  
                           respecter la                    
                           définition de                   
                           l'objet et les                  
                           RG du domaine.                  

  `qualite`                Propriété       **À DÉCIDER AU  **À DÉCIDER**
                           explicitement   MLD**           
                           portée par le                   
                           MCD. Sa                         
                           sémantique                      
                           détaillée doit                  
                           respecter la                    
                           définition de                   
                           l'objet et les                  
                           RG du domaine.                  

  `pages_manquantes`       Propriété       **À DÉCIDER AU  **À DÉCIDER**
                           explicitement   MLD**           
                           portée par le                   
                           MCD. Sa                         
                           sémantique                      
                           détaillée doit                  
                           respecter la                    
                           définition de                   
                           l'objet et les                  
                           RG du domaine.                  

  `support`                Propriété       **À DÉCIDER AU  **À DÉCIDER**
                           explicitement   MLD**           
                           portée par le                   
                           MCD. Sa                         
                           sémantique                      
                           détaillée doit                  
                           respecter la                    
                           définition de                   
                           l'objet et les                  
                           RG du domaine.                  

  `produite_par_ia`        Propriété       **À DÉCIDER AU  **À DÉCIDER**
                           explicitement   MLD**           
                           portée par le                   
                           MCD. Sa                         
                           sémantique                      
                           détaillée doit                  
                           respecter la                    
                           définition de                   
                           l'objet et les                  
                           RG du domaine.                  

  `original_recuperable`   Propriété       **À DÉCIDER AU  **À DÉCIDER**
                           explicitement   MLD**           
                           portée par le                   
                           MCD. Sa                         
                           sémantique                      
                           détaillée doit                  
                           respecter la                    
                           définition de                   
                           l'objet et les                  
                           RG du domaine.                  
  ------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `ACCEDER`               OBJET (DOCUMENT ou      ---
                          REPRODUCTION) (0,n) --- 
                          LOCALISATION_EN_LIGNE   
                          (1,1)                   

  `REPRODUIRE`            EXEMPLAIRE (0,n) ---    ---
                          REPRODUCTION (0,1)      

  `DERIVER_DE`            REPRODUCTION parente    ---
                          (0,n) --- REPRODUCTION  
                          dérivée (0,1)           

  `STOCKER`               REPRODUCTION (1,n) ---  rôle {master, dérivé,
                          FICHIER (0,n)           vignette}

  `DECOMPOSER`            REPRODUCTION (1,n) ---  ---
                          VUE (1,1)               
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## FICHIER

**Définition.** Fichier binaire. Son empreinte permet la déduplication
technique.

**Nature :** Entité/structure conceptuelle non déclarée comme
spécialisation d'`OBJET`.

### Attributs / propriétés explicitement nommés

  ------------------------------------------------------------------------
  Propriété source         Définition au   Type logique    Obligatoire ?
                           stade                           
                           dictionnaire                    
  ------------------------ --------------- --------------- ---------------
  `#id_fichier`            Propriété       **À DÉCIDER AU  **À DÉCIDER**
                           explicitement   MLD**           
                           portée par le                   
                           MCD. Sa                         
                           sémantique                      
                           détaillée doit                  
                           respecter la                    
                           définition de                   
                           l'objet et les                  
                           RG du domaine.                  

  `empreinte`              Propriété       **À DÉCIDER AU  **À DÉCIDER**
                           explicitement   MLD**           
                           portée par le                   
                           MCD. Sa                         
                           sémantique                      
                           détaillée doit                  
                           respecter la                    
                           définition de                   
                           l'objet et les                  
                           RG du domaine.                  

  `format`                 Propriété       **À DÉCIDER AU  **À DÉCIDER**
                           explicitement   MLD**           
                           portée par le                   
                           MCD. Sa                         
                           sémantique                      
                           détaillée doit                  
                           respecter la                    
                           définition de                   
                           l'objet et les                  
                           RG du domaine.                  

  `taille`                 Propriété       **À DÉCIDER AU  **À DÉCIDER**
                           explicitement   MLD**           
                           portée par le                   
                           MCD. Sa                         
                           sémantique                      
                           détaillée doit                  
                           respecter la                    
                           définition de                   
                           l'objet et les                  
                           RG du domaine.                  

  `emplacement_stockage`   Propriété       **À DÉCIDER AU  **À DÉCIDER**
                           explicitement   MLD**           
                           portée par le                   
                           MCD. Sa                         
                           sémantique                      
                           détaillée doit                  
                           respecter la                    
                           définition de                   
                           l'objet et les                  
                           RG du domaine.                  

  `date_depot`             Propriété       **À DÉCIDER AU  **À DÉCIDER**
                           explicitement   MLD**           
                           portée par le                   
                           MCD. Sa                         
                           sémantique                      
                           détaillée doit                  
                           respecter la                    
                           définition de                   
                           l'objet et les                  
                           RG du domaine.                  
  ------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `STOCKER`               REPRODUCTION (1,n) ---  rôle {master, dérivé,
                          FICHIER (0,n)           vignette}

  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## VUE

**Définition.** Image ou piste d'une reproduction.

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -------------------------------------------------------------------------------------
  Propriété source                           Définition au   Type logique Obligatoire ?
                                             stade                        
                                             dictionnaire                 
  ------------------------------------------ --------------- ------------ -------------
  `rang`                                     Propriété       **À DÉCIDER  **À DÉCIDER**
                                             explicitement   AU MLD**     
                                             portée par le                
                                             MCD. Sa                      
                                             sémantique                   
                                             détaillée doit               
                                             respecter la                 
                                             définition de                
                                             l'objet et les               
                                             RG du domaine.               

  `type {image, piste audio, piste vidéo}`   Propriété       **À DÉCIDER  **À DÉCIDER**
                                             explicitement   AU MLD**     
                                             portée par le                
                                             MCD. Sa                      
                                             sémantique                   
                                             détaillée doit               
                                             respecter la                 
                                             définition de                
                                             l'objet et les               
                                             RG du domaine.               

  `duree`                                    Propriété       **À DÉCIDER  **À DÉCIDER**
                                             explicitement   AU MLD**     
                                             portée par le                
                                             MCD. Sa                      
                                             sémantique                   
                                             détaillée doit               
                                             respecter la                 
                                             définition de                
                                             l'objet et les               
                                             RG du domaine.               
  -------------------------------------------------------------------------------------

### Associations connues

  Association    Cardinalités conceptuelles         Propriétés portées
  -------------- ---------------------------------- --------------------
  `DECOMPOSER`   REPRODUCTION (1,n) --- VUE (1,1)   ---
  `MONTRER`      VUE (0,n) --- PAGE (0,n)           ---
  `DELIMITER`    VUE (0,n) --- ZONE (1,1)           ---

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## ZONE

**Définition.** Fragment localisé d'une vue : région d'image, ligne,
plage temporelle. Point d'ancrage universel de la preuve.

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------------------------------------------------------------
  Propriété source                                                                      Définition au   Type      Obligatoire ?
                                                                                        stade           logique   
                                                                                        dictionnaire              
  ------------------------------------------------------------------------------------- --------------- --------- -------------
  `type_geometrie {rectangle, polygone, ligne, point, plage temporelle, vue entière}`   Propriété       **À       **À DÉCIDER**
                                                                                        explicitement   DÉCIDER   
                                                                                        portée par le   AU MLD**  
                                                                                        MCD. Sa                   
                                                                                        sémantique                
                                                                                        détaillée doit            
                                                                                        respecter la              
                                                                                        définition de             
                                                                                        l'objet et les            
                                                                                        RG du domaine.            

  `geometrie (GEOM image)`                                                              Propriété       **À       **À DÉCIDER**
                                                                                        explicitement   DÉCIDER   
                                                                                        portée par le   AU MLD**  
                                                                                        MCD. Sa                   
                                                                                        sémantique                
                                                                                        détaillée doit            
                                                                                        respecter la              
                                                                                        définition de             
                                                                                        l'objet et les            
                                                                                        RG du domaine.            

  `debut_ms`                                                                            Propriété       **À       **À DÉCIDER**
                                                                                        explicitement   DÉCIDER   
                                                                                        portée par le   AU MLD**  
                                                                                        MCD. Sa                   
                                                                                        sémantique                
                                                                                        détaillée doit            
                                                                                        respecter la              
                                                                                        définition de             
                                                                                        l'objet et les            
                                                                                        RG du domaine.            

  `fin_ms`                                                                              Propriété       **À       **À DÉCIDER**
                                                                                        explicitement   DÉCIDER   
                                                                                        portée par le   AU MLD**  
                                                                                        MCD. Sa                   
                                                                                        sémantique                
                                                                                        détaillée doit            
                                                                                        respecter la              
                                                                                        définition de             
                                                                                        l'objet et les            
                                                                                        RG du domaine.            

  `libelle`                                                                             Propriété       **À       **À DÉCIDER**
                                                                                        explicitement   DÉCIDER   
                                                                                        portée par le   AU MLD**  
                                                                                        MCD. Sa                   
                                                                                        sémantique                
                                                                                        détaillée doit            
                                                                                        respecter la              
                                                                                        définition de             
                                                                                        l'objet et les            
                                                                                        RG du domaine.            
  -----------------------------------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `DELIMITER`             VUE (0,n) --- ZONE      ---
                          (1,1)                   

  `SITUER`                ZONE (0,1) --- PAGE     ---
                          (0,n)                   

  `CITER_DOC`             DOCUMENT citant (0,n)   ---
                          ---                     
                          CITATION_DOCUMENTAIRE   
                          (1,1) ; DOCUMENT cité   
                          (0,n) --- (1,1) ;       
                          CITATION_DOCUMENTAIRE   
                          (0,n) --- ZONE (0,n)    
                          (ancrage)               
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## RESPONSABILITE

**Définition.** Association porteuse : rôle documentaire d'une entité
historique sur un document, un exemplaire ou une assertion (§ 16).

**Nature :** Entité/structure conceptuelle non déclarée comme
spécialisation d'`OBJET`.

### Attributs / propriétés explicitement nommés

  -------------------------------------------------------------------------
  Propriété source       Définition au    Type logique     Obligatoire ?
                         stade                             
                         dictionnaire                      
  ---------------------- ---------------- ---------------- ----------------
  `#id_responsabilite`   Propriété        **À DÉCIDER AU   **À DÉCIDER**
                         explicitement    MLD**            
                         portée par le                     
                         MCD. Sa                           
                         sémantique                        
                         détaillée doit                    
                         respecter la                      
                         définition de                     
                         l'objet et les                    
                         RG du domaine.                    

  `role ⟨D-17⟩`          Propriété        **À DÉCIDER AU   **À DÉCIDER**
                         explicitement    MLD**            
                         portée par le                     
                         MCD. Sa                           
                         sémantique                        
                         détaillée doit                    
                         respecter la                      
                         définition de                     
                         l'objet et les                    
                         RG du domaine.                    

  `certitude ⟨D-19⟩`     Propriété        **À DÉCIDER AU   **À DÉCIDER**
                         explicitement    MLD**            
                         portée par le                     
                         MCD. Sa                           
                         sémantique                        
                         détaillée doit                    
                         respecter la                      
                         définition de                     
                         l'objet et les                    
                         RG du domaine.                    
  -------------------------------------------------------------------------

### Associations connues

  Association            Cardinalités conceptuelles                         Propriétés portées
  ---------------------- -------------------------------------------------- --------------------
  `RESPONSABILITE_SUR`   OBJET (0,n) --- RESPONSABILITE (1,1)               ---
  `TENUE_PAR`            ENTITE_HISTORIQUE (0,n) --- RESPONSABILITE (1,1)   ---

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## CITATION_DOCUMENTAIRE

**Définition.** Un document en présente, cite, annexe, résume ou
reproduit un autre (§ 17).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ----------------------------------------------------------------------------------------------------------------------------------------
  Propriété source                                                                                 Définition au   Type      Obligatoire ?
                                                                                                   stade           logique   
                                                                                                   dictionnaire              
  ------------------------------------------------------------------------------------------------ --------------- --------- -------------
  `type {présenté, cité, annexé, résumé, reproduit, copie de, probablement utilisé, concordant}`   Propriété       **À       **À DÉCIDER**
                                                                                                   explicitement   DÉCIDER   
                                                                                                   portée par le   AU MLD**  
                                                                                                   MCD. Sa                   
                                                                                                   sémantique                
                                                                                                   détaillée doit            
                                                                                                   respecter la              
                                                                                                   définition de             
                                                                                                   l'objet et les            
                                                                                                   RG du domaine.            

  `certitude ⟨D-19⟩`                                                                               Propriété       **À       **À DÉCIDER**
                                                                                                   explicitement   DÉCIDER   
                                                                                                   portée par le   AU MLD**  
                                                                                                   MCD. Sa                   
                                                                                                   sémantique                
                                                                                                   détaillée doit            
                                                                                                   respecter la              
                                                                                                   définition de             
                                                                                                   l'objet et les            
                                                                                                   RG du domaine.            
  ----------------------------------------------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `CITER_DOC`             DOCUMENT citant (0,n)   ---
                          ---                     
                          CITATION_DOCUMENTAIRE   
                          (1,1) ; DOCUMENT cité   
                          (0,n) --- (1,1) ;       
                          CITATION_DOCUMENTAIRE   
                          (0,n) --- ZONE (0,n)    
                          (ancrage)               

  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## EMPLACEMENT

**Définition.** Emplacement (slot) d'une page d'album, vide ou occupé (§
32.3).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -------------------------------------------------------------------------------------
  Propriété source                          Définition au   Type logique  Obligatoire ?
                                            stade                         
                                            dictionnaire                  
  ----------------------------------------- --------------- ------------- -------------
  `position`                                Propriété       **À DÉCIDER   **À DÉCIDER**
                                            explicitement   AU MLD**      
                                            portée par le                 
                                            MCD. Sa                       
                                            sémantique                    
                                            détaillée doit                
                                            respecter la                  
                                            définition de                 
                                            l'objet et les                
                                            RG du domaine.                

  `etat {occupé, vide, trace de retrait}`   Propriété       **À DÉCIDER   **À DÉCIDER**
                                            explicitement   AU MLD**      
                                            portée par le                 
                                            MCD. Sa                       
                                            sémantique                    
                                            détaillée doit                
                                            respecter la                  
                                            définition de                 
                                            l'objet et les                
                                            RG du domaine.                

  `type_ordre ⟨D-18⟩`                       Propriété       **À DÉCIDER   **À DÉCIDER**
                                            explicitement   AU MLD**      
                                            portée par le                 
                                            MCD. Sa                       
                                            sémantique                    
                                            détaillée doit                
                                            respecter la                  
                                            définition de                 
                                            l'objet et les                
                                            RG du domaine.                
  -------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `OFFRIR`                PAGE (0,n) ---          ---
                          EMPLACEMENT (1,1)       

  `OCCUPER`               EMPLACEMENT (0,n) ---   periode, type_ordre
                          EXEMPLAIRE (photo)      
                          (0,n)                   
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## PRESCRIPTION

**Définition.** Une norme prescrit la production d'un type de document
sur un territoire et une période (§ 22).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ---------------------------------------------------------------------------------
  Propriété source                      Définition au   Type logique  Obligatoire ?
                                        stade                         
                                        dictionnaire                  
  ------------------------------------- --------------- ------------- -------------
  `periode (DATE_HIST)`                 Propriété       **À DÉCIDER   **À DÉCIDER**
                                        explicitement   AU MLD**      
                                        portée par le                 
                                        MCD. Sa                       
                                        sémantique                    
                                        détaillée doit                
                                        respecter la                  
                                        définition de                 
                                        l'objet et les                
                                        RG du domaine.                

  `type_document_attendu (→ CONCEPT)`   Propriété       **À DÉCIDER   **À DÉCIDER**
                                        explicitement   AU MLD**      
                                        portée par le                 
                                        MCD. Sa                       
                                        sémantique                    
                                        détaillée doit                
                                        respecter la                  
                                        définition de                 
                                        l'objet et les                
                                        RG du domaine.                

  `territoire (→ LIEU)`                 Propriété       **À DÉCIDER   **À DÉCIDER**
                                        explicitement   AU MLD**      
                                        portée par le                 
                                        MCD. Sa                       
                                        sémantique                    
                                        détaillée doit                
                                        respecter la                  
                                        définition de                 
                                        l'objet et les                
                                        RG du domaine.                
  ---------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `PRESCRIRE`             NORME (0,n) ---         ---
                          PRESCRIPTION (1,1) ;    
                          PRESCRIPTION (0,1) ---  
                          DOCUMENT (0,n)          

  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## SOURCE_EXTERNE_DECLAREE

**Définition.** Référence de source importée qui n'est pas
nécessairement identifiée comme DOCUMENT.

**Nature :** objet documentaire déclaratif.

### Attributs / propriétés explicitement nommés

  --------------------------------------------------------------------------------------------------
  Propriété source                                         Définition au   Type        Obligatoire ?
                                                           stade           logique     
                                                           dictionnaire                
  -------------------------------------------------------- --------------- ----------- -------------
  `état {non résolue, déclarée, rapprochée, identifiée}`   Propriété       **À DÉCIDER **À DÉCIDER**
                                                           explicitement   AU MLD**    
                                                           portée par le               
                                                           MCD. Sa                     
                                                           sémantique                  
                                                           détaillée doit              
                                                           respecter la                
                                                           définition de               
                                                           l'objet et les              
                                                           RG du domaine.              

  --------------------------------------------------------------------------------------------------

### Associations connues

Aucune association du tableau du domaine n'a été automatiquement
rattachée à ce nom ; vérifier les associations transversales du socle et
les consolidations canoniques.

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## Associations --- domaine C

  ------------------------------------------------------------------------
  Association            Cardinalités du MCD        Propriétés portées
  ---------------------- -------------------------- ----------------------
  `INCARNER`             DOCUMENT (0,n) ---         ---
                         EXEMPLAIRE (1,1)           

  `COMPORTER`            EXEMPLAIRE (0,n) --- PAGE  ---
                         (1,1)                      

  `LOCALISER`            EXEMPLAIRE (0,n) ---       type_ordre ⟨D-18⟩,
                         UNITE_ARCHIVISTIQUE (0,n)  rang, periode

  `CLASSER_DANS`         UNITE_ARCHIVISTIQUE enfant type_ordre ⟨D-18⟩,
                         (0,n) ---                  rang, periode
                         UNITE_ARCHIVISTIQUE parent 
                         (0,n)                      

  `CONSERVER`            UNITE_ARCHIVISTIQUE (0,1)  (historisé par
                         --- ORGANISATION (0,n)     versions)

  `COTER`                OBJET (DOCUMENT,           ---
                         EXEMPLAIRE ou              
                         UNITE_ARCHIVISTIQUE) (0,n) 
                         ---                        
                         IDENTIFIANT_DOCUMENTAIRE   
                         (1,1)                      

  `ACCEDER`              OBJET (DOCUMENT ou         ---
                         REPRODUCTION) (0,n) ---    
                         LOCALISATION_EN_LIGNE      
                         (1,1)                      

  `REPRODUIRE`           EXEMPLAIRE (0,n) ---       ---
                         REPRODUCTION (0,1)         

  `DERIVER_DE`           REPRODUCTION parente (0,n) ---
                         --- REPRODUCTION dérivée   
                         (0,1)                      

  `STOCKER`              REPRODUCTION (1,n) ---     rôle {master, dérivé,
                         FICHIER (0,n)              vignette}

  `DECOMPOSER`           REPRODUCTION (1,n) --- VUE ---
                         (1,1)                      

  `MONTRER`              VUE (0,n) --- PAGE (0,n)   ---

  `DELIMITER`            VUE (0,n) --- ZONE (1,1)   ---

  `SITUER`               ZONE (0,1) --- PAGE (0,n)  ---

  `RESPONSABILITE_SUR`   OBJET (0,n) ---            ---
                         RESPONSABILITE (1,1)       

  `TENUE_PAR`            ENTITE_HISTORIQUE (0,n)    ---
                         --- RESPONSABILITE (1,1)   

  `CITER_DOC`            DOCUMENT citant (0,n) ---  ---
                         CITATION_DOCUMENTAIRE      
                         (1,1) ; DOCUMENT cité      
                         (0,n) --- (1,1) ;          
                         CITATION_DOCUMENTAIRE      
                         (0,n) --- ZONE (0,n)       
                         (ancrage)                  

  `OFFRIR`               PAGE (0,n) --- EMPLACEMENT ---
                         (1,1)                      

  `OCCUPER`              EMPLACEMENT (0,n) ---      periode, type_ordre
                         EXEMPLAIRE (photo) (0,n)   

  `PRESCRIRE`            NORME (0,n) ---            ---
                         PRESCRIPTION (1,1) ;       
                         PRESCRIPTION (0,1) ---     
                         DOCUMENT (0,n)             
  ------------------------------------------------------------------------

## Règles de gestion --- domaine C

# Domaine D --- Lecture : transcription, annotation, mention, traces

**Couverture : 5 entités/objets, 8 associations, 0 règles RG.**

## TRANSCRIPTION

**Définition.** Une couche textuelle d'un document ou exemplaire, par un
auteur, dans un mode de lecture. Plusieurs couches et plusieurs lectures
concurrentes coexistent (§ 23.2, Q148).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ----------------------------------------------------------------------------------------------------
  Propriété source                                           Définition au   Type        Obligatoire ?
                                                             stade           logique     
                                                             dictionnaire                
  ---------------------------------------------------------- --------------- ----------- -------------
  `couche ⟨D-20⟩`                                            Propriété       **À DÉCIDER **À DÉCIDER**
                                                             explicitement   AU MLD**    
                                                             portée par le               
                                                             MCD. Sa                     
                                                             sémantique                  
                                                             détaillée doit              
                                                             respecter la                
                                                             définition de               
                                                             l'objet et les              
                                                             RG du domaine.              

  `langue`                                                   Propriété       **À DÉCIDER **À DÉCIDER**
                                                             explicitement   AU MLD**    
                                                             portée par le               
                                                             MCD. Sa                     
                                                             sémantique                  
                                                             détaillée doit              
                                                             respecter la                
                                                             définition de               
                                                             l'objet et les              
                                                             RG du domaine.              

  `ecriture (script)`                                        Propriété       **À DÉCIDER **À DÉCIDER**
                                                             explicitement   AU MLD**    
                                                             portée par le               
                                                             MCD. Sa                     
                                                             sémantique                  
                                                             détaillée doit              
                                                             respecter la                
                                                             définition de               
                                                             l'objet et les              
                                                             RG du domaine.              

  `mode_lecture {assistée, indépendante/aveugle}`            Propriété       **À DÉCIDER **À DÉCIDER**
                                                             explicitement   AU MLD**    
                                                             portée par le               
                                                             MCD. Sa                     
                                                             sémantique                  
                                                             détaillée doit              
                                                             respecter la                
                                                             définition de               
                                                             l'objet et les              
                                                             RG du domaine.              

  `statut {en cours, achevée selon protocole, abandonnée}`   Propriété       **À DÉCIDER **À DÉCIDER**
                                                             explicitement   AU MLD**    
                                                             portée par le               
                                                             MCD. Sa                     
                                                             sémantique                  
                                                             détaillée doit              
                                                             respecter la                
                                                             définition de               
                                                             l'objet et les              
                                                             RG du domaine.              
  ----------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `TRANSCRIRE`            OBJET (DOCUMENT ou      ---
                          EXEMPLAIRE) (0,n) ---   
                          TRANSCRIPTION (1,1)     

  `TRADUIRE`              TRANSCRIPTION source    ---
                          (0,n) --- TRANSCRIPTION 
                          traduction (0,1)        

  `SEGMENTER`             TRANSCRIPTION (1,n) --- ---
                          SEGMENT (1,1)           
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## SEGMENT

**Définition.** Unité de texte d'une transcription (ligne, mot,
paragraphe, marge), alignée sur des zones. Le désaccord de lecture se
localise ici.

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ----------------------------------------------------------------------------------------------------------
  Propriété source                                                  Définition au   Type       Obligatoire ?
                                                                    stade           logique    
                                                                    dictionnaire               
  ----------------------------------------------------------------- --------------- ---------- -------------
  `rang`                                                            Propriété       **À        **À DÉCIDER**
                                                                    explicitement   DÉCIDER AU 
                                                                    portée par le   MLD**      
                                                                    MCD. Sa                    
                                                                    sémantique                 
                                                                    détaillée doit             
                                                                    respecter la               
                                                                    définition de              
                                                                    l'objet et les             
                                                                    RG du domaine.             

  `texte`                                                           Propriété       **À        **À DÉCIDER**
                                                                    explicitement   DÉCIDER AU 
                                                                    portée par le   MLD**      
                                                                    MCD. Sa                    
                                                                    sémantique                 
                                                                    détaillée doit             
                                                                    respecter la               
                                                                    définition de              
                                                                    l'objet et les             
                                                                    RG du domaine.             

  `type {mot, ligne, paragraphe, marge, interligne}`                Propriété       **À        **À DÉCIDER**
                                                                    explicitement   DÉCIDER AU 
                                                                    portée par le   MLD**      
                                                                    MCD. Sa                    
                                                                    sémantique                 
                                                                    détaillée doit             
                                                                    respecter la               
                                                                    définition de              
                                                                    l'objet et les             
                                                                    RG du domaine.             

  `incertitude_lecture {certaine, probable, douteuse, illisible}`   Propriété       **À        **À DÉCIDER**
                                                                    explicitement   DÉCIDER AU 
                                                                    portée par le   MLD**      
                                                                    MCD. Sa                    
                                                                    sémantique                 
                                                                    détaillée doit             
                                                                    respecter la               
                                                                    définition de              
                                                                    l'objet et les             
                                                                    RG du domaine.             
  ----------------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `SEGMENTER`             TRANSCRIPTION (1,n) --- ---
                          SEGMENT (1,1)           

  `ALIGNER`               SEGMENT (0,n) --- ZONE  ---
                          (0,n)                   

  `ANCRER_ANNOTATION`     ANNOTATION (1,n) ---    ---
                          ZONE (0,n) / SEGMENT    
                          (0,n)                   

  `LOCALISER_MENTION`     MENTION (1,n) --- ZONE  role_probatoire ⟨D-08⟩
                          (0,n) / SEGMENT (0,n)   
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## ANNOTATION

**Définition.** Observation localisée, sans transcription nécessaire :
signature, tampon, rature, main, dommage, note de contexte, appareil
critique (§ 23.3, § 19.2).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ------------------------------------------------------------------------
  Propriété source         Définition au   Type logique    Obligatoire ?
                           stade                           
                           dictionnaire                    
  ------------------------ --------------- --------------- ---------------
  `type ⟨D-21⟩`            Propriété       **À DÉCIDER AU  **À DÉCIDER**
                           explicitement   MLD**           
                           portée par le                   
                           MCD. Sa                         
                           sémantique                      
                           détaillée doit                  
                           respecter la                    
                           définition de                   
                           l'objet et les                  
                           RG du domaine.                  

  `contenu`                Propriété       **À DÉCIDER AU  **À DÉCIDER**
                           explicitement   MLD**           
                           portée par le                   
                           MCD. Sa                         
                           sémantique                      
                           détaillée doit                  
                           respecter la                    
                           définition de                   
                           l'objet et les                  
                           RG du domaine.                  

  `visible_publiquement`   Propriété       **À DÉCIDER AU  **À DÉCIDER**
                           explicitement   MLD**           
                           portée par le                   
                           MCD. Sa                         
                           sémantique                      
                           détaillée doit                  
                           respecter la                    
                           définition de                   
                           l'objet et les                  
                           RG du domaine.                  
  ------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `ANCRER_ANNOTATION`     ANNOTATION (1,n) ---    ---
                          ZONE (0,n) / SEGMENT    
                          (0,n)                   

  `SIGNALER_CONTEXTE`     COMMUNAUTE (0,n) ---    ---
                          ANNOTATION (0,1)        
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## MENTION

**Définition.** Occurrence de quelque chose dans une source : nom,
désignation, visage, voix, signature. N'est pas une entité (§ 5).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  --------------------------------------------------------------------------------------------------------------------------------------------------------
  Propriété source                                                                                                 Définition au   Type      Obligatoire ?
                                                                                                                   stade           logique   
                                                                                                                   dictionnaire              
  ---------------------------------------------------------------------------------------------------------------- --------------- --------- -------------
  `texte_exact`                                                                                                    Propriété       **À       **À DÉCIDER**
                                                                                                                   explicitement   DÉCIDER   
                                                                                                                   portée par le   AU MLD**  
                                                                                                                   MCD. Sa                   
                                                                                                                   sémantique                
                                                                                                                   détaillée doit            
                                                                                                                   respecter la              
                                                                                                                   définition de             
                                                                                                                   l'objet et les            
                                                                                                                   RG du domaine.            

  `nature ⟨D-22⟩`                                                                                                  Propriété       **À       **À DÉCIDER**
                                                                                                                   explicitement   DÉCIDER   
                                                                                                                   portée par le   AU MLD**  
                                                                                                                   MCD. Sa                   
                                                                                                                   sémantique                
                                                                                                                   détaillée doit            
                                                                                                                   respecter la              
                                                                                                                   définition de             
                                                                                                                   l'objet et les            
                                                                                                                   RG du domaine.            

  `categorie_pressentie {personne, lieu, organisation, objet, bien, événement, collectif, date, montant, autre}`   Propriété       **À       **À DÉCIDER**
                                                                                                                   explicitement   DÉCIDER   
                                                                                                                   portée par le   AU MLD**  
                                                                                                                   MCD. Sa                   
                                                                                                                   sémantique                
                                                                                                                   détaillée doit            
                                                                                                                   respecter la              
                                                                                                                   définition de             
                                                                                                                   l'objet et les            
                                                                                                                   RG du domaine.            

  `statut_resolution ⟨D-23⟩`                                                                                       Propriété       **À       **À DÉCIDER**
                                                                                                                   explicitement   DÉCIDER   
                                                                                                                   portée par le   AU MLD**  
                                                                                                                   MCD. Sa                   
                                                                                                                   sémantique                
                                                                                                                   détaillée doit            
                                                                                                                   respecter la              
                                                                                                                   définition de             
                                                                                                                   l'objet et les            
                                                                                                                   RG du domaine.            
  --------------------------------------------------------------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `LOCALISER_MENTION`     MENTION (1,n) --- ZONE  role_probatoire ⟨D-08⟩
                          (0,n) / SEGMENT (0,n)   

  `REGROUPER`             MENTION (0,n) ---       degre {proposé,
                          REGROUPEMENT_TRACES     probable, examiné}
                          (0,n)                   
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## REGROUPEMENT_TRACES

**Définition.** Groupe de mentions attribuées à un même porteur non
identifié : individu visuel P-184, cluster vocal, main H-17 (§ 33).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ------------------------------------------------------------------------------------------------------------------------
  Propriété source                                                                 Définition au   Type      Obligatoire ?
                                                                                   stade           logique   
                                                                                   dictionnaire              
  -------------------------------------------------------------------------------- --------------- --------- -------------
  `type {individu visuel, cluster vocal, main d’écriture, signature récurrente}`   Propriété       **À       **À DÉCIDER**
                                                                                   explicitement   DÉCIDER   
                                                                                   portée par le   AU MLD**  
                                                                                   MCD. Sa                   
                                                                                   sémantique                
                                                                                   détaillée doit            
                                                                                   respecter la              
                                                                                   définition de             
                                                                                   l'objet et les            
                                                                                   RG du domaine.            

  `code`                                                                           Propriété       **À       **À DÉCIDER**
                                                                                   explicitement   DÉCIDER   
                                                                                   portée par le   AU MLD**  
                                                                                   MCD. Sa                   
                                                                                   sémantique                
                                                                                   détaillée doit            
                                                                                   respecter la              
                                                                                   définition de             
                                                                                   l'objet et les            
                                                                                   RG du domaine.            

  `statut {proposé, examiné, contesté}`                                            Propriété       **À       **À DÉCIDER**
                                                                                   explicitement   DÉCIDER   
                                                                                   portée par le   AU MLD**  
                                                                                   MCD. Sa                   
                                                                                   sémantique                
                                                                                   détaillée doit            
                                                                                   respecter la              
                                                                                   définition de             
                                                                                   l'objet et les            
                                                                                   RG du domaine.            
  ------------------------------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `REGROUPER`             MENTION (0,n) ---       degre {proposé,
                          REGROUPEMENT_TRACES     probable, examiné}
                          (0,n)                   

  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## Associations --- domaine D

  -----------------------------------------------------------------------
  Association             Cardinalités du MCD     Propriétés portées
  ----------------------- ----------------------- -----------------------
  `TRANSCRIRE`            OBJET (DOCUMENT ou      ---
                          EXEMPLAIRE) (0,n) ---   
                          TRANSCRIPTION (1,1)     

  `TRADUIRE`              TRANSCRIPTION source    ---
                          (0,n) --- TRANSCRIPTION 
                          traduction (0,1)        

  `SEGMENTER`             TRANSCRIPTION (1,n) --- ---
                          SEGMENT (1,1)           

  `ALIGNER`               SEGMENT (0,n) --- ZONE  ---
                          (0,n)                   

  `ANCRER_ANNOTATION`     ANNOTATION (1,n) ---    ---
                          ZONE (0,n) / SEGMENT    
                          (0,n)                   

  `SIGNALER_CONTEXTE`     COMMUNAUTE (0,n) ---    ---
                          ANNOTATION (0,1)        

  `LOCALISER_MENTION`     MENTION (1,n) --- ZONE  role_probatoire ⟨D-08⟩
                          (0,n) / SEGMENT (0,n)   

  `REGROUPER`             MENTION (0,n) ---       degre {proposé,
                          REGROUPEMENT_TRACES     probable, examiné}
                          (0,n)                   
  -----------------------------------------------------------------------

## Règles de gestion --- domaine D

# Domaine E --- Entités historiques

**Couverture : 16 entités/objets, 7 associations, 0 règles RG.**

## ENTITE_HISTORIQUE

**Définition.** Super-type abstrait de ce qui existe dans le monde
historique. Porte l'identité, jamais les faits.

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------------------------------------------
  Propriété source                                                   Définition au   Type       Obligatoire ?
                                                                     stade           logique    
                                                                     dictionnaire               
  ------------------------------------------------------------------ --------------- ---------- -------------
  `libelle_travail (technique, non historique)`                      Propriété       **À        **À DÉCIDER**
                                                                     explicitement   DÉCIDER AU 
                                                                     portée par le   MLD**      
                                                                     MCD. Sa                    
                                                                     sémantique                 
                                                                     détaillée doit             
                                                                     respecter la               
                                                                     définition de              
                                                                     l'objet et les             
                                                                     RG du domaine.             

  `note_individualisation`                                           Propriété       **À        **À DÉCIDER**
                                                                     explicitement   DÉCIDER AU 
                                                                     portée par le   MLD**      
                                                                     MCD. Sa                    
                                                                     sémantique                 
                                                                     détaillée doit             
                                                                     respecter la               
                                                                     définition de              
                                                                     l'objet et les             
                                                                     RG du domaine.             

  `densite_documentaire (calculée ; jamais un poids d’importance)`   Propriété       **À        **À DÉCIDER**
                                                                     explicitement   DÉCIDER AU 
                                                                     portée par le   MLD**      
                                                                     MCD. Sa                    
                                                                     sémantique                 
                                                                     détaillée doit             
                                                                     respecter la               
                                                                     définition de              
                                                                     l'objet et les             
                                                                     RG du domaine.             
  -----------------------------------------------------------------------------------------------------------

### Associations connues

  Association   Cardinalités conceptuelles                  Propriétés portées
  ------------- ------------------------------------------- --------------------
  `TYPER`       ENTITE_HISTORIQUE (1,1) --- CONCEPT (0,n)   ---

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## PERSONNE

**Définition.** ⊂ ENTITE_HISTORIQUE. Être humain individualisé par un
chercheur, même sans nom (§ 5 cas A, § 6). Une personne réduite en
esclavage reste une PERSONNE (§ 6.5).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ----------------------------------------------------------------------------------------------------------------------------------------------------
  Propriété source                                                                                             Définition au   Type      Obligatoire ?
                                                                                                               stade           logique   
                                                                                                               dictionnaire              
  ------------------------------------------------------------------------------------------------------------ --------------- --------- -------------
  `mode_individualisation {nommée, prénom seul, surnom/désignation, anonyme individualisée}`                   Propriété       **À       **À DÉCIDER**
                                                                                                               explicitement   DÉCIDER   
                                                                                                               portée par le   AU MLD**  
                                                                                                               MCD. Sa                   
                                                                                                               sémantique                
                                                                                                               détaillée doit            
                                                                                                               respecter la              
                                                                                                               définition de             
                                                                                                               l'objet et les            
                                                                                                               RG du domaine.            

  `regime_protection {vivant attesté, raisonnablement présumé vivant, décédé attesté, statut vital inconnu}`   Propriété       **À       **À DÉCIDER**
                                                                                                               explicitement   DÉCIDER   
                                                                                                               portée par le   AU MLD**  
                                                                                                               MCD. Sa                   
                                                                                                               sémantique                
                                                                                                               détaillée doit            
                                                                                                               respecter la              
                                                                                                               définition de             
                                                                                                               l'objet et les            
                                                                                                               RG du domaine.            

  `mineur_protege`                                                                                             Propriété       **À       **À DÉCIDER**
                                                                                                               explicitement   DÉCIDER   
                                                                                                               portée par le   AU MLD**  
                                                                                                               MCD. Sa                   
                                                                                                               sémantique                
                                                                                                               détaillée doit            
                                                                                                               respecter la              
                                                                                                               définition de             
                                                                                                               l'objet et les            
                                                                                                               RG du domaine.            

  `date_reevaluation_protection`                                                                               Propriété       **À       **À DÉCIDER**
                                                                                                               explicitement   DÉCIDER   
                                                                                                               portée par le   AU MLD**  
                                                                                                               MCD. Sa                   
                                                                                                               sémantique                
                                                                                                               détaillée doit            
                                                                                                               respecter la              
                                                                                                               définition de             
                                                                                                               l'objet et les            
                                                                                                               RG du domaine.            
  ----------------------------------------------------------------------------------------------------------------------------------------------------

### Associations connues

Aucune association du tableau du domaine n'a été automatiquement
rattachée à ce nom ; vérifier les associations transversales du socle et
les consolidations canoniques.

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## LIEU

**Définition.** ⊂ ENTITE_HISTORIQUE. Lieu historique, même disparu ou
sans coordonnées (§ 27).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  --------------------------------------------------------------------------------------------
  Propriété source                                  Définition au   Type logique Obligatoire ?
                                                    stade                        
                                                    dictionnaire                 
  ------------------------------------------------- --------------- ------------ -------------
  `couche_spatiale ⟨D-24⟩`                          Propriété       **À DÉCIDER  **À DÉCIDER**
                                                    explicitement   AU MLD**     
                                                    portée par le                
                                                    MCD. Sa                      
                                                    sémantique                   
                                                    détaillée doit               
                                                    respecter la                 
                                                    définition de                
                                                    l'objet et les               
                                                    RG du domaine.               

  `existence_actuelle {existe, disparu, inconnu}`   Propriété       **À DÉCIDER  **À DÉCIDER**
                                                    explicitement   AU MLD**     
                                                    portée par le                
                                                    MCD. Sa                      
                                                    sémantique                   
                                                    détaillée doit               
                                                    respecter la                 
                                                    définition de                
                                                    l'objet et les               
                                                    RG du domaine.               
  --------------------------------------------------------------------------------------------

### Associations connues

  Association   Cardinalités conceptuelles          Propriétés portées
  ------------- ----------------------------------- --------------------
  `A_LIEU`      ETAPE_VOYAGE (0,1) --- LIEU (0,n)   ---

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## ORGANISATION

**Définition.** ⊂ ENTITE_HISTORIQUE. Mairie, paroisse, tribunal, étude
notariale, service d'archives, habitation-exploitation, unité
militaire... (§ 29.1).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ------------------------------------------------------------------------
  Propriété source         Définition au   Type logique    Obligatoire ?
                           stade                           
                           dictionnaire                    
  ------------------------ --------------- --------------- ---------------
  `nature (via CONCEPT)`   Propriété       **À DÉCIDER AU  **À DÉCIDER**
                           explicitement   MLD**           
                           portée par le                   
                           MCD. Sa                         
                           sémantique                      
                           détaillée doit                  
                           respecter la                    
                           définition de                   
                           l'objet et les                  
                           RG du domaine.                  

  ------------------------------------------------------------------------

### Associations connues

Aucune association du tableau du domaine n'a été automatiquement
rattachée à ce nom ; vérifier les associations transversales du socle et
les consolidations canoniques.

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## FONCTION

**Définition.** ⊂ ENTITE_HISTORIQUE. Poste ou fonction, distinct de
l'organisation et de son titulaire (§ 29.3).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -------------------------------------------------------------------------
  Propriété source       Définition au    Type logique     Obligatoire ?
                         stade                             
                         dictionnaire                      
  ---------------------- ---------------- ---------------- ----------------
  `intitule_generique`   Propriété        **À DÉCIDER AU   **À DÉCIDER**
                         explicitement    MLD**            
                         portée par le                     
                         MCD. Sa                           
                         sémantique                        
                         détaillée doit                    
                         respecter la                      
                         définition de                     
                         l'objet et les                    
                         RG du domaine.                    

  -------------------------------------------------------------------------

### Associations connues

Aucune association du tableau du domaine n'a été automatiquement
rattachée à ce nom ; vérifier les associations transversales du socle et
les consolidations canoniques.

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## FAMILLE

**Définition.** ⊂ ENTITE_HISTORIQUE. Groupe de parenté, distinct du
foyer et du logement (§ 13.3).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -------------------------------------------------------------------------
  Propriété source       Définition au    Type logique     Obligatoire ?
                         stade                             
                         dictionnaire                      
  ---------------------- ---------------- ---------------- ----------------
  `critere_definition`   Propriété        **À DÉCIDER AU   **À DÉCIDER**
                         explicitement    MLD**            
                         portée par le                     
                         MCD. Sa                           
                         sémantique                        
                         détaillée doit                    
                         respecter la                      
                         définition de                     
                         l'objet et les                    
                         RG du domaine.                    

  -------------------------------------------------------------------------

### Associations connues

Aucune association du tableau du domaine n'a été automatiquement
rattachée à ce nom ; vérifier les associations transversales du socle et
les consolidations canoniques.

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## COLLECTIF_HISTORIQUE

**Définition.** ⊂ ENTITE_HISTORIQUE. Collectif attesté : convoi, foyer
observé, équipage, atelier, population d'une habitation. Composition
éventuellement partielle (§ 13.1).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ------------------------------------------------------------------------------------------------------------------------------------
  Propriété source                                                                             Définition au   Type      Obligatoire ?
                                                                                               stade           logique   
                                                                                               dictionnaire              
  -------------------------------------------------------------------------------------------- --------------- --------- -------------
  `nature {convoi, foyer, équipage, groupe de travailleurs, association, population, autre}`   Propriété       **À       **À DÉCIDER**
                                                                                               explicitement   DÉCIDER   
                                                                                               portée par le   AU MLD**  
                                                                                               MCD. Sa                   
                                                                                               sémantique                
                                                                                               détaillée doit            
                                                                                               respecter la              
                                                                                               définition de             
                                                                                               l'objet et les            
                                                                                               RG du domaine.            

  `effectif_declare (VALEUR)`                                                                  Propriété       **À       **À DÉCIDER**
                                                                                               explicitement   DÉCIDER   
                                                                                               portée par le   AU MLD**  
                                                                                               MCD. Sa                   
                                                                                               sémantique                
                                                                                               détaillée doit            
                                                                                               respecter la              
                                                                                               définition de             
                                                                                               l'objet et les            
                                                                                               RG du domaine.            

  `date_observation (DATE_HIST, pour un foyer)`                                                Propriété       **À       **À DÉCIDER**
                                                                                               explicitement   DÉCIDER   
                                                                                               portée par le   AU MLD**  
                                                                                               MCD. Sa                   
                                                                                               sémantique                
                                                                                               détaillée doit            
                                                                                               respecter la              
                                                                                               définition de             
                                                                                               l'objet et les            
                                                                                               RG du domaine.            

  `composition_connue {complète, partielle, inconnue}`                                         Propriété       **À       **À DÉCIDER**
                                                                                               explicitement   DÉCIDER   
                                                                                               portée par le   AU MLD**  
                                                                                               MCD. Sa                   
                                                                                               sémantique                
                                                                                               détaillée doit            
                                                                                               respecter la              
                                                                                               définition de             
                                                                                               l'objet et les            
                                                                                               RG du domaine.            
  ------------------------------------------------------------------------------------------------------------------------------------

### Associations connues

Aucune association du tableau du domaine n'a été automatiquement
rattachée à ce nom ; vérifier les associations transversales du socle et
les consolidations canoniques.

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## OBJET_MATERIEL

**Définition.** ⊂ ENTITE_HISTORIQUE. Objet individualisé quand c'est
historiquement utile ; navire = type Objet \> Moyen de transport \>
Navire (§ 30).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ------------------------------------------------------------------------
  Propriété source         Définition au   Type logique    Obligatoire ?
                           stade                           
                           dictionnaire                    
  ------------------------ --------------- --------------- ---------------
  `nature (via CONCEPT)`   Propriété       **À DÉCIDER AU  **À DÉCIDER**
                           explicitement   MLD**           
                           portée par le                   
                           MCD. Sa                         
                           sémantique                      
                           détaillée doit                  
                           respecter la                    
                           définition de                   
                           l'objet et les                  
                           RG du domaine.                  

  ------------------------------------------------------------------------

### Associations connues

  Association   Cardinalités conceptuelles                    Propriétés portées
  ------------- --------------------------------------------- --------------------
  `MOYEN`       ETAPE_VOYAGE (0,1) --- OBJET_MATERIEL (0,n)   ---

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## BIEN

**Définition.** ⊂ ENTITE_HISTORIQUE. Bien ou actif, séparé du lieu (§
27.6, § 30.1).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ---------------------------------------------------------------------------------------------------
  Propriété source                                          Définition au   Type        Obligatoire ?
                                                            stade           logique     
                                                            dictionnaire                
  --------------------------------------------------------- --------------- ----------- -------------
  `nature {terre, maison, parcelle, rente, fonds, autre}`   Propriété       **À DÉCIDER **À DÉCIDER**
                                                            explicitement   AU MLD**    
                                                            portée par le               
                                                            MCD. Sa                     
                                                            sémantique                  
                                                            détaillée doit              
                                                            respecter la                
                                                            définition de               
                                                            l'objet et les              
                                                            RG du domaine.              

  ---------------------------------------------------------------------------------------------------

### Associations connues

Aucune association du tableau du domaine n'a été automatiquement
rattachée à ce nom ; vérifier les associations transversales du socle et
les consolidations canoniques.

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## NORME

**Définition.** ⊂ ENTITE_HISTORIQUE. Loi, décret, règlement, décision,
quand c'est utile (§ 22).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------------------------------------
  Propriété source                                             Définition au   Type       Obligatoire ?
                                                               stade           logique    
                                                               dictionnaire               
  ------------------------------------------------------------ --------------- ---------- -------------
  `nature {loi, décret, règlement, arrêté, décision, autre}`   Propriété       **À        **À DÉCIDER**
                                                               explicitement   DÉCIDER AU 
                                                               portée par le   MLD**      
                                                               MCD. Sa                    
                                                               sémantique                 
                                                               détaillée doit             
                                                               respecter la               
                                                               définition de              
                                                               l'objet et les             
                                                               RG du domaine.             

  -----------------------------------------------------------------------------------------------------

### Associations connues

Aucune association du tableau du domaine n'a été automatiquement
rattachée à ce nom ; vérifier les associations transversales du socle et
les consolidations canoniques.

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## EVENEMENT

**Définition.** ⊂ ENTITE_HISTORIQUE. Occurrence identifiable, y compris
décisions, autorisations et non-événements (§ 10.1, § 36, § 37).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ------------------------------------------------------------------------
  Propriété source         Définition au   Type logique    Obligatoire ?
                           stade                           
                           dictionnaire                    
  ------------------------ --------------- --------------- ---------------
  `nature (via CONCEPT)`   Propriété       **À DÉCIDER AU  **À DÉCIDER**
                           explicitement   MLD**           
                           portée par le                   
                           MCD. Sa                         
                           sémantique                      
                           détaillée doit                  
                           respecter la                    
                           définition de                   
                           l'objet et les                  
                           RG du domaine.                  

  `mode_realite ⟨D-25⟩`    Propriété       **À DÉCIDER AU  **À DÉCIDER**
                           explicitement   MLD**           
                           portée par le                   
                           MCD. Sa                         
                           sémantique                      
                           détaillée doit                  
                           respecter la                    
                           définition de                   
                           l'objet et les                  
                           RG du domaine.                  
  ------------------------------------------------------------------------

### Associations connues

  Association   Cardinalités conceptuelles        Propriétés portées
  ------------- --------------------------------- --------------------
  `RACONTER`    EVENEMENT (0,n) --- RECIT (1,1)   ---

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## VOYAGE

**Définition.** ⊂ EVENEMENT. Déplacement structuré en étapes (§ 28).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

Aucune propriété propre n'est explicitement détaillée dans le tableau du
MCD ; les informations peuvent être portées par le socle, une version,
une association ou une spécialisation.

### Associations connues

  Association   Cardinalités conceptuelles            Propriétés portées
  ------------- ------------------------------------- --------------------
  `ETAPE`       VOYAGE (1,n) --- ETAPE_VOYAGE (1,1)   ---

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## ETAPE_VOYAGE

**Définition.** Étape d'un voyage, avec sa propre preuve.

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  --------------------------------------------------------------------------------------------
  Propriété source                                  Définition au   Type logique Obligatoire ?
                                                    stade                        
                                                    dictionnaire                 
  ------------------------------------------------- --------------- ------------ -------------
  `rang`                                            Propriété       **À DÉCIDER  **À DÉCIDER**
                                                    explicitement   AU MLD**     
                                                    portée par le                
                                                    MCD. Sa                      
                                                    sémantique                   
                                                    détaillée doit               
                                                    respecter la                 
                                                    définition de                
                                                    l'objet et les               
                                                    RG du domaine.               

  `date (DATE_HIST)`                                Propriété       **À DÉCIDER  **À DÉCIDER**
                                                    explicitement   AU MLD**     
                                                    portée par le                
                                                    MCD. Sa                      
                                                    sémantique                   
                                                    détaillée doit               
                                                    respecter la                 
                                                    définition de                
                                                    l'objet et les               
                                                    RG du domaine.               

  `statut {attestée, reconstruite, hypothétique}`   Propriété       **À DÉCIDER  **À DÉCIDER**
                                                    explicitement   AU MLD**     
                                                    portée par le                
                                                    MCD. Sa                      
                                                    sémantique                   
                                                    détaillée doit               
                                                    respecter la                 
                                                    définition de                
                                                    l'objet et les               
                                                    RG du domaine.               
  --------------------------------------------------------------------------------------------

### Associations connues

  Association   Cardinalités conceptuelles                    Propriétés portées
  ------------- --------------------------------------------- --------------------
  `ETAPE`       VOYAGE (1,n) --- ETAPE_VOYAGE (1,1)           ---
  `A_LIEU`      ETAPE_VOYAGE (0,1) --- LIEU (0,n)             ---
  `MOYEN`       ETAPE_VOYAGE (0,1) --- OBJET_MATERIEL (0,n)   ---

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## PHENOMENE

**Définition.** ⊂ ENTITE_HISTORIQUE. Objet fédérateur : épidémie,
cyclone, guerre, famine, grève, révolte, incendie (§ 27.10).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ------------------------------------------------------------------------
  Propriété source         Définition au   Type logique    Obligatoire ?
                           stade                           
                           dictionnaire                    
  ------------------------ --------------- --------------- ---------------
  `nature (via CONCEPT)`   Propriété       **À DÉCIDER AU  **À DÉCIDER**
                           explicitement   MLD**           
                           portée par le                   
                           MCD. Sa                         
                           sémantique                      
                           détaillée doit                  
                           respecter la                    
                           définition de                   
                           l'objet et les                  
                           RG du domaine.                  

  ------------------------------------------------------------------------

### Associations connues

Aucune association du tableau du domaine n'a été automatiquement
rattachée à ce nom ; vérifier les associations transversales du socle et
les consolidations canoniques.

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## TRADITION

**Définition.** ⊂ ENTITE_HISTORIQUE. Tradition ou légende familiale
comme objet historique, avec ses variantes et sa transmission (§ 110).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ------------------------------------------------------------------------------------------
  Propriété source                                Définition au   Type logique Obligatoire ?
                                                  stade                        
                                                  dictionnaire                 
  ----------------------------------------------- --------------- ------------ -------------
  `origine_connue {connue, supposée, inconnue}`   Propriété       **À DÉCIDER  **À DÉCIDER**
                                                  explicitement   AU MLD**     
                                                  portée par le                
                                                  MCD. Sa                      
                                                  sémantique                   
                                                  détaillée doit               
                                                  respecter la                 
                                                  définition de                
                                                  l'objet et les               
                                                  RG du domaine.               

  ------------------------------------------------------------------------------------------

### Associations connues

Aucune association du tableau du domaine n'a été automatiquement
rattachée à ce nom ; vérifier les associations transversales du socle et
les consolidations canoniques.

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## RECIT

**Définition.** Version d'un événement selon un point de vue : accusé,
témoin, tribunal, presse... La version judiciaire n'est pas la réalité
(§ 35).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ---------------------------------------------------------------------------------------------------------------------------------------
  Propriété source                                                                                Définition au   Type      Obligatoire ?
                                                                                                  stade           logique   
                                                                                                  dictionnaire              
  ----------------------------------------------------------------------------------------------- --------------- --------- -------------
  `point_de_vue {accusé, victime, témoin, police, tribunal, presse, famille, chercheur, autre}`   Propriété       **À       **À DÉCIDER**
                                                                                                  explicitement   DÉCIDER   
                                                                                                  portée par le   AU MLD**  
                                                                                                  MCD. Sa                   
                                                                                                  sémantique                
                                                                                                  détaillée doit            
                                                                                                  respecter la              
                                                                                                  définition de             
                                                                                                  l'objet et les            
                                                                                                  RG du domaine.            

  `resume`                                                                                        Propriété       **À       **À DÉCIDER**
                                                                                                  explicitement   DÉCIDER   
                                                                                                  portée par le   AU MLD**  
                                                                                                  MCD. Sa                   
                                                                                                  sémantique                
                                                                                                  détaillée doit            
                                                                                                  respecter la              
                                                                                                  définition de             
                                                                                                  l'objet et les            
                                                                                                  RG du domaine.            
  ---------------------------------------------------------------------------------------------------------------------------------------

### Associations connues

  Association         Cardinalités conceptuelles        Propriétés portées
  ------------------- --------------------------------- --------------------
  `RACONTER`          EVENEMENT (0,n) --- RECIT (1,1)   ---
  `SOURCE_DU_RECIT`   RECIT (0,1) --- DOCUMENT (0,n)    ---
  `COMPOSER_RECIT`    RECIT (0,n) --- ASSERTION (0,n)   rang (séquence)

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## Associations --- domaine E

  Association         Cardinalités du MCD                           Propriétés portées
  ------------------- --------------------------------------------- --------------------
  `TYPER`             ENTITE_HISTORIQUE (1,1) --- CONCEPT (0,n)     ---
  `ETAPE`             VOYAGE (1,n) --- ETAPE_VOYAGE (1,1)           ---
  `A_LIEU`            ETAPE_VOYAGE (0,1) --- LIEU (0,n)             ---
  `MOYEN`             ETAPE_VOYAGE (0,1) --- OBJET_MATERIEL (0,n)   ---
  `RACONTER`          EVENEMENT (0,n) --- RECIT (1,1)               ---
  `SOURCE_DU_RECIT`   RECIT (0,1) --- DOCUMENT (0,n)                ---
  `COMPOSER_RECIT`    RECIT (0,n) --- ASSERTION (0,n)               rang (séquence)

## Règles de gestion --- domaine E

# Domaine F --- Identification et identité

**Couverture : 7 entités/objets, 10 associations, 0 règles RG.**

## PROPOSITION_IDENTIFICATION

**Définition.** Hypothèse « cette mention (ou ce regroupement)
correspond à cette entité / à cette position ». Plusieurs propositions
concurrentes pour une même mention = plusieurs candidats (§ 6, § 8.1, §
8.2).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  --------------------------------------------------------------------------------------------------
  Propriété source                                         Définition au   Type        Obligatoire ?
                                                           stade           logique     
                                                           dictionnaire                
  -------------------------------------------------------- --------------- ----------- -------------
  `plausibilite ⟨D-19⟩`                                    Propriété       **À DÉCIDER **À DÉCIDER**
                                                           explicitement   AU MLD**    
                                                           portée par le               
                                                           MCD. Sa                     
                                                           sémantique                  
                                                           détaillée doit              
                                                           respecter la                
                                                           définition de               
                                                           l'objet et les              
                                                           RG du domaine.              

  `verdict {même entité, entité distincte, indéterminé}`   Propriété       **À DÉCIDER **À DÉCIDER**
                                                           explicitement   AU MLD**    
                                                           portée par le               
                                                           MCD. Sa                     
                                                           sémantique                  
                                                           détaillée doit              
                                                           respecter la                
                                                           définition de               
                                                           l'objet et les              
                                                           RG du domaine.              

  `justification`                                          Propriété       **À DÉCIDER **À DÉCIDER**
                                                           explicitement   AU MLD**    
                                                           portée par le               
                                                           MCD. Sa                     
                                                           sémantique                  
                                                           détaillée doit              
                                                           respecter la                
                                                           définition de               
                                                           l'objet et les              
                                                           RG du domaine.              
  --------------------------------------------------------------------------------------------------

### Associations connues

  ------------------------------------------------------------------------
  Association           Cardinalités conceptuelles   Propriétés portées
  --------------------- ---------------------------- ---------------------
  `IDENTIFIER`          MENTION (0,n) ou             ---
                        REGROUPEMENT_TRACES (0,n)    
                        ---                          
                        PROPOSITION_IDENTIFICATION   
                        (0,1)                        

  `VERS_ENTITE`         PROPOSITION_IDENTIFICATION   ---
                        (0,1) --- ENTITE_HISTORIQUE  
                        (0,n)                        

  `VERS_POSITION`       PROPOSITION_IDENTIFICATION   ---
                        (0,1) --- POSITION (0,n)     
  ------------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## POSITION

**Définition.** Super-type d'une place humaine connue sans individu
déterminé.

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -------------------------------------------------------------------------------------------
  Propriété source                                 Définition au   Type logique Obligatoire ?
                                                   stade                        
                                                   dictionnaire                 
  ------------------------------------------------ --------------- ------------ -------------
  `description`                                    Propriété       **À DÉCIDER  **À DÉCIDER**
                                                   explicitement   AU MLD**     
                                                   portée par le                
                                                   MCD. Sa                      
                                                   sémantique                   
                                                   détaillée doit               
                                                   respecter la                 
                                                   définition de                
                                                   l'objet et les               
                                                   RG du domaine.               

  `rang`                                           Propriété       **À DÉCIDER  **À DÉCIDER**
                                                   explicitement   AU MLD**     
                                                   portée par le                
                                                   MCD. Sa                      
                                                   sémantique                   
                                                   détaillée doit               
                                                   respecter la                 
                                                   définition de                
                                                   l'objet et les               
                                                   RG du domaine.               

  `statut {ouverte, résolue, déclarée inconnue}`   Propriété       **À DÉCIDER  **À DÉCIDER**
                                                   explicitement   AU MLD**     
                                                   portée par le                
                                                   MCD. Sa                      
                                                   sémantique                   
                                                   détaillée doit               
                                                   respecter la                 
                                                   définition de                
                                                   l'objet et les               
                                                   RG du domaine.               
  -------------------------------------------------------------------------------------------

### Associations connues

  ------------------------------------------------------------------------
  Association           Cardinalités conceptuelles   Propriétés portées
  --------------------- ---------------------------- ---------------------
  `VERS_POSITION`       PROPOSITION_IDENTIFICATION   ---
                        (0,1) --- POSITION (0,n)     

  `CANDIDAT_POUR`       POSITION (0,n) ---           ---
                        CANDIDATURE (1,1)            
  ------------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## POSITION_RELATIONNELLE

**Définition.** ⊂ POSITION. « L'un des fils de Jean DUPONT », « l'une
des trois sœurs », « un membre parmi 24 du convoi », position impliquée
par un compte (§ 6.3, Q135).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  Propriété source                                                                                                                   Définition au   Type      Obligatoire ?
                                                                                                                                     stade           logique   
                                                                                                                                     dictionnaire              
  ---------------------------------------------------------------------------------------------------------------------------------- --------------- --------- -------------
  `nature {un parmi des candidats, membre non individualisé d’un collectif, position impliquée par un compte, position manquante}`   Propriété       **À       **À DÉCIDER**
                                                                                                                                     explicitement   DÉCIDER   
                                                                                                                                     portée par le   AU MLD**  
                                                                                                                                     MCD. Sa                   
                                                                                                                                     sémantique                
                                                                                                                                     détaillée doit            
                                                                                                                                     respecter la              
                                                                                                                                     définition de             
                                                                                                                                     l'objet et les            
                                                                                                                                     RG du domaine.            

  `effectif_implique`                                                                                                                Propriété       **À       **À DÉCIDER**
                                                                                                                                     explicitement   DÉCIDER   
                                                                                                                                     portée par le   AU MLD**  
                                                                                                                                     MCD. Sa                   
                                                                                                                                     sémantique                
                                                                                                                                     détaillée doit            
                                                                                                                                     respecter la              
                                                                                                                                     définition de             
                                                                                                                                     l'objet et les            
                                                                                                                                     RG du domaine.            
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association            Cardinalités             Propriétés portées
                         conceptuelles            
  ---------------------- ------------------------ -----------------------
  `REFERENCE`            POSITION_RELATIONNELLE   ---
                         (0,1) ---                
                         ENTITE_HISTORIQUE (0,n)  

  `RELATION_TYPE`        POSITION_RELATIONNELLE   ---
                         (0,1) --- CONCEPT (0,n)  

  `MEMBRE_DE`            POSITION_RELATIONNELLE   ---
                         (0,1) ---                
                         COLLECTIF_HISTORIQUE     
                         (0,n)                    
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## ELEMENT_RECONSTRUIT

**Définition.** ⊂ POSITION. Élément d'un document perdu reconstruit
(domaine I).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------
  Propriété source  Définition au     Type logique      Obligatoire ?
                    stade                               
                    dictionnaire                        
  ----------------- ----------------- ----------------- -----------------
  `voir § 11`       Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  -----------------------------------------------------------------------

### Associations connues

Aucune association du tableau du domaine n'a été automatiquement
rattachée à ce nom ; vérifier les associations transversales du socle et
les consolidations canoniques.

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## CANDIDATURE

**Définition.** Une entité candidate pour une position, avec sa
plausibilité et son statut ; les candidats écartés restent (Q138).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -------------------------------------------------------------------------------------------------------
  Propriété source                                               Définition au   Type       Obligatoire ?
                                                                 stade           logique    
                                                                 dictionnaire               
  -------------------------------------------------------------- --------------- ---------- -------------
  `plausibilite ⟨D-19⟩`                                          Propriété       **À        **À DÉCIDER**
                                                                 explicitement   DÉCIDER AU 
                                                                 portée par le   MLD**      
                                                                 MCD. Sa                    
                                                                 sémantique                 
                                                                 détaillée doit             
                                                                 respecter la               
                                                                 définition de              
                                                                 l'objet et les             
                                                                 RG du domaine.             

  `statut {en lice, écartée provisoirement, rejetée, retenue}`   Propriété       **À        **À DÉCIDER**
                                                                 explicitement   DÉCIDER AU 
                                                                 portée par le   MLD**      
                                                                 MCD. Sa                    
                                                                 sémantique                 
                                                                 détaillée doit             
                                                                 respecter la               
                                                                 définition de              
                                                                 l'objet et les             
                                                                 RG du domaine.             

  `motif`                                                        Propriété       **À        **À DÉCIDER**
                                                                 explicitement   DÉCIDER AU 
                                                                 portée par le   MLD**      
                                                                 MCD. Sa                    
                                                                 sémantique                 
                                                                 détaillée doit             
                                                                 respecter la               
                                                                 définition de              
                                                                 l'objet et les             
                                                                 RG du domaine.             
  -------------------------------------------------------------------------------------------------------

### Associations connues

  Association       Cardinalités conceptuelles                      Propriétés portées
  ----------------- ----------------------------------------------- --------------------
  `CANDIDAT_POUR`   POSITION (0,n) --- CANDIDATURE (1,1)            ---
  `CANDIDAT`        ENTITE_HISTORIQUE (0,n) --- CANDIDATURE (1,1)   ---

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## RAPPROCHEMENT

**Définition.** Hypothèse d'identité entre deux entités : même personne,
personnes distinctes, indéterminé. Porte la fusion logique réversible et
le lien Tree → Core (§ 7, § 8.3, § 26.2).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ---------------------------------------------------------------------------------------------------------------
  Propriété source                                                        Définition au   Type      Obligatoire ?
                                                                          stade           logique   
                                                                          dictionnaire              
  ----------------------------------------------------------------------- --------------- --------- -------------
  `verdict {même entité, entités distinctes, indéterminé}`                Propriété       **À       **À DÉCIDER**
                                                                          explicitement   DÉCIDER   
                                                                          portée par le   AU MLD**  
                                                                          MCD. Sa                   
                                                                          sémantique                
                                                                          détaillée doit            
                                                                          respecter la              
                                                                          définition de             
                                                                          l'objet et les            
                                                                          RG du domaine.            

  `presentation_fusionnee (booléen)`                                      Propriété       **À       **À DÉCIDER**
                                                                          explicitement   DÉCIDER   
                                                                          portée par le   AU MLD**  
                                                                          MCD. Sa                   
                                                                          sémantique                
                                                                          détaillée doit            
                                                                          respecter la              
                                                                          définition de             
                                                                          l'objet et les            
                                                                          RG du domaine.            

  `portee {intra-espace, privé→Core partagé, Tree↔Tree, inter-espaces}`   Propriété       **À       **À DÉCIDER**
                                                                          explicitement   DÉCIDER   
                                                                          portée par le   AU MLD**  
                                                                          MCD. Sa                   
                                                                          sémantique                
                                                                          détaillée doit            
                                                                          respecter la              
                                                                          définition de             
                                                                          l'objet et les            
                                                                          RG du domaine.            

  `justification`                                                         Propriété       **À       **À DÉCIDER**
                                                                          explicitement   DÉCIDER   
                                                                          portée par le   AU MLD**  
                                                                          MCD. Sa                   
                                                                          sémantique                
                                                                          détaillée doit            
                                                                          respecter la              
                                                                          définition de             
                                                                          l'objet et les            
                                                                          RG du domaine.            
  ---------------------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `RAPPROCHER`            ENTITE_HISTORIQUE A     ---
                          (0,n) --- RAPPROCHEMENT 
                          (1,1) ;                 
                          ENTITE_HISTORIQUE B     
                          (0,n) --- RAPPROCHEMENT 
                          (1,1)                   

  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## CHOIX_AFFICHAGE

**Définition.** Choix, dans un espace, de la forme de nom affichée pour
une entité : convention UX, pas vérité (§ 7.3).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------
  Propriété source  Définition au     Type logique      Obligatoire ?
                    stade                               
                    dictionnaire                        
  ----------------- ----------------- ----------------- -----------------
  `motif`           Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  -----------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `CHOISIR_AFFICHAGE`     ESPACE (0,n) ---        ---
                          CHOIX_AFFICHAGE (1,1) ; 
                          ENTITE_HISTORIQUE (0,n) 
                          --- (1,1) ; ASSERTION   
                          (nom) (0,n) --- (1,1)   

  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## Associations --- domaine F

  ------------------------------------------------------------------------
  Association           Cardinalités du MCD          Propriétés portées
  --------------------- ---------------------------- ---------------------
  `IDENTIFIER`          MENTION (0,n) ou             ---
                        REGROUPEMENT_TRACES (0,n)    
                        ---                          
                        PROPOSITION_IDENTIFICATION   
                        (0,1)                        

  `VERS_ENTITE`         PROPOSITION_IDENTIFICATION   ---
                        (0,1) --- ENTITE_HISTORIQUE  
                        (0,n)                        

  `VERS_POSITION`       PROPOSITION_IDENTIFICATION   ---
                        (0,1) --- POSITION (0,n)     

  `REFERENCE`           POSITION_RELATIONNELLE (0,1) ---
                        --- ENTITE_HISTORIQUE (0,n)  

  `RELATION_TYPE`       POSITION_RELATIONNELLE (0,1) ---
                        --- CONCEPT (0,n)            

  `MEMBRE_DE`           POSITION_RELATIONNELLE (0,1) ---
                        --- COLLECTIF_HISTORIQUE     
                        (0,n)                        

  `CANDIDAT_POUR`       POSITION (0,n) ---           ---
                        CANDIDATURE (1,1)            

  `CANDIDAT`            ENTITE_HISTORIQUE (0,n) ---  ---
                        CANDIDATURE (1,1)            

  `RAPPROCHER`          ENTITE_HISTORIQUE A (0,n)    ---
                        --- RAPPROCHEMENT (1,1) ;    
                        ENTITE_HISTORIQUE B (0,n)    
                        --- RAPPROCHEMENT (1,1)      

  `CHOISIR_AFFICHAGE`   ESPACE (0,n) ---             ---
                        CHOIX_AFFICHAGE (1,1) ;      
                        ENTITE_HISTORIQUE (0,n) ---  
                        (1,1) ; ASSERTION (nom)      
                        (0,n) --- (1,1)              
  ------------------------------------------------------------------------

## Règles de gestion --- domaine F

# Domaine G --- Assertions, valeurs et interprétations

**Couverture : 5 entités/objets, 17 associations, 0 règles RG.**

## ASSERTION

**Définition.** Proposition structurée sur le monde historique,
attribuée, sourcée et datée. Plusieurs assertions incompatibles
coexistent (§ 8, § 105.5).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ------------------------------------------------------------------------------------------------------------
  Propriété source                                                    Définition au   Type       Obligatoire ?
                                                                      stade           logique    
                                                                      dictionnaire               
  ------------------------------------------------------------------- --------------- ---------- -------------
  `libelle_source (vocabulaire exact)`                                Propriété       **À        **À DÉCIDER**
                                                                      explicitement   DÉCIDER AU 
                                                                      portée par le   MLD**      
                                                                      MCD. Sa                    
                                                                      sémantique                 
                                                                      détaillée doit             
                                                                      respecter la               
                                                                      définition de              
                                                                      l'objet et les             
                                                                      RG du domaine.             

  `niveau {attestée, normalisée, interprétée}`                        Propriété       **À        **À DÉCIDER**
                                                                      explicitement   DÉCIDER AU 
                                                                      portée par le   MLD**      
                                                                      MCD. Sa                    
                                                                      sémantique                 
                                                                      détaillée doit             
                                                                      respecter la               
                                                                      définition de              
                                                                      l'objet et les             
                                                                      RG du domaine.             

  `nature {attestée, dérivée, synthétique, choisie pour affichage}`   Propriété       **À        **À DÉCIDER**
                                                                      explicitement   DÉCIDER AU 
                                                                      portée par le   MLD**      
                                                                      MCD. Sa                    
                                                                      sémantique                 
                                                                      détaillée doit             
                                                                      respecter la               
                                                                      définition de              
                                                                      l'objet et les             
                                                                      RG du domaine.             

  `modalite ⟨D-30⟩`                                                   Propriété       **À        **À DÉCIDER**
                                                                      explicitement   DÉCIDER AU 
                                                                      portée par le   MLD**      
                                                                      MCD. Sa                    
                                                                      sémantique                 
                                                                      détaillée doit             
                                                                      respecter la               
                                                                      définition de              
                                                                      l'objet et les             
                                                                      RG du domaine.             

  `polarite {positive, négative}`                                     Propriété       **À        **À DÉCIDER**
                                                                      explicitement   DÉCIDER AU 
                                                                      portée par le   MLD**      
                                                                      MCD. Sa                    
                                                                      sémantique                 
                                                                      détaillée doit             
                                                                      respecter la               
                                                                      définition de              
                                                                      l'objet et les             
                                                                      RG du domaine.             

  `plausibilite ⟨D-19⟩`                                               Propriété       **À        **À DÉCIDER**
                                                                      explicitement   DÉCIDER AU 
                                                                      portée par le   MLD**      
                                                                      MCD. Sa                    
                                                                      sémantique                 
                                                                      détaillée doit             
                                                                      respecter la               
                                                                      définition de              
                                                                      l'objet et les             
                                                                      RG du domaine.             

  `temps_historique (DATE_HIST)`                                      Propriété       **À        **À DÉCIDER**
                                                                      explicitement   DÉCIDER AU 
                                                                      portée par le   MLD**      
                                                                      MCD. Sa                    
                                                                      sémantique                 
                                                                      détaillée doit             
                                                                      respecter la               
                                                                      définition de              
                                                                      l'objet et les             
                                                                      RG du domaine.             

  `valeur (VALEUR, optionnelle)`                                      Propriété       **À        **À DÉCIDER**
                                                                      explicitement   DÉCIDER AU 
                                                                      portée par le   MLD**      
                                                                      MCD. Sa                    
                                                                      sémantique                 
                                                                      détaillée doit             
                                                                      respecter la               
                                                                      définition de              
                                                                      l'objet et les             
                                                                      RG du domaine.             

  `etat_provenance ⟨D-14⟩`                                            Propriété       **À        **À DÉCIDER**
                                                                      explicitement   DÉCIDER AU 
                                                                      portée par le   MLD**      
                                                                      MCD. Sa                    
                                                                      sémantique                 
                                                                      détaillée doit             
                                                                      respecter la               
                                                                      définition de              
                                                                      l'objet et les             
                                                                      RG du domaine.             
  ------------------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `SUJET`                 OBJET (0,n) ---         ---
                          ASSERTION (1,1)         

  `CIBLE`                 OBJET (0,n) ---         ---
                          ASSERTION (0,1)         

  `PREDICAT`              CONCEPT (0,n) ---       ---
                          ASSERTION (1,1)         

  `ROLE`                  CONCEPT (0,n) ---       ---
                          ASSERTION (0,1)         

  `LIEU_DE`               LIEU (0,n) ---          ---
                          ASSERTION (0,1)         

  `SOUS_ASSERTION`        ASSERTION parente (0,n) rang
                          --- ASSERTION           
                          composante (0,1)        

  `FONDER`                ASSERTION (0,n) ---     role_probatoire ⟨D-08⟩
                          MENTION (0,n)           

  `ANCRER`                ASSERTION (0,n) ---     role_probatoire ⟨D-08⟩,
                          ZONE (0,n)              rang

  `ISSUE_DE`              ASSERTION (0,n) ---     ---
                          REPONSE (0,n)           

  `DERIVER`               CALCUL (0,n) ---        ---
                          ASSERTION (0,1)         
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## INTERPRETATION

**Définition.** Production raisonnée qui agrège des assertions ou
d'autres interprétations. Spécialisée en : HYPOTHESE, CONCLUSION,
PHASE_TRAJECTOIRE, SYNTHESE, NARRATION, ESTIMATION (§ 10.4, § 25.10, §
45, § 93.5, § 38).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  --------------------------------------------------------------------------------------------------------------------------------------------------------
  Propriété source                                                                                                 Définition au   Type      Obligatoire ?
                                                                                                                   stade           logique   
                                                                                                                   dictionnaire              
  ---------------------------------------------------------------------------------------------------------------- --------------- --------- -------------
  `type {hypothèse, conclusion, phase de trajectoire, synthèse, narration, estimation}`                            Propriété       **À       **À DÉCIDER**
                                                                                                                   explicitement   DÉCIDER   
                                                                                                                   portée par le   AU MLD**  
                                                                                                                   MCD. Sa                   
                                                                                                                   sémantique                
                                                                                                                   détaillée doit            
                                                                                                                   respecter la              
                                                                                                                   définition de             
                                                                                                                   l'objet et les            
                                                                                                                   RG du domaine.            

  `enonce`                                                                                                         Propriété       **À       **À DÉCIDER**
                                                                                                                   explicitement   DÉCIDER   
                                                                                                                   portée par le   AU MLD**  
                                                                                                                   MCD. Sa                   
                                                                                                                   sémantique                
                                                                                                                   détaillée doit            
                                                                                                                   respecter la              
                                                                                                                   définition de             
                                                                                                                   l'objet et les            
                                                                                                                   RG du domaine.            

  `raisonnement`                                                                                                   Propriété       **À       **À DÉCIDER**
                                                                                                                   explicitement   DÉCIDER   
                                                                                                                   portée par le   AU MLD**  
                                                                                                                   MCD. Sa                   
                                                                                                                   sémantique                
                                                                                                                   détaillée doit            
                                                                                                                   respecter la              
                                                                                                                   définition de             
                                                                                                                   l'objet et les            
                                                                                                                   RG du domaine.            

  `certitude ⟨D-19⟩`                                                                                               Propriété       **À       **À DÉCIDER**
                                                                                                                   explicitement   DÉCIDER   
                                                                                                                   portée par le   AU MLD**  
                                                                                                                   MCD. Sa                   
                                                                                                                   sémantique                
                                                                                                                   détaillée doit            
                                                                                                                   respecter la              
                                                                                                                   définition de             
                                                                                                                   l'objet et les            
                                                                                                                   RG du domaine.            

  `questions_ouvertes`                                                                                             Propriété       **À       **À DÉCIDER**
                                                                                                                   explicitement   DÉCIDER   
                                                                                                                   portée par le   AU MLD**  
                                                                                                                   MCD. Sa                   
                                                                                                                   sémantique                
                                                                                                                   détaillée doit            
                                                                                                                   respecter la              
                                                                                                                   définition de             
                                                                                                                   l'objet et les            
                                                                                                                   RG du domaine.            

  `etat_provenance ⟨D-14⟩ ; PHASE_TRAJECTOIRE : titre`                                                             Propriété       **À       **À DÉCIDER**
                                                                                                                   explicitement   DÉCIDER   
                                                                                                                   portée par le   AU MLD**  
                                                                                                                   MCD. Sa                   
                                                                                                                   sémantique                
                                                                                                                   détaillée doit            
                                                                                                                   respecter la              
                                                                                                                   définition de             
                                                                                                                   l'objet et les            
                                                                                                                   RG du domaine.            

  `periode (DATE_HIST)`                                                                                            Propriété       **À       **À DÉCIDER**
                                                                                                                   explicitement   DÉCIDER   
                                                                                                                   portée par le   AU MLD**  
                                                                                                                   MCD. Sa                   
                                                                                                                   sémantique                
                                                                                                                   détaillée doit            
                                                                                                                   respecter la              
                                                                                                                   définition de             
                                                                                                                   l'objet et les            
                                                                                                                   RG du domaine.            

  `mode {manuelle, proposée} ; SYNTHESE : portee {documentaire stricte, projet, communautaire, Tree, chercheur}`   Propriété       **À       **À DÉCIDER**
                                                                                                                   explicitement   DÉCIDER   
                                                                                                                   portée par le   AU MLD**  
                                                                                                                   MCD. Sa                   
                                                                                                                   sémantique                
                                                                                                                   détaillée doit            
                                                                                                                   respecter la              
                                                                                                                   définition de             
                                                                                                                   l'objet et les            
                                                                                                                   RG du domaine.            

  `regle_construction ; NARRATION : texte`                                                                         Propriété       **À       **À DÉCIDER**
                                                                                                                   explicitement   DÉCIDER   
                                                                                                                   portée par le   AU MLD**  
                                                                                                                   MCD. Sa                   
                                                                                                                   sémantique                
                                                                                                                   détaillée doit            
                                                                                                                   respecter la              
                                                                                                                   définition de             
                                                                                                                   l'objet et les            
                                                                                                                   RG du domaine.            

  `generee_par_ia`                                                                                                 Propriété       **À       **À DÉCIDER**
                                                                                                                   explicitement   DÉCIDER   
                                                                                                                   portée par le   AU MLD**  
                                                                                                                   MCD. Sa                   
                                                                                                                   sémantique                
                                                                                                                   détaillée doit            
                                                                                                                   respecter la              
                                                                                                                   définition de             
                                                                                                                   l'objet et les            
                                                                                                                   RG du domaine.            
  --------------------------------------------------------------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `S_APPUYER`             INTERPRETATION (0,n)    sens {appui, contre,
                          --- OBJET (0,n)         contexte}

  `PORTER_SUR`            INTERPRETATION (0,n)    ---
                          --- ENTITE_HISTORIQUE   
                          (0,n)                   

  `REPONDRE`              INTERPRETATION (0,n)    ---
                          --- QUESTION (0,n)      
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## LACUNE

**Définition.** Qualification d'un vide : pourquoi ce qu'on ne sait pas
est vide (§ 11.1).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  --------------------------------------------------------------------------------------
  Propriété source                            Définition au   Type logique Obligatoire ?
                                              stade                        
                                              dictionnaire                 
  ------------------------------------------- --------------- ------------ -------------
  `type_vide ⟨D-31⟩`                          Propriété       **À DÉCIDER  **À DÉCIDER**
                                              explicitement   AU MLD**     
                                              portée par le                
                                              MCD. Sa                      
                                              sémantique                   
                                              détaillée doit               
                                              respecter la                 
                                              définition de                
                                              l'objet et les               
                                              RG du domaine.               

  `dimension (prédicat ou aspect concerné)`   Propriété       **À DÉCIDER  **À DÉCIDER**
                                              explicitement   AU MLD**     
                                              portée par le                
                                              MCD. Sa                      
                                              sémantique                   
                                              détaillée doit               
                                              respecter la                 
                                              définition de                
                                              l'objet et les               
                                              RG du domaine.               

  `perimetre`                                 Propriété       **À DÉCIDER  **À DÉCIDER**
                                              explicitement   AU MLD**     
                                              portée par le                
                                              MCD. Sa                      
                                              sémantique                   
                                              détaillée doit               
                                              respecter la                 
                                              définition de                
                                              l'objet et les               
                                              RG du domaine.               
  --------------------------------------------------------------------------------------

### Associations connues

  Association        Cardinalités conceptuelles                   Propriétés portées
  ------------------ -------------------------------------------- --------------------
  `QUALIFIER_VIDE`   OBJET (0,n) --- LACUNE (1,1)                 ---
  `JUSTIFIER`        LACUNE (0,n) --- RECHERCHE_EFFECTUEE (0,n)   ---

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## ERREUR_PROPAGEE

**Définition.** Erreur dont on suit l'origine, les reprises et la
correction, pour ne pas compter 20 copies comme 20 confirmations (§
111).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------------------
  Propriété source                        Définition au   Type logique  Obligatoire ?
                                          stade                         
                                          dictionnaire                  
  --------------------------------------- --------------- ------------- -------------
  `description`                           Propriété       **À DÉCIDER   **À DÉCIDER**
                                          explicitement   AU MLD**      
                                          portée par le                 
                                          MCD. Sa                       
                                          sémantique                    
                                          détaillée doit                
                                          respecter la                  
                                          définition de                 
                                          l'objet et les                
                                          RG du domaine.                

  `etat {suspectée, établie, corrigée}`   Propriété       **À DÉCIDER   **À DÉCIDER**
                                          explicitement   AU MLD**      
                                          portée par le                 
                                          MCD. Sa                       
                                          sémantique                    
                                          détaillée doit                
                                          respecter la                  
                                          définition de                 
                                          l'objet et les                
                                          RG du domaine.                
  -----------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `ORIGINE / REPRENDRE`   ERREUR_PROPAGEE (0,1)   transformation
                          --- OBJET (0,n) ;       
                          ERREUR_PROPAGEE (0,n)   
                          --- OBJET (0,n)         

  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## TRANSMISSION

**Définition.** Maillon de circulation d'une information ou d'un récit :
A raconte à B ; un journal était disponible ; X l'a lu (§ 108, § 109,
Q123).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------------------------------------
  Propriété source                                             Définition au   Type       Obligatoire ?
                                                               stade           logique    
                                                               dictionnaire               
  ------------------------------------------------------------ --------------- ---------- -------------
  `niveau ⟨D-32⟩`                                              Propriété       **À        **À DÉCIDER**
                                                               explicitement   DÉCIDER AU 
                                                               portée par le   MLD**      
                                                               MCD. Sa                    
                                                               sémantique                 
                                                               détaillée doit             
                                                               respecter la               
                                                               définition de              
                                                               l'objet et les             
                                                               RG du domaine.             

  `mode {oral, manuscrit, imprimé, image, numérique, autre}`   Propriété       **À        **À DÉCIDER**
                                                               explicitement   DÉCIDER AU 
                                                               portée par le   MLD**      
                                                               MCD. Sa                    
                                                               sémantique                 
                                                               détaillée doit             
                                                               respecter la               
                                                               définition de              
                                                               l'objet et les             
                                                               RG du domaine.             

  `date (DATE_HIST)`                                           Propriété       **À        **À DÉCIDER**
                                                               explicitement   DÉCIDER AU 
                                                               portée par le   MLD**      
                                                               MCD. Sa                    
                                                               sémantique                 
                                                               détaillée doit             
                                                               respecter la               
                                                               définition de              
                                                               l'objet et les             
                                                               RG du domaine.             
  -----------------------------------------------------------------------------------------------------

### Associations connues

  ----------------------------------------------------------------------------
  Association                        Cardinalités         Propriétés portées
                                     conceptuelles        
  ---------------------------------- -------------------- --------------------
  `CONTENU / EMETTEUR / RECEPTEUR`   OBJET (0,n) ---      ---
                                     TRANSMISSION (1,1) ; 
                                     ENTITE_HISTORIQUE    
                                     (0,n) ---            
                                     TRANSMISSION (0,1)   
                                     ×2                   

  ----------------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## Associations --- domaine G

  -----------------------------------------------------------------------------
  Association                        Cardinalités du MCD   Propriétés portées
  ---------------------------------- --------------------- --------------------
  `SUJET`                            OBJET (0,n) ---       ---
                                     ASSERTION (1,1)       

  `CIBLE`                            OBJET (0,n) ---       ---
                                     ASSERTION (0,1)       

  `PREDICAT`                         CONCEPT (0,n) ---     ---
                                     ASSERTION (1,1)       

  `ROLE`                             CONCEPT (0,n) ---     ---
                                     ASSERTION (0,1)       

  `LIEU_DE`                          LIEU (0,n) ---        ---
                                     ASSERTION (0,1)       

  `SOUS_ASSERTION`                   ASSERTION parente     rang
                                     (0,n) --- ASSERTION   
                                     composante (0,1)      

  `FONDER`                           ASSERTION (0,n) ---   role_probatoire
                                     MENTION (0,n)         ⟨D-08⟩

  `ANCRER`                           ASSERTION (0,n) ---   role_probatoire
                                     ZONE (0,n)            ⟨D-08⟩, rang

  `ISSUE_DE`                         ASSERTION (0,n) ---   ---
                                     REPONSE (0,n)         

  `DERIVER`                          CALCUL (0,n) ---      ---
                                     ASSERTION (0,1)       

  `S_APPUYER`                        INTERPRETATION (0,n)  sens {appui, contre,
                                     --- OBJET (0,n)       contexte}

  `PORTER_SUR`                       INTERPRETATION (0,n)  ---
                                     --- ENTITE_HISTORIQUE 
                                     (0,n)                 

  `REPONDRE`                         INTERPRETATION (0,n)  ---
                                     --- QUESTION (0,n)    

  `QUALIFIER_VIDE`                   OBJET (0,n) ---       ---
                                     LACUNE (1,1)          

  `JUSTIFIER`                        LACUNE (0,n) ---      ---
                                     RECHERCHE_EFFECTUEE   
                                     (0,n)                 

  `ORIGINE / REPRENDRE`              ERREUR_PROPAGEE (0,1) transformation
                                     --- OBJET (0,n) ;     
                                     ERREUR_PROPAGEE (0,n) 
                                     --- OBJET (0,n)       

  `CONTENU / EMETTEUR / RECEPTEUR`   OBJET (0,n) ---       ---
                                     TRANSMISSION (1,1) ;  
                                     ENTITE_HISTORIQUE     
                                     (0,n) ---             
                                     TRANSMISSION (0,1) ×2 
  -----------------------------------------------------------------------------

## Règles de gestion --- domaine G

# Domaine H --- Validation, débat, crédit, réputation

**Couverture : 11 entités/objets, 14 associations, 0 règles RG.**

## ACTE_EVALUATION

**Définition.** Acte daté d'un cycle de validation sur une version
d'objet : proposer, valider, contester, demander un réexamen, confirmer,
corriger, déclarer indéterminé (§ 50, § 51).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -------------------------------------------------------------------------------------------------------
  Propriété source                                               Définition au   Type       Obligatoire ?
                                                                 stade           logique    
                                                                 dictionnaire               
  -------------------------------------------------------------- --------------- ---------- -------------
  `type ⟨D-33⟩`                                                  Propriété       **À        **À DÉCIDER**
                                                                 explicitement   DÉCIDER AU 
                                                                 portée par le   MLD**      
                                                                 MCD. Sa                    
                                                                 sémantique                 
                                                                 détaillée doit             
                                                                 respecter la               
                                                                 définition de              
                                                                 l'objet et les             
                                                                 RG du domaine.             

  `date`                                                         Propriété       **À        **À DÉCIDER**
                                                                 explicitement   DÉCIDER AU 
                                                                 portée par le   MLD**      
                                                                 MCD. Sa                    
                                                                 sémantique                 
                                                                 détaillée doit             
                                                                 respecter la               
                                                                 définition de              
                                                                 l'objet et les             
                                                                 RG du domaine.             

  `justification`                                                Propriété       **À        **À DÉCIDER**
                                                                 explicitement   DÉCIDER AU 
                                                                 portée par le   MLD**      
                                                                 MCD. Sa                    
                                                                 sémantique                 
                                                                 détaillée doit             
                                                                 respecter la               
                                                                 définition de              
                                                                 l'objet et les             
                                                                 RG du domaine.             

  `processus_applicable`                                         Propriété       **À        **À DÉCIDER**
                                                                 explicitement   DÉCIDER AU 
                                                                 portée par le   MLD**      
                                                                 MCD. Sa                    
                                                                 sémantique                 
                                                                 détaillée doit             
                                                                 respecter la               
                                                                 définition de              
                                                                 l'objet et les             
                                                                 RG du domaine.             

  `independance {indépendance déclarée, lien connu, inconnue}`   Propriété       **À        **À DÉCIDER**
                                                                 explicitement   DÉCIDER AU 
                                                                 portée par le   MLD**      
                                                                 MCD. Sa                    
                                                                 sémantique                 
                                                                 détaillée doit             
                                                                 respecter la               
                                                                 définition de              
                                                                 l'objet et les             
                                                                 RG du domaine.             
  -------------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `EVALUER`               UTILISATEUR (0,n) ---   role_au_moment (rôle de
                          ACTE_EVALUATION (1,1)   gouvernance)

  `PORTER_SUR_VERSION`    ACTE_EVALUATION (1,1)   ---
                          --- VERSION_OBJET (0,n) 

  `INVOQUER`              ARGUMENT (0,n) ---      ---
                          ACTE_EVALUATION (0,n)   
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## ARGUMENT

**Définition.** Élément pour ou contre une hypothèse (identification,
rapprochement, candidature, conclusion, reconstruction). Préféré à tout
score (§ 6, § 50).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -------------------------------------------------------------------------------------------------------------------------------------------
  Propriété source                                                                                    Définition au   Type      Obligatoire ?
                                                                                                      stade           logique   
                                                                                                      dictionnaire              
  --------------------------------------------------------------------------------------------------- --------------- --------- -------------
  `sens {pour, contre, contexte}`                                                                     Propriété       **À       **À DÉCIDER**
                                                                                                      explicitement   DÉCIDER   
                                                                                                      portée par le   AU MLD**  
                                                                                                      MCD. Sa                   
                                                                                                      sémantique                
                                                                                                      détaillée doit            
                                                                                                      respecter la              
                                                                                                      définition de             
                                                                                                      l'objet et les            
                                                                                                      RG du domaine.            

  `nature {critère compatible, critère incompatible, indice, preuve discriminante, méthodologique}`   Propriété       **À       **À DÉCIDER**
                                                                                                      explicitement   DÉCIDER   
                                                                                                      portée par le   AU MLD**  
                                                                                                      MCD. Sa                   
                                                                                                      sémantique                
                                                                                                      détaillée doit            
                                                                                                      respecter la              
                                                                                                      définition de             
                                                                                                      l'objet et les            
                                                                                                      RG du domaine.            

  `enonce`                                                                                            Propriété       **À       **À DÉCIDER**
                                                                                                      explicitement   DÉCIDER   
                                                                                                      portée par le   AU MLD**  
                                                                                                      MCD. Sa                   
                                                                                                      sémantique                
                                                                                                      détaillée doit            
                                                                                                      respecter la              
                                                                                                      définition de             
                                                                                                      l'objet et les            
                                                                                                      RG du domaine.            
  -------------------------------------------------------------------------------------------------------------------------------------------

### Associations connues

  Association    Cardinalités conceptuelles                 Propriétés portées
  -------------- ------------------------------------------ --------------------
  `ARGUMENTER`   OBJET visé (0,n) --- ARGUMENT (1,1)        ---
  `ETAYER`       ARGUMENT (0,n) --- OBJET (preuve) (0,n)    ---
  `INVOQUER`     ARGUMENT (0,n) --- ACTE_EVALUATION (0,n)   ---

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## PROPOSITION_MODIFICATION

**Définition.** Correction proposée par un tiers, avec justification et
preuve (§ 63).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  --------------------------------------------------------------------------------------------------------
  Propriété source                                                Définition au   Type       Obligatoire ?
                                                                  stade           logique    
                                                                  dictionnaire               
  --------------------------------------------------------------- --------------- ---------- -------------
  `contenu_propose`                                               Propriété       **À        **À DÉCIDER**
                                                                  explicitement   DÉCIDER AU 
                                                                  portée par le   MLD**      
                                                                  MCD. Sa                    
                                                                  sémantique                 
                                                                  détaillée doit             
                                                                  respecter la               
                                                                  définition de              
                                                                  l'objet et les             
                                                                  RG du domaine.             

  `justification`                                                 Propriété       **À        **À DÉCIDER**
                                                                  explicitement   DÉCIDER AU 
                                                                  portée par le   MLD**      
                                                                  MCD. Sa                    
                                                                  sémantique                 
                                                                  détaillée doit             
                                                                  respecter la               
                                                                  définition de              
                                                                  l'objet et les             
                                                                  RG du domaine.             

  `statut {soumise, en discussion, acceptée, refusée, retirée}`   Propriété       **À        **À DÉCIDER**
                                                                  explicitement   DÉCIDER AU 
                                                                  portée par le   MLD**      
                                                                  MCD. Sa                    
                                                                  sémantique                 
                                                                  détaillée doit             
                                                                  respecter la               
                                                                  définition de              
                                                                  l'objet et les             
                                                                  RG du domaine.             
  --------------------------------------------------------------------------------------------------------

### Associations connues

  ------------------------------------------------------------------------
  Association            Cardinalités conceptuelles Propriétés portées
  ---------------------- -------------------------- ----------------------
  `PROPOSER`             UTILISATEUR (0,n) ---      ---
                         PROPOSITION_MODIFICATION   
                         (1,1) ; décideur           
                         UTILISATEUR (0,n) ---      
                         (0,1)                      

  `CIBLER_VERSION`       PROPOSITION_MODIFICATION   ---
                         (1,1) --- VERSION_OBJET    
                         (0,n)                      

  `BASE / OPPOSER`       CONFLIT_EDITION (1,1) ---  ---
                         VERSION_OBJET (0,n) ;      
                         CONFLIT_EDITION (2,n) ---  
                         PROPOSITION_MODIFICATION   
                         (0,1)                      
  ------------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## CONFLIT_EDITION

**Définition.** Conflit scientifique entre propositions concurrentes sur
une même version de base. Pas de « last write wins » (§ 64).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ------------------------------------------------------------------------------------------------------------------------------------
  Propriété source                                                                             Définition au   Type      Obligatoire ?
                                                                                               stade           logique   
                                                                                               dictionnaire              
  -------------------------------------------------------------------------------------------- --------------- --------- -------------
  `etat {ouvert, résolu par choix, résolu par fusion compatible, indétermination conservée}`   Propriété       **À       **À DÉCIDER**
                                                                                               explicitement   DÉCIDER   
                                                                                               portée par le   AU MLD**  
                                                                                               MCD. Sa                   
                                                                                               sémantique                
                                                                                               détaillée doit            
                                                                                               respecter la              
                                                                                               définition de             
                                                                                               l'objet et les            
                                                                                               RG du domaine.            

  ------------------------------------------------------------------------------------------------------------------------------------

### Associations connues

  ------------------------------------------------------------------------
  Association            Cardinalités conceptuelles Propriétés portées
  ---------------------- -------------------------- ----------------------
  `BASE / OPPOSER`       CONFLIT_EDITION (1,1) ---  ---
                         VERSION_OBJET (0,n) ;      
                         CONFLIT_EDITION (2,n) ---  
                         PROPOSITION_MODIFICATION   
                         (0,1)                      

  ------------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## DISCUSSION

**Définition.** Fil rattaché si possible à un objet de travail (§ 57).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------
  Propriété source  Définition au     Type logique      Obligatoire ?
                    stade                               
                    dictionnaire                        
  ----------------- ----------------- ----------------- -----------------
  `titre`           Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `statut`          Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         
  -----------------------------------------------------------------------

### Associations connues

  ---------------------------------------------------------------------------------
  Association                                 Cardinalités       Propriétés portées
                                              conceptuelles      
  ------------------------------------------- ------------------ ------------------
  `RATTACHER_DISCUSSION / CONTENIR_MESSAGE`   OBJET (0,n) ---    ---
                                              DISCUSSION (0,1) ; 
                                              DISCUSSION (0,n)   
                                              --- MESSAGE (1,1)  
                                              ; UTILISATEUR      
                                              (0,n) --- MESSAGE  
                                              (1,1)              

  ---------------------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## MESSAGE

**Définition.** Message d'une discussion.

**Nature :** Entité/structure conceptuelle non déclarée comme
spécialisation d'`OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------
  Propriété source  Définition au     Type logique      Obligatoire ?
                    stade                               
                    dictionnaire                        
  ----------------- ----------------- ----------------- -----------------
  `#id_message`     Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `date`            Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `texte`           Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         
  -----------------------------------------------------------------------

### Associations connues

  ---------------------------------------------------------------------------------
  Association                                 Cardinalités       Propriétés portées
                                              conceptuelles      
  ------------------------------------------- ------------------ ------------------
  `RATTACHER_DISCUSSION / CONTENIR_MESSAGE`   OBJET (0,n) ---    ---
                                              DISCUSSION (0,1) ; 
                                              DISCUSSION (0,n)   
                                              --- MESSAGE (1,1)  
                                              ; UTILISATEUR      
                                              (0,n) --- MESSAGE  
                                              (1,1)              

  ---------------------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## ACTE_MODERATION

**Définition.** Acte de modération ; sans effet sur le statut
scientifique (§ 49.2).

**Nature :** Entité/structure conceptuelle non déclarée comme
spécialisation d'`OBJET`.

### Attributs / propriétés explicitement nommés

  ------------------------------------------------------------------------
  Propriété source   Définition au     Type logique      Obligatoire ?
                     stade                               
                     dictionnaire                        
  ------------------ ----------------- ----------------- -----------------
  `#id_moderation`   Propriété         **À DÉCIDER AU    **À DÉCIDER**
                     explicitement     MLD**             
                     portée par le                       
                     MCD. Sa                             
                     sémantique                          
                     détaillée doit                      
                     respecter la                        
                     définition de                       
                     l'objet et les RG                   
                     du domaine.                         

  `type`             Propriété         **À DÉCIDER AU    **À DÉCIDER**
                     explicitement     MLD**             
                     portée par le                       
                     MCD. Sa                             
                     sémantique                          
                     détaillée doit                      
                     respecter la                        
                     définition de                       
                     l'objet et les RG                   
                     du domaine.                         

  `motif`            Propriété         **À DÉCIDER AU    **À DÉCIDER**
                     explicitement     MLD**             
                     portée par le                       
                     MCD. Sa                             
                     sémantique                          
                     détaillée doit                      
                     respecter la                        
                     définition de                       
                     l'objet et les RG                   
                     du domaine.                         

  `date`             Propriété         **À DÉCIDER AU    **À DÉCIDER**
                     explicitement     MLD**             
                     portée par le                       
                     MCD. Sa                             
                     sémantique                          
                     détaillée doit                      
                     respecter la                        
                     définition de                       
                     l'objet et les RG                   
                     du domaine.                         

  `recours`          Propriété         **À DÉCIDER AU    **À DÉCIDER**
                     explicitement     MLD**             
                     portée par le                       
                     MCD. Sa                             
                     sémantique                          
                     détaillée doit                      
                     respecter la                        
                     définition de                       
                     l'objet et les RG                   
                     du domaine.                         
  ------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `MODERER`               UTILISATEUR (0,n) ---   ---
                          ACTE_MODERATION (1,1)   
                          --- OBJET (0,n) /       
                          UTILISATEUR (0,n)       

  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## DOMAINE_EXPERTISE

**Définition.** Contexte d'expertise : thème, période, territoire,
langue, type de source (§ 34).

**Nature :** Entité/structure conceptuelle non déclarée comme
spécialisation d'`OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------
  Propriété source  Définition au     Type logique      Obligatoire ?
                    stade                               
                    dictionnaire                        
  ----------------- ----------------- ----------------- -----------------
  `#id_domaine`     Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `theme`           Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `periode`         Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `territoire`      Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `langue`          Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `type_source`     Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         
  -----------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `OBTENIR`               UTILISATEUR (0,n) ---   ---
                          BADGE (1,1) ; BADGE     
                          (0,1) ---               
                          DOMAINE_EXPERTISE (0,n) 

  `DECLARER_PROFIL`       UTILISATEUR (0,n) ---   ---
                          DECLARATION_PROFIL      
                          (1,1) ;                 
                          DECLARATION_PROFIL      
                          (0,1) ---               
                          DOMAINE_EXPERTISE (0,n) 
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## BADGE

**Définition.** Expérience constatée ou qualification attribuée selon
procédure ; jamais une preuve (§ 53.1).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------------------------------------
  Propriété source                                            Définition au   Type        Obligatoire ?
                                                              stade           logique     
                                                              dictionnaire                
  ----------------------------------------------------------- --------------- ----------- -------------
  `famille {expérience constatée, qualification attribuée}`   Propriété       **À DÉCIDER **À DÉCIDER**
                                                              explicitement   AU MLD**    
                                                              portée par le               
                                                              MCD. Sa                     
                                                              sémantique                  
                                                              détaillée doit              
                                                              respecter la                
                                                              définition de               
                                                              l'objet et les              
                                                              RG du domaine.              

  `libelle`                                                   Propriété       **À DÉCIDER **À DÉCIDER**
                                                              explicitement   AU MLD**    
                                                              portée par le               
                                                              MCD. Sa                     
                                                              sémantique                  
                                                              détaillée doit              
                                                              respecter la                
                                                              définition de               
                                                              l'objet et les              
                                                              RG du domaine.              

  `critere_ou_procedure`                                      Propriété       **À DÉCIDER **À DÉCIDER**
                                                              explicitement   AU MLD**    
                                                              portée par le               
                                                              MCD. Sa                     
                                                              sémantique                  
                                                              détaillée doit              
                                                              respecter la                
                                                              définition de               
                                                              l'objet et les              
                                                              RG du domaine.              

  `date_attribution`                                          Propriété       **À DÉCIDER **À DÉCIDER**
                                                              explicitement   AU MLD**    
                                                              portée par le               
                                                              MCD. Sa                     
                                                              sémantique                  
                                                              détaillée doit              
                                                              respecter la                
                                                              définition de               
                                                              l'objet et les              
                                                              RG du domaine.              

  `date_revocation`                                           Propriété       **À DÉCIDER **À DÉCIDER**
                                                              explicitement   AU MLD**    
                                                              portée par le               
                                                              MCD. Sa                     
                                                              sémantique                  
                                                              détaillée doit              
                                                              respecter la                
                                                              définition de               
                                                              l'objet et les              
                                                              RG du domaine.              
  -----------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `OBTENIR`               UTILISATEUR (0,n) ---   ---
                          BADGE (1,1) ; BADGE     
                          (0,1) ---               
                          DOMAINE_EXPERTISE (0,n) 

  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## DECLARATION_PROFIL

**Définition.** Intérêt ou compétence déclarés, visibilité et
disponibilité aux sollicitations (§ 58).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ----------------------------------------------------------------------------
  Propriété source               Définition au   Type logique   Obligatoire ?
                                 stade                          
                                 dictionnaire                   
  ------------------------------ --------------- -------------- --------------
  `type {intérêt, compétence}`   Propriété       **À DÉCIDER AU **À DÉCIDER**
                                 explicitement   MLD**          
                                 portée par le                  
                                 MCD. Sa                        
                                 sémantique                     
                                 détaillée doit                 
                                 respecter la                   
                                 définition de                  
                                 l'objet et les                 
                                 RG du domaine.                 

  `visibilite`                   Propriété       **À DÉCIDER AU **À DÉCIDER**
                                 explicitement   MLD**          
                                 portée par le                  
                                 MCD. Sa                        
                                 sémantique                     
                                 détaillée doit                 
                                 respecter la                   
                                 définition de                  
                                 l'objet et les                 
                                 RG du domaine.                 

  `disponible_sollicitation`     Propriété       **À DÉCIDER AU **À DÉCIDER**
                                 explicitement   MLD**          
                                 portée par le                  
                                 MCD. Sa                        
                                 sémantique                     
                                 détaillée doit                 
                                 respecter la                   
                                 définition de                  
                                 l'objet et les                 
                                 RG du domaine.                 
  ----------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `DECLARER_PROFIL`       UTILISATEUR (0,n) ---   ---
                          DECLARATION_PROFIL      
                          (1,1) ;                 
                          DECLARATION_PROFIL      
                          (0,1) ---               
                          DOMAINE_EXPERTISE (0,n) 

  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## DEMANDE

**Définition.** Demande ciblée entre utilisateurs, sans messagerie
ouverte (§ 59).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -------------------------------------------------------------------------------------------------------------------------------------------
  Propriété source                                                                                    Définition au   Type      Obligatoire ?
                                                                                                      stade           logique   
                                                                                                      dictionnaire              
  --------------------------------------------------------------------------------------------------- --------------- --------- -------------
  `categorie {source, vérification, photo-identification, avis, mission d’archives, collaboration}`   Propriété       **À       **À DÉCIDER**
                                                                                                      explicitement   DÉCIDER   
                                                                                                      portée par le   AU MLD**  
                                                                                                      MCD. Sa                   
                                                                                                      sémantique                
                                                                                                      détaillée doit            
                                                                                                      respecter la              
                                                                                                      définition de             
                                                                                                      l'objet et les            
                                                                                                      RG du domaine.            

  `message`                                                                                           Propriété       **À       **À DÉCIDER**
                                                                                                      explicitement   DÉCIDER   
                                                                                                      portée par le   AU MLD**  
                                                                                                      MCD. Sa                   
                                                                                                      sémantique                
                                                                                                      détaillée doit            
                                                                                                      respecter la              
                                                                                                      définition de             
                                                                                                      l'objet et les            
                                                                                                      RG du domaine.            

  `identite_revelee`                                                                                  Propriété       **À       **À DÉCIDER**
                                                                                                      explicitement   DÉCIDER   
                                                                                                      portée par le   AU MLD**  
                                                                                                      MCD. Sa                   
                                                                                                      sémantique                
                                                                                                      détaillée doit            
                                                                                                      respecter la              
                                                                                                      définition de             
                                                                                                      l'objet et les            
                                                                                                      RG du domaine.            

  `statut {envoyée, acceptée, refusée, close}`                                                        Propriété       **À       **À DÉCIDER**
                                                                                                      explicitement   DÉCIDER   
                                                                                                      portée par le   AU MLD**  
                                                                                                      MCD. Sa                   
                                                                                                      sémantique                
                                                                                                      détaillée doit            
                                                                                                      respecter la              
                                                                                                      définition de             
                                                                                                      l'objet et les            
                                                                                                      RG du domaine.            
  -------------------------------------------------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `EMETTRE / RECEVOIR`    UTILISATEUR (0,n) ---   ---
                          DEMANDE (1,1) ×2 ;      
                          DEMANDE (0,1) --- OBJET 
                          (0,n)                   

  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## Associations --- domaine H

  ----------------------------------------------------------------------------------------
  Association                                 Cardinalités du MCD        Propriétés
                                                                         portées
  ------------------------------------------- -------------------------- -----------------
  `EVALUER`                                   UTILISATEUR (0,n) ---      role_au_moment
                                              ACTE_EVALUATION (1,1)      (rôle de
                                                                         gouvernance)

  `PORTER_SUR_VERSION`                        ACTE_EVALUATION (1,1) ---  ---
                                              VERSION_OBJET (0,n)        

  `ARGUMENTER`                                OBJET visé (0,n) ---       ---
                                              ARGUMENT (1,1)             

  `ETAYER`                                    ARGUMENT (0,n) --- OBJET   ---
                                              (preuve) (0,n)             

  `INVOQUER`                                  ARGUMENT (0,n) ---         ---
                                              ACTE_EVALUATION (0,n)      

  `PROPOSER`                                  UTILISATEUR (0,n) ---      ---
                                              PROPOSITION_MODIFICATION   
                                              (1,1) ; décideur           
                                              UTILISATEUR (0,n) ---      
                                              (0,1)                      

  `CIBLER_VERSION`                            PROPOSITION_MODIFICATION   ---
                                              (1,1) --- VERSION_OBJET    
                                              (0,n)                      

  `BASE / OPPOSER`                            CONFLIT_EDITION (1,1) ---  ---
                                              VERSION_OBJET (0,n) ;      
                                              CONFLIT_EDITION (2,n) ---  
                                              PROPOSITION_MODIFICATION   
                                              (0,1)                      

  `RATTACHER_DISCUSSION / CONTENIR_MESSAGE`   OBJET (0,n) --- DISCUSSION ---
                                              (0,1) ; DISCUSSION (0,n)   
                                              --- MESSAGE (1,1) ;        
                                              UTILISATEUR (0,n) ---      
                                              MESSAGE (1,1)              

  `MODERER`                                   UTILISATEUR (0,n) ---      ---
                                              ACTE_MODERATION (1,1) ---  
                                              OBJET (0,n) / UTILISATEUR  
                                              (0,n)                      

  `CREDITER`                                  UTILISATEUR (0,n) ou       role_credit
                                              PERSONNE (0,n) --- OBJET   ⟨D-34⟩
                                              (0,n)                      

  `OBTENIR`                                   UTILISATEUR (0,n) ---      ---
                                              BADGE (1,1) ; BADGE (0,1)  
                                              --- DOMAINE_EXPERTISE      
                                              (0,n)                      

  `DECLARER_PROFIL`                           UTILISATEUR (0,n) ---      ---
                                              DECLARATION_PROFIL (1,1) ; 
                                              DECLARATION_PROFIL (0,1)   
                                              --- DOMAINE_EXPERTISE      
                                              (0,n)                      

  `EMETTRE / RECEVOIR`                        UTILISATEUR (0,n) ---      ---
                                              DEMANDE (1,1) ×2 ; DEMANDE 
                                              (0,1) --- OBJET (0,n)      
  ----------------------------------------------------------------------------------------

## Règles de gestion --- domaine H

# Domaine I --- Reconstruction et cohérence documentaire

**Couverture : 3 entités/objets, 8 associations, 0 règles RG.**

## RECONSTRUCTION

**Définition.** Reconstruction, par un auteur et selon une méthode, d'un
document perdu ou lacunaire. Plusieurs reconstructions peuvent
concurrencer (§ 20, CU-03).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ---------------------------------------------------------------------------------------------------
  Propriété source                                          Définition au   Type        Obligatoire ?
                                                            stade           logique     
                                                            dictionnaire                
  --------------------------------------------------------- --------------- ----------- -------------
  `titre`                                                   Propriété       **À DÉCIDER **À DÉCIDER**
                                                            explicitement   AU MLD**    
                                                            portée par le               
                                                            MCD. Sa                     
                                                            sémantique                  
                                                            détaillée doit              
                                                            respecter la                
                                                            définition de               
                                                            l'objet et les              
                                                            RG du domaine.              

  `methode`                                                 Propriété       **À DÉCIDER **À DÉCIDER**
                                                            explicitement   AU MLD**    
                                                            portée par le               
                                                            MCD. Sa                     
                                                            sémantique                  
                                                            détaillée doit              
                                                            respecter la                
                                                            définition de               
                                                            l'objet et les              
                                                            RG du domaine.              

  `statut {proposée, en discussion, validée, abandonnée}`   Propriété       **À DÉCIDER **À DÉCIDER**
                                                            explicitement   AU MLD**    
                                                            portée par le               
                                                            MCD. Sa                     
                                                            sémantique                  
                                                            détaillée doit              
                                                            respecter la                
                                                            définition de               
                                                            l'objet et les              
                                                            RG du domaine.              
  ---------------------------------------------------------------------------------------------------

### Associations connues

  Association      Cardinalités conceptuelles                           Propriétés portées
  ---------------- ---------------------------------------------------- --------------------
  `RECONSTRUIRE`   DOCUMENT (0,n) --- RECONSTRUCTION (1,1)              ---
  `CONCURRENCER`   RECONSTRUCTION (0,n) --- RECONSTRUCTION (0,n)        ---
  `STRUCTURER`     RECONSTRUCTION (1,n) --- ELEMENT_RECONSTRUIT (1,1)   ---

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## ELEMENT_RECONSTRUIT

**Définition.** ⊂ POSITION. Volume, section, colonne, page ou entrée
d'une reconstruction. Une position inconnue reste inconnue.

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  --------------------------------------------------------------------------------------------------------------------
  Propriété source                                                             Définition au   Type      Obligatoire ?
                                                                               stade           logique   
                                                                               dictionnaire              
  ---------------------------------------------------------------------------- --------------- --------- -------------
  `niveau {volume, section, colonne, page, entrée}`                            Propriété       **À       **À DÉCIDER**
                                                                               explicitement   DÉCIDER   
                                                                               portée par le   AU MLD**  
                                                                               MCD. Sa                   
                                                                               sémantique                
                                                                               détaillée doit            
                                                                               respecter la              
                                                                               définition de             
                                                                               l'objet et les            
                                                                               RG du domaine.            

  `numero`                                                                     Propriété       **À       **À DÉCIDER**
                                                                               explicitement   DÉCIDER   
                                                                               portée par le   AU MLD**  
                                                                               MCD. Sa                   
                                                                               sémantique                
                                                                               détaillée doit            
                                                                               respecter la              
                                                                               définition de             
                                                                               l'objet et les            
                                                                               RG du domaine.            

  `rang`                                                                       Propriété       **À       **À DÉCIDER**
                                                                               explicitement   DÉCIDER   
                                                                               portée par le   AU MLD**  
                                                                               MCD. Sa                   
                                                                               sémantique                
                                                                               détaillée doit            
                                                                               respecter la              
                                                                               définition de             
                                                                               l'objet et les            
                                                                               RG du domaine.            

  `statut_contenu {attesté par une trace, reconstruit (hypothèse), inconnu}`   Propriété       **À       **À DÉCIDER**
                                                                               explicitement   DÉCIDER   
                                                                               portée par le   AU MLD**  
                                                                               MCD. Sa                   
                                                                               sémantique                
                                                                               détaillée doit            
                                                                               respecter la              
                                                                               définition de             
                                                                               l'objet et les            
                                                                               RG du domaine.            
  --------------------------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `STRUCTURER`            RECONSTRUCTION (1,n)    ---
                          --- ELEMENT_RECONSTRUIT 
                          (1,1)                   

  `CONTENIR_ELEMENT`      ELEMENT_RECONSTRUIT     ---
                          parent (0,n) --- enfant 
                          (0,1)                   

  `APPUYER`               ELEMENT_RECONSTRUIT     apport {cite le numéro,
                          (0,n) --- MENTION (0,n) cite le nom, cite la
                                                  parenté, cite une
                                                  information},
                                                  role_probatoire ⟨D-08⟩
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## ANOMALIE_DOCUMENTAIRE

**Définition.** Anomalie détectée dans une série ou un document ; jamais
une conclusion (§ 21).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ------------------------------------------------------------------------------------------------------
  Propriété source                                              Définition au   Type       Obligatoire ?
                                                                stade           logique    
                                                                dictionnaire               
  ------------------------------------------------------------- --------------- ---------- -------------
  `type ⟨D-35⟩`                                                 Propriété       **À        **À DÉCIDER**
                                                                explicitement   DÉCIDER AU 
                                                                portée par le   MLD**      
                                                                MCD. Sa                    
                                                                sémantique                 
                                                                détaillée doit             
                                                                respecter la               
                                                                définition de              
                                                                l'objet et les             
                                                                RG du domaine.             

  `description`                                                 Propriété       **À        **À DÉCIDER**
                                                                explicitement   DÉCIDER AU 
                                                                portée par le   MLD**      
                                                                MCD. Sa                    
                                                                sémantique                 
                                                                détaillée doit             
                                                                respecter la               
                                                                définition de              
                                                                l'objet et les             
                                                                RG du domaine.             

  `detectee_par {moteur de règles, humain}`                     Propriété       **À        **À DÉCIDER**
                                                                explicitement   DÉCIDER AU 
                                                                portée par le   MLD**      
                                                                MCD. Sa                    
                                                                sémantique                 
                                                                détaillée doit             
                                                                respecter la               
                                                                définition de              
                                                                l'objet et les             
                                                                RG du domaine.             

  `statut {signalée, en examen, expliquée, sans explication}`   Propriété       **À        **À DÉCIDER**
                                                                explicitement   DÉCIDER AU 
                                                                portée par le   MLD**      
                                                                MCD. Sa                    
                                                                sémantique                 
                                                                détaillée doit             
                                                                respecter la               
                                                                définition de              
                                                                l'objet et les             
                                                                RG du domaine.             
  ------------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `PRESENTER`             OBJET                   ---
                          (UNITE_ARCHIVISTIQUE ou 
                          DOCUMENT) (0,n) ---     
                          ANOMALIE_DOCUMENTAIRE   
                          (1,1)                   

  `EXPLIQUER`             ANOMALIE_DOCUMENTAIRE   ---
                          (0,n) ---               
                          INTERPRETATION          
                          (hypothèse) (0,n)       

  `OUVRIR`                ANOMALIE_DOCUMENTAIRE   ---
                          (0,1) --- PISTE (0,n)   
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## Associations --- domaine I

  -----------------------------------------------------------------------
  Association             Cardinalités du MCD     Propriétés portées
  ----------------------- ----------------------- -----------------------
  `RECONSTRUIRE`          DOCUMENT (0,n) ---      ---
                          RECONSTRUCTION (1,1)    

  `CONCURRENCER`          RECONSTRUCTION (0,n)    ---
                          --- RECONSTRUCTION      
                          (0,n)                   

  `STRUCTURER`            RECONSTRUCTION (1,n)    ---
                          --- ELEMENT_RECONSTRUIT 
                          (1,1)                   

  `CONTENIR_ELEMENT`      ELEMENT_RECONSTRUIT     ---
                          parent (0,n) --- enfant 
                          (0,1)                   

  `APPUYER`               ELEMENT_RECONSTRUIT     apport {cite le numéro,
                          (0,n) --- MENTION (0,n) cite le nom, cite la
                                                  parenté, cite une
                                                  information},
                                                  role_probatoire ⟨D-08⟩

  `PRESENTER`             OBJET                   ---
                          (UNITE_ARCHIVISTIQUE ou 
                          DOCUMENT) (0,n) ---     
                          ANOMALIE_DOCUMENTAIRE   
                          (1,1)                   

  `EXPLIQUER`             ANOMALIE_DOCUMENTAIRE   ---
                          (0,n) ---               
                          INTERPRETATION          
                          (hypothèse) (0,n)       

  `OUVRIR`                ANOMALIE_DOCUMENTAIRE   ---
                          (0,1) --- PISTE (0,n)   
  -----------------------------------------------------------------------

## Règles de gestion --- domaine I

# Domaine J --- Journal (mémoire)

**Couverture : 7 entités/objets, 15 associations, 0 règles RG.**

## SESSION_MEMOIRE

**Définition.** Moment de recueil : auto-mémoire, entretien d'un tiers,
discussion collective, capture libre (§ 24.1--24.4).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ------------------------------------------------------------------------------------------------------------------------------------------------
  Propriété source                                                                                         Définition au   Type      Obligatoire ?
                                                                                                           stade           logique   
                                                                                                           dictionnaire              
  -------------------------------------------------------------------------------------------------------- --------------- --------- -------------
  `type {auto-mémoire, entretien d’un tiers, discussion collective, capture libre, réponse de campagne}`   Propriété       **À       **À DÉCIDER**
                                                                                                           explicitement   DÉCIDER   
                                                                                                           portée par le   AU MLD**  
                                                                                                           MCD. Sa                   
                                                                                                           sémantique                
                                                                                                           détaillée doit            
                                                                                                           respecter la              
                                                                                                           définition de             
                                                                                                           l'objet et les            
                                                                                                           RG du domaine.            

  `date (DATE_HIST)`                                                                                       Propriété       **À       **À DÉCIDER**
                                                                                                           explicitement   DÉCIDER   
                                                                                                           portée par le   AU MLD**  
                                                                                                           MCD. Sa                   
                                                                                                           sémantique                
                                                                                                           détaillée doit            
                                                                                                           respecter la              
                                                                                                           définition de             
                                                                                                           l'objet et les            
                                                                                                           RG du domaine.            

  `lieu (texte ou LIEU)`                                                                                   Propriété       **À       **À DÉCIDER**
                                                                                                           explicitement   DÉCIDER   
                                                                                                           portée par le   AU MLD**  
                                                                                                           MCD. Sa                   
                                                                                                           sémantique                
                                                                                                           détaillée doit            
                                                                                                           respecter la              
                                                                                                           définition de             
                                                                                                           l'objet et les            
                                                                                                           RG du domaine.            

  `mode {présentiel, téléphone, visio, écrit, audio seul}`                                                 Propriété       **À       **À DÉCIDER**
                                                                                                           explicitement   DÉCIDER   
                                                                                                           portée par le   AU MLD**  
                                                                                                           MCD. Sa                   
                                                                                                           sémantique                
                                                                                                           détaillée doit            
                                                                                                           respecter la              
                                                                                                           définition de             
                                                                                                           l'objet et les            
                                                                                                           RG du domaine.            

  `contexte`                                                                                               Propriété       **À       **À DÉCIDER**
                                                                                                           explicitement   DÉCIDER   
                                                                                                           portée par le   AU MLD**  
                                                                                                           MCD. Sa                   
                                                                                                           sémantique                
                                                                                                           détaillée doit            
                                                                                                           respecter la              
                                                                                                           définition de             
                                                                                                           l'objet et les            
                                                                                                           RG du domaine.            

  `statut_temoin {personne concernée, témoin direct, témoin indirect, inconnu}`                            Propriété       **À       **À DÉCIDER**
                                                                                                           explicitement   DÉCIDER   
                                                                                                           portée par le   AU MLD**  
                                                                                                           MCD. Sa                   
                                                                                                           sémantique                
                                                                                                           détaillée doit            
                                                                                                           respecter la              
                                                                                                           définition de             
                                                                                                           l'objet et les            
                                                                                                           RG du domaine.            
  ------------------------------------------------------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `PRODUIRE_DOC`          SESSION_MEMOIRE (0,1)   ---
                          --- DOCUMENT (0,1)      

  `TEMOIN`                SESSION_MEMOIRE (1,n)   ---
                          --- PERSONNE (0,n)      

  `PRESENT`               SESSION_MEMOIRE (0,n)   role {présent,
                          --- PERSONNE (0,n)      intervenant,
                                                  traducteur}

  `INTERVIEWER`           SESSION_MEMOIRE (0,1)   ---
                          --- UTILISATEUR (0,n)   

  `DANS_CAMPAGNE`         SESSION_MEMOIRE (0,1)   ---
                          --- CAMPAGNE_MEMOIRE    
                          (0,n)                   

  `DEROULER`              SESSION_MEMOIRE (0,n)   ---
                          --- ECHANGE (1,1)       
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## ECHANGE

**Définition.** Une question posée et ce qui s'en suit, dans l'ordre (§
24.4).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ------------------------------------------------------------------------------------------------------
  Propriété source                                              Définition au   Type       Obligatoire ?
                                                                stade           logique    
                                                                dictionnaire               
  ------------------------------------------------------------- --------------- ---------- -------------
  `rang`                                                        Propriété       **À        **À DÉCIDER**
                                                                explicitement   DÉCIDER AU 
                                                                portée par le   MLD**      
                                                                MCD. Sa                    
                                                                sémantique                 
                                                                détaillée doit             
                                                                respecter la               
                                                                définition de              
                                                                l'objet et les             
                                                                RG du domaine.             

  `question_texte_exact (vide si non enregistrée)`              Propriété       **À        **À DÉCIDER**
                                                                explicitement   DÉCIDER AU 
                                                                portée par le   MLD**      
                                                                MCD. Sa                    
                                                                sémantique                 
                                                                détaillée doit             
                                                                respecter la               
                                                                définition de              
                                                                l'objet et les             
                                                                RG du domaine.             

  `caractere_question {ouverte, fermée, suggestive, inconnu}`   Propriété       **À        **À DÉCIDER**
                                                                explicitement   DÉCIDER AU 
                                                                portée par le   MLD**      
                                                                MCD. Sa                    
                                                                sémantique                 
                                                                détaillée doit             
                                                                respecter la               
                                                                définition de              
                                                                l'objet et les             
                                                                RG du domaine.             
  ------------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `DEROULER`              SESSION_MEMOIRE (0,n)   ---
                          --- ECHANGE (1,1)       

  `POSER_QUESTION`        ECHANGE (0,1) ---       ---
                          QUESTION (0,n)          

  `MINUTE`                ECHANGE (0,n) --- ZONE  ---
                          (0,n)                   

  `OBTENIR`               ECHANGE (0,n) ---       ---
                          REPONSE (1,1)           

  `MONTRER_INDICE`        ECHANGE (0,n) ---       ---
                          INDICE (1,1) ; INDICE   
                          (0,1) --- OBJET (0,n)   
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## REPONSE

**Définition.** Réponse à un échange, avant ou après indice, avec état
de mémoire et mode de connaissance (§ 20, § 21, § 24.5, § 24.6).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -------------------------------------------------------------------------------
  Propriété source                    Définition au   Type logique  Obligatoire ?
                                      stade                         
                                      dictionnaire                  
  ----------------------------------- --------------- ------------- -------------
  `phase {spontanée, après indice}`   Propriété       **À DÉCIDER   **À DÉCIDER**
                                      explicitement   AU MLD**      
                                      portée par le                 
                                      MCD. Sa                       
                                      sémantique                    
                                      détaillée doit                
                                      respecter la                  
                                      définition de                 
                                      l'objet et les                
                                      RG du domaine.                

  `texte`                             Propriété       **À DÉCIDER   **À DÉCIDER**
                                      explicitement   AU MLD**      
                                      portée par le                 
                                      MCD. Sa                       
                                      sémantique                    
                                      détaillée doit                
                                      respecter la                  
                                      définition de                 
                                      l'objet et les                
                                      RG du domaine.                

  `etat_memoire ⟨D-36⟩`               Propriété       **À DÉCIDER   **À DÉCIDER**
                                      explicitement   AU MLD**      
                                      portée par le                 
                                      MCD. Sa                       
                                      sémantique                    
                                      détaillée doit                
                                      respecter la                  
                                      définition de                 
                                      l'objet et les                
                                      RG du domaine.                

  `mode_connaissance ⟨D-37⟩`          Propriété       **À DÉCIDER   **À DÉCIDER**
                                      explicitement   AU MLD**      
                                      portée par le                 
                                      MCD. Sa                       
                                      sémantique                    
                                      détaillée doit                
                                      respecter la                  
                                      définition de                 
                                      l'objet et les                
                                      RG du domaine.                
  -------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `OBTENIR`               ECHANGE (0,n) ---       ---
                          REPONSE (1,1)           

  `REVISER`               REPONSE nouvelle (0,1)  nature {nouvelle
                          --- REPONSE antérieure  déclaration, précision,
                          (0,1)                   rétractation}

  `REPROPOSER`            REPONSE (0,n) ---       ---
                          RELANCE (1,1)           
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## INDICE

**Définition.** Élément montré au témoin (nom, photo, arbre, hypothèse)
; marque la frontière spontané / suggéré (§ 24.3).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  --------------------------------------------------------------------------------------------------
  Propriété source                                         Définition au   Type        Obligatoire ?
                                                           stade           logique     
                                                           dictionnaire                
  -------------------------------------------------------- --------------- ----------- -------------
  `type {nom, photo, arbre, hypothèse, document, autre}`   Propriété       **À DÉCIDER **À DÉCIDER**
                                                           explicitement   AU MLD**    
                                                           portée par le               
                                                           MCD. Sa                     
                                                           sémantique                  
                                                           détaillée doit              
                                                           respecter la                
                                                           définition de               
                                                           l'objet et les              
                                                           RG du domaine.              

  `description`                                            Propriété       **À DÉCIDER **À DÉCIDER**
                                                           explicitement   AU MLD**    
                                                           portée par le               
                                                           MCD. Sa                     
                                                           sémantique                  
                                                           détaillée doit              
                                                           respecter la                
                                                           définition de               
                                                           l'objet et les              
                                                           RG du domaine.              

  `moment`                                                 Propriété       **À DÉCIDER **À DÉCIDER**
                                                           explicitement   AU MLD**    
                                                           portée par le               
                                                           MCD. Sa                     
                                                           sémantique                  
                                                           détaillée doit              
                                                           respecter la                
                                                           définition de               
                                                           l'objet et les              
                                                           RG du domaine.              
  --------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `MONTRER_INDICE`        ECHANGE (0,n) ---       ---
                          INDICE (1,1) ; INDICE   
                          (0,1) --- OBJET (0,n)   

  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## RELANCE

**Définition.** Re-proposition planifiée d'une question oubliée ou non
résolue (§ 21, § 24.6).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ----------------------------------------------------------------------------------
  Propriété source                       Définition au   Type logique  Obligatoire ?
                                         stade                         
                                         dictionnaire                  
  -------------------------------------- --------------- ------------- -------------
  `date_prevue`                          Propriété       **À DÉCIDER   **À DÉCIDER**
                                         explicitement   AU MLD**      
                                         portée par le                 
                                         MCD. Sa                       
                                         sémantique                    
                                         détaillée doit                
                                         respecter la                  
                                         définition de                 
                                         l'objet et les                
                                         RG du domaine.                

  `note_delicatesse`                     Propriété       **À DÉCIDER   **À DÉCIDER**
                                         explicitement   AU MLD**      
                                         portée par le                 
                                         MCD. Sa                       
                                         sémantique                    
                                         détaillée doit                
                                         respecter la                  
                                         définition de                 
                                         l'objet et les                
                                         RG du domaine.                

  `statut {prévue, faite, abandonnée}`   Propriété       **À DÉCIDER   **À DÉCIDER**
                                         explicitement   AU MLD**      
                                         portée par le                 
                                         MCD. Sa                       
                                         sémantique                    
                                         détaillée doit                
                                         respecter la                  
                                         définition de                 
                                         l'objet et les                
                                         RG du domaine.                
  ----------------------------------------------------------------------------------

### Associations connues

  Association    Cardinalités conceptuelles        Propriétés portées
  -------------- --------------------------------- --------------------
  `REPROPOSER`   REPONSE (0,n) --- RELANCE (1,1)   ---

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## CAMPAGNE_MEMOIRE

**Définition.** Campagne de questions vers plusieurs personnes ;
réponses indépendantes avant confrontation (§ 24.13).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ------------------------------------------------------------------------------------------------------------
  Propriété source                                                    Définition au   Type       Obligatoire ?
                                                                      stade           logique    
                                                                      dictionnaire               
  ------------------------------------------------------------------- --------------- ---------- -------------
  `titre`                                                             Propriété       **À        **À DÉCIDER**
                                                                      explicitement   DÉCIDER AU 
                                                                      portée par le   MLD**      
                                                                      MCD. Sa                    
                                                                      sémantique                 
                                                                      détaillée doit             
                                                                      respecter la               
                                                                      définition de              
                                                                      l'objet et les             
                                                                      RG du domaine.             

  `phase {réponses indépendantes, confrontation collective, close}`   Propriété       **À        **À DÉCIDER**
                                                                      explicitement   DÉCIDER AU 
                                                                      portée par le   MLD**      
                                                                      MCD. Sa                    
                                                                      sémantique                 
                                                                      détaillée doit             
                                                                      respecter la               
                                                                      définition de              
                                                                      l'objet et les             
                                                                      RG du domaine.             

  `periode`                                                           Propriété       **À        **À DÉCIDER**
                                                                      explicitement   DÉCIDER AU 
                                                                      portée par le   MLD**      
                                                                      MCD. Sa                    
                                                                      sémantique                 
                                                                      détaillée doit             
                                                                      respecter la               
                                                                      définition de              
                                                                      l'objet et les             
                                                                      RG du domaine.             
  ------------------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `DANS_CAMPAGNE`         SESSION_MEMOIRE (0,1)   ---
                          --- CAMPAGNE_MEMOIRE    
                          (0,n)                   

  `INTERROGER`            CAMPAGNE_MEMOIRE (0,n)  statut {invitée, a
                          --- PERSONNE (0,n)      répondu, a décliné}

  `POSER`                 CAMPAGNE_MEMOIRE (0,n)  portee {commune,
                          --- QUESTION (0,n)      personnalisée}
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## CAPSULE

**Définition.** Contenu destiné à un destinataire futur, délivré sous
condition ; distinct de l'embargo (§ 24.14).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ----------------------------------------------------------------------------------------------------------------
  Propriété source                                                         Définition au   Type      Obligatoire ?
                                                                           stade           logique   
                                                                           dictionnaire              
  ------------------------------------------------------------------------ --------------- --------- -------------
  `titre`                                                                  Propriété       **À       **À DÉCIDER**
                                                                           explicitement   DÉCIDER   
                                                                           portée par le   AU MLD**  
                                                                           MCD. Sa                   
                                                                           sémantique                
                                                                           détaillée doit            
                                                                           respecter la              
                                                                           définition de             
                                                                           l'objet et les            
                                                                           RG du domaine.            

  `condition_type {date, âge du destinataire, décès de l’auteur, autre}`   Propriété       **À       **À DÉCIDER**
                                                                           explicitement   DÉCIDER   
                                                                           portée par le   AU MLD**  
                                                                           MCD. Sa                   
                                                                           sémantique                
                                                                           détaillée doit            
                                                                           respecter la              
                                                                           définition de             
                                                                           l'objet et les            
                                                                           RG du domaine.            

  `condition_valeur`                                                       Propriété       **À       **À DÉCIDER**
                                                                           explicitement   DÉCIDER   
                                                                           portée par le   AU MLD**  
                                                                           MCD. Sa                   
                                                                           sémantique                
                                                                           détaillée doit            
                                                                           respecter la              
                                                                           définition de             
                                                                           l'objet et les            
                                                                           RG du domaine.            

  `destinataire_description`                                               Propriété       **À       **À DÉCIDER**
                                                                           explicitement   DÉCIDER   
                                                                           portée par le   AU MLD**  
                                                                           MCD. Sa                   
                                                                           sémantique                
                                                                           détaillée doit            
                                                                           respecter la              
                                                                           définition de             
                                                                           l'objet et les            
                                                                           RG du domaine.            

  `etat {scellée, délivrable, délivrée, annulée}`                          Propriété       **À       **À DÉCIDER**
                                                                           explicitement   DÉCIDER   
                                                                           portée par le   AU MLD**  
                                                                           MCD. Sa                   
                                                                           sémantique                
                                                                           détaillée doit            
                                                                           respecter la              
                                                                           définition de             
                                                                           l'objet et les            
                                                                           RG du domaine.            
  ----------------------------------------------------------------------------------------------------------------

### Associations connues

  ----------------------------------------------------------------------------
  Association                          Cardinalités        Propriétés portées
                                       conceptuelles       
  ------------------------------------ ------------------- -------------------
  `CREER_CAPSULE / CONTENIR_CAPSULE`   UTILISATEUR (0,n)   ---
                                       --- CAPSULE (1,1) ; 
                                       CAPSULE (1,n) ---   
                                       OBJET (0,n) ;       
                                       CAPSULE (0,1) ---   
                                       PERSONNE (0,n)      

  ----------------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## Associations --- domaine J

  ----------------------------------------------------------------------------
  Association                          Cardinalités du MCD Propriétés portées
  ------------------------------------ ------------------- -------------------
  `PRODUIRE_DOC`                       SESSION_MEMOIRE     ---
                                       (0,1) --- DOCUMENT  
                                       (0,1)               

  `TEMOIN`                             SESSION_MEMOIRE     ---
                                       (1,n) --- PERSONNE  
                                       (0,n)               

  `PRESENT`                            SESSION_MEMOIRE     role {présent,
                                       (0,n) --- PERSONNE  intervenant,
                                       (0,n)               traducteur}

  `INTERVIEWER`                        SESSION_MEMOIRE     ---
                                       (0,1) ---           
                                       UTILISATEUR (0,n)   

  `DANS_CAMPAGNE`                      SESSION_MEMOIRE     ---
                                       (0,1) ---           
                                       CAMPAGNE_MEMOIRE    
                                       (0,n)               

  `DEROULER`                           SESSION_MEMOIRE     ---
                                       (0,n) --- ECHANGE   
                                       (1,1)               

  `POSER_QUESTION`                     ECHANGE (0,1) ---   ---
                                       QUESTION (0,n)      

  `MINUTE`                             ECHANGE (0,n) ---   ---
                                       ZONE (0,n)          

  `OBTENIR`                            ECHANGE (0,n) ---   ---
                                       REPONSE (1,1)       

  `MONTRER_INDICE`                     ECHANGE (0,n) ---   ---
                                       INDICE (1,1) ;      
                                       INDICE (0,1) ---    
                                       OBJET (0,n)         

  `REVISER`                            REPONSE nouvelle    nature {nouvelle
                                       (0,1) --- REPONSE   déclaration,
                                       antérieure (0,1)    précision,
                                                           rétractation}

  `REPROPOSER`                         REPONSE (0,n) ---   ---
                                       RELANCE (1,1)       

  `INTERROGER`                         CAMPAGNE_MEMOIRE    statut {invitée, a
                                       (0,n) --- PERSONNE  répondu, a décliné}
                                       (0,n)               

  `POSER`                              CAMPAGNE_MEMOIRE    portee {commune,
                                       (0,n) --- QUESTION  personnalisée}
                                       (0,n)               

  `CREER_CAPSULE / CONTENIR_CAPSULE`   UTILISATEUR (0,n)   ---
                                       --- CAPSULE (1,1) ; 
                                       CAPSULE (1,n) ---   
                                       OBJET (0,n) ;       
                                       CAPSULE (0,1) ---   
                                       PERSONNE (0,n)      
  ----------------------------------------------------------------------------

## Règles de gestion --- domaine J

# Domaine K --- Echo (recherche)

**Couverture : 19 entités/objets, 23 associations, 0 règles RG.**

## PROJET

**Définition.** ⊂ ESPACE. Projet de recherche ou de mémoire,
transmissible, avec cycle de vie historisé (§ 25.19).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ------------------------------------------------------------------------
  Propriété source      Définition au    Type logique     Obligatoire ?
                        stade                             
                        dictionnaire                      
  --------------------- ---------------- ---------------- ----------------
  `intitule`            Propriété        **À DÉCIDER AU   **À DÉCIDER**
                        explicitement    MLD**            
                        portée par le                     
                        MCD. Sa                           
                        sémantique                        
                        détaillée doit                    
                        respecter la                      
                        définition de                     
                        l'objet et les                    
                        RG du domaine.                    

  `objet_focal`         Propriété        **À DÉCIDER AU   **À DÉCIDER**
                        explicitement    MLD**            
                        portée par le                     
                        MCD. Sa                           
                        sémantique                        
                        détaillée doit                    
                        respecter la                      
                        définition de                     
                        l'objet et les                    
                        RG du domaine.                    

  `perimetre`           Propriété        **À DÉCIDER AU   **À DÉCIDER**
                        explicitement    MLD**            
                        portée par le                     
                        MCD. Sa                           
                        sémantique                        
                        détaillée doit                    
                        respecter la                      
                        définition de                     
                        l'objet et les                    
                        RG du domaine.                    

  `etat_cycle ⟨D-38⟩`   Propriété        **À DÉCIDER AU   **À DÉCIDER**
                        explicitement    MLD**            
                        portée par le                     
                        MCD. Sa                           
                        sémantique                        
                        détaillée doit                    
                        respecter la                      
                        définition de                     
                        l'objet et les                    
                        RG du domaine.                    

  `date_cloture`        Propriété        **À DÉCIDER AU   **À DÉCIDER**
                        explicitement    MLD**            
                        portée par le                     
                        MCD. Sa                           
                        sémantique                        
                        détaillée doit                    
                        respecter la                      
                        définition de                     
                        l'objet et les                    
                        RG du domaine.                    
  ------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `RELIER_PROJETS`        PROJET (0,n) --- PROJET type {issu de,
                          (0,n)                   prolonge, complète,
                                                  réexamine, conteste,
                                                  réutilise le corpus de,
                                                  sous-projet de, succède
                                                  à}

  `ORGANISER / CENTRE`    PROJET (0,n) ---        ---
                          MISSION (0,1) ;         
                          ORGANISATION (0,n) ---  
                          MISSION (1,1)           

  `PLANIFIER_TACHE`       PROJET (0,n) --- TACHE  ---
                          (1,1) ; TACHE (0,1) --- 
                          UTILISATEUR (0,n) ;     
                          TACHE (0,n) --- OBJET   
                          (0,n)                   
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## QUESTION

**Définition.** Question de recherche ou question de mémoire (« Qui
était Ti-René ? »). Objet autonome, réouvrable (§ 24, § 25.9).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------------
  Propriété source                Définition au   Type logique   Obligatoire ?
                                  stade                          
                                  dictionnaire                   
  ------------------------------- --------------- -------------- --------------
  `libelle`                       Propriété       **À DÉCIDER AU **À DÉCIDER**
                                  explicitement   MLD**          
                                  portée par le                  
                                  MCD. Sa                        
                                  sémantique                     
                                  détaillée doit                 
                                  respecter la                   
                                  définition de                  
                                  l'objet et les                 
                                  RG du domaine.                 

  `portee {recherche, mémoire}`   Propriété       **À DÉCIDER AU **À DÉCIDER**
                                  explicitement   MLD**          
                                  portée par le                  
                                  MCD. Sa                        
                                  sémantique                     
                                  détaillée doit                 
                                  respecter la                   
                                  définition de                  
                                  l'objet et les                 
                                  RG du domaine.                 

  `etat ⟨D-39⟩`                   Propriété       **À DÉCIDER AU **À DÉCIDER**
                                  explicitement   MLD**          
                                  portée par le                  
                                  MCD. Sa                        
                                  sémantique                     
                                  détaillée doit                 
                                  respecter la                   
                                  définition de                  
                                  l'objet et les                 
                                  RG du domaine.                 

  `recherchabilite ⟨D-40⟩`        Propriété       **À DÉCIDER AU **À DÉCIDER**
                                  explicitement   MLD**          
                                  portée par le                  
                                  MCD. Sa                        
                                  sémantique                     
                                  détaillée doit                 
                                  respecter la                   
                                  définition de                  
                                  l'objet et les                 
                                  RG du domaine.                 

  `motif_reouverture`             Propriété       **À DÉCIDER AU **À DÉCIDER**
                                  explicitement   MLD**          
                                  portée par le                  
                                  MCD. Sa                        
                                  sémantique                     
                                  détaillée doit                 
                                  respecter la                   
                                  définition de                  
                                  l'objet et les                 
                                  RG du domaine.                 
  -----------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `SOUS_QUESTION`         QUESTION parente (0,n)  ---
                          --- QUESTION (0,1)      

  `CONCERNER`             QUESTION (0,n) ---      ---
                          OBJET (0,n)             

  `EXPLORER`              QUESTION (0,n) ---      ---
                          PISTE (1,1) ; PISTE     
                          (0,1) ---               
                          RECHERCHE_EFFECTUEE ou  
                          ANOMALIE (origine)      

  `INSTRUIRE / SUIVRE`    QUESTION (0,n) ---      ---
                          RECHERCHE_EFFECTUEE     
                          (0,1) ; PISTE (0,n) --- 
                          RECHERCHE_EFFECTUEE     
                          (0,1)                   

  `PLANIFIER_ITEM`        MISSION (0,n) ---       ---
                          ITEM_MISSION (1,1) ;    
                          ITEM_MISSION (0,1) ---  
                          UNITE_ARCHIVISTIQUE     
                          (0,n) ; ITEM_MISSION    
                          (0,1) --- QUESTION      
                          (0,n)                   

  `APPLIQUER_A`           OBJET (QUESTION ou      ---
                          DOCUMENT) (0,n) ---     
                          APPLICATION_PROTOCOLE   
                          (1,1) ; VERSION_OBJET   
                          (de protocole) (0,n)    
                          ---                     
                          APPLICATION_PROTOCOLE   
                          (1,1)                   
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## PISTE

**Définition.** Piste d'une question, avec statut de branche et priorité
explicable (§ 25.9, Q140).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ---------------------------------------------------------------------------------------------------------------
  Propriété source                                                        Définition au   Type      Obligatoire ?
                                                                          stade           logique   
                                                                          dictionnaire              
  ----------------------------------------------------------------------- --------------- --------- -------------
  `description`                                                           Propriété       **À       **À DÉCIDER**
                                                                          explicitement   DÉCIDER   
                                                                          portée par le   AU MLD**  
                                                                          MCD. Sa                   
                                                                          sémantique                
                                                                          détaillée doit            
                                                                          respecter la              
                                                                          définition de             
                                                                          l'objet et les            
                                                                          RG du domaine.            

  `statut {à explorer, en cours, réussie, suspendue, réfutée, bloquée}`   Propriété       **À       **À DÉCIDER**
                                                                          explicitement   DÉCIDER   
                                                                          portée par le   AU MLD**  
                                                                          MCD. Sa                   
                                                                          sémantique                
                                                                          détaillée doit            
                                                                          respecter la              
                                                                          définition de             
                                                                          l'objet et les            
                                                                          RG du domaine.            

  `priorite`                                                              Propriété       **À       **À DÉCIDER**
                                                                          explicitement   DÉCIDER   
                                                                          portée par le   AU MLD**  
                                                                          MCD. Sa                   
                                                                          sémantique                
                                                                          détaillée doit            
                                                                          respecter la              
                                                                          définition de             
                                                                          l'objet et les            
                                                                          RG du domaine.            

  `justification_priorite`                                                Propriété       **À       **À DÉCIDER**
                                                                          explicitement   DÉCIDER   
                                                                          portée par le   AU MLD**  
                                                                          MCD. Sa                   
                                                                          sémantique                
                                                                          détaillée doit            
                                                                          respecter la              
                                                                          définition de             
                                                                          l'objet et les            
                                                                          RG du domaine.            

  `source_suggeree (texte : « suggérée ≠ existe »)`                       Propriété       **À       **À DÉCIDER**
                                                                          explicitement   DÉCIDER   
                                                                          portée par le   AU MLD**  
                                                                          MCD. Sa                   
                                                                          sémantique                
                                                                          détaillée doit            
                                                                          respecter la              
                                                                          définition de             
                                                                          l'objet et les            
                                                                          RG du domaine.            
  ---------------------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `EXPLORER`              QUESTION (0,n) ---      ---
                          PISTE (1,1) ; PISTE     
                          (0,1) ---               
                          RECHERCHE_EFFECTUEE ou  
                          ANOMALIE (origine)      

  `CIBLER`                PISTE (0,n) --- OBJET   ---
                          (UNITE_ARCHIVISTIQUE,   
                          ORGANISATION, CONCEPT)  
                          (0,n)                   

  `INSTRUIRE / SUIVRE`    QUESTION (0,n) ---      ---
                          RECHERCHE_EFFECTUEE     
                          (0,1) ; PISTE (0,n) --- 
                          RECHERCHE_EFFECTUEE     
                          (0,1)                   
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## RECHERCHE_EFFECTUEE

**Définition.** Recherche réellement menée, positive ou négative, avec
périmètre, variantes, niveau de consultation et limites (§ 11.3, § 23, §
25.3). Porte aussi le « fragment effectivement consulté ».

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -------------------------------------------------------------------------------------------------
  Propriété source                                        Définition au   Type        Obligatoire ?
                                                          stade           logique     
                                                          dictionnaire                
  ------------------------------------------------------- --------------- ----------- -------------
  `date`                                                  Propriété       **À DÉCIDER **À DÉCIDER**
                                                          explicitement   AU MLD**    
                                                          portée par le               
                                                          MCD. Sa                     
                                                          sémantique                  
                                                          détaillée doit              
                                                          respecter la                
                                                          définition de               
                                                          l'objet et les              
                                                          RG du domaine.              

  `objectif`                                              Propriété       **À DÉCIDER **À DÉCIDER**
                                                          explicitement   AU MLD**    
                                                          portée par le               
                                                          MCD. Sa                     
                                                          sémantique                  
                                                          détaillée doit              
                                                          respecter la                
                                                          définition de               
                                                          l'objet et les              
                                                          RG du domaine.              

  `termes_et_variantes`                                   Propriété       **À DÉCIDER **À DÉCIDER**
                                                          explicitement   AU MLD**    
                                                          portée par le               
                                                          MCD. Sa                     
                                                          sémantique                  
                                                          détaillée doit              
                                                          respecter la                
                                                          définition de               
                                                          l'objet et les              
                                                          RG du domaine.              

  `niveau_consultation ⟨D-41⟩`                            Propriété       **À DÉCIDER **À DÉCIDER**
                                                          explicitement   AU MLD**    
                                                          portée par le               
                                                          MCD. Sa                     
                                                          sémantique                  
                                                          détaillée doit              
                                                          respecter la                
                                                          définition de               
                                                          l'objet et les              
                                                          RG du domaine.              

  `couverture (périmètre exact : pages, années, index)`   Propriété       **À DÉCIDER **À DÉCIDER**
                                                          explicitement   AU MLD**    
                                                          portée par le               
                                                          MCD. Sa                     
                                                          sémantique                  
                                                          détaillée doit              
                                                          respecter la                
                                                          définition de               
                                                          l'objet et les              
                                                          RG du domaine.              

  `resultat {positif, négatif, partiel, non concluant}`   Propriété       **À DÉCIDER **À DÉCIDER**
                                                          explicitement   AU MLD**    
                                                          portée par le               
                                                          MCD. Sa                     
                                                          sémantique                  
                                                          détaillée doit              
                                                          respecter la                
                                                          définition de               
                                                          l'objet et les              
                                                          RG du domaine.              

  `limites`                                               Propriété       **À DÉCIDER **À DÉCIDER**
                                                          explicitement   AU MLD**    
                                                          portée par le               
                                                          MCD. Sa                     
                                                          sémantique                  
                                                          détaillée doit              
                                                          respecter la                
                                                          définition de               
                                                          l'objet et les              
                                                          RG du domaine.              
  -------------------------------------------------------------------------------------------------

### Associations connues

  --------------------------------------------------------------------------
  Association            Cardinalités            Propriétés portées
                         conceptuelles           
  ---------------------- ----------------------- ---------------------------
  `EXPLORER`             QUESTION (0,n) ---      ---
                         PISTE (1,1) ; PISTE     
                         (0,1) ---               
                         RECHERCHE_EFFECTUEE ou  
                         ANOMALIE (origine)      

  `INSTRUIRE / SUIVRE`   QUESTION (0,n) ---      ---
                         RECHERCHE_EFFECTUEE     
                         (0,1) ; PISTE (0,n) --- 
                         RECHERCHE_EFFECTUEE     
                         (0,1)                   

  `PERIMETRE`            RECHERCHE_EFFECTUEE     pages_ou_annees_couvertes
                         (1,n) --- OBJET         
                         (UNITE_ARCHIVISTIQUE,   
                         EXEMPLAIRE,             
                         REPRODUCTION, CORPUS,   
                         index) (0,n)            

  `CHERCHER`             UTILISATEUR (0,n) ---   ---
                         RECHERCHE_EFFECTUEE     
                         (1,1)                   

  `REALISER_ITEM`        ITEM_MISSION (0,n) ---  ---
                         RECHERCHE_EFFECTUEE     
                         (0,1) ; ITEM_MISSION    
                         (0,n) --- REPRODUCTION  
                         (0,1)                   
  --------------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## MISSION

**Définition.** Mission d'archives : préparation, déroulé, compte rendu,
coût, délégation (§ 25.2, § 25.4).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  --------------------------------------------------------------------------------------------
  Propriété source                                   Définition au   Type        Obligatoire ?
                                                     stade           logique     
                                                     dictionnaire                
  -------------------------------------------------- --------------- ----------- -------------
  `objectifs`                                        Propriété       **À DÉCIDER **À DÉCIDER**
                                                     explicitement   AU MLD**    
                                                     portée par le               
                                                     MCD. Sa                     
                                                     sémantique                  
                                                     détaillée doit              
                                                     respecter la                
                                                     définition de               
                                                     l'objet et les              
                                                     RG du domaine.              

  `date_prevue`                                      Propriété       **À DÉCIDER **À DÉCIDER**
                                                     explicitement   AU MLD**    
                                                     portée par le               
                                                     MCD. Sa                     
                                                     sémantique                  
                                                     détaillée doit              
                                                     respecter la                
                                                     définition de               
                                                     l'objet et les              
                                                     RG du domaine.              

  `dates_effectives`                                 Propriété       **À DÉCIDER **À DÉCIDER**
                                                     explicitement   AU MLD**    
                                                     portée par le               
                                                     MCD. Sa                     
                                                     sémantique                  
                                                     détaillée doit              
                                                     respecter la                
                                                     définition de               
                                                     l'objet et les              
                                                     RG du domaine.              

  `statut {préparée, en cours, réalisée, annulée}`   Propriété       **À DÉCIDER **À DÉCIDER**
                                                     explicitement   AU MLD**    
                                                     portée par le               
                                                     MCD. Sa                     
                                                     sémantique                  
                                                     détaillée doit              
                                                     respecter la                
                                                     définition de               
                                                     l'objet et les              
                                                     RG du domaine.              

  `cout (VALEUR)`                                    Propriété       **À DÉCIDER **À DÉCIDER**
                                                     explicitement   AU MLD**    
                                                     portée par le               
                                                     MCD. Sa                     
                                                     sémantique                  
                                                     détaillée doit              
                                                     respecter la                
                                                     définition de               
                                                     l'objet et les              
                                                     RG du domaine.              

  `contraintes`                                      Propriété       **À DÉCIDER **À DÉCIDER**
                                                     explicitement   AU MLD**    
                                                     portée par le               
                                                     MCD. Sa                     
                                                     sémantique                  
                                                     détaillée doit              
                                                     respecter la                
                                                     définition de               
                                                     l'objet et les              
                                                     RG du domaine.              

  `compte_rendu`                                     Propriété       **À DÉCIDER **À DÉCIDER**
                                                     explicitement   AU MLD**    
                                                     portée par le               
                                                     MCD. Sa                     
                                                     sémantique                  
                                                     détaillée doit              
                                                     respecter la                
                                                     définition de               
                                                     l'objet et les              
                                                     RG du domaine.              
  --------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `ORGANISER / CENTRE`    PROJET (0,n) ---        ---
                          MISSION (0,1) ;         
                          ORGANISATION (0,n) ---  
                          MISSION (1,1)           

  `PLANIFIER_ITEM`        MISSION (0,n) ---       ---
                          ITEM_MISSION (1,1) ;    
                          ITEM_MISSION (0,1) ---  
                          UNITE_ARCHIVISTIQUE     
                          (0,n) ; ITEM_MISSION    
                          (0,1) --- QUESTION      
                          (0,n)                   

  `INTERVENIR`            MISSION (0,n) ---       role {commanditaire,
                          UTILISATEUR (0,n)       consultant,
                                                  photographe,
                                                  transcripteur,
                                                  interprète,
                                                  validateur}, statut
                                                  {soi, tiers,
                                                  professionnel,
                                                  bénévole}, acces_debut,
                                                  acces_fin,
                                                  perimetre_acces
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## ITEM_MISSION

**Définition.** Cote ou document à traiter pendant la mission, avec son
état de consultation.

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------
  Propriété source  Définition au     Type logique      Obligatoire ?
                    stade                               
                    dictionnaire                        
  ----------------- ----------------- ----------------- -----------------
  `rang`            Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `priorite`        Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `statut ⟨D-42⟩`   Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `notes`           Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         
  -----------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `PLANIFIER_ITEM`        MISSION (0,n) ---       ---
                          ITEM_MISSION (1,1) ;    
                          ITEM_MISSION (0,1) ---  
                          UNITE_ARCHIVISTIQUE     
                          (0,n) ; ITEM_MISSION    
                          (0,1) --- QUESTION      
                          (0,n)                   

  `REALISER_ITEM`         ITEM_MISSION (0,n) ---  ---
                          RECHERCHE_EFFECTUEE     
                          (0,1) ; ITEM_MISSION    
                          (0,n) --- REPRODUCTION  
                          (0,1)                   
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## OFFRE_DEPLACEMENT

**Définition.** Un utilisateur annonce un passage aux archives et
accepte des micro-missions (§ 25.5).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  --------------------------------------------------------------------------------
  Propriété source                   Définition au   Type logique   Obligatoire ?
                                     stade                          
                                     dictionnaire                   
  ---------------------------------- --------------- -------------- --------------
  `date`                             Propriété       **À DÉCIDER AU **À DÉCIDER**
                                     explicitement   MLD**          
                                     portée par le                  
                                     MCD. Sa                        
                                     sémantique                     
                                     détaillée doit                 
                                     respecter la                   
                                     définition de                  
                                     l'objet et les                 
                                     RG du domaine.                 

  `categories_acceptees`             Propriété       **À DÉCIDER AU **À DÉCIDER**
                                     explicitement   MLD**          
                                     portée par le                  
                                     MCD. Sa                        
                                     sémantique                     
                                     détaillée doit                 
                                     respecter la                   
                                     définition de                  
                                     l'objet et les                 
                                     RG du domaine.                 

  `capacite`                         Propriété       **À DÉCIDER AU **À DÉCIDER**
                                     explicitement   MLD**          
                                     portée par le                  
                                     MCD. Sa                        
                                     sémantique                     
                                     détaillée doit                 
                                     respecter la                   
                                     définition de                  
                                     l'objet et les                 
                                     RG du domaine.                 

  `visibilite (privée par défaut)`   Propriété       **À DÉCIDER AU **À DÉCIDER**
                                     explicitement   MLD**          
                                     portée par le                  
                                     MCD. Sa                        
                                     sémantique                     
                                     détaillée doit                 
                                     respecter la                   
                                     définition de                  
                                     l'objet et les                 
                                     RG du domaine.                 
  --------------------------------------------------------------------------------

### Associations connues

  -------------------------------------------------------------------------
  Association                     Cardinalités         Propriétés portées
                                  conceptuelles        
  ------------------------------- -------------------- --------------------
  `PROPOSER_OFFRE / ACCUEILLIR`   UTILISATEUR (0,n)    ---
                                  ---                  
                                  OFFRE_DEPLACEMENT    
                                  (1,1) ;              
                                  OFFRE_DEPLACEMENT    
                                  (0,n) ---            
                                  ORGANISATION (1,1) ; 
                                  OFFRE_DEPLACEMENT    
                                  (0,n) ---            
                                  MICRO_MISSION (1,1)  
                                  ; demandeur          
                                  UTILISATEUR (0,n)    
                                  --- MICRO_MISSION    
                                  (1,1)                

  -------------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## MICRO_MISSION

**Définition.** Petite demande confiée à un porteur d'offre.

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  --------------------------------------------------------------------------------------------
  Propriété source                                   Définition au   Type        Obligatoire ?
                                                     stade           logique     
                                                     dictionnaire                
  -------------------------------------------------- --------------- ----------- -------------
  `consigne`                                         Propriété       **À DÉCIDER **À DÉCIDER**
                                                     explicitement   AU MLD**    
                                                     portée par le               
                                                     MCD. Sa                     
                                                     sémantique                  
                                                     détaillée doit              
                                                     respecter la                
                                                     définition de               
                                                     l'objet et les              
                                                     RG du domaine.              

  `cible (texte ou cote)`                            Propriété       **À DÉCIDER **À DÉCIDER**
                                                     explicitement   AU MLD**    
                                                     portée par le               
                                                     MCD. Sa                     
                                                     sémantique                  
                                                     détaillée doit              
                                                     respecter la                
                                                     définition de               
                                                     l'objet et les              
                                                     RG du domaine.              

  `statut {proposée, acceptée, réalisée, refusée}`   Propriété       **À DÉCIDER **À DÉCIDER**
                                                     explicitement   AU MLD**    
                                                     portée par le               
                                                     MCD. Sa                     
                                                     sémantique                  
                                                     détaillée doit              
                                                     respecter la                
                                                     définition de               
                                                     l'objet et les              
                                                     RG du domaine.              
  --------------------------------------------------------------------------------------------

### Associations connues

  -------------------------------------------------------------------------
  Association                     Cardinalités         Propriétés portées
                                  conceptuelles        
  ------------------------------- -------------------- --------------------
  `PROPOSER_OFFRE / ACCUEILLIR`   UTILISATEUR (0,n)    ---
                                  ---                  
                                  OFFRE_DEPLACEMENT    
                                  (1,1) ;              
                                  OFFRE_DEPLACEMENT    
                                  (0,n) ---            
                                  ORGANISATION (1,1) ; 
                                  OFFRE_DEPLACEMENT    
                                  (0,n) ---            
                                  MICRO_MISSION (1,1)  
                                  ; demandeur          
                                  UTILISATEUR (0,n)    
                                  --- MICRO_MISSION    
                                  (1,1)                

  -------------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## CONDITION_PRATIQUE

**Définition.** Condition observée d'un centre d'archives, historisée
(Q142).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -------------------------------------------------------------------------------------------------------------------------------------------------
  Propriété source                                                                                          Définition au   Type      Obligatoire ?
                                                                                                            stade           logique   
                                                                                                            dictionnaire              
  --------------------------------------------------------------------------------------------------------- --------------- --------- -------------
  `type {horaires, réservation, délai de communication, photo autorisée, quota, fermeture, tarif, autre}`   Propriété       **À       **À DÉCIDER**
                                                                                                            explicitement   DÉCIDER   
                                                                                                            portée par le   AU MLD**  
                                                                                                            MCD. Sa                   
                                                                                                            sémantique                
                                                                                                            détaillée doit            
                                                                                                            respecter la              
                                                                                                            définition de             
                                                                                                            l'objet et les            
                                                                                                            RG du domaine.            

  `valeur`                                                                                                  Propriété       **À       **À DÉCIDER**
                                                                                                            explicitement   DÉCIDER   
                                                                                                            portée par le   AU MLD**  
                                                                                                            MCD. Sa                   
                                                                                                            sémantique                
                                                                                                            détaillée doit            
                                                                                                            respecter la              
                                                                                                            définition de             
                                                                                                            l'objet et les            
                                                                                                            RG du domaine.            

  `date_observation`                                                                                        Propriété       **À       **À DÉCIDER**
                                                                                                            explicitement   DÉCIDER   
                                                                                                            portée par le   AU MLD**  
                                                                                                            MCD. Sa                   
                                                                                                            sémantique                
                                                                                                            détaillée doit            
                                                                                                            respecter la              
                                                                                                            définition de             
                                                                                                            l'objet et les            
                                                                                                            RG du domaine.            
  -------------------------------------------------------------------------------------------------------------------------------------------------

### Associations connues

  Association   Cardinalités conceptuelles                        Propriétés portées
  ------------- ------------------------------------------------- --------------------
  `OBSERVER`    ORGANISATION (0,n) --- CONDITION_PRATIQUE (1,1)   ---

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## CONTACT

**Définition.** Interlocuteur du carnet Echo (institution, archiviste,
association, famille, chercheur) ; privé à son espace (§ 25.1).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ------------------------------------------------------------------------------------------------------------------
  Propriété source                                                           Définition au   Type      Obligatoire ?
                                                                             stade           logique   
                                                                             dictionnaire              
  -------------------------------------------------------------------------- --------------- --------- -------------
  `nom_affiche`                                                              Propriété       **À       **À DÉCIDER**
                                                                             explicitement   DÉCIDER   
                                                                             portée par le   AU MLD**  
                                                                             MCD. Sa                   
                                                                             sémantique                
                                                                             détaillée doit            
                                                                             respecter la              
                                                                             définition de             
                                                                             l'objet et les            
                                                                             RG du domaine.            

  `type {institution, archiviste, association, famille, chercheur, autre}`   Propriété       **À       **À DÉCIDER**
                                                                             explicitement   DÉCIDER   
                                                                             portée par le   AU MLD**  
                                                                             MCD. Sa                   
                                                                             sémantique                
                                                                             détaillée doit            
                                                                             respecter la              
                                                                             définition de             
                                                                             l'objet et les            
                                                                             RG du domaine.            

  `coordonnees_privees`                                                      Propriété       **À       **À DÉCIDER**
                                                                             explicitement   DÉCIDER   
                                                                             portée par le   AU MLD**  
                                                                             MCD. Sa                   
                                                                             sémantique                
                                                                             détaillée doit            
                                                                             respecter la              
                                                                             définition de             
                                                                             l'objet et les            
                                                                             RG du domaine.            
  ------------------------------------------------------------------------------------------------------------------

### Associations connues

  ----------------------------------------------------------------------------
  Association                          Cardinalités        Propriétés portées
                                       conceptuelles       
  ------------------------------------ ------------------- -------------------
  `CARNET / REPRESENTE / HISTORIQUE`   ESPACE (0,n) ---    ---
                                       CONTACT (1,1) ;     
                                       CONTACT (0,1) ---   
                                       ENTITE_HISTORIQUE   
                                       (0,n) ; CONTACT     
                                       (0,1) ---           
                                       UTILISATEUR (0,n) ; 
                                       CONTACT (0,n) ---   
                                       INTERACTION (1,1)   

  ----------------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## INTERACTION

**Définition.** Demande, réponse, relance ou note privée avec un
contact.

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ----------------------------------------------------------------------------------------------------
  Propriété source                                           Définition au   Type        Obligatoire ?
                                                             stade           logique     
                                                             dictionnaire                
  ---------------------------------------------------------- --------------- ----------- -------------
  `type {demande, réponse, relance, échange, note privée}`   Propriété       **À DÉCIDER **À DÉCIDER**
                                                             explicitement   AU MLD**    
                                                             portée par le               
                                                             MCD. Sa                     
                                                             sémantique                  
                                                             détaillée doit              
                                                             respecter la                
                                                             définition de               
                                                             l'objet et les              
                                                             RG du domaine.              

  `date`                                                     Propriété       **À DÉCIDER **À DÉCIDER**
                                                             explicitement   AU MLD**    
                                                             portée par le               
                                                             MCD. Sa                     
                                                             sémantique                  
                                                             détaillée doit              
                                                             respecter la                
                                                             définition de               
                                                             l'objet et les              
                                                             RG du domaine.              

  `contenu`                                                  Propriété       **À DÉCIDER **À DÉCIDER**
                                                             explicitement   AU MLD**    
                                                             portée par le               
                                                             MCD. Sa                     
                                                             sémantique                  
                                                             détaillée doit              
                                                             respecter la                
                                                             définition de               
                                                             l'objet et les              
                                                             RG du domaine.              

  `echeance_relance`                                         Propriété       **À DÉCIDER **À DÉCIDER**
                                                             explicitement   AU MLD**    
                                                             portée par le               
                                                             MCD. Sa                     
                                                             sémantique                  
                                                             détaillée doit              
                                                             respecter la                
                                                             définition de               
                                                             l'objet et les              
                                                             RG du domaine.              
  ----------------------------------------------------------------------------------------------------

### Associations connues

  ----------------------------------------------------------------------------
  Association                          Cardinalités        Propriétés portées
                                       conceptuelles       
  ------------------------------------ ------------------- -------------------
  `CARNET / REPRESENTE / HISTORIQUE`   ESPACE (0,n) ---    ---
                                       CONTACT (1,1) ;     
                                       CONTACT (0,1) ---   
                                       ENTITE_HISTORIQUE   
                                       (0,n) ; CONTACT     
                                       (0,1) ---           
                                       UTILISATEUR (0,n) ; 
                                       CONTACT (0,n) ---   
                                       INTERACTION (1,1)   

  ----------------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## PROTOCOLE

**Définition.** Protocole versionné, partageable, citable, conditionnel
:   définit « suffisamment traité » ou « exploité exhaustivement selon X
    » (§ 16, § 25.7, § 25.11).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -------------------------------------------------------------------------------------------------------------------
  Propriété source                                                            Définition au   Type      Obligatoire ?
                                                                              stade           logique   
                                                                              dictionnaire              
  --------------------------------------------------------------------------- --------------- --------- -------------
  `titre`                                                                     Propriété       **À       **À DÉCIDER**
                                                                              explicitement   DÉCIDER   
                                                                              portée par le   AU MLD**  
                                                                              MCD. Sa                   
                                                                              sémantique                
                                                                              détaillée doit            
                                                                              respecter la              
                                                                              définition de             
                                                                              l'objet et les            
                                                                              RG du domaine.            

  `portee {personnel, équipe, communauté, pays, période, type de problème}`   Propriété       **À       **À DÉCIDER**
                                                                              explicitement   DÉCIDER   
                                                                              portée par le   AU MLD**  
                                                                              MCD. Sa                   
                                                                              sémantique                
                                                                              détaillée doit            
                                                                              respecter la              
                                                                              définition de             
                                                                              l'objet et les            
                                                                              RG du domaine.            

  `conditions_application`                                                    Propriété       **À       **À DÉCIDER**
                                                                              explicitement   DÉCIDER   
                                                                              portée par le   AU MLD**  
                                                                              MCD. Sa                   
                                                                              sémantique                
                                                                              détaillée doit            
                                                                              respecter la              
                                                                              définition de             
                                                                              l'objet et les            
                                                                              RG du domaine.            
  -------------------------------------------------------------------------------------------------------------------

### Associations connues

  Association   Cardinalités conceptuelles                    Propriétés portées
  ------------- --------------------------------------------- --------------------
  `DEFINIR`     PROTOCOLE (1,n) --- CRITERE_PROTOCOLE (1,1)   ---

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## CRITERE_PROTOCOLE

**Définition.** Étape ou dimension d'un protocole (état civil vérifié,
marges extraites, variantes recherchées...).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------
  Propriété source  Définition au     Type logique      Obligatoire ?
                    stade                               
                    dictionnaire                        
  ----------------- ----------------- ----------------- -----------------
  `rang`            Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `libelle`         Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `dimension`       Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `condition`       Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         
  -----------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `DEFINIR`               PROTOCOLE (1,n) ---     ---
                          CRITERE_PROTOCOLE (1,1) 

  `ETAT_CRITERE`          APPLICATION_PROTOCOLE   etat {accompli,
                          (0,n) ---               partiel, non fait, non
                          CRITERE_PROTOCOLE (0,n) applicable},
                                                  couverture, preuve (→
                                                  OBJET)
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## APPLICATION_PROTOCOLE

**Définition.** Application d'une version de protocole à une question
(critère d'arrêt) ou à un document (couverture d'exploitation).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------------------------------------
  Propriété source                                            Définition au   Type        Obligatoire ?
                                                              stade           logique     
                                                              dictionnaire                
  ----------------------------------------------------------- --------------- ----------- -------------
  `statut {en cours, accompli selon protocole, interrompu}`   Propriété       **À DÉCIDER **À DÉCIDER**
                                                              explicitement   AU MLD**    
                                                              portée par le               
                                                              MCD. Sa                     
                                                              sémantique                  
                                                              détaillée doit              
                                                              respecter la                
                                                              définition de               
                                                              l'objet et les              
                                                              RG du domaine.              

  `date`                                                      Propriété       **À DÉCIDER **À DÉCIDER**
                                                              explicitement   AU MLD**    
                                                              portée par le               
                                                              MCD. Sa                     
                                                              sémantique                  
                                                              détaillée doit              
                                                              respecter la                
                                                              définition de               
                                                              l'objet et les              
                                                              RG du domaine.              
  -----------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `APPLIQUER_A`           OBJET (QUESTION ou      ---
                          DOCUMENT) (0,n) ---     
                          APPLICATION_PROTOCOLE   
                          (1,1) ; VERSION_OBJET   
                          (de protocole) (0,n)    
                          ---                     
                          APPLICATION_PROTOCOLE   
                          (1,1)                   

  `ETAT_CRITERE`          APPLICATION_PROTOCOLE   etat {accompli,
                          (0,n) ---               partiel, non fait, non
                          CRITERE_PROTOCOLE (0,n) applicable},
                                                  couverture, preuve (→
                                                  OBJET)
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## REGLE_METHODOLOGIQUE

**Définition.** Régularité détectée, règle proposée ou règle adoptée
humainement, avec portée explicite ; inclut l'apprentissage par
corrections (§ 23.7, § 25.8).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ----------------------------------------------------------------------------------------------------------------------
  Propriété source                                                               Définition au   Type      Obligatoire ?
                                                                                 stade           logique   
                                                                                 dictionnaire              
  ------------------------------------------------------------------------------ --------------- --------- -------------
  `enonce`                                                                       Propriété       **À       **À DÉCIDER**
                                                                                 explicitement   DÉCIDER   
                                                                                 portée par le   AU MLD**  
                                                                                 MCD. Sa                   
                                                                                 sémantique                
                                                                                 détaillée doit            
                                                                                 respecter la              
                                                                                 définition de             
                                                                                 l'objet et les            
                                                                                 RG du domaine.            

  `niveau {pattern détecté, règle proposée, règle adoptée}`                      Propriété       **À       **À DÉCIDER**
                                                                                 explicitement   DÉCIDER   
                                                                                 portée par le   AU MLD**  
                                                                                 MCD. Sa                   
                                                                                 sémantique                
                                                                                 détaillée doit            
                                                                                 respecter la              
                                                                                 définition de             
                                                                                 l'objet et les            
                                                                                 RG du domaine.            

  `origine {détection automatique, corrections humaines, proposition humaine}`   Propriété       **À       **À DÉCIDER**
                                                                                 explicitement   DÉCIDER   
                                                                                 portée par le   AU MLD**  
                                                                                 MCD. Sa                   
                                                                                 sémantique                
                                                                                 détaillée doit            
                                                                                 respecter la              
                                                                                 définition de             
                                                                                 l'objet et les            
                                                                                 RG du domaine.            

  `portee ⟨D-43⟩`                                                                Propriété       **À       **À DÉCIDER**
                                                                                 explicitement   DÉCIDER   
                                                                                 portée par le   AU MLD**  
                                                                                 MCD. Sa                   
                                                                                 sémantique                
                                                                                 détaillée doit            
                                                                                 respecter la              
                                                                                 définition de             
                                                                                 l'objet et les            
                                                                                 RG du domaine.            
  ----------------------------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `CONTEXTE_REGLE`        REGLE_METHODOLOGIQUE    ---
                          (0,n) --- OBJET (main,  
                          registre, corpus, LIEU) 
                          (0,n) ; adoptant        
                          UTILISATEUR (0,n) ---   
                          REGLE (0,1)             

  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## TACHE

**Définition.** Tâche de projet, y compris générée par un signal («
retrouver le fondement »).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  --------------------------------------------------------------------------------------------------------------------------------
  Propriété source                                                                         Définition au   Type      Obligatoire ?
                                                                                           stade           logique   
                                                                                           dictionnaire              
  ---------------------------------------------------------------------------------------- --------------- --------- -------------
  `libelle`                                                                                Propriété       **À       **À DÉCIDER**
                                                                                           explicitement   DÉCIDER   
                                                                                           portée par le   AU MLD**  
                                                                                           MCD. Sa                   
                                                                                           sémantique                
                                                                                           détaillée doit            
                                                                                           respecter la              
                                                                                           définition de             
                                                                                           l'objet et les            
                                                                                           RG du domaine.            

  `statut`                                                                                 Propriété       **À       **À DÉCIDER**
                                                                                           explicitement   DÉCIDER   
                                                                                           portée par le   AU MLD**  
                                                                                           MCD. Sa                   
                                                                                           sémantique                
                                                                                           détaillée doit            
                                                                                           respecter la              
                                                                                           définition de             
                                                                                           l'objet et les            
                                                                                           RG du domaine.            

  `echeance`                                                                               Propriété       **À       **À DÉCIDER**
                                                                                           explicitement   DÉCIDER   
                                                                                           portée par le   AU MLD**  
                                                                                           MCD. Sa                   
                                                                                           sémantique                
                                                                                           détaillée doit            
                                                                                           respecter la              
                                                                                           définition de             
                                                                                           l'objet et les            
                                                                                           RG du domaine.            

  `origine {manuelle, signal de dépendance, preuve inaccessible, réouverture, anomalie}`   Propriété       **À       **À DÉCIDER**
                                                                                           explicitement   DÉCIDER   
                                                                                           portée par le   AU MLD**  
                                                                                           MCD. Sa                   
                                                                                           sémantique                
                                                                                           détaillée doit            
                                                                                           respecter la              
                                                                                           définition de             
                                                                                           l'objet et les            
                                                                                           RG du domaine.            
  --------------------------------------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `PLANIFIER_TACHE`       PROJET (0,n) --- TACHE  ---
                          (1,1) ; TACHE (0,1) --- 
                          UTILISATEUR (0,n) ;     
                          TACHE (0,n) --- OBJET   
                          (0,n)                   

  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## SNAPSHOT

**Définition.** État intellectuel figé, nommé, daté, citable (§ 25.15).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------
  Propriété source  Définition au     Type logique      Obligatoire ?
                    stade                               
                    dictionnaire                        
  ----------------- ----------------- ----------------- -----------------
  `nom`             Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `date`            Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `description`     Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         
  -----------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association               Cardinalités           Propriétés portées
                            conceptuelles          
  ------------------------- ---------------------- ----------------------
  `FIGER / CONTENIR_SNAP`   ESPACE (0,n) ---       ---
                            SNAPSHOT (1,1) ;       
                            SNAPSHOT (1,n) ---     
                            VERSION_OBJET (0,n)    

  `AVANT / APRES`           DIFF_CONNAISSANCE      ---
                            (0,1) --- SNAPSHOT     
                            (0,n) ×2 (à défaut,    
                            deux dates)            
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## DIFF_CONNAISSANCE

**Définition.** Explication enregistrée d'un changement entre deux états
(§ 25.16, Q200).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  --------------------------------------------------------------------------------------
  Propriété source                            Définition au   Type logique Obligatoire ?
                                              stade                        
                                              dictionnaire                 
  ------------------------------------------- --------------- ------------ -------------
  `resume`                                    Propriété       **À DÉCIDER  **À DÉCIDER**
                                              explicitement   AU MLD**     
                                              portée par le                
                                              MCD. Sa                      
                                              sémantique                   
                                              détaillée doit               
                                              respecter la                 
                                              définition de                
                                              l'objet et les               
                                              RG du domaine.               

  `nature {technique, scientifique, mixte}`   Propriété       **À DÉCIDER  **À DÉCIDER**
                                              explicitement   AU MLD**     
                                              portée par le                
                                              MCD. Sa                      
                                              sémantique                   
                                              détaillée doit               
                                              respecter la                 
                                              définition de                
                                              l'objet et les               
                                              RG du domaine.               

  `consequences`                              Propriété       **À DÉCIDER  **À DÉCIDER**
                                              explicitement   AU MLD**     
                                              portée par le                
                                              MCD. Sa                      
                                              sémantique                   
                                              détaillée doit               
                                              respecter la                 
                                              définition de                
                                              l'objet et les               
                                              RG du domaine.               
  --------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association               Cardinalités           Propriétés portées
                            conceptuelles          
  ------------------------- ---------------------- ----------------------
  `AVANT / APRES`           DIFF_CONNAISSANCE      ---
                            (0,1) --- SNAPSHOT     
                            (0,n) ×2 (à défaut,    
                            deux dates)            

  `DECLENCHER / MODIFIER`   DECOUVERTE (0,1) ---   ---
                            DIFF_CONNAISSANCE      
                            (0,n) ; DECOUVERTE     
                            (0,n) ---              
                            VERSION_OBJET (état    
                            antérieur modifié)     
                            (0,n) ; UTILISATEUR    
                            (0,n) --- DECOUVERTE   
                            (1,1)                  
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## DECOUVERTE

**Définition.** Découverte formalisée, sans revendication automatique de
priorité (§ 25.17).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ---------------------------------------------------------------------------------------------------------------
  Propriété source                                                        Définition au   Type      Obligatoire ?
                                                                          stade           logique   
                                                                          dictionnaire              
  ----------------------------------------------------------------------- --------------- --------- -------------
  `enonce`                                                                Propriété       **À       **À DÉCIDER**
                                                                          explicitement   DÉCIDER   
                                                                          portée par le   AU MLD**  
                                                                          MCD. Sa                   
                                                                          sémantique                
                                                                          détaillée doit            
                                                                          respecter la              
                                                                          définition de             
                                                                          l'objet et les            
                                                                          RG du domaine.            

  `date`                                                                  Propriété       **À       **À DÉCIDER**
                                                                          explicitement   DÉCIDER   
                                                                          portée par le   AU MLD**  
                                                                          MCD. Sa                   
                                                                          sémantique                
                                                                          détaillée doit            
                                                                          respecter la              
                                                                          définition de             
                                                                          l'objet et les            
                                                                          RG du domaine.            

  `portee_nouveaute ⟨D-44⟩`                                               Propriété       **À       **À DÉCIDER**
                                                                          explicitement   DÉCIDER   
                                                                          portée par le   AU MLD**  
                                                                          MCD. Sa                   
                                                                          sémantique                
                                                                          détaillée doit            
                                                                          respecter la              
                                                                          définition de             
                                                                          l'objet et les            
                                                                          RG du domaine.            

  `priorite_externe {non évaluée, antériorité connue, non revendiquée}`   Propriété       **À       **À DÉCIDER**
                                                                          explicitement   DÉCIDER   
                                                                          portée par le   AU MLD**  
                                                                          MCD. Sa                   
                                                                          sémantique                
                                                                          détaillée doit            
                                                                          respecter la              
                                                                          définition de             
                                                                          l'objet et les            
                                                                          RG du domaine.            
  ---------------------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association               Cardinalités           Propriétés portées
                            conceptuelles          
  ------------------------- ---------------------- ----------------------
  `DECLENCHER / MODIFIER`   DECOUVERTE (0,1) ---   ---
                            DIFF_CONNAISSANCE      
                            (0,n) ; DECOUVERTE     
                            (0,n) ---              
                            VERSION_OBJET (état    
                            antérieur modifié)     
                            (0,n) ; UTILISATEUR    
                            (0,n) --- DECOUVERTE   
                            (1,1)                  

  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## Associations --- domaine K

  ----------------------------------------------------------------------------------------
  Association                          Cardinalités du MCD     Propriétés portées
  ------------------------------------ ----------------------- ---------------------------
  `RELIER_PROJETS`                     PROJET (0,n) --- PROJET type {issu de, prolonge,
                                       (0,n)                   complète, réexamine,
                                                               conteste, réutilise le
                                                               corpus de, sous-projet de,
                                                               succède à}

  `SOUS_QUESTION`                      QUESTION parente (0,n)  ---
                                       --- QUESTION (0,1)      

  `CONCERNER`                          QUESTION (0,n) ---      ---
                                       OBJET (0,n)             

  `EXPLORER`                           QUESTION (0,n) ---      ---
                                       PISTE (1,1) ; PISTE     
                                       (0,1) ---               
                                       RECHERCHE_EFFECTUEE ou  
                                       ANOMALIE (origine)      

  `CIBLER`                             PISTE (0,n) --- OBJET   ---
                                       (UNITE_ARCHIVISTIQUE,   
                                       ORGANISATION, CONCEPT)  
                                       (0,n)                   

  `INSTRUIRE / SUIVRE`                 QUESTION (0,n) ---      ---
                                       RECHERCHE_EFFECTUEE     
                                       (0,1) ; PISTE (0,n) --- 
                                       RECHERCHE_EFFECTUEE     
                                       (0,1)                   

  `PERIMETRE`                          RECHERCHE_EFFECTUEE     pages_ou_annees_couvertes
                                       (1,n) --- OBJET         
                                       (UNITE_ARCHIVISTIQUE,   
                                       EXEMPLAIRE,             
                                       REPRODUCTION, CORPUS,   
                                       index) (0,n)            

  `CHERCHER`                           UTILISATEUR (0,n) ---   ---
                                       RECHERCHE_EFFECTUEE     
                                       (1,1)                   

  `ORGANISER / CENTRE`                 PROJET (0,n) ---        ---
                                       MISSION (0,1) ;         
                                       ORGANISATION (0,n) ---  
                                       MISSION (1,1)           

  `PLANIFIER_ITEM`                     MISSION (0,n) ---       ---
                                       ITEM_MISSION (1,1) ;    
                                       ITEM_MISSION (0,1) ---  
                                       UNITE_ARCHIVISTIQUE     
                                       (0,n) ; ITEM_MISSION    
                                       (0,1) --- QUESTION      
                                       (0,n)                   

  `REALISER_ITEM`                      ITEM_MISSION (0,n) ---  ---
                                       RECHERCHE_EFFECTUEE     
                                       (0,1) ; ITEM_MISSION    
                                       (0,n) --- REPRODUCTION  
                                       (0,1)                   

  `INTERVENIR`                         MISSION (0,n) ---       role {commanditaire,
                                       UTILISATEUR (0,n)       consultant, photographe,
                                                               transcripteur, interprète,
                                                               validateur}, statut {soi,
                                                               tiers, professionnel,
                                                               bénévole}, acces_debut,
                                                               acces_fin, perimetre_acces

  `PROPOSER_OFFRE / ACCUEILLIR`        UTILISATEUR (0,n) ---   ---
                                       OFFRE_DEPLACEMENT (1,1) 
                                       ; OFFRE_DEPLACEMENT     
                                       (0,n) --- ORGANISATION  
                                       (1,1) ;                 
                                       OFFRE_DEPLACEMENT (0,n) 
                                       --- MICRO_MISSION (1,1) 
                                       ; demandeur UTILISATEUR 
                                       (0,n) --- MICRO_MISSION 
                                       (1,1)                   

  `OBSERVER`                           ORGANISATION (0,n) ---  ---
                                       CONDITION_PRATIQUE      
                                       (1,1)                   

  `CARNET / REPRESENTE / HISTORIQUE`   ESPACE (0,n) ---        ---
                                       CONTACT (1,1) ; CONTACT 
                                       (0,1) ---               
                                       ENTITE_HISTORIQUE (0,n) 
                                       ; CONTACT (0,1) ---     
                                       UTILISATEUR (0,n) ;     
                                       CONTACT (0,n) ---       
                                       INTERACTION (1,1)       

  `DEFINIR`                            PROTOCOLE (1,n) ---     ---
                                       CRITERE_PROTOCOLE (1,1) 

  `APPLIQUER_A`                        OBJET (QUESTION ou      ---
                                       DOCUMENT) (0,n) ---     
                                       APPLICATION_PROTOCOLE   
                                       (1,1) ; VERSION_OBJET   
                                       (de protocole) (0,n)    
                                       ---                     
                                       APPLICATION_PROTOCOLE   
                                       (1,1)                   

  `ETAT_CRITERE`                       APPLICATION_PROTOCOLE   etat {accompli, partiel,
                                       (0,n) ---               non fait, non applicable},
                                       CRITERE_PROTOCOLE (0,n) couverture, preuve (→
                                                               OBJET)

  `CONTEXTE_REGLE`                     REGLE_METHODOLOGIQUE    ---
                                       (0,n) --- OBJET (main,  
                                       registre, corpus, LIEU) 
                                       (0,n) ; adoptant        
                                       UTILISATEUR (0,n) ---   
                                       REGLE (0,1)             

  `PLANIFIER_TACHE`                    PROJET (0,n) --- TACHE  ---
                                       (1,1) ; TACHE (0,1) --- 
                                       UTILISATEUR (0,n) ;     
                                       TACHE (0,n) --- OBJET   
                                       (0,n)                   

  `FIGER / CONTENIR_SNAP`              ESPACE (0,n) ---        ---
                                       SNAPSHOT (1,1) ;        
                                       SNAPSHOT (1,n) ---      
                                       VERSION_OBJET (0,n)     

  `AVANT / APRES`                      DIFF_CONNAISSANCE (0,1) ---
                                       --- SNAPSHOT (0,n) ×2   
                                       (à défaut, deux dates)  

  `DECLENCHER / MODIFIER`              DECOUVERTE (0,1) ---    ---
                                       DIFF_CONNAISSANCE (0,n) 
                                       ; DECOUVERTE (0,n) ---  
                                       VERSION_OBJET (état     
                                       antérieur modifié)      
                                       (0,n) ; UTILISATEUR     
                                       (0,n) --- DECOUVERTE    
                                       (1,1)                   
  ----------------------------------------------------------------------------------------

## Règles de gestion --- domaine K

# Domaine L --- Tree

**Couverture : 5 entités/objets, 9 associations, 0 règles RG.**

## ARBRE

**Définition.** Arbre généalogique souverain d'un espace ; jamais
fusionné avec un arbre mondial (§ 26.1).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  --------------------------------------------------------------------------------------------
  Propriété source                                  Définition au   Type logique Obligatoire ?
                                                    stade                        
                                                    dictionnaire                 
  ------------------------------------------------- --------------- ------------ -------------
  `nom`                                             Propriété       **À DÉCIDER  **À DÉCIDER**
                                                    explicitement   AU MLD**     
                                                    portée par le                
                                                    MCD. Sa                      
                                                    sémantique                   
                                                    détaillée doit               
                                                    respecter la                 
                                                    définition de                
                                                    l'objet et les               
                                                    RG du domaine.               

  `origine {saisie, import GEDCOM, import autre}`   Propriété       **À DÉCIDER  **À DÉCIDER**
                                                    explicitement   AU MLD**     
                                                    portée par le                
                                                    MCD. Sa                      
                                                    sémantique                   
                                                    détaillée doit               
                                                    respecter la                 
                                                    définition de                
                                                    l'objet et les               
                                                    RG du domaine.               

  `personne_racine_affichage`                       Propriété       **À DÉCIDER  **À DÉCIDER**
                                                    explicitement   AU MLD**     
                                                    portée par le                
                                                    MCD. Sa                      
                                                    sémantique                   
                                                    détaillée doit               
                                                    respecter la                 
                                                    définition de                
                                                    l'objet et les               
                                                    RG du domaine.               
  --------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `HEBERGER`              ESPACE (0,n) --- ARBRE  ---
                          (1,1)                   

  `IMPORTE_DE`            ARBRE (0,1) --- IMPORT  ---
                          (0,1)                   

  `COMPORTER_NOEUD`       ARBRE (0,n) ---         ---
                          NOEUD_ARBRE (1,1)       

  `INCLURE_LIEN`          ARBRE (0,n) ---         ---
                          ASSERTION (RELATION de  
                          parenté ou d'alliance)  
                          (0,n)                   

  `COMPARER`              ARBRE A (0,n) ---       ---
                          COMPARAISON (1,1) ;     
                          ARBRE B (0,n) ---       
                          COMPARAISON (1,1) ;     
                          COMPARAISON (0,n) ---   
                          ECART (1,1)             
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## NOEUD_ARBRE

**Définition.** Présence d'une PERSONNE de l'espace dans un arbre, avec
ses conventions d'affichage.

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -------------------------------------------------------------------------
  Propriété source       Définition au    Type logique     Obligatoire ?
                         stade                             
                         dictionnaire                      
  ---------------------- ---------------- ---------------- ----------------
  `libelle_affichage`    Propriété        **À DÉCIDER AU   **À DÉCIDER**
                         explicitement    MLD**            
                         portée par le                     
                         MCD. Sa                           
                         sémantique                        
                         détaillée doit                    
                         respecter la                      
                         définition de                     
                         l'objet et les                    
                         RG du domaine.                    

  `position_affichage`   Propriété        **À DÉCIDER AU   **À DÉCIDER**
                         explicitement    MLD**            
                         portée par le                     
                         MCD. Sa                           
                         sémantique                        
                         détaillée doit                    
                         respecter la                      
                         définition de                     
                         l'objet et les                    
                         RG du domaine.                    
  -------------------------------------------------------------------------

### Associations connues

  Association         Cardinalités conceptuelles             Propriétés portées
  ------------------- -------------------------------------- --------------------
  `COMPORTER_NOEUD`   ARBRE (0,n) --- NOEUD_ARBRE (1,1)      ---
  `REPRESENTER`       NOEUD_ARBRE (1,1) --- PERSONNE (0,n)   ---

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## OPERATION_FLUX

**Définition.** Opération explicite de circulation entre espaces :
contribuer, importer, comparer, échanger, restaurer (§ 13, § 26.3).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ------------------------------------------------------------------------------------
  Propriété source                         Définition au   Type logique  Obligatoire ?
                                           stade                         
                                           dictionnaire                  
  ---------------------------------------- --------------- ------------- -------------
  `type ⟨D-45⟩`                            Propriété       **À DÉCIDER   **À DÉCIDER**
                                           explicitement   AU MLD**      
                                           portée par le                 
                                           MCD. Sa                       
                                           sémantique                    
                                           détaillée doit                
                                           respecter la                  
                                           définition de                 
                                           l'objet et les                
                                           RG du domaine.                

  `date`                                   Propriété       **À DÉCIDER   **À DÉCIDER**
                                           explicitement   AU MLD**      
                                           portée par le                 
                                           MCD. Sa                       
                                           sémantique                    
                                           détaillée doit                
                                           respecter la                  
                                           définition de                 
                                           l'objet et les                
                                           RG du domaine.                

  `statut {préparée, exécutée, annulée}`   Propriété       **À DÉCIDER   **À DÉCIDER**
                                           explicitement   AU MLD**      
                                           portée par le                 
                                           MCD. Sa                       
                                           sémantique                    
                                           détaillée doit                
                                           respecter la                  
                                           définition de                 
                                           l'objet et les                
                                           RG du domaine.                

  `autorisation`                           Propriété       **À DÉCIDER   **À DÉCIDER**
                                           explicitement   AU MLD**      
                                           portée par le                 
                                           MCD. Sa                       
                                           sémantique                    
                                           détaillée doit                
                                           respecter la                  
                                           définition de                 
                                           l'objet et les                
                                           RG du domaine.                
  ------------------------------------------------------------------------------------

### Associations connues

  Association            Cardinalités conceptuelles                   Propriétés portées
  ---------------------- -------------------------------------------- --------------------
  `EXECUTER`             UTILISATEUR (0,n) --- OPERATION_FLUX (1,1)   ---
  `SOURCE / CIBLE`       OPERATION_FLUX (1,1) --- ESPACE (0,n) ×2     ---
  `PRODUIRE_FILIATION`   OPERATION_FLUX (0,n) --- FILIATION (0,1)     ---

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## COMPARAISON

**Définition.** Comparaison autorisée de deux arbres (§ 26.5).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------
  Propriété source  Définition au     Type logique      Obligatoire ?
                    stade                               
                    dictionnaire                        
  ----------------- ----------------- ----------------- -----------------
  `date`            Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `perimetre`       Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `statut`          Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         
  -----------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `COMPARER`              ARBRE A (0,n) ---       ---
                          COMPARAISON (1,1) ;     
                          ARBRE B (0,n) ---       
                          COMPARAISON (1,1) ;     
                          COMPARAISON (0,n) ---   
                          ECART (1,1)             

  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## ECART

**Définition.** Différence relevée par une comparaison.

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -------------------------------------------------------------------------------------------------------------------
  Propriété source                                                            Définition au   Type      Obligatoire ?
                                                                              stade           logique   
                                                                              dictionnaire              
  --------------------------------------------------------------------------- --------------- --------- -------------
  `type {seulement dans A, seulement dans B, valeur divergente, identique}`   Propriété       **À       **À DÉCIDER**
                                                                              explicitement   DÉCIDER   
                                                                              portée par le   AU MLD**  
                                                                              MCD. Sa                   
                                                                              sémantique                
                                                                              détaillée doit            
                                                                              respecter la              
                                                                              définition de             
                                                                              l'objet et les            
                                                                              RG du domaine.            

  `objet_a (→ OBJET)`                                                         Propriété       **À       **À DÉCIDER**
                                                                              explicitement   DÉCIDER   
                                                                              portée par le   AU MLD**  
                                                                              MCD. Sa                   
                                                                              sémantique                
                                                                              détaillée doit            
                                                                              respecter la              
                                                                              définition de             
                                                                              l'objet et les            
                                                                              RG du domaine.            

  `objet_b (→ OBJET)`                                                         Propriété       **À       **À DÉCIDER**
                                                                              explicitement   DÉCIDER   
                                                                              portée par le   AU MLD**  
                                                                              MCD. Sa                   
                                                                              sémantique                
                                                                              détaillée doit            
                                                                              respecter la              
                                                                              définition de             
                                                                              l'objet et les            
                                                                              RG du domaine.            
  -------------------------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `COMPARER`              ARBRE A (0,n) ---       ---
                          COMPARAISON (1,1) ;     
                          ARBRE B (0,n) ---       
                          COMPARAISON (1,1) ;     
                          COMPARAISON (0,n) ---   
                          ECART (1,1)             

  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## Associations --- domaine L

  -----------------------------------------------------------------------
  Association             Cardinalités du MCD     Propriétés portées
  ----------------------- ----------------------- -----------------------
  `HEBERGER`              ESPACE (0,n) --- ARBRE  ---
                          (1,1)                   

  `IMPORTE_DE`            ARBRE (0,1) --- IMPORT  ---
                          (0,1)                   

  `COMPORTER_NOEUD`       ARBRE (0,n) ---         ---
                          NOEUD_ARBRE (1,1)       

  `REPRESENTER`           NOEUD_ARBRE (1,1) ---   ---
                          PERSONNE (0,n)          

  `INCLURE_LIEN`          ARBRE (0,n) ---         ---
                          ASSERTION (RELATION de  
                          parenté ou d'alliance)  
                          (0,n)                   

  `EXECUTER`              UTILISATEUR (0,n) ---   ---
                          OPERATION_FLUX (1,1)    

  `SOURCE / CIBLE`        OPERATION_FLUX (1,1)    ---
                          --- ESPACE (0,n) ×2     

  `PRODUIRE_FILIATION`    OPERATION_FLUX (0,n)    ---
                          --- FILIATION (0,1)     

  `COMPARER`              ARBRE A (0,n) ---       ---
                          COMPARAISON (1,1) ;     
                          ARBRE B (0,n) ---       
                          COMPARAISON (1,1) ;     
                          COMPARAISON (0,n) ---   
                          ECART (1,1)             
  -----------------------------------------------------------------------

## Règles de gestion --- domaine L

# Domaine M --- Connect

**Couverture : 4 entités/objets, 5 associations, 0 règles RG.**

## EVENEMENT_CONNECT

**Définition.** Objet métier : cousinade, rencontre, commémoration. Peut
documenter un EVENEMENT historique (la réunion familiale devient
elle-même histoire) (§ 3.5).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -------------------------------------------------------------------------------------------------------
  Propriété source                                               Définition au   Type       Obligatoire ?
                                                                 stade           logique    
                                                                 dictionnaire               
  -------------------------------------------------------------- --------------- ---------- -------------
  `type {cousinade, rencontre, commémoration, atelier, autre}`   Propriété       **À        **À DÉCIDER**
                                                                 explicitement   DÉCIDER AU 
                                                                 portée par le   MLD**      
                                                                 MCD. Sa                    
                                                                 sémantique                 
                                                                 détaillée doit             
                                                                 respecter la               
                                                                 définition de              
                                                                 l'objet et les             
                                                                 RG du domaine.             

  `titre`                                                        Propriété       **À        **À DÉCIDER**
                                                                 explicitement   DÉCIDER AU 
                                                                 portée par le   MLD**      
                                                                 MCD. Sa                    
                                                                 sémantique                 
                                                                 détaillée doit             
                                                                 respecter la               
                                                                 définition de              
                                                                 l'objet et les             
                                                                 RG du domaine.             

  `date`                                                         Propriété       **À        **À DÉCIDER**
                                                                 explicitement   DÉCIDER AU 
                                                                 portée par le   MLD**      
                                                                 MCD. Sa                    
                                                                 sémantique                 
                                                                 détaillée doit             
                                                                 respecter la               
                                                                 définition de              
                                                                 l'objet et les             
                                                                 RG du domaine.             

  `statut`                                                       Propriété       **À        **À DÉCIDER**
                                                                 explicitement   DÉCIDER AU 
                                                                 portée par le   MLD**      
                                                                 MCD. Sa                    
                                                                 sémantique                 
                                                                 détaillée doit             
                                                                 respecter la               
                                                                 définition de              
                                                                 l'objet et les             
                                                                 RG du domaine.             
  -------------------------------------------------------------------------------------------------------

### Associations connues

  --------------------------------------------------------------------------
  Association                  Cardinalités            Propriétés portées
                               conceptuelles           
  ---------------------------- ----------------------- ---------------------
  `ORGANISER / ORGANISATEUR`   ESPACE (0,n) ---        ---
                               EVENEMENT_CONNECT (1,1) 
                               ; UTILISATEUR (0,n) --- 
                               EVENEMENT_CONNECT (1,1) 

  `SE_TENIR / DOCUMENTER`      EVENEMENT_CONNECT (0,1) ---
                               --- LIEU (0,n) ;        
                               EVENEMENT_CONNECT (0,1) 
                               --- EVENEMENT (0,n)     

  `PROPOSER_ACTIVITE`          EVENEMENT_CONNECT (0,n) ---
                               --- ACTIVITE_CONNECT    
                               (1,1) ;                 
                               ACTIVITE_CONNECT (0,1)  
                               --- CAMPAGNE_MEMOIRE    
                               (0,n) ;                 
                               ACTIVITE_CONNECT (0,n)  
                               --- OBJET (0,n)         

  `INVITER`                    EVENEMENT_CONNECT (0,n) ---
                               ---                     
                               PARTICIPATION_CONNECT   
                               (1,1) ;                 
                               PARTICIPATION_CONNECT   
                               (0,1) --- UTILISATEUR   
                               (0,n) / PERSONNE (0,n)  
  --------------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## ACTIVITE_CONNECT

**Définition.** Jeu, quiz, photo-identification, collecte d'anecdotes,
campagne, avant / pendant / après l'événement.

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------------------------------------------------------------------------
  Propriété source                                                                                  Définition au   Type      Obligatoire ?
                                                                                                    stade           logique   
                                                                                                    dictionnaire              
  ------------------------------------------------------------------------------------------------- --------------- --------- -------------
  `type {jeu, quiz, photo-identification, collecte d’anecdotes, campagne de mémoire, exposition}`   Propriété       **À       **À DÉCIDER**
                                                                                                    explicitement   DÉCIDER   
                                                                                                    portée par le   AU MLD**  
                                                                                                    MCD. Sa                   
                                                                                                    sémantique                
                                                                                                    détaillée doit            
                                                                                                    respecter la              
                                                                                                    définition de             
                                                                                                    l'objet et les            
                                                                                                    RG du domaine.            

  `phase {avant, pendant, après}`                                                                   Propriété       **À       **À DÉCIDER**
                                                                                                    explicitement   DÉCIDER   
                                                                                                    portée par le   AU MLD**  
                                                                                                    MCD. Sa                   
                                                                                                    sémantique                
                                                                                                    détaillée doit            
                                                                                                    respecter la              
                                                                                                    définition de             
                                                                                                    l'objet et les            
                                                                                                    RG du domaine.            

  `consignes`                                                                                       Propriété       **À       **À DÉCIDER**
                                                                                                    explicitement   DÉCIDER   
                                                                                                    portée par le   AU MLD**  
                                                                                                    MCD. Sa                   
                                                                                                    sémantique                
                                                                                                    détaillée doit            
                                                                                                    respecter la              
                                                                                                    définition de             
                                                                                                    l'objet et les            
                                                                                                    RG du domaine.            
  -----------------------------------------------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------------------
  Association                              Cardinalités            Propriétés portées
                                           conceptuelles           
  ---------------------------------------- ----------------------- ------------------
  `PROPOSER_ACTIVITE`                      EVENEMENT_CONNECT (0,n) ---
                                           --- ACTIVITE_CONNECT    
                                           (1,1) ;                 
                                           ACTIVITE_CONNECT (0,1)  
                                           --- CAMPAGNE_MEMOIRE    
                                           (0,n) ;                 
                                           ACTIVITE_CONNECT (0,n)  
                                           --- OBJET (0,n)         

  `RECUEILLIR / APPORTER / PRODUIRE_OBJ`   ACTIVITE_CONNECT (0,n)  ---
                                           ---                     
                                           CONTRIBUTION_CONNECT    
                                           (1,1) ;                 
                                           PARTICIPATION_CONNECT   
                                           (0,n) ---               
                                           CONTRIBUTION_CONNECT    
                                           (1,1) ;                 
                                           CONTRIBUTION_CONNECT    
                                           (1,n) --- OBJET         
                                           (INBOX_ITEM,            
                                           SESSION_MEMOIRE,        
                                           ASSERTION...) (0,1)     
  -----------------------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## PARTICIPATION_CONNECT

**Définition.** Invitation et participation d'un utilisateur ou d'une
personne non inscrite.

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ------------------------------------------------------------------------------------------
  Propriété source                                Définition au   Type logique Obligatoire ?
                                                  stade                        
                                                  dictionnaire                 
  ----------------------------------------------- --------------- ------------ -------------
  `role {organisateur, animateur, participant}`   Propriété       **À DÉCIDER  **À DÉCIDER**
                                                  explicitement   AU MLD**     
                                                  portée par le                
                                                  MCD. Sa                      
                                                  sémantique                   
                                                  détaillée doit               
                                                  respecter la                 
                                                  définition de                
                                                  l'objet et les               
                                                  RG du domaine.               

  `statut {invité, inscrit, présent, absent}`     Propriété       **À DÉCIDER  **À DÉCIDER**
                                                  explicitement   AU MLD**     
                                                  portée par le                
                                                  MCD. Sa                      
                                                  sémantique                   
                                                  détaillée doit               
                                                  respecter la                 
                                                  définition de                
                                                  l'objet et les               
                                                  RG du domaine.               
  ------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------------------
  Association                              Cardinalités            Propriétés portées
                                           conceptuelles           
  ---------------------------------------- ----------------------- ------------------
  `INVITER`                                EVENEMENT_CONNECT (0,n) ---
                                           ---                     
                                           PARTICIPATION_CONNECT   
                                           (1,1) ;                 
                                           PARTICIPATION_CONNECT   
                                           (0,1) --- UTILISATEUR   
                                           (0,n) / PERSONNE (0,n)  

  `RECUEILLIR / APPORTER / PRODUIRE_OBJ`   ACTIVITE_CONNECT (0,n)  ---
                                           ---                     
                                           CONTRIBUTION_CONNECT    
                                           (1,1) ;                 
                                           PARTICIPATION_CONNECT   
                                           (0,n) ---               
                                           CONTRIBUTION_CONNECT    
                                           (1,1) ;                 
                                           CONTRIBUTION_CONNECT    
                                           (1,n) --- OBJET         
                                           (INBOX_ITEM,            
                                           SESSION_MEMOIRE,        
                                           ASSERTION...) (0,1)     
  -----------------------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## CONTRIBUTION_CONNECT

**Définition.** Ce qu'un participant apporte dans une activité ; produit
des objets Journal ou Inbox.

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ------------------------------------------------------------------------------------
  Propriété source                         Définition au   Type logique  Obligatoire ?
                                           stade                         
                                           dictionnaire                  
  ---------------------------------------- --------------- ------------- -------------
  `date`                                   Propriété       **À DÉCIDER   **À DÉCIDER**
                                           explicitement   AU MLD**      
                                           portée par le                 
                                           MCD. Sa                       
                                           sémantique                    
                                           détaillée doit                
                                           respecter la                  
                                           définition de                 
                                           l'objet et les                
                                           RG du domaine.                

  `statut {brute, qualifiée, rattachée}`   Propriété       **À DÉCIDER   **À DÉCIDER**
                                           explicitement   AU MLD**      
                                           portée par le                 
                                           MCD. Sa                       
                                           sémantique                    
                                           détaillée doit                
                                           respecter la                  
                                           définition de                 
                                           l'objet et les                
                                           RG du domaine.                
  ------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------------------
  Association                              Cardinalités            Propriétés portées
                                           conceptuelles           
  ---------------------------------------- ----------------------- ------------------
  `RECUEILLIR / APPORTER / PRODUIRE_OBJ`   ACTIVITE_CONNECT (0,n)  ---
                                           ---                     
                                           CONTRIBUTION_CONNECT    
                                           (1,1) ;                 
                                           PARTICIPATION_CONNECT   
                                           (0,n) ---               
                                           CONTRIBUTION_CONNECT    
                                           (1,1) ;                 
                                           CONTRIBUTION_CONNECT    
                                           (1,n) --- OBJET         
                                           (INBOX_ITEM,            
                                           SESSION_MEMOIRE,        
                                           ASSERTION...) (0,1)     

  -----------------------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## Associations --- domaine M

  -----------------------------------------------------------------------------------
  Association                              Cardinalités du MCD     Propriétés portées
  ---------------------------------------- ----------------------- ------------------
  `ORGANISER / ORGANISATEUR`               ESPACE (0,n) ---        ---
                                           EVENEMENT_CONNECT (1,1) 
                                           ; UTILISATEUR (0,n) --- 
                                           EVENEMENT_CONNECT (1,1) 

  `SE_TENIR / DOCUMENTER`                  EVENEMENT_CONNECT (0,1) ---
                                           --- LIEU (0,n) ;        
                                           EVENEMENT_CONNECT (0,1) 
                                           --- EVENEMENT (0,n)     

  `PROPOSER_ACTIVITE`                      EVENEMENT_CONNECT (0,n) ---
                                           --- ACTIVITE_CONNECT    
                                           (1,1) ;                 
                                           ACTIVITE_CONNECT (0,1)  
                                           --- CAMPAGNE_MEMOIRE    
                                           (0,n) ;                 
                                           ACTIVITE_CONNECT (0,n)  
                                           --- OBJET (0,n)         

  `INVITER`                                EVENEMENT_CONNECT (0,n) ---
                                           ---                     
                                           PARTICIPATION_CONNECT   
                                           (1,1) ;                 
                                           PARTICIPATION_CONNECT   
                                           (0,1) --- UTILISATEUR   
                                           (0,n) / PERSONNE (0,n)  

  `RECUEILLIR / APPORTER / PRODUIRE_OBJ`   ACTIVITE_CONNECT (0,n)  ---
                                           ---                     
                                           CONTRIBUTION_CONNECT    
                                           (1,1) ;                 
                                           PARTICIPATION_CONNECT   
                                           (0,n) ---               
                                           CONTRIBUTION_CONNECT    
                                           (1,1) ;                 
                                           CONTRIBUTION_CONNECT    
                                           (1,n) --- OBJET         
                                           (INBOX_ITEM,            
                                           SESSION_MEMOIRE,        
                                           ASSERTION...) (0,1)     
  -----------------------------------------------------------------------------------

## Règles de gestion --- domaine M

# Domaine N --- Atlas (spatialité)

**Couverture : 2 entités/objets, 7 associations, 0 règles RG.**

## GEOMETRIE

**Définition.** Une localisation d'un lieu pour une période, avec son
type de précision. Plusieurs géométries concurrentes ou successives
coexistent (§ 27.4, § 27.5).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ---------------------------------------------------------------------------------------------
  Propriété source                                    Définition au   Type        Obligatoire ?
                                                      stade           logique     
                                                      dictionnaire                
  --------------------------------------------------- --------------- ----------- -------------
  `type_localisation ⟨D-46⟩`                          Propriété       **À DÉCIDER **À DÉCIDER**
                                                      explicitement   AU MLD**    
                                                      portée par le               
                                                      MCD. Sa                     
                                                      sémantique                  
                                                      détaillée doit              
                                                      respecter la                
                                                      définition de               
                                                      l'objet et les              
                                                      RG du domaine.              

  `geometrie (GEOM)`                                  Propriété       **À DÉCIDER **À DÉCIDER**
                                                      explicitement   AU MLD**    
                                                      portée par le               
                                                      MCD. Sa                     
                                                      sémantique                  
                                                      détaillée doit              
                                                      respecter la                
                                                      définition de               
                                                      l'objet et les              
                                                      RG du domaine.              

  `precision_metres`                                  Propriété       **À DÉCIDER **À DÉCIDER**
                                                      explicitement   AU MLD**    
                                                      portée par le               
                                                      MCD. Sa                     
                                                      sémantique                  
                                                      détaillée doit              
                                                      respecter la                
                                                      définition de               
                                                      l'objet et les              
                                                      RG du domaine.              

  `periode (DATE_HIST)`                               Propriété       **À DÉCIDER **À DÉCIDER**
                                                      explicitement   AU MLD**    
                                                      portée par le               
                                                      MCD. Sa                     
                                                      sémantique                  
                                                      détaillée doit              
                                                      respecter la                
                                                      définition de               
                                                      l'objet et les              
                                                      RG du domaine.              

  `statut {proposée, examinée, contestée, rejetée}`   Propriété       **À DÉCIDER **À DÉCIDER**
                                                      explicitement   AU MLD**    
                                                      portée par le               
                                                      MCD. Sa                     
                                                      sémantique                  
                                                      détaillée doit              
                                                      respecter la                
                                                      définition de               
                                                      l'objet et les              
                                                      RG du domaine.              
  ---------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `LOCALISER_LIEU`        LIEU (0,n) ---          ---
                          GEOMETRIE (1,1)         

  `RECONSTRUIRE_GEOM`     CALCUL (0,n) ---        ---
                          GEOMETRIE (0,1)         

  `FONDEE_SUR`            GEOMETRIE (0,n) ---     ---
                          ASSERTION (relations    
                          spatiales, présences)   
                          (0,n)                   

  `AFFICHER`              CARTE (0,n) ---         ---
                          GEOMETRIE (0,n)         
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## CARTE

**Définition.** Production cartographique : résultat de recherche
dépendant de localisations, versionné, dynamique ou figé (§ 28, § 5.4).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -------------------------------------------------------------------------------------------
  Propriété source                                 Définition au   Type logique Obligatoire ?
                                                   stade                        
                                                   dictionnaire                 
  ------------------------------------------------ --------------- ------------ -------------
  `titre`                                          Propriété       **À DÉCIDER  **À DÉCIDER**
                                                   explicitement   AU MLD**     
                                                   portée par le                
                                                   MCD. Sa                      
                                                   sémantique                   
                                                   détaillée doit               
                                                   respecter la                 
                                                   définition de                
                                                   l'objet et les               
                                                   RG du domaine.               

  `mode {dynamique, figée}`                        Propriété       **À DÉCIDER  **À DÉCIDER**
                                                   explicitement   AU MLD**     
                                                   portée par le                
                                                   MCD. Sa                      
                                                   sémantique                   
                                                   détaillée doit               
                                                   respecter la                 
                                                   définition de                
                                                   l'objet et les               
                                                   RG du domaine.               

  `periode`                                        Propriété       **À DÉCIDER  **À DÉCIDER**
                                                   explicitement   AU MLD**     
                                                   portée par le                
                                                   MCD. Sa                      
                                                   sémantique                   
                                                   détaillée doit               
                                                   respecter la                 
                                                   définition de                
                                                   l'objet et les               
                                                   RG du domaine.               

  `couches`                                        Propriété       **À DÉCIDER  **À DÉCIDER**
                                                   explicitement   AU MLD**     
                                                   portée par le                
                                                   MCD. Sa                      
                                                   sémantique                   
                                                   détaillée doit               
                                                   respecter la                 
                                                   définition de                
                                                   l'objet et les               
                                                   RG du domaine.               

  `fraicheur {à jour, potentiellement obsolète}`   Propriété       **À DÉCIDER  **À DÉCIDER**
                                                   explicitement   AU MLD**     
                                                   portée par le                
                                                   MCD. Sa                      
                                                   sémantique                   
                                                   détaillée doit               
                                                   respecter la                 
                                                   définition de                
                                                   l'objet et les               
                                                   RG du domaine.               
  -------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association               Cardinalités           Propriétés portées
                            conceptuelles          
  ------------------------- ---------------------- ----------------------
  `PRODUIRE_CARTE`          ESPACE (0,n) --- CARTE ---
                            (1,1)                  

  `REPRESENTER_SUR_CARTE`   CARTE (0,n) --- OBJET  symbolisation
                            (0,n)                  {attesté,
                                                   hypothétique, calculé,
                                                   cooccurrence}

  `AFFICHER`                CARTE (0,n) ---        ---
                            GEOMETRIE (0,n)        
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## Associations --- domaine N

  -----------------------------------------------------------------------
  Association               Cardinalités du MCD    Propriétés portées
  ------------------------- ---------------------- ----------------------
  `LOCALISER_LIEU`          LIEU (0,n) ---         ---
                            GEOMETRIE (1,1)        

  `RECONSTRUIRE_GEOM`       CALCUL (0,n) ---       ---
                            GEOMETRIE (0,1)        

  `FONDEE_SUR`              GEOMETRIE (0,n) ---    ---
                            ASSERTION (relations   
                            spatiales, présences)  
                            (0,n)                  

  `PRODUIRE_CARTE`          ESPACE (0,n) --- CARTE ---
                            (1,1)                  

  `REPRESENTER_SUR_CARTE`   CARTE (0,n) --- OBJET  symbolisation
                            (0,n)                  {attesté,
                                                   hypothétique, calculé,
                                                   cooccurrence}

  `AFFICHER`                CARTE (0,n) ---        ---
                            GEOMETRIE (0,n)        

  `DROIT_SUR`               SITUATION (0,1) ---    ---
                            BIEN (0,n)             
  -----------------------------------------------------------------------

## Règles de gestion --- domaine N

# Domaine O --- Analyse, corpus, reproductibilité

**Couverture : 6 entités/objets, 10 associations, 0 règles RG.**

## REQUETE

**Définition.** Requête sauvegardée, versionnée, partageable, citable ;
peut devenir veille (§ 43, § 91).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -------------------------------------------------------------------------------------
  Propriété source                           Définition au   Type logique Obligatoire ?
                                             stade                        
                                             dictionnaire                 
  ------------------------------------------ --------------- ------------ -------------
  `definition`                               Propriété       **À DÉCIDER  **À DÉCIDER**
                                             explicitement   AU MLD**     
                                             portée par le                
                                             MCD. Sa                      
                                             sémantique                   
                                             détaillée doit               
                                             respecter la                 
                                             définition de                
                                             l'objet et les               
                                             RG du domaine.               

  `mode {strict, recherche, exploratoire}`   Propriété       **À DÉCIDER  **À DÉCIDER**
                                             explicitement   AU MLD**     
                                             portée par le                
                                             MCD. Sa                      
                                             sémantique                   
                                             détaillée doit               
                                             respecter la                 
                                             définition de                
                                             l'objet et les               
                                             RG du domaine.               

  `partage`                                  Propriété       **À DÉCIDER  **À DÉCIDER**
                                             explicitement   AU MLD**     
                                             portée par le                
                                             MCD. Sa                      
                                             sémantique                   
                                             détaillée doit               
                                             respecter la                 
                                             définition de                
                                             l'objet et les               
                                             RG du domaine.               
  -------------------------------------------------------------------------------------

### Associations connues

  ---------------------------------------------------------------------------
  Association                       Cardinalités         Propriétés portées
                                    conceptuelles        
  --------------------------------- -------------------- --------------------
  `DEFINIR_CORPUS / FIGER_CORPUS`   REQUETE (0,n) ---    ---
                                    CORPUS (0,1) ;       
                                    SNAPSHOT (0,n) ---   
                                    CORPUS (0,1)         

  `CRITERES / DANS`                 REQUETE (0,n) ---    ---
                                    COHORTE_ANALYTIQUE   
                                    (1,1) ; CORPUS (0,n) 
                                    ---                  
                                    COHORTE_ANALYTIQUE   
                                    (1,1)                
  ---------------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## CORPUS

**Définition.** Jeu de recherche : manuel, par critères, dynamique ou
figé ; citable (§ 39).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -------------------------------------------------------------------------------------------
  Propriété source                                 Définition au   Type logique Obligatoire ?
                                                   stade                        
                                                   dictionnaire                 
  ------------------------------------------------ --------------- ------------ -------------
  `type {manuel, par critères, dynamique, figé}`   Propriété       **À DÉCIDER  **À DÉCIDER**
                                                   explicitement   AU MLD**     
                                                   portée par le                
                                                   MCD. Sa                      
                                                   sémantique                   
                                                   détaillée doit               
                                                   respecter la                 
                                                   définition de                
                                                   l'objet et les               
                                                   RG du domaine.               

  `definition`                                     Propriété       **À DÉCIDER  **À DÉCIDER**
                                                   explicitement   AU MLD**     
                                                   portée par le                
                                                   MCD. Sa                      
                                                   sémantique                   
                                                   détaillée doit               
                                                   respecter la                 
                                                   définition de                
                                                   l'objet et les               
                                                   RG du domaine.               
  -------------------------------------------------------------------------------------------

### Associations connues

  ---------------------------------------------------------------------------
  Association                       Cardinalités         Propriétés portées
                                    conceptuelles        
  --------------------------------- -------------------- --------------------
  `DEFINIR_CORPUS / FIGER_CORPUS`   REQUETE (0,n) ---    ---
                                    CORPUS (0,1) ;       
                                    SNAPSHOT (0,n) ---   
                                    CORPUS (0,1)         

  `INCLURE`                         CORPUS (0,n) ---     decision {inclus,
                                    OBJET (0,n)          exclu}, motif, mode
                                                         {manuel, critère}

  `CRITERES / DANS`                 REQUETE (0,n) ---    ---
                                    COHORTE_ANALYTIQUE   
                                    (1,1) ; CORPUS (0,n) 
                                    ---                  
                                    COHORTE_ANALYTIQUE   
                                    (1,1)                

  `SUR`                             CORPUS (version)     ---
                                    (0,n) --- CALCUL     
                                    (0,1)                
  ---------------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## COHORTE_ANALYTIQUE

**Définition.** Groupe construit par un chercheur selon des critères ;
jamais une catégorie historique (§ 13.2).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ------------------------------------------------------------------------
  Propriété source   Définition au     Type logique      Obligatoire ?
                     stade                               
                     dictionnaire                        
  ------------------ ----------------- ----------------- -----------------
  `libelle`          Propriété         **À DÉCIDER AU    **À DÉCIDER**
                     explicitement     MLD**             
                     portée par le                       
                     MCD. Sa                             
                     sémantique                          
                     détaillée doit                      
                     respecter la                        
                     définition de                       
                     l'objet et les RG                   
                     du domaine.                         

  `criteres_texte`   Propriété         **À DÉCIDER AU    **À DÉCIDER**
                     explicitement     MLD**             
                     portée par le                       
                     MCD. Sa                             
                     sémantique                          
                     détaillée doit                      
                     respecter la                        
                     définition de                       
                     l'objet et les RG                   
                     du domaine.                         
  ------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `CRITERES / DANS`       REQUETE (0,n) ---       ---
                          COHORTE_ANALYTIQUE      
                          (1,1) ; CORPUS (0,n)    
                          --- COHORTE_ANALYTIQUE  
                          (1,1)                   

  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## METHODE

**Définition.** Méthode versionnée : dérivation de date, conversion,
statistique, reconstruction spatiale, proposition de candidats,
cooccurrence, OCR/HTR... (§ 9.3, § 40).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -------------------------------------------------------------------------
  Propriété source       Définition au    Type logique     Obligatoire ?
                         stade                             
                         dictionnaire                      
  ---------------------- ---------------- ---------------- ----------------
  `nom`                  Propriété        **À DÉCIDER AU   **À DÉCIDER**
                         explicitement    MLD**            
                         portée par le                     
                         MCD. Sa                           
                         sémantique                        
                         détaillée doit                    
                         respecter la                      
                         définition de                     
                         l'objet et les                    
                         RG du domaine.                    

  `type ⟨D-47⟩`          Propriété        **À DÉCIDER AU   **À DÉCIDER**
                         explicitement    MLD**            
                         portée par le                     
                         MCD. Sa                           
                         sémantique                        
                         détaillée doit                    
                         respecter la                      
                         définition de                     
                         l'objet et les                    
                         RG du domaine.                    

  `description`          Propriété        **À DÉCIDER AU   **À DÉCIDER**
                         explicitement    MLD**            
                         portée par le                     
                         MCD. Sa                           
                         sémantique                        
                         détaillée doit                    
                         respecter la                      
                         définition de                     
                         l'objet et les                    
                         RG du domaine.                    

  `hypotheses`           Propriété        **À DÉCIDER AU   **À DÉCIDER**
                         explicitement    MLD**            
                         portée par le                     
                         MCD. Sa                           
                         sémantique                        
                         détaillée doit                    
                         respecter la                      
                         définition de                     
                         l'objet et les                    
                         RG du domaine.                    

  `parametres`           Propriété        **À DÉCIDER AU   **À DÉCIDER**
                         explicitement    MLD**            
                         portée par le                     
                         MCD. Sa                           
                         sémantique                        
                         détaillée doit                    
                         respecter la                      
                         définition de                     
                         l'objet et les                    
                         RG du domaine.                    

  `limites`              Propriété        **À DÉCIDER AU   **À DÉCIDER**
                         explicitement    MLD**            
                         portée par le                     
                         MCD. Sa                           
                         sémantique                        
                         détaillée doit                    
                         respecter la                      
                         définition de                     
                         l'objet et les                    
                         RG du domaine.                    

  `algorithme`           Propriété        **À DÉCIDER AU   **À DÉCIDER**
                         explicitement    MLD**            
                         portée par le                     
                         MCD. Sa                           
                         sémantique                        
                         détaillée doit                    
                         respecter la                      
                         définition de                     
                         l'objet et les                    
                         RG du domaine.                    

  `version_algorithme`   Propriété        **À DÉCIDER AU   **À DÉCIDER**
                         explicitement    MLD**            
                         portée par le                     
                         MCD. Sa                           
                         sémantique                        
                         détaillée doit                    
                         respecter la                      
                         définition de                     
                         l'objet et les                    
                         RG du domaine.                    
  -------------------------------------------------------------------------

### Associations connues

  Association           Cardinalités conceptuelles                 Propriétés portées
  --------------------- ------------------------------------------ --------------------
  `APPLIQUER_METHODE`   METHODE (version) (0,n) --- CALCUL (1,1)   ---

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## CALCUL

**Définition.** Exécution datée d'une méthode sur un corpus et un état
de connaissance (§ 40).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  --------------------------------------------------------------------------------------------------------------------
  Propriété source                                                             Définition au   Type      Obligatoire ?
                                                                               stade           logique   
                                                                               dictionnaire              
  ---------------------------------------------------------------------------- --------------- --------- -------------
  `date`                                                                       Propriété       **À       **À DÉCIDER**
                                                                               explicitement   DÉCIDER   
                                                                               portée par le   AU MLD**  
                                                                               MCD. Sa                   
                                                                               sémantique                
                                                                               détaillée doit            
                                                                               respecter la              
                                                                               définition de             
                                                                               l'objet et les            
                                                                               RG du domaine.            

  `nature_execution {calcul initial, reproduction, rerun, nouvelle analyse}`   Propriété       **À       **À DÉCIDER**
                                                                               explicitement   DÉCIDER   
                                                                               portée par le   AU MLD**  
                                                                               MCD. Sa                   
                                                                               sémantique                
                                                                               détaillée doit            
                                                                               respecter la              
                                                                               définition de             
                                                                               l'objet et les            
                                                                               RG du domaine.            

  `parametres_effectifs`                                                       Propriété       **À       **À DÉCIDER**
                                                                               explicitement   DÉCIDER   
                                                                               portée par le   AU MLD**  
                                                                               MCD. Sa                   
                                                                               sémantique                
                                                                               détaillée doit            
                                                                               respecter la              
                                                                               définition de             
                                                                               l'objet et les            
                                                                               RG du domaine.            
  --------------------------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `APPLIQUER_METHODE`     METHODE (version) (0,n) ---
                          --- CALCUL (1,1)        

  `SUR`                   CORPUS (version) (0,n)  ---
                          --- CALCUL (0,1)        

  `ETAT_CONNAISSANCE`     SNAPSHOT (0,n) ---      ---
                          CALCUL (0,1) (à défaut, 
                          date de référence)      

  `MOBILISER`             CALCUL (0,n) ---        ---
                          REFERENTIEL (version)   
                          (0,n)                   

  `EXECUTER_CALCUL`       ACTIVITE (0,1) ---      ---
                          CALCUL (1,1)            

  `PRODUIRE_RESULTAT`     CALCUL (1,n) ---        ---
                          RESULTAT (1,1)          

  `REPRODUIRE_CALCUL`     CALCUL d'origine (0,n)  ---
                          --- CALCUL (0,1)        
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## RESULTAT

**Définition.** Résultat d'un calcul : statistique, entourage,
cooccurrences, zone plausible, intervalle, candidats (§ 38, § 41).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  Propriété source                                                                                                                                     Définition au   Type      Obligatoire ?
                                                                                                                                                       stade           logique   
                                                                                                                                                       dictionnaire              
  ---------------------------------------------------------------------------------------------------------------------------------------------------- --------------- --------- -------------
  `type {statistique calculée, entourage, cooccurrences, comparaison de trajectoires, zone plausible, intervalle dérivé, liste de candidats, autre}`   Propriété       **À       **À DÉCIDER**
                                                                                                                                                       explicitement   DÉCIDER   
                                                                                                                                                       portée par le   AU MLD**  
                                                                                                                                                       MCD. Sa                   
                                                                                                                                                       sémantique                
                                                                                                                                                       détaillée doit            
                                                                                                                                                       respecter la              
                                                                                                                                                       définition de             
                                                                                                                                                       l'objet et les            
                                                                                                                                                       RG du domaine.            

  `contenu`                                                                                                                                            Propriété       **À       **À DÉCIDER**
                                                                                                                                                       explicitement   DÉCIDER   
                                                                                                                                                       portée par le   AU MLD**  
                                                                                                                                                       MCD. Sa                   
                                                                                                                                                       sémantique                
                                                                                                                                                       détaillée doit            
                                                                                                                                                       respecter la              
                                                                                                                                                       définition de             
                                                                                                                                                       l'objet et les            
                                                                                                                                                       RG du domaine.            

  `mode {dynamique, figé}`                                                                                                                             Propriété       **À       **À DÉCIDER**
                                                                                                                                                       explicitement   DÉCIDER   
                                                                                                                                                       portée par le   AU MLD**  
                                                                                                                                                       MCD. Sa                   
                                                                                                                                                       sémantique                
                                                                                                                                                       détaillée doit            
                                                                                                                                                       respecter la              
                                                                                                                                                       définition de             
                                                                                                                                                       l'objet et les            
                                                                                                                                                       RG du domaine.            

  `fraicheur {à jour, potentiellement obsolète, recalcul en cours}`                                                                                    Propriété       **À       **À DÉCIDER**
                                                                                                                                                       explicitement   DÉCIDER   
                                                                                                                                                       portée par le   AU MLD**  
                                                                                                                                                       MCD. Sa                   
                                                                                                                                                       sémantique                
                                                                                                                                                       détaillée doit            
                                                                                                                                                       respecter la              
                                                                                                                                                       définition de             
                                                                                                                                                       l'objet et les            
                                                                                                                                                       RG du domaine.            

  `date_dernier_calcul`                                                                                                                                Propriété       **À       **À DÉCIDER**
                                                                                                                                                       explicitement   DÉCIDER   
                                                                                                                                                       portée par le   AU MLD**  
                                                                                                                                                       MCD. Sa                   
                                                                                                                                                       sémantique                
                                                                                                                                                       détaillée doit            
                                                                                                                                                       respecter la              
                                                                                                                                                       définition de             
                                                                                                                                                       l'objet et les            
                                                                                                                                                       RG du domaine.            

  `couverture`                                                                                                                                         Propriété       **À       **À DÉCIDER**
                                                                                                                                                       explicitement   DÉCIDER   
                                                                                                                                                       portée par le   AU MLD**  
                                                                                                                                                       MCD. Sa                   
                                                                                                                                                       sémantique                
                                                                                                                                                       détaillée doit            
                                                                                                                                                       respecter la              
                                                                                                                                                       définition de             
                                                                                                                                                       l'objet et les            
                                                                                                                                                       RG du domaine.            
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

### Associations connues

  Association           Cardinalités conceptuelles        Propriétés portées
  --------------------- --------------------------------- --------------------
  `PRODUIRE_RESULTAT`   CALCUL (1,n) --- RESULTAT (1,1)   ---

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## Associations --- domaine O

  ---------------------------------------------------------------------------
  Association                       Cardinalités du MCD  Propriétés portées
  --------------------------------- -------------------- --------------------
  `DEFINIR_CORPUS / FIGER_CORPUS`   REQUETE (0,n) ---    ---
                                    CORPUS (0,1) ;       
                                    SNAPSHOT (0,n) ---   
                                    CORPUS (0,1)         

  `INCLURE`                         CORPUS (0,n) ---     decision {inclus,
                                    OBJET (0,n)          exclu}, motif, mode
                                                         {manuel, critère}

  `CRITERES / DANS`                 REQUETE (0,n) ---    ---
                                    COHORTE_ANALYTIQUE   
                                    (1,1) ; CORPUS (0,n) 
                                    ---                  
                                    COHORTE_ANALYTIQUE   
                                    (1,1)                

  `APPLIQUER_METHODE`               METHODE (version)    ---
                                    (0,n) --- CALCUL     
                                    (1,1)                

  `SUR`                             CORPUS (version)     ---
                                    (0,n) --- CALCUL     
                                    (0,1)                

  `ETAT_CONNAISSANCE`               SNAPSHOT (0,n) ---   ---
                                    CALCUL (0,1) (à      
                                    défaut, date de      
                                    référence)           

  `MOBILISER`                       CALCUL (0,n) ---     ---
                                    REFERENTIEL          
                                    (version) (0,n)      

  `EXECUTER_CALCUL`                 ACTIVITE (0,1) ---   ---
                                    CALCUL (1,1)         

  `PRODUIRE_RESULTAT`               CALCUL (1,n) ---     ---
                                    RESULTAT (1,1)       

  `REPRODUIRE_CALCUL`               CALCUL d'origine     ---
                                    (0,n) --- CALCUL     
                                    (0,1)                
  ---------------------------------------------------------------------------

## Règles de gestion --- domaine O

# Domaine P --- Publication, pérennité, interopérabilité

**Couverture : 5 entités/objets, 7 associations, 0 règles RG.**

## PUBLICATION

**Définition.** Publication volontaire, sélective, versionnée : fiche,
chronologie, carte, corpus, conclusion, article, édition critique (§
76).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -------------------------------------------------------------------------------------------------------------------------------------------------
  Propriété source                                                                                          Définition au   Type      Obligatoire ?
                                                                                                            stade           logique   
                                                                                                            dictionnaire              
  --------------------------------------------------------------------------------------------------------- --------------- --------- -------------
  `titre`                                                                                                   Propriété       **À       **À DÉCIDER**
                                                                                                            explicitement   DÉCIDER   
                                                                                                            portée par le   AU MLD**  
                                                                                                            MCD. Sa                   
                                                                                                            sémantique                
                                                                                                            détaillée doit            
                                                                                                            respecter la              
                                                                                                            définition de             
                                                                                                            l'objet et les            
                                                                                                            RG du domaine.            

  `type {fiche entité, chronologie, carte, corpus, conclusion, article, édition critique, page publique}`   Propriété       **À       **À DÉCIDER**
                                                                                                            explicitement   DÉCIDER   
                                                                                                            portée par le   AU MLD**  
                                                                                                            MCD. Sa                   
                                                                                                            sémantique                
                                                                                                            détaillée doit            
                                                                                                            respecter la              
                                                                                                            définition de             
                                                                                                            l'objet et les            
                                                                                                            RG du domaine.            

  `etat {brouillon, publiée, corrigée, remplacée, retirée}`                                                 Propriété       **À       **À DÉCIDER**
                                                                                                            explicitement   DÉCIDER   
                                                                                                            portée par le   AU MLD**  
                                                                                                            MCD. Sa                   
                                                                                                            sémantique                
                                                                                                            détaillée doit            
                                                                                                            respecter la              
                                                                                                            définition de             
                                                                                                            l'objet et les            
                                                                                                            RG du domaine.            

  `date_publication`                                                                                        Propriété       **À       **À DÉCIDER**
                                                                                                            explicitement   DÉCIDER   
                                                                                                            portée par le   AU MLD**  
                                                                                                            MCD. Sa                   
                                                                                                            sémantique                
                                                                                                            détaillée doit            
                                                                                                            respecter la              
                                                                                                            définition de             
                                                                                                            l'objet et les            
                                                                                                            RG du domaine.            

  `numero_edition`                                                                                          Propriété       **À       **À DÉCIDER**
                                                                                                            explicitement   DÉCIDER   
                                                                                                            portée par le   AU MLD**  
                                                                                                            MCD. Sa                   
                                                                                                            sémantique                
                                                                                                            détaillée doit            
                                                                                                            respecter la              
                                                                                                            définition de             
                                                                                                            l'objet et les            
                                                                                                            RG du domaine.            

  `indexable`                                                                                               Propriété       **À       **À DÉCIDER**
                                                                                                            explicitement   DÉCIDER   
                                                                                                            portée par le   AU MLD**  
                                                                                                            MCD. Sa                   
                                                                                                            sémantique                
                                                                                                            détaillée doit            
                                                                                                            respecter la              
                                                                                                            définition de             
                                                                                                            l'objet et les            
                                                                                                            RG du domaine.            
  -------------------------------------------------------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association            Cardinalités             Propriétés portées
                         conceptuelles            
  ---------------------- ------------------------ -----------------------
  `PUBLIER`              ESPACE (0,n) ---         ---
                         PUBLICATION (1,1)        

  `EXPOSER`              PUBLICATION (1,n) ---    mode_exposition
                         VERSION_OBJET (0,n)      {intégral, provenance
                                                  masquée, pseudonymisé,
                                                  existence seulement}

  `CORRIGER`             PUBLICATION (0,n) ---    ---
                         CORRECTION_PUBLICATION   
                         (1,1) ;                  
                         CORRECTION_PUBLICATION   
                         (0,1) --- PUBLICATION    
                         remplaçante (0,1)        
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## CORRECTION_PUBLICATION

**Définition.** Correction historisée d'une publication (§ 77).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ---------------------------------------------------------------------------------------------------------------------------------------
  Propriété source                                                                                Définition au   Type      Obligatoire ?
                                                                                                  stade           logique   
                                                                                                  dictionnaire              
  ----------------------------------------------------------------------------------------------- --------------- --------- -------------
  `type {correction éditoriale mineure, erratum/corrigendum, nouvelle édition, retrait motivé}`   Propriété       **À       **À DÉCIDER**
                                                                                                  explicitement   DÉCIDER   
                                                                                                  portée par le   AU MLD**  
                                                                                                  MCD. Sa                   
                                                                                                  sémantique                
                                                                                                  détaillée doit            
                                                                                                  respecter la              
                                                                                                  définition de             
                                                                                                  l'objet et les            
                                                                                                  RG du domaine.            

  `motif`                                                                                         Propriété       **À       **À DÉCIDER**
                                                                                                  explicitement   DÉCIDER   
                                                                                                  portée par le   AU MLD**  
                                                                                                  MCD. Sa                   
                                                                                                  sémantique                
                                                                                                  détaillée doit            
                                                                                                  respecter la              
                                                                                                  définition de             
                                                                                                  l'objet et les            
                                                                                                  RG du domaine.            

  `date`                                                                                          Propriété       **À       **À DÉCIDER**
                                                                                                  explicitement   DÉCIDER   
                                                                                                  portée par le   AU MLD**  
                                                                                                  MCD. Sa                   
                                                                                                  sémantique                
                                                                                                  détaillée doit            
                                                                                                  respecter la              
                                                                                                  définition de             
                                                                                                  l'objet et les            
                                                                                                  RG du domaine.            
  ---------------------------------------------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association            Cardinalités             Propriétés portées
                         conceptuelles            
  ---------------------- ------------------------ -----------------------
  `CORRIGER`             PUBLICATION (0,n) ---    ---
                         CORRECTION_PUBLICATION   
                         (1,1) ;                  
                         CORRECTION_PUBLICATION   
                         (0,1) --- PUBLICATION    
                         remplaçante (0,1)        

  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## EXPORT

**Définition.** Export de portabilité ou package de reproductibilité (§
82, Q198).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------
  Propriété source     Définition au    Type logique     Obligatoire ?
                       stade                             
                       dictionnaire                      
  -------------------- ---------------- ---------------- ----------------
  `format ⟨D-48⟩`      Propriété        **À DÉCIDER AU   **À DÉCIDER**
                       explicitement    MLD**            
                       portée par le                     
                       MCD. Sa                           
                       sémantique                        
                       détaillée doit                    
                       respecter la                      
                       définition de                     
                       l'objet et les                    
                       RG du domaine.                    

  `version_format`     Propriété        **À DÉCIDER AU   **À DÉCIDER**
                       explicitement    MLD**            
                       portée par le                     
                       MCD. Sa                           
                       sémantique                        
                       détaillée doit                    
                       respecter la                      
                       définition de                     
                       l'objet et les                    
                       RG du domaine.                    

  `perimetre`          Propriété        **À DÉCIDER AU   **À DÉCIDER**
                       explicitement    MLD**            
                       portée par le                     
                       MCD. Sa                           
                       sémantique                        
                       détaillée doit                    
                       respecter la                      
                       définition de                     
                       l'objet et les                    
                       RG du domaine.                    

  `date`               Propriété        **À DÉCIDER AU   **À DÉCIDER**
                       explicitement    MLD**            
                       portée par le                     
                       MCD. Sa                           
                       sémantique                        
                       détaillée doit                    
                       respecter la                      
                       définition de                     
                       l'objet et les                    
                       RG du domaine.                    

  `droits_appliques`   Propriété        **À DÉCIDER AU   **À DÉCIDER**
                       explicitement    MLD**            
                       portée par le                     
                       MCD. Sa                           
                       sémantique                        
                       détaillée doit                    
                       respecter la                      
                       définition de                     
                       l'objet et les                    
                       RG du domaine.                    
  -----------------------------------------------------------------------

### Associations connues

  --------------------------------------------------------------------------
  Association                    Cardinalités          Propriétés portées
                                 conceptuelles         
  ------------------------------ --------------------- ---------------------
  `EXPORTER / CONTENIR_EXPORT`   UTILISATEUR (0,n) --- ---
                                 EXPORT (1,1) ; EXPORT 
                                 (1,n) --- OBJET (0,n) 

  --------------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## IMPORT

**Définition.** Import externe, réimport du format patrimonial ou
restauration : l'import est une provenance (§ 83, § 84).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ------------------------------------------------------------------------------------------------------
  Propriété source                                              Définition au   Type       Obligatoire ?
                                                                stade           logique    
                                                                dictionnaire               
  ------------------------------------------------------------- --------------- ---------- -------------
  `type {import externe, réimport patrimonial, restauration}`   Propriété       **À        **À DÉCIDER**
                                                                explicitement   DÉCIDER AU 
                                                                portée par le   MLD**      
                                                                MCD. Sa                    
                                                                sémantique                 
                                                                détaillée doit             
                                                                respecter la               
                                                                définition de              
                                                                l'objet et les             
                                                                RG du domaine.             

  `logiciel`                                                    Propriété       **À        **À DÉCIDER**
                                                                explicitement   DÉCIDER AU 
                                                                portée par le   MLD**      
                                                                MCD. Sa                    
                                                                sémantique                 
                                                                détaillée doit             
                                                                respecter la               
                                                                définition de              
                                                                l'objet et les             
                                                                RG du domaine.             

  `format`                                                      Propriété       **À        **À DÉCIDER**
                                                                explicitement   DÉCIDER AU 
                                                                portée par le   MLD**      
                                                                MCD. Sa                    
                                                                sémantique                 
                                                                détaillée doit             
                                                                respecter la               
                                                                définition de              
                                                                l'objet et les             
                                                                RG du domaine.             

  `version_format`                                              Propriété       **À        **À DÉCIDER**
                                                                explicitement   DÉCIDER AU 
                                                                portée par le   MLD**      
                                                                MCD. Sa                    
                                                                sémantique                 
                                                                détaillée doit             
                                                                respecter la               
                                                                définition de              
                                                                l'objet et les             
                                                                RG du domaine.             

  `fournisseur`                                                 Propriété       **À        **À DÉCIDER**
                                                                explicitement   DÉCIDER AU 
                                                                portée par le   MLD**      
                                                                MCD. Sa                    
                                                                sémantique                 
                                                                détaillée doit             
                                                                respecter la               
                                                                définition de              
                                                                l'objet et les             
                                                                RG du domaine.             

  `date`                                                        Propriété       **À        **À DÉCIDER**
                                                                explicitement   DÉCIDER AU 
                                                                portée par le   MLD**      
                                                                MCD. Sa                    
                                                                sémantique                 
                                                                détaillée doit             
                                                                respecter la               
                                                                définition de              
                                                                l'objet et les             
                                                                RG du domaine.             

  `avertissements`                                              Propriété       **À        **À DÉCIDER**
                                                                explicitement   DÉCIDER AU 
                                                                portée par le   MLD**      
                                                                MCD. Sa                    
                                                                sémantique                 
                                                                détaillée doit             
                                                                respecter la               
                                                                définition de              
                                                                l'objet et les             
                                                                RG du domaine.             
  ------------------------------------------------------------------------------------------------------

### Associations connues

  -------------------------------------------------------------------------------
  Association                         Cardinalités            Propriétés portées
                                      conceptuelles           
  ----------------------------------- ----------------------- -------------------
  `FICHIER_ORIGINAL / CIBLE_IMPORT`   IMPORT (1,1) ---        ---
                                      FICHIER (0,n) ; IMPORT  
                                      (1,1) --- ESPACE (0,n)  

  `RECONCILIER`                       IMPORT (0,n) ---        ---
                                      RECONCILIATION_IMPORT   
                                      (1,1) ;                 
                                      RECONCILIATION_IMPORT   
                                      (1,1) --- OBJET importé 
                                      (0,n) ;                 
                                      RECONCILIATION_IMPORT   
                                      (0,1) --- OBJET         
                                      existant (0,n)          
  -------------------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## RECONCILIATION_IMPORT

**Définition.** Issue de la réconciliation d'un objet importé avec
l'existant (§ 83).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------------------------------------------------------------------------------------------------
  Propriété source                                                                                                          Définition au   Type      Obligatoire ?
                                                                                                                            stade           logique   
                                                                                                                            dictionnaire              
  ------------------------------------------------------------------------------------------------------------------------- --------------- --------- -------------
  `issue {nouveau, identique - reconnecté, local modifié - à comparer, Core évolué - lien proposé, incompatible - isolé}`   Propriété       **À       **À DÉCIDER**
                                                                                                                            explicitement   DÉCIDER   
                                                                                                                            portée par le   AU MLD**  
                                                                                                                            MCD. Sa                   
                                                                                                                            sémantique                
                                                                                                                            détaillée doit            
                                                                                                                            respecter la              
                                                                                                                            définition de             
                                                                                                                            l'objet et les            
                                                                                                                            RG du domaine.            

  -----------------------------------------------------------------------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `RECONCILIER`           IMPORT (0,n) ---        ---
                          RECONCILIATION_IMPORT   
                          (1,1) ;                 
                          RECONCILIATION_IMPORT   
                          (1,1) --- OBJET importé 
                          (0,n) ;                 
                          RECONCILIATION_IMPORT   
                          (0,1) --- OBJET         
                          existant (0,n)          

  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## Associations --- domaine P

  ---------------------------------------------------------------------------------
  Association                         Cardinalités du MCD      Propriétés portées
  ----------------------------------- ------------------------ --------------------
  `PUBLIER`                           ESPACE (0,n) ---         ---
                                      PUBLICATION (1,1)        

  `EXPOSER`                           PUBLICATION (1,n) ---    mode_exposition
                                      VERSION_OBJET (0,n)      {intégral,
                                                               provenance masquée,
                                                               pseudonymisé,
                                                               existence seulement}

  `CORRIGER`                          PUBLICATION (0,n) ---    ---
                                      CORRECTION_PUBLICATION   
                                      (1,1) ;                  
                                      CORRECTION_PUBLICATION   
                                      (0,1) --- PUBLICATION    
                                      remplaçante (0,1)        

  `CITER`                             OBJET citant (0,n) ---   type {cite, s'appuie
                                      REFERENCE_PERSISTANTE    sur, discute,
                                      (0,n)                    réfute, réutilise}

  `EXPORTER / CONTENIR_EXPORT`        UTILISATEUR (0,n) ---    ---
                                      EXPORT (1,1) ; EXPORT    
                                      (1,n) --- OBJET (0,n)    

  `FICHIER_ORIGINAL / CIBLE_IMPORT`   IMPORT (1,1) --- FICHIER ---
                                      (0,n) ; IMPORT (1,1) --- 
                                      ESPACE (0,n)             

  `RECONCILIER`                       IMPORT (0,n) ---         ---
                                      RECONCILIATION_IMPORT    
                                      (1,1) ;                  
                                      RECONCILIATION_IMPORT    
                                      (1,1) --- OBJET importé  
                                      (0,n) ;                  
                                      RECONCILIATION_IMPORT    
                                      (0,1) --- OBJET existant 
                                      (0,n)                    
  ---------------------------------------------------------------------------------

## Règles de gestion --- domaine P

# Domaine Q --- Organisation personnelle, veille, notifications

**Couverture : 9 entités/objets, 11 associations, 0 règles RG.**

## WORKSPACE

**Définition.** Table de travail privée et temporaire : épingler,
grouper, tracer des liens exploratoires sans toucher au Core (§ 47).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ----------------------------------------------------------------------------------------
  Propriété source                              Définition au   Type logique Obligatoire ?
                                                stade                        
                                                dictionnaire                 
  --------------------------------------------- --------------- ------------ -------------
  `titre`                                       Propriété       **À DÉCIDER  **À DÉCIDER**
                                                explicitement   AU MLD**     
                                                portée par le                
                                                MCD. Sa                      
                                                sémantique                   
                                                détaillée doit               
                                                respecter la                 
                                                définition de                
                                                l'objet et les               
                                                RG du domaine.               

  `etat {actif, converti, archivé, supprimé}`   Propriété       **À DÉCIDER  **À DÉCIDER**
                                                explicitement   AU MLD**     
                                                portée par le                
                                                MCD. Sa                      
                                                sémantique                   
                                                détaillée doit               
                                                respecter la                 
                                                définition de                
                                                l'objet et les               
                                                RG du domaine.               
  ----------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `OUVRIR`                UTILISATEUR (0,n) ---   ---
                          WORKSPACE (1,1)         

  `EPINGLER`              WORKSPACE (0,n) ---     x, y, groupe, note
                          OBJET (0,n)             

  `TRACER`                WORKSPACE (0,n) ---     ---
                          LIEN_EXPLORATOIRE (1,1) 

  `DEVENIR`               WORKSPACE (0,1) ---     ---
                          OBJET (PROJET,          
                          SNAPSHOT, ESPACE) (0,1) 
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## LIEN_EXPLORATOIRE

**Définition.** Trait tracé entre deux objets sur une table de travail ;
jamais une assertion.

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ------------------------------------------------------------------------
  Propriété source      Définition au    Type logique     Obligatoire ?
                        stade                             
                        dictionnaire                      
  --------------------- ---------------- ---------------- ----------------
  `libelle`             Propriété        **À DÉCIDER AU   **À DÉCIDER**
                        explicitement    MLD**            
                        portée par le                     
                        MCD. Sa                           
                        sémantique                        
                        détaillée doit                    
                        respecter la                      
                        définition de                     
                        l'objet et les                    
                        RG du domaine.                    

  `objet_a (→ OBJET)`   Propriété        **À DÉCIDER AU   **À DÉCIDER**
                        explicitement    MLD**            
                        portée par le                     
                        MCD. Sa                           
                        sémantique                        
                        détaillée doit                    
                        respecter la                      
                        définition de                     
                        l'objet et les                    
                        RG du domaine.                    

  `objet_b (→ OBJET)`   Propriété        **À DÉCIDER AU   **À DÉCIDER**
                        explicitement    MLD**            
                        portée par le                     
                        MCD. Sa                           
                        sémantique                        
                        détaillée doit                    
                        respecter la                      
                        définition de                     
                        l'objet et les                    
                        RG du domaine.                    
  ------------------------------------------------------------------------

### Associations connues

  Association   Cardinalités conceptuelles                    Propriétés portées
  ------------- --------------------------------------------- --------------------
  `TRACER`      WORKSPACE (0,n) --- LIEN_EXPLORATOIRE (1,1)   ---

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## COLLECTION

**Définition.** Organisation légère et transversale (§ 48.1).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------
  Propriété source  Définition au     Type logique      Obligatoire ?
                    stade                               
                    dictionnaire                        
  ----------------- ----------------- ----------------- -----------------
  `titre`           Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `collaborative`   Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         
  -----------------------------------------------------------------------

### Associations connues

  Association   Cardinalités conceptuelles         Propriétés portées
  ------------- ---------------------------------- --------------------
  `RANGER`      COLLECTION (0,n) --- OBJET (0,n)   rang

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## TAG

**Définition.** Étiquette libre, personnelle ou collaborative ;
distincte d'un concept (§ 48.2).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  --------------------------------------------------------------------------------
  Propriété source                     Définition au   Type logique  Obligatoire ?
                                       stade                         
                                       dictionnaire                  
  ------------------------------------ --------------- ------------- -------------
  `libelle`                            Propriété       **À DÉCIDER   **À DÉCIDER**
                                       explicitement   AU MLD**      
                                       portée par le                 
                                       MCD. Sa                       
                                       sémantique                    
                                       détaillée doit                
                                       respecter la                  
                                       définition de                 
                                       l'objet et les                
                                       RG du domaine.                

  `portee {personnel, collaboratif}`   Propriété       **À DÉCIDER   **À DÉCIDER**
                                       explicitement   AU MLD**      
                                       portée par le                 
                                       MCD. Sa                       
                                       sémantique                    
                                       détaillée doit                
                                       respecter la                  
                                       définition de                 
                                       l'objet et les                
                                       RG du domaine.                
  --------------------------------------------------------------------------------

### Associations connues

  Association   Cardinalités conceptuelles   Propriétés portées
  ------------- ---------------------------- --------------------
  `ETIQUETER`   TAG (0,n) --- OBJET (0,n)    ---

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## INBOX_ITEM

**Définition.** Capture brute : fichier, lien, note, photo, audio,
vidéo, document reçu (§ 24.10, § 48.3).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------------------------------------------
  Propriété source                                                   Définition au   Type       Obligatoire ?
                                                                     stade           logique    
                                                                     dictionnaire               
  ------------------------------------------------------------------ --------------- ---------- -------------
  `type {fichier, lien, note, photo, audio, vidéo, document reçu}`   Propriété       **À        **À DÉCIDER**
                                                                     explicitement   DÉCIDER AU 
                                                                     portée par le   MLD**      
                                                                     MCD. Sa                    
                                                                     sémantique                 
                                                                     détaillée doit             
                                                                     respecter la               
                                                                     définition de              
                                                                     l'objet et les             
                                                                     RG du domaine.             

  `contenu_brut`                                                     Propriété       **À        **À DÉCIDER**
                                                                     explicitement   DÉCIDER AU 
                                                                     portée par le   MLD**      
                                                                     MCD. Sa                    
                                                                     sémantique                 
                                                                     détaillée doit             
                                                                     respecter la               
                                                                     définition de              
                                                                     l'objet et les             
                                                                     RG du domaine.             

  `etat {capturé, qualifié, rattaché, traité, archivé}`              Propriété       **À        **À DÉCIDER**
                                                                     explicitement   DÉCIDER AU 
                                                                     portée par le   MLD**      
                                                                     MCD. Sa                    
                                                                     sémantique                 
                                                                     détaillée doit             
                                                                     respecter la               
                                                                     définition de              
                                                                     l'objet et les             
                                                                     RG du domaine.             

  `date_capture`                                                     Propriété       **À        **À DÉCIDER**
                                                                     explicitement   DÉCIDER AU 
                                                                     portée par le   MLD**      
                                                                     MCD. Sa                    
                                                                     sémantique                 
                                                                     détaillée doit             
                                                                     respecter la               
                                                                     définition de              
                                                                     l'objet et les             
                                                                     RG du domaine.             
  -----------------------------------------------------------------------------------------------------------

### Associations connues

  ----------------------------------------------------------------------------
  Association                        Cardinalités         Propriétés portées
                                     conceptuelles        
  ---------------------------------- -------------------- --------------------
  `CAPTURER / JOINDRE / RATTACHER`   UTILISATEUR (0,n)    ---
                                     --- INBOX_ITEM (1,1) 
                                     ; INBOX_ITEM (0,1)   
                                     --- FICHIER (0,n) ;  
                                     INBOX_ITEM (0,n) --- 
                                     OBJET (0,n)          

  ----------------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## NOTE

**Définition.** Note privée sur un objet.

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------
  Propriété source  Définition au     Type logique      Obligatoire ?
                    stade                               
                    dictionnaire                        
  ----------------- ----------------- ----------------- -----------------
  `texte`           Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  -----------------------------------------------------------------------

### Associations connues

  Association      Cardinalités conceptuelles   Propriétés portées
  ---------------- ---------------------------- --------------------
  `ANNOTER_NOTE`   OBJET (0,n) --- NOTE (0,1)   ---

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## HISTORIQUE_NAVIGATION

**Définition.** Trace personnelle de navigation, purgeable, hors Core (§
90).

**Nature :** Entité/structure conceptuelle non déclarée comme
spécialisation d'`OBJET`.

### Attributs / propriétés explicitement nommés

  ------------------------------------------------------------------------
  Propriété source   Définition au     Type logique      Obligatoire ?
                     stade                               
                     dictionnaire                        
  ------------------ ----------------- ----------------- -----------------
  `#id_navigation`   Propriété         **À DÉCIDER AU    **À DÉCIDER**
                     explicitement     MLD**             
                     portée par le                       
                     MCD. Sa                             
                     sémantique                          
                     détaillée doit                      
                     respecter la                        
                     définition de                       
                     l'objet et les RG                   
                     du domaine.                         

  `date`             Propriété         **À DÉCIDER AU    **À DÉCIDER**
                     explicitement     MLD**             
                     portée par le                       
                     MCD. Sa                             
                     sémantique                          
                     détaillée doit                      
                     respecter la                        
                     définition de                       
                     l'objet et les RG                   
                     du domaine.                         

  `session`          Propriété         **À DÉCIDER AU    **À DÉCIDER**
                     explicitement     MLD**             
                     portée par le                       
                     MCD. Sa                             
                     sémantique                          
                     détaillée doit                      
                     respecter la                        
                     définition de                       
                     l'objet et les RG                   
                     du domaine.                         
  ------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `NAVIGUER`              UTILISATEUR (0,n) ---   ---
                          HISTORIQUE_NAVIGATION   
                          (1,1) ;                 
                          HISTORIQUE_NAVIGATION   
                          (1,1) --- OBJET (0,n)   

  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## VEILLE

**Définition.** Suivre un objet ou surveiller une condition (§ 91).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------------------------------------
  Propriété source                                             Définition au   Type       Obligatoire ?
                                                               stade           logique    
                                                               dictionnaire               
  ------------------------------------------------------------ --------------- ---------- -------------
  `type {suivre, surveiller}`                                  Propriété       **À        **À DÉCIDER**
                                                               explicitement   DÉCIDER AU 
                                                               portée par le   MLD**      
                                                               MCD. Sa                    
                                                               sémantique                 
                                                               détaillée doit             
                                                               respecter la               
                                                               définition de              
                                                               l'objet et les             
                                                               RG du domaine.             

  `condition`                                                  Propriété       **À        **À DÉCIDER**
                                                               explicitement   DÉCIDER AU 
                                                               portée par le   MLD**      
                                                               MCD. Sa                    
                                                               sémantique                 
                                                               détaillée doit             
                                                               respecter la               
                                                               définition de              
                                                               l'objet et les             
                                                               RG du domaine.             

  `mode_notification {immédiat, digest, in-app, silencieux}`   Propriété       **À        **À DÉCIDER**
                                                               explicitement   DÉCIDER AU 
                                                               portée par le   MLD**      
                                                               MCD. Sa                    
                                                               sémantique                 
                                                               détaillée doit             
                                                               respecter la               
                                                               définition de              
                                                               l'objet et les             
                                                               RG du domaine.             

  `active`                                                     Propriété       **À        **À DÉCIDER**
                                                               explicitement   DÉCIDER AU 
                                                               portée par le   MLD**      
                                                               MCD. Sa                    
                                                               sémantique                 
                                                               détaillée doit             
                                                               respecter la               
                                                               définition de              
                                                               l'objet et les             
                                                               RG du domaine.             
  -----------------------------------------------------------------------------------------------------

### Associations connues

  ---------------------------------------------------------------------------
  Association                       Cardinalités         Propriétés portées
                                    conceptuelles        
  --------------------------------- -------------------- --------------------
  `VEILLER / SUIVRE / SURVEILLER`   UTILISATEUR (0,n)    ---
                                    --- VEILLE (1,1) ;   
                                    VEILLE (0,1) ---     
                                    OBJET (0,n) ; VEILLE 
                                    (0,1) --- REQUETE    
                                    (0,n)                

  `DECLENCHER / RECEVOIR`           VEILLE (0,n) ---     ---
                                    NOTIFICATION (0,1) ; 
                                    UTILISATEUR (0,n)    
                                    --- NOTIFICATION     
                                    (1,1) ; NOTIFICATION 
                                    (0,1) --- OBJET      
                                    (0,n)                
  ---------------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## NOTIFICATION

**Définition.** Notification explicable, hiérarchisée, groupable (§ 92).

**Nature :** Entité/structure conceptuelle non déclarée comme
spécialisation d'`OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------
  Propriété source     Définition au    Type logique     Obligatoire ?
                       stade                             
                       dictionnaire                      
  -------------------- ---------------- ---------------- ----------------
  `#id_notification`   Propriété        **À DÉCIDER AU   **À DÉCIDER**
                       explicitement    MLD**            
                       portée par le                     
                       MCD. Sa                           
                       sémantique                        
                       détaillée doit                    
                       respecter la                      
                       définition de                     
                       l'objet et les                    
                       RG du domaine.                    

  `date`               Propriété        **À DÉCIDER AU   **À DÉCIDER**
                       explicitement    MLD**            
                       portée par le                     
                       MCD. Sa                           
                       sémantique                        
                       détaillée doit                    
                       respecter la                      
                       définition de                     
                       l'objet et les                    
                       RG du domaine.                    

  `motif ⟨D-49⟩`       Propriété        **À DÉCIDER AU   **À DÉCIDER**
                       explicitement    MLD**            
                       portée par le                     
                       MCD. Sa                           
                       sémantique                        
                       détaillée doit                    
                       respecter la                      
                       définition de                     
                       l'objet et les                    
                       RG du domaine.                    

  `explication`        Propriété        **À DÉCIDER AU   **À DÉCIDER**
                       explicitement    MLD**            
                       portée par le                     
                       MCD. Sa                           
                       sémantique                        
                       détaillée doit                    
                       respecter la                      
                       définition de                     
                       l'objet et les                    
                       RG du domaine.                    

  `priorite`           Propriété        **À DÉCIDER AU   **À DÉCIDER**
                       explicitement    MLD**            
                       portée par le                     
                       MCD. Sa                           
                       sémantique                        
                       détaillée doit                    
                       respecter la                      
                       définition de                     
                       l'objet et les                    
                       RG du domaine.                    

  `groupe`             Propriété        **À DÉCIDER AU   **À DÉCIDER**
                       explicitement    MLD**            
                       portée par le                     
                       MCD. Sa                           
                       sémantique                        
                       détaillée doit                    
                       respecter la                      
                       définition de                     
                       l'objet et les                    
                       RG du domaine.                    

  `lue`                Propriété        **À DÉCIDER AU   **À DÉCIDER**
                       explicitement    MLD**            
                       portée par le                     
                       MCD. Sa                           
                       sémantique                        
                       détaillée doit                    
                       respecter la                      
                       définition de                     
                       l'objet et les                    
                       RG du domaine.                    
  -----------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association               Cardinalités           Propriétés portées
                            conceptuelles          
  ------------------------- ---------------------- ----------------------
  `DECLENCHER / RECEVOIR`   VEILLE (0,n) ---       ---
                            NOTIFICATION (0,1) ;   
                            UTILISATEUR (0,n) ---  
                            NOTIFICATION (1,1) ;   
                            NOTIFICATION (0,1) --- 
                            OBJET (0,n)            

  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## Associations --- domaine Q

  -------------------------------------------------------------------------------
  Association                        Cardinalités du MCD     Propriétés portées
  ---------------------------------- ----------------------- --------------------
  `OUVRIR`                           UTILISATEUR (0,n) ---   ---
                                     WORKSPACE (1,1)         

  `EPINGLER`                         WORKSPACE (0,n) ---     x, y, groupe, note
                                     OBJET (0,n)             

  `TRACER`                           WORKSPACE (0,n) ---     ---
                                     LIEN_EXPLORATOIRE (1,1) 

  `DEVENIR`                          WORKSPACE (0,1) ---     ---
                                     OBJET (PROJET,          
                                     SNAPSHOT, ESPACE) (0,1) 

  `RANGER`                           COLLECTION (0,n) ---    rang
                                     OBJET (0,n)             

  `ETIQUETER`                        TAG (0,n) --- OBJET     ---
                                     (0,n)                   

  `CAPTURER / JOINDRE / RATTACHER`   UTILISATEUR (0,n) ---   ---
                                     INBOX_ITEM (1,1) ;      
                                     INBOX_ITEM (0,1) ---    
                                     FICHIER (0,n) ;         
                                     INBOX_ITEM (0,n) ---    
                                     OBJET (0,n)             

  `ANNOTER_NOTE`                     OBJET (0,n) --- NOTE    ---
                                     (0,1)                   

  `NAVIGUER`                         UTILISATEUR (0,n) ---   ---
                                     HISTORIQUE_NAVIGATION   
                                     (1,1) ;                 
                                     HISTORIQUE_NAVIGATION   
                                     (1,1) --- OBJET (0,n)   

  `VEILLER / SUIVRE / SURVEILLER`    UTILISATEUR (0,n) ---   ---
                                     VEILLE (1,1) ; VEILLE   
                                     (0,1) --- OBJET (0,n) ; 
                                     VEILLE (0,1) ---        
                                     REQUETE (0,n)           

  `DECLENCHER / RECEVOIR`            VEILLE (0,n) ---        ---
                                     NOTIFICATION (0,1) ;    
                                     UTILISATEUR (0,n) ---   
                                     NOTIFICATION (1,1) ;    
                                     NOTIFICATION (0,1) ---  
                                     OBJET (0,n)             
  -------------------------------------------------------------------------------

## Règles de gestion --- domaine Q

# Domaine R --- Référentiels et concepts

**Couverture : 4 entités/objets, 5 associations, 0 règles RG.**

## REFERENTIEL

**Définition.** Vocabulaire versionné de niveau personnel / projet,
communautaire ou commun GENIIUS (§ 31.3).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------------------------------------
  Propriété source                                             Définition au   Type       Obligatoire ?
                                                               stade           logique    
                                                               dictionnaire               
  ------------------------------------------------------------ --------------- ---------- -------------
  `nom`                                                        Propriété       **À        **À DÉCIDER**
                                                               explicitement   DÉCIDER AU 
                                                               portée par le   MLD**      
                                                               MCD. Sa                    
                                                               sémantique                 
                                                               détaillée doit             
                                                               respecter la               
                                                               définition de              
                                                               l'objet et les             
                                                               RG du domaine.             

  `niveau {personnel/projet, communautaire, commun GENIIUS}`   Propriété       **À        **À DÉCIDER**
                                                               explicitement   DÉCIDER AU 
                                                               portée par le   MLD**      
                                                               MCD. Sa                    
                                                               sémantique                 
                                                               détaillée doit             
                                                               respecter la               
                                                               définition de              
                                                               l'objet et les             
                                                               RG du domaine.             

  `description`                                                Propriété       **À        **À DÉCIDER**
                                                               explicitement   DÉCIDER AU 
                                                               portée par le   MLD**      
                                                               MCD. Sa                    
                                                               sémantique                 
                                                               détaillée doit             
                                                               respecter la               
                                                               définition de              
                                                               l'objet et les             
                                                               RG du domaine.             
  -----------------------------------------------------------------------------------------------------

### Associations connues

  Association          Cardinalités conceptuelles            Propriétés portées
  -------------------- ------------------------------------- --------------------
  `PORTER`             ESPACE (0,n) --- REFERENTIEL (1,1)    ---
  `CONTENIR_CONCEPT`   REFERENTIEL (0,n) --- CONCEPT (1,1)   ---

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## CONCEPT

**Définition.** Concept normalisé : prédicat, rôle, type d'entité, type
documentaire, profession, statut juridique historique, nature
d'événement...

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  ----------------------------------------------------------------------------------------------------------------------------------------------------
  Propriété source                                                                                             Définition au   Type      Obligatoire ?
                                                                                                               stade           logique   
                                                                                                               dictionnaire              
  ------------------------------------------------------------------------------------------------------------ --------------- --------- -------------
  `libelle`                                                                                                    Propriété       **À       **À DÉCIDER**
                                                                                                               explicitement   DÉCIDER   
                                                                                                               portée par le   AU MLD**  
                                                                                                               MCD. Sa                   
                                                                                                               sémantique                
                                                                                                               détaillée doit            
                                                                                                               respecter la              
                                                                                                               définition de             
                                                                                                               l'objet et les            
                                                                                                               RG du domaine.            

  `definition`                                                                                                 Propriété       **À       **À DÉCIDER**
                                                                                                               explicitement   DÉCIDER   
                                                                                                               portée par le   AU MLD**  
                                                                                                               MCD. Sa                   
                                                                                                               sémantique                
                                                                                                               détaillée doit            
                                                                                                               respecter la              
                                                                                                               définition de             
                                                                                                               l'objet et les            
                                                                                                               RG du domaine.            

  `nature {prédicat, rôle, type d’entité, type documentaire, profession, statut, nature d’événement, autre}`   Propriété       **À       **À DÉCIDER**
                                                                                                               explicitement   DÉCIDER   
                                                                                                               portée par le   AU MLD**  
                                                                                                               MCD. Sa                   
                                                                                                               sémantique                
                                                                                                               détaillée doit            
                                                                                                               respecter la              
                                                                                                               définition de             
                                                                                                               l'objet et les            
                                                                                                               RG du domaine.            

  `statut_promotion {local, proposé au commun, promu, refusé}`                                                 Propriété       **À       **À DÉCIDER**
                                                                                                               explicitement   DÉCIDER   
                                                                                                               portée par le   AU MLD**  
                                                                                                               MCD. Sa                   
                                                                                                               sémantique                
                                                                                                               détaillée doit            
                                                                                                               respecter la              
                                                                                                               définition de             
                                                                                                               l'objet et les            
                                                                                                               RG du domaine.            
  ----------------------------------------------------------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association               Cardinalités           Propriétés portées
                            conceptuelles          
  ------------------------- ---------------------- ----------------------
  `CONTENIR_CONCEPT`        REFERENTIEL (0,n) ---  ---
                            CONCEPT (1,1)          

  `PLUS_LARGE`              CONCEPT parent (0,n)   ---
                            --- CONCEPT (0,1)      

  `CONCEPT_A / CONCEPT_B`   CONCEPT (0,n) ---      ---
                            CORRESPONDANCE (1,1)   
                            ×2                     

  `USAGE`                   TERME_HISTORIQUE (0,n) periode (DATE_HIST),
                            --- CONCEPT (0,n)      territoire (→ LIEU),
                                                   corpus (→ CORPUS),
                                                   sens
  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## TERME_HISTORIQUE

**Définition.** Mot tel qu'employé dans les sources, dont le sens varie
selon la période, le territoire et le corpus (§ 31.2).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------
  Propriété source  Définition au     Type logique      Obligatoire ?
                    stade                               
                    dictionnaire                        
  ----------------- ----------------- ----------------- -----------------
  `forme`           Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `langue`          Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         

  `ecriture`        Propriété         **À DÉCIDER AU    **À DÉCIDER**
                    explicitement     MLD**             
                    portée par le                       
                    MCD. Sa                             
                    sémantique                          
                    détaillée doit                      
                    respecter la                        
                    définition de                       
                    l'objet et les RG                   
                    du domaine.                         
  -----------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association             Cardinalités            Propriétés portées
                          conceptuelles           
  ----------------------- ----------------------- -----------------------
  `USAGE`                 TERME_HISTORIQUE (0,n)  periode (DATE_HIST),
                          --- CONCEPT (0,n)       territoire (→ LIEU),
                                                  corpus (→ CORPUS), sens

  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## CORRESPONDANCE

**Définition.** Correspondance entre concepts de cadres différents, sans
imposer l'uniformité (§ 31.4).

**Nature :** Spécialisation du super-type `OBJET`.

### Attributs / propriétés explicitement nommés

  -----------------------------------------------------------------------------------------------------------------------------------
  Propriété source                                                                            Définition au   Type      Obligatoire ?
                                                                                              stade           logique   
                                                                                              dictionnaire              
  ------------------------------------------------------------------------------------------- --------------- --------- -------------
  `type {équivalent, plus large, plus spécifique, proche, incompatible, contesté, inconnu}`   Propriété       **À       **À DÉCIDER**
                                                                                              explicitement   DÉCIDER   
                                                                                              portée par le   AU MLD**  
                                                                                              MCD. Sa                   
                                                                                              sémantique                
                                                                                              détaillée doit            
                                                                                              respecter la              
                                                                                              définition de             
                                                                                              l'objet et les            
                                                                                              RG du domaine.            

  -----------------------------------------------------------------------------------------------------------------------------------

### Associations connues

  -----------------------------------------------------------------------
  Association               Cardinalités           Propriétés portées
                            conceptuelles          
  ------------------------- ---------------------- ----------------------
  `CONCEPT_A / CONCEPT_B`   CONCEPT (0,n) ---      ---
                            CORRESPONDANCE (1,1)   
                            ×2                     

  -----------------------------------------------------------------------

### Contraintes de dictionnaire

-   Identifiant conceptuel stable ; format physique **À DÉCIDER AU
    MLD**.
-   Temporalité/versionnement : appliquer les mécanismes du socle
    lorsqu'ils concernent cet objet.
-   Provenance : ne jamais confondre provenance d'acquisition,
    provenance historique et activité de production.
-   Droits : l'objet, ses relations ou son existence peuvent être
    gouvernés selon le contexte.
-   Suppression/rétention : **À DÉCIDER AU MLD**, sous réserve des
    citations, versions, obligations légales et dépendances.

## Associations --- domaine R

  -----------------------------------------------------------------------
  Association               Cardinalités du MCD    Propriétés portées
  ------------------------- ---------------------- ----------------------
  `PORTER`                  ESPACE (0,n) ---       ---
                            REFERENTIEL (1,1)      

  `CONTENIR_CONCEPT`        REFERENTIEL (0,n) ---  ---
                            CONCEPT (1,1)          

  `PLUS_LARGE`              CONCEPT parent (0,n)   ---
                            --- CONCEPT (0,1)      

  `CONCEPT_A / CONCEPT_B`   CONCEPT (0,n) ---      ---
                            CORRESPONDANCE (1,1)   
                            ×2                     

  `USAGE`                   TERME_HISTORIQUE (0,n) periode (DATE_HIST),
                            --- CONCEPT (0,n)      territoire (→ LIEU),
                                                   corpus (→ CORPUS),
                                                   sens
  -----------------------------------------------------------------------

## Règles de gestion --- domaine R

# Types composés

## DATE_HIST

  -------------------------------------------------------------------------
  Composant                Définition du    Type logique    Nullabilité
                           MCD                              
  ------------------------ ---------------- --------------- ---------------
  `expression_originale`   Texte tel que    **À DÉCIDER AU  **À DÉCIDER**
                           saisi ou lu («   MLD**           
                           vers 1840 », «                   
                           le 3 brumaire an                 
                           II »)                            

  `type_date`              {exacte,         **À DÉCIDER AU  **À DÉCIDER**
                           approximative,   MLD**           
                           intervalle,                      
                           avant, après,                    
                           vers, calculée,                  
                           déduite,                         
                           estimée,                         
                           inconnue}                        

  `calendrier`             {grégorien,      **À DÉCIDER AU  **À DÉCIDER**
                           julien,          MLD**           
                           républicain,                     
                           autre}                           

  `borne_min, borne_max`   Bornes           **À DÉCIDER AU  **À DÉCIDER**
                           normalisées      MLD**           
                           (peuvent être                    
                           vides)                           

  `precision`              {jour, mois,     **À DÉCIDER AU  **À DÉCIDER**
                           année, décennie, MLD**           
                           siècle}                          
  -------------------------------------------------------------------------

## VALEUR

  ------------------------------------------------------------------------
  Composant             Définition du    Type logique     Nullabilité
                        MCD                               
  --------------------- ---------------- ---------------- ----------------
  `valeur_originale`    Telle que dans   **À DÉCIDER AU   **À DÉCIDER**
                        la source (« 30  MLD**            
                        ans », « 1 200                    
                        livres »)                         

  `valeur_normalisee`   Optionnelle      **À DÉCIDER AU   **À DÉCIDER**
                                         MLD**            

  `unite_originale`     Unité d'origine  **À DÉCIDER AU   **À DÉCIDER**
                                         MLD**            

  `monnaie_originale`   Monnaie          **À DÉCIDER AU   **À DÉCIDER**
                        d'origine        MLD**            

  `type_valeur`         {nombre, âge     **À DÉCIDER AU   **À DÉCIDER**
                        déclaré,         MLD**            
                        montant, mesure,                  
                        effectif, texte}                  
  ------------------------------------------------------------------------

## GEOM

  -----------------------------------------------------------------------
  Composant         Définition du MCD Type logique      Nullabilité
  ----------------- ----------------- ----------------- -----------------
  `systeme`         Système de        **À DÉCIDER AU    **À DÉCIDER**
                    coordonnées       MLD**             
                    (géographique) ou                   
                    repère image                        

  `forme`           {point, ligne,    **À DÉCIDER AU    **À DÉCIDER**
                    polygone,         MLD**             
                    multipolygone,                      
                    zone floue}                         

  `coordonnees`     Coordonnées       **À DÉCIDER AU    **À DÉCIDER**
                                      MLD**             
  -----------------------------------------------------------------------

# Domaines de valeurs

Ces domaines sont les listes initiales du MCD. Les vocabulaires
décrivant le monde historique ont vocation à être portés par des
`REFERENTIEL`; les cycles techniques/de gouvernance peuvent rester
fermés.

  ----------------------------------------------------------------------------------
  Code               Domaine                      Valeurs initiales
  ------------------ ---------------------------- ----------------------------------
  D-01               `etat_cycle_vie`             actif, archivé, corbeille,
                                                  suppression demandée, supprimé,
                                                  conservation légitime

  D-02               `etat_examen`                détecté automatiquement,
                                                  préstructuré automatiquement,
                                                  examiné, corrigé, validé
                                                  humainement

  D-03               `statut_validation`          proposée, en vérification,
                                                  validée, contestée, réexamen,
                                                  confirmée, corrigée, indéterminée,
                                                  rejetée

  D-04               `visibilite`                 privé, projet, famille, cercle
                                                  invité, communauté GENIIUS, public
                                                  non indexé, public indexable

  D-05               `decouvrabilite`             non découvrable, recherche
                                                  interne, indexable Web

  D-06               `type_activite`              création, saisie, transcription,
                                                  annotation, extraction de mention,
                                                  identification, rapprochement,
                                                  assertion, calcul, validation,
                                                  contestation, correction, import,
                                                  export, contribution, publication,
                                                  restauration, OCR/HTR, détection
                                                  visuelle, transformation d'image,
                                                  suppression

  D-07               `type_dependance`            appui probatoire,
                                                  dérivation/calcul, localisation,
                                                  citation, reconstruction,
                                                  publication d'un état, droits

  D-08               `role_probatoire`            principal, complémentaire, marge,
                                                  verso, page suivante, contexte,
                                                  contradictoire

  D-09               `type_espace`                personnel, privé, familial,
                                                  projet, organisation, communauté,
                                                  Core partagé, publication publique

  D-10               `action (permission)`        voir, commenter, proposer,
                                                  transcrire, valider, éditer,
                                                  administrer, exporter, repartager,
                                                  contribuer au Core

  D-11               `role (garde)`               dépositaire/custodien,
                                                  administrateur, destinataire,
                                                  successeur de gouvernance,
                                                  successeur scientifique,
                                                  dépositaire patrimonial

  D-12               `nature (document)`          acte manuscrit, registre, imprimé,
                                                  photographie, enregistrement
                                                  sonore, vidéo, témoignage,
                                                  carte/plan, objet inscrit, page
                                                  web, autre

  D-13               `statut_existence`           prescrit seulement, existence
                                                  attestée, conservé et localisé,
                                                  non localisé, perdu, disparu,
                                                  détruit, présumé détruit,
                                                  inaccessible, lacunaire

  D-14               `etat_provenance`            sourcée, source connue non
                                                  localisée, provenance perdue à
                                                  l'import, tradition orale,
                                                  provenance à retrouver, non
                                                  sourcée

  D-15               `etat_acces`                 accessible, partiel, inaccessible,
                                                  disparu, inconnu

  D-16               `type (reproduction)`        photographie, scan, microfilm,
                                                  numérisation institutionnelle,
                                                  photocopie, enregistrement, crop,
                                                  restauration, colorisation,
                                                  débruitage, generative fill,
                                                  amélioration, transcodage

  D-17               `role (responsabilité)`      rédacteur, auteur intellectuel,
                                                  signataire, informateur,
                                                  déclarant, autorité émettrice,
                                                  destinataire, collecteur,
                                                  déposant, ancien détenteur,
                                                  conservateur actuel, numériseur,
                                                  diffuseur

  D-18               `type_ordre`                 actuel observé, historique
                                                  attesté, historique reconstruit

  D-19               `plausibilité / certitude`   forte, probable, possible, faible,
                                                  écartée provisoirement, rejetée,
                                                  indéterminée

  D-20               `couche (transcription)`     diplomatique,
                                                  semi-diplomatique/lecture,
                                                  normalisée, développée
                                                  (expansions), translittération,
                                                  traduction

  D-21               `type (annotation)`          signature, tampon, rature,
                                                  changement d'encre, changement de
                                                  main, dommage, marginalia,
                                                  inscription, note de contexte,
                                                  avertissement, appareil critique

  D-22               `nature (mention)`           nominale, descriptive,
                                                  relationnelle, numérique,
                                                  visuelle, vocale, signature, main
                                                  d'écriture

  D-23               `statut_resolution`          non traitée, en attente,
                                                  identifiée, candidats multiples,
                                                  non individualisable, structure
                                                  non résolue

  D-24               `couche_spatiale`            géographie physique, territoire
                                                  historique, parcelle/propriété,
                                                  division
                                                  administrative/institutionnelle,
                                                  occupation/usage du sol,
                                                  bâti/logement, voie

  D-25               `mode_realite`               intention, demande, projet,
                                                  décision, autorisation, refus,
                                                  abandon, commencement,
                                                  réalisation, interruption

  D-26               `famille_relation`           parenté, alliance, sociale,
                                                  économique, juridique,
                                                  organisationnelle, spatiale,
                                                  causale, autre

  D-27               `modele_parente`             biologique, légal, social,
                                                  déclaré, nourricier, élevé par,
                                                  autre système

  D-28               `referentiel_spatial`        administratif, religieux,
                                                  judiciaire, cadastral, électoral,
                                                  militaire, postal, physique

  D-29               `type_droit`                 propriété, usufruit, indivision,
                                                  hypothèque, bail, concession,
                                                  servitude

  D-30               `modalite (assertion)`       affirmée par la source, déclarée
                                                  par un tiers dans la source,
                                                  proposée par un chercheur,
                                                  proposée automatiquement, issue
                                                  d'une mémoire

  D-31               `type_vide`                  non recherché, recherche
                                                  partielle, recherche exhaustive
                                                  sans résultat, non mentionné,
                                                  explicitement absent, illisible,
                                                  lacune matérielle, inconnu, non
                                                  applicable, question non posée

  D-32               `niveau (transmission)`      existence de l'information,
                                                  accessibilité, exposition
                                                  possible, réception attestée,
                                                  connaissance attestée,
                                                  adhésion/croyance

  D-33               `type (évaluation)`          proposition, mise en vérification,
                                                  validation, contestation, demande
                                                  de réexamen, confirmation,
                                                  correction, indétermination, rejet

  D-34               `role_credit`                auteur, coauteur, contributeur
                                                  intellectuel, transcripteur,
                                                  identificateur, vérificateur,
                                                  photographe, logisticien,
                                                  relecteur, proposant, remercié

  D-35               `type (anomalie)`            numéro manquant, pages absentes,
                                                  années absentes, rupture de série,
                                                  volume incomplet, document attendu
                                                  absent, copie divergente

  D-36               `etat_memoire`               su et dit, jamais su, savait mais
                                                  a oublié, souvenir partiel,
                                                  incertain, refuse, à vérifier, non
                                                  demandé, exclu volontairement

  D-37               `mode_connaissance`          vécu, vu directement, entendu d'un
                                                  témoin, tradition familiale,
                                                  déduction, souvenir incertain,
                                                  inconnu

  D-38               `etat_cycle (projet)`        actif, en sommeil, bloqué, clôturé
                                                  dans son périmètre, transmis,
                                                  abandonné, archivé

  D-39               `etat (question)`            ouverte, en cours, suffisamment
                                                  traitée selon protocole, résolue,
                                                  à réexaminer, suspendue,
                                                  abandonnée

  D-40               `recherchabilite`            pistes disponibles, pistes
                                                  potentielles, bloquée
                                                  actuellement, aucune piste connue,
                                                  insolubilité fortement documentée

  D-41               `niveau_consultation`        repéré au catalogue, commandé,
                                                  communiqué, consultation
                                                  partielle, consultation
                                                  exhaustive, reproduction,
                                                  exploitation

  D-42               `statut (item de mission)`   à commander, commandé, communiqué,
                                                  consulté, refusé, absent,
                                                  photographié, incomplet, à refaire

  D-43               `portee (règle)`             occurrence, préférence
                                                  personnelle, main/scribe,
                                                  registre, corpus, territoire,
                                                  période

  D-44               `portee_nouveaute`           nouveau pour l'utilisateur,
                                                  nouveau pour le projet, nouveau
                                                  dans GENIIUS, nouvelle preuve d'un
                                                  fait connu, évolution réelle

  D-45               `type (flux)`                contribution privé→Core, import
                                                  Core→privé, comparaison Tree↔Tree,
                                                  échange Tree↔Tree, restauration

  D-46               `type_localisation`          exacte, approximative, relative,
                                                  zone possible, hypothèse
                                                  concurrente

  D-47               `type (méthode)`             dérivation de date, conversion
                                                  monétaire, conversion de mesure,
                                                  statistique, reconstruction
                                                  spatiale, proposition de
                                                  candidats, cooccurrence,
                                                  entourage, comparaison de
                                                  trajectoires, datation croisée,
                                                  OCR/HTR, détection visuelle,
                                                  regroupement vocal, autre

  D-48               `format (export)`            format patrimonial GENIIUS,
                                                  GEDCOM, CSV, JSON, GeoJSON,
                                                  bibliographique, médias originaux,
                                                  package de reproductibilité

  D-49               `motif (notification)`       nouvelle source liée,
                                                  identification contestée,
                                                  dépendance modifiée, divergence de
                                                  filiation, source devenue
                                                  accessible, preuve devenue
                                                  inaccessible, élément pertinent
                                                  pour une question, demande reçue,
                                                  capsule délivrable
  ----------------------------------------------------------------------------------

# Registre des décisions MLD à ouvrir

  -------------------------------------------------------------------------------
  Sujet               Décision attendue                    Interdit par le MCD
  ------------------- ------------------------------------ ----------------------
  Identifiants        UUID/ULID, namespace, URI            Réutiliser un ID après
                      persistante, collision/redirection   scission/suppression

  Héritage OBJET      Tables, composition ou autre         Table universelle
                      stratégie logique                    opaque
                                                           `object(type,json)`
                                                           comme unique modèle
                                                           métier

  Versionnement       Immutabilité, snapshots/deltas,      Simple `updated_at`
                      tombstones                           détruisant l'état
                                                           antérieur

  Assertions          Représentation des                   Réintroduire
                      sujets/prédicats/valeurs/relations   `person.birth_date`
                                                           comme vérité

  Droits              RLS/ACL/policies et calcul du graphe Filtrer seulement
                      accessible                           après calcul/traversée

  Dépendances         Matérialisation, détection de        Confondre production
                      cycles, propagation                  et justification

  Imports             Fingerprints, external IDs,          UPSERT d'un import en
                      matching, réconciliation             « faits vrais »

  Temps               Traduction de DATE_HIST et temps     Transformer une
                      épistémique                          approximation en date
                                                           exacte

  Spatial             PostGIS ou autre représentation de   Une seule géométrie
                      GEOM                                 officielle par lieu

  Suppression         Rétention, tombstone, anonymisation, CASCADE destructif des
                      obligations                          preuves/provenances

  Agrégats            Calcul contextuel et risque          Compter les objets
                      d'inférence                          secrets puis masquer
                                                           le détail

  Export              Manifeste, dépendances, restauration Révéler des
                                                           dépendances non
                                                           accessibles
  -------------------------------------------------------------------------------

# Tests de recette du dictionnaire

Le dictionnaire sera considéré comme prêt pour le MLD lorsque :

1.  100 % des entités/associations du MCD sont couvertes ou
    explicitement déclarées abstraites.
2.  Chaque attribut possède une définition non ambiguë, un type logique
    candidat et une règle de nullabilité.
3.  Chaque RG est traduite en contrainte, contrôle, workflow ou règle de
    service identifiable.
4.  Les états d'absence sont explicités là où un simple NULL serait
    ambigu.
5.  Les 95 tests du MCD peuvent être reformulés en tests du dictionnaire
    sans perte de sens.
6.  Aucun choix de commodité SQL ne réintroduit une vérité unique, une
    fusion irréversible ou une fuite de droits.

# Statut

Cette V1.0 constitue le **premier dictionnaire exhaustif dérivé
automatiquement et conservativement du MCD V1.1**. Elle est
volontairement stricte : lorsqu'une précision n'est pas supportée par le
MCD, elle reste à décider plutôt que d'être inventée.

La prochaine passe doit être une **revue attributaire** : préciser,
objet par objet, les types logiques candidats, nullabilités, contraintes
d'unicité, états d'absence et règles de validation. Cette passe produira
le dictionnaire prêt pour le MLD.
