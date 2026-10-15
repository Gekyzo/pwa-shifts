import { test } from 'node:test';
import assert from 'node:assert/strict';
import { minutesOf, totals, weekTotals, monthTotals } from '#totals';

const MORNING = { id: 'm', code: 'M', name: 'Morning', color: 'green', kind: 'work', start: '06:00', end: '14:00', breakMin: 0 };
const NIGHT = { id: 'n', code: 'N', name: 'Night', color: 'blue', kind: 'work', start: '22:00', end: '06:00', breakMin: 30 };
const LEAVE = { id: 'v', code: 'V', name: 'Vacation', color: 'orange', kind: 'leave', start: '', end: '', breakMin: 0 };
const OFF = { id: 'o', code: 'L', name: 'Off', color: 'grey', kind: 'off', start: '', end: '', breakMin: 0 };

const build = ({ cycles = [], days = {} } = {}) => ({ version: 1, types: [MORNING, NIGHT, LEAVE, OFF], cycles, days });

test('a work shift counts its length less its break, past midnight too', () => {
  assert.equal(minutesOf(MORNING), 480);
  assert.equal(minutesOf(NIGHT), 450);
  assert.equal(minutesOf({ ...MORNING, start: '08:00', end: '08:00' }), 1440);
});

test('a day off, a leave and no shift count 0 minutes', () => {
  assert.equal(minutesOf(LEAVE), 0);
  assert.equal(minutesOf(OFF), 0);
  assert.equal(minutesOf(null), 0);
});

test('totals sum the work minutes and count the days of each type, both ends included', () => {
  const state = build({ cycles: [{ from: '2026-10-01', steps: ['m', 'n', 'o', null] }], days: { '2026-10-02': { type: 'v' } } });
  const before = structuredClone(state);
  assert.deepEqual(totals(state, '2026-10-01', '2026-10-08'), { workMinutes: 480 * 2 + 450, days: { m: 2, n: 1, v: 1, o: 2 } });
  assert.deepEqual(state, before);
});

test('totals of a range with no shift are zero', () => {
  assert.deepEqual(totals(build(), '2026-10-01', '2026-10-31'), { workMinutes: 0, days: {} });
  assert.deepEqual(totals(build(), '2026-10-02', '2026-10-01'), { workMinutes: 0, days: {} });
});

test('the week runs from Monday to Sunday, across two months', () => {
  const state = build({ cycles: [{ from: '2026-09-28', steps: ['m'] }] });
  assert.deepEqual(weekTotals(state, '2026-10-01'), { workMinutes: 480 * 7, days: { m: 7 } });
  assert.deepEqual(weekTotals(build({ cycles: [{ from: '2026-10-01', steps: ['m'] }] }), '2026-10-01'), { workMinutes: 480 * 4, days: { m: 4 } });
});

test('the month counts each of its days only', () => {
  const state = build({ cycles: [{ from: '2026-01-01', steps: ['m'] }] });
  assert.deepEqual(monthTotals(state, { year: 2026, month: 2 }), { workMinutes: 480 * 28, days: { m: 28 } });
});
