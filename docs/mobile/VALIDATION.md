# Recette V1 locale — 7 octobre 2026

`npm run check:full` terminé avec succès : 330 tests API, 65 tests frontend
Vitest et 35 tests Node, dont 14 tests métier spécifiques à la boîte à outils.
Compilation TypeScript, build frontend et contrôle de structure réussis.
Les fichiers historiques dépassant les tailles cibles restent signalés par le dépôt.
Les changements de stock déjà présents dans le workspace ne font pas partie de cette V1.

## Vérifications dans l’application servie

- Saisie de cotes et calculs cintrage, angles, pente et répartition.
- Photo importée, tracé manuel d’une cote de 1842 mm, enregistrement,
  rechargement et réouverture avec photo et cote conservées.
- Caisson par défaut transféré au débit : deux côtés, deux dessus/dessous,
  une tablette et un fond ; calpinage séparé de 19 et 6 mm.
- Arêtiers réguliers : 500 mm de longueur pour R=300, H=400 ; résultats
  comparés au dépôt de référence et cas désaxé couvert par les tests.
- Favori retiré puis rechargement : retrait conservé ; recherche et ajout vérifiés.
- Sauvegarde JSON exportée puis réimportée : copie du dossier et de ses trois
  résultats, sans écrasement. Duplication, retrait et restauration de résultat vérifiés.
  Le dossier importé de recette a été déplacé dans la corbeille récupérable.
- Serveur local arrêté, page rechargée : roue, dossier et calpinage fonctionnels.
  Serveur relancé ensuite. Les fichiers sont servis sans transformation via `dev:tools`.
- PDF réel de calpinage relu : trois pages avec synthèse et deux panneaux,
  images JPEG présentes, rendu visuel contrôlé. PNG et PDF ne nécessitent pas l’API.
- Écran de calpinage contrôlé en portrait et paysage, paramètres secondaires repliés,
  défilement et commandes accessibles.

## À vérifier sur les appareils cibles avant publication

Caméra physique, installation PWA et partage natif sur iOS/Android. La recette
du navigateur local ne confirme pas les fonctions du matériel ou des applications
externes. L’optimisation de découpe reste indicative et les gabarits sans compensation.

Aucun déploiement distant ni migration API n’a été effectué. Les instructions
Raspberry/Nginx Proxy Manager sont préparées dans `deploy/tools/README.md`.

## Extension des fonctions détaillées — 8 octobre 2026

Périmètre confirmé : les fonctions détaillées de CODEX.md, sans les outils simplement
cités comme idées. Inventaire complet : `FONCTIONNALITES.md`.

`npm run check:full` passe : 330 tests API, 65 tests frontend et 41 tests Node,
soit 436 tests. Parmi eux, 20 tests métier de la boîte à outils. Les nouvelles
couvertures comprennent les expressions (sans exécution de code), la détection de
quatre arêtes d’un rectangle contrasté, la sélection tactile, les annotations,
la réorganisation et l’import de chutes sans recréer du stock utilisé.

Recette réelle dans l’aperçu local :

- `1842 - 2*19` applique une cote de 1804 mm au calculateur de cintrage.
- Sélection 18 mm dans le picker, puis saisie personnalisée 21,5 mm : la valeur
  reste modifiable et ne se valide pas avant l’action explicite.
- Favori déplacé puis rechargement : ordre conservé ; écran vérifié sur téléphone.
- Photo V1 réouverte sans perte : quatre arêtes détectées, tap sur le bord supérieur,
  saisie d’une cote, ajout de « Prise à déplacer » et note technique.
- Association de la cote 1842 mm à la largeur du caisson : pièces recalculées,
  dessus/dessous à 1804 mm avec épaisseur 19 mm.
- Notes du dossier et annotations conservées après rechargement.
- PDF de photo à deux pages (image annotée et notes) et PNG relus visuellement.
  Les arêtes proposées et points en cours ne sont pas inclus dans l’export.
- Chute 800 × 400 × 19 mm utilisée pour deux tablettes de 600 × 400 mm : un seul
  panneau, une pièce non placée. Le rectangle 196 × 400 mm restant est conservé.
  Un second clic ne duplique pas ce plan. Le catalogue est conservé après reload.
- Réimportation d’une sauvegarde complète : dossiers copiés, notes et chutes
  conservées ; la chute marquée utilisée reste utilisée et le stock n’est pas doublé.
  Copies de recette déplacées dans la corbeille récupérable.
- Serveur arrêté puis page rechargée : dossiers, annotations et détection locale
  fonctionnent. Serveur relancé ensuite sur le port 5180.

Les essais de détection utilisent une image de recette synthétique, pas un relevé
chantier représentatif de toutes les conditions de lumière. Le mode manuel reste
accessible. La caméra réelle, les boutons matériels, le partage natif et l’installation
sur les téléphones cibles gardent les conditions indiquées dans `FONCTIONNALITES.md`.
