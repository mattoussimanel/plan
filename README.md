# 🌸 Ma Journée Rosée

PWA (React + Vite) : rappels et timeline de ma journée, installable sur mobile, hébergée sur GitHub Pages.

- `npm install && npm run dev` – développement
- `npm run build` – build de production (`dist/`)
- Déploiement automatique sur GitHub Pages à chaque push sur `main` (Settings → Pages → Source : **GitHub Actions**).

Notifications : elles sont envoyées à l'heure exacte tant que l'appli installée est ouverte/en arrière-plan.
Pour des alarmes fiables appli fermée, utiliser « Exporter vers mon agenda » (.ics, avec alarme) dans l'onglet *Moi*.
