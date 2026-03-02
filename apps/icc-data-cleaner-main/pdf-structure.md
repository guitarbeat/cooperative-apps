# 2025.09 Interface Run Report Overview

## Document Layout

- **Page Header**: Every page opens with the ICC Austin letterhead (address, phone, fax, website) and interface metadata: interface file ID `PBJ2510-001`, accounting file `ICC-Real`, preparer `nick`, and lifecycle timestamps (created 10/6/2025 2:39 PM, sent 10/6/2025 2:40 PM, closed 10/6/2025 2:41 PM). The header also reiterates the QuickBooks Enterprise build (`2023 R6P`) and the company name so that readers can confirm which data file was used.
- **Ledger Columns**: Detailed listings always reuse the same headings—`Type`, `Number`, `Date`, `Item`, `Class`, `Account`, `Debit`, `Credit`—followed by ledger rows that hold both accounting splits and narrative descriptions for the transaction lines. The description text is embedded in the `Item` column after the resident name, and the `Class` column carries the property/house identifier (e.g., `Eden`, `French House`).
- **Running Pagination**: The footer shows `Page X of 41` plus a time-stamp, letting the reader track sequence continuity when the report is printed or scanned.
- **Workbook Origin**: The report mirrors the structure of the accompanying Excel workbook [`2025.09.30  Interface Run.XLSX`](./2025.09.30%20%20Interface%20Run.XLSX). Each worksheet tab ("Credit Memos", "Invoices", "Rent", "Payments", "Journal Entries", "Checks", and "Voids") uses the same column labels, and the first three rows of each tab repeat the header metadata so that a manual export can be performed by filtering rows within Excel and printing to PDF without losing context.

## Replicating the PDF from the Workbook

- **Cleaning Pass**: We run the workbook through `cleanSheet` with control-total removal enabled so that summary lines (e.g., `Interface Totals`, `Rent Total`, `Grand Totals`) are stripped before rendering. The cleaner tolerates amounts that spill into the blank spacer column between `Account` and `Debit` and now recognises textual markers such as "Total for Helios" or "Interface Totals" so the output matches the PDF’s detail-only sections.
- **Section Assembly**: After cleaning, we group rows by the `Type` column to rebuild the PDF’s narrative flow—credit memos, invoices (including the megainvoice), payments, journals, checks, and voids—ensuring each section header appears exactly where it does in the original document. Because repeated headers are removed by the cleaner, we inject the canonical header row at the start of each rendered section.
- **Totals Verification**: Dropping control-total rows means that the PDF reconstruction relies on recalculated debit/credit sums. We recompute subtotals while exporting and cross-check them against the original workbook’s `Control Totals` sheet so the regenerated PDF’s ending balances tie back to `$262,948.27` on both the debit and credit sides.

## Column Reference

- **Type**: Transaction category (e.g., `Credit Memo`, `Invoice`, `Payment`, `Journal Entry`, `Check`, `Void`).
- **Number**: Internal identifier used across both the PDF and workbook (e.g., `PBJ-IN02792`).
- **Date**: Effective date for the transaction line, generally the move-in, billing, or payment posting date.
- **Item**: Composite field combining the revenue/expense item with narrative detail; rent lines show `Room & Board` followed by the house, room, resident, and billing month, while refunds and late fees cite the origin transaction and payee.
- **Class**: Property-level segment coding (Arrakis, Eden, etc.) used for cost accounting.
- **Account**: General ledger account receiving the debit/credit (e.g., `40-1000..Room & Board`, `12-1010..ACCOUNTS RECEIVABLE`, `10-7543..UFCU CHECKING (0080)`).
- **Debit / Credit**: Monetary split entries; debits usually represent income or asset increases, credits show receivable reductions or liability increases. Column totals are provided at the end of each transaction block.

## Transaction Sections

### 1. Credit Memos & Invoices

