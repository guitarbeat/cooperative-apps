import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as fs from 'node:fs';
import * as XLSX from 'xlsx/xlsx.mjs';
import {
  DEFAULT_OPTIONS,
  cleanSheet,
  normaliseCell,
  sanitizeName,
} from '../src/lib/cleaner.js';

XLSX.set_fs(fs);

test('normaliseCell trims string values when enabled', () => {
  const stats = { trimmedCells: 0 };
  const result = normaliseCell('  value  ', DEFAULT_OPTIONS, stats);
  assert.equal(result, 'value');
  assert.equal(stats.trimmedCells, 1);
});

test('normaliseCell respects default options when partial overrides provided', () => {
  const stats = { trimmedCells: 0 };
  const result = normaliseCell(
    '  value  ',
    { removeDuplicateRows: false },
    stats,
  );
  assert.equal(result, 'value');
  assert.equal(stats.trimmedCells, 1);
});

test('normaliseCell leaves whitespace when trimming disabled', () => {
  const options = { ...DEFAULT_OPTIONS, trimWhitespace: false };
  const stats = { trimmedCells: 0 };
  const result = normaliseCell('  value  ', options, stats);
  assert.equal(result, '  value  ');
  assert.equal(stats.trimmedCells, 0);
});

test('cleanSheet removes duplicate rows, empty rows, and repeated headers', () => {
  const data = [
    ['Name', 'Value'],
    [' Alice ', '1'],
    ['Alice', '1'],
    ['', ''],
    ['Name', 'Value'],
  ];

  const result = cleanSheet(data, DEFAULT_OPTIONS);

  assert.deepEqual(result.cleaned, [
    ['Name', 'Value'],
    ['Alice', '1'],
  ]);
  assert.equal(result.stats.duplicateRowsRemoved, 1);
  assert.equal(result.stats.emptyRowsRemoved, 1);
  assert.equal(result.stats.repeatedHeadersRemoved, 1);
  assert.equal(result.stats.trimmedCells, 1);
  assert.equal(result.stats.cleanedRows, 2);
});

test('cleanSheet drops control total summary rows', () => {
  const data = [
    ['Type', 'Number', 'Date', 'Item', 'Class', 'Account', 'Debit', 'Credit'],
    [
      'Invoice',
      'INV-001',
      '2024-01-05',
      'Rent',
      'Helios',
      '40-1000',
      '1,200',
      '',
    ],
    ['', '', '', '', '', '', '1,200', ''],
    ['', '', '', '', 'Helios', '12-1010', '', '1,200'],
  ];

  const { cleaned, stats } = cleanSheet(data, DEFAULT_OPTIONS);

  assert.equal(cleaned.length, 3);
  assert.deepEqual(cleaned[cleaned.length - 1], [
    '',
    '',
    '',
    '12-1010',
    'Helios',
    '',
    '',
    1200,
  ]);
  assert.equal(stats.controlTotalsRemoved, 1);
});

test('cleanSheet drops labelled control totals that include descriptive text', () => {
  const data = [
    [
      'Type',
      'Number',
      'Date',
      'Item',
      'Class',
      'Account',
      '',
      'Debit',
      'Credit',
    ],
    [
      'Invoice',
      'INV-002',
      '2024-01-05',
      'Rent',
      'Helios',
      '40-1000',
      '',
      '1,200',
      '',
    ],
    ['', '', '', 'Helios Total', '', '', '1,200', '', ''],
    ['', '', '', '', '', 'Interface Totals', '', '', '1,200'],
  ];

  const { cleaned, stats } = cleanSheet(data, DEFAULT_OPTIONS);

  assert.equal(cleaned.length, 2);
  assert.deepEqual(cleaned[1], [
    '2024-01-05',
    'Invoice',
    'INV-002',
    '40-1000',
    'Helios',
    'Rent',
    1200,
    '',
  ]);
  assert.equal(stats.controlTotalsRemoved, 2);
});

test('cleanSheet preserves the original order of data rows', () => {
  const data = [
    ['Type', 'Number', 'Date', 'Item', 'Class', 'Account', 'Debit', 'Credit'],
    ['Invoice', 'INV-100', '2024-01-01', 'Line A', '', '40-1000', '100', ''],
    ['Invoice', 'INV-101', '2024-01-02', 'Line B', '', '40-1000', '200', ''],
    ['Invoice', 'INV-102', '2024-01-03', 'Line C', '', '40-1000', '', '300'],
  ];

  const { cleaned } = cleanSheet(data, DEFAULT_OPTIONS);

  const documentNumbers = cleaned.slice(1).map((row) => row[2]);
  assert.deepEqual(documentNumbers, ['INV-100', 'INV-101', 'INV-102']);
});

