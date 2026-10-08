# WoodPilot — CODEX.md

## 1. Rôle de ce document

Ce fichier est la source de vérité produit, UX et design pour l'application mobile **WoodPilot**.

Avant toute modification importante de l'interface, de l'architecture UX ou du comportement d'un outil, lire ce document.

En cas d'ambiguïté :
1. préserver la simplicité ;
2. privilégier l'usage smartphone sur chantier/atelier ;
3. réutiliser les composants existants ;
4. ne pas inventer de fonctionnalités métier non demandées ;
5. demander validation avant un changement structurel important.

---

# 2. Vision produit

WoodPilot est une **boîte à outils numérique de poche pour menuisiers, agenceurs et professionnels du bois**.

L'application doit permettre d'effectuer très rapidement des opérations techniques courantes :

- métrés ;
- calculs ;
- géométrie ;
- calpinage ;
- listes de débit ;
- conception simple ;
- préparation de fabrication ;
- préparation de pose ;
- partage de résultats.

WoodPilot doit donner l'impression d'utiliser un **instrument professionnel**, et non un logiciel de gestion classique.

Mots-clés :

> rapide · précis · mobile · technique · tactile · sobre · professionnel

---

# 3. Principe fondamental

## Smartphone first

L'application est conçue d'abord pour un smartphone utilisé :

- sur chantier ;
- dans un atelier ;
- debout ;
- parfois d'une seule main ;
- avec les doigts poussiéreux ;
- avec peu de temps disponible.

Une fonctionnalité desktop ne doit jamais dégrader l'expérience smartphone.

Portrait = mode par défaut.

Le paysage peut être utilisé lorsqu'il apporte une vraie valeur, notamment pour :

- calpinage ;
- listes de débit ;
- plans ;
- grandes photos cotées ;
- visualisations techniques.

---

# 4. Ce que WoodPilot n'est pas

Ne pas transformer cette application en ERP complexe.

La partie mobile décrite ici n'a pas vocation à devenir immédiatement :

- CRM ;
- logiciel comptable ;
- facturation complète ;
- gestion RH ;
- planning d'entreprise complexe ;
- logiciel de gestion commerciale lourd.

Les projets présents dans l'application sont avant tout des **dossiers techniques légers** permettant de regrouper métrés, calculs et résultats.

Un outil doit toujours pouvoir être utilisé **sans créer de projet**.

Exemple :

> ouvrir WoodPilot → calculer un rayon → lire/copier/partager le résultat → fermer WoodPilot.

Aucun projet obligatoire.

---

# 5. Identité

Le nom du produit est :

# WoodPilot

Ne jamais utiliser « WoodTool ».

---

# 6. Direction graphique

L'interface doit être :

- moderne ;
- sobre ;
- épurée ;
- technique ;
- très lisible ;
- professionnelle.

Référence conceptuelle :

> instrument de mesure professionnel + plan technique + outil électroportatif moderne.

## À éviter absolument

- images décoratives en background ;
- textures bois décoratives ;
- gradients ;
- glassmorphism ;
- effets glow ;
- ombres lourdes ;
- skeuomorphisme ;
- surcharge graphique ;
- multiplication des couleurs ;
- effets « SaaS dashboard » inutiles.

La menuiserie doit être exprimée par les **fonctions et dessins techniques**, pas par une imitation graphique du bois.

---

# 7. Couleurs

Toutes les couleurs doivent être pilotées par des **design tokens CSS**.

Aucune couleur métier importante ne doit être écrite directement dans un composant.

Base actuelle :

```css
:root {
  --color-primary: #f47721;
  --color-on-primary: #ffffff;
  --color-secondary: #7b8386;

  --color-background: #0d0f10;
  --color-surface: #151819;
  --color-surface-raised: #1c2022;

  --color-border: #2a2f31;
  --color-border-strong: #3b4245;

  --color-text: #f5f5f4;
  --color-text-secondary: #a7acae;
  --color-text-muted: #717779;

  --color-success: #38a169;
  --color-warning: #d69e2e;
  --color-danger: #e05252;

  --color-measurement: var(--color-primary);
  --color-construction-line: #62696c;
}
```

Le changement de `--color-primary` doit pouvoir recolorer l'ensemble des actions principales et éléments techniques concernés.

Prévoir Dark Mode et Light Mode avec les mêmes tokens sémantiques.

