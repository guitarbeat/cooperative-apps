## 2024-05-23 - [Form Accessibility & Feedback]
**Learning:** Users often abandon forms that lack clear labels or feedback. Adding explicit `<label>` elements linked via `htmlFor` and providing immediate visual feedback (loading states, success messages) significantly improves the experience. In this environment, `react-scripts` v5 is incompatible with Tailwind CSS v4, requiring v3.
**Action:** Always ensure forms have `htmlFor` labels, `aria-required` (or `required`) attributes, and handle `isSubmitting` states visually.

## 2026-01-13 - [Empty State Engagement]
**Learning:** Gray placeholder boxes create dead ends and user confusion. Replacing them with "Coming Soon" empty states that include icons, descriptive text, and (even disabled) calls-to-action significantly improves perceived value and keeps users engaged.
**Action:** Replace all "TODO" or placeholder divs with designed Empty State components that explain *why* content is missing and *when* it might appear.

## 2026-01-14 - [Actionable Contact Information]
**Learning:** Plain text email addresses are passive and require user effort (copy-paste). Converting them into styled `<Button asChild>` components with `mailto:` links and descriptive `aria-label`s makes the primary interaction obvious and accessible.
**Action:** Always wrap contact methods in interactive elements with clear visual affordances (icons) and accessible names.

## 2026-01-22 - [Search Input Clear Actions]
**Learning:** Users typing in search fields expect a quick way to clear the input without backspacing. A 'Clear' button that appears dynamically and refocuses the input is a standard pattern that significantly reduces friction.
**Action:** Enhance all search inputs with a wrapper containing a search icon (for affordance) and a conditional clear button that resets state and focus.

## 2026-01-23 - [Consistent Button Loading States]
**Learning:** Manually implementing loading spinners in buttons leads to inconsistent UI and code duplication. Integrating a `loading` prop directly into the shared `Button` component ensures uniform feedback (spinner + disabled state) and simplifies consumption. Note: Radix UI `Slot` (used for `asChild`) requires careful handling of children when injecting elements like spinners.
**Action:** Use the enhanced `Button` component with `loading={isSubmitting}` for all async actions instead of manual spinner implementation.
