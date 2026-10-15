import { APP_SLUG } from '#config';
import { isDate, isTime, daysBetween, shiftLength } from '#dates';

// The shifts of one worker: the shift types, the cycles that repeat them from a start date, and
// the days that the user changed by hand (an override) or gave a note.
export const SHIFTS_KEY = `${APP_SLUG}.shifts`;
export const COLORS = ['green', 'blue', 'purple', 'orange', 'red', 'teal', 'grey', 'yellow'];
export const KINDS = ['work', 'off', 'leave'];
export const MAX_NAME = 30;
export const MAX_CODE = 3;
export const MAX_NOTE = 200;
export const MAX_STEPS = 366;

export const emptyShifts = () => ({ version: 1, types: [], cycles: [], days: {} });

const fail = (state, key, params) => ({ state, error: params ? { key, params } : { key } });

export const findType = (state, id) => state.types.find((type) => type.id === id) ?? null;

// The clean fields of a type, or an error message.
const checkType = (fields) => {
  const name = String(fields.name ?? '').trim();
  const code = String(fields.code ?? '').trim();
  if (!name) return { error: { key: 'error.typeNameRequired' } };
  if (name.length > MAX_NAME) return { error: { key: 'error.textTooLong', params: { max: MAX_NAME } } };
  if (!code || [...code].length > MAX_CODE) return { error: { key: 'error.codeLength' } };
  const color = COLORS.includes(fields.color) ? fields.color : COLORS[0];
  const kind = KINDS.includes(fields.kind) ? fields.kind : KINDS[0];
  if (kind !== 'work') return { clean: { code, name, color, kind, start: '', end: '', breakMin: 0 } };
  const { start, end } = fields;
  if (!isTime(start) || !isTime(end)) return { error: { key: 'error.timeInvalid' } };
  const breakMin = fields.breakMin === '' || fields.breakMin == null ? 0 : Number(fields.breakMin);
  if (!Number.isInteger(breakMin) || breakMin < 0 || breakMin >= shiftLength(start, end)) return { error: { key: 'error.breakTooLong' } };
  return { clean: { code, name, color, kind, start, end, breakMin } };
};

export const addType = (state, fields, id = crypto.randomUUID()) => {
  const { clean, error } = checkType(fields);
  if (error) return { state, error };
  return { state: { ...state, types: [...state.types, { id, ...clean }] } };
};

export const editType = (state, id, fields) => {
  if (!findType(state, id)) return fail(state, 'error.typeMissing');
  const { clean, error } = checkType(fields);
  if (error) return { state, error };
  return { state: { ...state, types: state.types.map((type) => (type.id === id ? { id, ...clean } : type)) } };
};

// True when a step of a cycle or an override names the type.
export const isInUse = (state, id) =>
  state.cycles.some((cycle) => cycle.steps.includes(id)) || Object.values(state.days).some((day) => day.type === id);

export const deleteType = (state, id) => {
  if (!findType(state, id)) return fail(state, 'error.typeMissing');
  if (isInUse(state, id)) return fail(state, 'error.typeInUse');
  return { state: { ...state, types: state.types.filter((type) => type.id !== id) } };
};

const byFrom = (a, b) => (a.from < b.from ? -1 : a.from > b.from ? 1 : 0);

// Adds the cycle, or replaces the cycle with the same start.
export const setCycle = (state, from, steps) => {
  if (!isDate(from)) return fail(state, 'error.dateInvalid');
  if (!Array.isArray(steps) || steps.length === 0) return fail(state, 'error.cycleEmpty');
  if (steps.length > MAX_STEPS) return fail(state, 'error.cycleTooLong', { max: MAX_STEPS });
  if (!steps.every((step) => step === null || findType(state, step))) return fail(state, 'error.typeMissing');
  const cycles = [...state.cycles.filter((cycle) => cycle.from !== from), { from, steps: [...steps] }].sort(byFrom);
  return { state: { ...state, cycles } };
};

