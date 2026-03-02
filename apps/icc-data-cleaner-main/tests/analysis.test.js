import test from 'node:test';
import assert from 'node:assert/strict';
import { generateAnalysis } from '../src/lib/analysis.js';

const SAMPLE_ROWS = [
  [
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
  ],
  [
    '2025-10-01',
    'Invoice',
    'PBJ-IN1',
    '40-1000..Room & Board',
    'Eden',
    'Rent header',
    '1,200.00',
    '',
    'Eden',
    'Alex LayPort',
  ],
  [
    '',
    '',
    '',
    '12-1010..ACCOUNTS RECEIVABLE',
    'Eden',
    'Room & Board - Eden - 05',
    '',
    '1,200.00',
    'Eden',
    'Alex LayPort',
  ],
  [
    '2025-10-02',
    'Payment',
    'PBJ306-eft',
    '10-7555..UFCU CHECKING (0080)',
    'Credit Cards',
    'Batch header',
    '700',
    '',
    '',
    '',
  ],
  [
    '',
    '',
    '',
    '12-1010..ACCOUNTS RECEIVABLE',
    'Eden',
    'Member payment - Eden - 05',
    '',
    '700',
    'Eden',
    'Alex LayPort',
  ],
  [
    '2025-10-01',
    'Invoice',
    'PBJ-IN2',
    '40-1000..Room & Board',
    'Royal',
    'Rent header',
    '950',
    '',
    'Royal',
    'Diana Cabrera',
  ],
  [
    '',
    '',
    '',
    '12-1010..ACCOUNTS RECEIVABLE',
    'Royal',
    'Room & Board - Royal - 09B',
    '',
    '950',
    'Royal',
    'Diana Cabrera',
  ],
  [
    '2025-09-29',
    'Credit Memo',
    'PBJ-CM1',
    '25-1000..Deposits & Prepayments',
    'Eden',
    'Refund header',
    '250',
    '',
    'Eden',
    'Averi Cecil',
  ],
  [
    '',
    '',
    '',
    '12-1010..ACCOUNTS RECEIVABLE',
    'Eden',
    'Refund detail',
    '',
    '250',
    'Eden',
    'Averi Cecil',
  ],
];

test('generateAnalysis aggregates ledger insights aligned with the PDF structure', () => {
  const analysis = generateAnalysis(SAMPLE_ROWS);
  assert.ok(analysis, 'analysis should be generated for populated sheets');
  assert.equal(analysis.rowCount, 8);
  assert.equal(analysis.transactionCount, 4);
  assert.equal(analysis.uniqueTypeCount, 3);
  assert.equal(analysis.uniqueClassCount, 3);
  assert.equal(analysis.uniqueAccountCount, 4);
  assert.equal(analysis.uniquePropertyCount, 2);
  assert.equal(analysis.debitTotal, 3100);
  assert.equal(analysis.creditTotal, 3100);
  assert.equal(analysis.balanceVariance, 0);
  assert.ok(Array.isArray(analysis.typeBreakdown));
  assert.equal(analysis.typeBreakdown[0].label, 'Invoice');
  assert.equal(analysis.typeBreakdown[0].rowCount, 4);
  assert.ok(
    Array.isArray(analysis.sectionSummaries) &&
      analysis.sectionSummaries.length >= 3,
  );
  assert.equal(analysis.sectionSummaries[0].label, 'Invoice');
  assert.equal(analysis.sectionSummaries[0].transactionCount, 2);
  assert.ok(
    analysis.sectionSummaries[0].topClasses.some(
      (entry) => entry.label === 'Eden',
    ),
  );
  assert.ok(
    analysis.classLeaders.some(
      (entry) => entry.key === 'eden' && entry.label === 'Eden',
    ),
  );
  assert.ok(
    analysis.accountLeaders.some(
      (entry) =>
        entry.key === '40-1000..room & board' &&
        entry.label === '40-1000..Room & Board',
    ),
  );
  assert.ok(Array.isArray(analysis.activityTimeline));
  assert.equal(analysis.activityTimeline.length, 2);
  const octoberSummary = analysis.activityTimeline.find(
    (entry) => entry.key === '2025-10',
  );
  assert.ok(
    octoberSummary,
    'analysis should include activity for October 2025',
  );
  assert.equal(octoberSummary.rowCount, 6);
  assert.deepStrictEqual(analysis.largestDebit, {
    amount: 1200,
    direction: 'debit',
    type: 'Invoice',
    className: 'Eden',
    account: '40-1000..Room & Board',
    number: 'PBJ-IN1',
    item: 'Rent header',
    property: 'Eden',
    payee: 'Alex LayPort',
    date: '2025-10-01',
  });
  assert.deepStrictEqual(analysis.largestCredit, {
    amount: 1200,
    direction: 'credit',
    type: 'Invoice',
    className: 'Eden',
    account: '12-1010..ACCOUNTS RECEIVABLE',
    number: 'PBJ-IN1',
    item: 'Room & Board - Eden - 05',
    property: 'Eden',
    payee: 'Alex LayPort',
    date: '2025-10-01',
  });
  assert.equal(analysis.dateRange.start, '2025-09-29');
  assert.equal(analysis.dateRange.end, '2025-10-02');
  assert.equal(octoberSummary.label, 'Oct 2025');
  assert.ok(analysis.rentInvoice, 'rent megainvoice summary should be present');
  assert.equal(analysis.rentInvoice.number, 'PBJ-IN1');
  assert.ok(
    analysis.rentInvoice.propertyTotals.some(
      (entry) => entry.label === 'Eden' && entry.total === 1200,
    ),
  );
  assert.ok(
    Array.isArray(analysis.paymentBatches) &&
      analysis.paymentBatches.length === 1,
  );
  assert.deepStrictEqual(analysis.paymentBatches[0], {
    number: 'PBJ306-eft',
    date: '2025-10-02',
    amount: 700,
    classLabel: 'Credit Cards',
    accountLabel: '10-7555..UFCU CHECKING (0080)',
    lineCount: 2,
  });
});

