

# Site Improvement Plan: Features, Design & Mobile

## Overview

Three improvement tracks to make the Speaking Queue app more engaging, polished, and mobile-friendly.

---

## Track 1: New Features

### 1A. Live Speaker Timer Display
Show a visible countdown/count-up timer when someone is speaking, visible to all participants and watchers.
- Add a prominent timer component in the meeting room header area
- Auto-start when "Next Speaker" is triggered
- Display elapsed time with color changes (green under 2min, yellow 2-3min, red 3min+)
- Optional configurable time limit set by the facilitator

### 1B. Hand-Raise Animation
Add a visual hand-raise animation when participants join the queue.
- Animated hand icon appears briefly when someone joins
- Subtle bounce-in animation using existing animation system
- Sound effect option (using existing `sound.ts` utility)

### 1C. Participant Avatars
Generate colorful letter avatars for each participant.
- Use initials with deterministic background colors based on name
- Show in the speaking queue list, participant list, and "now speaking" display
- Leverage the existing `@radix-ui/react-avatar` package already installed

### 1D. "Now Speaking" Spotlight
A prominent card showing who is currently speaking with their avatar, name, and timer.
- Large display suitable for projecting on a screen
- Smooth transition animation between speakers
- Works in both host and watch views

---

## Track 2: Visual Polish & Design

### 2A. Card Hover & Press Micro-interactions
Add tactile feedback to all interactive cards using the existing interaction system.
- Subtle scale + shadow lift on hover
- Press-down effect on click
- Applies to homepage cards, room browser items, and queue items

### 2B. Smooth Queue Transitions
Animate queue item additions, removals, and reorderings.
- Fade-in + slide-down for new queue entries
- Fade-out + slide-up for removed entries
- Smooth position swap animation for reordering

### 2C. Gradient Accents & Glass Effects
Enhance the visual hierarchy with subtle gradients.
- Add a soft gradient to the "Now Speaking" area
- Glass-morphism effect on the meeting header
- Subtle gradient borders on the active room cards

### 2D. Dark Mode Polish
Review and refine dark mode styling.
- Ensure all custom components use semantic tokens consistently
- Add subtle glow effects for active states in dark mode
- Improve contrast on secondary/muted text

---

## Track 3: Better Mobile Experience

### 3A. Bottom Action Bar
Replace scattered action buttons with a fixed bottom bar on mobile.
- "Join Queue" / "Leave Queue" as the primary bottom action
- Quick access to QR scanner and room code
- Collapses when keyboard is open

### 3B. Touch-Optimized Queue
Make the speaking queue easier to interact with on touch devices.
- Larger tap targets (minimum 44px)
- Swipe-to-leave-queue gesture
- Pull-to-refresh for manual sync

### 3C. Responsive Meeting Room Layout
Optimize the meeting room for narrow screens.
- Stack panels vertically on mobile instead of side-by-side
- Collapsible settings panel
- Full-width speaking queue with compact items

### 3D. PWA Install Support
Make the app installable as a home screen app (no app store needed).
- Add PWA manifest and service worker via `vite-plugin-pwa`
- Mobile-optimized meta tags and splash screens
- Offline fallback page

---

## Implementation Order

1. **Participant Avatars** -- small, high-impact visual improvement
2. **Now Speaking Spotlight** -- core feature improvement
3. **Live Speaker Timer Display** -- builds on spotlight
4. **Bottom Action Bar (mobile)** -- biggest mobile UX win
5. **Card Micro-interactions** -- quick visual polish
6. **Smooth Queue Transitions** -- animation polish
7. **Responsive Meeting Room** -- mobile layout fix
8. **Hand-Raise Animation** -- fun detail
9. **Dark Mode Polish** -- refinement pass
10. **PWA Install** -- installability

---

## Technical Details

### Files to create
- `src/components/MeetingRoom/NowSpeaking.tsx` -- spotlight component
- `src/components/MeetingRoom/SpeakerTimer.tsx` -- timer display
- `src/components/MeetingRoom/MobileActionBar.tsx` -- bottom bar
- `src/components/ui/participant-avatar.tsx` -- reusable avatar with color generation

### Files to modify
- `src/components/MeetingRoom/SpeakingQueue.tsx` -- add avatars, animations, touch gestures
- `src/components/MeetingRoom/MeetingHeader.tsx` -- add spotlight area
- `src/components/WatchView/DisplayLayout.tsx` -- add spotlight for watchers
- `src/pages/MeetingRoom.tsx` -- integrate new components, mobile layout
- `src/pages/HomePage.tsx` -- card micro-interactions
- `src/index.css` -- new animation keyframes, mobile utilities
- `tailwind.config.ts` -- additional animation definitions

### Key dependencies
- No new packages needed for tracks 1-2
- `vite-plugin-pwa` needed only for PWA support (track 3D)

