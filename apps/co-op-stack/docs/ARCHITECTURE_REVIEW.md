# Frontend Architecture Scalability Review

## Component Hierarchy & Hotspots

### Meeting flow (largest surface area)
- **Primary composition root:** `src/pages/MeetingRoom.tsx` orchestrates auth, meeting state, realtime subscriptions, queue actions, and conditional UI branches. This makes it the largest and most complex page with multiple responsibilities in a single file.【F:src/pages/MeetingRoom.tsx†L1-L1200】
- **Meeting UI cluster:** `src/components/MeetingRoom/*` contain host/queue/analytics/keyboard/modal components, but the page imports each directly, keeping the orchestration logic centralized in the page rather than a feature boundary.【F:src/pages/MeetingRoom.tsx†L1-L40】

### Dashboard & Home flows
- **Dashboard:** `src/pages/FacilitatorDashboard.tsx` includes data fetching, mutation handlers, modal control, and UI rendering in one file, making it a large multi-responsibility module.【F:src/pages/FacilitatorDashboard.tsx†L1-L430】
- **Home:** `src/pages/HomePage.tsx` mixes form validation, meeting creation/join logic, auth, and UI, which ties business logic to rendering in a single component.【F:src/pages/HomePage.tsx†L1-L420】

## Bottlenecks & Coupling

### God components (large, multi-responsibility files)
- `src/pages/MeetingRoom.tsx` (~1100 lines) manages routing, meeting lifecycle, realtime subscriptions, data shaping, and UI composition in one file.【F:src/pages/MeetingRoom.tsx†L1-L1200】
- `src/pages/FacilitatorDashboard.tsx` handles CRUD, dialogs, alerts, list rendering, and state transitions in a single module.【F:src/pages/FacilitatorDashboard.tsx†L1-L430】
- `src/pages/HomePage.tsx` combines validation, auth, meeting service calls, and UI rendering, suggesting an overgrown page layer.【F:src/pages/HomePage.tsx†L1-L420】
- `src/components/MeetingRoom/HostSettingsPanel.tsx` mixes QR generation, clipboard utilities, editing flow, participant actions, and UI in a single component.【F:src/components/MeetingRoom/HostSettingsPanel.tsx†L1-L360】

### Business logic coupled with UI
- Meeting service calls are invoked directly inside page components (`HomePage`, `MeetingRoom`, `FacilitatorDashboard`) rather than in feature hooks/services, which makes testing and reuse harder.【F:src/pages/HomePage.tsx†L140-L260】【F:src/pages/MeetingRoom.tsx†L140-L520】【F:src/pages/FacilitatorDashboard.tsx†L70-L210】
- `HostSettingsPanel` contains QR generation, clipboard operations, and meeting code lifecycle logic intertwined with the UI layer.【F:src/components/MeetingRoom/HostSettingsPanel.tsx†L70-L240】
- `useMeetingActions` already encapsulates some meeting behaviors, but the page still re-implements similar handlers, indicating unclear ownership of actions vs. UI composition.【F:src/hooks/useMeetingActions.tsx†L31-L240】【F:src/pages/MeetingRoom.tsx†L140-L520】

### Circular dependency risks (barrel files)
- `src/hooks/index.ts` re-exports hooks. If any hook starts importing from the hook barrel, it will create a hook → barrel → hook cycle.【F:src/hooks/index.ts†L1-L15】
- `src/components/MeetingRoom/index.ts` re-exports meeting components. If a meeting component imports from this barrel, it risks component → barrel → component cycles.【F:src/components/MeetingRoom/index.ts†L1-L9】
- `src/services/index.ts` re-exports meeting service adapters. If a service module imports from the barrel, it risks adapter → barrel → adapter cycles.【F:src/services/index.ts†L1-L24】

## Proposed Scalable Architecture

### Recommended strategy: Feature-based (Domain-driven) organization
A feature-based layout provides clear ownership, promotes colocation, and reduces cross-cutting imports.

```
src/
  app/                      # App shell, router, providers
  features/
    meeting-room/
      components/
      hooks/
      services/
      utils/
      index.ts              # Public API for meeting-room
    dashboard/
      components/
      hooks/
      services/
      utils/
      index.ts
    home/
      components/
      hooks/
      services/
      utils/
      index.ts
  shared/
    ui/                     # Design system and shared UI primitives
    hooks/                  # Truly generic hooks
    utils/                  # General utilities
  services/                 # Infrastructure adapters (supabase, p2p)
```

