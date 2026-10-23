import { bindSheetDrag } from '#ds/sheet';
import { COLORS, KINDS, findType, addType, editType, deleteType, setCycle, removeCycle } from '#shifts';
import { addDays, isDate } from '#dates';
import { $, el, ui, state, t, today, apply, render, sheetOpen } from '#ui/context';
import { dateText, typeMeta, swatch } from '#ui/format';

// The colour and the kind that the type sheet shows; the text fields hold the rest.
const draft = { color: COLORS[0], kind: KINDS[0] };
const PREVIEW_DAYS = 14;

const openTypeSheet = (id) => {
  const type = id === 'new' ? null : findType(state, id);
  ui.typeSheet = type ? id : 'new';
  Object.assign(draft, { color: type?.color ?? COLORS[0], kind: type?.kind ?? KINDS[0] });
  $('type-sheet-title').textContent = t(type ? 'type.editTitle' : 'type.new');
  $('type-name').value = type?.name ?? '';
  $('type-code').value = type?.code ?? '';
  $('type-start').value = type?.start || '08:00';
  $('type-end').value = type?.end || '16:00';
  $('type-break').value = String(type?.breakMin ?? 0);
  render();
  $('type-name').focus();
};

const openCycleSheet = (from) => {
  const cycle = state.cycles.find((one) => one.from === from);
  ui.cycleSheet = cycle ? { from, steps: [...cycle.steps], editing: from } : { from: today(), steps: [], editing: null };
  $('cycle-sheet-title').textContent = t(cycle ? 'cycle.editTitle' : 'cycle.new');
  $('cycle-from').value = ui.cycleSheet.from;
  render();
};

export const closePlanSheets = () => {
  ui.typeSheet = null;
  ui.cycleSheet = null;
  render();
};

const typeFields = () => ({
  name: $('type-name').value,
  code: $('type-code').value,
  color: draft.color,
  kind: draft.kind,
  start: $('type-start').value,
  end: $('type-end').value,
  breakMin: $('type-break').value,
});

const saveType = () => {
  const fields = typeFields();
  const result = ui.typeSheet === 'new' ? addType(state, fields) : editType(state, ui.typeSheet, fields);
  if (apply(result)) closePlanSheets();
};

const removeType = () => {
  if (apply(deleteType(state, ui.typeSheet), { undoText: t('toast.typeDeleted') })) closePlanSheets();
};

// A changed start moves the cycle: the old start goes, in the same change.
const saveCycle = () => {
  const { from, steps, editing } = ui.cycleSheet;
  const base = editing && editing !== from ? removeCycle(state, editing).state : state;
  const result = setCycle(base, from, steps);
  if (apply(result.error ? { state, error: result.error } : result)) closePlanSheets();
};

const removeTheCycle = () => {
  if (apply(removeCycle(state, ui.cycleSheet.editing), { undoText: t('toast.cycleDeleted') })) closePlanSheets();
};

const typeRow = (type) =>
  el('button', { className: 'list-row', type: 'button', onclick: () => openTypeSheet(type.id) }, [
    swatch(type),
    el('span', { className: 'list-row-text', textContent: type.name }),
    el('span', { className: 'list-row-meta', textContent: typeMeta(type) }),
  ]);

const stepCodes = (steps) => steps.map((step) => findType(state, step)?.code ?? '–').join(' ');

const cycleRow = (cycle) =>
  el('button', { className: 'list-row', type: 'button', onclick: () => openCycleSheet(cycle.from) }, [
    el('span', { className: 'list-row-text', textContent: t('cycle.from', { date: dateText(cycle.from, { day: 'numeric', month: 'short', year: 'numeric' }) }) }),
    el('span', { className: 'list-row-meta', textContent: stepCodes(cycle.steps) }),
  ]);

