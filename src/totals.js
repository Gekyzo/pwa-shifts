import { dayOf } from '#shifts';
import { addDays, daysBetween, weekStart, monthDays, shiftLength } from '#dates';

// The planned minutes of a type: the length of a work shift less its break, 0 for the others.
export const minutesOf = (type) => (type?.kind === 'work' ? shiftLength(type.start, type.end) - type.breakMin : 0);

// The work minutes and the count of days of each type from `from` to `to`, both included.
export const totals = (state, from, to) => {
  const days = {};
  let workMinutes = 0;
  for (let i = 0; i <= daysBetween(from, to); i += 1) {
    const { type } = dayOf(state, addDays(from, i));
    if (!type) continue;
    days[type.id] = (days[type.id] ?? 0) + 1;
    workMinutes += minutesOf(type);
  }
  return { workMinutes, days };
};

export const weekTotals = (state, date) => {
  const start = weekStart(date);
  return totals(state, start, addDays(start, 6));
};

export const monthTotals = (state, month) => {
  const days = monthDays(month);
  return totals(state, days[0], days.at(-1));
};
