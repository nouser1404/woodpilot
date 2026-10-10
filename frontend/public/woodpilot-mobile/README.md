# WoodPilot outils — fonctions détaillées en local

Base UX fournie V0.1. Spécifications conservées intégralement dans `docs/mobile/CODEX.md`.

## Lancer

Depuis la racine : `npm run dev:tools`.
Ouvrir http://localhost:5180/woodpilot-mobile/index.html.
`TOOLS_PORT` permet de choisir un autre port. Le serveur écoute uniquement en local.
Cet aperçu sert les fichiers sans transformation pour tester le cache PWA.
Vite reste utilisable pour développer le reste de Woodpilot.

## Fonctions livrées

- Maintien automatique de l’écran allumé lorsque l’application est visible, libération en arrière-plan et réactivation au retour. Statut explicite si le navigateur ou le système le refuse.

- Hélicoïdale : courbe circulaire de rayon et pas constants ; rayon, hauteur, tours (fractions admises), longueur développée, pas, pente et dessin développé.

- Pythagore / Trigonométrie : triangle rectangle, six couples de données connues (deux côtés ou côté/angle), côtés, angles complémentaires, pente, dessin coté et exports.

- Niveau / Aplomb : capteurs du téléphone, bulle sur deux axes, écart en degrés et mm/m, zéro relatif et retour à la gravité ; simulation explicitement identifiée sur ordinateur. Accès aux capteurs déclenché par un bouton. Les mesures cessent à la fermeture ou en arrière-plan ; aucune ancienne valeur affichée comme mesure récente. Contrôle réel à effectuer sur téléphone en HTTPS.

- Roue : huit favoris maximum, balayage et sélection directe ; bibliothèque avec recherche et favoris persistants, réorganisation par appui long ou boutons Monter/Descendre.
- Cintrage : corde/flèche, rayon, arc et angle ; arc circulaire mineur, flèche positive ≤ demi-corde.
- Angles : onglets égaux pour assemblage plan, conventions de réglage explicites.
- Pente / diagonale : triangle rectangle, hauteur nulle autorisée ; comparaison terrain pour vérifier l’équerrage.
- Répartition : jeux égaux, avec ou sans espaces aux extrémités, positions des axes.
- Photo Métré : prise/import de photo selon navigateur, tracé manuel, saisie, modification et suppression de cotes. Détection locale des arêtes (Sobel/Hough), sélection tactile, annotations et notes techniques ; transfert explicite des cotes vers Caisson. Mesure calibrée ArUco DICT_4X4_50 ID 0 (carré noir 50 mm), homographie coplanaire, distance connue en repli, points déplaçables et zoom/pan. Photo originale conservée (25 Mo / 32 mégapixels maximum). Voir `docs/mobile/PHOTO_METRE_CALIBRE.md` pour les limites et essais smartphone.
- Arêtiers : pyramide régulière ou sommet décalé, sections horizontales, longueurs, corroyage et gabarit SVG de face à l’échelle 1:1. Conventions dans `docs/mobile/ARETIERS.md`.
- Caisson : côtés, dessus/dessous, tablettes et fond appliqué ; transfert des pièces vers la liste de débit. Sans façade, jeu d’assemblage ni correction de chants.
- Liste de débit / calpinage : noms d’éléments prédéfinis ou libres, chants sur les quatre bords visibles en pointillés après rotation, cotes extérieures sur le plan et le PDF, matériau et nom de projet facultatif ; PDF avec date, occurrences, panneaux, pertes pondérées et liste de débit complète.  pièces, quantités, épaisseurs, rotation autorisée, panneaux, trait de scie et marge de rafraîchissement uniforme sur les quatre bords ; moteur Woodpilot existant. Placement rectangulaire indicatif, sans garantie d’optimum ni ordre de coupe.
- Chutes : saisie manuelle et récupération des rectangles restants (100 × 100 mm minimum), catalogue local, statut utilisée et corbeille récupérable ; réutilisation d’une chute unique, avec épaisseur et quantité de stock respectées. Les dimensions théoriques doivent être vérifiées après coupe.
- Dossiers locaux : enregistrement et réouverture des résultats, historique des résultats datés, duplication, notes techniques, renommage, corbeille/restauration ; sauvegarde JSON et import dans de nouveaux dossiers, sans écraser les existants. Les chutes conservent leur identifiant : une réimportation ne recrée pas de stock utilisé.
- Exports autonomes : texte, PNG et PDF ; CSV pour le débit. Le PDF contient tous les panneaux, l’image le panneau sélectionné. Partage natif lorsqu’il est disponible ; sinon copie/téléchargement.
- Thème clair/sombre automatique selon le navigateur ou le système, polices locales, pavé numérique avec expressions arithmétiques (+ − × ÷ et parenthèses), ajustements ±1/±5, sélecteurs à crans pour les quantités et épaisseurs (valeur personnalisée autorisée) et installation PWA selon navigateur.

## Hors connexion et données

Une première visite réussie prépare le cache. Attendre « Prêt hors connexion ».
Calculs, dossiers et exports fonctionnent ensuite localement. Les données restent dans
le navigateur de cet appareil : elles ne sont ni synchronisées ni transférées à l’ERP.
Exporter régulièrement une sauvegarde. Un changement de domaine ou d’appareil nécessite
un export/import ; vider les données du navigateur efface ses dossiers.
Le partage vers une application externe peut nécessiter sa propre connexion.

## Limites volontaires

La détection propose des segments, sans garantie de retrouver toutes les arêtes : le tracé manuel reste disponible. Elle ne déduit aucune dimension réelle.
Pas de mesure automatique, de 3D complexe, de CNC ou de synchronisation distante. Les boutons de volume dépendent de la
caméra système ; le web ne les pilote pas. Caméra réelle, installation et partage natif
restent à vérifier sur les téléphones cibles. Impression des gabarits : 100 %, sans ajustement.

## Validation

`npm run check:full` ; tests métier dans `frontend/tests/woodpilot-mobile.test.mjs`.
Installation Raspberry/Nginx Proxy Manager préparée dans `deploy/tools/README.md`.
Le périmètre et les conditions propres au téléphone sont détaillés dans `docs/mobile/FONCTIONNALITES.md`.
Aucun déploiement distant n’a été effectué.
