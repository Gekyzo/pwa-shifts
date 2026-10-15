import { findType, dayOf } from '#shifts';
import { addDays, addMonths, monthOf, monthGrid } from '#dates';
import { slideDirection } from '#sections';
import { weekTotals, monthTotals } from '#totals';
import { $, el, ui, state, t, today, render, guardClick } from '#ui/context';
import { hoursText, dateText, swatch } from '#ui/format';
import { isWide, openDaySheet, dayLabel } from '#ui/day';

// A Monday, to name the days of the week in the language of the screen.
const MONDAY = '2026-10-12';

const sameMonth = (a, b) => a.year === b.year && a.month === b.month;

const goMonth = (way) => {
  ui.month = way === 0 ? monthOf(today()) : addMonths(ui.month, way);
  render();
};

const pick = (date) => {
  if (isWide()) {
    ui.date = date;
    render();
  } else openDaySheet(date);
};

const cell = (date, now) => {
  const { type, source, note } = dayOf(state, date);
  const button = el('button', { className: 'month-day', type: 'button', onclick: () => pick(date) }, [
    el('span', { className: 'month-day-number', textContent: String(Number(date.slice(8))) }),
    type || source === 'override' ? swatch(type, { small: true }) : el('span', { className: 'month-day-blank' }),
  ]);
  button.setAttribute('aria-label', dayLabel(date));
  if (!sameMonth(monthOf(date), ui.month)) button.dataset.outside = '';
  if (date === now) button.dataset.today = '';
  if (source === 'override') button.dataset.override = '';
  if (note) button.dataset.note = '';
  if (isWide() && date === ui.date) button.setAttribute('aria-pressed', 'true');
  return button;
};

const weekCell = (monday) => el('span', { className: 'month-week', textContent: hoursText(weekTotals(state, monday).workMinutes) });

const renderGrid = () => {
  const dates = monthGrid(ui.month);
  const now = today();
  const heads = Array.from({ length: 7 }, (_, i) =>
    el('span', { className: 'month-weekday', textContent: dateText(addDays(MONDAY, i), { weekday: 'narrow' }) }),
  );
  const rows = Array.from({ length: 6 }, (_, row) => [...dates.slice(row * 7, row * 7 + 7).map((date) => cell(date, now)), weekCell(dates[row * 7])]);
  $('month-grid').replaceChildren(...heads, el('span', { className: 'month-week' }), ...rows.flat());
};

const renderTotals = () => {
  const { workMinutes, days } = monthTotals(state, ui.month);
  const counts = Object.entries(days).map(([id, count]) => {
    const type = findType(state, id);
    return el('span', { className: 'month-count' }, [swatch(type, { small: true }), t('month.days', { count, name: type.name })]);
  });
  $('month-totals').replaceChildren(
    el('p', { className: 'month-hours', textContent: t('month.hours', { hours: hoursText(workMinutes) }) }),
    el('div', { className: 'cluster' }, counts),
  );
};

export const renderMonth = () => {
  $('month').hidden = ui.view !== 'month';
  if (ui.view !== 'month') return;
  $('month-title').textContent = dateText(`${ui.month.year}-${String(ui.month.month).padStart(2, '0')}-01`, { month: 'long', year: 'numeric' });
  $('month-today').hidden = sameMonth(ui.month, monthOf(today()));
  $('month-empty').hidden = state.types.length > 0;
  renderGrid();
  renderTotals();
};

export const bind = () => {
  $('month-previous').addEventListener('click', () => goMonth(-1));
  $('month-next').addEventListener('click', () => goMonth(1));
  $('month-today').addEventListener('click', () => goMonth(0));
  // A horizontal slide on the grid changes the month, not the section (NAV-2).
  let slide = null;
  $('month-grid').addEventListener('pointerdown', (event) => {
    slide = event.isPrimary && event.button === 0 ? { pointerId: event.pointerId, x: event.clientX, y: event.clientY } : null;
  });
  $('month-grid').addEventListener('pointerup', (event) => {
    if (slide?.pointerId !== event.pointerId) return;
    const way = slideDirection(event.clientX - slide.x, event.clientY - slide.y);
    slide = null;
    if (!way) return;
    guardClick();
    goMonth(way);
  });
  $('month-grid').addEventListener('pointercancel', () => {
    slide = null;
  });
};
