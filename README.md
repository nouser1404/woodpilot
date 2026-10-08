# WoodPilot outils

Boîte à outils mobile pour la menuiserie et l’agencement : cintrage, arêtiers, angles, pente, répartition, photo métré, caisson, débit, calpinage et chutes.

Application web autonome, avec calculs et dossiers conservés sur l’appareil. Ce dépôt contient uniquement les outils ; aucun serveur de gestion, compte client ni donnée de l’entreprise.

## Développement local

Node.js 20 ou ultérieur. Aucune dépendance à installer.

```bash
npm run dev:tools
```

Ouvrir http://localhost:5180/woodpilot-mobile/index.html.

```bash
npm run check:full
```

## Documentation

- [Fonctions et limites](frontend/public/woodpilot-mobile/README.md)
- [Spécifications](docs/mobile/CODEX.md)
- [Périmètre web](docs/mobile/FONCTIONNALITES.md)
- [Conventions des arêtiers](docs/mobile/ARETIERS.md)
- [Installation Raspberry / Nginx Proxy Manager](deploy/tools/README.md)

Le premier chargement prépare l’usage hors connexion. Exporter régulièrement une sauvegarde JSON : les données du navigateur ne sont pas synchronisées entre appareils.
