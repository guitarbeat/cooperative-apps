import { findColumnIndex, reorderColumnsForOutput } from './columns.js';

const DEFAULT_OPTIONS = {
  trimWhitespace: true,
  removeEmptyRows: true,
  removeEmptyColumns: true,
  removeRepeatedHeaders: true,
  removeDuplicateRows: true,
  removeControlTotals: true,
  captureDiagnostics: false,
};

const KNOWN_TRANSACTION_TYPES = new Set([
  'credit memo',
  'invoice',
  'payment',
  'journal',
  'journal entry',
  'check',
  'check void',
  'eft',
]);

const ACCOUNT_PATTERN = /\d{2,}-\d{4}/;
const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30);
const MIN_VALID_EXCEL_SERIAL = 20000; // ~1954-10-04
const MAX_VALID_EXCEL_SERIAL = 60000; // ~2064-04-08 (Excel serial 60000 from 1899-12-30 epoch)

const TOTAL_MARKER_PATTERN =
  /^(?:(?:grand|interface|control|batch)\s+)?totals?(?:\b|[:])|^totals?\s+for\b|^total\s+for\b|(?:\s|^)totals?(?:\s|$)/i;

const amountFromValue = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    let working = trimmed;
    let negative = false;

    const accountingNegativeMatch = working.match(/^\((.*)\)$/);
    if (accountingNegativeMatch) {
      negative = true;
      // eslint-disable-next-line prefer-destructuring
      working = accountingNegativeMatch[1];
    }

    const normalised = working.replace(/[$,\s]/g, '');
    if (!normalised) {
      return null;
    }

    const parsed = Number(normalised);
    if (!Number.isNaN(parsed)) {
      return negative ? -parsed : parsed;
    }
  }

  return null;
};

const cellHasContent = (value) => {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim() !== '';
  }

  return true;
};

const isTotalMarker = (value) => {
  if (typeof value !== 'string') {
    return false;
  }

  const normalised = value.trim();
  if (!normalised) {
    return false;
  }

  if (TOTAL_MARKER_PATTERN.test(normalised)) {
    return true;
  }

  const lower = normalised.toLowerCase();
  if (/\btotal(s)?$/.test(lower)) {
    return true;
  }

  return false;
};

const numbersAreEqual = (first, second) => {
  if (typeof first !== 'number' || typeof second !== 'number') {
    return false;
  }

  return Math.abs(first - second) < 1e-6;
};

const looksLikeExcelSerial = (value) =>
  typeof value === 'number' &&
  Number.isFinite(value) &&
  value >= MIN_VALID_EXCEL_SERIAL &&
  value <= MAX_VALID_EXCEL_SERIAL;

const excelSerialToISODate = (serial) => {
  if (!looksLikeExcelSerial(serial)) {
    return null;
  }

  const milliseconds = Math.round(serial * 24 * 60 * 60 * 1000);
  const date = new Date(EXCEL_EPOCH_MS + milliseconds);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().split('T')[0];
};

const isDateLike = (value) => {
  if (value instanceof Date) {
    return true;
  }

  if (typeof value === 'number') {
    return looksLikeExcelSerial(value);
  }

  if (typeof value === 'string') {
    const timestamp = Date.parse(value);
    return !Number.isNaN(timestamp);
  }

  return false;
};

const normaliseDateCell = (value) => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }

  if (typeof value === 'number') {
    const converted = excelSerialToISODate(value);
    return converted ?? value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return '';
    }

    const timestamp = Date.parse(trimmed);
    if (!Number.isNaN(timestamp)) {
      return new Date(timestamp).toISOString().split('T')[0];
    }

    return trimmed;
  }

  return value;
};

const looksLikeAccount = (value) => {
  if (typeof value !== 'string') {
    return false;
  }

  return ACCOUNT_PATTERN.test(value);
};

const mergeOptions = (options) => {
  if (options && typeof options === 'object') {
    return { ...DEFAULT_OPTIONS, ...options };
  }

  return { ...DEFAULT_OPTIONS };
};

