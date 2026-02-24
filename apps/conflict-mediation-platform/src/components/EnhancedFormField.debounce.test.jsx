import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
import EnhancedFormField from "./EnhancedFormField";

afterEach(() => {
  cleanup();
});

describe("EnhancedFormField Debounce Performance", () => {
  it("keeps validation state active when rapid typing occurs", async () => {
    vi.useFakeTimers();
    const handleChange = vi.fn();
    const { container } = render(
      <EnhancedFormField
        id="debounce-perf-test"
        label="Debounce"
        value=""
        type="email"
        onChange={handleChange}
      />
    );

    const input = screen.getByLabelText("Debounce");

    // T=0: User types 'a'. Timeout set for T=300.
    fireEvent.change(input, { target: { value: "a" } });

    // T=200: User types 'ab'.
    await act(async () => {
        vi.advanceTimersByTime(200);
    });
    fireEvent.change(input, { target: { value: "ab" } });

    // Advance to T=350 (absolute time).
    // T1 should finish at T=300.
    await act(async () => {
        vi.advanceTimersByTime(150);
    });

    const spinner = container.querySelector('.animate-spin');

    // In optimized code: T1 cleared, T2 pending. isValidating=true. Spinner should be THERE.
    expect(spinner).toBeInTheDocument();

    // Advance to T=550 to be safe
    await act(async () => {
        vi.advanceTimersByTime(200);
    });

    // Now validation should be done
    expect(container.querySelector('.animate-spin')).not.toBeInTheDocument();

    vi.useRealTimers();
  });
});
