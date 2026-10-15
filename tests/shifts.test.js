import { test } from 'node:test';
import assert from 'node:assert/strict';
import { APP_SLUG } from '#config';
import {
  SHIFTS_KEY,
  COLORS,
  MAX_NOTE,
  MAX_NAME,
  MAX_STEPS,
  emptyShifts,
  findType,
  addType,
  editType,
  deleteType,
  setCycle,
  removeCycle,
  setDay,
  resetDay,
  setNote,
  cycleOn,
  dayOf,
  normalizeShifts,
} from '#shifts';

const MORNING = { id: 'm', code: 'M', name: 'Morning', color: 'green', kind: 'work', start: '06:00', end: '14:00', breakMin: 0 };
const NIGHT = { id: 'n', code: 'N', name: 'Night', color: 'blue', kind: 'work', start: '22:00', end: '06:00', breakMin: 30 };
const LEAVE = { id: 'v', code: 'V', name: 'Vacation', color: 'orange', kind: 'leave', start: '', end: '', breakMin: 0 };

const build = ({ cycles = [], days = {} } = {}) => ({ version: 1, types: [MORNING, NIGHT, LEAVE], cycles, days });
const fields = (over = {}) => ({ name: 'Late', code: 'L', color: 'red', kind: 'work', start: '14:00', end: '22:00', breakMin: '15', ...over });

// Runs `fn` on `state` and checks that the input state did not change.
const run = (state, fn) => {
  const before = structuredClone(state);
  const result = fn(state);
  assert.deepEqual(state, before);
  return result;
};

test('the key of the doc has the slug, and the empty doc has nothing', () => {
  assert.equal(SHIFTS_KEY, `${APP_SLUG}.shifts`);
  assert.deepEqual(emptyShifts(), { version: 1, types: [], cycles: [], days: {} });
});

test('addType adds a clean type at the end', () => {
  const { state, error } = run(build(), (s) => addType(s, fields({ name: '  Late  ', code: ' L ' }), 'l'));
  assert.equal(error, undefined);
  assert.deepEqual(state.types.at(-1), { id: 'l', code: 'L', name: 'Late', color: 'red', kind: 'work', start: '14:00', end: '22:00', breakMin: 15 });
});

test('a type with no name, a long name or a bad code is an error', () => {
  const state = build();
  assert.deepEqual(addType(state, fields({ name: '  ' }), 'x'), { state, error: { key: 'error.typeNameRequired' } });
  assert.deepEqual(addType(state, fields({ name: 'a'.repeat(MAX_NAME + 1) }), 'x'), { state, error: { key: 'error.textTooLong', params: { max: MAX_NAME } } });
  for (const code of ['', '   ', 'ABCD']) assert.deepEqual(addType(state, fields({ code }), 'x'), { state, error: { key: 'error.codeLength' } });
});

test('a work type needs two valid times and a break shorter than the shift', () => {
  const state = build();
  for (const start of ['', '25:00', '6:00']) assert.deepEqual(addType(state, fields({ start }), 'x'), { state, error: { key: 'error.timeInvalid' } });
  for (const breakMin of ['-1', '1.5', 'abc', 480]) assert.deepEqual(addType(state, fields({ breakMin }), 'x'), { state, error: { key: 'error.breakTooLong' } });
  assert.equal(addType(state, fields({ breakMin: '' }), 'x').state.types.at(-1).breakMin, 0);
});

test('an off or leave type has no times, and an unknown colour or kind takes the first', () => {
  const { state } = addType(build(), fields({ kind: 'off', start: 'bad', end: '', breakMin: 'bad', color: 'pink' }), 'o');
  assert.deepEqual(state.types.at(-1), { id: 'o', code: 'L', name: 'Late', color: COLORS[0], kind: 'off', start: '', end: '', breakMin: 0 });
  assert.equal(addType(build(), fields({ kind: 'nap' }), 'k').state.types.at(-1).kind, 'work');
});

test('editType changes one type with the same checks', () => {
  const { state } = run(build(), (s) => editType(s, 'm', fields({ name: 'Early' })));
  assert.equal(findType(state, 'm').name, 'Early');
  assert.equal(findType(state, 'm').id, 'm');
  const before = build();
  assert.deepEqual(editType(before, 'm', fields({ code: '' })), { state: before, error: { key: 'error.codeLength' } });
  assert.deepEqual(editType(before, 'ghost', fields()), { state: before, error: { key: 'error.typeMissing' } });
});

