import { render, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import EmojiGridMapper from './EmojiGridMapper';

// Mock ResizeObserver
// eslint-disable-next-line no-undef
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('EmojiGridMapper Performance', () => {
  let requestAnimationFrameSpy;

  beforeEach(() => {
    // Mock requestAnimationFrame to execute synchronously
    requestAnimationFrameSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb();
      return 1;
    });
  });

  afterEach(() => {
    requestAnimationFrameSpy.mockRestore();
  });

  it('should optimize performance by only updating parent state on drag end', () => {
    const onChartPositionChange = vi.fn();
    const { getByRole } = render(
      <EmojiGridMapper onChartPositionChange={onChartPositionChange} />
    );

    // Initial render might trigger onChartPositionChange due to initial placement logic
    onChartPositionChange.mockClear();

    // Click to place emoji
    const startButton = getByRole('button', { name: /Start by placing emoji/i });
    fireEvent.click(startButton);

    // This should trigger one update
    expect(onChartPositionChange).toHaveBeenCalled();
    onChartPositionChange.mockClear();

    // Find the draggable emoji
    const emoji = getByRole('button', { name: /Drag to express emotion/i });

    // Start drag
    fireEvent.mouseDown(emoji, { clientX: 250, clientY: 250 });
    // mouseDown calls handleStart but we deferred the update to handleEnd
    expect(onChartPositionChange).not.toHaveBeenCalled();

    // Move multiple times
    fireEvent.mouseMove(document, { clientX: 260, clientY: 260 });
    fireEvent.mouseMove(document, { clientX: 270, clientY: 270 });
    fireEvent.mouseMove(document, { clientX: 280, clientY: 280 });

    // Should NOT call onChartPositionChange during move to prevent excessive re-renders
    expect(onChartPositionChange).not.toHaveBeenCalled();

    // End drag
    fireEvent.mouseUp(document);

    // Should call onChartPositionChange exactly once at the end with the final position
    expect(onChartPositionChange).toHaveBeenCalledTimes(1);

    // Verify the called value is reasonable (not checking exact math here, just that it was called)
    expect(onChartPositionChange).toHaveBeenCalledWith(expect.objectContaining({
      x: expect.any(Number),
      y: expect.any(Number),
      valence: expect.any(Number),
      arousal: expect.any(Number)
    }));
  });

  it('should use hardware-accelerated transforms for positioning', () => {
    const { getByRole, getAllByRole } = render(<EmojiGridMapper />);

    // Click to place emoji
    const startButton = getByRole('button', { name: /Start by placing emoji/i });
    fireEvent.click(startButton);

    // Find the draggable emoji - there might be duplicates because of shadow DOM or overlays
    // We want the one that is actually interactive and has the specific aria label
    const emojis = getAllByRole('button', { name: /Drag to express emotion/i });
    const emoji = emojis[0];

    // Verify it uses transform for positioning instead of left/top
    // This optimization prevents layout thrashing

    // The exact transform string depends on the initial position and browser implementation
    // But we check that it contains translate3d which triggers GPU acceleration
    // and that left/top are 0 or not determining position

    // Note: jsdom might not fully compute styles, but we can check the inline style attribute
    const inlineStyle = emoji.getAttribute('style');

    expect(inlineStyle).toContain('translate3d');
    expect(inlineStyle).toContain('left: 0');
    expect(inlineStyle).toContain('top: 0');
  });
});