---

# 8. Autres design tokens

Centraliser également :

```css
:root {
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;

  --touch-min: 48px;

  --line-normal: 1px;
  --line-technical: 1.5px;

  --motion-fast: 140ms;
  --motion-normal: 220ms;
}
```

Le design system doit pouvoir évoluer sans réécrire les composants.

---

# 9. Icônes

Utiliser **Google Material Symbols**.

Direction retenue :

**Material Symbols Rounded**

Utilisation principale :

- outline ;
- `FILL 0` par défaut ;
- possibilité de passer en rempli pour certains états sélectionnés ;
- poids visuel cohérent dans toute l'application.

Ne pas utiliser d'emojis comme icônes d'interface.

Exemples possibles :

- `photo_camera` → Photo Métré ;
- `architecture` → géométrie / arêtiers ;
- `grid_view` → calpinage ;
- `straighten` → mesure ;
- `calculate` → calculatrice ;
- `folder` → projets ;
- `share` → partage ;
- `settings` → réglages ;
- `add` / `remove` ;
- `undo` ;
- `more_vert`.

Si un symbole plus pertinent existe dans Material Symbols, le préférer.

---

# 10. Typographie

Une seule famille sans-serif principale.

Interface actuelle : Inter.

Privilégier :

- forte lisibilité ;
- hiérarchie courte ;
- valeurs numériques importantes très visibles.

Exemple :

```text
RAYON
726,7 mm
```

Les valeurs techniques principales doivent être plus visibles que les labels.

Utiliser des **tabular numbers** lorsque des nombres évoluent dynamiquement.

---

# 11. Navigation principale

La navigation mobile principale comporte trois entrées :

1. **Projets**
2. **Roue**
3. **Outils**

La Roue est le cœur de l'expérience.

La bibliothèque complète des outils reste accessible séparément.

---

# 12. La roue WoodPilot

La page d'accueil principale est une roue d'outils favoris.

Objectif :

> accéder à un outil courant en environ deux secondes.

La roue n'est PAS la bibliothèque complète.

Elle contient les outils favoris de l'utilisateur.

## Interactions

- swipe horizontal ;
- rotation d'un cran ;
- légère inertie ;
- snap sur l'outil ;
- retour haptique discret ;
- tap direct sur une icône ;
- l'outil sélectionné est visuellement mis en avant ;
- son nom et sa description apparaissent ;
- tap au centre ou sur l'action principale pour l'ouvrir.

Le swipe ne doit jamais être la seule méthode d'interaction.

À terme :

- appui long pour réorganiser ;
- ajout/suppression depuis la bibliothèque ;
- personnalisation des favoris.

---

# 13. Bibliothèque d'outils

La bibliothèque doit rester classique et très efficace :

- recherche ;
- catégories ;
- liste ou grille simple ;
- accès direct ;
- possibilité d'ajouter un outil à la roue.

Catégories envisagées :

- MÉTRER
- CALCULER
- CONCEVOIR
- FABRIQUER
- POSER

L'application pourra à terme contenir plusieurs dizaines d'outils sans charger la roue.

---

# 14. Projets

Un projet WoodPilot est un **dossier technique léger**.

Exemple :

## Cuisine Dupont

Il peut contenir :

- photos métrées ;
- dimensions ;
- calculs ;
- caissons ;
- liste de débit ;
- calpinage ;
- notes techniques ;
- exports.

Workflow possible :

```text
Photo Métré
    ↓
Caisson
    ↓
Liste de débit
    ↓
Calpinage
```

Les données doivent pouvoir circuler entre outils lorsque cela apporte un gain réel.

Mais aucun outil ne doit dépendre obligatoirement d'un projet.

---

# 15. Principe UX des calculateurs

Principe central :

# Le dessin est le formulaire.

Éviter autant que possible les formulaires classiques du type :

```text
Largeur : [      ]
Hauteur : [      ]
Épaisseur : [    ]
```

Préférer un schéma technique interactif.

Exemple :

```text
        ←──── 800 ────→

          ╭────────╮
       120│        │
          ╰────────╯
```

L'utilisateur touche directement `800` ou `120` pour modifier la valeur.

Le dessin doit expliquer le calcul.

---

# 16. MeasurementInput

Créer/réutiliser un composant universel de saisie de cote.

Exemple :

```text
←──────── 1842 ────────→
```