export const removeCycle = (state, from) => {
  if (!state.cycles.some((cycle) => cycle.from === from)) return fail(state, 'error.cycleMissing');
  return { state: { ...state, cycles: state.cycles.filter((cycle) => cycle.from !== from) } };
};

// The days with `date` set to `entry`; an entry with no type and no note goes away.
const withDay = (state, date, entry) => {
  const { [date]: _, ...days } = state.days;
  if ('type' in entry || 'note' in entry) days[date] = entry;
  return { state: { ...state, days } };
};

// `type` is the id of a type, or null for a day with no shift.
export const setDay = (state, date, type) => {
  if (!isDate(date)) return fail(state, 'error.dateInvalid');
  if (type !== null && !findType(state, type)) return fail(state, 'error.typeMissing');
  return withDay(state, date, { ...state.days[date], type });
};

// The day follows its cycle again.
export const resetDay = (state, date) => {
  if (!isDate(date)) return fail(state, 'error.dateInvalid');
  const { type: _, ...rest } = state.days[date] ?? {};
  return withDay(state, date, rest);
};

export const setNote = (state, date, text) => {
  if (!isDate(date)) return fail(state, 'error.dateInvalid');
  const note = String(text ?? '').trim();
  if (note.length > MAX_NOTE) return fail(state, 'error.textTooLong', { max: MAX_NOTE });
  const { note: _, ...rest } = state.days[date] ?? {};
  return withDay(state, date, note ? { ...rest, note } : rest);
};

// The cycle in force on `date`: the one with the latest start on or before it.
export const cycleOn = (state, date) => state.cycles.findLast((cycle) => cycle.from <= date) ?? null;

// The shift of a date: the override, else the step of its cycle, else none.
export const dayOf = (state, date) => {
  const entry = state.days[date] ?? {};
  const note = entry.note ?? '';
  if ('type' in entry) return { type: entry.type === null ? null : findType(state, entry.type), source: 'override', note };
  const cycle = cycleOn(state, date);
  if (!cycle) return { type: null, source: 'none', note };
  const step = cycle.steps[daysBetween(cycle.from, date) % cycle.steps.length];
  return { type: step === null ? null : findType(state, step), source: 'cycle', note };
};

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

const cleanType = (data) => {
  if (!isObject(data) || typeof data.id !== 'string' || data.id === '') return null;
  const { clean } = checkType(data);
  return clean ? { id: data.id, ...clean } : null;
};

// A clean version 1 doc, or null. A reference to a type that does not exist goes away, so that a
// backup still loads. Add a migration here when the version goes up.
export const normalizeShifts = (data) => {
  if (!isObject(data) || data.version !== 1 || !Array.isArray(data.types) || !Array.isArray(data.cycles) || !isObject(data.days)) return null;
  const types = data.types.map(cleanType);
  if (types.includes(null)) return null;
  const ids = new Set(types.map((type) => type.id));
  if (ids.size !== types.length) return null;
  const known = (id) => (ids.has(id) ? id : null);
  const cycles = data.cycles
    .filter((cycle) => isObject(cycle) && isDate(cycle.from) && Array.isArray(cycle.steps) && cycle.steps.length > 0 && cycle.steps.length <= MAX_STEPS)
    .filter((cycle, index, all) => all.findIndex((other) => other.from === cycle.from) === index)
    .map((cycle) => ({ from: cycle.from, steps: cycle.steps.map(known) }))
    .sort(byFrom);
  const days = {};
  for (const [date, entry] of Object.entries(data.days)) {
    if (!isDate(date) || !isObject(entry)) continue;
    const day = {};
    if (entry.type === null || ids.has(entry.type)) day.type = entry.type;
    if (typeof entry.note === 'string' && entry.note.trim()) day.note = entry.note.trim().slice(0, MAX_NOTE);
    if (Object.keys(day).length) days[date] = day;
  }
  return { version: 1, types, cycles, days };
};
