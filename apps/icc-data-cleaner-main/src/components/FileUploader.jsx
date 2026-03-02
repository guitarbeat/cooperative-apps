import React, { useCallback, useRef, useState } from 'react';

const FileUploader = ({ onFileUpload, layout = 'vertical' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);
  const isHorizontal = layout === 'horizontal';

  const handleFile = useCallback(
    async (file) => {
      if (!file) return;
      await Promise.resolve(onFileUpload(file));
    },
    [onFileUpload],
  );

  const handleChange = async (event) => {
    const input = event.target;
    const file = input.files?.[0];
    try {
      await handleFile(file);
    } finally {
      input.value = '';
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    if (isDragging) {
      setIsDragging(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    handleFile(file);
  };

  const handleBrowseClick = () => {
    inputRef.current?.click();
  };

  const baseDropzoneStyles =
    'relative flex cursor-pointer items-center justify-center rounded-lg border border-dashed px-3 transition focus-within:ring-2 focus-within:ring-blue-200';
  const idleStyles =
    'border-slate-300 bg-white/70 text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300';
  const draggingStyles =
    'border-blue-500 bg-blue-50/40 text-blue-700 dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-200';
  const horizontalDropzoneStyles =
    'min-h-[80px] flex-col gap-2 py-3 text-center sm:flex-row sm:items-center sm:justify-start sm:text-left';
  const verticalDropzoneStyles = 'flex-col gap-2 py-6 text-center';
  const dropzoneClasses = `${baseDropzoneStyles} ${
    isDragging ? draggingStyles : idleStyles
  } ${isHorizontal ? horizontalDropzoneStyles : verticalDropzoneStyles}`;

  return (
    <div className={isHorizontal ? 'w-full space-y-2' : 'space-y-3'}>
      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Workbook
      </label>
      <div
        className={dropzoneClasses}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onClick={handleBrowseClick}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleBrowseClick();
          }
        }}
      >
        <svg
          aria-hidden
          className="mb-2 h-9 w-9 text-current sm:mb-0 sm:mr-3 sm:h-9 sm:w-9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <path
            d="M12 16v-8m0 0 3 3m-3-3-3 3M7 20h10a2 2 0 0 0 2-2v-5.5a1 1 0 0 0-.3-.7l-6-6.1a1 1 0 0 0-1.4 0l-6 6.1a1 1 0 0 0-.3.7V18a2 2 0 0 0 2 2Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-100">
            Drop workbook
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
            Click anywhere in this area to browse.
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.XLSX,.XLS"
          onChange={handleChange}
          className="sr-only"
          aria-label="Upload Excel workbook"
        />
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-[0.6rem] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          .xlsx
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          .xls
        </span>
        <span>Instant re-run on drop</span>
      </div>
    </div>
  );
};

export default FileUploader;