test('cleanSheet records violations when control totals are removed', () => {
  const data = [
    ['Type', 'Number', 'Date', 'Item', 'Class', 'Account', 'Debit', 'Credit'],
    [
      'Invoice',
      'INV-003',
      '2024-01-05',
      'Rent',
      'Helios',
      '40-1000',
      '1,200',
      '',
    ],
    ['', '', '', '', '', '', '1,200', ''],
  ];

  const options = { ...DEFAULT_OPTIONS, captureDiagnostics: true };
  const result = cleanSheet(data, options);
  const { violations } = result.data;

  assert.ok(Array.isArray(violations));
  const violation = violations.find(
    (entry) => entry.ruleCode === 'removed-control-total-row',
  );
  assert.ok(violation, 'expected control total removal violation');
  assert.equal(violation.severity, 'error');
  assert.equal(violation.rowIndex, 2);
  assert.deepEqual(violation.columnIndices, [6]);
  assert.deepEqual(violation.columnIds, ['Debit']);
  assert.match(violation.message, /control total/i);
});

test('cleanSheet interprets accounting negatives in amount columns', () => {
  const data = [
    ['Type', 'Number', 'Date', 'Item', 'Class', 'Account', 'Debit', 'Credit'],
    [
      'Journal',
      'J-100',
      '2024-03-15',
      '',
      '',
      '10-2000',
      '(1,200)',
      '(350.50)',
    ],
  ];

  const result = cleanSheet(data, DEFAULT_OPTIONS);
  const [, row] = result.cleaned;

  assert.equal(row[6], -1200);
  assert.equal(row[7], -350.5);
});

test('cleanSheet retains duplicate rows when disabled in options', () => {
  const options = { ...DEFAULT_OPTIONS, removeDuplicateRows: false };
  const data = [['Header'], ['A'], ['A']];

  const result = cleanSheet(data, options);

  assert.deepEqual(result.cleaned, [['Header'], ['A'], ['A']]);
  assert.equal(result.stats.duplicateRowsRemoved, 0);
  assert.equal(result.stats.cleanedRows, 3);
});

test('cleanSheet optionally captures diagnostics for auditing', () => {
  const data = [
    ['Type', 'Number', 'Date', 'Item', 'Class', 'Account', 'Debit', 'Credit'],
    ['Invoice', '', '', '', '', '12-1000..Revenue', '', ''],
    ['Invoice', '', '', '', '', '12-1000..Revenue', '', ''],
  ];

  const options = { ...DEFAULT_OPTIONS, captureDiagnostics: true };
  const result = cleanSheet(data, options);

  assert.ok(Array.isArray(result.diagnostics));
  assert.ok(result.diagnostics.length > 0);
  assert.ok(
    result.diagnostics.some(
      (entry) => entry.category === 'removed-duplicate-row',
    ),
    'expected duplicate-row diagnostic to be captured',
  );
});

test('cleanSheet returns a versioned payload with violation metadata', () => {
  const data = [
    ['Name', 'Value'],
    ['Alice', '1'],
    ['Alice', '1'],
  ];

  const options = { ...DEFAULT_OPTIONS, captureDiagnostics: true };
  const result = cleanSheet(data, options);
  assert.equal(result.schemaVersion, 2);
  assert.ok(result.data, 'expected data envelope');
  assert.deepEqual(result.cleaned, [
    ['Name', 'Value'],
    ['Alice', '1'],
  ]);
  assert.ok(Array.isArray(result.data.violations));
  assert.ok(
    result.data.violations.some(
      (violation) =>
        violation.ruleCode === 'removed-duplicate-row' &&
        violation.severity === 'error',
    ),
    'expected duplicate-row violation metadata',
  );
});

