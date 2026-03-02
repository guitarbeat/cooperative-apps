import assert from 'node:assert/strict';
import test from 'node:test';

import { createQuickBooksPackage, QUICKBOOKS_HEADERS } from '../src/lib/qbo.js';

const BASE_HEADER = [
  'Posting Date',
  'Transaction Type',
  'Document No.',
  'Account',
  'Class',
  'Memo',
  'Debit',
  'Credit',
  'Property',
  'Payee',
  'Description',
];

test('maps cleaned ledger rows into QuickBooks journal format', () => {
  const cleanData = [
    BASE_HEADER,
    [
      '2025-09-30',
      'Invoice',
      'INV-100',
      '40-1000..Room & Board',
      'Ops',
      'Rent',
      '1200',
      '',
      'Eden',
      'Alex',
      'September rent',
    ],
    [
      '2025-09-30',
      'Invoice',
      'INV-100',
      '12-1010..ACCOUNTS RECEIVABLE',
      'Ops',
      'Rent',
      '',
      '1200',
      'Eden',
      'Alex',
      'September rent',
    ],
  ];

  const result = createQuickBooksPackage(cleanData);

  assert.deepEqual(result.header, QUICKBOOKS_HEADERS);
  assert.equal(result.rows.length, 2);
  assert.equal(result.rows[0][0], '09/30/2025');
  assert.equal(result.rows[0][1], 'INV-100');
  assert.equal(result.rows[0][2], 1);
  assert.equal(result.rows[0][4], '1200.00');
  assert.equal(result.rows[0][5], '0.00');
  assert.equal(result.rows[1][5], '1200.00');
  assert.equal(result.summary.journalCount, 1);
  assert.equal(result.summary.balancedCount, 1);
  assert.equal(result.summary.totalDebit, 1200);
  assert.equal(result.summary.totalCredit, 1200);
  assert.equal(
    result.validations.filter((entry) => entry.severity === 'error').length,
    0,
  );
});

test('flags unbalanced journals and blocks export', () => {
  const cleanData = [
    BASE_HEADER,
    [
      '2025-09-30',
      'Invoice',
      'INV-200',
      '40-1000..Room & Board',
      'Ops',
      'Rent',
      '1000',
      '',
      'Eden',
      'Alex',
      'September rent',
    ],
    [
      '2025-09-30',
      'Invoice',
      'INV-200',
      '12-1010..ACCOUNTS RECEIVABLE',
      'Ops',
      'Rent',
      '',
      '900',
      'Eden',
      'Alex',
      'September rent',
    ],
  ];

  const result = createQuickBooksPackage(cleanData);
  const errors = result.validations.filter(
    (entry) => entry.severity === 'error',
  );
  assert.ok(errors.some((entry) => entry.code === 'unbalanced-journal'));
  assert.equal(result.summary.balancedCount, 0);
});

test('auto-fills journal numbers when the Number column is blank', () => {
  const cleanData = [
    BASE_HEADER,
    [
      '2025-10-01',
      'Journal Entry',
      '',
      '40-1000..Room & Board',
      '',
      '',
      '50',
      '',
      'Eden',
      'Alex',
      'Adjustment',
    ],
    [
      '2025-10-01',
      'Journal Entry',
      '',
      '12-1010..ACCOUNTS RECEIVABLE',
      '',
      '',
      '',
      '50',
      'Eden',
      'Alex',
      'Adjustment',
    ],
  ];

  const result = createQuickBooksPackage(cleanData);
  const warnings = result.validations.filter(
    (entry) => entry.severity === 'warning',
  );
  assert.ok(warnings.some((entry) => entry.code === 'auto-journal-number'));
  assert.equal(result.rows[0][1], 'AUTO-0001');
  assert.equal(result.rows[1][1], 'AUTO-0001');
  assert.equal(result.summary.autoNumberCount, 1);
});

test('fails when required columns are missing', () => {
  const cleanData = [
    [
      'Posting Date',
      'Transaction Type',
      'Document No.',
      'Memo',
      'Class',
      'Debit',
      'Credit',
      'Property',
      'Payee',
      'Description',
    ],
    [
      '2025-11-01',
      'Invoice',
      'INV-300',
      'Rent',
      'Ops',
      '100',
      '',
      'Eden',
      'Alex',
      'Rent',
    ],
  ];

  const result = createQuickBooksPackage(cleanData);
  const errors = result.validations.filter(
    (entry) => entry.severity === 'error',
  );
  assert.ok(errors.some((entry) => entry.code === 'missing-columns'));
  assert.equal(result.rows.length, 0);
});
