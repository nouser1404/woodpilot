# Installer les outils sur tools.woodpilot.fr

Application statique autonome. L’image contient seulement les outils et le moteur de calpinage.

## Raspberry avec Nginx Proxy Manager

Depuis la racine de ce dépôt :

```bash
docker compose -p woodpilot-tools -f deploy/tools/compose.yml up -d --build
```

Le service `tools` expose le port 80 uniquement sur le réseau Docker. Pour le rendre accessible à Nginx Proxy Manager, connecter ce service au réseau Docker réellement utilisé par NPM (nom à vérifier sur le Raspberry). Ajouter par exemple un fichier `deploy/tools/compose.npm.yml` :

```yaml
services:
  tools:
    networks:
      - npm
networks:
  npm:
    external: true
    name: NOM_DU_RESEAU_NPM
```

Puis démarrer avec les deux fichiers :

```bash
docker compose -p woodpilot-tools -f deploy/tools/compose.yml -f deploy/tools/compose.npm.yml up -d --build
```

Configurer le DNS de `tools.woodpilot.fr` vers le Raspberry. Dans NPM, créer un Proxy Host pour ce domaine : schéma `http`, serveur `tools`, port `80`, certificat Let's Encrypt et Force SSL.

Vérifier les calculs, photo cotée, dossiers et exports. Attendre « Prêt hors connexion », puis tester sans réseau. Tester caméra, installation PWA et partage sur les téléphones cibles.

Pour passer de localhost au domaine public, exporter puis importer une sauvegarde JSON. Aucun déploiement n’est réalisé par l’envoi de ce dépôt sur GitHub.
