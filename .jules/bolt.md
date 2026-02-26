# BOLT'S JOURNAL - CRITICAL LEARNINGS ONLY

## 2024-05-22 - Drag Performance Lag
**Learning:** Combining CSS `transition-all` with high-frequency JavaScript position updates (e.g., `requestAnimationFrame`) causes significant visual lag ("rubber-banding") because the browser interpolates between the frame updates.
**Action:** Always disable CSS transitions on position/transform properties during active drag operations. Conditionally apply transitions only when the drag ends to smooth out the final state.
