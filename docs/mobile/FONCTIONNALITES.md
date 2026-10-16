# Fonctions détaillées de WoodPilot

Périmètre confirmé par l’utilisateur : réaliser les fonctions décrites dans CODEX.md,
sans ajouter les outils seulement cités comme idées (escalier, fixations, ossature, etc.).
Le développement et la recette restent locaux ; le déploiement Raspberry est préparé.

| Fonction | Réalisation |
|---|---|
| Navigation et bibliothèque | Projets / Roue / Outils, recherche, catégories, accès sans projet |
| Favoris | Huit maximum, persistance, sélection directe et flèches, balayage, réorganisation par appui long ou boutons |
| Saisie | Cotes sur dessins, bottom sheets, pavé numérique, virgule, signe selon domaine, ±1/±5, expressions sans exécution de code |
| Sélecteurs discrets | Quantités et épaisseurs courantes, défilement avec snap, sélection directe, épaisseur personnalisée |
| Calculs | Cintrage, angles de coupe, répartition, pente et diagonale, arêtiers et gabarits |
| Photo Métré manuel | Import/prise de photo, tracé ou deux points, cote manuelle, modification, retrait, annulation |
| Photo avancée | Détection Sobel/Hough dans un worker local, propositions de segments sélectionnables, annotations placées et notes techniques |
| Transfert photo → caisson | Association explicite d’une cote à largeur, hauteur ou profondeur ; les autres dimensions sont conservées |
| Chaîne fabrication | Caisson simple → pièces → liste de débit → calpinage séparé par épaisseur avec trait de scie et sens du fil |
| Chutes | Rectangles restants conservés, saisie et correction des dimensions réelles, statut utilisée, corbeille et restauration |
| Réutilisation de chute | Un seul rectangle disponible ; épaisseur respectée, pièces non placées signalées, format physique protégé |
| Dossiers | Résultats datés, réouverture, duplication, renommage, notes, corbeille et restauration |
| Sauvegardes | JSON avec photos, annotations, notes, résultats et chutes ; import validé avant transaction atomique |
| Stock après import | Les chutes gardent leur identifiant ; les données locales actuelles et le statut utilisée ne sont pas écrasés |
| Partage | Texte, image, PDF multipage, CSV débit, gabarit SVG ; partage système si disponible, copie ou téléchargement sinon |
| Offline | Calculs, détection de lignes, dossiers, chutes et exports après première visite et préparation du cache |
| Présentation | Tokens sémantiques, clair/sombre, Inter et Material Symbols locaux, portrait et paysage avec défilement |

## Conditions propres à la plateforme

La prise de photo utilise la caméra proposée par le navigateur et le système via
`capture="environment"`, avec import de fichier en alternative. La compatibilité caméra,
installation PWA, vibration et partage natif se vérifie sur les téléphones cibles.
L’application web ne reçoit pas les événements matériels des boutons de volume ;
leur rôle de déclencheur appartient à la caméra système lorsqu’elle le permet.
Les API natives Apple Vision/ARKit/LiDAR nécessiteraient une application native dédiée.
CODEX.md les donne comme pistes et conditionne l’utilisation des boutons physiques à
la plateforme : elles ne sont pas simulées dans le navigateur.

La détection ne détermine aucune mesure réelle et peut manquer des lignes ou proposer
des segments peu pertinents sur une photo bruitée. Le mode manuel reste disponible.
Les chutes calculées décrivent des rectangles libres théoriques : contrôler leurs
dimensions après coupe et marquer explicitement le stock comme utilisé.
Le calpinage n’est pas une garantie d’optimum ou une séquence de sciage.

La synchronisation distante est seulement éventuelle dans CODEX.md et n’est pas activée.
La sauvegarde/export-import assure le transfert entre appareils sans compte ni serveur.
Les expressions sont limitées à 120 caractères et 32 niveaux de parenthèses ; la
détection travaille sur 360 px maximum pour maintenir la fluidité du téléphone.

## Compatibilité des données

Le catalogue est limité à 1000 chutes, corbeille comprise, pour conserver une sauvegarde importable.
La base `woodpilot-tools-v1` passe en version IndexedDB 2 et ajoute le magasin de
chutes sans effacer les projets existants. Les sauvegardes V1 sans annotations,
notes ou chutes restent importables. Les copies de dossiers restent séparées de la
gestion de l’entreprise et n’appellent aucune route API multi-tenant.