test('deleteType removes a type that nothing uses', () => {
  const { state } = run(build(), (s) => deleteType(s, 'v'));
  assert.equal(findType(state, 'v'), null);
  const before = build();
  assert.deepEqual(deleteType(before, 'ghost'), { state: before, error: { key: 'error.typeMissing' } });
});

test('deleteType refuses a type that a cycle or an override uses', () => {
  const inCycle = build({ cycles: [{ from: '2026-10-01', steps: ['m', null] }] });
  assert.deepEqual(deleteType(inCycle, 'm'), { state: inCycle, error: { key: 'error.typeInUse' } });
  const inDay = build({ days: { '2026-10-03': { type: 'v' } } });
  assert.deepEqual(deleteType(inDay, 'v'), { state: inDay, error: { key: 'error.typeInUse' } });
});

test('setCycle adds a cycle, sorted by its start, and replaces one with the same start', () => {
  const one = run(build(), (s) => setCycle(s, '2026-10-01', ['m', 'n', null])).state;
  const two = setCycle(one, '2026-01-01', ['v']).state;
  assert.deepEqual(two.cycles.map((cycle) => cycle.from), ['2026-01-01', '2026-10-01']);
  const three = setCycle(two, '2026-10-01', ['n']).state;
  assert.deepEqual(three.cycles, [{ from: '2026-01-01', steps: ['v'] }, { from: '2026-10-01', steps: ['n'] }]);
});

test('a cycle needs a date, one to the maximum steps and known types', () => {
  const state = build();
  assert.deepEqual(setCycle(state, '2026-02-30', ['m']), { state, error: { key: 'error.dateInvalid' } });
  assert.deepEqual(setCycle(state, '2026-10-01', []), { state, error: { key: 'error.cycleEmpty' } });
  assert.deepEqual(setCycle(state, '2026-10-01', Array(MAX_STEPS + 1).fill(null)), { state, error: { key: 'error.cycleTooLong', params: { max: MAX_STEPS } } });
  assert.deepEqual(setCycle(state, '2026-10-01', ['m', 'ghost']), { state, error: { key: 'error.typeMissing' } });
});

test('removeCycle removes the cycle of a start', () => {
  const state = build({ cycles: [{ from: '2026-10-01', steps: ['m'] }] });
  assert.deepEqual(run(state, (s) => removeCycle(s, '2026-10-01')).state.cycles, []);
  assert.deepEqual(removeCycle(state, '2026-09-01'), { state, error: { key: 'error.cycleMissing' } });
});

test('setDay writes an override and keeps the note; null is no shift', () => {
  const state = build({ days: { '2026-10-03': { note: 'keys' } } });
  assert.deepEqual(run(state, (s) => setDay(s, '2026-10-03', 'n')).state.days, { '2026-10-03': { type: 'n', note: 'keys' } });
  assert.deepEqual(setDay(state, '2026-10-04', null).state.days['2026-10-04'], { type: null });
  assert.deepEqual(setDay(state, '2026-10-04', 'ghost'), { state, error: { key: 'error.typeMissing' } });
  assert.deepEqual(setDay(state, 'tomorrow', 'm'), { state, error: { key: 'error.dateInvalid' } });
});

test('resetDay removes the override and keeps the note; an empty day goes away', () => {
  const state = build({ days: { '2026-10-03': { type: 'm', note: 'keys' }, '2026-10-04': { type: null } } });
  const { state: next } = run(state, (s) => resetDay(resetDay(s, '2026-10-03').state, '2026-10-04'));
  assert.deepEqual(next.days, { '2026-10-03': { note: 'keys' } });
});

test('setNote trims the note, a blank one removes it, and a long one is an error', () => {
  const state = build({ days: { '2026-10-03': { type: 'm' } } });
  assert.deepEqual(run(state, (s) => setNote(s, '2026-10-03', '  swap  ')).state.days['2026-10-03'], { type: 'm', note: 'swap' });
  const noted = build({ days: { '2026-10-05': { note: 'x' } } });
  assert.deepEqual(setNote(noted, '2026-10-05', '   ').state.days, {});
  assert.deepEqual(setNote(state, '2026-10-03', 'a'.repeat(MAX_NOTE + 1)), { state, error: { key: 'error.textTooLong', params: { max: MAX_NOTE } } });
});

