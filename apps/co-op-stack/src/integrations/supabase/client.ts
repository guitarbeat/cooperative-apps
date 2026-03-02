// Supabase client configuration
import {
  createSupabaseConnectionManager,
  type ConnectionState,
  type ExecuteOptions as SupabaseRequestOptions,
  isSupabaseConnectionError,
  SupabaseOfflineError,
  SupabaseTimeoutError,
} from "./connection-manager";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error("Missing Supabase configuration");
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

const connectionManager = createSupabaseConnectionManager({
  url: SUPABASE_URL,
  key: SUPABASE_PUBLISHABLE_KEY,
  options: {
    auth: {
      storage: typeof window === "undefined" ? undefined : localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl:
        typeof window !== "undefined" && !("Capacitor" in window),
    },
  },
});

export const supabase = connectionManager.getClient();

export const executeSupabase = async <T>(
  operation: (client: typeof supabase) => PromiseLike<T>,
  options?: SupabaseRequestOptions,
): Promise<T> => connectionManager.execute(operation, options);

export const getSupabaseConnectionState = (): ConnectionState =>
  connectionManager.getState();

export const onSupabaseConnectionStateChange = (
  listener: (state: ConnectionState) => void,
): (() => void) => connectionManager.onStateChange(listener);

export const retrySupabaseConnection = (): Promise<boolean> =>
  connectionManager.retryConnection();

export const getSupabaseConnectionError = (): Error | undefined =>
  connectionManager.getLastError();

export type { ConnectionState, SupabaseRequestOptions };
export { isSupabaseConnectionError, SupabaseOfflineError, SupabaseTimeoutError };
