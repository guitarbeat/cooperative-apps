import test from 'node:test';
import assert from 'node:assert/strict';

import {
  selectDefaultSheetName,
  trimLeadingEmptyRows,
} from '../src/lib/workbook.js';

test('trimLeadingEmptyRows removes leading blanks and reports offset', () => {
  const rows = [
    ['', '', ''],
    [null, undefined, '   '],
    ['Header 1', 'Header 2'],
    ['Value 1', 'Value 2'],
  ];

  const result = trimLeadingEmptyRows(rows);
  assert.equal(result.offset, 2);
  assert.deepEqual(result.rows, [
    ['Header 1', 'Header 2'],
    ['Value 1', 'Value 2'],
  ]);
});

test('trimLeadingEmptyRows returns empty state for non-array input', () => {
  const result = trimLeadingEmptyRows(null);
  assert.equal(result.offset, 0);
  assert.deepEqual(result.rows, []);
});

test('selectDefaultSheetName picks the first sheet with meaningful data', () => {
  const sheetNames = ['Summary', 'Transactions', 'Archive'];
  const workbookSheets = {
    Summary: [
      ['', ''],
      ['', ''],
    ],
    Transactions: [
      ['', ''],
      ['Type', 'Number'],
      ['Invoice', '123'],
    ],
    Archive: [
      ['', ''],
      ['', ''],
    ],
  };

  assert.equal(
    selectDefaultSheetName(sheetNames, workbookSheets),
    'Transactions',
  );
});

test('selectDefaultSheetName falls back to the first sheet when all are empty', () => {
  const sheetNames = ['Summary', 'Archive'];
  const workbookSheets = {
    Summary: [
      ['', ''],
      ['', ''],
    ],
    Archive: [['', '']],
  };

  assert.equal(selectDefaultSheetName(sheetNames, workbookSheets), 'Summary');
});
