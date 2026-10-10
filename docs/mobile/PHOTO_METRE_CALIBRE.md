# Photo Métré — lot 1

Deux modes dans l’outil existant : cotation manuelle et mesure calibrée. Aucun serveur ne reçoit les images. Import JPEG/PNG/WebP, limite 25 Mo et 32 mégapixels ; les données originales sont conservées, sans redimensionnement. L’orientation est celle appliquée par le décodeur d’image du navigateur (à vérifier sur les appareils ciblés).

## Utilisation

1. `npm run dev:tools`, ouvrir http://localhost:5180/woodpilot-mobile/index.html.
2. Photo Métré → Mesure calibrée. Imprimer le PDF fourni à 100 %, sans ajustement. Vérifier au réglet le bord extérieur noir : **50 mm**. Le PNG ne définit pas une taille physique d’impression.
3. Poser le marqueur entier, à plat sur le même plan que les points mesurés. Importer/prendre une photo.
4. Détecter : vérifier le contour des quatre coins puis confirmer DICT_4X4_50, ID 0, 50 mm.
5. Toucher A puis B ou tracer le segment. Toucher une cote dans la liste pour sélectionner ses extrémités et les déplacer. Zoom ±, molette/pincement ; déplacer la vue avec la commande dédiée. Les points restent enregistrés en coordonnées normalisées de l’image source.
6. Nouvelle mesure, Recalibrer ou remplacer la photo. Enregistrer dans un projet local ; partager image/PDF. Les exports comportent l’origine des cotes et l’avertissement de vérification au mètre. Chaque cote conserve sa propre calibration, même après recalibration.

Le repli **Distance connue** demande deux points et leur distance réelle. Il applique uniquement une échelle dans les pixels source : **mesure approximative, photo de face seulement, sans correction de perspective**.

## Calcul et dépendance

Homographie à huit coefficients, résolution avec pivotement après normalisation des coordonnées. Quatre coins du marqueur → (0,0), (50,0), (50,50), (0,50) mm. Distance euclidienne après transformation des deux points. Calibration dégénérée, perspective extrême et points à l’horizon sont rejetés.

Détecteur local js-aruco2, source officielle https://github.com/damianofalcioni/js-aruco2, commit `0491d5d228746411d0e9dd602b98f48636a644ba`. Adaptation des exports en modules ES et limitation au dictionnaire 4×4/50, codes issus d’OpenCV 4.x `modules/objdetect/src/aruco/predefined_dictionaries.hpp` (50 premières entrées de 4×4/1000). Copyright MIT conservé dans les fichiers. Aucun OpenCV.js distant ; aucun chargement CDN. Fichiers modifiables livrés et licence upstream jointe. L’analyse utilise un Worker et une copie réduite à 1800 px maximum, sans modifier la photo originale. Décodage exact, sans correction de bits ; un marqueur abîmé peut être refusé.

La mesure concerne uniquement le plan du marqueur. Déformation optique du téléphone, flou, impression incorrecte, placement des points et extrapolation loin du marqueur peuvent affecter le résultat. Aucune tolérance certifiée. Aucune mesure 3D, profondeur, OCR ou multi-plan. Plusieurs marqueurs décodables sont refusés ; un second marqueur masqué/non décodable peut ne pas être reconnu.

## Validation

`node --test frontend/tests/photo-calibration.test.mjs frontend/tests/woodpilot-mobile.test.mjs frontend/tests/screen-awake.test.mjs`

Les tests automatisés détectent réellement les pixels de marqueurs synthétiques ID 0/1, refusent absence, masquage, multiplicité et taille insuffisante ; vérifient l’homographie oblique, les cas dégénérés et le repli avec ratio d’image non carré. Les tests mathématiques exacts ne constituent pas un relevé physique de précision.

### Validation à réaliser sur Safari iPhone et Chrome Android

- Servir l’app en HTTPS et attendre « Prêt hors connexion ». Ouvrir Photo Métré sans projet ; tester appareil photo et galerie (y compris refus de caméra).
- Imprimer et contrôler 50 mm au réglet. Photographier un panneau avec distances connues dans le même plan, de face puis en perspective modérée. Répéter trois placements A/B par distance ; noter référence, résultat, erreur absolue et erreur relative, sans tolérance promise.
- Tester mauvais ID, marqueur coupé, flou, petit, absent et deux marqueurs. Vérifier l’absence de nouvelle cote avant confirmation ou en cas d’erreur.
- Tester une photo EXIF tournée, 12/24 MP, zoom/pincement/pan, rotation portrait/paysage et déplacement de A/B ; vérifier les mêmes pixels d’ancrage.
- Enregistrer, rouvrir et exporter image/PDF ; vérifier provenance par cote, warning, annotations et notes. Vérifier le message en cas de stockage refusé/saturé ; exporter la sauvegarde locale.
- Couper le réseau après installation : détection et calcul disponibles ; contrôler dans l’inspecteur qu’aucune requête ne transporte de photo.
- Laisser l’app visible au-delà du délai normal de veille : écran actif. Passer en arrière-plan et revenir ; vérifier réactivation. Tester également le mode économie d’énergie : le système peut refuser le verrou.

Tests physiques smartphone et métrologie avec impression réelle non réalisés dans cet environnement.

### Résultat synthétique observé et état de livraison

Fixture oblique générée dans les tests : référence **80 mm**, mesure après détection **80,280791 mm** ; erreur absolue **0,280791 mm**, relative **0,350989 %**. Cela mesure uniquement la rasterisation/détection de cette image synthétique, aucune précision de téléphone ou d’impression.

Fichiers ajoutés : `photo-calibration.js`, `aruco-detector.js`, `aruco-worker.js`, `photo-calibrated-ui.js`, `photo-viewport.js`, `screen-awake.js`, `vendor/aruco/` et `markers/`. Intégration dans `photo-tool.js`, `photo-model.js`, `app.js`, `index.html`, `styles.css`, `sw.js` et serveur `scripts/tools-preview.mjs` (MIME PDF). Tests ciblés : `photo-calibration.test.mjs`, `screen-awake.test.mjs`. Détecteur ~30 Ko JS, sans runtime OpenCV/WASM.

Validation locale : interface des modes et maintien d’écran observés dans Chrome. L’import automatisé via l’extension Chrome a été bloqué par sa permission d’accès aux fichiers ; le parcours complet de photo, zoom et export reste donc à vérifier manuellement sur les téléphones ciblés. Détection des pixels du PNG canonique vérifiée séparément avec le détecteur réel.

`npm run check:full` passe. L’audit npm du dépôt général signale 7 vulnérabilités dans les dépendances existantes (`proxy-addr`, `sharp`, `shell-quote`, `source-map-js`, `sprintf-js` et dépendances indirectes) ; aucune dépendance npm ni lockfile n’a été modifié par ce lot. Le détecteur embarqué n’est pas évalué par npm audit. Ces correctifs du dépôt général restent hors de cette livraison mobile.
