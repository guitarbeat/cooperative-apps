import React, { useEffect, useMemo, useState } from 'react';

const ROWS_PER_PAGE_OPTIONS = [25, 50, 100, 200];
const AMOUNT_FORMATTER = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30);
const MIN_VALID_EXCEL_SERIAL = 20000;
const MAX_VALID_EXCEL_SERIAL = 60000;
const FILTER_ALL_VALUE = '__ALL__';
const FILTER_EMPTY_VALUE = '__EMPTY__';

const normaliseHeaderKey = (value) =>
  typeof value === 'string' ? value.toLowerCase() : '';

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

const parseAmount = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalised = value.trim().replace(/[$,\s]/g, '');
    if (!normalised) {
      return null;
    }

    const parsed = Number(normalised);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return null;
};

const normaliseDateForDisplay = (value) => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }

  if (typeof value === 'number') {
    const converted = excelSerialToISODate(value);
    return converted ?? '';
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return '';
    }

    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed.slice(0, 10);
    }

    const timestamp = Date.parse(trimmed);
    if (!Number.isNaN(timestamp)) {
      return new Date(timestamp).toISOString().split('T')[0];
    }

    return trimmed;
  }

  return '';
};

const severityRank = { warning: 1, error: 2 };

const formatCellForDisplay = (cell, headerCell) => {
  if (cell === null || cell === undefined || cell === '') {
    return '';
  }

  const headerKey = normaliseHeaderKey(headerCell);

  if (headerKey === 'debit' || headerKey === 'credit') {
    const amount = parseAmount(cell);
    if (amount !== null) {
      return AMOUNT_FORMATTER.format(amount);
    }
  }

  if (headerKey === 'date') {
    const formattedDate = normaliseDateForDisplay(cell);
    if (formattedDate) {
      return formattedDate;
    }
  }

  if (cell instanceof Date) {
    return cell.toISOString().split('T')[0];
  }

  return typeof cell === 'string' ? cell : String(cell ?? '');
};

const getComparableValue = (cell, headerCell) => {
  if (cell === null || cell === undefined || cell === '') {
    return '';
  }

  const headerKey = normaliseHeaderKey(headerCell);

  if (headerKey === 'debit' || headerKey === 'credit') {
    const amount = parseAmount(cell);
    if (amount !== null) {
      return amount;
    }
  }

  if (headerKey === 'date') {
    const dateString = normaliseDateForDisplay(cell);
    if (dateString) {
      return dateString;
    }
  }

  if (typeof cell === 'number' && Number.isFinite(cell)) {
    return cell;
  }

  if (cell instanceof Date) {
    return cell.getTime();
  }

  const numericValue = parseAmount(cell);
  if (numericValue !== null) {
    return numericValue;
  }

  return formatCellForDisplay(cell, headerCell).toLowerCase();
};

