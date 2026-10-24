# Changelog

Technical changes, newest first. What a user sees of a version goes to `release-notes/`, in each language of the app.

## Unreleased

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
