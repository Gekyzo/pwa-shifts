// Calendar dates as `YYYY-MM-DD` strings and times of day as `HH:MM`. The arithmetic runs in
// UTC, so a change of the clock never moves a date.
const DAY_MS = 86400000;
const DAY_MINUTES = 1440;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const toMs = (date) => Date.parse(`${date}T00:00:00Z`);
const fromMs = (ms) => new Date(ms).toISOString().slice(0, 10);
const pad = (n) => String(n).padStart(2, '0');

export const isDate = (value) => typeof value === 'string' && DATE.test(value) && !Number.isNaN(toMs(value)) && fromMs(toMs(value)) === value;
export const isTime = (value) => typeof value === 'string' && TIME.test(value);

export const addDays = (date, n) => fromMs(toMs(date) + n * DAY_MS);
export const daysBetween = (a, b) => Math.round((toMs(b) - toMs(a)) / DAY_MS);

// 0 for Monday, 6 for Sunday.
export const weekday = (date) => (new Date(toMs(date)).getUTCDay() + 6) % 7;
export const weekStart = (date) => addDays(date, -weekday(date));

// The ISO week: the week of the Thursday of the date, in the year of that Thursday.
export const isoWeek = (date) => {
  const thursday = addDays(date, 3 - weekday(date));
  const year = Number(thursday.slice(0, 4));
  return { year, week: Math.floor(daysBetween(`${year}-01-01`, thursday) / 7) + 1 };
};

// A month is { year, month }, with the month from 1 to 12.
export const monthOf = (date) => ({ year: Number(date.slice(0, 4)), month: Number(date.slice(5, 7)) });

export const addMonths = ({ year, month }, n) => {
  const index = year * 12 + (month - 1) + n;
  return { year: Math.floor(index / 12), month: (((index % 12) + 12) % 12) + 1 };
};

const firstOf = ({ year, month }) => `${year}-${pad(month)}-01`;

export const monthDays = (month) => {
  const first = firstOf(month);
  const length = daysBetween(first, firstOf(addMonths(month, 1)));
  return Array.from({ length }, (_, i) => addDays(first, i));
};

// Six weeks from the Monday on or before the first day of the month.
export const monthGrid = (month) => {
  const start = weekStart(firstOf(month));
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
};

// The date of the calendar of the phone at the moment `when`.
export const dateOf = (when) => `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}`;

const toMinutes = (time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

// The minutes from `start` to `end`. An end at or before the start is on the next day.
export const shiftLength = (start, end) => {
  const length = toMinutes(end) - toMinutes(start);
  return length > 0 ? length : length + DAY_MINUTES;
};