const DataPreview = ({
  data,
  title,
  editable = false,
  onCellChange,
  className = '',
  highlight,
  violations = [],
  focusRowIndex,
}) => {
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [page, setPage] = useState(0);
  const [editingCell, setEditingCell] = useState(null);
  const [draftValue, setDraftValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterColumnIndex, setFilterColumnIndex] = useState('');
  const [filterValue, setFilterValue] = useState(FILTER_ALL_VALUE);
  const [sortColumnIndex, setSortColumnIndex] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => {
    setPage(0);
  }, [data, rowsPerPage]);

  useEffect(() => {
    setEditingCell(null);
    setDraftValue('');
  }, [data]);

  useEffect(() => {
    setSearchTerm('');
    setFilterColumnIndex('');
    setFilterValue(FILTER_ALL_VALUE);
    setSortColumnIndex('');
    setSortDirection('asc');
  }, [data]);

  const header = useMemo(() => data?.[0] ?? [], [data]);
  const bodyRows = useMemo(() => {
    if (!data || data.length <= 1) return [];
    return data.slice(1);
  }, [data]);

  const indexedRows = useMemo(
    () => bodyRows.map((row, index) => ({ row, originalIndex: index })),
    [bodyRows],
  );

  const filterColumnNumber =
    filterColumnIndex === '' ? null : Number(filterColumnIndex);
  const sortColumnNumber =
    sortColumnIndex === '' ? null : Number(sortColumnIndex);

  const filteredRows = useMemo(() => {
    if (!indexedRows.length) {
      return [];
    }

    let rows = indexedRows;
    const trimmedSearch = searchTerm.trim().toLowerCase();

    if (trimmedSearch) {
      rows = rows.filter(({ row }) =>
        row.some((cell, cellIndex) => {
          const headerCell = header[cellIndex];
          const formattedValue = formatCellForDisplay(cell, headerCell);
          const formattedMatch = formattedValue
            .toLowerCase()
            .includes(trimmedSearch);
          if (formattedMatch) {
            return true;
          }

          const rawValue =
            cell === null || cell === undefined
              ? ''
              : String(cell).toLowerCase();
          return rawValue.includes(trimmedSearch);
        }),
      );
    }

    if (
      filterColumnNumber !== null &&
      Number.isFinite(filterColumnNumber) &&
      filterValue !== FILTER_ALL_VALUE
    ) {
      rows = rows.filter(({ row }) => {
        const headerCell = header[filterColumnNumber];
        const cell = row[filterColumnNumber];
        const formattedValue = formatCellForDisplay(cell, headerCell);
        const key =
          formattedValue === ''
            ? FILTER_EMPTY_VALUE
            : formattedValue.toLowerCase();
        return filterValue === FILTER_EMPTY_VALUE
          ? key === FILTER_EMPTY_VALUE
          : key === filterValue;
      });
    }

    return rows;
  }, [indexedRows, searchTerm, header, filterColumnNumber, filterValue]);

  const sortedRows = useMemo(() => {
    if (!filteredRows.length) {
      return [];
    }

    if (sortColumnNumber === null || !Number.isFinite(sortColumnNumber)) {
      return filteredRows;
    }

    const headerCell = header[sortColumnNumber];
    return [...filteredRows].sort((a, b) => {
      const aValue = getComparableValue(a.row[sortColumnNumber], headerCell);
      const bValue = getComparableValue(b.row[sortColumnNumber], headerCell);

      let comparison = 0;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue), undefined, {
          numeric: true,
          sensitivity: 'base',
        });
      }

      if (comparison === 0) {
        return a.originalIndex - b.originalIndex;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredRows, sortColumnNumber, header, sortDirection]);

  const totalPages = useMemo(() => {
    if (!sortedRows.length) return 1;
    return Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  }, [sortedRows.length, rowsPerPage]);

  const pagedData = useMemo(() => {
    if (!sortedRows.length) return [];
    const start = page * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, page, rowsPerPage]);

  useEffect(() => {
    if (typeof focusRowIndex !== 'number' || focusRowIndex < 1) {
      return;
    }

    if (!sortedRows.length) {
      return;
    }

    const targetIndex = sortedRows.findIndex(
      (entry) => entry.originalIndex + 1 === focusRowIndex,
    );

    if (targetIndex === -1) {
      return;
    }

    const targetPage = Math.floor(targetIndex / rowsPerPage);
    if (Number.isFinite(targetPage) && targetPage >= 0 && targetPage !== page) {
      setPage(targetPage);
    }
  }, [focusRowIndex, sortedRows, rowsPerPage, page]);

  useEffect(() => {
    if (page >= totalPages) {
      setPage(totalPages - 1);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(0);
  }, [
    searchTerm,
    filterColumnNumber,
    filterValue,
    sortColumnNumber,
    sortDirection,
  ]);

  const columnCount = header.length || (pagedData[0]?.row.length ?? 0);
  const displayHeader = header.length
    ? header
    : Array.from({ length: columnCount }, (_, index) => `Column ${index + 1}`);

  const firstVisibleRow = sortedRows.length
    ? Math.min(page * rowsPerPage + 1, sortedRows.length)
    : 0;
  const lastVisibleRow = sortedRows.length
    ? Math.min((page + 1) * rowsPerPage, sortedRows.length)
    : 0;
  const showEmptyState = !data || data.length === 0;
  const controlId = useMemo(() => {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/gi, '-');
    return `rows-per-page-${slug}`;
  }, [title]);
  const searchControlId = useMemo(() => {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/gi, '-');
    return `search-${slug}`;
  }, [title]);
  const filterColumnControlId = useMemo(() => {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/gi, '-');
    return `filter-column-${slug}`;
  }, [title]);
  const filterValueControlId = useMemo(() => {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/gi, '-');
    return `filter-value-${slug}`;
  }, [title]);
  const sortColumnControlId = useMemo(() => {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/gi, '-');
    return `sort-column-${slug}`;
  }, [title]);

  const filterOptions = useMemo(() => {
    if (filterColumnNumber === null || !Number.isFinite(filterColumnNumber)) {
      return [];
    }

    const headerCell = header[filterColumnNumber];
    const seen = new Map();

    indexedRows.forEach(({ row }) => {
      const cell = row[filterColumnNumber];
      const formattedValue = formatCellForDisplay(cell, headerCell);
      const key =
        formattedValue === ''
          ? FILTER_EMPTY_VALUE
          : formattedValue.toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, formattedValue === '' ? 'Empty values' : formattedValue);
      }
    });

    return Array.from(seen.entries())
      .sort((a, b) =>
        a[1].localeCompare(b[1], undefined, {
          numeric: true,
          sensitivity: 'base',
        }),
      )
      .map(([value, label]) => ({
        value,
        label: value === FILTER_EMPTY_VALUE ? 'Empty values' : label,
      }));
  }, [filterColumnNumber, indexedRows, header]);

  useEffect(() => {
    if (
      filterColumnNumber === null ||
      !Number.isFinite(filterColumnNumber) ||
      filterColumnNumber < 0 ||
      filterColumnNumber >= displayHeader.length
    ) {
      if (filterColumnIndex !== '') {
        setFilterColumnIndex('');
      }
      if (filterValue !== FILTER_ALL_VALUE) {
        setFilterValue(FILTER_ALL_VALUE);
      }
      return;
    }

    if (filterValue === FILTER_ALL_VALUE) {
      return;
    }

    const availableValues = filterOptions.map((option) => option.value);
    if (!availableValues.includes(filterValue)) {
      setFilterValue(FILTER_ALL_VALUE);
    }
  }, [
    filterColumnNumber,
    displayHeader.length,
    filterValue,
    filterOptions,
    filterColumnIndex,
  ]);

  useEffect(() => {
    if (
      sortColumnNumber === null ||
      !Number.isFinite(sortColumnNumber) ||
      sortColumnNumber < 0 ||
      sortColumnNumber >= displayHeader.length
    ) {
      if (sortColumnIndex !== '') {
        setSortColumnIndex('');
        setSortDirection('asc');
      }
    }
  }, [sortColumnNumber, displayHeader.length, sortColumnIndex]);

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
    (filterColumnIndex !== '' && filterValue !== FILTER_ALL_VALUE) ||
    sortColumnIndex !== '',
  );
  const noResults = !showEmptyState && sortedRows.length === 0;
  const emptyDueToFilters = noResults && indexedRows.length > 0;
  const sortDirectionLabel =
    sortDirection === 'asc' ? 'Ascending' : 'Descending';

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterColumnIndex('');
    setFilterValue(FILTER_ALL_VALUE);
    setSortColumnIndex('');
    setSortDirection('asc');
  };

  const handleSortHeaderClick = (index) => {
    const indexString = String(index);
    if (sortColumnIndex === indexString) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumnIndex('');
        setSortDirection('asc');
      }
    } else {
      setSortColumnIndex(indexString);
      setSortDirection('asc');
    }
  };

  const violationLookup = useMemo(() => {
    if (!Array.isArray(violations) || violations.length === 0) {
      return { rows: new Map(), cells: new Map() };
    }

    const rowsMap = new Map();
    const cellsMap = new Map();

    violations.forEach((violation) => {
      if (
        !violation ||
        typeof violation.rowIndex !== 'number' ||
        violation.rowIndex < 1
      ) {
        return;
      }

      const rowEntry = rowsMap.get(violation.rowIndex) || {
        severity: violation.severity,
        messages: [],
        rowMessages: [],
      };

      if (rowEntry.severity) {
        const nextRank = severityRank[violation.severity] || 0;
        const currentRank = severityRank[rowEntry.severity] || 0;
        if (nextRank > currentRank) {
          rowEntry.severity = violation.severity;
        }
      } else {
        rowEntry.severity = violation.severity;
      }

      if (typeof violation.message === 'string' && violation.message) {
        rowEntry.messages.push(violation.message);
        if (
          !Array.isArray(violation.columnIndices) ||
          violation.columnIndices.length === 0
        ) {
          rowEntry.rowMessages.push(violation.message);
        }
      }

      rowsMap.set(violation.rowIndex, rowEntry);

      if (Array.isArray(violation.columnIndices)) {
        violation.columnIndices.forEach((columnIndex) => {
          if (typeof columnIndex !== 'number' || columnIndex < 0) {
            return;
          }
          const key = `${violation.rowIndex}:${columnIndex}`;
          const cellEntry = cellsMap.get(key) || {
            severity: violation.severity,
            messages: [],
          };

          if (cellEntry.severity) {
            const nextRank = severityRank[violation.severity] || 0;
            const currentRank = severityRank[cellEntry.severity] || 0;
            if (nextRank > currentRank) {
              cellEntry.severity = violation.severity;
            }
          } else {
            cellEntry.severity = violation.severity;
          }

          if (typeof violation.message === 'string' && violation.message) {
            cellEntry.messages.push(violation.message);
          }

          cellsMap.set(key, cellEntry);
        });
      }
    });

    return { rows: rowsMap, cells: cellsMap };
  }, [violations]);

  const stopEditing = () => {
    setEditingCell(null);
    setDraftValue('');
  };

  const commitEdit = () => {
    if (!editingCell) return;
    if (typeof onCellChange === 'function') {
      const { rowIndex, columnIndex, originalValue } = editingCell;
      if (draftValue !== originalValue) {
        onCellChange(rowIndex, columnIndex, draftValue);
      }
    }
    stopEditing();
  };

  const handleCellClick = (rowIndex, columnIndex, value) => {
    if (!editable) return;
    setEditingCell({ rowIndex, columnIndex, originalValue: value ?? '' });
    setDraftValue(value ?? '');
  };

  const renderCellValue = (cell, headerCell) => {
    if (cell === null || cell === undefined || cell === '') {
      return <span className="text-slate-400 dark:text-slate-600">—</span>;
    }

    const formatted = formatCellForDisplay(cell, headerCell);
    if (formatted !== '') {
      return formatted;
    }

    if (cell instanceof Date) {
      return cell.toISOString().split('T')[0];
    }

    return cell;
  };

  return (
    <div className={`flex h-full flex-col gap-4 ${className}`}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
              {title}
            </h3>
            {highlight ? (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-500/20 dark:text-blue-200">
                {highlight}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 text-xs sm:text-sm">
            <label
              className="text-xs text-slate-500 dark:text-slate-400"
              htmlFor={controlId}
            >
              Rows per page
            </label>
            <select
              id={controlId}
              className="rounded border border-slate-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400"
              value={rowsPerPage}
              onChange={(event) => setRowsPerPage(Number(event.target.value))}
            >
              {ROWS_PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="flex flex-col gap-1 text-xs">
              <label
                className="text-xs font-medium text-slate-600 dark:text-slate-300"
                htmlFor={searchControlId}
              >
                Search
              </label>
              <input
                id={searchControlId}
                type="search"
                placeholder="Search rows"
                className="w-full rounded border border-slate-300 px-3 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-400/40 sm:w-56"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1 text-xs">
              <label
                className="text-xs font-medium text-slate-600 dark:text-slate-300"
                htmlFor={filterColumnControlId}
              >
                Filter column
              </label>
              <select
                id={filterColumnControlId}
                className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 sm:w-40"
                value={filterColumnIndex}
                onChange={(event) => {
                  setFilterColumnIndex(event.target.value);
                  setFilterValue(FILTER_ALL_VALUE);
                }}
              >
                <option value="">All columns</option>
                {displayHeader.map((cell, index) => (
                  <option key={index} value={index}>
                    {typeof cell === 'string' ? cell : `Column ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1 text-xs">
              <label
                className="text-xs font-medium text-slate-600 dark:text-slate-300"
                htmlFor={filterValueControlId}
              >
                Filter value
              </label>
              <select
                id={filterValueControlId}
                className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 sm:w-48"
                value={filterValue}
                onChange={(event) => setFilterValue(event.target.value)}
                disabled={filterColumnIndex === ''}
              >
                <option value={FILTER_ALL_VALUE}>All values</option>
                {filterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
            <div className="flex flex-col gap-1 text-xs">
              <label
                className="text-xs font-medium text-slate-600 dark:text-slate-300"
                htmlFor={sortColumnControlId}
              >
                Sort by
              </label>
              <select
                id={sortColumnControlId}
                className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 sm:w-40"
                value={sortColumnIndex}
                onChange={(event) => {
                  const { value } = event.target;
                  setSortColumnIndex(value);
                  setSortDirection('asc');
                }}
              >
                <option value="">No sorting</option>
                {displayHeader.map((cell, index) => (
                  <option key={index} value={index}>
                    {typeof cell === 'string' ? cell : `Column ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="inline-flex w-full items-center justify-center rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-slate-100 sm:w-auto"
              onClick={() =>
                setSortDirection((previous) =>
                  previous === 'asc' ? 'desc' : 'asc',
                )
              }
              disabled={sortColumnIndex === ''}
              title={`Sort direction: ${sortDirectionLabel}`}
            >
              {sortDirection === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>

            {hasActiveFilters ? (
              <button
                type="button"
                className="inline-flex w-full items-center justify-center rounded border border-transparent bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 sm:w-auto"
                onClick={handleResetFilters}
              >
                Reset
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {showEmptyState
          ? 'Upload a workbook to explore the data preview.'
          : `Showing rows ${firstVisibleRow}-${lastVisibleRow} of ${sortedRows.length}`}
        {!showEmptyState && editable
          ? ' · Click any cell to edit its value.'
          : ''}
      </p>
      <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-950/40">
        <div className="h-full max-h-[420px] overflow-auto rounded-2xl sm:max-h-[520px] xl:max-h-[640px]">
          <table className="min-w-full divide-y divide-slate-200 text-xs dark:divide-slate-700">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900">
              <tr>
                {displayHeader.map((cell, index) => {
                  const headerLabel =
                    typeof cell === 'string' ? cell : `Column ${index + 1}`;
                  const isActiveSort = sortColumnIndex === String(index);
                  const sortIcon = sortDirection === 'asc' ? '↑' : '↓';

                  return (
                    <th
                      key={index}
                      className="whitespace-nowrap px-3 py-2 text-left"
                    >
                      <button
                        type="button"
                        onClick={() => handleSortHeaderClick(index)}
                        className={`inline-flex items-center gap-1 rounded px-1 py-0.5 text-left font-semibold uppercase tracking-wide transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-900 ${
                          isActiveSort
                            ? 'text-blue-600 dark:text-blue-300'
                            : 'text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-200'
                        }`}
                      >
                        <span>{headerLabel}</span>
                        {isActiveSort ? (
                          <span aria-hidden className="text-[0.65rem]">
                            {sortIcon}
                          </span>
                        ) : null}
                        <span className="sr-only">{`Toggle sort for ${headerLabel}`}</span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
              {pagedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={displayHeader.length || 1}
                    className="px-3 py-10 text-center text-slate-500 dark:text-slate-400"
                  >
                    {showEmptyState
                      ? 'No data yet. Upload a workbook to see a live preview.'
                      : noResults
                        ? emptyDueToFilters
                          ? 'No rows match your search or filters.'
                          : 'No rows to display for this sheet.'
                        : 'No rows for this page.'}
                  </td>
                </tr>
              ) : (
                pagedData.map(({ row, originalIndex }, rowIndex) => {
                  const absoluteRowIndex = originalIndex + 1;
                  const rowIssue = violationLookup.rows.get(absoluteRowIndex);
                  const rowIssueClass = rowIssue
                    ? rowIssue.severity === 'error'
                      ? 'bg-red-50/80 ring-1 ring-red-400/60 dark:bg-red-500/10 dark:ring-red-500/40'
                      : 'bg-amber-50/70 ring-1 ring-amber-400/60 dark:bg-amber-500/10 dark:ring-amber-400/40'
                    : rowIndex % 2 === 0
                      ? 'bg-white dark:bg-slate-900'
                      : 'bg-slate-50/60 dark:bg-slate-900/70';
                  const focusClass =
                    typeof focusRowIndex === 'number' &&
                    focusRowIndex === absoluteRowIndex
                      ? 'outline outline-2 outline-blue-400/70 dark:outline-blue-500/70'
                      : '';
                  const rowTitle = rowIssue?.rowMessages?.join(' • ');

                  return (
                    <tr
                      key={originalIndex}
                      className={`${rowIssue ? '' : ''} ${rowIssueClass} transition hover:bg-blue-50/70 dark:hover:bg-blue-500/20 ${focusClass}`.trim()}
                      title={rowTitle || undefined}
                    >
                      {displayHeader.map((_, cellIndex) => {
                        const cell = row[cellIndex];
                        const isEditing =
                          editable &&
                          editingCell &&
                          editingCell.rowIndex === absoluteRowIndex &&
                          editingCell.columnIndex === cellIndex;
                        const cellIssue = violationLookup.cells.get(
                          `${absoluteRowIndex}:${cellIndex}`,
                        );
                        const cellHighlightClass = cellIssue
                          ? cellIssue.severity === 'error'
                            ? 'bg-red-50/80 text-red-900 ring-1 ring-inset ring-red-400/70 dark:bg-red-500/20 dark:text-red-100 dark:ring-red-500/50'
                            : 'bg-amber-50/80 text-amber-900 ring-1 ring-inset ring-amber-400/70 dark:bg-amber-500/20 dark:text-amber-100 dark:ring-amber-400/50'
                          : '';
                        const rowMessageText =
                          cellIndex === 0 && rowIssue?.rowMessages?.length
                            ? rowIssue.rowMessages[0]
                            : null;
                        const additionalRowMessages =
                          cellIndex === 0 && rowIssue?.rowMessages?.length > 1
                            ? rowIssue.rowMessages.length - 1
                            : 0;
                        const cellTitle = cellIssue?.messages?.join(' • ');

                        if (isEditing) {
                          return (
                            <td
                              key={cellIndex}
                              className="whitespace-nowrap px-3 py-2 text-slate-700 dark:text-slate-200"
                            >
                              <input
                                autoFocus
                                aria-label="Edit cell"
                                className="w-full rounded border border-blue-400 px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-blue-300 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-400"
                                value={draftValue}
                                onChange={(event) =>
                                  setDraftValue(event.target.value)
                                }
                                onBlur={commitEdit}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') {
                                    event.preventDefault();
                                    commitEdit();
                                  }
                                  if (event.key === 'Escape') {
                                    event.preventDefault();
                                    stopEditing();
                                  }
                                }}
                              />
                            </td>
                          );
                        }

                        return (
                          <td
                            key={cellIndex}
                            className={`whitespace-nowrap px-3 py-2 text-slate-700 dark:text-slate-200 ${
                              editable
                                ? 'cursor-text hover:bg-blue-100/50 dark:hover:bg-blue-500/20'
                                : ''
                            } ${cellHighlightClass}`.trim()}
                            onClick={() =>
                              handleCellClick(absoluteRowIndex, cellIndex, cell)
                            }
                            title={cellTitle || undefined}
                          >
                            <div className="flex min-h-[1.5rem] flex-col gap-1">
                              <div className="flex items-start gap-2">
                                {cellIssue ? (
                                  <span
                                    aria-hidden="true"
                                    className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-semibold ${
                                      cellIssue.severity === 'error'
                                        ? 'bg-red-500 text-white dark:bg-red-400'
                                        : 'bg-amber-400 text-slate-900 dark:bg-amber-300 dark:text-slate-900'
                                    }`}
                                  >
                                    {cellIssue.severity === 'error' ? '!' : '⚠'}
                                  </span>
                                ) : (
                                  <span
                                    aria-hidden="true"
                                    className="mt-0.5 inline-flex h-4 w-4 shrink-0"
                                  />
                                )}
                                {cellIssue ? (
                                  <span className="sr-only">
                                    {`${cellIssue.severity === 'error' ? 'Error' : 'Warning'}: ${cellIssue.messages.join('. ')}`}
                                  </span>
                                ) : null}
                                <span className="truncate">
                                  {renderCellValue(
                                    cell,
                                    displayHeader[cellIndex],
                                  )}
                                </span>
                              </div>
                              {cellIssue && cellIssue.messages.length ? (
                                <p className="text-[0.65rem] text-slate-500 dark:text-slate-400">
                                  {cellIssue.messages[0]}
                                  {cellIssue.messages.length > 1
                                    ? ` (+${cellIssue.messages.length - 1} more)`
                                    : ''}
                                </p>
                              ) : null}
                              {rowMessageText ? (
                                <p className="text-[0.65rem] text-slate-500 dark:text-slate-400">
                                  {rowMessageText}
                                  {additionalRowMessages > 0
                                    ? ` (+${additionalRowMessages} more)`
                                    : ''}
                                </p>
                              ) : null}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex flex-col gap-2 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Page {totalPages === 0 ? 0 : page + 1} of {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded border border-slate-300 px-2 py-1 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-slate-100"
            onClick={() => setPage((prev) => Math.max(0, prev - 1))}
            disabled={page === 0}
          >
            Previous
          </button>
          <button
            type="button"
            className="rounded border border-slate-300 px-2 py-1 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-slate-100"
            onClick={() =>
              setPage((prev) => Math.min(totalPages - 1, prev + 1))
            }
            disabled={page >= totalPages - 1}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataPreview;