test('cleanSheet emits column-aware violations for normalization and reassignment', () => {
  const data = [
    ['Type', 'Number', 'Date', 'Item', 'Class', 'Account', 'Debit', 'Credit'],
    ['Invoice', '', '09/01/2025', '', '', '12-1000..Revenue', '', ''],
    ['Invoice', '', '12-3456..Account', '', '100', '', '', ''],
  ];

  const options = { ...DEFAULT_OPTIONS, captureDiagnostics: true };
  const result = cleanSheet(data, options);
  const { violations } = result.data;

  assert.ok(Array.isArray(violations) && violations.length > 0);

  const normalisedDate = violations.find(
    (violation) => violation.ruleCode === 'normalised-date',
  );
  assert.ok(normalisedDate, 'expected date normalization violation');
  assert.equal(normalisedDate.severity, 'warning');
  assert.equal(normalisedDate.rowIndex, 1);
  assert.deepEqual(normalisedDate.columnIndices, [0]);

  const movedAccount = violations.find(
    (violation) => violation.ruleCode === 'moved-account-from-date',
  );
  assert.ok(movedAccount, 'expected account reassignment violation');
  assert.equal(movedAccount.rowIndex, 2);
  assert.equal(movedAccount.severity, 'warning');
  assert.deepEqual(
    movedAccount.columnIndices?.sort((a, b) => a - b),
    [0, 3],
  );

  const movedAmount = violations.find(
    (violation) => violation.ruleCode === 'moved-amount-to-credit',
  );
  assert.ok(movedAmount, 'expected amount reassignment violation');
  assert.equal(movedAmount.rowIndex, 2);
  assert.equal(movedAmount.severity, 'warning');
  assert.deepEqual(movedAmount.columnIndices, [7]);
});

test('cleanSheet backfills item/class context from detail rows', () => {
  const data = [
    ['Type', 'Number', 'Date', 'Item', 'Class', 'Account', 'Debit', 'Credit'],
    [
      'Invoice',
      'PBJ-IN0001',
      '09/01/2025',
      '',
      '',
      '40-1000..Room & Board',
      '250',
      '',
    ],
    [
      '',
      '',
      '',
      'PBJ-Rent Due',
      'Helios',
      '12-1010..ACCOUNTS RECEIVABLE',
      '',
      '250',
    ],
  ];

  const options = { ...DEFAULT_OPTIONS, captureDiagnostics: true };
  const result = cleanSheet(data, options);

  assert.deepEqual(result.cleaned[1], [
    '2025-09-01',
    'Invoice',
    'PBJ-IN0001',
    '40-1000..Room & Board',
    'Helios',
    'PBJ-Rent Due',
    250,
    '',
  ]);

  assert.deepEqual(result.cleaned[2], [
    '',
    '',
    '',
    '12-1010..ACCOUNTS RECEIVABLE',
    'Helios',
    'PBJ-Rent Due',
    '',
    250,
  ]);

  assert.equal(result.stats.detailContextPropagations, 1);

  const detailDiagnostic = result.diagnostics?.find(
    (entry) => entry.category === 'propagated-detail-context',
  );
  assert.ok(detailDiagnostic, 'expected propagated-detail-context diagnostic');
  assert.deepEqual(
    detailDiagnostic.columnIndices?.sort((a, b) => a - b),
    [4, 5],
  );

  const detailViolation = result.data.violations.find(
    (violation) => violation.ruleCode === 'propagated-detail-context',
  );
  assert.ok(detailViolation, 'expected propagated-detail-context violation');
  assert.equal(detailViolation.rowIndex, 1);
  assert.deepEqual(
    detailViolation.columnIndices?.sort((a, b) => a - b),
    [4, 5],
  );
});

test('cleanSheet removes empty columns when enabled', () => {
  const data = [
    ['Name', 'Value', ''],
    ['Alice', '1', ''],
    ['Bob', '2', ''],
  ];

  const result = cleanSheet(data, DEFAULT_OPTIONS);

  assert.deepEqual(result.cleaned, [
    ['Name', 'Value'],
    ['Alice', '1'],
    ['Bob', '2'],
  ]);
  assert.equal(result.stats.emptyColumnsRemoved, 1);
});

test('cleanSheet merges partial options with defaults', () => {
  const data = [
    ['Name', 'Value'],
    [' Alice ', '1'],
  ];

  const result = cleanSheet(data, { removeDuplicateRows: false });

  assert.deepEqual(result.cleaned, [
    ['Name', 'Value'],
    ['Alice', '1'],
  ]);
  assert.equal(result.stats.trimmedCells, 1);
});