## Calpinage détaillé — 10 octobre 2026

Noms d’éléments identiques à la liste de gestion, sans accès à son API. Chants booléens haut/droite/bas/gauche exprimés avant rotation ; une rotation horaire de 90° transforme leur position sur le dessin. Le matériau est commun à la liste ; les panneaux restent séparés par épaisseur. Le nom de projet est facultatif et repris du dossier lors de l’enregistrement ou de la réouverture s’il est absent. Les anciens résultats restent compatibles. Le PDF comporte récapitulatif, liste de débit et tous les plans cotés ; taux de chute = surface des panneaux moins surface des pièces, trait de scie compris. Les chants ne modifient pas les dimensions brutes à débiter.

Marge de rafraîchissement uniforme : `panel.edgeMarginMm`, 0 mm par défaut pour les anciens résultats. Retrait sur chacun des quatre bords, sans ajout d’un second trait de scie à cette marge ; la marge inclut la bande éliminée. Les placements et rectangles de chutes sont décalés dans le panneau brut, les pertes incluent les bords supprimés, et les bandes retirées ne sont pas récupérées comme chutes. Une marge qui supprime toute la surface utile est refusée.

Apparence automatique : `prefers-color-scheme` au chargement et lors de ses changements. Aucun sélecteur manuel ; les anciennes préférences locales ne sont plus utilisées.

Nouveaux calpinages : trait de scie de 3 mm et marge de 20 mm sur chaque bord par défaut. Réouverture : les valeurs sauvegardées sont conservées ; anciennes sauvegardes sans marge : 0 mm. Réutilisation d’une chute : marge remise à 0 mm, réglable selon son état.

## Niveau / Aplomb

Instrument local indicatif : `devicemotion.accelerationIncludingGravity`, filtrage exponentiel du vecteur, deux angles et écart global par rapport à la gravité. Niveau : normale de la face du téléphone verticale ; aplomb : axe vertical de l’écran parallèle à la gravité. Rotation de l’écran prise en compte, calibration réinitialisée lors de sa rotation ou d’un changement de mode. Alignement affiché à ±0,2°, sans garantie de précision matérielle. Zéro relatif pour une référence choisie. L’écart mm/m vaut 1000 × tan(angle). Les mesures âgées de plus de deux secondes sont masquées ; arrêt à la fermeture et en arrière-plan. Simulation séparée, explicitement affichée, sans valeur présentée comme mesure physique. Pas de sauvegarde de mesures dans cette première version. Capteurs et autorisation à valider sur iOS/Android en HTTPS ; localhost sur ordinateur sert à la simulation.

## Pythagore / Trigonométrie simplifiée

Triangle rectangle uniquement. Six couples d’entrée : base/hauteur, diagonale/base, diagonale/hauteur, base/angle, hauteur/angle, diagonale/angle. α est l’angle entre base et diagonale. Côtés positifs, angle strictement entre 0° et 90°, diagonale supérieure au côté connu, résultats de 0,001 à 1 000 000 mm. Calculs complets sans arrondis intermédiaires ; affichage arrondi. Changer de couple reprend le triangle courant. Sauvegardes, réouverture, texte, image et PDF.

## Courbe hélicoïdale

Hypothèse : rayon et pas constants sur la ligne mesurée. Développement horizontal = 2π × rayon × tours ; longueur = hypot(développement horizontal, hauteur) ; pas = hauteur/tours. Fractions de tour positives admises jusqu’à 100 tours, hauteur nulle admise pour un arc plan. Le rayon correspond à la ligne choisie, sans correction de section ou de fabrication. Aucun calcul de marches ou de ligne de foulée dans ce module.

## Écran maintenu allumé — 10 octobre 2026

L’application demande un verrou `screen` dès son ouverture visible. Elle le libère en arrière-plan et le redemande au retour ; un toucher permet de réessayer après un refus du navigateur. Aucun réglage permanent du téléphone n’est modifié. Le statut est visible sous la roue. HTTPS (ou localhost) et un navigateur compatible sont nécessaires ; une batterie faible ou les politiques du système peuvent suspendre le verrou.

