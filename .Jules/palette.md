## 2024-05-23 - Interactive Badges Accessibility
**Learning:** `Badge` components (typically `div` or `span`) are often used for interactive filters/tags but lack keyboard accessibility and semantic roles.
**Action:** Always wrap interactive badge content in a semantic `<button>` using the `asChild` prop (if supported) or replace with a styled button to ensure keyboard users can interact with them.