- **Purpose**: Front pages document credit memos (`PBJ-CM#####`) reversing rent or returning deposits, followed by fee/charge invoices (`PBJ-IN#####`). These entries ensure that receivable balances reflect move-outs, concession approvals, or manual adjustments entered after the bulk rent run.
- **Structure**: Each memo/invoice starts with the controlling accounts (e.g., `40-1000..Room & Board` vs. `12-1010..ACCOUNTS RECEIVABLE`) and then lists the descriptive detail lines. The `Memo` text from QuickBooks prints immediately under the account split, giving narrative context (“Payment to Tenant”, “Rent Due (reversing)”, etc.).
- **Examples**:
  - Credit memo **PBJ-CM01708** reverses a $555.00 rent due entry for _Helios - MN_ with the memo text “Rent Due (reversing) Helios - MN - 8/2/2025 Payee: Dash, Deja,” debiting Room & Board income and crediting Member Receivables. The Excel `Credit Memos` tab shows the same line with an `Adjustment Reason` column that confirms the reversal was authorized by the membership coordinator.
  - Invoice **PBJ-IN02781** aggregates late fees on 9/6/2025, posting $250.00 to receivables and distributing $10.00 assessments across Eden, French House, Helios, and House of Audre Lorde residents such as Julia Reed, Beau Seibel, and Brooklyn Foster, all annotated with the room number and original bill date. Excel columns `Late Fee Reason` and `Original Charge` allow a reviewer to trace each assessment back to its originating invoice.

### 2. Rent-Due Megainvoice (PBJ-IN02792)

- **Scope**: A single multi-page invoice dated 10/1/2025 captures recurring rent charges totalling $155,515.00 for the cooperative portfolio.
- **Grouping**: Within the invoice, each house (Arrakis, Eden, French House, Helios, House of Commons, House of Audre Lorde, New Guild, Royal, Ruth Schulze, and more) is introduced with the Room & Board income total, followed by one row per bedroom. The PDF mirrors the Excel `Rent` tab which contains one row per active license with columns for `Billing Cycle`, `Room Type`, and `Move-Out Date` so staff can validate proration logic before export.
- **Examples**:
  - The **New Guild** block lists rooms 01A through 23 with residents like George Jackson, Sienna Schnathorst, and Charles Blair, showing their move-in effective months and amounts ranging from $665.00 shared rooms to $950.00 apartments. Hidden Excel columns expose additional metadata such as `Contract ID` and `Deposit Balance` that are suppressed in the PDF but help finance double-check occupant status.
  - Subsequent pages continue with **Royal** and **Ruth Schulze**, noting residents such as Diana Cabrera (Royal - 09B) and Maria Reyna (Ruth Schulze - 101) with their October rent assessments, demonstrating how each house subtotal (e.g., $11,400.00 for Royal, $28,120.00 for Ruth Schulze) rolls into the master receivable posting. The last page of the invoice shows a two-line grand total (debit to receivables, credit to Room & Board) that ties to the `SUMIFS` totals in Excel column `Amount` filtered by `Batch = PBJ-IN02792`.

### 3. Additional Invoices

- After the rent run, smaller invoices track other receivable activity:
  - **PBJ-IN02793** reverses a returned check for French House room 14, moving $950.00 back to receivables via the `10-7555..UFCU - Mem. Pmnts.` account.
  - **PBJ-IN02794** and similar entries apply fresh late fees across Arrakis, Eden, and French House, each line naming the resident (e.g., Marvin John in Arrakis - 03A) and the original billing month.
  - **PBJ-IN02796** bills damages and cleaning charges for move-outs at Eden and Helios, itemizing costs such as “Move Out Clean” and “Wall Repair” against specific rooms. Supporting photos are referenced in the Excel `Notes` column for facilities follow-up.
  - **PBJ-IN02798** records utility pass-throughs for House of Commons, breaking out September water and electricity charges per room so that communal expenses can be reconciled against the master utility spreadsheet.
- The Excel `Invoices` tab keeps these ancillary charges separate by tagging each row with `Invoice Category` values (Late Fee, Returned Item, Damage, Utility). Filtering by category allows staff to reproduce each supplemental invoice packet exactly as it appears in the PDF.

### 4. Payment Activity Batches