## Niveau stabilisé et retour sonore — 10 octobre 2026

Son facultatif activé par un bouton : bip bref toutes les deux secondes uniquement pendant l’alignement stable, arrêt à la fermeture ou en arrière-plan. Affichage arrondi au degré et au mm/m, sans arrondir les calculs. Filtrage du capteur sur 350 ms, petite zone morte sur le déplacement de bulle, validation après 500 ms à ±0,2° ; maintien jusqu’à 0,4° pour éviter les bascules dues au bruit. La bulle se centre pendant l’alignement confirmé. L’affichage 0° seul ne vaut pas validation d’alignement. Le navigateur doit autoriser l’audio à la suite du toucher ; volume et mode silencieux du téléphone restent à vérifier sur appareil réel.

### Guidage sonore progressif (remplace la cadence précédente)

Un bip de confirmation est joué dès l’activation. Les bips sont disponibles avant l’alignement : intervalle de 2 s à 10° ou plus, environ 0,85 s à 3°, 0,35 s près du centre, puis 0,25 s après validation d’alignement (son plus aigu). Cadence calculée à partir de l’angle non arrondi, enveloppe sonore courte et volume renforcé. Silence en l’absence de mesure récente, à la fermeture et en arrière-plan. Si le bip de confirmation n’est pas audible, vérifier volume multimédia, sortie Bluetooth et mode silencieux ; le son réel sur smartphone n’est pas validé par les tests automatisés.

### Correctif audio de confirmation

Le rafraîchissement sans mesure ne coupe plus le bip de confirmation. La cadence est réinitialisée indépendamment de l’arrêt du son ; fermeture et arrêt des capteurs interrompent toujours les bips. Sur les navigateurs proposant Audio Session, le mode `playback` est utilisé lors de l’activation pour la compatibilité avec le mode silencieux iOS, puis le mode initial est restauré à la désactivation. Ce mode peut interrompre un autre média sur le téléphone. Deux tests de régression vérifient la non-interruption du bip et la restauration de session. Audibilité physique à confirmer sur le téléphone de l’utilisateur.

### Radar du niveau : choix de l’axe

Toucher la ligne horizontale ou verticale sélectionne uniquement cette composante, sans modifier le zéro calibré. La bulle est contrainte à la ligne choisie ; angle, mm/m, validation d’alignement et bips ignorent l’autre composante. L’axe est surligné et nommé sous le radar. Boutons Horizontal, Vertical et Deux axes disponibles également au clavier ; contrôle deux axes par défaut. Test automatisé : dévers de 12° sur l’axe perpendiculaire ignoré, mesure et zéro relatif préservés sur l’axe sélectionné.

### Interface simplifiée

Aide au toucher (icône `help` dans les en-têtes d’outils) pour les explications secondaires, fermeture au toucher extérieur, au clavier Échap ou avec Compris. Erreurs et avertissement permanent Photo Métré conservés. Niveau : interrupteurs Capteurs et Son, états synchronisés en cas de refus ou d’arrêt en arrière-plan. Photo Métré : interrupteur d’affichage des arêtes ; zoom −/+, vue entière et déplacement remplacés par Material Symbols (`zoom_out`, `zoom_in`, `fit_screen`, `pan_tool`), avec nom accessible et titre. L’icône de déplacement indique son état actif.

La police Material Symbols locale contient tous les symboles employés, y compris aide, zoom, vue entière et déplacement. Les ligatures sont activées explicitement et la version de la police est incluse dans le cache hors connexion.

## Notes vocales de chantier

Outil accessible depuis Outils et ajoutable aux favoris Toolbox. Enregistrement audio local (MediaRecorder, format choisi selon le navigateur), titre facultatif, date, durée, réécoute, interrupteur Traité, téléchargement et suppression. Conservation des fichiers audio dans une base IndexedDB distincte, sans serveur, transcription ni notification programmée. Microphone demandé uniquement au démarrage. Arrêt à la fermeture de l’outil, au passage en arrière-plan ou après 5 minutes ; le rappel est conservé si la sauvegarde aboutit. En cas de stockage saturé, le son reste disponible dans l’outil pour téléchargement ou nouvelle tentative. HTTPS requis hors localhost. Effacer les données du site efface les notes ; téléchargement disponible pour les conserver ailleurs. Validation réelle sur Safari iPhone à effectuer.

