import { bindSheetDrag } from '#ds/sheet';
import { MAX_NOTE, dayOf, setDay, resetDay, setNote } from '#shifts';
import { minutesOf } from '#totals';
import { $, el, ui, state, t, apply, render } from '#ui/context';
import { hoursText, dateText, typeMeta, swatch, LONG_DATE } from '#ui/format';

// From 840px the Month section shows the day beside the grid (LAY-3); below, a day opens in a sheet.
const wideQuery = matchMedia('(min-width: 840px)');
export const isWide = () => wideQuery.matches;

export const openDaySheet = (date) => {
  ui.date = date;
  ui.daySheet = true;
  render();
};

export const closeDaySheet = () => {
  ui.daySheet = false;
  render();
};

const SOURCE = { override: 'day.changed', cycle: 'day.fromCycle', none: 'day.noCycle' };

const choose = (date, type) => apply(setDay(state, date, type), { undoText: t('toast.dayChanged') });

const chip = (label, pressed, onclick, type) => {
  const node = el('button', { className: 'chip', type: 'button', onclick }, type === undefined ? [label] : [swatch(type, { small: true }), label]);
  node.setAttribute('aria-pressed', String(pressed));
  return node;
};

// The editor of one date: its shift, a chip for each type, the reset and the note. `typed` is the
// note that the field held before this render, so that a tap on a chip keeps an unsaved note.
const editor = (date, typed) => {
  const { type, source, note } = dayOf(state, date);
  const summary = type ? `${type.name} · ${typeMeta(type)}` : t('day.noShift');
  const reset = el('button', { className: 'button outline', type: 'button', textContent: t('day.reset'), onclick: () => apply(resetDay(state, date), { undoText: t('toast.dayReset') }) });
  reset.hidden = source !== 'override';
  const field = el('textarea', { className: 'input day-note', rows: 3, maxLength: MAX_NOTE, value: typed ?? note });
  field.setAttribute('aria-label', t('day.note'));
  return [
    el('p', { className: 'day-summary' }, [swatch(type), el('span', { textContent: summary })]),
    el('p', { className: 'day-source', textContent: t(SOURCE[source]) }),
    el('h3', { className: 'sheet-title part', textContent: t('day.shift') }),
    el('div', { className: 'cluster' }, [
      ...state.types.map((one) => chip(one.name, type?.id === one.id, () => choose(date, one.id), one)),
      chip(t('day.none'), source !== 'none' && type === null, () => choose(date, null)),
    ]),
    reset,
    el('h3', { className: 'sheet-title part', textContent: t('day.note') }),
    field,
    el('button', { className: 'button primary wide', type: 'submit', textContent: t('day.saveNote') }),
  ];
};

// Fills `body` with the editor of `date`, and keeps the typed note of the same date.
const fill = (body, date) => {
  const typed = body.dataset.date === date ? body.querySelector('textarea')?.value : undefined;
  body.dataset.date = date;
  body.replaceChildren(...editor(date, typed));
};

export const dayTitle = (date) => dateText(date, LONG_DATE);

// The hours of the day for a screen reader label of a cell or a row.
export const dayLabel = (date) => {
  const { type } = dayOf(state, date);
  return type ? `${dayTitle(date)}: ${type.name}, ${hoursText(minutesOf(type))}` : `${dayTitle(date)}: ${t('day.noShift')}`;
};

export const renderDay = () => {
  $('day-sheet').hidden = !ui.daySheet || ui.date === null;
  if (ui.daySheet && ui.date) {
    $('day-sheet-title').textContent = dayTitle(ui.date);
    fill($('day-sheet-body'), ui.date);
  } else delete $('day-sheet-body').dataset.date;
  const detail = ui.view === 'month' && isWide() && ui.date !== null;
  $('day-detail-empty').hidden = detail;
  $('day-detail-form').hidden = !detail;
  if (detail) {
    $('day-detail-title').textContent = dayTitle(ui.date);
    fill($('day-detail-body'), ui.date);
  }
};

const saveNote = (body) => (event) => {
  event.preventDefault();
  const text = body.querySelector('textarea').value;
  if (apply(setNote(state, ui.date, text), { undoText: t('toast.noteSaved') })) delete body.dataset.date;
};

export const bind = () => {
  $('day-veil').addEventListener('click', closeDaySheet);
  $('day-close').addEventListener('click', closeDaySheet);
  bindSheetDrag($('day-sheet'), { close: closeDaySheet });
  $('day-form').addEventListener('submit', saveNote($('day-sheet-body')));
  $('day-detail-form').addEventListener('submit', saveNote($('day-detail-body')));
  wideQuery.addEventListener('change', () => {
    // A sheet opened from Month moves into the pane when the window grows past 840px.
    if (isWide() && ui.view === 'month') ui.daySheet = false;
    render();
  });
};
