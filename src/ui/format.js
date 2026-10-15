import { intlTag } from '#i18n';
import { minutesOf } from '#totals';
import { el, lang, t } from '#ui/context';

// Hours as a number of the language, such as `7,5 h`.
export const hoursText = (minutes) =>
  t('hours.value', { hours: new Intl.NumberFormat(intlTag(lang), { maximumFractionDigits: 2 }).format(minutes / 60) });

// A date `YYYY-MM-DD` in the words of the language, with a capital first letter. The date is read
// in UTC, as `#dates` makes it.
export const dateText = (date, options) => {
  const text = new Intl.DateTimeFormat(intlTag(lang), { ...options, timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
  return text.charAt(0).toLocaleUpperCase(intlTag(lang)) + text.slice(1);
};

export const LONG_DATE = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };

// The hours of a work type, such as `06:00–14:00 · 8 h`, or the name of its kind.
export const typeMeta = (type) =>
  type.kind === 'work' ? `${type.start}–${type.end} · ${hoursText(minutesOf(type))}` : t(`kind.${type.kind}`);

// The code of a type on its colour, or a dash for no shift.
export const swatch = (type, { small = false } = {}) => {
  const node = el('span', { className: small ? 'type-swatch small' : 'type-swatch', textContent: type?.code ?? '–' });
  node.dataset.color = type?.color ?? 'none';
  return node;
};
