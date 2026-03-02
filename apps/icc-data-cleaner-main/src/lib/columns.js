export const normaliseHeaderValue = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value !== 'string') {
    return String(value).trim().toLowerCase();
  }

  return value.trim().toLowerCase();
};

const aliasEntries = [
  ['date', ['date', 'posting date', 'journal date', 'transaction date']],
  ['type', ['type', 'transaction type']],
  [
    'number',
    [
      'number',
      'document number',
      'document no.',
      'doc no.',
      'journal no.',
      'reference number',
    ],
  ],
  ['item', ['item', 'memo', 'memo/item', 'memo / item']],
  ['class', ['class']],
  ['account', ['account', 'account name', 'account number']],
  ['debit', ['debit', 'debits', 'debit amount']],
  ['credit', ['credit', 'credits', 'credit amount']],
  ['property', ['property', 'location']],
  ['payee', ['payee', 'name']],
  ['description', ['description', 'details']],
];

const aliasToKey = new Map();

aliasEntries.forEach(([key, aliases]) => {
  aliases.forEach((alias) => {
    const normalised = normaliseHeaderValue(alias);
    aliasToKey.set(normalised, key);
  });
});

export const canonicalKeyFromHeaderCell = (value) => {
  const normalised = normaliseHeaderValue(value);
  return aliasToKey.get(normalised) ?? null;
};

export const findColumnIndex = (headerRow, targetKey) => {
  if (!Array.isArray(headerRow)) {
    return -1;
  }

  const normalizedTarget = normaliseHeaderValue(targetKey);

  for (let index = 0; index < headerRow.length; index += 1) {
    const cell = headerRow[index];
    const key = canonicalKeyFromHeaderCell(cell);
    if (key && normaliseHeaderValue(key) === normalizedTarget) {
      return index;
    }
  }

  return -1;
};

const OUTPUT_COLUMN_SEQUENCE = [
  { key: 'date', header: 'Posting Date' },
  { key: 'type', header: 'Transaction Type' },
  { key: 'number', header: 'Document No.' },
  { key: 'account', header: 'Account' },
  { key: 'class', header: 'Class' },
  { key: 'item', header: 'Memo' },
  { key: 'debit', header: 'Debit' },
  { key: 'credit', header: 'Credit' },
];

export const getOutputColumnSequence = () =>
  OUTPUT_COLUMN_SEQUENCE.map((entry) => ({ ...entry }));

const outputHeaderByKey = new Map(
  OUTPUT_COLUMN_SEQUENCE.map((entry) => [entry.key, entry.header]),
);

export const getOutputHeaderForKey = (key) =>
  outputHeaderByKey.get(key) ?? null;

export const reorderColumnsForOutput = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { rows: Array.isArray(rows) ? [] : [], columnOrder: [] };
  }

  const headerRow = Array.isArray(rows[0]) ? rows[0] : [];
  const columnOrder = [];
  const headerLabels = [];

  const claimedIndices = new Set();

  OUTPUT_COLUMN_SEQUENCE.forEach(({ key, header }) => {
    const index = findColumnIndex(headerRow, key);
    if (index !== -1 && !claimedIndices.has(index)) {
      columnOrder.push(index);
      headerLabels.push(header);
      claimedIndices.add(index);
    }
  });

  headerRow.forEach((cell, index) => {
    if (claimedIndices.has(index)) {
      return;
    }
    columnOrder.push(index);
    const key = canonicalKeyFromHeaderCell(cell);
    if (key) {
      headerLabels.push(getOutputHeaderForKey(key) ?? cell);
    } else {
      headerLabels.push(typeof cell === 'string' ? cell : String(cell ?? ''));
    }
  });

  const reordered = rows.map((row) => {
    if (!Array.isArray(row)) {
      return [];
    }
    return columnOrder.map((columnIndex) => row[columnIndex] ?? '');
  });

  reordered[0] = headerLabels;
  return { rows: reordered, columnOrder };
};

export default {
  normaliseHeaderValue,
  canonicalKeyFromHeaderCell,
  findColumnIndex,
  reorderColumnsForOutput,
  getOutputColumnSequence,
  getOutputHeaderForKey,
};