test('generateAnalysis ignores out-of-range Excel serials when parsing dates', () => {
  const rows = [
    ['Posting Date', 'Transaction Type', 'Debit', 'Credit'],
    [70000, 'Invoice', '1,000', ''],
  ];

  const analysis = generateAnalysis(rows);
  assert.ok(analysis, 'analysis should still be generated with numeric dates');
  assert.equal(analysis.rowCount, 1);
  assert.equal(analysis.dateRange, null);
  assert.ok(Array.isArray(analysis.activityTimeline));
  assert.equal(analysis.activityTimeline.length, 0);
});

test('generateAnalysis returns null for sheets without meaningful rows', () => {
  assert.equal(generateAnalysis([['Transaction Type', 'Debit']]), null);
  assert.equal(generateAnalysis(null), null);
});

test('generateAnalysis collapses mixed-case class, account, and property values', () => {
  const rows = [
    ['Transaction Type', 'Class', 'Account', 'Debit', 'Credit', 'Property'],
    ['Invoice', 'Eden', 'Main Account', '100', '', 'Prop A'],
    ['Invoice', 'eden', 'main account', '50', '', 'prop a'],
    ['Payment', 'EDEN', 'MAIN ACCOUNT', '', '60', 'PROP A'],
  ];

  const analysis = generateAnalysis(rows);
  assert.equal(analysis.uniqueClassCount, 1);
  assert.equal(analysis.uniqueAccountCount, 1);
  assert.equal(analysis.uniquePropertyCount, 1);

  const [classSummary] = analysis.classLeaders;
  assert.equal(classSummary.key, 'eden');
  assert.equal(classSummary.label, 'Eden');
  assert.equal(classSummary.debit, 150);
  assert.equal(classSummary.credit, 60);
  assert.equal(classSummary.net, 90);

  const [accountSummary] = analysis.accountLeaders;
  assert.equal(accountSummary.key, 'main account');
  assert.equal(accountSummary.label, 'Main Account');
  assert.equal(accountSummary.debit, 150);
  assert.equal(accountSummary.credit, 60);
  assert.equal(accountSummary.net, 90);
});

test('generateAnalysis interprets accounting negatives wrapped in parentheses', () => {
  const rows = [
    ['Transaction Type', 'Debit', 'Credit'],
    ['Invoice', '1,000.00', ''],
    ['Credit Memo', '(250.00)', ''],
    ['Payment', '', '1,000.00'],
    ['Adjustment', '', '(150.00)'],
  ];

  const analysis = generateAnalysis(rows);
  assert.equal(analysis.debitTotal, 750);
  assert.equal(analysis.creditTotal, 850);
  assert.deepStrictEqual(analysis.largestDebit, {
    amount: 1000,
    direction: 'debit',
    type: 'Invoice',
    className: null,
    account: null,
    number: null,
    item: null,
    property: null,
    payee: null,
    date: null,
  });
  assert.deepStrictEqual(analysis.largestCredit, {
    amount: 1000,
    direction: 'credit',
    type: 'Payment',
    className: null,
    account: null,
    number: null,
    item: null,
    property: null,
    payee: null,
    date: null,
  });
});
