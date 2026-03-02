import { findColumnIndex } from './columns.js';

const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30);
const MIN_VALID_EXCEL_SERIAL = 20000;
const MAX_VALID_EXCEL_SERIAL = 60000;

const QUICKBOOKS_HEADERS = [
  'Journal Date',
  'Journal No.',
  'Line No.',
  'Account Name',
  'Debits',
  'Credits',
  'Description',
  'Name',
  'Location',
  'Class',
];

const looksLikeExcelSerial = (value) =>
  typeof value === 'number' &&
  Number.isFinite(value) &&
  value >= MIN_VALID_EXCEL_SERIAL &&
  value <= MAX_VALID_EXCEL_SERIAL;

const parseExcelSerial = (value) => {
  if (!looksLikeExcelSerial(value)) {
    return null;
  }
  const milliseconds = Math.round(value * 24 * 60 * 60 * 1000);
  const date = new Date(EXCEL_EPOCH_MS + milliseconds);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseDate = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (value instanceof Date) {
    return new Date(value.getTime());
  }
  if (typeof value === 'number') {
    return parseExcelSerial(value);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const parsed = Date.parse(trimmed);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed);
    }
  }
  return null;
};

const formatDateForQuickBooks = (value) => {
  const parsed = parseDate(value);
  if (!parsed) {
    return null;
  }
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  const year = parsed.getFullYear();
  return `${month}/${day}/${year}`;
};

const parseAmount = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value * 100) / 100;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const negativeMatch = trimmed.match(/^\((.*)\)$/);
    const working = negativeMatch ? negativeMatch[1] : trimmed;
    const negative = Boolean(negativeMatch);
    const normalised = working.replace(/[$,\s]/g, '');
    if (!normalised) {
      return null;
    }
    const parsed = Number(normalised);
    if (Number.isNaN(parsed)) {
      return null;
    }
    const result = negative ? -parsed : parsed;
    return Math.round(result * 100) / 100;
  }
  return null;
};

const asString = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  return String(value ?? '');
};

const formatAmountForQuickBooks = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '';
  }
  return (Math.round(value * 100) / 100).toFixed(2);
};

const summariseRows = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [];
  }
  const deduped = Array.from(new Set(rows)).sort((a, b) => a - b);
  return deduped;
};

