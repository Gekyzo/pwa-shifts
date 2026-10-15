import { dayOf } from '#shifts';
import { addDays, weekday, isoWeek } from '#dates';
import { weekTotals } from '#totals';
import { $, el, ui, state, t, today, render, AGENDA_STEP } from '#ui/context';
import { hoursText, dateText, typeMeta, swatch } from '#ui/format';
import { openDaySheet, dayLabel } from '#ui/day';

const weekHead = (date) =>
  el('li', { className: 'agenda-week', textContent: t('agenda.week', { week: isoWeek(date).week, hours: hoursText(weekTotals(state, date).workMinutes) }) });

const row = (date, now) => {
  const { type, source, note } = dayOf(state, date);
  const text = [el('span', { className: 'agenda-name', textContent: type?.name ?? t('day.noShift') })];
  if (type) text.push(el('span', { className: 'agenda-meta', textContent: typeMeta(type) }));
  if (note) text.push(el('span', { className: 'agenda-meta', textContent: note }));
  const button = el('button', { className: 'agenda-row', type: 'button', onclick: () => openDaySheet(date) }, [
    el('span', { className: 'agenda-date', textContent: dateText(date, { weekday: 'short', day: 'numeric', month: 'short' }) }),
    swatch(type),
    el('span', { className: 'agenda-text' }, text),
  ]);
  button.setAttribute('aria-label', dayLabel(date));
  if (date === now) button.dataset.today = '';
  if (source === 'override') button.dataset.override = '';
  return el('li', {}, [button]);
};

export const renderAgenda = () => {
  $('agenda').hidden = ui.view !== 'agenda';
  if (ui.view !== 'agenda') return;
  const now = today();
  const items = Array.from({ length: ui.agendaDays }, (_, i) => addDays(now, i)).flatMap((date, i) =>
    i === 0 || weekday(date) === 0 ? [weekHead(date), row(date, now)] : [row(date, now)],
  );
  $('agenda-list').replaceChildren(...items);
  $('agenda-empty').hidden = state.types.length > 0;
};

export const bind = () => {
  $('agenda-more').addEventListener('click', () => {
    ui.agendaDays += AGENDA_STEP;
    render();
  });
};