test('cleanSheet falls back to defaults when options are null', () => {
  const data = [['Header'], [' Value ']];

  const result = cleanSheet(data, null);

  assert.deepEqual(result.cleaned, [['Header'], ['Value']]);
  assert.equal(result.stats.trimmedCells, 1);
});

test('cleanSheet handles non-array inputs gracefully', () => {
  const result = cleanSheet(null, DEFAULT_OPTIONS);
  assert.deepEqual(result.cleaned, []);
  assert.equal(result.stats.originalRows, 0);
});

test('sanitizeName produces URL-safe filenames', () => {
  assert.equal(sanitizeName('Monthly Ledger.xlsx'), 'monthly-ledger-xlsx');
  assert.equal(sanitizeName('  Weird__Name  '), 'weird-name');
  assert.equal(sanitizeName(''), 'cleaned-data');
});

test('sanitizeName handles filenames with multiple dots and uppercase extensions', () => {
  assert.equal(
    sanitizeName('2025.09.30  Interface Run.XLSX'),
    '2025-09-30-interface-run-xlsx',
  );
});

test('sanitizeName handles non-string inputs safely', () => {
  assert.equal(sanitizeName(null), 'cleaned-data');
  assert.equal(sanitizeName(undefined), 'cleaned-data');
  assert.equal(sanitizeName(2024), '2024');
});

test('cleanSheet processes the provided sample workbook data', () => {
  const currentFilePath = fileURLToPath(import.meta.url);
  const fixturePath = path.resolve(
    path.dirname(currentFilePath),
    '../2025.09.30  Interface Run.XLSX',
  );

  const workbook = XLSX.readFile(fixturePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: true,
  });

  const { cleaned, stats } = cleanSheet(rawData, DEFAULT_OPTIONS);

  assert.equal(cleaned.length, stats.cleanedRows);
  assert.ok(cleaned.length < rawData.length);
  assert.equal(stats.originalRows, 220);
  assert.equal(stats.cleanedRows, 159);
  assert.equal(stats.duplicateRowsRemoved, 0);
  assert.equal(stats.emptyRowsRemoved, 1);
  assert.equal(stats.emptyColumnsRemoved, 1);
  assert.equal(stats.repeatedHeadersRemoved, 59);
  assert.equal(stats.amountsReassigned, 156);
  assert.equal(stats.datesNormalised, 60);
  assert.equal(stats.detailContextPropagations, 37);
  assert.equal(stats.controlTotalsRemoved, 1);
  assert.deepEqual(cleaned[0], [
    'Posting Date',
    'Transaction Type',
    'Document No.',
    'Account',
    'Class',
    'Memo',
    'Debit',
    'Credit',
  ]);
  assert.deepEqual(cleaned[1], [
    '2025-09-01',
    'Credit Memo',
    'PBJ-CM01708',
    '40-1000..Room & Board (Property Income):Member Room & Board',
    'Helios',
    'PBJ-Rent Due',
    555,
    '',
  ]);
  assert.deepEqual(cleaned[2], [
    '',
    '',
    '',
    '12-1010..ACCOUNTS RECEIVABLE:Member Receivables',
    'Helios',
    'PBJ-Rent Due',
    '',
    555,
  ]);
  const classRow = cleaned.find(
    (row) =>
      row[0] === '' &&
      row[1] === '' &&
      row[2] === '' &&
      row[3] === '12-1010..ACCOUNTS RECEIVABLE:Member Receivables' &&
      row[4] === 'Eden' &&
      row[6] === '' &&
      row[7] === 50,
  );
  assert.ok(
    classRow,
    'expected to find Eden class credit row with reassigned amount',
  );
});

test('cleanSheet preserves empty header columns', (t) => {
  const data = [
    ['Type', 'Number', 'Date', '', 'Account', 'Debit', 'Credit'],
    ['Invoice', 'INV-001', '2024-01-05', '', '40-1000', '1,200', ''],
  ];

  const options = { ...DEFAULT_OPTIONS, removeEmptyColumns: false };
  const { cleaned } = cleanSheet(data, options);

  t.mock.method(assert, 'deepEqual');
  assert.deepEqual(cleaned[0], [
    'Posting Date',
    'Transaction Type',
    'Document No.',
    'Account',
    'Debit',
    'Credit',
    '',
  ]);
});
