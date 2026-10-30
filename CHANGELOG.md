# Changelog

Technical changes, newest first. What a user sees of a version goes to `release-notes/`, in each language of the app.

## Unreleased

No change.

## 0.2.10 - 2026-10-31

- The What's new notes show `**bold**` text in `<strong>` (VER-22): `textParts` of `src/onboarding.js` gives a part between two `**` with `strong: true`, a key in it too; a `**` with no pair stays as text.
- **Delete all data** in Settings › Backup, as in pwa-template (SET-2): `resetAll` in `src/storage.js` removes each `localStorage` key of the app, `<slug>.*`, and no key of another app of the origin; the page loads again as a new install. With a session the question says that it also logs out (`signedIn` of `src/ui/account.js`). Keys `settings.reset`, `reset.confirm`, `reset.confirmLocal`, `error.resetFailed`.

## 0.2.9 - 2026-10-27

- New art in `icons/source.png`: a calendar split into a day half (sun) and a night half (moon). The PNG icons and `icons/logo.png` are written again by `npm run icons`.

## 0.2.8 - 2026-10-25

- Google sign-in and the approval gate of the PocketBase server, with an offline choice, as in `pwa-wardrobe` (ACC-1 to ACC-10, `docs/spec/09-account.md`): `src/pocketbase.js`, `src/session.js`, `src/ui/account.js`. The app opens for an approved Google account or, after **Use offline**, with no account. Nothing syncs. Keys `pwa-shifts.session`, `pwa-shifts.offline` and `pwa-shifts.oauth` (`sessionStorage`). The shell cache is `pwa-shifts-shell-v5`.

## 0.2.7 - 2026-10-24

- `app.title` is a translated descriptor, then the brand (`<descriptor> - <short_name>`), so the title follows the language; the static `<title>` and the manifest `name` and `description` hold the fallback text of their `lang`. A test in `tests/i18n.test.js` keeps them in step.

## 0.2.6 - 2026-10-24

- Release notes: `release-notes/<lang>.md`, one file per catalog, released with the version by `npm run release`, which stops when the languages disagree. The app shows the unseen versions in a What's new sheet after an update (`nextSeen`, seen version in storage) and every version from Settings › Help. This file is now the technical record.

## 0.2.5 - 2026-10-24

- The message that shows after an action, with its undo, is a raised card in the colours of the screen. It is no longer a black box in light and a white box in dark.

## 0.2.4 - 2026-10-24

- Settings groups its rows as in the other apps: each preference shows its value, Export and Import are rows.

## 0.2.3 - 2026-10-24

- The icon of Settings is a gear, as in the other apps of the family.

## 0.2.2 - 2026-10-24

- The app is now called **Rota**.
- The look of design system 0.7.1: the Geist font, the stone ground, smaller corners and heads in the colour of the text.
- Each sheet has a head with its title and a close button, and its actions stay at the bottom. A drag down from the head closes it.
- With no shift type, Plan offers **Add shift type**.

## 0.2.1 - 2026-10-16

- A new app icon, drawn in the style that the family of apps shares.

## 0.2.0 - 2026-10-15

- Track your own work shifts: create shift types (work with its hours and break, day off, leave)
  and a cycle that repeats them from a start date.
- Month shows each day's shift, marks the days you changed and the days with a note, and totals
  the hours of each week and of the month.
- Tap a day to change its shift, set it back to the cycle, or write a note, with undo.
- Agenda lists your shifts from today, week by week; turn it off in Settings.
- The notes demo of the template is gone.

## 0.1.1 - 2026-10-15

- Chrome now offers to install the app when another app of the same site is installed.
