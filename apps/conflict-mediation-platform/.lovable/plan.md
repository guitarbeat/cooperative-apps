

# Creative Party Personalization Redesign

## Overview
Transform the current "Personalize each party" section from a utilitarian form layout into an engaging, interactive experience with avatar/emoji selection, a visual "versus" layout, and animated personality reveals.

## What Changes

### 1. Avatar/Emoji Selector for Each Party
Add an optional avatar picker where each party can choose an emoji or icon to represent themselves (e.g., animal, symbol, or mood). This avatar appears throughout the mediation journey next to their name, making the experience feel more personal and less clinical.

### 2. "Versus" Card Layout with Central Divider
Replace the current side-by-side grid with a "versus" style layout featuring:
- Party A card on the left with their accent color gradient
- An animated "VS" or handshake divider in the center
- Party B card on the right with their accent color gradient
- On mobile, cards stack vertically with the divider between them

### 3. Live Identity Badge Preview
Instead of the separate `PartyAccentPreviewCard` at the bottom, embed a compact live-preview "identity badge" directly inside each party's card showing their chosen emoji, name, and color -- exactly as it will appear in later steps.

### 4. Interactive Color Selection Upgrade
Replace the plain color circles with a more engaging selection:
- Slightly larger swatches with a subtle bounce animation on hover
- A "randomize" button (dice icon) that picks a fun random color for the party
- The selected color radiates a soft glow behind the party card

### 5. Welcome/Onboarding Micro-copy
Replace the current `Sparkles` info box with a friendlier, more conversational tone and a small animated handshake or wave icon.

---

## Technical Details

### New Component: `PartySetupCard` (extracted from StepContent)
Extract the party card markup into its own component for clarity. It will accept:
- `partyKey`, `displayName`, `fallbackName`
- `color`, `onColorChange`, `onNameChange`
- `selectedEmoji`, `onEmojiChange`
- `error`, field props

### New Component: `AvatarEmojiPicker`
A small grid of ~20 curated emojis (people, animals, symbols) rendered as clickable buttons. Selecting one stores it in formData as `partyAEmoji` / `partyBEmoji`.

### Changes to `StepContent.jsx` (Step 1 case)
- Replace the current `partyCards.map(...)` block with the new versus layout
- Add emoji state fields to formData
- Remove the separate `PartyAccentPreviewCard` section and embed preview inline
- Add framer-motion animations for card entrance and color transitions

### Changes to `src/hooks/useFormData.js`
- Add `partyAEmoji` and `partyBEmoji` to the initial form data state (default: empty string)

### Changes to `src/App.css`
- Add styles for the versus divider, glow effects, and avatar picker grid
- Add hover/focus animations for color swatches

### Changes to `GuidanceAlert.jsx`
- Display the chosen emoji next to party names when showing individual reflection guidance (steps 2-3)

### Files to Create
- `src/components/AvatarEmojiPicker.jsx` -- emoji selection grid
- `src/components/PartySetupCard.jsx` -- extracted party card with new layout

### Files to Modify
- `src/components/StepContent.jsx` -- new versus layout for step 1
- `src/hooks/useFormData.js` -- add emoji fields
- `src/App.css` -- new animation and layout styles
- `src/components/GuidanceAlert.jsx` -- show emoji in guidance alerts

### No Breaking Changes
- All existing formData fields remain intact
- Color picker logic and validation unchanged
- localStorage persistence works automatically for new fields

