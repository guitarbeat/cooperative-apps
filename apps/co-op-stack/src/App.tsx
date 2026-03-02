import { TooltipProvider } from "@/components/ui/tooltip";
import { UnifiedToastProvider } from "@/components/shared/UnifiedToastProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
// Analytics disabled in preview - enable for Vercel deployment
// import { Analytics } from "@vercel/analytics/react";
import NotFound from "./pages/NotFound";
import HomePage from "./pages/HomePage";
import AppLayout from "./components/layout/AppLayout";
import { SupabaseConnectionProvider } from "@/integrations/supabase/connection-context";
import { LoadingState } from "@/components/shared/LoadingState";

const MeetingRoom = lazy(() => import("./pages/MeetingRoom"));
const FacilitatorDashboard = lazy(() => import("./pages/FacilitatorDashboard"));
const Health = lazy(() => import("./pages/Health"));

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <UnifiedToastProvider>
          <SupabaseConnectionProvider>
            <AppLayout>
              <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><LoadingState size="lg" message="Loading..." /></div>}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/facilitator" element={<FacilitatorDashboard />} />
                  <Route path="/meeting" element={<MeetingRoom />} />
                  <Route path="/health" element={<Health />} />
                  <Route path="/watch/:code" element={<MeetingRoom />} />
                  {/* Redirects for removed routes */}
                  <Route path="/enter" element={<Navigate to="/" replace />} />
                  <Route path="/rooms" element={<Navigate to="/" replace />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </AppLayout>
          </SupabaseConnectionProvider>
          {/* Analytics removed - re-enable for Vercel */}
        </UnifiedToastProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