Tap sur la cote → édition.

Ce composant doit pouvoir être utilisé dans :

- Photo Métré ;
- Caisson ;
- Cintrage ;
- Arêtiers ;
- Escalier ;
- Répartition ;
- Calpinage ;
- autres outils futurs.

---

# 17. Saisie numérique

Ne pas dépendre uniquement du clavier standard du smartphone.

Prévoir un pavé numérique adapté à la menuiserie.

Fonctions envisagées :

- chiffres 0–9 ;
- virgule décimale ;
- signe ± ;
- suppression ;
- validation ;
- `-1 mm` ;
- `+1 mm` ;
- éventuellement `-5 / +5`.

À terme, accepter des expressions :

```text
1842 - 2*19
```

Résultat :

```text
1804 mm
```

---

# 18. WheelPicker

Utiliser des sélecteurs verticaux inspirés des sélecteurs iPhone pour les valeurs discrètes.

Exemple :

```text
        ÉPAISSEUR

           15
           16
           18
       ──  19  ──
           22
           25
           30

            mm
```

Comportement :

- swipe vertical ;
- inertie ;
- snap ;
- retour haptique au changement de valeur ;
- tap sur valeur pour saisie directe si pertinent ;
- boutons +/- possibles pour ajustement précis.

Valeurs courantes de panneaux, exemple :

```text
8 · 10 · 12 · 15 · 16 · 18 · 19 · 22 · 25 · 30 · 38 mm
```

Toujours permettre une valeur personnalisée lorsque nécessaire.

---

# 19. Bottom sheets

Sur smartphone, préférer un bottom sheet à une nouvelle page lorsque l'utilisateur doit modifier rapidement un élément tout en conservant son contexte.

Exemples :

- modifier une cote ;
- supprimer une mesure ;
- ajouter une note ;
- sélectionner une épaisseur ;
- choisir un format d'export.

---

# 20. Haptique

Utiliser le retour haptique avec parcimonie.

Cas utiles :

- changement de cran de la roue ;
- WheelPicker ;
- sélection d'une ligne détectée ;
- validation d'une cote ;
- calcul terminé ;
- erreur ;
- déclenchement photo.

L'haptique doit renforcer la sensation d'outil physique, jamais devenir décoratif ou envahissant.

---

# 21. Boutons physiques

Exploiter intelligemment le matériel du smartphone lorsque possible.

Cas important :

## Photo Métré

Les boutons de volume doivent pouvoir servir de **déclencheur photo**, lorsque la plateforme et l'architecture native le permettent.

Ne pas sacrifier la compatibilité ou l'accessibilité pour cette fonction.

---

# 22. Partage

Le partage est une fonction transversale majeure.

Utiliser la **Share Sheet native iOS/Android** lorsque la plateforme le permet.

L'utilisateur doit pouvoir envoyer rapidement un résultat via les applications installées :

- Messages ;
- WhatsApp ;
- Mail ;
- AirDrop ;
- Drive ;
- autres applications compatibles.

Ne pas développer un système de messagerie propriétaire.

## Formats

Adapter les formats au type d'outil.

### Photo Métré

- image cotée ;
- PDF.

### Cintrage / calcul technique

- image ;
- PDF ;
- texte.

### Liste de débit

- PDF ;
- CSV.

### Calpinage

- image ;
- PDF ;
- données/liste si pertinent.

Un résultat partagé doit rester compréhensible **sans WoodPilot**.

---

# 23. Photo Métré

Photo Métré est un outil central.

## Fonctionnement actuel / MVP métier

1. prendre/importer une photo ;
2. tracer une ligne A → B ;
3. saisir manuellement la dimension ;
4. afficher la cote sur la photo ;
5. répéter ;
6. enregistrer ou partager.

Conserver ce mode manuel comme fallback fiable.

## Évolution souhaitée

Après prise de photo :

1. détecter automatiquement les arêtes/segments visibles pertinents ;
2. afficher discrètement les segments détectés ;
3. l'utilisateur touche simplement une arête ;
4. il saisit sa dimension ;
5. la cote est créée.

Objectif initial :

> détecter les lignes, pas deviner automatiquement leurs dimensions réelles.

Ne pas construire immédiatement une IA complexe de mesure automatique.

## Pistes techniques futures

Selon la stack retenue :