## Inclinomètre

Outil Métrer ajoutable à la Toolbox, mesure du plan de l’écran par la gravité (0° horizontal à 90° vertical), écran vers le haut ou le bas. Affichage à 0,1° et pente en %, référence absolue sans zéro relatif. Bouton Prendre la mesure ou switch Capture auto : 5 secondes de placement puis 2 secondes de stabilité du vecteur brut (écart maximal 0,3°, accélération proche de la gravité, interruption si mesures espacées de plus de 500 ms). Bip activable, mesure figée conservée quand le téléphone est relevé, nouvelle mesure, sauvegarde projet et export. Aucun échantillon vieux de plus d’une seconde ne peut être capturé. Capteurs arrêtés, capture annulée en arrière-plan ou à la fermeture ; dernière mesure figée conservée. Les boutons de volume iPhone ne sont pas accessibles à la PWA. Essai physique écran contre une pente sur iPhone à effectuer.

## Palette de couleurs

Recherche de références et familles françaises, palette indicative de 215 entrées, couleur HEX ou sélecteur, photo/caméra locale (JPEG/PNG/WebP jusqu’à 25 Mo et 32 MP, réduite à 1600 px), prélèvement moyen sur une zone de 11 × 11 pixels, trois teintes proches par distance CIE76 dans CIELAB D65. Choix du RAL, sauvegarde projet et exports. Photos non transmises ni conservées dans les projets : seules la couleur prélevée, la référence choisie et l’origine sont enregistrées. Avertissement permanent : comparaison au nuancier physique avant commande ; aucune identification certifiée, ni pourcentage de confiance.

Palette adaptée de https://github.com/ieskudero/ral-colors (MIT, licence dans vendor/ral/LICENSE.txt, empreinte source dans ral-palette.js), indépendante de la bibliothèque officielle RAL. Valeurs sRGB approximatives ; liste non présentée comme exhaustive. Validation des décisions de couleur sur échantillons physiques : https://www.ral-farben.de/en/ral-digital-colour-library .


### Parcours guidés
Les calculateurs Cintrage, Pente / Diagonale, Angles, Répartition, Arêtiers, Caisson, Hélicoïdale et Pythagore / Trigonométrie séparent les données du résultat. Les options de fabrication du caisson et des arêtiers occupent une étape intermédiaire. Retour conserve les valeurs ; rouvrir commence à la saisie.
Le niveau propose activation du capteur, puis lecture du radar et accès aux paramètres. L’inclinomètre avance par activation des capteurs puis capture réelle ou restauration d’une mesure mémorisée : aucune navigation ne peut créer une mesure fictive. Les erreurs et commandes d’arrêt restent accessibles.

Le débit / calpinage sépare matériau et projet, préparation des pièces et du panneau, puis lecture des plans et exports. Les sections pièces et format sont ouvertes dans leur étape.

La pièce de débit se saisit en trois étapes : nom, dimensions/quantité, chants/sens du fil. Le schéma 2D représente la pièce avant rotation ; chaque côté est un bouton tactile accessible au clavier, sélectionné en orange. Les chants restent stockés dans chantTop/Right/Bottom/Left et sont reportés sur le plan et les exports après rotation. Les proportions extrêmes du schéma de saisie sont limitées pour garder les côtés accessibles ; les cotes affichées restent réelles. Entrée avance les premières étapes sans enregistrer. Les ajustements numériques −5, −1, +1, +5 occupent une seule ligne ; l’unité suit le champ édité.

Niveau/aplomb : bouton Activer le capteur en tête, gris avec croix, puis coloré avec coche une fois actif. Le son est coché par défaut et démarré dans le geste d’activation ; son bouton se trouve sous le radar à cercles concentriques. Bips sinusoïdaux plus doux (660 Hz, 880 Hz aligné), avec une enveloppe progressive et une cadence accélérée vers le centre. Fermer ou passer en arrière-plan arrête les capteurs et le son.

Le choix Niveau / Aplomb utilise deux cartes avec pictogramme et libellé. Le choix actif expose aria-pressed ; changer de contrôle remet à zéro la référence et adapte la consigne de placement.

