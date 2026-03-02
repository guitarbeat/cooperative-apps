import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as XLSX from 'xlsx';
import DataPreview from './components/DataPreview.jsx';
import FileUploader from './components/FileUploader.jsx';
import AnalysisPanel from './components/AnalysisPanel.jsx';
import SummaryCards from './components/SummaryCards.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import { cleanSheet, sanitizeName } from './lib/cleaner.js';
import { generateAnalysis } from './lib/analysis.js';
import {
  selectDefaultSheetName,
  trimLeadingEmptyRows,
} from './lib/workbook.js';
import {
  fetchSampleWorkbook,
  shouldLoadSampleFromParam,
} from './lib/sample.js';
import { createQuickBooksPackage } from './lib/qbo.js';

const THEME_STORAGE_KEY = 'icc-data-cleaner-theme';

const QUICKBOOKS_TIMESTAMP_FORMATTER =
  typeof Intl !== 'undefined'
    ? new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

const convertWorksheetToJson = (worksheet) =>
  XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: true,
  });

const extractWorkbookSheets = (workbook) => {
  const sheetNames = Array.isArray(workbook?.SheetNames)
    ? workbook.SheetNames
    : [];

  const sheets = sheetNames.reduce((acc, sheetName) => {
    const worksheet = workbook?.Sheets?.[sheetName];
    if (!worksheet) {
      acc[sheetName] = [];
      return acc;
    }
    acc[sheetName] = convertWorksheetToJson(worksheet);
    return acc;
  }, {});

  return { sheetNames, sheets };
};

const readWorkbookFile = async (file) => {
  const buffer = await file.arrayBuffer();
  const data = new Uint8Array(buffer);
  const workbook = XLSX.read(data, { type: 'array' });

  const { sheetNames, sheets } = extractWorkbookSheets(workbook);
  const defaultSheet = selectDefaultSheetName(sheetNames, sheets);

  return { sheetNames, sheets, defaultSheet };
};

const getPreferredTheme = () => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const useThemePreference = () => {
  const hasExplicitPreference = useRef(false);
  const [theme, setTheme] = useState(() => getPreferredTheme());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      hasExplicitPreference.current = true;
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event) => {
      if (hasExplicitPreference.current) {
        return;
      }
      setTheme(event.matches ? 'dark' : 'light');
    };
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((previous) => {
      const next = previous === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
      }
      hasExplicitPreference.current = true;
      return next;
    });
  }, []);

  return { theme, toggleTheme };
};

const formatGeneratedAt = (value) => {
  if (!value) {
    return '';
  }
  const dateInstance = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dateInstance.getTime())) {
    return '';
  }
  if (!QUICKBOOKS_TIMESTAMP_FORMATTER) {
    return dateInstance.toISOString();
  }
  return QUICKBOOKS_TIMESTAMP_FORMATTER.format(dateInstance);
};

const formatSummaryAmount = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0.00';
  }
  return (Math.round(value * 100) / 100).toFixed(2);
};

const buildQuickBooksValidationSheet = (summary, validations) => {
  const safeSummary = summary || {};
  const rows = [
    ['Metric', 'Value'],
    ['Journal entries', safeSummary.journalCount ?? 0],
    ['Balanced entries', safeSummary.balancedCount ?? 0],
    ['Total debit', formatSummaryAmount(safeSummary.totalDebit ?? 0)],
    ['Total credit', formatSummaryAmount(safeSummary.totalCredit ?? 0)],
  ];

  if (safeSummary.autoNumberCount) {
    rows.push(['Auto-generated journal numbers', safeSummary.autoNumberCount]);
  }

  rows.push([]);
  rows.push(['Severity', 'Message', 'Rows']);

  if (!Array.isArray(validations) || validations.length === 0) {
    rows.push(['info', 'No validation issues detected.', '—']);
    return rows;
  }

  validations.forEach((entry) => {
    const rowLabel =
      Array.isArray(entry.rows) && entry.rows.length
        ? entry.rows.join(', ')
        : '—';
    rows.push([entry.severity, entry.message, rowLabel]);
  });

  return rows;
};