- OpenCV ;
- Line Segment Detector ;
- HoughLinesP ;
- détection de contours ;
- fusion de segments colinéaires ;
- intersections ;
- classification horizontal / vertical / profondeur ;
- Apple Vision `VNDetectContoursRequest` ;
- ARKit / LiDAR sur appareils compatibles.

Ces technologies sont des pistes, pas une obligation immédiate.

---

# 24. Outils cœur

Priorité forte :

- Photo Métré ;
- Arêtiers ;
- Calpinage ;
- Liste de débit ;
- Angles de coupe ;
- Cintrage ;
- Répartition ;
- Caisson.

Autres outils très utiles :

- Diagonale / équerrage ;
- Pente ;
- Division ;
- Perçages ;
- Portes / façades ;
- Escalier ;
- Assemblages ;
- gestion des chutes.

Outils complémentaires :

- poids panneau ;
- quantité de finition ;
- quantité de colle ;
- conversions ;
- niveau ;
- fixations ;
- ossature ;
- repérage chantier.

Ne pas développer tous ces outils simultanément.

---

# 25. Cintrage

Exemple de calculateur servant de référence UX.

Entrées possibles :

- corde ;
- flèche.

Résultats :

- rayon ;
- longueur d'arc ;
- angle.

L'utilisateur modifie directement les dimensions sur le dessin.

Le résultat principal doit être très visible.

---

# 26. Caisson

À terme, le générateur de caisson doit pouvoir produire des pièces exploitables par la liste de débit.

Flux :

```text
dimensions du caisson
        ↓
configuration
        ↓
pièces
        ↓
liste de débit
        ↓
calpinage
```

Ne pas construire un configurateur 3D complexe dans la première itération mobile.

---

# 27. Calpinage et liste de débit

Ces outils doivent être connectables.

La liste de débit décrit les pièces.

Le calpinage optimise leur placement sur les panneaux.

Le mode paysage peut être particulièrement pertinent ici.

À terme, les chutes pourront être enregistrées et réutilisées.

---

# 28. Cartes et surfaces

Design plat.

Une carte se différencie principalement par :

- une surface légèrement différente ;
- une bordure fine ;
- éventuellement un rayon modéré.

Éviter les grosses ombres.

---

# 29. Accessibilité atelier / chantier

Minimum recommandé :

```text
zone tactile : 48 × 48 px
texte courant : environ 15 px minimum
```

Principes :

- contraste élevé ;
- actions principales faciles à atteindre au pouce ;
- ne pas dépendre uniquement de la couleur ;
- ne pas dépendre uniquement du swipe ;
- limiter la saisie texte ;
- éviter les petits contrôles ;
- valeurs techniques lisibles rapidement.

---

# 30. Zone du pouce

Les interactions fréquentes doivent autant que possible être situées dans les deux tiers inférieurs de l'écran.

Éviter de placer une action répétitive importante uniquement en haut de l'écran.

---

# 31. États des composants

Prévoir au minimum :

- default ;
- pressed ;
- selected ;
- disabled ;
- error.

Pour Photo Métré, une arête pourra par exemple avoir les états :

```text
détectée
sélectionnée
cotée
```

La couleur primaire est utilisée pour les éléments sélectionnés/importants.

---

# 32. Composants communs envisagés

Construire une bibliothèque cohérente autour de composants réutilisables :

```text
AppHeader
BottomNavigation

ToolWheel
ToolIcon
ToolCard

ProjectCard

MeasurementInput
NumberPad
WheelPicker
Stepper

TechnicalDiagram
DimensionLine
DetectedEdge

PrimaryButton
SecondaryButton
IconButton

BottomSheet
Modal

ResultCard
ShareResult

Toast
Tooltip
```

Ne pas dupliquer un composant métier lorsqu'un composant générique peut être étendu proprement.

---

# 33. Offline

WoodPilot doit fonctionner hors connexion autant que raisonnablement possible pour ses fonctions de terrain.

Les calculateurs techniques ne doivent pas dépendre d'un serveur pour fonctionner.

Le stockage local des projets/métrés doit être prévu dans l'architecture future.

Les fonctions nécessitant réellement Internet doivent être clairement identifiées.

---

# 34. Performance

Priorités :

- ouverture rapide ;
- interactions instantanées ;
- animations courtes ;
- pas de dépendances lourdes sans justification ;
- aucune animation décorative coûteuse ;
- calculs locaux lorsque possible.

