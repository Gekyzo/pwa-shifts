# Shifts

The domain of the app: the work shifts of one worker. The rules of `src/shifts.js`.

## Doc

- **SHF-1** The doc is `{ version: 1, types, cycles, days }`, stored as JSON under
  `pwa-shifts.shifts`. `types` is a list of `{ id, code, name, color, kind, start, end,
  breakMin }`. `cycles` is a list of `{ from, steps }`, sorted by `from`, where `from` is a date
  `YYYY-MM-DD` and each step is the id of a type or `null`. `days` maps a date to
  `{ type, note }`, both optional: no `type` follows the cycle, `null` is no shift, an id is an
  override. A stored doc that is not valid is kept under `pwa-shifts.shifts.corrupt`, and the
  app starts with the empty doc: no types, no cycles, no days.
- **SHF-2** `normalizeShifts` accepts a doc of version 1 whose types pass the checks of SHF-3 and
  have a non-empty id, no id two times. It drops unknown fields. It drops a cycle with a `from`
  that is not a date or with no steps, and the second cycle of one `from`. A step that names no
  type becomes `null`. It drops a day whose key is not a date, a `type` that names no type, and a
  note that is not text or is blank; it trims a note and cuts it to 200 characters. So a backup
  with a reference to a deleted type still loads.

## Types

- **SHF-3** `addType` adds a type at the end of the list. The name is trimmed, 1 to 30
  characters (`error.typeNameRequired`, `error.textTooLong`). The code is trimmed, 1 to 3
  characters (`error.codeLength`). A colour that is not in `COLORS` is the first one, and a kind
  that is not `work`, `off` or `leave` is `work`.
- **SHF-4** A `work` type has a start and an end `HH:MM` (`error.timeInvalid`). An end at or
  before the start is on the next day: the shift belongs to the day it starts. The break is a
  whole number of minutes, 0 when empty, less than the length of the shift
  (`error.breakTooLong`). An `off` or `leave` type has no times and no break.
- **SHF-5** `editType` changes one type with the checks of SHF-3 and SHF-4. `deleteType` removes
  a type that no step and no override names; else it is `error.typeInUse`. An id that names no
  type is `error.typeMissing`, and nothing changes.

## Cycles

- **SHF-6** `setCycle` adds a cycle from a date, or replaces the cycle of the same date. A `from`
  that is not a date is `error.dateInvalid`; no step is `error.cycleEmpty`; more than 366 steps
  is `error.cycleTooLong`; a step that is not `null` and names no type is `error.typeMissing`.
- **SHF-7** `removeCycle` removes the cycle of one `from`; a `from` with no cycle is
  `error.cycleMissing`.

## Days

- **SHF-8** `setDay` gives a date a type or `null`, and keeps its note. `resetDay` removes the
  type, so that the cycle applies again, and keeps the note. A date that is not valid is
  `error.dateInvalid`.
- **SHF-9** `setNote` trims the text. A blank text removes the note; more than 200 characters is
  `error.textTooLong`. A date with no type and no note leaves `days`.

## The shift of a date

- **SHF-10** `dayOf` gives `{ type, source, note }`. An override wins (`override`). Else the
  cycle with the latest `from` on or before the date applies (`cycle`), and its step is the count
  of days from `from`, modulo the count of steps. Else there is no shift (`none`). A date before
  the first cycle is `none`.

## Totals

The rules of `src/totals.js`.

- **TOT-1** The planned minutes of a `work` type are the length of the shift less its break. A
  day off, a leave and a day with no shift count 0 minutes.
- **TOT-2** `totals` of a range, both ends included, is the sum of the planned minutes of each
  date (SHF-10) and the count of the dates of each type. A shift past midnight counts on the day
  it starts.
- **TOT-3** A week runs from Monday to Sunday, and may cross two months. A month is its calendar
  days.
