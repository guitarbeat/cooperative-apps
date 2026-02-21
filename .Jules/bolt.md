## 2026-02-21 - Unstable Memoization in High-Frequency Updates
**Learning:** `useEmotionRecommendation` in `EmojiGridMapper.jsx` was recreating the `recommendations` object on every render, causing the list of recommended emotion badges to re-render ~30 times per frame during drag operations, even when the recommendations didn't change.
**Action:** Always move constant objects/data structures outside of React components/hooks or use `useMemo` with empty dependency array for truly static data to ensure referential stability, especially in components that update frequently (like drag handlers).
