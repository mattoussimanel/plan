# 🌸 Ma Journée Rosée

Application Android (React + Vite empaqueté avec Capacitor) : rappels et timeline de ma journée, avec notifications exactes même appli fermée.

## Commandes
- `npm install && npm run dev` – développement dans le navigateur
- `npm test` / `npm run test:watch` / `npm run coverage` – tests (Vitest + Testing Library)
- `npm run build` – build de production (`dist/`, icônes PNG générées depuis `public/icon.svg`)

## Structure de `src/`
| Dossier | Rôle |
| --- | --- |
| `data/` | contenus : citations, motivations, tâches par défaut, listes de choix |
| `lib/` | logique pure et testée : dates, tâches/récurrence, progression & série, stockage, rappels, notifications, export `.ics` |
| `state/` | `reducer.js` : toutes les actions de l'état global |
| `hooks/` | `useAppState` (persistance), `useNow`, `useReminders`, `useConfetti` |
| `components/` | vues (`TodayView`, `TasksView`, `SettingsView`), `Timeline`, `TaskEditor`, etc. |
| `styles/` | CSS découpé par thème (base, layout, timeline, formulaires, navigation…) |

## Application Android (APK)
L'appli est aussi empaquetée en application Android native avec **Capacitor** (`android/`).
Les rappels sont des **notifications locales exactes** programmées par Android (AlarmManager) : elles sonnent à l'heure exacte,
**appli fermée** et même après un redémarrage du téléphone.

- À chaque push sur `main`, le workflow *Build Android APK* teste, construit et signe l'APK, puis le publie :
  - dans l'onglet **Releases** du dépôt (tag `apk-latest`) → télécharge `Ma-Journee-Rosee.apk` sur le téléphone ;
  - en artefact du run (onglet Actions).
- Installation : ouvrir le fichier APK sur le téléphone, autoriser « sources inconnues », puis accepter les notifications au premier lancement.
- Build local (JDK 21 + Android SDK) : `npm run build && npx cap sync android && cd android && ./gradlew assembleRelease`.
- Icônes/écran de démarrage : `node scripts/android-assets.mjs`.

## Notifications (version web)
Elles sont envoyées à l'heure exacte tant que l'appli installée est ouverte ou en arrière-plan.
Pour des alarmes fiables appli fermée : onglet *Moi* → « Exporter vers mon agenda » (.ics avec alarme).
