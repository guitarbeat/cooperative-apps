import React, { useState } from 'react';

const formatNumber = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return value.toLocaleString();
};

function SummaryCards({ stats, onViewRemoved, canViewRemoved }) {
  const [expanded, setExpanded] = useState(false);

  if (!stats) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1 text-[0.62rem] text-slate-500 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/60 dark:text-slate-300">
        <span aria-hidden>ℹ️</span>
        Drop a workbook to see cleaning stats.
      </div>
    );
  }

  const rowsRemoved = Math.max(stats.originalRows - stats.cleanedRows, 0);
  const retentionRate = stats.originalRows
    ? Math.round((stats.cleanedRows / stats.originalRows) * 100)
    : 0;

  const compactSummary = rowsRemoved
    ? `${formatNumber(stats.cleanedRows)} of ${formatNumber(stats.originalRows)} rows kept • ${formatNumber(rowsRemoved)} removed`
    : `${formatNumber(stats.cleanedRows)} of ${formatNumber(stats.originalRows)} rows kept`;

  const primaryMetrics = [
    {
      label: 'Original rows',
      value: formatNumber(stats.originalRows),
    },
    {
      label: 'Rows after cleaning',
      value: formatNumber(stats.cleanedRows),
    },
    {
      label: 'Rows removed',
      value: formatNumber(rowsRemoved),
    },
  ];

  const secondaryMetrics = [
    {
      label: 'Duplicate rows removed',
      value: formatNumber(stats.duplicateRowsRemoved),
    },
    {
      label: 'Empty rows removed',
      value: formatNumber(stats.emptyRowsRemoved),
    },
    {
      label: 'Empty columns removed',
      value: formatNumber(stats.emptyColumnsRemoved),
    },
  ];

  return (
    <div className="relative inline-flex flex-wrap items-center gap-1.5 text-[0.62rem] text-slate-600 dark:text-slate-300">
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 font-semibold uppercase tracking-wide text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
        {retentionRate}% kept
      </span>

      <span className="font-medium text-slate-700 dark:text-slate-100">
        {compactSummary}
      </span>

      {rowsRemoved > 0 &&
      canViewRemoved &&
      typeof onViewRemoved === 'function' ? (
        <button
          type="button"
          onClick={onViewRemoved}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 px-2 py-0.5 font-semibold text-emerald-700 transition hover:border-emerald-200 hover:text-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700/80 dark:text-emerald-200 dark:hover:border-emerald-500/70 dark:hover:text-emerald-100 dark:focus-visible:ring-offset-slate-900"
        >
          Removed rows
          <span aria-hidden>↗︎</span>
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => setExpanded((previous) => !previous)}
        className="inline-flex items-center gap-1 rounded-full border border-slate-200/70 px-2 py-0.5 font-semibold uppercase tracking-wide text-slate-500 transition hover:border-slate-300 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700/80 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:text-white dark:focus-visible:ring-offset-slate-900"
        aria-expanded={expanded}
      >
        {expanded ? 'Hide' : 'Details'}
        <span aria-hidden>{expanded ? '▴' : '▾'}</span>
      </button>

      {expanded ? (
        <div className="absolute left-0 top-full z-20 mt-2 w-[min(22rem,calc(100vw-3rem))] rounded-xl border border-slate-200/80 bg-white/95 p-3 text-[0.62rem] leading-tight shadow-lg backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/90">
          <div className="grid gap-3">
            <dl className="grid gap-1">
              {primaryMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className="flex items-center justify-between gap-3 text-slate-700 dark:text-slate-200"
                >
                  <dt className="uppercase tracking-wide text-[0.6rem] text-slate-500 dark:text-slate-400">
                    {metric.label}
                  </dt>
                  <dd className="font-semibold text-slate-900 dark:text-slate-100">
                    {metric.value}
                  </dd>
                </div>
              ))}
            </dl>

            <dl className="grid gap-1 border-t border-slate-200/80 pt-2 text-slate-500 dark:border-slate-700/80 dark:text-slate-300">
              {secondaryMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className="flex items-center justify-between gap-3"
                >
                  <dt className="font-semibold text-slate-700 dark:text-slate-200">
                    {metric.value}
                  </dt>
                  <dd className="text-right leading-tight">{metric.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default SummaryCards;
