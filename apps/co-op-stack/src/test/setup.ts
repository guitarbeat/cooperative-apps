import React from "react";
import "@testing-library/jest-dom";
import { afterEach, expect, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// Re-export testing-library utilities as globals
export { screen, fireEvent, waitFor } from "@testing-library/react";

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

(globalThis as typeof globalThis & { React: typeof React }).React = React;

if (typeof window !== "undefined") {
  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi
        .fn()
        .mockImplementation((query: string): MediaQueryList => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
    });
  }

  Object.defineProperty(window, "location", {
    writable: true,
    configurable: true,
    value: {
      href: "http://localhost:3000",
      origin: "http://localhost:3000",
      pathname: "/",
      search: "",
      hash: "",
      reload: vi.fn(),
    } as unknown as Location,
  });
}

class MockIntersectionObserver implements IntersectionObserver {
  constructor(
    _callback: IntersectionObserverCallback,
    _options?: IntersectionObserverInit,
  ) {}

  readonly root: Element | null = null;
  readonly scrollMargin = "";
  readonly rootMargin = "";
  readonly thresholds: ReadonlyArray<number> = [];

  disconnect() {}
  observe(_target: Element): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  unobserve(_target: Element): void {}
}

globalThis.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

class MockResizeObserver implements ResizeObserver {
  constructor(_callback: ResizeObserverCallback) {}
  disconnect(): void {}
  observe(_target: Element, _options?: ResizeObserverOptions): void {}
  unobserve(_target: Element): void {}
}

globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