export const createQuickBooksPackage = (cleanData) => {
  const validations = [];
  const summary = {
    journalCount: 0,
    balancedCount: 0,
    totalDebit: 0,
    totalCredit: 0,
    autoNumberCount: 0,
  };

  if (!Array.isArray(cleanData) || cleanData.length < 2) {
    validations.push({
      severity: 'error',
      code: 'no-data',
      message: 'No cleaned ledger rows are available to export.',
      rows: [],
    });
    return { header: QUICKBOOKS_HEADERS, rows: [], validations, summary };
  }

  const headerRow = Array.isArray(cleanData[0]) ? cleanData[0] : [];

  const dateIndex = findColumnIndex(headerRow, 'date');
  const numberIndex = findColumnIndex(headerRow, 'number');
  const accountIndex = findColumnIndex(headerRow, 'account');
  const debitIndex = findColumnIndex(headerRow, 'debit');
  const creditIndex = findColumnIndex(headerRow, 'credit');

  const descriptionIndex = (() => {
    const descriptionColumn = findColumnIndex(headerRow, 'description');
    if (descriptionColumn !== -1) {
      return descriptionColumn;
    }
    return findColumnIndex(headerRow, 'item');
  })();

  const payeeIndex = findColumnIndex(headerRow, 'payee');
  const locationIndex = findColumnIndex(headerRow, 'property');
  const classIndex = findColumnIndex(headerRow, 'class');
  const itemIndex = findColumnIndex(headerRow, 'item');

  const missingColumns = [];
  if (dateIndex === -1) missingColumns.push('Date');
  if (accountIndex === -1) missingColumns.push('Account');
  if (debitIndex === -1) missingColumns.push('Debit');
  if (creditIndex === -1) missingColumns.push('Credit');

  if (missingColumns.length) {
    validations.push({
      severity: 'error',
      code: 'missing-columns',
      message: `Missing required column(s): ${missingColumns.join(', ')}.`,
      rows: [],
    });
    return { header: QUICKBOOKS_HEADERS, rows: [], validations, summary };
  }

  if (numberIndex === -1) {
    validations.push({
      severity: 'warning',
      code: 'missing-number-column',
      message:
        'Number column not found. Journal numbers will be auto-generated.',
      rows: [],
    });
  }

  const journalTotals = new Map();
  const lineCounters = new Map();
  const quickBooksRows = [];
  let autoJournalSequence = 0;
  let activeAutoJournal = null;
  const bodyRows = cleanData.slice(1);

  bodyRows.forEach((row, index) => {
    if (!Array.isArray(row)) {
      return;
    }
    const rowNumber = index + 2; // account for header row

    const rawDate = row[dateIndex];
    const formattedDate = formatDateForQuickBooks(rawDate);
    if (!formattedDate) {
      validations.push({
        severity: 'error',
        code: 'invalid-date',
        message: `Row ${rowNumber}: Missing or invalid journal date.`,
        rows: [rowNumber],
      });
    }

    const rawNumber = numberIndex === -1 ? '' : row[numberIndex];
    let journalNumber = asString(rawNumber);
    let autoGenerated = false;
    if (!journalNumber) {
      if (!activeAutoJournal) {
        autoJournalSequence += 1;
        const autoNumber = `AUTO-${String(autoJournalSequence).padStart(4, '0')}`;
        activeAutoJournal = { number: autoNumber, debit: 0, credit: 0 };
        summary.autoNumberCount += 1;
      }
      journalNumber = activeAutoJournal.number;
      autoGenerated = true;
      validations.push({
        severity: 'warning',
        code: 'auto-journal-number',
        message: `Row ${rowNumber}: Missing journal number; generated ${journalNumber}.`,
        rows: [rowNumber],
      });
    } else {
      activeAutoJournal = null;
    }

    const accountName = asString(row[accountIndex]);
    if (!accountName) {
      validations.push({
        severity: 'error',
        code: 'missing-account',
        message: `Row ${rowNumber}: Account name is required for QuickBooks import.`,
        rows: [rowNumber],
      });
    }

    const debit = parseAmount(row[debitIndex]);
    const credit = parseAmount(row[creditIndex]);

    const hasDebit = typeof debit === 'number' && Math.abs(debit) > 0;
    const hasCredit = typeof credit === 'number' && Math.abs(credit) > 0;

    if (hasDebit && hasCredit) {
      validations.push({
        severity: 'error',
        code: 'dual-amounts',
        message: `Row ${rowNumber}: Contains both debit and credit values. Only one is allowed.`,
        rows: [rowNumber],
      });
    }

    if (!hasDebit && !hasCredit) {
      validations.push({
        severity: 'error',
        code: 'missing-amount',
        message: `Row ${rowNumber}: Provide either a debit or credit amount.`,
        rows: [rowNumber],
      });
    }

    if (typeof debit === 'number' && debit < 0) {
      validations.push({
        severity: 'error',
        code: 'negative-debit',
        message: `Row ${rowNumber}: Debit amount cannot be negative.`,
        rows: [rowNumber],
      });
    }

    if (typeof credit === 'number' && credit < 0) {
      validations.push({
        severity: 'error',
        code: 'negative-credit',
        message: `Row ${rowNumber}: Credit amount cannot be negative.`,
        rows: [rowNumber],
      });
    }

    const debitValue = hasDebit ? Math.abs(debit) : 0;
    const creditValue = hasCredit ? Math.abs(credit) : 0;

    summary.totalDebit += debitValue;
    summary.totalCredit += creditValue;

    if (autoGenerated && activeAutoJournal) {
      activeAutoJournal.debit += debitValue;
      activeAutoJournal.credit += creditValue;
      const balanceDelta = Math.abs(
        activeAutoJournal.debit - activeAutoJournal.credit,
      );
      if (balanceDelta <= 0.01) {
        activeAutoJournal = null;
      }
    }

    const currentTotals = journalTotals.get(journalNumber) || {
      debit: 0,
      credit: 0,
      rows: [],
    };
    currentTotals.debit += debitValue;
    currentTotals.credit += creditValue;
    currentTotals.rows.push(rowNumber);
    journalTotals.set(journalNumber, currentTotals);

    const lineNo = (lineCounters.get(journalNumber) || 0) + 1;
    lineCounters.set(journalNumber, lineNo);

    const descriptionCandidate =
      descriptionIndex !== -1 && row[descriptionIndex]
        ? asString(row[descriptionIndex])
        : itemIndex !== -1 && row[itemIndex]
          ? asString(row[itemIndex])
          : '';

    const quickBooksRow = [
      formattedDate || '',
      journalNumber,
      lineNo,
      accountName,
      formatAmountForQuickBooks(debitValue),
      formatAmountForQuickBooks(creditValue),
      descriptionCandidate,
      payeeIndex !== -1 ? asString(row[payeeIndex]) : '',
      locationIndex !== -1 ? asString(row[locationIndex]) : '',
      classIndex !== -1 ? asString(row[classIndex]) : '',
    ];

    quickBooksRows.push(quickBooksRow);
  });

  summary.journalCount = journalTotals.size;

  journalTotals.forEach((totals, journalNumber) => {
    const debitRounded = Math.round(totals.debit * 100) / 100;
    const creditRounded = Math.round(totals.credit * 100) / 100;
    const difference = Math.abs(debitRounded - creditRounded);
    if (difference > 0.01) {
      validations.push({
        severity: 'error',
        code: 'unbalanced-journal',
        message: `Journal ${journalNumber} is unbalanced: debits ${debitRounded.toFixed(2)} vs credits ${creditRounded.toFixed(
          2,
        )}.`,
        rows: summariseRows(totals.rows),
      });
    } else {
      summary.balancedCount += 1;
    }
  });

  return {
    header: QUICKBOOKS_HEADERS,
    rows: quickBooksRows,
    validations,
    summary,
  };
};

export { QUICKBOOKS_HEADERS };
