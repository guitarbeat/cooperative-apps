import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { ensureChartRegistration } from '../../lib/chartSetup.js';
import {
  formatCompactCurrency,
  formatCount,
  formatCurrency,
} from '../../lib/formatters.js';

ensureChartRegistration();

const debitColor = '#059669';
const creditColor = '#7c3aed';
const netColor = '#f97316';

function TimelineChart({
  title,
  description,
  entries,
  emptyLabel,
  maxEntries = 12,
}) {
  const trimmedEntries = useMemo(
    () =>
      Array.isArray(entries)
        ? entries
            .filter(Boolean)
            .slice(-maxEntries)
            .map((entry) => ({
              ...entry,
              label: entry.label || entry.key || '—',
            }))
        : [],
    [entries, maxEntries],
  );

  const hasData = trimmedEntries.length > 0;

  const data = useMemo(() => {
    if (!hasData) {
      return null;
    }

    return {
      labels: trimmedEntries.map((entry) => entry.label),
      datasets: [
        {
          label: 'Debit',
          data: trimmedEntries.map((entry) => entry.debit || 0),
          borderColor: debitColor,
          backgroundColor: 'rgba(5, 150, 105, 0.15)',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
        },
        {
          label: 'Credit',
          data: trimmedEntries.map((entry) => entry.credit || 0),
          borderColor: creditColor,
          backgroundColor: 'rgba(124, 58, 237, 0.15)',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
        },
        {
          label: 'Net movement',
          data: trimmedEntries.map((entry) => entry.net || 0),
          borderColor: netColor,
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          fill: false,
          tension: 0.3,
          pointRadius: 3,
        },
      ],
    };
  }, [hasData, trimmedEntries]);

  const options = useMemo(() => {
    if (!hasData) {
      return null;
    }

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales: {
        x: {
          grid: { color: 'rgba(148, 163, 184, 0.2)' },
          ticks: { color: '#475569', font: { size: 11 } },
        },
        y: {
          grid: { color: 'rgba(148, 163, 184, 0.25)' },
          ticks: {
            color: '#475569',
            font: { size: 11 },
            callback: (value) => formatCompactCurrency(value),
          },
        },
      },
      plugins: {
        legend: {
          position: 'bottom',
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.parsed.y;
              if (typeof value !== 'number' || Number.isNaN(value)) {
                return `${context.dataset.label}: —`;
              }
              return `${context.dataset.label}: ${formatCurrency(value)}`;
            },
          },
        },
      },
    };
  }, [hasData]);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
      <header className="space-y-1">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {title}
        </h3>
        {description ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {description}
          </p>
        ) : null}
      </header>

      <div className="mt-3 h-60">
        {hasData && data && options ? (
          <Line
            data={data}
            options={options}
            role="img"
            aria-label={`${title} chart`}
          />
        ) : (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
            {emptyLabel}
          </div>
        )}
      </div>

      {hasData ? (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs dark:divide-slate-700">
            <thead className="text-[0.65rem] uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <tr>
                <th scope="col" className="py-2 text-left">
                  Period
                </th>
                <th scope="col" className="py-2 text-right">
                  Debit
                </th>
                <th scope="col" className="py-2 text-right">
                  Credit
                </th>
                <th scope="col" className="py-2 text-right">
                  Net
                </th>
                <th scope="col" className="py-2 text-right">
                  Rows
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {trimmedEntries.map((entry) => (
                <tr
                  key={entry.key || entry.label}
                  className="text-slate-600 dark:text-slate-300"
                >
                  <th
                    scope="row"
                    className="py-2 pr-3 text-left text-slate-700 dark:text-slate-100"
                  >
                    {entry.label}
                  </th>
                  <td className="py-2 text-right">
                    {formatCurrency(entry.debit || 0)}
                  </td>
                  <td className="py-2 text-right">
                    {formatCurrency(entry.credit || 0)}
                  </td>
                  <td className="py-2 text-right">
                    {formatCurrency(entry.net || 0)}
                  </td>
                  <td className="py-2 text-right">
                    {formatCount(entry.rowCount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </article>
  );
}

export default TimelineChart;
