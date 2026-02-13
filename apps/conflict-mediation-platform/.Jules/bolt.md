## 2024-05-22 - RAF Stacking in Hooks
**Learning:** Using `requestAnimationFrame` directly inside a high-frequency event handler (like `mousemove`) without cancelling the previous frame causes callback stacking. This defeats the purpose of throttling and can lead to redundant calculations per frame.
**Action:** Always store the `requestID` in a `ref` and call `cancelAnimationFrame` before scheduling a new frame in drag/scroll handlers.