Le plan 2D et ses exports affichent dans chaque pièce son code et les deux cotes orientées : largeur du rectangle horizontalement, hauteur verticalement. Les dimensions suivent la rotation effective sur le panneau et sont arrondies au millimètre. La police s’adapte aux petites pièces. Ces cotes aident à préparer les coupes sans constituer une séquence de sciage.

Inclinomètre : bouton d’activation en tête, masqué pendant la mesure et la lecture mémorisée ; commandes son et capture automatique sous le cadran. Le son est activé par défaut à chaque ouverture et démarre sur le geste d’activation. Le cadran affiche le plan de l’écran avec trois cercles concentriques et une ligne inclinée ; la valeur reste référencée à la gravité. Le bip confirme la capture, sans guider vers 0° puisqu’une pente quelconque peut être visée.

### Calculateur d’escalier
Parcours : espace disponible, nombre de hauteurs et nez de marche, résultats. Hauteur sol fini à sol fini H ; reculement R. N hauteurs, N−1 marches à fabriquer, arrivée sur l’étage : h=H/N, g=R/(N−1), Blondel=2h+g, pente de la ligne des nez=atan(h/g), profondeur=g+nez. Proposition automatique déterministe entre 2 et 60 hauteurs ; priorité aux repères h 150–200, g 220–350, Blondel 600–640 mm, puis proximité de 630 mm et h 175 mm. Ces plages sont des choix de confort, pas une validation réglementaire. Dimensions affichées au mm, angles à 0,1° ; calculs non arrondis. Positions cumulées calculées sur les cotes exactes. Sauvegarde projet et exports texte/image/PDF existants. Sans calcul de trémie/échappée, fabrication des limons ou contrôle structurel. Référence Blondel : https://www.lapeyre.fr/c/magazine/comment-calculer-les-dimensions-dun-escalier/

Formes disponibles : droit, quart tournant, demi-tournant, deux paliers (trois volées), trois paliers (quatre volées), hélicoïdal. Quarts et demi-tournants : palier ou marches balancées. Deux et trois paliers tournent successivement de 90° dans le sens choisi. Chaque volée peut avoir son reculement et son nombre de hauteurs ; hauteur unitaire commune. Un palier remplace une marche. Répartition automatique déterministe, ou saisie des hauteurs par volée.

Balancement géométrique sur toutes les marches, à collets constants : découpe du couloir entre contour intérieur et contour extérieur, giron constant sur la foulée arrondie. Il ne constitue pas un tracé d’atelier validé. Hélicoïdal : giron en arc au rayon de foulée choisi, diamètre extérieur, noyau, rotation totale et sens. Plusieurs tours se superposent dans la projection ; aucune échappée ni collision structurelle n’est validée.

Parcours en quatre étapes : forme, encombrement, répartition des hauteurs, plans et export. Vue de dessus cotée, vue de côté par projection X de toutes les volées, développé suivant la foulée. Les vues représentent les girons théoriques, sans compensation des nez, épaisseur ou assemblages. Le PDF contient le détail du calcul et les trois plans ; image et SVG reprennent la vue sélectionnée. Les cotes sont arrondies au mm et les angles à 0,1°, les calculs restent exacts. Le moteur et le tracé sont séparés dans stairs-layout.js, stairs-balanced.js et stairs-plan.js ; stairs.js conserve le contrat du calcul droit historique.

### Reconnaissance des arêtes Photo Métré
Analyse locale dans un worker sur une image de 960 pixels maximum par côté, lissage, gradients Sobel affinés, seuil adaptatif et récupération des contours faibles connectés. Votes directionnels pour les lignes obliques, suppression des doublons proches et séparation des fragments éloignés : aucun segment ne doit relier deux objets à travers un grand vide. Jusqu’à 35 propositions, sélection tactile dans les modes manuel et calibré. Les contours restent des propositions visuelles ; ils ne donnent aucune échelle réelle et ne modifient pas la calibration. Désactiver l’affichage des arêtes conserve le tracé libre. Tests sur faible contraste, bords parallèles, discontinuités, diagonales et bruit.

