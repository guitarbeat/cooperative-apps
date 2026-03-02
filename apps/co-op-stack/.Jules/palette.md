## 2026-02-04 - Interactive Component Accessibility
**Learning:** `EditableField` component exposed a pattern where icon-only buttons (Save, Cancel, Edit) lacked ARIA labels, making them invisible to screen readers despite being interactive.
**Action:** Always inspect reusable UI components (`src/components/ui/*`) for missing `aria-label`s on icon buttons when using them in new contexts.

## 2026-02-05 - Settings Panel Icon Density
**Learning:** Settings panels (like `HostSettingsPanel`) often group multiple small actions (Edit, Save, Cancel, Regenerate) tightly. These high-density icon areas are prone to missing accessibility labels because they rely on visual proximity and iconography for context, which is lost on screen readers.
**Action:** When reviewing "settings" or "controls" components, specifically audit every icon-only button for an `aria-label`, as they are rarely accompanied by text.
