import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { ensureChartRegistration } from '../../lib/chartSetup.js';
import {
  formatCompactCurrency,
  formatCount,
  formatCurrency,
  formatPercent,
} from '../../lib/formatters.js';

ensureChartRegistration();

const debitColor = '#059669';
const creditColor = '#7c3aed';

function CategoryBarChart({
  title,
  description,
  entries,
  emptyLabel,
  maxEntries = 6,
  showRowCount = false,
}) {
  const topEntries = useMemo(
    () =>
      Array.isArray(entries)
        ? entries
            .filter(Boolean)
            .slice(0, maxEntries)
            .map((entry) => ({
              ...entry,
              label: entry.label || entry.key || '—',
            }))
        : [],
    [entries, maxEntries],
  );

  const hasData = topEntries.length > 0;

  const chartData = useMemo(() => {
    if (!hasData) {
      return null;
    }

    return {
      labels: topEntries.map((entry) => entry.label),
      datasets: [
        {
          label: 'Debit',
          data: topEntries.map((entry) => entry.debit || 0),
          backgroundColor: debitColor,
          borderRadius: 8,
          maxBarThickness: 38,
        },
        {
          label: 'Credit',
          data: topEntries.map((entry) => entry.credit || 0),
          backgroundColor: creditColor,
          borderRadius: 8,
          maxBarThickness: 38,
        },
      ],
    };
  }, [hasData, topEntries]);

  const options = useMemo(() => {
    if (!hasData) {
      return null;
    }

    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: '#475569',
            maxRotation: 0,
            autoSkip: false,
            font: { size: 11 },
          },
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

      <div className="mt-3 h-56">
        {hasData && chartData && options ? (
          <Bar
            data={chartData}
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
                  Category
                </th>
                <th scope="col" className="py-2 text-right">
                  Debit
                </th>
                <th scope="col" className="py-2 text-right">
                  Credit
                </th>
                {showRowCount ? (
                  <th scope="col" className="py-2 text-right">
                    Rows
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {topEntries.map((entry) => (
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
                    <div>{formatCurrency(entry.debit || 0)}</div>
                    {entry.debitShare !== null &&
                    entry.debitShare !== undefined ? (
                      <div className="text-[0.6rem] uppercase tracking-wide text-slate-400">
                        {formatPercent(entry.debitShare)}
                      </div>
                    ) : null}
                  </td>
                  <td className="py-2 text-right">
                    <div>{formatCurrency(entry.credit || 0)}</div>
                    {entry.creditShare !== null &&
                    entry.creditShare !== undefined ? (
                      <div className="text-[0.6rem] uppercase tracking-wide text-slate-400">
                        {formatPercent(entry.creditShare)}
                      </div>
                    ) : null}
                  </td>
                  {showRowCount ? (
                    <td className="py-2 text-right">
                      {formatCount(entry.rowCount)}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </article>
  );
}

export default CategoryBarChart;
