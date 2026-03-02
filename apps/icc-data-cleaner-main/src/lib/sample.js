const SAMPLE_WORKBOOK_URL = new URL(
  '../../2025.09.30  Interface Run.XLSX',
  import.meta.url,
);
const SAMPLE_WORKBOOK_NAME = '2025.09.30  Interface Run.XLSX';
const DEFAULT_SAMPLE_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export async function fetchSampleWorkbook() {
  const response = await fetch(SAMPLE_WORKBOOK_URL, { cache: 'no-cache' });
  if (!response.ok) {
    throw new Error(`Failed to fetch sample workbook: ${response.status}`);
  }

  const blob = await response.blob();
  const type = blob.type || DEFAULT_SAMPLE_MIME;
  const timestamp = Date.now();

  if (typeof File === 'function') {
    return new File([blob], SAMPLE_WORKBOOK_NAME, {
      type,
      lastModified: timestamp,
    });
  }

  const fallback = new Blob([blob], { type });
  return Object.assign(fallback, {
    name: SAMPLE_WORKBOOK_NAME,
    lastModified: timestamp,
  });
}

export function shouldLoadSampleFromParam(paramValue) {
  if (paramValue === null) {
    return false;
  }

  const normalized = paramValue.trim().toLowerCase();
  if (
    normalized === '' ||
    normalized === '1' ||
    normalized === 'true' ||
    normalized === 'yes'
  ) {
    return true;
  }

  if (normalized === '0' || normalized === 'false' || normalized === 'no') {
    return false;
  }

  return true;
}
