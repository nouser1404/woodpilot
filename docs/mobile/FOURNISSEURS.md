# Fournisseurs dans la Toolbox

Module issu de WoodPilot-Codex-Carte-Fournisseurs-v1.0, intégré comme outil natif dans la bibliothèque CHANTIER. Ajout facultatif aux favoris via la bibliothèque ; les huit outils par défaut et les favoris existants restent conservés.

## Parcours
Recherche, bascule Liste / Carte, filtres repliés (pays, département/province, activité, service), favoris et tri « Autour de moi ». La fiche reprend coordonnées, services, source et date, liens appel/email/itinéraire, notes locales. Les options secondaires, limites de la sélection et export CSV se trouvent dans « Sources et export ». Les filtres actifs sont comptés même repliés. Couleurs et thème suivent les tokens de la Toolbox ; composants tactiles et fermeture identiques aux autres outils. Icône boutique locale en SVG pour éviter les glyphes manquants.

## Données et confidentialité
62 fiches, identifiants initiaux conservés : 55 françaises dans 12 départements, 7 belges dans le Hainaut et la Flandre-Occidentale. Sources consultées le 12/10/2026, sélection non exhaustive. Coordonnées de rue/commune approximatives signalées. La bande belge de 50 km concerne la frontière à vol d’oiseau, pas l’atelier ni le trajet routier.

JSON et CSV canoniques dans `frontend/public/woodpilot-mobile/suppliers/`. Favoris et notes reprennent les clés locales `wp-supplier-favorites` et `wp-supplier-notes`, avec récupération sûre des données invalides. Notes limitées à 4 000 caractères. Pas de compte ni de synchronisation serveur. La position sert uniquement au tri à vol d’oiseau ; elle n’est pas stockée, est effacée à la fermeture et peut être retirée par bouton. L’application ne demande la localisation que sur l’action explicite de l’utilisateur.

Leaflet 1.9.4 embarqué localement avec licence BSD et notices conservées. Les tuiles OpenStreetMap sont chargées à l’affichage, jamais précachées. Les données et assets sont inclus dans le cache du service worker ; les fiches et préférences sont utilisables hors connexion après installation. Le fond de carte, les sites externes et les itinéraires nécessitent Internet. Les liens téléphone/email dépendent des applications configurées sur l’appareil.

## Architecture
`suppliers-model.js` : contrat, recherche, filtres, distance, préférences. `suppliers-tool.js` : outil et fiches natives. `suppliers-map.js` : chargement différé de Leaflet, marqueurs, cadrage, attribution et erreurs des tuiles. Le CSS métier est scoped aux classes fournisseurs ; les styles globaux de la démo ne sont pas intégrés. Aucun iframe ni service worker concurrent.

## Validation et livraison
Validation du paquet : 51 IDs uniques, géographies et CSV cohérents. Tests purs dans `frontend/tests/suppliers.test.mjs`, suite complète du dépôt. Vérifications dans le navigateur à 375 × 812 : recherche, filtres combinés France/Nord/Quincaillerie/service, Belgique/Hainaut, carte et attribution, fiches, notes et favoris. Liens appel/email/itinéraire vérifiés sans appeler ni envoyer de message. Géolocalisation réelle sur iPhone et impression/téléchargement natif du CSV restent à vérifier sur l’appareil. Le cache des assets est vérifié ; une session intégralement hors réseau n’a pas été simulée.

Le serveur local accepte désormais CSV et notices TXT. En production, récupérer la nouvelle version puis reconstruire le conteneur tools conformément à `deploy/tools/README.md` ; aucune migration de base ou modification de l’API de gestion.

Audit npm exécuté : 7 alertes dans les dépendances existantes proxy-addr, sharp, shell-quote, source-map-js, sprintf-js/argparse/mammoth (3 modérées, 2 élevées, 2 critiques). Aucun package npm ni lockfile modifié par cette intégration. À traiter dans un chantier distinct de maintenance du dépôt ; cet audit ne couvre pas les bibliothèques statiques embarquées.

## Enrichissement du 12 octobre 2026
11 ajouts (IDs 52–62) : 2RA, Roger Bois, Ets Dacher, Scierie de la Selle, Scierie mobile Jamein, Tugny Wood Stock, Reims Bois, Legallais Rouen, Houcke et Boussemart, Les Bois Brayons, Scierie Lefebvre. Les 51 objets initiaux restent strictement identiques. Sources d’entreprise, sauf Les Bois Brayons et Scierie Lefebvre : annuaire officiel de l’interprofession Fibois Normandie, explicitement identifié dans la fiche. Les sources secondaires de services sont conservées dans `additionalSources`. Téléphones et emails non trouvés restent vides. Aucun tarif, stock ou horaire n’est extrapolé.

Géocodage des 11 adresses via Géoplateforme IGN / BAN ; libellés et communes examinés avant sélection. Repères à l’adresse pour dix fiches, repère de rue pour Legallais Rouen sans numéro. Le score représente la correspondance du géocodeur, pas la validation commerciale. Pour Jamein, le repère est l’adresse de contact d’une scierie mobile, pas un dépôt ouvert à la vente. Sources et date figurent dans chaque objet. Les nombres et dates de couverture affichés par l’application sont calculés depuis les données. CSV régénéré et contrôlé ; cache actualisé.

Sources complémentaires utiles : [services Dacher](https://www.dacher.fr/services.php), [services Tugny Wood Stock](https://tugny-wood-stock.fr/services/), [services Reims Bois](https://reims-bois.fr/services/). Les liens principaux des onze établissements sont dans `suppliers.json` et le CSV.

Maintenance : `python3 scripts/mobile/validate-suppliers.py` contrôle les données et la correspondance exacte du CSV. Après modification du JSON, `python3 scripts/mobile/validate-suppliers.py --write-csv` régénère le CSV. Attribuer de nouveaux IDs sans recycler les anciens.