const renderTypeSheet = () => {
  $('type-sheet').hidden = ui.typeSheet === null;
  if (ui.typeSheet === null) return;
  $('type-colors').replaceChildren(
    ...COLORS.map((color) => {
      const chip = el('button', { className: 'chip', type: 'button', onclick: () => { draft.color = color; render(); } }, [swatch({ code: '', color }, { small: true })]);
      chip.setAttribute('aria-pressed', String(color === draft.color));
      chip.setAttribute('aria-label', t(`color.${color}`));
      return chip;
    }),
  );
  $('type-kind').replaceChildren(
    ...KINDS.map((kind) => {
      const segment = el('button', { className: 'segment', type: 'button', textContent: t(`kind.${kind}`), onclick: () => { draft.kind = kind; render(); } });
      segment.setAttribute('aria-pressed', String(kind === draft.kind));
      return segment;
    }),
  );
  $('type-times').hidden = draft.kind !== 'work';
  $('type-break-field').hidden = draft.kind !== 'work';
  $('type-delete').hidden = ui.typeSheet === 'new';
};

const renderCycleSheet = () => {
  const sheet = ui.cycleSheet;
  $('cycle-sheet').hidden = sheet === null;
  if (!sheet) return;
  $('cycle-steps').replaceChildren(
    ...sheet.steps.map((step, index) => {
      const type = findType(state, step);
      const button = el('button', { className: 'cycle-step', type: 'button', onclick: () => { sheet.steps.splice(index, 1); render(); } }, [swatch(type)]);
      button.setAttribute('aria-label', t('cycle.removeStep', { step: index + 1, name: type?.name ?? t('cycle.none') }));
      return button;
    }),
  );
  $('cycle-steps-empty').hidden = sheet.steps.length > 0;
  const add = (step) => () => {
    sheet.steps.push(step);
    render();
  };
  $('cycle-palette').replaceChildren(
    ...state.types.map((type) => el('button', { className: 'chip', type: 'button', onclick: add(type.id) }, [swatch(type, { small: true }), type.name])),
    el('button', { className: 'chip', type: 'button', textContent: t('cycle.none'), onclick: add(null) }),
  );
  const days = sheet.steps.length && isDate(sheet.from) ? Array.from({ length: PREVIEW_DAYS }, (_, i) => i) : [];
  $('cycle-preview').replaceChildren(
    ...days.map((i) =>
      el('span', { className: 'cycle-day' }, [
        el('span', { className: 'cycle-day-name', textContent: dateText(addDays(sheet.from, i), { weekday: 'narrow' }) }),
        swatch(findType(state, sheet.steps[i % sheet.steps.length]), { small: true }),
      ]),
    ),
  );
  $('cycle-delete').hidden = sheet.editing === null;
};

export const renderPlan = () => {
  const visible = ui.view === 'plan';
  $('plan').hidden = !visible;
  $('fab').hidden = !visible || sheetOpen();
  $('type-list').replaceChildren(...state.types.map(typeRow));
  $('type-list').hidden = state.types.length === 0;
  $('types-empty').hidden = state.types.length > 0;
  $('cycle-list').replaceChildren(
    ...state.cycles.map(cycleRow),
    el('button', { className: 'list-row accent', type: 'button', textContent: t('cycle.new'), onclick: () => openCycleSheet(null), disabled: state.types.length === 0 }),
  );
  renderTypeSheet();
  renderCycleSheet();
};

export const bind = () => {
  $('fab').addEventListener('click', () => openTypeSheet('new'));
  $('types-add').addEventListener('click', () => openTypeSheet('new'));
  for (const name of ['type', 'cycle']) {
    $(`${name}-veil`).addEventListener('click', closePlanSheets);
    $(`${name}-close`).addEventListener('click', closePlanSheets);
    bindSheetDrag($(`${name}-sheet`), { close: closePlanSheets });
  }
  $('type-delete').addEventListener('click', removeType);
  $('cycle-delete').addEventListener('click', removeTheCycle);
  $('type-form').addEventListener('submit', (event) => {
    event.preventDefault();
    saveType();
  });
  $('cycle-from').addEventListener('change', (event) => {
    ui.cycleSheet.from = event.target.value;
    render();
  });
  $('cycle-form').addEventListener('submit', (event) => {
    event.preventDefault();
    saveCycle();
  });
};