### Optimisation des chutes de calpinage
Le moteur mobile compare trois découpes guillotine : stratégie historique, bandes horizontales et bandes verticales. Priorité au nombre de pièces placées puis au nombre minimal de panneaux ; à égalité, préférence à la plus grande chute rectangulaire réutilisable (deux côtés au moins 100 mm), puis à la concentration des surfaces de chutes. Les bandes regroupent les plinthes dans le sens de la longueur ou de la largeur, sans imposer de rotation interdite. Trait de scie, marge par bord et séparation par épaisseur restent appliqués. Heuristique déterministe, sans garantie d’optimalité globale. `nesting-optimizer.js` utilise l’API du moteur partagé ; sa stratégie historique par défaut reste inchangée pour les autres usages.

### Étiquettes de pièces
Bouton Étiquettes de pièces à la dernière étape du calpinage. Une étiquette par occurrence placée, référence Pn-occurrence identique au code Pn du plan ; numéro global et panneau pour retrouver la pièce. Informations : projet facultatif, nom, dimensions brutes avant rotation au millimètre, épaisseur, matériau et date locale d’impression. Les pièces hors format ou non placées sur une chute unique sont exclues et leur nombre est signalé. Aperçu dans l’app puis page d’impression indépendante, sans dépendance réseau ni logiciel d’imprimante. Formats : A4 24 étiquettes (3 × 8, 63,5 × 33,9 mm, marges 9,75 mm latérales et 12,9 mm verticales) ; rouleau 100 × 50 mm, une étiquette par page. Imprimer à 100 %, sans en-têtes ni pieds de page, sur un support compatible. Possibilité de sauvegarder en PDF via le dialogue du navigateur. Tester l’alignement sur une feuille ordinaire avant les étiquettes adhésives. `nesting-labels.js` contient le modèle et la mise en page, `nesting-labels-ui.js` l’aperçu et l’action d’impression.

### Niveau / aplomb : activation progressive
Deux étapes : bouton gris avec croix avant activation ; bouton coloré avec coche une fois le capteur autorisé. Le bouton actif permet aussi d’arrêter le capteur. Radar, lecture, bouton son et paramètres restent masqués avant activation. Les paramètres sont regroupés sous le radar ; choix du contrôle, axes et référence restent accessibles. Six cercles concentriques contrastés, bulle uniquement avec une mesure récente. Un capteur autorisé mais sans échantillon n’affiche aucune mesure fictive. Cadence calculée sur l’angle exact, 160 à 2 000 ms selon l’écart, 140 ms après alignement stable ; enveloppe douce de 130 ms sans recouvrement. Son activé par défaut, arrêté à la fermeture ou en arrière-plan.

Toolbox par défaut : Photo Métré, Niveau / Aplomb, Calpinage, Inclinomètre, Notes vocales, Palette de couleurs, Caisson, Répartition, dans cet ordre. Les favoris personnalisés déjà enregistrés sont conservés.

Fournisseurs : module natif de consultation dans CHANTIER, recherche et filtres repliés, liste/carte, contacts, favoris et notes locales, export CSV. Données et détails d’intégration : `FOURNISSEURS.md`.

### Décors mélaminés et textures

L’outil Palette de couleurs conserve l’identifiant `ral` et les sélections RAL déjà sauvegardées. Trois vues : RAL, Mélaminés, Textures. Première sélection Pfleiderer : 21 décors unis/bois/matières (dont U17005 Rouge Carmin) et 17 textures. Les fiches fabricant ont été consultées le 12/10/2026 ; seules les finitions cochées pour panneau mélaminé MFB sont proposées pour chaque décor. Une texture de surface n’est pas une teinte RAL. La recherche accepte codes avec espaces, noms et accents.

`decor-catalog.js` contient noms, références, finitions compatibles, date et URLs fabricant ; `decor-model.js` valide les sélections et fournit la recherche et le texte de partage ; `decor-browser.js` orchestre l’interface. Les sélections `{kind:'decor',decorCode,finish}` et `{kind:'texture',textureCode}` sont sauvegardables dans les projets. Aucun rapprochement automatique photo → décor bois n’est prétendu.

Aperçus © Pfleiderer chargés directement depuis le fabricant, à la demande lors de l’ouverture des vues ; pas de copie des images dans l’archive ni dans le cache hors connexion de l’application. Hors connexion les références restent disponibles avec un message explicite si l’aperçu ne charge pas. Les vignettes ne garantissent pas la couleur, l’échelle du motif ni le relief réel. La fiche fabricant permet de vérifier les variantes et échantillons. Catalogue non exhaustif, sans garantie de stock ; confirmer sur échantillon physique.

