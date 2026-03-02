import React from 'react';
import CategoryBarChart from './charts/CategoryBarChart.jsx';
import TimelineChart from './charts/TimelineChart.jsx';
import { formatCount, formatCurrency } from '../lib/formatters.js';

const QUICKBOOKS_VALIDATION_SUMMARY_LABELS = {
  'missing-columns':
    'Add the required Date, Account, Debit, and Credit columns.',
  'invalid-date': 'Fix the missing or invalid journal dates.',
  'missing-account': 'Provide an account name for each row.',
  'dual-amounts': 'Split lines that contain both debit and credit amounts.',
  'missing-amount': 'Enter either a debit or a credit amount for each row.',
  'negative-debit': 'Debit amounts must be positive.',
  'negative-credit': 'Credit amounts must be positive.',
  'unbalanced-journal': 'Balance each journal before export.',
  'missing-number-column': 'Add a Number column so journal IDs import cleanly.',
  'auto-journal-number': 'Some journal numbers were auto-generated.',
};

const summariseValidationGroups = (entries) => {
  if (!Array.isArray(entries) || entries.length === 0) {
    return [];
  }

  const groups = new Map();

  entries.forEach((entry) => {
    if (!entry || typeof entry !== 'object') {
      return;
    }

    const key = entry.code || entry.message;
    if (!key) {
      return;
    }

    if (!groups.has(key)) {
      groups.set(key, {
        code: entry.code || null,
        count: 0,
        rows: [],
        message: entry.message || '',
      });
    }

    const group = groups.get(key);
    group.count += 1;
    if (Array.isArray(entry.rows)) {
      entry.rows.forEach((rowNumber) => {
        if (typeof rowNumber === 'number' && Number.isFinite(rowNumber)) {
          group.rows.push(rowNumber);
        }
      });
    }

    if (!group.message && entry.message) {
      group.message = entry.message;
    }
  });

  return Array.from(groups.values()).map((group) => {
    const baseLabel =
      (group.code && QUICKBOOKS_VALIDATION_SUMMARY_LABELS[group.code]) ||
      group.message ||
      'Validation issue detected.';

    const uniqueRows = Array.from(new Set(group.rows)).sort((a, b) => a - b);
    const previewRows = uniqueRows.slice(0, 6);
    const extraCount = uniqueRows.length > 6 ? uniqueRows.length - 6 : 0;

    return {
      code: group.code,
      message:
        group.count > 1
          ? `${baseLabel} (${group.count} occurrences)`
          : baseLabel,
      rows: previewRows,
      extraCount,
    };
  });
};