const partitionValidations = (validations) => {
  if (!Array.isArray(validations)) {
    return { errors: [], warnings: [] };
  }

  const errors = [];
  const warnings = [];
  validations.forEach((entry) => {
    if (!entry || typeof entry !== 'object') {
      return;
    }
    if (entry.severity === 'error') {
      errors.push(entry);
      return;
    }
    if (entry.severity === 'warning') {
      warnings.push(entry);
    }
  });

  return { errors, warnings };
};

const QuickBooksStatusBanner = ({ status }) => {
  const validations = Array.isArray(status?.validations)
    ? status.validations
    : [];
  const summary = status?.summary || {};
  const { errors, warnings } = partitionValidations(validations);
  const hasErrors = errors.length > 0;
  const generatedAtLabel = formatGeneratedAt(status?.generatedAt);

  const summaryParts = [];
  if (
    typeof summary.balancedCount === 'number' &&
    !Number.isNaN(summary.balancedCount) &&
    typeof summary.journalCount === 'number' &&
    !Number.isNaN(summary.journalCount)
  ) {
    summaryParts.push(
      `${summary.balancedCount}/${summary.journalCount} journals balanced`,
    );
  } else if (
    typeof summary.journalCount === 'number' &&
    !Number.isNaN(summary.journalCount)
  ) {
    summaryParts.push(`${summary.journalCount} journals total`);
  }
  if (
    typeof summary.totalDebit === 'number' &&
    !Number.isNaN(summary.totalDebit) &&
    typeof summary.totalCredit === 'number' &&
    !Number.isNaN(summary.totalCredit)
  ) {
    summaryParts.push(
      `deb ${formatSummaryAmount(summary.totalDebit)} / cred ${formatSummaryAmount(summary.totalCredit)}`,
    );
  }
  if (summary.autoNumberCount) {
    summaryParts.push(
      `${summary.autoNumberCount} journal number${summary.autoNumberCount === 1 ? '' : 's'} auto-filled`,
    );
  }

  const summaryLine = summaryParts.join(' • ');
  const borderClasses = hasErrors
    ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-400/60 dark:bg-red-500/10 dark:text-red-100'
    : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/60 dark:bg-emerald-500/10 dark:text-emerald-100';

  const headline = hasErrors
    ? `QuickBooks Online package blocked — ${errors.length} error${errors.length === 1 ? '' : 's'} detected.`
    : 'QuickBooks Online package ready.';

  const listSource = hasErrors ? errors : warnings;
  const listLabel = hasErrors ? 'error' : 'warning';

  return (
    <div className={`rounded-lg border px-3 py-2 text-xs ${borderClasses}`}>
      <p className="font-semibold">{headline}</p>
      {summaryLine || generatedAtLabel ? (
        <p className="mt-1">
          {summaryLine ? `${summaryLine}.` : ''}
          {generatedAtLabel ? ` Checked ${generatedAtLabel}.` : ''}
        </p>
      ) : null}
      {listSource.length ? (
        <ul className="mt-2 list-disc space-y-1 pl-4">
          {listSource.slice(0, 3).map((entry, idx) => (
            <li key={`${listLabel}-${idx}`}>{entry.message}</li>
          ))}
          {listSource.length > 3 ? (
            <li className="italic">Additional {listLabel}s hidden…</li>
          ) : null}
        </ul>
      ) : null}
      {!hasErrors && !warnings.length ? (
        <p className="mt-2 italic text-emerald-700 dark:text-emerald-200">
          No blocking issues detected.
        </p>
      ) : null}
    </div>
  );
};

