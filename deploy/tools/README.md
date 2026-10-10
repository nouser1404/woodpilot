# WoodPilot — tools.woodpilot.fr

Application statique autonome. Aucun accès à l’API, aux comptes ou aux données de gestion.
Les outils sont locaux et utilisables sans projet. Périmètre : `frontend/public/woodpilot-mobile/README.md`.

## Aperçu local

`npm run dev:tools`, puis ouvrir http://localhost:5180/woodpilot-mobile/index.html.

## Installation sur la production Raspberry / Nginx Proxy Manager

Depuis la racine du dépôt sur le serveur, avec la stack production existante :

```bash
docker compose --env-file .env.prod -p ogm-prod -f docker-compose.prod.yml -f deploy/tools/compose.yml build tools
docker compose --env-file .env.prod -p ogm-prod -f docker-compose.prod.yml -f deploy/tools/compose.yml up -d --no-deps tools
```

Adapter le nom du projet Docker et le chemin du fichier d’environnement à l’installation
réelle. Ces commandes démarrent seulement le service `tools` dans le réseau existant.

Configurer un enregistrement DNS A (et AAAA seulement si IPv6 fonctionne) pour
`tools.woodpilot.fr` vers le serveur. Dans Nginx Proxy Manager, créer un Proxy Host :

- domaine : `tools.woodpilot.fr` ;
- schéma amont : `http`, serveur : `tools`, port : `80` ;
- certificat Let's Encrypt pour ce domaine, puis Force SSL.

Vérifier `https://tools.woodpilot.fr/`, puis modifier une cote et partager le résultat.
HTTPS permet le partage natif et l’installation PWA selon le navigateur. Après une
première visite réussie, attendre « Prêt hors connexion ». Polices et moteur de
calpinage sont servis localement et inclus dans le cache.

Vérifier les outils, une photo cotée, un dossier enregistré et les exports PNG/PDF/CSV,
puis fermer la connexion et recharger l’application. Tester caméra, partage natif et
installation sur iOS et Android. L’aperçu local ne confirme pas ces fonctions natives.

Les dossiers restent propres à l’appareil et à l’origine du navigateur. Pour passer de
localhost au domaine public, exporter puis importer une sauvegarde JSON. Aucune
synchronisation de comptes n’est prévue dans cette V1.

À chaque livraison, incrémenter la version de cache dans `sw.js`.
La préparation ci-dessus n’effectue aucun déploiement ; vérifier la stack et le réseau
réel du Raspberry avant d’appliquer les commandes.
