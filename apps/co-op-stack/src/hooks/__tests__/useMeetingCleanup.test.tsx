import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from "vitest";
import { render } from "@testing-library/react";
import type { FC } from "react";

import { useMeetingCleanup } from "../useMeetingCleanup";
import { SupabaseMeetingService } from "@/services/supabase";

vi.mock("@/services/supabase", () => ({
  SupabaseMeetingService: {
    leaveMeeting: vi.fn().mockResolvedValue(undefined)
  }
}));

vi.mock("@/utils/productionLogger", () => ({
  logProduction: vi.fn()
}));

describe("useMeetingCleanup", () => {
  const listeners = new Map<string, EventListenerOrEventListenerObject[]>();
  const addEventListenerSpy = vi.spyOn(window, "addEventListener");
  const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

  beforeEach(() => {
    listeners.clear();

    addEventListenerSpy.mockImplementation((type, listener) => {
      const handlers = listeners.get(type) ?? [];
      handlers.push(listener);
      listeners.set(type, handlers);
    });

    removeEventListenerSpy.mockImplementation((type, listener) => {
      const handlers = listeners.get(type);
      if (!handlers) return;
      const index = handlers.findIndex(handler => handler === listener);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    addEventListenerSpy.mockReset();
    removeEventListenerSpy.mockReset();
  });

  afterAll(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  const TestComponent: FC = () => {
    useMeetingCleanup({ currentParticipantId: "participant-123", mode: "join" });
    return null;
  };

  it("registers and cleans up window event listeners with stable references", () => {
    const { unmount } = render(<TestComponent />);

    expect(listeners.get("beforeunload")?.length).toBe(1);
    expect(listeners.get("unload")?.length).toBe(1);

    unmount();

    expect(listeners.get("beforeunload")?.length ?? 0).toBe(0);
    expect(listeners.get("unload")?.length ?? 0).toBe(0);

    expect(SupabaseMeetingService.leaveMeeting).toHaveBeenCalledTimes(1);
  });
});
