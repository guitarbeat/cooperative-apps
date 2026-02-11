# Bolt's Journal

## 2024-05-23 - Memoization of Dynamic Components
**Learning:** `StepContent` was memoized, but `renderStepContent` was an inline function in `App.jsx`, causing `CardStack` to receive a new `children` prop (or rather, the function prop `renderStepContent` was new) on every render.
**Action:** Use `useCallback` for functions passed as props, especially if they are used in `render` methods of children. In this case, `App.jsx` re-rendered on drag (due to `dragOffset` state), which caused `renderStepContent` to be recreated. `CardStack` then re-rendered. Although `StepContent` is memoized, `CardStack`'s other children logic runs.

## 2024-05-23 - React Element Creation
**Learning:** Even if `StepContent` is memoized, calling `renderStepContent(step)` inside `CardStack` creates a *new* React Element object. React then diffs this against the old one. If props are stable, `StepContent` (the component) doesn't re-render. BUT `CardStack` does re-render.
**Action:** The bottleneck is likely `CardStack` re-rendering on every drag frame.

## 2024-05-23 - Heavy Components and Inline Objects
**Learning:** `StepContent.jsx` creates `context` object inline: `const context = { partyAName: ... }`. This object is passed to `SmartSuggestions`. `SmartSuggestions` uses `useDebounce(currentValue)`.
If `StepContent` re-renders (e.g. while typing), `context` is recreated. `SmartSuggestions` props change. `SmartSuggestions` re-renders.
**Action:** Memoize `context` object in `StepContent`.

## 2024-05-23 - Testing Radix UI Tooltip in Vitest
**Learning:** `SmartSuggestions` uses `Tooltip` from `radix-ui`. When testing in JSDOM, simply rendering `<SmartSuggestions />` caused an infinite loop / OOM error ("Maximum update depth exceeded" inside `@radix-ui/react-compose-refs`). This is likely due to circular ref updates or missing DOM capabilities in JSDOM for Radix's layout calculations.
**Action:** When unit testing components using Radix primitives, carefully mock them. However, even with mocking, issues can persist if the component structure (e.g. `asChild`) is not mocked correctly to match Radix's expectations.
## 2024-05-23 - State Colocation for High-Frequency Updates
**Learning:** `App.jsx` was re-rendering on every drag frame because `dragOffset` state was lifted up to `App` via `useNavigation` hook, even though `dragOffset` was only used by `CardStack` (a leaf component). This caused unnecessary re-renders of the entire app tree (Header, NavButtons, etc.) on every pixel of movement.
**Action:** Extracted drag logic into `useCardSwipe` and colocated it within `CardStack`. `App` now only manages `currentStep` (low frequency), while `CardStack` manages `dragOffset` (high frequency). This isolates the re-render loop to the specific component that needs to animate.
