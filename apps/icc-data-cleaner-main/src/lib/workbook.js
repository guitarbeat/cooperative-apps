const rowHasMeaningfulContent = (row) => {
  if (!row) return false;
  if (!Array.isArray(row)) {
    return row !== '' && row !== null && row !== undefined;
  }

  return row.some((cell) => {
    if (cell === null || cell === undefined) {
      return false;
    }
    if (typeof cell === 'string') {
      return cell.trim() !== '';
    }
    return cell !== '';
  });
};

export const trimLeadingEmptyRows = (rows) => {
  if (!Array.isArray(rows)) {
    return { rows: [], offset: 0 };
  }

  let startIndex = 0;
  while (
    startIndex < rows.length &&
    !rowHasMeaningfulContent(rows[startIndex])
  ) {
    startIndex += 1;
  }

  return {
    rows: rows.slice(startIndex),
    offset: startIndex,
  };
};

export const selectDefaultSheetName = (sheetNames, workbookSheets) => {
  if (!Array.isArray(sheetNames) || sheetNames.length === 0) {
    return '';
  }

  for (const sheetName of sheetNames) {
    const sheetRows = workbookSheets?.[sheetName];
    if (!Array.isArray(sheetRows)) {
      continue;
    }

    if (sheetRows.some((row) => rowHasMeaningfulContent(row))) {
      return sheetName;
    }
  }

  return sheetNames[0];
};

export default {
  trimLeadingEmptyRows,
  selectDefaultSheetName,
};
