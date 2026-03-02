# icc-data-cleaner

![CI](https://github.com/icc-austin/icc-data-cleaner/actions/workflows/ci.yml/badge.svg)

## Context

Following our board meeting, we discussed the manual banking activity review. Our property management software (PropertyBoss) can export transactions for QuickBooks Desktop, but it does not support QuickBooks Online. As a result, Key Figures (and Billy before them) have been manually coding each line into QuickBooks. Nick shared a sample export in Excel and a cleaner PDF to illustrate the issue. The Excel export repeats the header row every few lines, leaves blank cells, and misaligns columns. The PDF shows the ideal ledger with columns for Type, Number, Date, Item, Class, Account, Debit, Credit, Property, Payee and Description, but it cannot be imported directly into QuickBooks.

## Goal

Automate the cleaning and transformation of the PropertyBoss export so that it can be uploaded to QuickBooks Online. The cleaned output should be a flat table with one transaction per row and standardized columns (`Type | Number | Date | Item | Class | Account | Debit | Credit | Property | Payee | Description`).

## Implementation

This repository now ships a client-side React application that wraps the workbook-cleaning workflow in a guided UI:

- Upload any Excel workbook produced by PropertyBoss (or similar systems) directly in the browser.
- Pick the sheet you want to process when the workbook contains multiple tabs.
- Toggle granular cleaning rules (trim whitespace, remove blank rows/columns, deduplicate repeated rows, and skip repeated headers).
- Inspect side-by-side previews with pagination to validate the transformation before exporting.
- Review rich summary statistics that highlight how many rows were removed, how many cells were trimmed, and whether duplicate or empty values were discarded.
- Export the cleaned dataset as either a fresh `.xlsx` workbook or a `.csv` file that can be imported into downstream tooling.
- Generate a QuickBooks Online import workbook that maps each ledger row to journal entry fields, bundles validation findings, and includes the cleaned ledger for audit purposes.

### Issues Mode & Ledger Fidelity

Inspired by the detailed walkthrough in [`pdf-structure.md`](./pdf-structure.md), the preview now mirrors the way ICC Austin formats interface packets for PDF distribution:

- Switch to the **Issues** preview mode to see the original worksheet annotated with rule violations. Cells inherit the same narrative cues as the PDF—credit memo context, rent mega-invoice blocks, payment batches, and control-total removals are all highlighted so reviewers can scan sections just like they would in the "2025.09 Interface Run" booklet.
- Row-level problems (for example, repeated headers or blank spacer rows) surface as badges at the start of each ledger block, while column-specific adjustments (like moving a stray `40-1000` account code back into the `Account` column) glow amber/red with tooltips explaining the change.
- The removed-row drilldown links directly into Issues mode, allowing finance staff to jump from the cleaned ledger back to the specific spot in the raw export and compare it with the PDF/Excel narrative described in the reference document.
  - Switch to the **Issues** preview mode to see the original worksheet annotated with rule violations. Cells inherit the same narrative cues as the PDF—credit memo context, rent mega-invoice blocks, payment batches, and control-total removals are all highlighted so reviewers can scan sections just like they would in the "2025.09 Interface Run" booklet.
  - Row-level problems (for example, repeated headers or blank spacer rows) surface as badges at the start of each ledger block, while column-specific adjustments (like moving a stray `40-1000` account code back into the `Account` column) glow amber/red with tooltips explaining the change.
  - The removed-row drilldown links directly into Issues mode, allowing finance staff to jump from the cleaned ledger back to the specific spot in the raw export and compare it with the PDF/Excel narrative described in the reference document.

Behind the scenes the cleaning pipeline emits a versioned payload (`schemaVersion: 2`) with structured violation metadata. Each violation records the `rowId`, affected columns, severity, and human-readable message so that other clients—or an automated PDF renderer—can reconstruct the same highlights.

The cleaning logic lives in `src/lib/cleaner.js`. Rows are normalised so every record shares the same column count, repeated header rows are removed, superfluous columns are dropped, and per-rule metrics are collected to help auditors understand exactly what changed.

## Running the Demo

To run the full UI locally using the bundled Vite setup:

### Development Server

To run the application in development mode with hot reload:

```bash
npm run dev
```

This will start a Vite development server at `http://localhost:3000`.

### Production Build

To build the application for production:

```bash
npm run build
```

The built files will be output to the `dist/` directory.

### Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

This will serve the built application at `http://localhost:4173`.

### Testing

To run the unit tests with Node's built-in test runner, install dependencies and then execute the suite:

```bash
npm install
npm test
```

### Development & Code Standards

To ensure code quality, we use ESLint and Prettier.

```bash
# Check for linting issues
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Check formatting
npm run check-format

# Fix formatting automatically
npm run format
```

This project also supports pre-commit hooks via [pre-commit](https://pre-commit.com/).

```bash
# Install pre-commit hooks
pre-commit install
```

## Future Work

- Parse complex descriptions to extract property names and payees automatically.
- Allow users to define custom column mappings and persist preferred cleaning presets.
- Automate the process with a backend script (e.g. Python/Node or an n8n workflow) that watches for new exports and cleans them automatically.
- Provide robust audit logs and multi-user authentication to support production use.
