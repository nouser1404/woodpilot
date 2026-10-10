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