test('dayOf takes the override first', () => {
  const state = build({ cycles: [{ from: '2026-10-01', steps: ['m'] }], days: { '2026-10-02': { type: 'v', note: 'trip' }, '2026-10-03': { type: null } } });
  assert.deepEqual(dayOf(state, '2026-10-02'), { type: LEAVE, source: 'override', note: 'trip' });
  assert.deepEqual(dayOf(state, '2026-10-03'), { type: null, source: 'override', note: '' });
});

test('dayOf then takes the step of the latest cycle that started', () => {
  const state = build({ cycles: [{ from: '2026-01-01', steps: ['v'] }, { from: '2026-10-01', steps: ['m', 'm', 'n', null] }] });
  assert.deepEqual(dayOf(state, '2026-09-30'), { type: LEAVE, source: 'cycle', note: '' });
  assert.equal(dayOf(state, '2026-10-01').type, MORNING);
  assert.equal(dayOf(state, '2026-10-03').type, NIGHT);
  assert.deepEqual(dayOf(state, '2026-10-04'), { type: null, source: 'cycle', note: '' });
  assert.equal(dayOf(state, '2026-10-05').type, MORNING);
  assert.equal(cycleOn(state, '2026-10-31').from, '2026-10-01');
});

test('dayOf before the first cycle is none, never a negative step', () => {
  const state = build({ cycles: [{ from: '2026-10-01', steps: ['m', 'n', null] }] });
  assert.deepEqual(dayOf(state, '2026-09-30'), { type: null, source: 'none', note: '' });
  assert.deepEqual(dayOf(state, '2020-01-01'), { type: null, source: 'none', note: '' });
  assert.equal(cycleOn(state, '2026-09-30'), null);
});

test('normalizeShifts keeps a clean doc as it is', () => {
  const doc = build({ cycles: [{ from: '2026-10-01', steps: ['m', null] }], days: { '2026-10-02': { type: 'n', note: 'x' } } });
  assert.deepEqual(normalizeShifts(structuredClone(doc)), doc);
});

test('normalizeShifts rejects a doc of another shape, a bad type or one id two times', () => {
  for (const data of [null, 'x', [], { version: 2, types: [], cycles: [], days: {} }, { version: 1, types: {}, cycles: [], days: {} }, { version: 1, types: [], cycles: [] }, { version: 1, types: [], cycles: [], days: [] }]) {
    assert.equal(normalizeShifts(data), null, JSON.stringify(data));
  }
  assert.equal(normalizeShifts({ ...build(), types: [{ ...MORNING, code: '' }] }), null);
  assert.equal(normalizeShifts({ ...build(), types: [MORNING, { ...NIGHT, id: 'm' }] }), null);
  assert.equal(normalizeShifts({ ...build(), types: [{ ...MORNING, id: '' }] }), null);
});

test('normalizeShifts drops what points to a missing type, so an old backup still loads', () => {
  const doc = normalizeShifts({
    ...build(),
    cycles: [
      { from: '2026-10-01', steps: ['m', 'ghost'] },
      { from: '2026-10-01', steps: ['n'] },
      { from: 'bad', steps: ['m'] },
      { from: '2026-11-01', steps: [] },
    ],
    days: { '2026-10-02': { type: 'ghost', note: 'x' }, '2026-10-03': { type: 'ghost' }, nope: { type: 'm' }, '2026-10-04': { note: 'a'.repeat(300), extra: 1 }, '2026-10-05': { note: 7 } },
  });
  assert.deepEqual(doc.cycles, [{ from: '2026-10-01', steps: ['m', null] }]);
  assert.deepEqual(doc.days, { '2026-10-02': { note: 'x' }, '2026-10-04': { note: 'a'.repeat(MAX_NOTE) } });
});

test('normalizeShifts drops unknown fields and sorts the cycles', () => {
  const doc = normalizeShifts({ ...build({ cycles: [{ from: '2026-10-01', steps: ['m'], x: 1 }, { from: '2026-01-01', steps: ['n'] }] }), extra: true, types: [{ ...MORNING, extra: 1 }, NIGHT, LEAVE] });
  assert.equal('extra' in doc, false);
  assert.deepEqual(doc.types[0], MORNING);
  assert.deepEqual(doc.cycles, [{ from: '2026-01-01', steps: ['n'] }, { from: '2026-10-01', steps: ['m'] }]);
});
