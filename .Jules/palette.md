# Palette's Journal

## 2026-02-20 - Interactive Badges and A11y
**Learning:** Interactive Badges (using `onClick`) default to non-semantic spans, breaking keyboard accessibility. They must wrap a native `<button>` using the `asChild` prop to ensure focusability and proper role support.
**Action:** When finding a clickable Badge, refactor to `<Badge asChild><button type="button" ... /></Badge>`.

## 2026-02-20 - Hex Codes as A11y Labels
**Learning:** Using raw hex codes (e.g., "#6B8E47") for `aria-label` provides a poor screen reader experience as it reads out characters.
**Action:** Map color codes to human-readable names (e.g., `COLOR_LABELS` object) and use them in `aria-label` and `title` attributes.