function App() {
  const { theme, toggleTheme } = useThemePreference();
  const [workbookSheets, setWorkbookSheets] = useState({});
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [originalData, setOriginalData] = useState([]);
  const [cleanData, setCleanData] = useState([]);
  const [stats, setStats] = useState(null);
  const [diagnostics, setDiagnostics] = useState([]);
  const [violations, setViolations] = useState([]);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [previewMode, setPreviewMode] = useState('cleaned');
  const [leadingRowOffset, setLeadingRowOffset] = useState(0);
  const [focusedIssueRow, setFocusedIssueRow] = useState(null);
  const [quickBooksStatus, setQuickBooksStatus] = useState(null);
  const sampleLoadRef = useRef(false);

  const resetWorkbookState = useCallback(() => {
    setWorkbookSheets({});
    setSheetNames([]);
    setSelectedSheet('');
    setFileName('');
    setOriginalData([]);
    setCleanData([]);
    setStats(null);
    setDiagnostics([]);
    setViolations([]);
    setLeadingRowOffset(0);
    setPreviewMode('cleaned');
    setFocusedIssueRow(null);
    setQuickBooksStatus(null);
  }, []);

  const handleFileUpload = useCallback(
    async (file) => {
      if (!file) {
        return;
      }

      setError('');

      try {
        const {
          sheetNames: nextSheetNames,
          sheets,
          defaultSheet,
        } = await readWorkbookFile(file);
        setWorkbookSheets(sheets);
        setSheetNames(nextSheetNames);
        setSelectedSheet(defaultSheet);
        setFileName(typeof file.name === 'string' ? file.name : '');
        setPreviewMode('cleaned');
        setQuickBooksStatus(null);
      } catch (err) {
        console.error(err);
        setError(
          'We could not parse that file. Please upload a valid Excel workbook.',
        );
        resetWorkbookState();
      }
    },
    [resetWorkbookState],
  );

  useEffect(() => {
    if (!selectedSheet) {
      setOriginalData([]);
      setLeadingRowOffset(0);
      return;
    }
    const sheetData = workbookSheets[selectedSheet] || [];
    const trimmed = trimLeadingEmptyRows(sheetData);
    setOriginalData(trimmed.rows);
    setLeadingRowOffset(trimmed.offset);
  }, [selectedSheet, workbookSheets]);

  useEffect(() => {
    if (!originalData.length) {
      setCleanData([]);
      setStats(null);
      setDiagnostics([]);
      setViolations([]);
      return;
    }
    const result = cleanSheet(originalData, { captureDiagnostics: true });
    const payload = result?.data ?? result;
    setCleanData(Array.isArray(payload?.cleaned) ? payload.cleaned : []);
    setStats(payload?.stats ?? null);
    setDiagnostics(
      Array.isArray(payload?.diagnostics) ? payload.diagnostics : [],
    );
    setViolations(Array.isArray(payload?.violations) ? payload.violations : []);
  }, [originalData]);

  useEffect(() => {
    setQuickBooksStatus(null);
  }, [cleanData]);

  const activeSummary = useMemo(() => {
    if (!stats) return null;
    return {
      ...stats,
      originalRows: stats.originalRows,
      cleanedRows: stats.cleanedRows,
    };
  }, [stats]);

  const handleDownload = useCallback(
    (format) => {
      if (!cleanData.length) {
        return;
      }

      const baseName = fileName
        ? fileName.replace(/\.[^.]+$/, '')
        : 'cleaned-data';
      const sheetName = selectedSheet || 'Cleaned';
      const safeBase = sanitizeName(`${baseName}-${sheetName}`);

      if (format === 'quickbooks') {
        const packageResult = createQuickBooksPackage(cleanData);
        const validations = Array.isArray(packageResult?.validations)
          ? packageResult.validations
          : [];
        const nextStatus = {
          generatedAt: new Date(),
          validations,
          summary: packageResult?.summary || null,
        };
        setQuickBooksStatus(nextStatus);

        const hasBlockingErrors = validations.some(
          (entry) => entry.severity === 'error',
        );
        if (hasBlockingErrors) {
          return;
        }

        const workbook = XLSX.utils.book_new();
        const qboHeader = Array.isArray(packageResult?.header)
          ? packageResult.header
          : [];
        const qboRows = Array.isArray(packageResult?.rows)
          ? packageResult.rows
          : [];
        const qboSheet = XLSX.utils.aoa_to_sheet([qboHeader, ...qboRows]);
        XLSX.utils.book_append_sheet(workbook, qboSheet, 'QBO Journal');

        const validationSheetData = buildQuickBooksValidationSheet(
          nextStatus.summary,
          validations,
        );
        const validationSheet = XLSX.utils.aoa_to_sheet(validationSheetData);
        XLSX.utils.book_append_sheet(workbook, validationSheet, 'Validation');

        const ledgerSheet = XLSX.utils.aoa_to_sheet(cleanData);
        XLSX.utils.book_append_sheet(workbook, ledgerSheet, 'Clean Ledger');

        XLSX.writeFile(workbook, `${safeBase}-quickbooks-online.xlsx`, {
          bookType: 'xlsx',
        });
        return;
      }

      const worksheet = XLSX.utils.aoa_to_sheet(cleanData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        sheetName.substring(0, 31),
      );

      const extension = format === 'xlsx' ? 'xlsx' : 'csv';
      XLSX.writeFile(workbook, `${safeBase}.${extension}`, {
        bookType: extension,
      });
    },
    [cleanData, fileName, selectedSheet],
  );

  const hasWorkbook = Boolean(fileName);

  useEffect(() => {
    if (!hasWorkbook) {
      setPreviewMode('cleaned');
    }
  }, [hasWorkbook]);

  useEffect(() => {
    if (sampleLoadRef.current) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const sampleParam = params.get('sample');
    if (!shouldLoadSampleFromParam(sampleParam)) {
      return;
    }

    sampleLoadRef.current = true;

    fetchSampleWorkbook()
      .then((file) => handleFileUpload(file))
      .catch((err) => {
        console.error(err);
        setError('Sample workbook unavailable. Upload it manually.');
      });
  }, [handleFileUpload]);

  const analysis = useMemo(() => generateAnalysis(cleanData), [cleanData]);

  const quickBooksInsights = useMemo(() => {
    if (!Array.isArray(cleanData) || cleanData.length < 2) {
      return null;
    }

    const packageResult = createQuickBooksPackage(cleanData);
    const validations = Array.isArray(packageResult?.validations)
      ? packageResult.validations
      : [];

    const errors = validations.filter((entry) => entry?.severity === 'error');
    const warnings = validations.filter(
      (entry) => entry?.severity === 'warning',
    );

    const hasSummary =
      packageResult && typeof packageResult.summary === 'object';

    return {
      summary: hasSummary ? packageResult.summary : null,
      errors,
      warnings,
    };
  }, [cleanData]);

  const removedRowsPreview = useMemo(() => {
    if (!diagnostics || diagnostics.length === 0) {
      return [];
    }

    const removalDiagnostics = diagnostics.filter(
      (entry) =>
        entry &&
        typeof entry.category === 'string' &&
        entry.category.startsWith('removed-'),
    );

    if (!removalDiagnostics.length) {
      return [];
    }

    const headerCandidate = (() => {
      if (Array.isArray(cleanData?.[0]) && cleanData[0].length) {
        return [...cleanData[0]];
      }
      if (Array.isArray(originalData?.[0]) && originalData[0].length) {
        return [...originalData[0]];
      }
      return [];
    })();

    const baseHeader = headerCandidate;
    const headerLabels = baseHeader.length ? baseHeader : ['Values'];

    const ensureLength = (rowValues) => {
      const working = Array.isArray(rowValues)
        ? [...rowValues]
        : rowValues && typeof rowValues === 'object'
          ? Object.values(rowValues)
          : [rowValues ?? ''];

      if (!baseHeader.length) {
        if (!working.length) {
          return [''];
        }
        if (working.length === 1) {
          return [working[0]];
        }
        const condensed = working
          .filter(
            (value) => value !== null && value !== undefined && value !== '',
          )
          .join(' • ');
        return [condensed || working[0] || ''];
      }

      while (working.length < baseHeader.length) {
        working.push('');
      }
      if (working.length > baseHeader.length) {
        working.length = baseHeader.length;
      }
      return working;
    };

    const reasonLabels = {
      'removed-empty-row': 'Empty row',
      'removed-duplicate-row': 'Duplicate row',
      'removed-repeated-header': 'Repeated header',
    };

    const rows = removalDiagnostics.map((entry) => {
      const sourceRow =
        Array.isArray(entry.row) && entry.row.length
          ? entry.row
          : Array.isArray(originalData?.[entry.sourceRow])
            ? originalData[entry.sourceRow]
            : [];

      const normalised = ensureLength(sourceRow);
      const originIndex =
        typeof entry.sourceRow === 'number'
          ? entry.sourceRow + leadingRowOffset + 1
          : '—';
      const reason = reasonLabels[entry.category] || entry.category;

      return [originIndex, ...normalised, reason];
    });

    return [['Original row', ...headerLabels, 'Removal reason'], ...rows];
  }, [diagnostics, cleanData, originalData, leadingRowOffset]);

  const hasRemovedRows = removedRowsPreview.length > 1;

  const issueMetrics = useMemo(() => {
    if (!Array.isArray(violations) || violations.length === 0) {
      return { hasIssues: false, rowCount: 0, totalCount: 0 };
    }

    const rowSet = new Set();

    violations.forEach((violation) => {
      if (
        violation &&
        typeof violation.rowIndex === 'number' &&
        violation.rowIndex > 0
      ) {
        rowSet.add(violation.rowIndex);
      }
    });

    return {
      hasIssues: rowSet.size > 0,
      rowCount: rowSet.size,
      totalCount: violations.length,
    };
  }, [violations]);

  const tableViolations = useMemo(() => {
    if (!Array.isArray(violations) || violations.length === 0) {
      return [];
    }
    const maxRowIndex = Math.max(0, (originalData?.length || 0) - 1);
    if (maxRowIndex <= 0) {
      return [];
    }

    return violations.filter(
      (violation) =>
        violation &&
        typeof violation.rowIndex === 'number' &&
        violation.rowIndex > 0 &&
        violation.rowIndex <= maxRowIndex,
    );
  }, [violations, originalData]);

  const issueSummaryText = useMemo(() => {
    if (!issueMetrics.hasIssues) {
      return 'No issues detected in the original dataset.';
    }

    const rowLabel = issueMetrics.rowCount === 1 ? 'row' : 'rows';
    const issueLabel = issueMetrics.totalCount === 1 ? 'issue' : 'issues';

    return `${issueMetrics.rowCount} ${rowLabel} flagged (${issueMetrics.totalCount} ${issueLabel}).`;
  }, [issueMetrics]);

  useEffect(() => {
    const hasCleanRows = cleanData.length > 0;
    const hasOriginalRows = originalData.length > 0;

    if (previewMode === 'cleaned' && !hasCleanRows) {
      if (hasRemovedRows) {
        setPreviewMode('removed');
      } else if (hasOriginalRows) {
        setPreviewMode('original');
      }
    } else if (previewMode === 'original' && !hasOriginalRows) {
      if (hasCleanRows) {
        setPreviewMode('cleaned');
      } else if (hasRemovedRows) {
        setPreviewMode('removed');
      }
    } else if (previewMode === 'removed' && !hasRemovedRows) {
      if (hasCleanRows) {
        setPreviewMode('cleaned');
      } else if (hasOriginalRows) {
        setPreviewMode('original');
      } else {
        setPreviewMode('cleaned');
      }
    }
  }, [previewMode, cleanData.length, originalData.length, hasRemovedRows]);

  useEffect(() => {
    if (previewMode !== 'issues') {
      setFocusedIssueRow(null);
      return;
    }

    if (!issueMetrics.hasIssues) {
      setFocusedIssueRow(null);
      return;
    }

    if (
      typeof focusedIssueRow === 'number' &&
      violations.some((violation) => violation?.rowIndex === focusedIssueRow)
    ) {
      return;
    }

    const firstError = violations.find(
      (violation) =>
        violation?.severity === 'error' &&
        typeof violation.rowIndex === 'number',
    );
    const fallbackViolation = violations.find(
      (violation) => typeof violation?.rowIndex === 'number',
    );
    const targetRow = firstError || fallbackViolation;
    setFocusedIssueRow(targetRow ? targetRow.rowIndex : null);
  }, [previewMode, issueMetrics.hasIssues, violations, focusedIssueRow]);

  const previewData = useMemo(() => {
    if (previewMode === 'original') {
      return originalData;
    }
    if (previewMode === 'issues') {
      return originalData;
    }
    if (previewMode === 'removed') {
      return removedRowsPreview;
    }
    return cleanData;
  }, [previewMode, cleanData, originalData, removedRowsPreview]);

  const previewTitle = useMemo(() => {
    if (previewMode === 'original') {
      return 'Original data';
    }
    if (previewMode === 'issues') {
      return 'Issues in original data';
    }
    if (previewMode === 'removed') {
      return 'Removed rows';
    }
    return 'Cleaned data';
  }, [previewMode]);

  const handleShowRemovedRows = () => {
    if (!hasRemovedRows) {
      if (issueMetrics.hasIssues) {
        const firstError = violations.find(
          (violation) =>
            violation?.severity === 'error' &&
            typeof violation.rowIndex === 'number',
        );
        const fallbackViolation = violations.find(
          (violation) => typeof violation?.rowIndex === 'number',
        );
        const targetRow = firstError || fallbackViolation;
        setFocusedIssueRow(targetRow ? targetRow.rowIndex : null);
        setPreviewMode('issues');
      }
      return;
    }

    setFocusedIssueRow(null);
    setPreviewMode('removed');
  };

  const handleCellEdit = (rowIndex, columnIndex, value) => {
    setCleanData((previous) => {
      if (!Array.isArray(previous) || previous.length === 0) {
        return previous;
      }

      return previous.map((row, index) => {
        if (index !== rowIndex) {
          return row;
        }

        const updatedRow = Array.isArray(row) ? [...row] : [row];
        updatedRow[columnIndex] = value;
        return updatedRow;
      });
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-16 transition-colors dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white/60 backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-900/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            ICC Data Cleaner
          </h1>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </header>

      <main className="mx-auto mt-6 max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="w-full lg:max-w-sm lg:flex-none xl:max-w-md">
              <FileUploader
                layout="horizontal"
                onFileUpload={handleFileUpload}
              />
            </div>
            <div className="flex w-full flex-col gap-3 lg:flex-1">
              {(fileName || sheetNames.length > 1 || selectedSheet) && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2 text-[0.65rem] text-blue-900 shadow-sm dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-100">
                  {fileName ? (
                    <span className="inline-flex max-w-[14rem] items-center gap-1 truncate rounded-full bg-white/70 px-2 py-0.5 font-semibold uppercase tracking-wide text-blue-700 shadow-sm dark:bg-slate-900/60 dark:text-blue-200">
                      <span className="text-[0.6rem] font-bold">File</span>
                      <span className="truncate normal-case tracking-normal">
                        {fileName}
                      </span>
                    </span>
                  ) : null}

                  {selectedSheet ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-white/70 px-2 py-0.5 font-semibold uppercase tracking-wide text-blue-700 shadow-sm dark:border-blue-500/30 dark:bg-slate-900/60 dark:text-blue-200">
                      <span className="text-[0.6rem] font-bold">Sheet</span>
                      <span className="truncate normal-case tracking-normal">
                        {selectedSheet}
                      </span>
                    </span>
                  ) : null}

                  {sheetNames.length > 1 ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-blue-700 dark:text-blue-200">
                        Switch
                      </span>
                      {sheetNames.map((sheetName) => (
                        <button
                          key={sheetName}
                          type="button"
                          onClick={() => setSelectedSheet(sheetName)}
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.62rem] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 ${
                            selectedSheet === sheetName
                              ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-500'
                              : 'bg-blue-100/70 text-blue-700 hover:bg-blue-100 hover:text-blue-800 dark:bg-blue-500/10 dark:text-blue-200 dark:hover:bg-blue-500/20'
                          }`}
                        >
                          {sheetName}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}

              {error ? (
                <p className="rounded-lg border border-red-200 bg-red-50/90 px-3 py-2 text-[0.65rem] text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-[12rem] flex-1">
                  <SummaryCards
                    stats={activeSummary}
                    onViewRemoved={handleShowRemovedRows}
                    canViewRemoved={issueMetrics.hasIssues || hasRemovedRows}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[0.62rem]">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600 bg-emerald-600 px-3 py-1.5 font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-500 dark:bg-emerald-500"
                    onClick={() => handleDownload('quickbooks')}
                    disabled={!cleanData.length}
                  >
                    <span aria-hidden>📦</span>
                    QuickBooks Online package
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full border border-blue-600 bg-blue-600 px-3 py-1.5 font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-400 dark:bg-blue-500"
                    onClick={() => handleDownload('xlsx')}
                    disabled={!cleanData.length}
                  >
                    <span aria-hidden>⬇️</span>
                    Download .xlsx
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full border border-blue-600 px-3 py-1 font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-400 dark:text-blue-200 dark:hover:bg-blue-500/10"
                    onClick={() => handleDownload('csv')}
                    disabled={!cleanData.length}
                  >
                    <span aria-hidden>⬇️</span>
                    Download .csv
                  </button>
                </div>
                {quickBooksStatus ? (
                  <QuickBooksStatusBanner status={quickBooksStatus} />
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Preview
            </h2>
            <div className="flex flex-wrap items-center gap-2 rounded-full bg-slate-100 p-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
              {[
                { id: 'cleaned', label: 'Clean', icon: '✨', disabled: false },
                {
                  id: 'original',
                  label: 'Original',
                  icon: '📄',
                  disabled: !originalData.length,
                },
                {
                  id: 'issues',
                  label: 'Issues',
                  icon: '⚠️',
                  disabled: !issueMetrics.hasIssues,
                },
                ...(hasRemovedRows
                  ? [
                      {
                        id: 'removed',
                        label: 'Removed',
                        icon: '🗑️',
                        disabled: false,
                      },
                    ]
                  : []),
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    if (option.disabled) {
                      return;
                    }
                    if (option.id === 'removed') {
                      handleShowRemovedRows();
                      return;
                    }
                    setPreviewMode(option.id);
                  }}
                  disabled={option.disabled}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 ${
                    previewMode === option.id
                      ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-300'
                      : 'hover:text-slate-900 dark:hover:text-slate-100'
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  <span aria-hidden>{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {previewMode === 'issues' ? (
            <div
              className={`rounded-lg border px-3 py-2 text-xs ${
                issueMetrics.hasIssues
                  ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-400/60 dark:bg-amber-500/10 dark:text-amber-100'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/60 dark:bg-emerald-500/10 dark:text-emerald-100'
              }`}
            >
              {issueSummaryText}
            </div>
          ) : null}

          <DataPreview
            data={previewData}
            title={previewTitle}
            className="h-full"
            editable={previewMode === 'cleaned'}
            onCellChange={
              previewMode === 'cleaned' ? handleCellEdit : undefined
            }
            highlight={
              previewMode === 'cleaned'
                ? 'Editable'
                : previewMode === 'issues'
                  ? 'Issues'
                  : previewMode === 'removed' && hasRemovedRows
                    ? 'Removed rows'
                    : undefined
            }
            violations={previewMode === 'issues' ? tableViolations : []}
            focusRowIndex={previewMode === 'issues' ? focusedIssueRow : null}
          />
        </section>

        <AnalysisPanel
          analysis={analysis}
          quickBooksInsights={quickBooksInsights}
        />
      </main>
    </div>
  );
}

export default App;
