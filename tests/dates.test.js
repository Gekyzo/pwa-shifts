import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isDate,
  isTime,
  addDays,
  daysBetween,
  weekday,
  weekStart,
  isoWeek,
  monthOf,
  addMonths,
  monthDays,
  monthGrid,
  dateOf,
  shiftLength,
} from '#dates';

test('a date is YYYY-MM-DD of a real day', () => {
  for (const date of ['2024-02-29', '2026-01-01', '2026-12-31']) assert.equal(isDate(date), true, date);
  for (const date of ['2023-02-29', '2026-13-01', '2026-00-10', '2026-1-01', '2026-01-32', '', null, undefined, 20260101]) {
    assert.equal(isDate(date), false, String(date));
  }
});

test('a time is HH:MM from 00:00 to 23:59', () => {
  for (const time of ['00:00', '07:30', '23:59']) assert.equal(isTime(time), true, time);
  for (const time of ['24:00', '7:00', '12:60', '', null, '12:00:00']) assert.equal(isTime(time), false, String(time));
});

test('addDays goes over the end of a month and of a year', () => {
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2024-03-01', -1), '2024-02-29');
  assert.equal(addDays('2026-10-15', 0), '2026-10-15');
});

test('daysBetween is the second date less the first', () => {
  assert.equal(daysBetween('2026-10-01', '2026-09-30'), -1);
  assert.equal(daysBetween('2026-01-01', '2027-01-01'), 365);
  assert.equal(daysBetween('2026-03-28', '2026-03-30'), 2);
});

test('the week starts on Monday', () => {
  assert.equal(weekday('2026-10-12'), 0);
  assert.equal(weekday('2026-10-18'), 6);
  assert.equal(weekStart('2026-10-18'), '2026-10-12');
  assert.equal(weekStart('2026-10-12'), '2026-10-12');
});

test('the ISO week is the week of its Thursday', () => {
  assert.deepEqual(isoWeek('2027-01-01'), { year: 2026, week: 53 });
  assert.deepEqual(isoWeek('2026-12-28'), { year: 2026, week: 53 });
  assert.deepEqual(isoWeek('2026-01-01'), { year: 2026, week: 1 });
  assert.deepEqual(isoWeek('2026-10-15'), { year: 2026, week: 42 });
});

test('months go over the end of a year', () => {
  assert.deepEqual(monthOf('2026-10-15'), { year: 2026, month: 10 });
  assert.deepEqual(addMonths({ year: 2026, month: 12 }, 1), { year: 2027, month: 1 });
  assert.deepEqual(addMonths({ year: 2026, month: 1 }, -1), { year: 2025, month: 12 });
  assert.deepEqual(addMonths({ year: 2026, month: 5 }, -17), { year: 2024, month: 12 });
});

test('monthDays has each day of the month', () => {
  assert.equal(monthDays({ year: 2024, month: 2 }).length, 29);
  assert.equal(monthDays({ year: 2026, month: 2 }).length, 28);
  assert.deepEqual(monthDays({ year: 2026, month: 10 }).slice(0, 2), ['2026-10-01', '2026-10-02']);
  assert.equal(monthDays({ year: 2026, month: 10 }).at(-1), '2026-10-31');
});

test('the grid has six weeks from the Monday on or before the first day', () => {
  const november = monthGrid({ year: 2026, month: 11 });
  assert.equal(november.length, 42);
  assert.equal(november[0], '2026-10-26');
  assert.equal(november[6], '2026-11-01');
  const february = monthGrid({ year: 2024, month: 2 });
  assert.equal(weekday(february[0]), 0);
  assert.ok(february.includes('2024-02-29'));
  assert.equal(monthGrid({ year: 2027, month: 3 })[0], '2027-03-01');
});

test('dateOf is the calendar date of the phone', () => {
  assert.equal(dateOf(new Date(2026, 9, 15, 23, 30)), '2026-10-15');
  assert.equal(dateOf(new Date(2026, 0, 1, 0, 0)), '2026-01-01');
});

test('a shift that ends at or before its start ends the next day', () => {
  assert.equal(shiftLength('06:00', '14:00'), 480);
  assert.equal(shiftLength('22:00', '06:00'), 480);
  assert.equal(shiftLength('08:00', '08:00'), 1440);
  assert.equal(shiftLength('23:59', '00:00'), 1);
});