const renderTransactionHighlight = (transaction, title, accent) => {
  const baseClasses =
    'rounded-xl border p-4 text-sm shadow-sm transition-colors dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200';

  if (!transaction) {
    return (
      <div
        className={`${baseClasses} border-slate-200 bg-slate-50 text-slate-600 dark:bg-slate-900/40 dark:text-slate-400`}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {title}
        </p>
        <p className="mt-2 text-sm">
          No transactions were detected for this category.
        </p>
      </div>
    );
  }

  const accentClasses = {
    debit:
      'border-emerald-200 bg-emerald-50/70 text-emerald-900 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-100',
    credit:
      'border-purple-200 bg-purple-50/70 text-purple-900 dark:border-purple-400/40 dark:bg-purple-500/10 dark:text-purple-100',
  };

  const resolvedAccent =
    accentClasses[accent] || 'border-slate-200 bg-white text-slate-700';

  const details = [
    transaction.type ? { label: 'Type', value: transaction.type } : null,
    transaction.account
      ? { label: 'Account', value: transaction.account }
      : null,
    transaction.className
      ? { label: 'Class', value: transaction.className }
      : null,
    transaction.property
      ? { label: 'Property', value: transaction.property }
      : null,
    transaction.number ? { label: 'Number', value: transaction.number } : null,
    transaction.item ? { label: 'Item', value: transaction.item } : null,
    transaction.payee ? { label: 'Payee', value: transaction.payee } : null,
    transaction.date ? { label: 'Date', value: transaction.date } : null,
  ].filter(Boolean);

  return (
    <div className={`${baseClasses} ${resolvedAccent}`}>
      <p className="text-xs font-semibold uppercase tracking-wide">{title}</p>
      <p className="mt-2 text-2xl font-bold">
        {formatCurrency(transaction.amount)}
      </p>
      {details.length ? (
        <dl className="mt-3 grid gap-x-3 gap-y-1 text-xs">
          {details.map((detail) => (
            <div key={`${detail.label}-${detail.value}`} className="flex gap-2">
              <dt className="w-20 shrink-0 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {detail.label}
              </dt>
              <dd className="flex-1 text-slate-700 dark:text-slate-200">
                {detail.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">
          Supporting metadata for this transaction was not supplied in the
          worksheet.
        </p>
      )}
    </div>
  );
};

const AnalysisPanel = ({ analysis, quickBooksInsights }) => {
  if (!analysis) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
        Upload a workbook for instant ledger insights.
      </section>
    );
  }

  const {
    rowCount,
    transactionCount,
    uniqueTypeCount,
    uniqueClassCount,
    uniqueAccountCount,
    uniquePropertyCount,
    debitTotal,
    creditTotal,
    balanceVariance,
    typeBreakdown,
    sectionSummaries,
    classLeaders,
    accountLeaders,
    activityTimeline,
    paymentBatches: rawPaymentBatches,
    rentInvoice: rawRentInvoice,
    dateRange,
    largestDebit,
    largestCredit,
  } = analysis;

  const sectionList = Array.isArray(sectionSummaries) ? sectionSummaries : [];
  const topSections = sectionList.slice(0, 5);
  const hiddenSectionCount = Math.max(
    sectionList.length - topSections.length,
    0,
  );

  const rentInvoice =
    rawRentInvoice && typeof rawRentInvoice === 'object'
      ? rawRentInvoice
      : null;
  const rentInvoiceProperties = rentInvoice?.propertyTotals
    ? rentInvoice.propertyTotals.slice(0, 6)
    : [];
  const rentInvoiceExtraProperties = rentInvoice?.propertyTotals?.length
    ? Math.max(
        rentInvoice.propertyTotals.length - rentInvoiceProperties.length,
        0,
      )
    : 0;

  const paymentBatches = Array.isArray(rawPaymentBatches)
    ? rawPaymentBatches
    : [];

  const quickBooksSummary =
    quickBooksInsights && typeof quickBooksInsights.summary === 'object'
      ? quickBooksInsights.summary
      : null;
  const quickBooksErrors = Array.isArray(quickBooksInsights?.errors)
    ? quickBooksInsights.errors
    : [];
  const quickBooksWarnings = Array.isArray(quickBooksInsights?.warnings)
    ? quickBooksInsights.warnings
    : [];
  const quickBooksHasSummary = Boolean(quickBooksSummary);
  const quickBooksHasErrors =
    quickBooksHasSummary && quickBooksErrors.length > 0;
  const quickBooksHasWarnings =
    quickBooksHasSummary && quickBooksWarnings.length > 0;
  const quickBooksIssueGroups = quickBooksHasSummary
    ? summariseValidationGroups(
        quickBooksHasErrors ? quickBooksErrors : quickBooksWarnings,
      ).slice(0, 3)
    : [];

  const isBalanced =
    typeof balanceVariance === 'number' && Math.abs(balanceVariance) < 0.01;
  const netMovement =
    typeof debitTotal === 'number' && typeof creditTotal === 'number'
      ? debitTotal - creditTotal
      : null;

  const topTypes = typeBreakdown.slice(0, 6);
  const topClasses = classLeaders.slice(0, 5);
  const topAccounts = accountLeaders.slice(0, 5);

  const balanceLabel =
    balanceVariance === null
      ? 'We need both debit and credit columns to confirm balance.'
      : isBalanced
        ? 'Debits and credits stay in balance.'
        : `Variance of ${formatCurrency(balanceVariance)} between debits and credits.`;

  return (
    <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900/60">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Analysis
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Ledger highlights based on the cleaned sheet.
        </p>
      </header>

      <div className="grid auto-rows-fr gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <article className="flex h-full flex-col justify-between rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-900 shadow-sm dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-100">
          <p className="text-xs font-semibold uppercase tracking-wide">
            Rows analyzed
          </p>
          <p className="mt-2 text-2xl font-bold">{formatCount(rowCount)}</p>
          {typeof transactionCount === 'number' ? (
            <p className="mt-1 text-[0.65rem] uppercase tracking-wide text-blue-900/80 dark:text-blue-100/80">
              {formatCount(transactionCount)} journal groups reconstructed
            </p>
          ) : null}
          {dateRange ? (
            <p className="mt-1 text-[0.65rem] uppercase tracking-wide">
              {dateRange.start} — {dateRange.end}
            </p>
          ) : (
            <p className="mt-1 text-[0.65rem] uppercase tracking-wide text-blue-900/70 dark:text-blue-100/70">
              Date column not detected
            </p>
          )}
        </article>

        <article className="flex h-full flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide">
              Data coverage
            </p>
            <p className="mt-1 text-[0.7rem] uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Unique values detected per column
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <dt className="uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Types
              </dt>
              <dd className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {formatCount(uniqueTypeCount)}
              </dd>
            </div>
            <div>
              <dt className="uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Classes
              </dt>
              <dd className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {formatCount(uniqueClassCount)}
              </dd>
            </div>
            <div>
              <dt className="uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Accounts
              </dt>
              <dd className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {formatCount(uniqueAccountCount)}
              </dd>
            </div>
            <div>
              <dt className="uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Properties
              </dt>
              <dd className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {formatCount(uniquePropertyCount)}
              </dd>
            </div>
          </dl>
        </article>

        <article className="flex h-full flex-col justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-900 shadow-sm dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-100">
          <p className="text-xs font-semibold uppercase tracking-wide">
            Debit total
          </p>
          <p className="mt-2 text-2xl font-bold">
            {formatCurrency(debitTotal)}
          </p>
          <p className="mt-1 text-[0.65rem] uppercase tracking-wide text-emerald-900/70 dark:text-emerald-100/70">
            {netMovement !== null
              ? `Net ${formatCurrency(netMovement)}`
              : 'Awaiting credit column'}
          </p>
        </article>

        <article className="flex h-full flex-col justify-between rounded-xl border border-purple-200 bg-purple-50/70 p-4 text-sm text-purple-900 shadow-sm dark:border-purple-400/40 dark:bg-purple-500/10 dark:text-purple-100">
          <p className="text-xs font-semibold uppercase tracking-wide">
            Credit total
          </p>
          <p className="mt-2 text-2xl font-bold">
            {formatCurrency(creditTotal)}
          </p>
          <p className="mt-1 text-[0.65rem] uppercase tracking-wide text-purple-900/70 dark:text-purple-100/70">
            {netMovement !== null
              ? `Variance ${formatCurrency(balanceVariance || 0)}`
              : 'Awaiting debit column'}
          </p>
        </article>

        <article
          className={`flex h-full flex-col justify-between rounded-xl border p-4 text-sm shadow-sm ${
            balanceVariance === null
              ? 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200'
              : isBalanced
                ? 'border-slate-200 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100'
                : 'border-amber-200 bg-amber-50/70 text-amber-900 dark:border-amber-400/50 dark:bg-amber-500/10 dark:text-amber-100'
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide">
            Balance check
          </p>
          <p className="mt-2 text-sm leading-5">{balanceLabel}</p>
        </article>

        {quickBooksHasSummary ? (
          <article
            className={`flex h-full flex-col justify-between rounded-xl border p-4 text-sm shadow-sm ${
              quickBooksHasErrors
                ? 'border-red-200 bg-red-50/70 text-red-900 dark:border-red-400/40 dark:bg-red-500/10 dark:text-red-100'
                : quickBooksHasWarnings
                  ? 'border-amber-200 bg-amber-50/70 text-amber-900 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-100'
                  : 'border-emerald-200 bg-emerald-50/70 text-emerald-900 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-100'
            }`}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide">
                QuickBooks readiness
              </p>
              <p className="mt-2 text-lg font-bold">
                {quickBooksHasErrors
                  ? 'Needs attention before export'
                  : quickBooksHasWarnings
                    ? 'Ready with warnings'
                    : 'Ready for QuickBooks'}
              </p>
              <p className="mt-1 text-[0.65rem] uppercase tracking-wide">
                {`${formatCount(quickBooksSummary.balancedCount)} of ${formatCount(quickBooksSummary.journalCount)} journals balanced`}
              </p>
              <p className="mt-2 text-xs leading-5">
                {quickBooksHasErrors
                  ? 'Resolve the blocking issues below before downloading the QuickBooks package.'
                  : quickBooksHasWarnings
                    ? 'Review the warnings below to confirm the generated package looks right.'
                    : 'All QuickBooks validation checks passed for this worksheet.'}
              </p>
            </div>

            <dl className="mt-4 grid gap-x-4 gap-y-3 text-xs sm:grid-cols-3">
              <div>
                <dt className="uppercase tracking-wide opacity-80">Debits</dt>
                <dd className="text-sm font-semibold">
                  {formatCurrency(quickBooksSummary.totalDebit)}
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-wide opacity-80">Credits</dt>
                <dd className="text-sm font-semibold">
                  {formatCurrency(quickBooksSummary.totalCredit)}
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-wide opacity-80">
                  Blocking issues
                </dt>
                <dd className="text-sm font-semibold">
                  {formatCount(quickBooksErrors.length)}
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-wide opacity-80">Warnings</dt>
                <dd className="text-sm font-semibold">
                  {formatCount(quickBooksWarnings.length)}
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-wide opacity-80">
                  Auto journal IDs
                </dt>
                <dd className="text-sm font-semibold">
                  {formatCount(quickBooksSummary.autoNumberCount)}
                </dd>
              </div>
            </dl>

            {quickBooksIssueGroups.length ? (
              <div className="mt-4 rounded-lg border border-current/20 bg-white/60 p-3 text-xs text-current/90 shadow-sm dark:bg-slate-900/30">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em]">
                  {quickBooksHasErrors
                    ? 'Blocking issues'
                    : 'Warnings to review'}
                </p>
                <ul className="mt-2 space-y-2">
                  {quickBooksIssueGroups.map((issue) => (
                    <li key={issue.code || issue.message}>
                      <p className="font-semibold">{issue.message}</p>
                      {issue.rows.length ? (
                        <p className="mt-0.5 text-[0.65rem] uppercase tracking-wide opacity-80">
                          Rows {issue.rows.join(', ')}
                          {issue.extraCount ? ` +${issue.extraCount} more` : ''}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </article>
        ) : null}
      </div>

      {topSections.length ? (
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
          <header className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Ledger sections (PDF layout)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mirrors the headings in the interface PDF so you can review credit
              memos, invoices, payments, and journals without leaving the app.
            </p>
          </header>

          <ul className="mt-4 space-y-3">
            {topSections.map((section) => (
              <li
                key={section.key || section.label}
                className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-700 shadow-sm dark:border-slate-600/70 dark:bg-slate-900/40 dark:text-slate-200"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {section.label}
                  </p>
                  <p className="text-[0.75rem] text-slate-600 dark:text-slate-300">
                    {formatCurrency(section.debit)} debit /{' '}
                    {formatCurrency(section.credit)} credit
                  </p>
                </div>
                <p className="mt-1 text-[0.65rem] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {formatCount(section.transactionCount)} journals •{' '}
                  {formatCount(section.lineCount)} lines
                </p>
                {Array.isArray(section.topClasses) &&
                section.topClasses.length ? (
                  <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                    Houses:{' '}
                    {section.topClasses
                      .map(
                        (entry) =>
                          `${entry.label} (${formatCurrency(entry.total)})`,
                      )
                      .join(', ')}
                  </p>
                ) : null}
                {Array.isArray(section.topAccounts) &&
                section.topAccounts.length ? (
                  <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                    Accounts:{' '}
                    {section.topAccounts
                      .map(
                        (entry) =>
                          `${entry.label} (${formatCurrency(entry.total)})`,
                      )
                      .join(', ')}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>

          {hiddenSectionCount > 0 ? (
            <p className="mt-3 text-[0.65rem] uppercase tracking-wide text-slate-400 dark:text-slate-500">
              +{hiddenSectionCount} more section
              {hiddenSectionCount === 1 ? '' : 's'} captured in this interface
              run
            </p>
          ) : null}
        </article>
      ) : null}

      {rentInvoice || paymentBatches.length ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {rentInvoice ? (
            <article className="rounded-xl border border-slate-200 bg-white p-5 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100">
              <header className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Rent run spotlight
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Highlights the megainvoice block from the PDF so you can
                  confirm property totals before exporting to QuickBooks.
                </p>
              </header>

              <div className="mt-3 space-y-2 text-xs">
                <p>
                  {rentInvoice.number ? (
                    <span className="font-semibold">{rentInvoice.number}</span>
                  ) : (
                    <span className="font-semibold">Rent megainvoice</span>
                  )}
                  {rentInvoice.date ? ` • Posted ${rentInvoice.date}` : ''}
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  {`Debits ${formatCurrency(rentInvoice.debit || 0)} • Credits ${formatCurrency(rentInvoice.credit || 0)}`}
                </p>
              </div>

              {rentInvoiceProperties.length ? (
                <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                  <table className="min-w-full divide-y divide-slate-200 text-xs dark:divide-slate-700">
                    <thead className="bg-slate-50 text-[0.65rem] uppercase tracking-wide text-slate-500 dark:bg-slate-800/80 dark:text-slate-400">
                      <tr>
                        <th scope="col" className="py-2 pl-3 pr-2 text-left">
                          Property
                        </th>
                        <th scope="col" className="py-2 pr-3 text-right">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {rentInvoiceProperties.map((entry) => (
                        <tr
                          key={entry.key || entry.label}
                          className="text-slate-700 dark:text-slate-200"
                        >
                          <th
                            scope="row"
                            className="py-2 pl-3 pr-2 text-left font-medium"
                          >
                            {entry.label}
                          </th>
                          <td className="py-2 pr-3 text-right">
                            {formatCurrency(entry.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
                  Property detail lines were not supplied for this invoice.
                </p>
              )}

              {rentInvoiceExtraProperties > 0 ? (
                <p className="mt-2 text-[0.65rem] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  +{rentInvoiceExtraProperties} additional propert
                  {rentInvoiceExtraProperties === 1 ? 'y' : 'ies'} captured in
                  the worksheet
                </p>
              ) : null}
              {Array.isArray(rentInvoice?.detailSamples) &&
              rentInvoice.detailSamples.length ? (
                <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">
                  Examples: {rentInvoice.detailSamples.join(', ')}
                </p>
              ) : null}
            </article>
          ) : null}

          {paymentBatches.length ? (
            <article className="rounded-xl border border-slate-200 bg-white p-5 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100">
              <header className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Payment batch rollup
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Summarizes the heaviest payment batches so the PDF’s deposit
                  headers are visible in the dashboard.
                </p>
              </header>

              <ul className="mt-4 space-y-3">
                {paymentBatches.map((batch, index) => (
                  <li
                    key={batch.number || batch.date || `batch-${index}`}
                    className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-700 shadow-sm dark:border-slate-600/70 dark:bg-slate-900/40 dark:text-slate-200"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {batch.number || 'Batch'}
                      </p>
                      <p className="text-[0.75rem] text-slate-600 dark:text-slate-300">
                        {formatCurrency(batch.amount)}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                      {batch.classLabel || 'Unlabeled channel'}
                      {batch.accountLabel ? ` • ${batch.accountLabel}` : ''}
                    </p>
                    <p className="mt-1 text-[0.65rem] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      {batch.date
                        ? `Posted ${batch.date}`
                        : 'Posting date unavailable'}{' '}
                      • {formatCount(batch.lineCount)} lines
                    </p>
                  </li>
                ))}
              </ul>
            </article>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <CategoryBarChart
          title="Batch mix by type"
          description="Mirrors the PDF ledger sections by highlighting which transaction types dominate this export."
          entries={topTypes}
          emptyLabel="Type data is unavailable in this sheet."
          showRowCount
        />

        <CategoryBarChart
          title="Top property classes"
          description="Surfaces the houses contributing the largest debits and credits so you can trace rent, fees, and reversals."
          entries={topClasses}
          emptyLabel="Class data is unavailable in this sheet."
        />

        <CategoryBarChart
          title="Key ledger accounts"
          description="Highlights the control totals that finance validates before exporting to QuickBooks."
          entries={topAccounts}
          emptyLabel="Account data is unavailable in this sheet."
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <TimelineChart
          title="Monthly activity"
          description="Aggregates ledger movement by month so you can reconcile against the PDF page headers and bank deposits."
          entries={activityTimeline}
          emptyLabel="Date information is unavailable, so we cannot chart monthly totals."
        />

        <div className="grid gap-3">
          {renderTransactionHighlight(
            largestDebit,
            'Largest debit line',
            'debit',
          )}
          {renderTransactionHighlight(
            largestCredit,
            'Largest credit line',
            'credit',
          )}
        </div>
      </div>
    </section>
  );
};

export default AnalysisPanel;
