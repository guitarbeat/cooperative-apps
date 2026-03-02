import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

// Mock the QueryClient to avoid issues in tests
vi.mock("@tanstack/react-query", () => ({
  QueryClient: vi.fn(() => ({
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
    invalidateQueries: vi.fn(),
  })),
  QueryClientProvider: ({ children }: { children: ReactNode }) => children,
}));

// Mock the toast components
vi.mock("./components/ui/toaster", () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

vi.mock("./components/ui/sonner", () => ({
  Toaster: () => <div data-testid="sonner" />,
}));

// Mock the AppLayout component
vi.mock("./components/layout/AppLayout", () => ({
  default: ({ children }: { children: ReactNode }) => (
    <div data-testid="app-layout">{children}</div>
  ),
}));

vi.mock("@/integrations/supabase/connection-context", () => ({
  SupabaseConnectionProvider: ({ children }: { children: ReactNode }) => children,
}));

// Mock the pages
vi.mock("./pages/HomePage", () => ({
  default: () => <div data-testid="home-page">Home Page</div>,
}));

vi.mock("./pages/MeetingRoom", () => ({
  default: () => <div data-testid="meeting-room">Meeting Room</div>,
}));

vi.mock("./pages/FacilitatorDashboard", () => ({
  default: () => <div data-testid="facilitator-dashboard">Facilitator Dashboard</div>,
}));

vi.mock("./pages/Health", () => ({
  default: () => <div data-testid="health-page">Health Page</div>,
}));

vi.mock("./pages/NotFound", () => ({
  default: () => <div data-testid="not-found">Not Found</div>,
}));

const App = (await import("./App")).default;

const futureConfig = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;

const renderWithRouter = (
  initialEntries: string[] = ["/"],
  initialIndex = 0
) =>
  render(
    <MemoryRouter
      initialEntries={initialEntries}
      initialIndex={initialIndex}
      future={futureConfig}
    >
      <App />
    </MemoryRouter>
  );

describe("App", () => {
  const meetingRoutes = ["/meeting", "/watch/sample"] as const;

  it("renders without crashing", () => {
    renderWithRouter();

    expect(screen.getByTestId("app-layout")).toBeInTheDocument();
  });

  it("renders home page by default", () => {
    renderWithRouter();

    expect(screen.getByTestId("home-page")).toBeInTheDocument();
  });

  it.each(
    meetingRoutes.map((path, index) => ({ path, initialIndex: index }))
  )("renders meeting room for %s route", async ({ path, initialIndex }) => {
    const entries = [...meetingRoutes];
    expect(entries[initialIndex]).toBe(path);

    renderWithRouter(entries, initialIndex);

    expect(await screen.findByTestId("meeting-room")).toBeInTheDocument();
    expect(screen.queryByTestId("not-found")).not.toBeInTheDocument();
  });

  it("renders not found page for unmatched routes", () => {
    renderWithRouter(["/does-not-exist"]);

    expect(screen.getByTestId("not-found")).toBeInTheDocument();
  });
});
