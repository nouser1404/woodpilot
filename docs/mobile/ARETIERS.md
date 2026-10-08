# Arêtiers — conventions et référence

Référence fournie : https://github.com/nouser1404/appcalpi/tree/main/Aretiers
Commit examiné : `cb5d83679981ade8a6202c22ca5bac11c55878f4`.
Les fichiers effectivement chargés par l’index sont sous `Aretiers/js/`.

L’adaptation mobile calcule une pyramide à base polygonale régulière, éventuellement
désaxée. Les sommets sont `(R cos(2πi/n), R sin(2πi/n), 0)` et le sommet est
`(dx, dy, H)`. Les normales des faces viennent du produit vectoriel.

- δ est l’angle entre les normales, comme dans le dépôt fourni.
- Le biseau de référence est δ/2.
- Le « réglage outil » de référence est 90° − δ/2.
- L’angle dièdre intérieur vaut 180° − δ ; il ne faut pas le confondre avec δ.

La V1 affiche les deux angles de référence et leur formule, sans les présenter
comme une convention universelle de graduation de scie. Les longueurs et gabarits
sont des dimensions extérieures ; aucune compensation d’épaisseur, de jeu ou de
trait de scie n’est appliquée.

Les tronquages sont des hauteurs depuis la base, strictement inférieures à H.
Le plus haut tronquage définit le bord supérieur de la face exportée. Les longueurs
d’arêtiers affichées sont limitées à ce tronquage. Les angles restent ceux des faces
complètes, car le plan de la face ne change pas.

Correction géométrique locale : le centre d’une section désaxée est
`(dx*z/H, dy*z/H, z)`, pas `(dx,dy,z)`. Le modèle ne calcule donc pas un « rayon »
à partir du centre incorrect de la référence.

Les tests couvrent la pyramide régulière de 6 faces (R=300, H=400), les valeurs
numériques d’un sommet désaxé à 5 faces et les longueurs du gabarit tronqué.

# Choix du moteur de calpinage

Référence comparée : https://github.com/nouser1404/calpi (fichier `js/solver2d.js`).
Commit examiné : `f1bea4fc06714879e116af7fc10877048c25603d`.
Ce moteur essaie plusieurs ordres et orientations de panneaux, et expose davantage
de paramètres de présentation. L’orientation du panneau peut toutefois changer
l’axe du fil même quand la rotation des pièces est interdite ; les pièces hors format
sont aussi ajoutées à des panneaux vides dans cette version.

La V1 réutilise donc directement le moteur déjà testé de Woodpilot :
`frontend/public/agencement-configurator/panel-nesting.js`.
Le module mobile `manufacturing.js` valide les entrées, limite le nombre de pièces,
sépare les épaisseurs et transmet les mêmes références P1, P2… aux plans et aux listes.
L’algorithme est une heuristique déterministe de placement rectangulaire. Il ne
garantit pas le nombre minimal de panneaux et n’expose pas de séquence de coupe.
