import { findColumnIndex } from './columns.js';

const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30);
const MIN_VALID_EXCEL_SERIAL = 20000; // ~1954-10-04
const MAX_VALID_EXCEL_SERIAL = 60000; // ~2064-04-08 (Excel serial 60000 from 1899-12-30 epoch)

const parseAmount = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    let normalised = trimmed.replace(/[$,\s]/g, '');
    let sign = 1;

    if (/^\(.*\)$/.test(normalised)) {
      normalised = normalised.slice(1, -1);
      sign *= -1;
    }

    if (normalised.endsWith('-')) {
      normalised = normalised.slice(0, -1);
      sign *= -1;
    }

    if (normalised.startsWith('+')) {
      normalised = normalised.slice(1);
    } else if (normalised.startsWith('-')) {
      normalised = normalised.slice(1);
      sign *= -1;
    }

    if (!normalised) {
      return null;
    }

    const parsed = Number(normalised);
    if (!Number.isNaN(parsed)) {
      return sign * parsed;
    }
  }

  return null;
};

const parseDate = (value) => {
  if (!value && value !== 0) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return null;
    }
    if (value < MIN_VALID_EXCEL_SERIAL || value > MAX_VALID_EXCEL_SERIAL) {
      return null;
    }

    const milliseconds = value * 24 * 60 * 60 * 1000;
    const candidate = new Date(EXCEL_EPOCH_MS + milliseconds);
    if (!Number.isNaN(candidate.getTime())) {
      return candidate;
    }
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

const normaliseKey = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value.trim();
  }
  return String(value).trim();
};

const pickLabel = (current, incoming) => {
  if (!incoming) {
    return current;
  }
  if (!current) {
    return incoming;
  }
  return incoming.length > current.length ? incoming : current;
};

const safeShare = (value, total) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }
  if (typeof total !== 'number' || Number.isNaN(total) || total === 0) {
    return null;
  }
  return value / total;
};

