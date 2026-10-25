# Rota

An offline Android PWA to track your own work shifts. Plain HTML, CSS and ES modules: no build
step and no dependencies.

- **Plan:** shift types (work with its hours and break, day off, leave) and cycles that repeat
  them from a start date, such as `M M N N – – – –`.
- **Month:** each day's shift on its colour, the hours of each week and of the month. Tap a day
  to change its shift, set it back to the cycle, or write a note.
- **Agenda:** your shifts from today, week by week.
- Backup to a JSON file and restore, English and Spanish, light and dark themes, offline use and
  an update check.

The specification is `docs/spec/`; `docs/spec/08-shifts.md` has the rules of the shifts.

## Develop

```sh
npm run serve   # http://localhost:8080
npm test
npm run ds      # copy the design system again from ../pwa-design-system
```

## Account and set-up outside the app

The app opens with **Sign in**: **Continue with Google** (an account on the PocketBase server of
`pwa-server`, approved per app) or **Use offline** (no account). The shifts stay on the device in
both modes; nothing syncs. The rules are in [docs/spec/09-account.md](docs/spec/09-account.md).

The server slug is `APP_SLUG` of `src/config.js`, which `npm run init` rewrites. Two steps happen
outside the app, and the app works offline without them:

1. A row in `apps` on the server (`/_/`): slug `APP_SLUG`, url `https://<user>.github.io/<slug>/`.
2. The redirect URIs `https://<user>.github.io/<slug>/` and `http://localhost:8080/` on the
   Google OAuth client.

## Install on Android

Open the deployed URL in Chrome. Use the **Install** button of Settings, or Chrome menu →
**Install app**.

## Release and deploy

1. Write the technical changes under `## Unreleased` in `CHANGELOG.md`, and the user-visible
   changes under `## Unreleased` in every `release-notes/<lang>.md`.
2. `npm run release` (or `npm run release -- minor|major`). It commits `Bump version to X.Y.Z`
   and creates the tag `vX.Y.Z`.
3. `git push --follow-tags`. The workflow `.github/workflows/pages.yml` deploys the tag.

Set the repository's Pages source to "GitHub Actions" once.

## Design system

The shared tokens, components and layouts come from `pwa-design-system`, copied into
`vendor/design-system/` by `npm run ds`; `SOURCE.json` there names the version and the commit.
`index.html` loads `vendor/design-system/design-system.css`, then `styles.css`, which holds the
parts of the app only. Change a shared part in `pwa-design-system`, then run `npm run ds`; never
edit `vendor/` by hand. Open `/designs/` on the dev server for the catalogue.
`docs/spec/04-design-system.md` has the rules of the app and points to the shared ones.
