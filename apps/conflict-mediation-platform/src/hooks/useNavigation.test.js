import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useNavigation } from "./useNavigation";

describe("useNavigation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("prevents forward navigation when the guard blocks the next step", () => {
    const guard = vi.fn().mockReturnValue(false);
    const { result } = renderHook(() =>
      useNavigation({ totalSteps: 3, canNavigateToStep: guard })
    );

    act(() => {
      result.current.navigateToStep("next");
    });

    expect(guard).toHaveBeenCalledWith(
      expect.objectContaining({
        currentStep: 1,
        targetStep: 2,
        direction: "forward",
        type: "step",
      })
    );
    expect(result.current.currentStep).toBe(1);
    expect(result.current.isAnimating).toBe(false);
  });

  it("allows direct navigation to a step when permitted", () => {
    const guard = vi.fn().mockReturnValue(true);
    const { result } = renderHook(() =>
      useNavigation({ totalSteps: 4, canNavigateToStep: guard })
    );

    act(() => {
      result.current.navigateToStep(3);
    });

    expect(result.current.currentStep).toBe(3);
    expect(guard).toHaveBeenCalledWith(
      expect.objectContaining({
        currentStep: 1,
        targetStep: 3,
        direction: "forward",
        type: "direct",
      })
    );
  });

  it("completes animated transitions when the guard allows movement", () => {
    vi.useFakeTimers();
    const guard = vi.fn().mockReturnValue(true);
    const animationDuration = 250;
    const { result } = renderHook(() =>
      useNavigation({
        totalSteps: 3,
        canNavigateToStep: guard,
        animationDuration,
      })
    );

    act(() => {
      result.current.navigateToStep("next");
    });

    expect(result.current.isAnimating).toBe(true);

    act(() => {
      vi.advanceTimersByTime(animationDuration);
    });

    expect(result.current.currentStep).toBe(2);
    expect(result.current.isAnimating).toBe(false);
  });

  it("clamps the current step when the total step count decreases", () => {
    const { result, rerender } = renderHook(
      ({ steps }) => useNavigation({ totalSteps: steps }),
      {
        initialProps: { steps: 5 },
      }
    );

    act(() => {
      result.current.navigateToStep(4);
    });
    expect(result.current.currentStep).toBe(4);

    rerender({ steps: 2 });
    expect(result.current.currentStep).toBe(2);
  });
});