Sources : https://www.pfleiderer.com/fr-fr/produits/decors/detailler/u17005 et les URLs de chaque fiche dans le catalogue ; collection https://www.pfleiderer.com/fr-fr/collection-2025-2028 .

## Variation hygrométrique

Calculateur de mouvement du bois massif, ajouté à la bibliothèque d’outils sans modifier les huit favoris existants. Parcours en trois étapes : essence/dimension à travers le fil/sens du débit ; humidité ; résultat. Dix-sept essences, coefficients moyens radial et tangentiel issus du dossier sources Éduscol du Concours Général des Métiers TMA 2022, DS 2/9. Le débit inconnu présente les deux extrêmes radial/tangentiel, sans inventer une valeur précise pour les débits intermédiaires.

Deux modes : humidité du bois au départ et à l’arrivée (mesurée au testeur), ou humidité relative et température de l’air pour les deux ambiances. Le second mode estime l’humidité du bois à l’équilibre par Hailwood–Horrobin/Simpson avec les paramètres en °C du Wood Handbook. Il ne mesure pas le bois, ne fournit pas de délai de stabilisation et n’assimile pas HR et humidité du bois. Paramètres documentés aussi dans le rapport universitaire « Structural Health Monitoring of House Charlie », 2019, équations 1–2 : https://www.diva-portal.org/smash/get/diva2:1424981/FULLTEXT01.pdf .

Modèle de mouvement linéaire : Δdimension = dimension initiale × coefficient × (Hfinale − Hinitiale) / 100. Les coefficients sont exprimés en % de dimension par point de pourcentage d’humidité du bois, pas des retraits totaux vert/anhydre. Domaine volontairement limité au bois en service entre 1 et 20 % d’humidité, température 0–40 °C et HR 10–95 %. Si l’équilibre estimé dépasse 20 %, le calcul est refusé ; pas de résultat extrapolé pour bois vert/saturé. Ni MDF, ni contreplaqué, ni bois modifié thermiquement, ni changement longitudinal, ni déformation sous contrainte d’assemblage.

Résultat signé au millimètre (une variation non nulle inférieure à 0,5 mm reste signalée comme « moins de 1 mm »), dimension finale, mouvement total à permettre arrondi au millimètre supérieur. Cette course n’est pas un jeu de montage garanti et n’ajoute aucune marge arbitraire. Les coefficients dans les détails gardent deux décimales pour ne pas fausser les données. Les calculs internes ne sont pas arrondis. Sauvegarde de toutes les entrées dans les projets et exports texte/PDF via les actions communes.

Code : `hygrometry.js` (données sourcées et moteur pur), `hygrometry-tool.js` (interface), icône SVG locale. Aucun capteur de température ou d’humidité supposé présent dans le téléphone. Fonctionnement hors connexion.

Source des coefficients et formule de mouvement : https://sti.eduscol.education.fr/sites/eduscol.education.fr.sti/files/concours-examens/14665/14665-dossier-source.pdf . Origine du modèle d’équilibre : https://www.fpl.fs.usda.gov/documnts/pdf1973/simps73a.pdf . Coefficients et modèle vérifiés le 14/10/2026.

### Identité visuelle et chutes (14/10/2026)
Palette : primaire #DC2E2E, secondaire #60d394, tertiaire #ffd97d. Le rouge porte les actions et les chants, le vert les états actifs des capteurs, le jaune les repères d’étape et avertissements. Les encres de texte sont adaptées au fond clair/sombre ; les trois couleurs de référence restent identiques. Descriptions, aides, légendes et libellés secondaires à 12 px, champs de saisie à 16 px pour conserver la lisibilité et éviter le zoom mobile. Les dimensions principales et les zones tactiles gardent leur taille.

Les plans de calpinage hachurent la surface utile restante derrière les pièces opaques, ce qui exclut les pièces et conserve le repérage des chants. Les petites pertes de trait de scie sont également visibles comme zones non occupées. La marge de rafraîchissement conserve sa limite distincte. Motifs SVG locaux, identifiants uniques pour plusieurs panneaux ; export image/PDF avec hachures grises en mode papier et références de motifs internes conservées. Les hachures ne prétendent pas que toutes ces surfaces sont des chutes récupérables.

