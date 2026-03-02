# Design: PDF-Aligned Ledger Analysis

## Objective

Nick reviews the "2025.09 Interface Run" PDF because it narrates each section of the interface file—credit memos, invoices, the rent-run mega invoice, payment batches, journals, checks, and voids—while proving that debits and credits stay in balance. The web app’s analysis panel should surface that same story from the cleaned Excel sheet so staff can verify the numbers without opening the PDF.

## Data Modeling

1. **Transaction Reconstruction**
   - As we iterate the cleaned worksheet, treat every header line that carries a `Type`/`Number` pair as the start of a transaction and attach the following detail rows (which typically have blank `Type`/`Number` cells but carry the class/account splits).
   - Persist per-transaction metadata: `type`, `number`, `date`, the first non-empty `Class` (batch category), the controlling `Account`, and all subordinate line items so that we can calculate totals identical to the PDF subtotals.
   - Capture rollups per transaction: line count, debit sum, credit sum, class totals, account totals, distinct payees/properties. These power the section summaries, rent spotlight, and payment batch cards.

2. **Section Aggregates**
   - After transactions are assembled, compute section-level aggregates keyed by `type` (e.g., Credit Memo, Invoice, Payment). Store: number of transactions, total debit/credit, total lines, and the leading classes/accounts within the section.
   - Retain the previous high-level metrics (row count, debit/credit totals, variance) for backwards compatibility with charts and cards.

## UI Enhancements

1. **Ledger Section Digest**
   - Introduce a “Ledger sections (PDF layout)” card that lists the top section types with their debit/credit totals, journal counts, and the dominant houses/accounts. This mirrors the narrative headers in the PDF.
   - Mention when additional section types exist (e.g., “+2 more sections”) so reviewers know the totals extend beyond the previewed list.

2. **Rent Run Spotlight**
   - Highlight the largest invoice (the rent megainvoice) in a dedicated card showing its journal date, total debit, and the property subtotals pulled from the detail lines, echoing the multi-page rent block in the PDF.
   - If sample detail descriptors are available, list a few so finance can confirm the resident mix aligns with the PDF narrative.

3. **Payment Batch Rollup**
   - Summarize the heaviest payment batches with their batch IDs, deposit channels (Credit Cards, Payments), deposit accounts, posting dates, and dollar totals. This parallels the batch headers in the PDF’s payment section.

4. **Contextual Counters**
   - Augment the existing “Rows analyzed” stat with the count of reconstructed transactions so auditors can compare it to the PDF’s journal tally.
   - Ensure the balance card still confirms that interface debits and credits match the PDF “Interface Totals” block.

## QA Considerations

- Extend unit tests to verify that:
  - Detail lines inherit their parent transaction type/number for aggregation.
  - Section summaries, rent spotlight data, and payment batch rollups produce expected totals on a synthetic worksheet.
- Confirm that the UI gracefully handles sheets lacking a rent mega invoice or payment batches (cards collapse to friendly empty states).
