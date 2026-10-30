// The pages of the walkthrough of the first start, in their order.
export const PAGES = ['plan', 'month', 'offline'];

// The walkthrough shows at the start of a new install only: no seen flag and no stored state.
export const shouldShow = ({ seen, hasState }) => !seen && !hasState;

// The index of the page after a move of `direction` (1, -1 or 0). It stays in the pages.
export const step = (index, direction) => Math.min(Math.max(index + direction, 0), PAGES.length - 1);

export const isLast = (index) => index === PAGES.length - 1;

// A key that starts with `#name` shows the icon `name` of the sprite, then the rest of its text.
const keyPart = (text) => {
  const match = text.match(/^#([a-z][\w-]*)(?: (.*))?$/s);
  return match ? { text: match[2] ?? '', key: true, icon: match[1] } : { text, key: true };
};

// The pieces of a plain text between its `**` marks, each with its bold state. The first
// `paired` marks of the whole text (counted by `counter`) switch bold; a later mark stays as text.
const boldPieces = (text, strong, counter, paired) =>
  text.split('**').reduce((pieces, piece, index) => {
    if (index > 0) {
      if (counter.index++ < paired) strong = !strong;
      else pieces.at(-1).text += '**';
    }
    pieces.push({ text: piece, strong });
    return pieces;
  }, []);

// The parts of a page text. A text between two backticks is a key, such as `↻` or `+`; a
// backtick with no pair stays in the text. A text between two `**` is bold (`strong: true`),
// keys in it too; a `**` with no pair stays in the text.
export const textParts = (text) => {
  const pieces = text.split('`');
  // An even count of pieces means that the last backtick has no pair.
  const open = pieces.length % 2 === 0 ? pieces.splice(-2).join('`') : null;
  const parts = pieces.map((piece, index) => ({ text: piece, key: index % 2 === 1 }));
  if (open !== null) parts.push({ text: open, key: false });
  const marks = parts.filter((part) => !part.key).reduce((count, part) => count + part.text.split('**').length - 1, 0);
  const paired = marks - (marks % 2);
  const counter = { index: 0 };
  let strong = false;
  const bolded = parts.flatMap((part) => {
    if (part.key) return [{ ...part, strong }];
    const split = boldPieces(part.text, strong, counter, paired);
    strong = split.at(-1).strong;
    return split.map((piece) => ({ ...piece, key: false }));
  });
  return bolded
    .filter((part) => part.text)
    .reduce((joined, part) => {
      const last = joined.at(-1);
      if (last && !last.key && !part.key && Boolean(last.strong) === part.strong) last.text += part.text;
      else {
        const { strong: bold, ...rest } = part;
        joined.push({ ...(rest.key ? keyPart(rest.text) : rest), ...(bold ? { strong: true } : {}) });
      }
      return joined;
    }, []);
};
