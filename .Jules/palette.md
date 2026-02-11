## 2024-05-22 - Nested Interactive Controls
**Learning:** Placing a `<button>` inside a `<label>` is invalid HTML and causes accessibility issues. When a label needs to trigger a file input but look like a button, use a `span` styled as a button (using `asChild` pattern) inside the label.
**Action:** Always verify that interactive elements are not nested. Use `asChild` with `span` for button-like triggers inside labels.

## 2024-05-24 - Non-interactive Elements as Triggers
**Learning:** `MultiSelectInput` uses a `div` with `onClick` as a dropdown trigger, making it inaccessible to keyboard users. This pattern might exist in other custom inputs.
**Action:** When creating custom dropdowns, use `<button type="button">` or a proper combobox pattern with `role="combobox"` and tabindex management.

## 2025-06-13 - Combobox Trigger Accessibility
**Learning:** For custom dropdowns where the trigger contains interactive elements (like selected tags with remove buttons), using `role="button"` on the container is invalid. Instead, use `role="combobox"` with `aria-haspopup="listbox"` and `tabIndex="0"`.
**Action:** When fixing "div with onClick" accessibility for complex triggers, use the combobox pattern and manage focus manually (e.g., return focus to trigger on close).
## 2024-05-25 - Label Focus for Custom Inputs
**Learning:** Native `<label htmlFor="...">` only focuses standard form elements. For custom `div`-based inputs (even with `tabIndex`), you must manually handle the label's `onClick` to focus the trigger ref.
**Action:** When building custom inputs, add `onClick={() => triggerRef.current?.focus()}` to the label.
