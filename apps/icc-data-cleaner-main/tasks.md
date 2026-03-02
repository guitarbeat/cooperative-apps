# Implementation Tasks

## Analysis Engine

- [x] **Reconstruct transactions**
  - Attach detail rows to their parent `Type`/`Number` headers so totals match the PDF sections.
  - Track per-transaction metadata (line counts, debit/credit totals, class/account rollups) for downstream summaries.
- [x] **Section aggregates & rent spotlight**
  - Compute section-level totals and top classes/accounts for each transaction type.
  - Identify the rent megainvoice and expose its property subtotals and posting date.
- [x] **Payment batch rollups**
  - Summarize payment transactions with batch channel, bank account, posting date, and total amount.
  - Handle cases where payment detail rows are missing by falling back to the controlling line only.

## Frontend / UI

- [x] **Ledger section digest card**
  - Render the top section types with debit/credit totals, journal counts, and dominant houses/accounts.
  - Note when additional sections exist beyond the previewed list.
- [x] **Rent run and payment batch panels**
  - Highlight the rent megainvoice with property totals and optional detail samples.
  - Present the heaviest payment batches with batch IDs, deposit channels, and bank accounts.
- [x] **Stat upgrades**
  - Show reconstructed transaction count alongside row totals.
  - Keep balance messaging aligned with the PDF “Interface Totals” check.

## Testing

- [x] **Unit coverage**
  - Extend `analysis.test.js` to cover transaction reconstruction, section summaries, rent spotlight, and payment batches.
  - Verify that empty or minimal sheets return sane defaults for the new fields.