### Boundaries and ownership
- **Shared/UI Library** (`shared/ui`): purely presentational, domain-agnostic components (buttons, dialogs, cards, inputs, toasts). These should not import feature code. Example: current `src/components/ui/*` map cleanly to this layer.【F:src/components/ui/button.tsx†L1-L10】【F:src/components/ui/card.tsx†L1-L20】
- **Feature/Page components**: meeting-specific UI and logic should live under `features/meeting-room` and contain all meeting domain knowledge (queue, speaker, host settings). Current `src/components/MeetingRoom/*` are good candidates to move here.【F:src/components/MeetingRoom/MeetingHeader.tsx†L1-L60】【F:src/components/MeetingRoom/SpeakingQueue.tsx†L1-L40】
- **Feature hooks/services**: domain-specific operations (meeting lifecycle, queue updates, participant updates) belong in feature hooks/services (`features/meeting-room/hooks`), not global hooks or page files. Current hooks like `useMeetingActions` and `useMeetingState` should be colocated here.【F:src/hooks/useMeetingActions.tsx†L1-L240】【F:src/hooks/useMeetingState.ts†L1-L100】

## Refactor Plan (Non-breaking Migration)

### Phase 0: Baseline inventory (no code moves yet)
1. **Create a move map** that lists each file, its target location, and the importing modules to update. Use it as the single source of truth during the migration. (See mapping table below.)
2. **Agree on feature ownership** (Meeting Room, Home, Dashboard) and define what stays in `shared/` vs. feature folders.
3. **Define guardrails**:
   - No new feature work merges that increase page size beyond current baselines.
   - New meeting-specific logic must live in feature hooks (not in `src/pages`).
4. **Add basic tooling checks** (optional but recommended):
   - ESLint rule or simple `rg`-based check in CI to disallow internal barrel imports (e.g., `features/meeting-room` importing from `features/meeting-room/index.ts`).
   - A lightweight lint rule to flag direct `SupabaseMeetingService` usage outside feature services.

### Phase 1: Meeting Room feature extraction (highest ROI, biggest file)
1. **Create feature scaffolding:** `src/features/meeting-room/{components,hooks,services,utils}`.
2. **Move leaf components first** (no internal imports) to reduce breakage risk:
   - `MeetingHeader`, `NowSpeaking`, `SpeakerTimer`, `QueuePositionFeedback`, `ActionsPanel`, `MobileActionBar`, `ErrorState`, `CodeInputForm` → `features/meeting-room/components`.
3. **Move meeting hooks** next:
   - `useMeetingActions`, `useMeetingState`, `useMeetingRealtime`, `useMeetingCleanup`, `useSpeakingHistory`, `useSpeakerTimer`, `useDragAndDrop`, `useKeyboardShortcuts` → `features/meeting-room/hooks`.
4. **Split `MeetingRoom.tsx`** into a `MeetingRoomContainer` and `MeetingRoomView`:
   - `MeetingRoomContainer`: data loading, subscriptions, handlers, routing.
   - `MeetingRoomView`: render-only; receives props for UI state and callbacks.
5. **Create a feature entry point** (`features/meeting-room/index.ts`) that exports only the container and page-level components to the outside world.
6. **Introduce feature service facades**:
   - Create `features/meeting-room/services/meetingService.ts` (or similar) that wraps `SupabaseMeetingService` calls used by meeting flows.
   - Update hooks/container to use this facade instead of direct adapter imports.

### Phase 2: Home + Dashboard feature extraction
1. **Home feature**: extract `useHomeFlow` for validation, auth, and meeting creation/join. Move presentation cards into `features/home/components` for reuse.
2. **Dashboard feature**: extract `useDashboardMeetings` and split UI into smaller components (`MeetingList`, `MeetingCard`, `CreateMeetingForm`, `EmptyDashboard`).
3. **Slim page files** under `src/pages` to composition-only imports from `features/*`.
4. **Standardize feature APIs**:
   - Each feature exposes a single `index.ts` with named exports for its containers and public hooks.
   - Keep `src/pages/*` as thin shells that only render feature containers.

