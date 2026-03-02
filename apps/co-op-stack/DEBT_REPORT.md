# Technical Debt Audit Report

**Generated:** 2026-01-19  
**Scope:** Full repository scan  
**Tone:** Objective, clinical diagnosis only

---

## 1. The Orphanage (Unlinked Files)

Files that exist but are never imported or referenced by active application code.

### Homepage Legacy Components (Entire Folder Orphaned)

| File | Lines | Status |
|------|-------|--------|
| `src/components/features/homepage/HowItWorks.tsx` | 105 | Unused - legacy landing page section |
| `src/components/features/homepage/ActionCards.tsx` | 55 | Unused - legacy role-based links |
| `src/components/features/homepage/SectionCTA.tsx` | 29 | Unused - legacy CTA wrapper |
| `src/components/features/homepage/SectionHeader.tsx` | 54 | Only referenced by orphaned HowItWorks.tsx |
| `src/components/features/homepage/constants.ts` | 193 | Only consumed by orphaned homepage components |

### Orphaned Hooks

| File | Lines | Status |
|------|-------|--------|
| `src/hooks/use-tilt.ts` | 192 | Only consumer is orphaned HowItWorks.tsx |
| `src/hooks/usePhysicsInteraction.ts` | 132 | No active imports found |

### Duplicate/Redundant Utilities

| File | Lines | Status |
|------|-------|--------|
| `src/utils/meetingValidation.js` | 69 | Superseded by `schemas.ts` (Zod-based) |
| `src/utils/meetingValidation.d.ts` | N/A | Type declaration for orphaned JS file |
| `src/utils/version.ts` | 113 | Exports never displayed in UI |

### Orphaned Type Definitions

| File | Lines | Status |
|------|-------|--------|
| `src/types/index.ts` | 5 | Defines `Participant` but never imported |
| `src/types/meeting.ts` | 26 | Defines types shadowed by `services/supabase.ts` |
| `src/types/sound.d.ts` | 3 | Duplicates `src/utils/sound.d.ts` |
| `src/types/theme-provider.d.ts` | 14 | ThemeProvider declaration - may be redundant |
| `src/types/theme.d.ts` | N/A | Orphaned type file |

### Test Files in Source Tree

| File | Lines | Status |
|------|-------|--------|
| `src/App.test.tsx` | 97 | Test file mixed with source code |
| `src/utils/validation.test.ts` | 58 | Test file in utils folder |

### Config Artifacts

| File | Status |
|------|--------|
| `config/html/jscpd-report.json` | 2022 lines - stale duplicate detection report |
| `config/html/index.html` | Legacy HTML report viewer |
| `config/html/js/prism.js` | Syntax highlighter for unused report |
| `config/html/styles/*` | Styles for unused report |

---

## 2. The Graveyard (Commented-Out Code)

Files containing blocks of commented-out code (>5 lines threshold relaxed to show patterns).

| File | Line Range | Dead Code % | Description |
|------|------------|-------------|-------------|
| `src/utils/productionLogger.ts` | 137-142 | ~3% | Commented fetch() call to analytics endpoint |
| `src/pages/FacilitatorDashboard.tsx` | 223-226 | ~1% | Commented navigation redirect logic |
| `src/pages/MeetingRoom.tsx` | 168-170, 189-191 | ~1% | Multiple TODO comments with no action |

---

## 3. The Echo Chamber (Duplicate Logic)

Functions or logic blocks with ~90% similarity across different files.

### Near-Identical Type Definitions

| Pair A | Pair B | Overlap |
|--------|--------|---------|
| `src/types/index.ts::Participant` | `src/services/supabase.ts::Participant` | Same interface, different locations |
| `src/types/meeting.ts::MeetingData` | `src/services/supabase.ts::MeetingData` | Same interface, different locations |
| `src/types/meeting.ts::Participant` | `src/services/supabase.ts::Participant` | Same interface, third copy |
| `src/types/meeting.ts::SpeakingQueue` | `src/services/supabase.ts::SpeakingQueueEntry` | Near-identical queue item types |

### Duplicate Validation Logic

| Pair A | Pair B | Overlap |
|--------|--------|---------|
| `src/utils/meetingValidation.js::validateMeetingCode()` | `src/utils/schemas.ts::roomCodeSchema` | Same validation, JS vs Zod |
| `src/utils/meetingValidation.js::normalizeMeetingCode()` | `src/services/supabase.ts` (inline) | Uppercase/trim logic duplicated |
| `src/utils/validation.ts::validationRules.meetingCode()` | `src/utils/schemas.ts::roomCodeSchema` | Third implementation of same validation |

### Duplicate Type Declarations

| Pair A | Pair B | Overlap |
|--------|--------|---------|
| `src/utils/sound.d.ts` | `src/types/sound.d.ts` | Identical function signatures |

---

## 4. The "Mystery Meat" (Ambiguous Naming)

Variables or file names that are non-descriptive.

### Non-Descriptive Variable Names

| Location | Name | Context |
|----------|------|---------|
| `src/services/supabase.ts` | `SpeakingQueueRow` | Internal type, unclear external purpose |
| `src/hooks/useMeetingState.ts` | `showJohnDoe` | Boolean controlling fake demo participant |
| `src/pages/MeetingRoom.tsx` | `_speakerTimer`, `_elapsedTime` | Underscore-prefixed unused destructured values |
| `src/components/InlineRoomBrowser.tsx` | `Room` | Generic name, same as concept in other files |

### Non-Descriptive File Names

| File | Issue |
|------|-------|
| `src/types/index.ts` | Barrel file with only 1 export |
| `src/hooks/index.ts` | Re-exports all hooks but naming suggests main entry |
| `config/html/index.html` | Purpose unclear without context |

### Ambiguous Function Parameters

| Location | Parameter | Issue |
|----------|-----------|-------|
| `src/utils/productionLogger.ts` | `data: ProductionLogData` | Generic "data" parameter |
| `src/services/supabase.ts` | `options?: SupabaseRequestOptions` | "options" is too generic |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Orphaned Files | 18+ files |
| Commented-Out Code Blocks | 4 files affected |
| Duplicate Logic Pairs | 7 pairs |
| Ambiguous Names | 10 instances |

---

*End of report. No remediation actions taken.*
