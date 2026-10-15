# Shifts

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
```

## Install on Android

Open the deployed URL in Chrome. Use the **Install** button of Settings, or Chrome menu →
**Install app**.

## Release and deploy

1. Write the user-visible changes under `## Unreleased` in `CHANGELOG.md`.
2. `npm run release` (or `npm run release -- minor|major`). It commits `Bump version to X.Y.Z`
   and creates the tag `vX.Y.Z`.
3. `git push --follow-tags`. The workflow `.github/workflows/pages.yml` deploys the tag.

Set the repository's Pages source to "GitHub Actions" once.

## Design system

`styles.css` holds the tokens and the components in five layers. Open `/designs/` on the dev
server for the catalogue. `docs/spec/04-design-system.md` has the rules.
