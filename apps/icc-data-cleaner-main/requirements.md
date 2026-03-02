# Requirements: Issue Highlighting for Data Preview

## Background

Users reviewing cleaned datasets struggle to trust the retention summary because they cannot easily verify why rows were removed. They prefer to see validation issues directly within the original dataset preview, with the ability to toggle issue highlighting on and off.

## Functional Requirements

1. **Issue Annotation Export**
   - The cleaning pipeline must produce structured metadata that identifies every rule violation detected during cleaning.
   - Metadata must specify the offending row identifier and, when applicable, the exact column(s) involved and the rule that triggered removal or modification.
2. **Preview Modes**
   - Extend the data preview to support an "Issues" mode that overlays highlights on the original dataset view without altering the underlying data.
   - Users must be able to toggle between Original, Cleaned, Removed, and Issues modes while preserving pagination, sorting, and filtering behavior.
3. **Visual Highlighting**
   - When the Issues mode is active, affected cells should be visually distinguished and include a tooltip or inline label describing the rule violation.
   - Highlight styling must be accessible: meet WCAG AA contrast requirements and provide non-color indicators (e.g., icons or text badges).
4. **Removed Rows Review**
   - The existing "Review removed rows" action must continue to work and link to the Issues mode for context when the removed row still exists in the original preview.
   - When a removed row cannot be displayed (e.g., due to deduplication), the UI should explain why and present the issue metadata instead.
5. **Performance & UX**
   - Loading the Issues mode should not increase initial preview load time by more than 15% compared to current behavior for datasets up to 10k rows.
   - The UI must gracefully handle cases where no issues are present by disabling the toggle and showing a succinct message.

## Non-Functional Requirements

- The metadata schema must be versioned to allow future rule additions without breaking older clients.
- Any new API endpoints or payload changes require end-to-end tests covering a representative CSV with multiple rule violations.
- Documentation updates are required for the cleaning pipeline and UI to describe the new Issues mode.
