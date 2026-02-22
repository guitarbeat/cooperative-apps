# Palette's Journal

## 2026-02-20 - Interactive Badges and A11y
**Learning:** Interactive Badges (using `onClick`) default to non-semantic spans, breaking keyboard accessibility. They must wrap a native `<button>` using the `asChild` prop to ensure focusability and proper role support.
**Action:** When finding a clickable Badge, refactor to `<Badge asChild><button type="button" ... /></Badge>`.

## 2026-02-23 - Color Picker Accessibility
**Learning:** Color pickers using only hex codes in `aria-label` (e.g., "Use #6B8E47") are meaningless to screen reader users. Always map colors to human-readable names.
**Action:** When creating color selection inputs, ensure a `COLOR_LABELS` map exists to provide semantic names like "Olive Green" instead of raw hex values.
