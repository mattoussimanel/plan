# 🌸 Ma Journée Rosée

PWA (React + Vite) : rappels et timeline de ma journée, installable sur mobile, hébergée sur GitHub Pages.

## Commandes
- `npm install && npm run dev` – développement
- `npm test` / `npm run test:watch` / `npm run coverage` – tests (Vitest + Testing Library)
- `npm run build` – build de production (`dist/`, icônes PNG générées depuis `public/icon.svg`)

Déploiement automatique sur GitHub Pages à chaque push sur `main` (tests → build → déploiement ; Settings → Pages → Source : **GitHub Actions**).

## Structure de `src/`
| Dossier | Rôle |
| --- | --- |
| `data/` | contenus : citations, motivations, tâches par défaut, listes de choix |
| `lib/` | logique pure et testée : dates, tâches/récurrence, progression & série, stockage, rappels, notifications, export `.ics` |
| `state/` | `reducer.js` : toutes les actions de l'état global |
| `hooks/` | `useAppState` (persistance), `useNow`, `useReminders`, `useConfetti` |
| `components/` | vues (`TodayView`, `TasksView`, `SettingsView`), `Timeline`, `TaskEditor`, etc. |
| `styles/` | CSS découpé par thème (base, layout, timeline, formulaires, navigation…) |

## Notifications
Elles sont envoyées à l'heure exacte tant que l'appli installée est ouverte ou en arrière-plan.
Pour des alarmes fiables appli fermée : onglet *Moi* → « Exporter vers mon agenda » (.ics avec alarme).