const canonicaliseHeaderRow = (row) => {
  if (!Array.isArray(row) || row.length === 0) {
    return false;
  }

  const normalised = row.map((cell) =>
    typeof cell === 'string' ? cell.trim().toLowerCase() : '',
  );

  if (normalised[0] !== 'type' || normalised[1] !== 'number') {
    return false;
  }

  const hasAccount = normalised.includes('account');
  const hasDebit = normalised.includes('debit');
  const hasCredit = normalised.includes('credit');

  if (!(hasAccount && hasDebit && hasCredit)) {
    return false;
  }

  const typeIndex = normalised.indexOf('type');
  if (typeIndex !== -1) {
    row[typeIndex] = 'Type';
  }

  const numberIndex = normalised.indexOf('number');
  if (numberIndex !== -1) {
    row[numberIndex] = 'Number';
  }

  const dateIndex = normalised.indexOf('date');
  if (dateIndex !== -1) {
    row[dateIndex] = 'Date';
  }

  const potentialItemIndex = normalised.findIndex((token) => {
    if (token === 'item') return true;
    if (token === 'memo' || token === 'name' || token === 'description')
      return true;
    return false;
  });
  if (potentialItemIndex !== -1) {
    row[potentialItemIndex] = 'Item';
  }

  const potentialClassIndex = normalised.findIndex((token) => {
    if (token === 'class') return true;
    if (token === 'to') return true;
    return false;
  });
  if (potentialClassIndex !== -1) {
    row[potentialClassIndex] = 'Class';
  }

  const accountIndex = normalised.findIndex((token) =>
    token.includes('account'),
  );
  if (accountIndex !== -1) {
    row[accountIndex] = 'Account';
  }

  const debitIndex = normalised.indexOf('debit');
  if (debitIndex !== -1) {
    row[debitIndex] = 'Debit';
  }

  const creditIndex = normalised.indexOf('credit');
  if (creditIndex !== -1) {
    row[creditIndex] = 'Credit';
  }

  return true;
};

const isLikelyHeaderRow = (row) => canonicaliseHeaderRow([...row]);

const isKnownTransactionType = (value) => {
  if (typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return false;
  }

  return KNOWN_TRANSACTION_TYPES.has(trimmed);
};

const hasAllOptions = (options) => {
  if (!options || typeof options !== 'object') {
    return false;
  }

  return Object.keys(DEFAULT_OPTIONS).every((key) =>
    Object.prototype.hasOwnProperty.call(options, key),
  );
};

const normaliseCell = (cell, options, stats) => {
  const effectiveOptions = hasAllOptions(options)
    ? options
    : mergeOptions(options);

  if (cell === null || cell === undefined) return '';
  if (typeof cell === 'string') {
    if (effectiveOptions.trimWhitespace) {
      const trimmed = cell.trim();
      if (trimmed !== cell) {
        stats.trimmedCells = (stats.trimmedCells || 0) + 1;
      }
      return trimmed;
    }
    return cell;
  }
  return cell;
};

const toRowId = (index) => (typeof index === 'number' ? `row-${index}` : null);

const sanitizeName = (value) => {
  let workingValue = value;

  if (workingValue === null || workingValue === undefined) {
    workingValue = '';
  }

  if (typeof workingValue !== 'string') {
    workingValue = String(workingValue);
  }

  return (
    workingValue
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'cleaned-data'
  );
};

