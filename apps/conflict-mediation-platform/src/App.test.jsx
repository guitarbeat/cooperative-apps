import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("./assets/logo.png", () => ({ default: "/logo.png" }));

const mockToast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: mockToast,
}));

vi.mock("./components/ui/sonner", () => ({
  Toaster: () => null,
}));

vi.mock("@vercel/analytics/react", () => ({
  Analytics: () => null,
}));

import App from "./App.jsx";

describe("App", () => {
  beforeEach(() => {
    mockToast.success.mockReset();
    mockToast.error.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the app heading", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: /Co-op Conflict Resolution Platform/i })
    ).toBeInTheDocument();
  });

  it("shows the resume banner when saved data exists", async () => {
    const savedFormData = {
      partyAName: "Alice",
      partyBName: "Bob",
    };

    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })
    );

    vi.spyOn(Storage.prototype, "getItem").mockReturnValue(
      JSON.stringify(savedFormData)
    );

    render(<App />);

    expect(
      await screen.findByText(
        /Resumed a previously saved session from this device\./i
      )
    ).toBeInTheDocument();

    const resetButtons = screen.getAllByRole("button", { name: /reset/i });
    expect(resetButtons.length).toBeGreaterThan(0);
    const resetButton = resetButtons[0];
    expect(resetButton).toBeVisible();
    expect(resetButton).toBeEnabled();
  });

  it("resets the saved session when clicking the resume banner reset button", async () => {
    const savedFormData = {
      partyAName: "Alice",
      partyBName: "Bob",
    };

    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })
    );

    vi.spyOn(Storage.prototype, "getItem").mockReturnValue(
      JSON.stringify(savedFormData)
    );

    const removeItemSpy = vi
      .spyOn(Storage.prototype, "removeItem")
      .mockImplementation(() => {});

    render(<App />);

    const resetButtons = screen.getAllByRole("button", { name: /reset/i });
    expect(resetButtons.length).toBeGreaterThan(0);
    const resetButton = resetButtons[0];
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(removeItemSpy).toHaveBeenCalledWith("mediation_form_v1");
      expect(mockToast.success).toHaveBeenCalledWith(
        "Form data reset successfully"
      );
    });
  });

  it("blocks navigation when required fields are missing", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })
    );

    vi.spyOn(Storage.prototype, "getItem").mockReturnValue(null);

    render(<App />);

    expect(screen.getAllByText(/Personalize each party/i).length).toBeGreaterThan(
      0
    );

    const nextButtons = screen.getAllByRole("button", { name: /next step/i });
    expect(nextButtons.length).toBeGreaterThan(0);
    const nextButton = nextButtons[0];
    fireEvent.click(nextButton);

    expect(mockToast.error).toHaveBeenCalledWith(
      "Complete the required fields before continuing: Party A Name, Party B Name, Conflict Description"
    );
    expect(screen.getAllByText(/Personalize each party/i).length).toBeGreaterThan(
      0
    );
  });
});
