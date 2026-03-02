# DRY Refactoring Opportunities

## Summary
- Meeting interactions are implemented in both the `MeetingRoom` page and the `useMeetingActions` hook, leading to duplicate handlers and toast flows.
- Toast notifications across pages repeat the same success and error wiring, suggesting an opportunity for reusable helpers or typed variants.
- The homepage role overview is hand-coded three times with only styling differences, and can be generated from data like the existing action card constants.

## 1. Unify Meeting Action Handlers
Both `MeetingRoom.tsx` and `useMeetingActions.ts` implement the same Supabase operations (next speaker, undo, queue updates, participant CRUD) along with nearly identical toast messages.【F:src/pages/MeetingRoom.tsx†L158-L369】【F:src/hooks/useMeetingActions.ts†L65-L315】

**Refactor idea**
- Expand the `useMeetingActions` hook so it exposes every handler already declared on the page (leave queue, update participant name, etc.), and make `MeetingRoom` consume those callbacks instead of re-declaring them.
- Move any state sync that still needs to live in the page into callbacks that the hook accepts (e.g., setters from `useMeetingState`).

**Benefits**
- Single source of truth for side effects and Supabase calls.
- Shared toast wording and logging.
- Makes it easier to test or stub meeting actions in isolation.

## 2. Standardize Toast Usage
Toast payloads repeat a `{ type, title, message }` object for common cases like success/error responses on sign-out, queue operations, and room deletion.【F:src/pages/HomePage.tsx†L11-L24】【F:src/pages/MeetingRoom.tsx†L202-L367】【F:src/components/RoomBrowser.tsx†L77-L109】

**Refactor idea**
- Introduce a small helper such as `notifySuccess('leftQueue')`/`notifyError('leftQueue')` that maps semantic events to consistent titles, body copy, and variants.
- Alternatively, extend `useToast` with typed helpers (`toast.success({ title, description })`) so components only pass minimal data.

**Benefits**
- Consistent copy across the app and easier localization.
- Future adjustments (duration, variant) require a single change.

## 3. Data-Drive the Homepage Role Overview
The homepage builds three near-identical “mode chips” for host/join/watch with only class names and icons varying, even though the action cards already loop through a `MEETING_MODES` constant for similar content.【F:src/pages/HomePage.tsx†L53-L82】

**Refactor idea**
- Extract the chip metadata (label, subtitle, icon, styling tokens) into a shared array or reuse the data that powers `ActionCards`.
- Render the chips with `map()` just like the cards, or create a small reusable component.

**Benefits**
- Ensures any copy or design updates for a role propagate everywhere.
- Reduces manual Tailwind class repetition and the risk of the chips drifting out of sync with the cards.