const parseRowId = (rowId) => {
  if (typeof rowId !== 'string') {
    return null;
  }

  const match = rowId.match(/^row-(\d+)$/);
  if (!match) {
    return null;
  }

  const parsed = Number.parseInt(match[1], 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const VIOLATION_SPECS = {
  'removed-empty-row': {
    severity: 'error',
    message: () => 'Row removed because it had no meaningful data.',
  },
  'removed-duplicate-row': {
    severity: 'error',
    message: () => 'Row removed as a duplicate of an earlier record.',
  },
  'removed-repeated-header': {
    severity: 'error',
    message: () => 'Row removed because it repeated the header.',
  },
  'removed-control-total-row': {
    severity: 'error',
    message: (entry, header) => {
      const indices = Array.isArray(entry.columnIndices)
        ? entry.columnIndices
        : [];
      if (indices.length > 0) {
        const columnLabels = indices
          .map((index) => {
            const headerCell = Array.isArray(header)
              ? header[index]
              : undefined;
            if (typeof headerCell === 'string' && headerCell.trim() !== '') {
              return headerCell;
            }
            return `Column ${index + 1}`;
          })
          .join(', ');
        return `Row removed because it appears to be a control total containing summary values in ${columnLabels}.`;
      }
      return 'Row removed because it appears to be a control total rather than transaction-level data.';
    },
  },
  'normalised-date': {
    severity: 'warning',
    message: () => 'Date normalised to ISO format.',
  },
  'moved-gap-amount-to-debit': {
    severity: 'warning',
    message: () => 'Debit amount backfilled from an adjacent column.',
  },
  'moved-amount-to-credit': {
    severity: 'warning',
    message: () => 'Credit amount reassigned from another column.',
  },
  'moved-account-from-date': {
    severity: 'warning',
    message: () => 'Account value moved out of the Date column.',
  },
  'filled-debit-from-gap': {
    severity: 'warning',
    message: () => 'Debit populated from a nearby amount.',
  },
  'filled-credit-from-gap': {
    severity: 'warning',
    message: () => 'Credit populated from a nearby amount.',
  },
  'moved-class-amount-to-credit': {
    severity: 'warning',
    message: () => 'Credit populated using the Class column amount.',
  },
  'moved-type-to-item': {
    severity: 'warning',
    message: () => 'Non-standard type copied into the Item column.',
  },
  'extracted-class-tag': {
    severity: 'warning',
    message: () => 'Class tag extracted from the Number column.',
  },
  'moved-number-to-class': {
    severity: 'warning',
    message: () => 'Number stored in the Class column for context.',
  },
  'moved-item-amount-to-credit': {
    severity: 'warning',
    message: () => 'Credit populated using an amount from the Item column.',
  },
  'parsed-debit-string': {
    severity: 'warning',
    message: () => 'Debit parsed from a text value.',
  },
  'parsed-credit-string': {
    severity: 'warning',
    message: () => 'Credit parsed from a text value.',
  },
  'propagated-detail-context': {
    severity: 'warning',
    message: () => 'Item/Class backfilled from a detail row.',
  },
};

const buildViolations = (diagnostics, headerRow) => {
  if (!Array.isArray(diagnostics) || diagnostics.length === 0) {
    return [];
  }

  const header = Array.isArray(headerRow) ? headerRow : [];

  const violations = diagnostics.reduce((acc, entry) => {
    if (!entry || typeof entry.category !== 'string') {
      return acc;
    }

    const spec = VIOLATION_SPECS[entry.category];
    if (!spec) {
      return acc;
    }

    const candidateRowIndex =
      typeof entry.rowIndex === 'number'
        ? entry.rowIndex
        : (parseRowId(entry.rowId) ??
          (typeof entry.rowNumber === 'number'
            ? entry.rowNumber
            : entry.sourceRow));

    if (
      typeof candidateRowIndex !== 'number' ||
      Number.isNaN(candidateRowIndex)
    ) {
      return acc;
    }

    if (candidateRowIndex <= 0) {
      return acc;
    }

    const columnIndices = Array.isArray(entry.columnIndices)
      ? [
          ...new Set(
            entry.columnIndices.filter(
              (index) => typeof index === 'number' && index >= 0,
            ),
          ),
        ]
      : [];

    const violation = {
      rowId: entry.rowId ?? toRowId(candidateRowIndex),
      rowIndex: candidateRowIndex,
      severity: spec.severity,
      ruleCode: entry.category,
      message: spec.message(entry, header),
    };

    if (columnIndices.length) {
      violation.columnIndices = columnIndices;
      violation.columnIds = columnIndices.map(
        (index) => header[index] ?? `Column ${index + 1}`,
      );
    }

    acc.push(violation);
    return acc;
  }, []);

  const severityWeight = { warning: 1, error: 2 };

  return violations.sort((a, b) => {
    if (a.rowIndex !== b.rowIndex) {
      return a.rowIndex - b.rowIndex;
    }
    const aWeight = severityWeight[a.severity] || 0;
    const bWeight = severityWeight[b.severity] || 0;
    return bWeight - aWeight;
  });
};

const cleanSheet = (data, options = DEFAULT_OPTIONS) => {
  const effectiveOptions = mergeOptions(options);
  const stats = {
    originalRows: Array.isArray(data) ? data.length : 0,
    cleanedRows: 0,
    duplicateRowsRemoved: 0,
    emptyRowsRemoved: 0,
    emptyColumnsRemoved: 0,
    repeatedHeadersRemoved: 0,
    trimmedCells: 0,
    amountsReassigned: 0,
    datesNormalised: 0,
    detailContextPropagations: 0,
    controlTotalsRemoved: 0,
  };

  const diagnostics = effectiveOptions.captureDiagnostics ? [] : null;
  const cleanedRowIds = [];
  const recordDiagnostic = (category, detail = {}) => {
    if (!diagnostics) {
      return;
    }

    diagnostics.push({ category, ...detail });
  };

  if (!Array.isArray(data) || data.length === 0) {
    const payload = { cleaned: [], stats, violations: [] };
    if (diagnostics) {
      payload.diagnostics = diagnostics;
    }

    return {
      schemaVersion: 2,
      data: payload,
      ...payload,
    };
  }

  const cleanedRows = [];
  let header = null;
  const seenRows = new Set();

  const ensureLength = (row, length) => {
    while (row.length < length) {
      row.push('');
    }
  };

  const indexForHeader = (headerRow, name) => findColumnIndex(headerRow, name);

  const detectControlTotalRow = (row, headerRow) => {
    if (
      !Array.isArray(row) ||
      !Array.isArray(headerRow) ||
      headerRow.length === 0
    ) {
      return { isControlTotal: false, columnIndices: [] };
    }

    const debitIndex = indexForHeader(headerRow, 'Debit');
    const creditIndex = indexForHeader(headerRow, 'Credit');
    const accountIndex = indexForHeader(headerRow, 'Account');

    if (debitIndex === -1 && creditIndex === -1) {
      return { isControlTotal: false, columnIndices: [] };
    }

    const primaryIndices = [
      indexForHeader(headerRow, 'Type'),
      indexForHeader(headerRow, 'Number'),
      indexForHeader(headerRow, 'Date'),
      indexForHeader(headerRow, 'Item'),
      indexForHeader(headerRow, 'Class'),
      indexForHeader(headerRow, 'Account'),
    ].filter((idx) => idx !== -1);

    const primaryHasContent = primaryIndices.some((idx) => {
      const cell = row[idx];
      if (!cellHasContent(cell)) {
        return false;
      }

      if (isTotalMarker(cell)) {
        return false;
      }

      return true;
    });

    if (primaryHasContent) {
      return { isControlTotal: false, columnIndices: [] };
    }

    const permissibleAmountGapIndices = new Set();
    if (
      accountIndex !== -1 &&
      debitIndex !== -1 &&
      debitIndex - accountIndex > 1
    ) {
      for (
        let gapIndex = accountIndex + 1;
        gapIndex < debitIndex;
        gapIndex += 1
      ) {
        const headerCell = headerRow[gapIndex];
        if (
          !headerCell ||
          (typeof headerCell === 'string' && headerCell.trim() === '')
        ) {
          permissibleAmountGapIndices.add(gapIndex);
        }
      }
    }

    const amountColumnIndices = new Set();

    const otherContent = row.some((cell, idx) => {
      if (idx === debitIndex || idx === creditIndex) {
        return false;
      }

      if (primaryIndices.includes(idx)) {
        return false;
      }

      if (permissibleAmountGapIndices.has(idx)) {
        const amount = amountFromValue(cell);
        if (typeof amount === 'number' && !Number.isNaN(amount)) {
          amountColumnIndices.add(idx);
          return false;
        }
      }

      if (isTotalMarker(cell)) {
        return false;
      }

      return cellHasContent(cell);
    });

    if (otherContent) {
      return { isControlTotal: false, columnIndices: [] };
    }

    const debitAmount =
      debitIndex !== -1 ? amountFromValue(row[debitIndex]) : null;
    const creditAmount =
      creditIndex !== -1 ? amountFromValue(row[creditIndex]) : null;

    if (
      typeof debitAmount === 'number' &&
      !Number.isNaN(debitAmount) &&
      debitAmount !== 0 &&
      debitIndex !== -1
    ) {
      amountColumnIndices.add(debitIndex);
    }

    if (
      typeof creditAmount === 'number' &&
      !Number.isNaN(creditAmount) &&
      creditAmount !== 0 &&
      creditIndex !== -1
    ) {
      amountColumnIndices.add(creditIndex);
    }

    if (
      amountColumnIndices.size === 0 &&
      permissibleAmountGapIndices.size > 0
    ) {
      Array.from(permissibleAmountGapIndices).forEach((idx) => {
        const amount = amountFromValue(row[idx]);
        if (
          typeof amount === 'number' &&
          !Number.isNaN(amount) &&
          amount !== 0
        ) {
          amountColumnIndices.add(idx);
        }
      });
    }

    const sortedAmountColumns = Array.from(amountColumnIndices).sort(
      (a, b) => a - b,
    );

    if (sortedAmountColumns.length === 0) {
      return { isControlTotal: false, columnIndices: [] };
    }

    return { isControlTotal: true, columnIndices: sortedAmountColumns };
  };

  const getControlTotalMetadata = (row, headerRow) => {
    if (
      !Array.isArray(row) ||
      !Array.isArray(headerRow) ||
      headerRow.length === 0
    ) {
      return null;
    }

    const detection = detectControlTotalRow(row, headerRow);
    if (!detection.isControlTotal) {
      return null;
    }

    return {
      matched: true,
      columnIndices: detection.columnIndices,
    };
  };

  data.forEach((row, rowIndex) => {
    const workingRow = Array.isArray(row) ? [...row] : [row];
    const processedRow = workingRow.map((cell) =>
      normaliseCell(cell, effectiveOptions, stats),
    );
    const hasContent = processedRow.some(
      (cell) => cell !== '' && cell !== null && cell !== undefined,
    );
    const currentRowId = toRowId(rowIndex);

    if (!hasContent) {
      if (!header) {
        return;
      }
      if (effectiveOptions.removeEmptyRows) {
        stats.emptyRowsRemoved += 1;
        recordDiagnostic('removed-empty-row', {
          sourceRow: rowIndex,
          rowId: currentRowId,
          rowIndex,
        });
        return;
      }
    }

    if (!header) {
      header = [...processedRow];
      canonicaliseHeaderRow(header);
      cleanedRows.push(header);
      cleanedRowIds.push(currentRowId);
      return;
    }

    const paddedRow = [...processedRow];
    if (paddedRow.length > header.length) {
      const difference = paddedRow.length - header.length;
      for (let i = 0; i < difference; i += 1) {
        header.push(`Column ${header.length + 1}`);
      }
      cleanedRows.forEach((existingRow) =>
        ensureLength(existingRow, header.length),
      );
    }

    ensureLength(paddedRow, header.length);

    let matchesHeader = false;
    if (effectiveOptions.removeRepeatedHeaders) {
      const candidate = [...paddedRow];
      canonicaliseHeaderRow(candidate);
      matchesHeader =
        candidate.length === header.length &&
        candidate.every((cell, index) => cell === header[index]);

      if (!matchesHeader && isLikelyHeaderRow(candidate)) {
        matchesHeader = true;
      }
    }

    if (matchesHeader) {
      stats.repeatedHeadersRemoved += 1;
      // Reset duplicate tracking when a new header section begins so
      // identical detail rows in later sections aren't treated as
      // duplicates of earlier pages. Repeated headers typically indicate
      // a new table following a page break in the source export.
      seenRows.clear();
      recordDiagnostic('removed-repeated-header', {
        sourceRow: rowIndex,
        row: paddedRow,
        rowId: currentRowId,
        rowIndex,
      });
      return;
    }

    const controlTotalMetadata = effectiveOptions.removeControlTotals
      ? getControlTotalMetadata(paddedRow, header)
      : null;

    if (controlTotalMetadata?.matched) {
      stats.controlTotalsRemoved += 1;
      recordDiagnostic('removed-control-total-row', {
        sourceRow: rowIndex,
        row: paddedRow,
        rowId: currentRowId,
        rowIndex,
        columnIndices: controlTotalMetadata.columnIndices,
      });
      return;
    }

    const key = JSON.stringify(paddedRow);
    if (effectiveOptions.removeDuplicateRows && seenRows.has(key)) {
      stats.duplicateRowsRemoved += 1;
      recordDiagnostic('removed-duplicate-row', {
        sourceRow: rowIndex,
        row: paddedRow,
        rowId: currentRowId,
        rowIndex,
      });
      return;
    }

    seenRows.add(key);
    cleanedRows.push(paddedRow);
    cleanedRowIds.push(currentRowId);
  });

  if (!header) {
    const payload = { cleaned: [], stats, violations: [] };
    if (diagnostics) {
      payload.diagnostics = diagnostics;
    }

    return {
      schemaVersion: 2,
      data: payload,
      ...payload,
    };
  }

  const harmoniseLedgerRows = () => {
    if (cleanedRows.length <= 1) {
      return;
    }

    const headerRow = cleanedRows[0];
    const dateIndex = findColumnIndex(headerRow, 'date');
    const classIndex = findColumnIndex(headerRow, 'class');
    const accountIndex = findColumnIndex(headerRow, 'account');
    const debitIndex = findColumnIndex(headerRow, 'debit');
    const creditIndex = findColumnIndex(headerRow, 'credit');
    const typeIndex = findColumnIndex(headerRow, 'type');
    const numberIndex = findColumnIndex(headerRow, 'number');
    const itemIndex = findColumnIndex(headerRow, 'item');

    if (
      dateIndex === -1 ||
      classIndex === -1 ||
      accountIndex === -1 ||
      debitIndex === -1 ||
      creditIndex === -1 ||
      typeIndex === -1 ||
      numberIndex === -1 ||
      itemIndex === -1
    ) {
      return;
    }

    const blankAmountIndices = headerRow.reduce((indices, cell, index) => {
      if (index > accountIndex && index < debitIndex) {
        if (!cell || String(cell).trim() === '') {
          indices.push(index);
        }
      }
      return indices;
    }, []);

    let lastTransactionRow = null;

    cleanedRows.slice(1).forEach((row, rowOffset) => {
      if (!Array.isArray(row)) {
        return;
      }

      canonicaliseHeaderRow(row);
      const rowId = cleanedRowIds[rowOffset + 1];
      const rowIndex = rowOffset + 1;

      if (dateIndex !== -1) {
        const normalisedDate = normaliseDateCell(row[dateIndex]);
        if (normalisedDate !== row[dateIndex]) {
          row[dateIndex] = normalisedDate;
          stats.datesNormalised += 1;
          recordDiagnostic('normalised-date', {
            rowNumber: rowOffset + 1,
            rowIndex,
            rowId,
            columnIndices: [dateIndex],
            value: normalisedDate,
          });
        }
      }

      const rawDate = row[dateIndex];
      const rawAccount = row[accountIndex];
      const dateIsActualDate = isDateLike(rawDate);
      const accountLooksValid =
        looksLikeAccount(rawAccount) ||
        (typeof rawAccount === 'string' && rawAccount.trim() !== '');
      const dateLooksAccount = looksLikeAccount(rawDate);

      const gapAmounts = blankAmountIndices
        .map((index) => ({ index, value: amountFromValue(row[index]) }))
        .filter((entry) => entry.value !== null);

      let debitAmount = amountFromValue(row[debitIndex]);
      let creditAmount = amountFromValue(row[creditIndex]);

      const classAmountCandidate =
        classIndex !== -1 ? amountFromValue(row[classIndex]) : null;
      const classCellHadAmount = classAmountCandidate !== null;

      if (dateIsActualDate && accountLooksValid && gapAmounts.length > 0) {
        const [firstGap] = gapAmounts;
        row[debitIndex] = firstGap.value;
        debitAmount = firstGap.value;
        row[firstGap.index] = '';
        stats.amountsReassigned += 1;
        recordDiagnostic('moved-gap-amount-to-debit', {
          rowNumber: rowOffset + 1,
          rowIndex,
          rowId,
          columnIndices: [debitIndex, firstGap.index],
          value: firstGap.value,
          sourceColumn: firstGap.index,
        });
        gapAmounts.shift();
      }

      if (!accountLooksValid && dateLooksAccount) {
        row[accountIndex] = rawDate;
        row[dateIndex] = '';

        let amount = null;

        if (classCellHadAmount) {
          amount = creditAmount !== null ? creditAmount : classAmountCandidate;
          row[classIndex] = '';
        } else if (gapAmounts.length > 0) {
          amount = gapAmounts[0].value;
          row[gapAmounts[0].index] = '';
          gapAmounts.shift();
        }

        if (amount !== null) {
          row[creditIndex] = amount;
          creditAmount = amount;
          stats.amountsReassigned += 1;
          recordDiagnostic('moved-amount-to-credit', {
            rowNumber: rowOffset + 1,
            rowIndex,
            rowId,
            columnIndices: [creditIndex],
            value: amount,
          });
        }

        recordDiagnostic('moved-account-from-date', {
          rowNumber: rowOffset + 1,
          rowIndex,
          rowId,
          columnIndices: [accountIndex, dateIndex],
          account: row[accountIndex],
        });
      }

      gapAmounts.forEach(({ index, value }) => {
        if (value === null) {
          return;
        }

        if (debitAmount !== null && numbersAreEqual(debitAmount, value)) {
          row[index] = '';
          return;
        }

        if (creditAmount !== null && numbersAreEqual(creditAmount, value)) {
          row[index] = '';
          return;
        }

        if (debitAmount === null) {
          row[debitIndex] = value;
          debitAmount = value;
          row[index] = '';
          stats.amountsReassigned += 1;
          recordDiagnostic('filled-debit-from-gap', {
            rowNumber: rowOffset + 1,
            rowIndex,
            rowId,
            columnIndices: [debitIndex, index],
            value,
            sourceColumn: index,
          });
          return;
        }

        if (creditAmount === null) {
          row[creditIndex] = value;
          creditAmount = value;
          row[index] = '';
          stats.amountsReassigned += 1;
          recordDiagnostic('filled-credit-from-gap', {
            rowNumber: rowOffset + 1,
            rowIndex,
            rowId,
            columnIndices: [creditIndex, index],
            value,
            sourceColumn: index,
          });
          return;
        }

        if (numbersAreEqual(debitAmount, creditAmount)) {
          row[index] = '';
        }
      });

      if (
        classCellHadAmount &&
        (creditAmount === null ||
          creditAmount === undefined ||
          creditAmount === '') &&
        row[classIndex] !== ''
      ) {
        row[creditIndex] = classAmountCandidate;
        creditAmount = classAmountCandidate;
        row[classIndex] = '';
        stats.amountsReassigned += 1;
        recordDiagnostic('moved-class-amount-to-credit', {
          rowNumber: rowOffset + 1,
          rowIndex,
          rowId,
          columnIndices: [classIndex, creditIndex],
          value: classAmountCandidate,
        });
      }

      const typeCell = row[typeIndex];
      const numberCell = row[numberIndex];
      const itemCell = row[itemIndex];
      const classCell = row[classIndex];

      const normalisedType =
        typeof typeCell === 'string' ? typeCell.trim() : '';
      const normalisedNumber =
        typeof numberCell === 'string' ? numberCell.trim() : '';
      const classTagMatch = normalisedNumber.match(/^class:\s*(.+)$/i);

      if (!isKnownTransactionType(normalisedType) && normalisedType) {
        if (
          !itemCell ||
          (typeof itemCell === 'string' && itemCell.trim() === '')
        ) {
          row[itemIndex] = normalisedType;
        } else if (typeof row[itemIndex] === 'string') {
          const existing = row[itemIndex].trim();
          if (!existing.includes(normalisedType)) {
            row[itemIndex] = `${existing} ${normalisedType}`.trim();
          }
        }
        row[typeIndex] = '';
        recordDiagnostic('moved-type-to-item', {
          rowNumber: rowOffset + 1,
          rowIndex,
          rowId,
          columnIndices: [typeIndex, itemIndex],
          value: normalisedType,
        });
      }

      if (classTagMatch) {
        row[classIndex] = classTagMatch[1].trim();
        row[numberIndex] = '';
        recordDiagnostic('extracted-class-tag', {
          rowNumber: rowOffset + 1,
          rowIndex,
          rowId,
          columnIndices: [classIndex, numberIndex],
          value: row[classIndex],
        });
      } else if (!isKnownTransactionType(normalisedType) && normalisedNumber) {
        if (
          !classCell ||
          (typeof classCell === 'string' && classCell.trim() === '')
        ) {
          row[classIndex] = normalisedNumber;
        } else if (
          typeof row[classIndex] === 'string' &&
          !row[classIndex].includes(normalisedNumber)
        ) {
          row[classIndex] = `${row[classIndex]} ${normalisedNumber}`.trim();
        }
        row[numberIndex] = '';
        recordDiagnostic('moved-number-to-class', {
          rowNumber: rowOffset + 1,
          rowIndex,
          rowId,
          columnIndices: [classIndex, numberIndex],
          value: normalisedNumber,
        });
      }

      const strayItemAmount = amountFromValue(row[itemIndex]);
      if (
        strayItemAmount !== null &&
        (row[debitIndex] === '' ||
          row[debitIndex] === null ||
          row[debitIndex] === undefined) &&
        (row[creditIndex] === '' ||
          row[creditIndex] === null ||
          row[creditIndex] === undefined)
      ) {
        row[creditIndex] = strayItemAmount;
        row[itemIndex] = '';
        stats.amountsReassigned += 1;
        recordDiagnostic('moved-item-amount-to-credit', {
          rowNumber: rowOffset + 1,
          rowIndex,
          rowId,
          columnIndices: [itemIndex, creditIndex],
          value: strayItemAmount,
        });
      }

      if (typeof row[debitIndex] === 'string') {
        const parsedDebit = amountFromValue(row[debitIndex]);
        if (parsedDebit !== null) {
          row[debitIndex] = parsedDebit;
          recordDiagnostic('parsed-debit-string', {
            rowNumber: rowOffset + 1,
            rowIndex,
            rowId,
            columnIndices: [debitIndex],
            value: parsedDebit,
          });
        }
      }

      if (typeof row[creditIndex] === 'string') {
        const parsedCredit = amountFromValue(row[creditIndex]);
        if (parsedCredit !== null) {
          row[creditIndex] = parsedCredit;
          recordDiagnostic('parsed-credit-string', {
            rowNumber: rowOffset + 1,
            rowIndex,
            rowId,
            columnIndices: [creditIndex],
            value: parsedCredit,
          });
        }
      }

      const hasTransactionIdentifier = Boolean(
        (typeIndex !== -1 &&
          typeof row[typeIndex] === 'string' &&
          row[typeIndex].trim()) ||
        (numberIndex !== -1 &&
          typeof row[numberIndex] === 'string' &&
          row[numberIndex].trim()) ||
        (dateIndex !== -1 &&
          row[dateIndex] !== '' &&
          row[dateIndex] !== null &&
          row[dateIndex] !== undefined),
      );

      if (hasTransactionIdentifier) {
        lastTransactionRow = { row, rowId, rowIndex };
        return;
      }

      if (!lastTransactionRow) {
        return;
      }

      const detailItem = itemIndex !== -1 ? row[itemIndex] : '';
      const detailClass = classIndex !== -1 ? row[classIndex] : '';

      const propagatedColumns = [];

      if (
        itemIndex !== -1 &&
        (!lastTransactionRow.row[itemIndex] ||
          `${lastTransactionRow.row[itemIndex]}`.trim() === '') &&
        detailItem
      ) {
        lastTransactionRow.row[itemIndex] = detailItem;
        propagatedColumns.push(itemIndex);
      }

      if (
        classIndex !== -1 &&
        (!lastTransactionRow.row[classIndex] ||
          `${lastTransactionRow.row[classIndex]}`.trim() === '') &&
        detailClass
      ) {
        lastTransactionRow.row[classIndex] = detailClass;
        propagatedColumns.push(classIndex);
      }

      if (propagatedColumns.length > 0) {
        stats.detailContextPropagations += 1;
        recordDiagnostic('propagated-detail-context', {
          rowNumber: lastTransactionRow.rowIndex,
          rowIndex: lastTransactionRow.rowIndex,
          rowId: lastTransactionRow.rowId,
          sourceRow: rowIndex,
          sourceRowId: rowId,
          columnIndices: propagatedColumns,
        });
      }
    });
  };

  harmoniseLedgerRows();

  if (effectiveOptions.removeEmptyColumns) {
    const columnsToKeep = header.map((headerCell, columnIndex) => {
      if (
        headerCell !== '' &&
        headerCell !== null &&
        headerCell !== undefined
      ) {
        return true;
      }
      return cleanedRows.some((row, rowIndex) => {
        if (rowIndex === 0) return false;
        const value = row[columnIndex];
        return value !== '' && value !== null && value !== undefined;
      });
    });

    const emptyColumnsRemoved = columnsToKeep.filter((keep) => !keep).length;
    stats.emptyColumnsRemoved = emptyColumnsRemoved;

    if (emptyColumnsRemoved > 0) {
      cleanedRows.forEach((row, rowIndex) => {
        cleanedRows[rowIndex] = row.filter(
          (_, columnIndex) => columnsToKeep[columnIndex],
        );
      });
    }
  }

  const { rows: orderedRows, columnOrder } =
    reorderColumnsForOutput(cleanedRows);
  cleanedRows.splice(0, cleanedRows.length, ...orderedRows);

  if (diagnostics && Array.isArray(columnOrder) && columnOrder.length) {
    const columnRemap = new Map();
    columnOrder.forEach((sourceIndex, newIndex) => {
      columnRemap.set(sourceIndex, newIndex);
    });

    diagnostics.forEach((entry) => {
      if (!entry || !Array.isArray(entry.columnIndices)) {
        return;
      }

      entry.columnIndices = entry.columnIndices
        .map((originalIndex) =>
          columnRemap.has(originalIndex)
            ? columnRemap.get(originalIndex)
            : originalIndex,
        )
        .filter((index) => typeof index === 'number' && index >= 0)
        .sort((a, b) => a - b);
    });
  }

  stats.cleanedRows = cleanedRows.length;

  const violations = diagnostics
    ? buildViolations(diagnostics, cleanedRows[0])
    : [];

  const payload = { cleaned: cleanedRows, stats, violations };
  if (diagnostics) {
    payload.diagnostics = diagnostics;
  }

  const result = {
    schemaVersion: 2,
    data: payload,
    ...payload,
  };

  return result;
};

export { cleanSheet, DEFAULT_OPTIONS, normaliseCell, sanitizeName };
