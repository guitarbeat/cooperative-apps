# Palette's Journal

## 2026-02-20 - Interactive Badges and A11y
**Learning:** Interactive Badges (using `onClick`) default to non-semantic spans, breaking keyboard accessibility. They must wrap a native `<button>` using the `asChild` prop to ensure focusability and proper role support.
**Action:** When finding a clickable Badge, refactor to `<Badge asChild><button type="button" ... /></Badge>`.