### Phase 3: Shared + infra consolidation
1. Move general utilities and UI primitives into `shared/` where appropriate.
2. Keep Supabase + P2P adapters under `src/services` as infrastructure, while feature-layer services wrap or compose them.
3. Normalize shared hooks/utilities to prevent feature leakage (e.g., no meeting-specific types or services inside `shared/`).

### File mapping (initial move plan)
| Current path | Target path | Notes |
| --- | --- | --- |
| `src/pages/MeetingRoom.tsx` | `src/features/meeting-room/MeetingRoomContainer.tsx` + `MeetingRoomView.tsx` | Split container/view responsibilities.【F:src/pages/MeetingRoom.tsx†L1-L1200】 |
| `src/components/MeetingRoom/*` | `src/features/meeting-room/components/*` | Meeting domain UI components.【F:src/components/MeetingRoom/MeetingHeader.tsx†L1-L60】 |
| `src/hooks/useMeetingActions.tsx` | `src/features/meeting-room/hooks/useMeetingActions.tsx` | Meeting-specific actions hook.【F:src/hooks/useMeetingActions.tsx†L1-L240】 |
| `src/hooks/useMeetingState.ts` | `src/features/meeting-room/hooks/useMeetingState.ts` | Meeting-specific state hook.【F:src/hooks/useMeetingState.ts†L1-L100】 |
| `src/pages/HomePage.tsx` | `src/features/home/HomePageContainer.tsx` + `HomePageView.tsx` | Split UI vs. logic for join/watch/create.【F:src/pages/HomePage.tsx†L1-L420】 |
| `src/pages/FacilitatorDashboard.tsx` | `src/features/dashboard/FacilitatorDashboardContainer.tsx` + `FacilitatorDashboardView.tsx` | Split UI vs. CRUD logic.【F:src/pages/FacilitatorDashboard.tsx†L1-L430】 |

### Import migration rules (to prevent breakage)
1. **Move files first**, update imports immediately, and keep `git status` clean at each sub-step.
2. **No internal barrel imports**: use direct relative or absolute paths inside a feature.
3. **Use the feature barrel only in `src/pages/*`** and app-level composition roots.
4. **Add a single source of truth for aliases** (e.g., `@/features/...`) and avoid deep `../../` path chains after moves.
5. **Keep refactors incremental**: one feature move per PR, with tests passing between steps.

### Exit criteria for each phase
- **Phase 1** completes when `MeetingRoom.tsx` is < 300 lines and no longer imports service adapters directly.
- **Phase 2** completes when Home/Dashboard pages become thin shells (primarily props and composition).
- **Phase 3** completes when shared utilities are centralized and no feature imports from another feature’s internal files.
 - **All phases** complete when the dependency graph has no barrel-induced cycles (validated by `madge` or an equivalent graph tool).

### Suggested PR sequence (to reduce risk)
1. **PR 1:** Add feature folders + move leaf components + update imports.
2. **PR 2:** Move hooks + introduce meeting service facade.
3. **PR 3:** Split `MeetingRoom` into container/view.
4. **PR 4:** Extract Home feature (hook + components).
5. **PR 5:** Extract Dashboard feature (hook + components).
6. **PR 6:** Consolidate shared utilities + cleanup deprecated imports.

## Handling `index.ts` Barrels to Prevent Circular Dependencies

### Principles
1. **Public API only:** Use barrels as public API entry points for features, not for internal imports.
2. **No internal barrel imports:** Within a feature, always import via relative paths rather than the feature barrel.
3. **Leaf module exports:** Export only leaf components from barrels; avoid re-exporting internal utilities that re-import from the barrel.

### Migration steps (safe barrel handling)
1. **During moves:** update all imports to point directly to the new file paths (avoid barrels initially).
2. **After stabilization:** add a feature-level barrel for external consumers (e.g., `features/meeting-room/index.ts`).
3. **Enforce rules:** lint or codemod to prevent internal imports from the feature barrel.

### Current barrels to treat carefully
- `src/hooks/index.ts` (hooks barrel).【F:src/hooks/index.ts†L1-L15】
- `src/components/MeetingRoom/index.ts` (meeting-room components barrel).【F:src/components/MeetingRoom/index.ts†L1-L9】
- `src/services/index.ts` (service adapter barrel).【F:src/services/index.ts†L1-L24】
