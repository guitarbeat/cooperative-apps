/**
 * Unified Meeting Service Factory
 * 
 * Provides a single entry point for getting a meeting service
 * that abstracts the underlying backend (Supabase or P2P).
 */

export type { 
  IMeetingService, 
  IMeetingRealtime, 
  IMeetingServiceWithRealtime,
  MeetingRealtimeCallbacks,
  MeetingBackendType,
} from "./meeting-service";

export { 
  createSupabaseMeetingService,
  createSupabaseMeetingServiceWithRealtime,
  supabaseMeetingService,
} from "./supabase-meeting-adapter";

// Re-export legacy service for backward compatibility
export { 
  SupabaseMeetingService, 
  SupabaseRealtimeService,
} from "./supabase";