### PDF complet d’un projet (16/10/2026)

Dans un dossier : « Télécharger le PDF complet » et « Partager le PDF complet ». Un seul document contient la présentation du projet, toutes ses notes techniques et ses résultats actifs dans l’ordre d’enregistrement. Les éléments en corbeille sont exclus. Photos avec cotes et annotations recalculées, notes de chaque photo ; références RAL avec aperçu indicatif, références de décors/textures ; liste de débit complète et tous les panneaux hachurés par épaisseur ; vues dessus/profil des escaliers ; données et résultats des autres calculateurs. Les aperçus fabricant distants ne sont pas requis pour exporter les références hors connexion. Les notes vocales ne sont pas liées aux dossiers et ne sont pas transcrites ni incorporées comme audio dans le PDF.

`project-report-model.js` prépare les textes depuis les modèles métier ; `project-photo-report.js` rend les photos enregistrées ; `project-report.js` assemble les pages avec numérotation. Aucune restauration temporaire des contrôleurs : les brouillons d’outils et l’IndexedDB ne sont pas modifiés par l’export. Un résultat inconnu ou invalide bloque le document entier avec une erreur visible, plutôt que d’omettre silencieusement son contenu. Limites : 300 pages et 100 Mo de JPEG cumulés. Partage via la feuille native si disponible ; téléchargement en repli. Les sauvegardes JSON restent nécessaires pour restaurer les données éditables.

Photo Métré : « Nouvelle photo » près de la barre d’édition, retour au choix du mode et annulation de cote regroupés avec zoom/vue entière/déplacement. Icône de déplacement SVG locale à quatre flèches, indépendante de la police d’icônes. Une nouvelle prise de vue peut être annulée pour retrouver la photo en cours ; la sélection d’une nouvelle image demande confirmation avant de remplacer son brouillon. Les photos déjà sauvegardées dans un projet restent intactes. Lors du choix de la nouvelle photo, les commandes de zoom/édition sont masquées et l’annulation reste accessible.

### Repères et sens des chutes du calpinage
Les repères utilisent des acronymes métier numérotés (MT, PLI, TAB, TR, etc.), identiques sur le plan, le débit et les étiquettes. Les occurrences d’une référence sont regroupées dans le tableau sous chaque panneau ; les rotations et chants distincts restent identifiables. Dans la préparation du panneau, « Grande chute », « En longueur » ou « En largeur » compare les placements disponibles en privilégiant d’abord les pièces placées et le nombre de panneaux, puis la dimension choisie d’une chute réutilisable (100 × 100 mm minimum). Le fil bloqué reste respecté. Les anciens projets utilisent automatiquement « Grande chute ». Il s’agit d’une heuristique, sans garantie d’optimum.

### Boutons et installation PWA
Boutons harmonisés : action principale rouge, actions secondaires avec fond discret, commandes icônes en carré arrondi, états appuyé/sélectionné/désactivé/focus et respect de la réduction des animations. Cibles tactiles conservées (44–48 px). La Toolbox possède un manifeste standalone, des icônes et un service worker de cache. Une installation sur téléphone nécessite son URL publique HTTPS ; sur iPhone, ouvrir dans Safari puis Partager > Sur l’écran d’accueil (activer Ouvrir comme app web si proposé). Le dépôt GitHub ne constitue pas le déploiement. Tester le premier chargement en ligne puis la réouverture hors connexion sur l’appareil. Les fonds de carte et aperçus fabricant distants nécessitent Internet.

Sélecteurs et sections dépliables harmonisés : fond discret, rayon14px, chevron, états focus/désactivé, sélection native conservée pour iOS et clavier. Sections ouvertes avec séparation du contenu.

Photo Métré : étiquettes de cote à fond arrondi et opacité72 %, texte opaque ; extrémités des cotes redessinées au-dessus du fond. Même rendu dans les exports photo et le PDF projet.

Photo Métré : retour au mode retiré de la barre, annulation alignée avec zoom/déplacement, ligne commune Arêtes/recherche/annotation. « Ajouter une prise de côte » sous la photo (changement de photo avec possibilité d’annuler). Actions caisson/projet/partage légendées.