- **Batch Labels**: Payments are grouped under `Credit Cards` or `Payments` batches with unique IDs such as `PBJ306-eft` or `PBJ307-chk` and include the bank clearing account line (debit) paired against receivables (credit). The header line for each batch states the deposit date and clearing account (`10-7543..UFCU CHECKING (0080)` for checks, `10-7555..UFCU - Mem. Pmnts.` for EFTs) so treasury can reconcile bank statements.
- **Tenant Lines**: Under each batch, individual EFT, check, or ACH entries identify the house/room, resident, billing effective date, and amount collected. The Excel `Payments` tab includes columns for `Payment Method`, `Deposit ID`, and `Reference Number` that allow finance staff to tie back to bank exports or card processor reports.
- **Examples**:
  - Batch **PBJ306-eft** on 9/30/2025 shows a $7,410.00 EFT sweep with members like Alex LayPort (Eden - 05), Melonee Patrick (French House - 05), and Thanh Tam Thi Trinh (House of Commons - 02). The `Payments` tab marks these rows with `Method = EFT` and `Deposit ID = 2025-09-30` which matches the QuickBooks deposit record.
  - Check batch **PBJ307-chk** (9/11/2025) captures mailed payments including Katie McCulley (New Guild - 11) and Jos Soto (House of Audre Lorde - G), illustrating partial credits when payments do not match full rent (e.g., a $565.00 receipt for New Guild - 10A). Accompanying Excel notes track check numbers so staff can follow up on missing remittances.
  - Later batch **PBJ311-chk** (10/2/2025) continues the pattern with residents across House of Commons, Helios, and Royal, showing the same ledger pairing and narrative style. Excel formulas in the `Batch Balance` column turn red if debit and credit totals diverge, making it easy to catch data entry issues before the PDF is generated.

### 4A. Reconstructing Batches from Excel

- **Manual Filtering**: Inside the Excel file, selecting the "Payments" tab and filtering the `Batch ID` column isolates groups like `PBJ306-eft`. Sorting by `House/Room` reproduces the resident order that appears in the PDF before printing. The workbook stores the sort priority in a helper column labeled `Print Order`, so reapplying `Sort by Print Order` guarantees the PDF sequence.
- **Pivot Summaries**: Creating a PivotTable on the `Account` field quickly yields the debit/credit control totals shown in the PDF header rows, providing a way to validate that every batch is balanced before export. Pivoting `Batch ID` rows against `Amount` values reveals the same $7,410.00 and $6,275.00 totals that appear in the PDF headings.
- **Batch Template**: For new staff learning the process, the `Instructions` worksheet describes a step-by-step macro-free workflow: duplicate the template filter view, choose the desired batch, verify that the `Variance` column is zero, and then run `File → Export → Create PDF/XPS`. This documentation explains why the PDF can be regenerated without custom scripts.

### 5. Journal Entries, Checks, and Voids

- **Journal Entries**: Transfers between receivables and `12-5002..A-R TRANSFERS` accounts document roommate changes or balance reallocations, citing both the origin room and effective month (e.g., PBJ-JE04131 shifting $665.00 for New Guild - 16A on 9/1/2025). In Excel the `Journal Entries` tab contains auxiliary columns `Source Transaction` and `Reason Code` for auditors verifying why balances moved.
- **Member Refund Checks**: Entries like PBJ-CH01380 issue refunds from the `10-7543..UFCU CHECKING (0080)` account, with narrative “Payment to Tenant” lines explaining the recipient (e.g., Eden - 06A returning $50.00 to Averi Cecil). The workbook’s `Checks` tab ties each refund to a `Cleared Date` column so treasury can confirm bank reconciliation status.
- **Voided Checks**: The final pages also record voids such as PBJ-CV00036 for Dagmawit Worke, reversing prior disbursements by crediting the checking account and debiting receivables. Excel lists voids on a dedicated `Voids` tab where conditional formatting highlights the reversing entries in yellow to prevent accidental re-exporting.

## Totals and Closing

- Each section implicitly balances through its debit and credit columns; the report’s closing rows sum all journaled debits and credits for the interface file, confirming that the interface batch is in equilibrium before export. The PDF ends with an `Interface Totals` block showing `$262,948.27` in debits and `$262,948.27` in credits, matching the Excel `Control Totals` sheet.
- The Excel workbook can be used to corroborate the final totals: applying SUMIF formulas across the `Debit` and `Credit` columns in each tab produces the same grand totals, ensuring that the PDF is a faithful rendering of the ledger data stored in the spreadsheet. Staff can open the `Control Totals` sheet, refresh the `SUMIFS` formulas, and confirm that no variance exists prior to importing the interface file into QuickBooks.
- Because the Excel workbook is the authoritative source, any discrepancies detected in the PDF can be traced back by searching for the transaction number within Excel, reviewing the hidden audit columns (`Entered By`, `Last Modified`, `Source Form`), and re-running the export once corrections are made.