Une action courante doit sembler immédiate.

---

# 35. Architecture métier future

Les outils ne doivent pas être des silos.

Prévoir progressivement un modèle de données permettant des transferts comme :

```text
Photo Métré
     ↓ dimensions
Caisson
     ↓ pièces
Liste de débit
     ↓ panneaux/pièces
Calpinage
     ↓
Chutes / export
```

Mais ne pas surarchitecturer la V0.1.

---

# 36. Prototype existant

Le prototype V0.1 fourni avec ce document contient actuellement :

- `index.html`
- `styles.css`
- `app.js`
- `README.md`

Fonctionnalités déjà simulées :

- roue ;
- swipe ;
- tap ;
- haptique navigateur lorsque disponible ;
- navigation Projets / Roue / Outils ;
- bibliothèque ;
- recherche ;
- bottom sheet ;
- partage via Web Share API ;
- fallback presse-papiers ;
- Material Symbols Rounded ;
- Dark / Light mode ;
- design tokens CSS.

Ce prototype est une **base UX**, pas encore l'architecture finale de production.

---

# 37. Première roue V0.1

Outils actuellement prévus sur la roue :

1. Photo Métré
2. Arêtiers
3. Calpinage
4. Cintrage
5. Angles
6. Répartition
7. Caisson
8. Pente / Diagonale

La roue devra à terme être personnalisable.

---

# 38. Roadmap recommandée

## Phase 0 — UX shell

Objectif :

valider l'expérience mobile globale.

Comprend :

- Design System ;
- roue ;
- navigation ;
- bibliothèque ;
- projets simples ;
- bottom sheets ;
- WheelPicker ;
- NumberPad ;
- partage ;
- responsive.

## Phase 1 — premiers vrais outils

Développer quelques outils représentatifs plutôt que tout le catalogue.

Ordre recommandé :

1. Cintrage
2. Angles / pente / diagonale
3. Répartition
4. Photo Métré manuel

Cela permet de valider les composants génériques.

## Phase 2 — Photo Métré avancé

- photo native ;
- annotations ;
- lignes ;
- dimensions ;
- export ;
- détection automatique d'arêtes.

## Phase 3 — chaîne fabrication

- Caisson ;
- Liste de débit ;
- Calpinage ;
- transmission des données entre outils.

## Phase 4 — projets et persistance

- stockage local ;
- dossiers ;
- historique ;
- duplication ;
- exports ;
- synchronisation éventuelle.

---

# 39. Consignes Codex pour les prochaines modifications

Avant de coder une nouvelle fonctionnalité :

1. identifier si un composant existant peut être réutilisé ;
2. vérifier l'usage smartphone ;
3. vérifier l'usage à une main ;
4. vérifier le fonctionnement hors ligne ;
5. vérifier si le résultat doit être partageable ;
6. vérifier portrait et, si pertinent, paysage ;
7. ne pas introduire une nouvelle couleur hors tokens ;
8. utiliser Material Symbols ;
9. éviter toute dépendance lourde sans bénéfice réel ;
10. conserver une alternative au geste swipe lorsque nécessaire.

---

# 40. Règles de développement visuel

Ne pas introduire sans validation :

- gradient ;
- background image ;
- texture décorative ;
- glass effect ;
- nouvelle famille d'icônes ;
- navigation supplémentaire ;
- nouvelle couleur principale ;
- changement majeur de typographie ;
- animation longue ;
- écran intermédiaire inutile.

---

# 41. Critère de réussite

Pour chaque outil, poser cette question :

> Un menuisier sur chantier peut-il comprendre cet écran et effectuer son opération principale en quelques secondes ?

Si la réponse est non, simplifier.

Pour WoodPilot globalement :

> moins de navigation, moins de saisie, plus de manipulation directe.

---

# 42. Principe produit final

WoodPilot doit progressivement devenir un ensemble d'outils reliés entre eux, mais chacun doit rester suffisamment simple pour être utilisé seul.

La sophistication doit être dans :

- les calculs ;
- les capteurs ;
- la caméra ;
- la circulation des données ;
- l'automatisation.

Elle ne doit pas apparaître sous forme de complexité dans l'interface.

**Le meilleur écran WoodPilot est celui qui permet au menuisier d'obtenir son résultat sans avoir à réfléchir au fonctionnement de l'application.**