const formatPeriodKey = (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const generateAnalysis = (rows) => {
  if (!Array.isArray(rows) || rows.length <= 1) {
    return null;
  }

  const header = rows[0].map((cell) => normaliseKey(cell));
  const bodyRows = rows
    .slice(1)
    .filter(
      (row) =>
        Array.isArray(row) &&
        row.some((cell) => cell !== '' && cell !== null && cell !== undefined),
    );

  if (!bodyRows.length) {
    return null;
  }

  const locateIndex = (key) => findColumnIndex(header, key);

  const typeIndex = locateIndex('type');
  const classIndex = locateIndex('class');
  const accountIndex = locateIndex('account');
  const debitIndex = locateIndex('debit');
  const creditIndex = locateIndex('credit');
  const dateIndex = locateIndex('date');
  const itemIndex = locateIndex('item');
  const numberIndex = locateIndex('number');
  const propertyIndex = locateIndex('property');
  const payeeIndex = locateIndex('payee');

  let debitTotal = 0;
  let creditTotal = 0;
  let debitAvailable = false;
  let creditAvailable = false;
  let minDate = null;
  let maxDate = null;

  const classTotals = new Map();
  const accountTotals = new Map();
  const periodTotals = new Map();
  const uniqueTypes = new Set();
  const uniqueClasses = new Set();
  const uniqueAccounts = new Set();
  const uniqueProperties = new Set();

  let largestDebit = null;
  let largestCredit = null;

  const transactionsMap = new Map();
  const transactions = [];

  let contextType = '';
  let contextNumber = '';
  let contextDate = null;

  let analysedRowCount = 0;

  bodyRows.forEach((row, rowIndex) => {
    const rawType = typeIndex !== -1 ? normaliseKey(row[typeIndex]) : '';
    if (rawType) {
      contextType = rawType;
    }

    const rawNumber = numberIndex !== -1 ? normaliseKey(row[numberIndex]) : '';
    if (rawNumber) {
      contextNumber = rawNumber;
    }

    const parsedDate = dateIndex !== -1 ? parseDate(row[dateIndex]) : null;
    if (parsedDate) {
      contextDate = parsedDate;
    }

    const resolvedType = contextType;
    const resolvedNumber = contextNumber;
    const effectiveDate = parsedDate || contextDate;

    const rawClass = classIndex !== -1 ? normaliseKey(row[classIndex]) : '';
    const rawAccount =
      accountIndex !== -1 ? normaliseKey(row[accountIndex]) : '';
    const rawProperty =
      propertyIndex !== -1 ? normaliseKey(row[propertyIndex]) : '';
    const rawPayee = payeeIndex !== -1 ? normaliseKey(row[payeeIndex]) : '';
    const rawItem = itemIndex !== -1 ? normaliseKey(row[itemIndex]) : '';

    const debitValue = debitIndex !== -1 ? parseAmount(row[debitIndex]) : null;
    const creditValue =
      creditIndex !== -1 ? parseAmount(row[creditIndex]) : null;

    if (debitValue !== null) {
      debitTotal += debitValue;
      debitAvailable = true;
    }

    if (creditValue !== null) {
      creditTotal += creditValue;
      creditAvailable = true;
    }

    if (effectiveDate) {
      if (!minDate || effectiveDate < minDate) {
        minDate = effectiveDate;
      }
      if (!maxDate || effectiveDate > maxDate) {
        maxDate = effectiveDate;
      }

      const periodKey = formatPeriodKey(effectiveDate);
      const existing = periodTotals.get(periodKey) || {
        key: periodKey,
        startDate: new Date(
          Date.UTC(
            effectiveDate.getUTCFullYear(),
            effectiveDate.getUTCMonth(),
            1,
          ),
        ),
        debit: 0,
        credit: 0,
        net: 0,
        rowCount: 0,
      };
      periodTotals.set(periodKey, {
        ...existing,
        debit: existing.debit + (debitValue || 0),
        credit: existing.credit + (creditValue || 0),
        net: existing.net + ((debitValue || 0) - (creditValue || 0)),
        rowCount: existing.rowCount + 1,
      });
    }

    const hasMeaningfulContent =
      Boolean(resolvedType) ||
      Boolean(resolvedNumber) ||
      Boolean(rawClass) ||
      Boolean(rawAccount) ||
      Boolean(rawItem) ||
      Boolean(rawProperty) ||
      Boolean(rawPayee) ||
      debitValue !== null ||
      creditValue !== null;

    if (!hasMeaningfulContent) {
      return;
    }

    analysedRowCount += 1;

    if (resolvedType) {
      uniqueTypes.add(resolvedType.toLowerCase());
    }

    if (rawClass) {
      const classKey = rawClass.toLowerCase();
      uniqueClasses.add(classKey);
      const existing = classTotals.get(classKey) || {
        key: classKey,
        label: rawClass,
        debit: 0,
        credit: 0,
        net: 0,
      };
      classTotals.set(classKey, {
        key: classKey,
        label: pickLabel(existing.label, rawClass),
        debit: existing.debit + (debitValue || 0),
        credit: existing.credit + (creditValue || 0),
        net: existing.net + ((debitValue || 0) - (creditValue || 0)),
      });
    }

    if (rawAccount) {
      const accountKey = rawAccount.toLowerCase();
      uniqueAccounts.add(accountKey);
      const existing = accountTotals.get(accountKey) || {
        key: accountKey,
        label: rawAccount,
        debit: 0,
        credit: 0,
        net: 0,
      };
      accountTotals.set(accountKey, {
        key: accountKey,
        label: pickLabel(existing.label, rawAccount),
        debit: existing.debit + (debitValue || 0),
        credit: existing.credit + (creditValue || 0),
        net: existing.net + ((debitValue || 0) - (creditValue || 0)),
      });
    }

    if (rawProperty) {
      uniqueProperties.add(rawProperty.toLowerCase());
    }

    const transactionKey =
      resolvedType || resolvedNumber
        ? `${resolvedType || 'Uncategorised'}|||${resolvedNumber || ''}|||${effectiveDate ? effectiveDate.toISOString() : ''}`
        : `context|||${rowIndex}`;

    let transaction = transactionsMap.get(transactionKey);
    if (!transaction) {
      transaction = {
        key: transactionKey,
        type: resolvedType || 'Uncategorised',
        number: resolvedNumber || null,
        date: effectiveDate ? effectiveDate.toISOString().split('T')[0] : null,
        debit: 0,
        credit: 0,
        lineCount: 0,
        accounts: new Map(),
        classes: new Map(),
        properties: new Set(),
        payees: new Set(),
        detailLines: [],
        primaryClass: rawClass || null,
        headerItem: rawItem || null,
      };
      transactionsMap.set(transactionKey, transaction);
      transactions.push(transaction);
    }

    transaction.lineCount += 1;
    if (debitValue !== null) {
      transaction.debit += debitValue;
    }
    if (creditValue !== null) {
      transaction.credit += creditValue;
    }

    if (rawClass) {
      const classKey = rawClass.toLowerCase();
      const existing = transaction.classes.get(classKey) || {
        key: classKey,
        label: rawClass,
        debit: 0,
        credit: 0,
      };
      transaction.classes.set(classKey, {
        key: classKey,
        label: pickLabel(existing.label, rawClass),
        debit: existing.debit + (debitValue || 0),
        credit: existing.credit + (creditValue || 0),
      });
      if (!transaction.primaryClass) {
        transaction.primaryClass = rawClass;
      }
    }

    if (rawAccount) {
      const accountKey = rawAccount.toLowerCase();
      const existing = transaction.accounts.get(accountKey) || {
        key: accountKey,
        label: rawAccount,
        debit: 0,
        credit: 0,
      };
      transaction.accounts.set(accountKey, {
        key: accountKey,
        label: pickLabel(existing.label, rawAccount),
        debit: existing.debit + (debitValue || 0),
        credit: existing.credit + (creditValue || 0),
      });
    }

    if (rawProperty) {
      transaction.properties.add(rawProperty);
    }

    if (rawPayee) {
      transaction.payees.add(rawPayee);
    }

    if (rawItem && !transaction.headerItem) {
      transaction.headerItem = rawItem;
    }

    if (
      (debitValue !== null || creditValue !== null) &&
      (rawItem || rawClass || rawPayee)
    ) {
      if (transaction.detailLines.length < 16) {
        transaction.detailLines.push({
          item: rawItem || null,
          className: rawClass || null,
          amount:
            creditValue !== null && creditValue !== 0
              ? creditValue
              : debitValue,
          direction:
            creditValue !== null && creditValue !== 0 ? 'credit' : 'debit',
          payee: rawPayee || null,
          account: rawAccount || null,
        });
      }
    }

    const descriptor = {
      amount: null,
      type: resolvedType || null,
      className: rawClass || null,
      account: rawAccount || null,
      number: resolvedNumber || null,
      item: rawItem || null,
      property: rawProperty || null,
      payee: rawPayee || null,
      date: effectiveDate ? effectiveDate.toISOString().split('T')[0] : null,
    };

    if (
      debitValue !== null &&
      (largestDebit === null || debitValue > largestDebit.amount)
    ) {
      largestDebit = { ...descriptor, direction: 'debit', amount: debitValue };
    }

    if (
      creditValue !== null &&
      (largestCredit === null || creditValue > largestCredit.amount)
    ) {
      largestCredit = {
        ...descriptor,
        direction: 'credit',
        amount: creditValue,
      };
    }
  });

  if (!analysedRowCount) {
    return null;
  }

  const balanceVariance =
    debitAvailable && creditAvailable ? debitTotal - creditTotal : null;

  const typeAggregates = new Map();
  transactions.forEach((transaction) => {
    const typeKey = transaction.type.toLowerCase();
    const aggregate = typeAggregates.get(typeKey) || {
      key: typeKey,
      label: transaction.type,
      transactionCount: 0,
      lineCount: 0,
      debit: 0,
      credit: 0,
      accounts: new Map(),
      classes: new Map(),
    };

    aggregate.transactionCount += 1;
    aggregate.lineCount += transaction.lineCount;
    aggregate.debit += transaction.debit;
    aggregate.credit += transaction.credit;

    transaction.accounts.forEach((accountEntry, accountKey) => {
      const existing = aggregate.accounts.get(accountKey) || {
        key: accountKey,
        label: accountEntry.label,
        debit: 0,
        credit: 0,
      };
      aggregate.accounts.set(accountKey, {
        key: accountKey,
        label: pickLabel(existing.label, accountEntry.label),
        debit: existing.debit + accountEntry.debit,
        credit: existing.credit + accountEntry.credit,
      });
    });

    transaction.classes.forEach((classEntry, classKey) => {
      const existing = aggregate.classes.get(classKey) || {
        key: classKey,
        label: classEntry.label,
        debit: 0,
        credit: 0,
      };
      aggregate.classes.set(classKey, {
        key: classKey,
        label: pickLabel(existing.label, classEntry.label),
        debit: existing.debit + classEntry.debit,
        credit: existing.credit + classEntry.credit,
      });
    });

    typeAggregates.set(typeKey, aggregate);
  });

  const toTopList = (map) =>
    Array.from(map.values())
      .map((entry) => {
        const debit = typeof entry.debit === 'number' ? entry.debit : 0;
        const credit = typeof entry.credit === 'number' ? entry.credit : 0;
        const total = Math.max(Math.abs(debit), Math.abs(credit));
        return {
          key: entry.key,
          label: entry.label,
          total,
        };
      })
      .filter(
        (entry) =>
          typeof entry.total === 'number' &&
          !Number.isNaN(entry.total) &&
          entry.total !== 0,
      )
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);

  const sectionSummaries = Array.from(typeAggregates.values())
    .map((entry) => ({
      key: entry.key,
      label: entry.label,
      transactionCount: entry.transactionCount,
      lineCount: entry.lineCount,
      debit: entry.debit,
      credit: entry.credit,
      net: entry.debit - entry.credit,
      topAccounts: toTopList(entry.accounts),
      topClasses: toTopList(entry.classes),
    }))
    .sort((a, b) => {
      const valueA = a.debit + a.credit;
      const valueB = b.debit + b.credit;
      if (valueB !== valueA) {
        return valueB - valueA;
      }
      if (b.transactionCount !== a.transactionCount) {
        return b.transactionCount - a.transactionCount;
      }
      return a.label.localeCompare(b.label);
    });

  const sortedClassTotals = Array.from(classTotals.values()).sort((a, b) => {
    const valueA = a.debit + a.credit;
    const valueB = b.debit + b.credit;
    if (valueB !== valueA) {
      return valueB - valueA;
    }
    return a.label.localeCompare(b.label);
  });

  const sortedAccountTotals = Array.from(accountTotals.values()).sort(
    (a, b) => {
      const valueA = a.debit + a.credit;
      const valueB = b.debit + b.credit;
      if (valueB !== valueA) {
        return valueB - valueA;
      }
      return a.label.localeCompare(b.label);
    },
  );

  const totalDebitForShare = debitAvailable ? debitTotal : null;
  const totalCreditForShare = creditAvailable ? creditTotal : null;

  const typeBreakdown = sectionSummaries.map((entry) => ({
    key: entry.key,
    label: entry.label,
    rowCount: entry.lineCount,
    debit: entry.debit,
    credit: entry.credit,
    net: entry.net,
    debitShare: safeShare(entry.debit, totalDebitForShare),
    creditShare: safeShare(entry.credit, totalCreditForShare),
  }));

  const classLeaders = sortedClassTotals.map((entry) => ({
    ...entry,
    debitShare: safeShare(entry.debit, totalDebitForShare),
    creditShare: safeShare(entry.credit, totalCreditForShare),
  }));

  const accountLeaders = sortedAccountTotals.map((entry) => ({
    ...entry,
    debitShare: safeShare(entry.debit, totalDebitForShare),
    creditShare: safeShare(entry.credit, totalCreditForShare),
  }));

  const activityTimeline = Array.from(periodTotals.values())
    .sort((a, b) => a.startDate - b.startDate)
    .map((entry) => ({
      key: entry.key,
      label: entry.startDate.toLocaleString('en-US', {
        month: 'short',
        year: 'numeric',
      }),
      debit: entry.debit,
      credit: entry.credit,
      net: entry.net,
      rowCount: entry.rowCount,
    }));

  const invoiceTransactions = transactions.filter(
    (transaction) =>
      transaction.type && transaction.type.toLowerCase() === 'invoice',
  );

  let rentInvoice = null;
  if (invoiceTransactions.length) {
    const ranked = invoiceTransactions
      .slice()
      .sort((a, b) => b.debit - a.debit || b.credit - a.credit);
    const topInvoice = ranked[0];
    const propertyTotals = Array.from(topInvoice.classes.values())
      .map((entry) => {
        const debit = typeof entry.debit === 'number' ? entry.debit : 0;
        const credit = typeof entry.credit === 'number' ? entry.credit : 0;
        const total = credit !== 0 ? credit : debit;
        return {
          key: entry.key,
          label: entry.label,
          total,
        };
      })
      .filter(
        (entry) =>
          typeof entry.total === 'number' &&
          !Number.isNaN(entry.total) &&
          entry.total !== 0,
      )
      .sort((a, b) => b.total - a.total);

    const detailSamples = topInvoice.detailLines
      .filter((line) => line.direction === 'credit' && line.item)
      .map((line) => line.item)
      .filter(Boolean)
      .slice(0, 4);

    rentInvoice = {
      number: topInvoice.number,
      date: topInvoice.date,
      debit: topInvoice.debit,
      credit: topInvoice.credit,
      propertyTotals,
      classCount: propertyTotals.length,
      lineCount: topInvoice.lineCount,
      detailSamples,
    };
  }

  const paymentBatches = transactions
    .filter(
      (transaction) =>
        transaction.type && transaction.type.toLowerCase() === 'payment',
    )
    .map((transaction) => {
      const leadingAccount = Array.from(transaction.accounts.values())
        .map((entry) => ({
          label: entry.label,
          total: entry.debit + entry.credit,
        }))
        .sort((a, b) => b.total - a.total)[0];

      return {
        number: transaction.number,
        date: transaction.date,
        amount: Math.max(transaction.debit, transaction.credit),
        classLabel: transaction.primaryClass || null,
        accountLabel: leadingAccount ? leadingAccount.label : null,
        lineCount: transaction.lineCount,
      };
    })
    .filter(
      (entry) =>
        typeof entry.amount === 'number' &&
        !Number.isNaN(entry.amount) &&
        entry.amount !== 0,
    )
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return {
    rowCount: analysedRowCount,
    transactionCount: transactions.length,
    uniqueTypeCount: uniqueTypes.size,
    uniqueClassCount: uniqueClasses.size,
    uniqueAccountCount: uniqueAccounts.size,
    uniquePropertyCount: uniqueProperties.size,
    debitTotal: debitAvailable ? debitTotal : null,
    creditTotal: creditAvailable ? creditTotal : null,
    balanceVariance,
    typeBreakdown,
    sectionSummaries,
    classLeaders,
    accountLeaders,
    activityTimeline,
    paymentBatches,
    rentInvoice,
    dateRange:
      minDate && maxDate
        ? {
            start: minDate.toISOString().split('T')[0],
            end: maxDate.toISOString().split('T')[0],
          }
        : null,
    largestDebit,
    largestCredit,
  };
};

export { generateAnalysis };
