/**
 * Supabase Meeting Service Adapter
 * 
 * Wraps SupabaseMeetingService to conform to the IMeetingService interface.
 * This adapter allows the existing Supabase implementation to be used
 * interchangeably with other backends (e.g., P2P).
 */

import type {
  IMeetingService,
  IMeetingRealtime,
  IMeetingServiceWithRealtime,
  MeetingRealtimeCallbacks,
} from "./meeting-service";
import type {
  MeetingData,
  MeetingWithParticipants,
  Participant,
  ParticipantSnapshot,
  QueueItem,
} from "@/types/meeting";
import {
  SupabaseMeetingService,
  SupabaseRealtimeService,
} from "./supabase";

/**
 * Supabase implementation of IMeetingService
 * Delegates all calls to the existing SupabaseMeetingService static methods
 */
class SupabaseMeetingAdapter implements IMeetingService {
  async createMeeting(
    title: string,
    facilitatorName: string,
    facilitatorId?: string
  ): Promise<MeetingData> {
    return SupabaseMeetingService.createMeeting(title, facilitatorName, facilitatorId);
  }

  async getMeeting(code: string): Promise<MeetingWithParticipants | null> {
    return SupabaseMeetingService.getMeeting(code);
  }

  async endMeeting(meetingId: string): Promise<void> {
    return SupabaseMeetingService.endMeeting(meetingId);
  }

  async joinMeeting(
    meetingCode: string,
    participantName: string,
    isFacilitator?: boolean
  ): Promise<Participant> {
    return SupabaseMeetingService.joinMeeting(
      meetingCode,
      participantName,
      isFacilitator
    );
  }

  async leaveMeeting(participantId: string): Promise<void> {
    return SupabaseMeetingService.leaveMeeting(participantId);
  }

  async removeParticipant(participantId: string): Promise<ParticipantSnapshot> {
    return SupabaseMeetingService.removeParticipant(participantId);
  }

  async restoreParticipant(participantId: string): Promise<void> {
    return SupabaseMeetingService.restoreParticipant(participantId);
  }

  async updateParticipantName(
    participantId: string,
    newName: string
  ): Promise<void> {
    return SupabaseMeetingService.updateParticipantName(participantId, newName);
  }

  async updateMeetingTitle(meetingId: string, newTitle: string): Promise<void> {
    return SupabaseMeetingService.updateMeetingTitle(meetingId, newTitle);
  }

  async updateMeetingCode(meetingId: string, newCode: string): Promise<void> {
    return SupabaseMeetingService.updateMeetingCode(meetingId, newCode);
  }

  async canRejoinAsFacilitator(
    meetingCode: string,
    participantName: string
  ): Promise<boolean> {
    return SupabaseMeetingService.canRejoinAsFacilitator(
      meetingCode,
      participantName
    );
  }

  async joinQueue(
    meetingId: string,
    participantId: string,
    queueType?: string
  ): Promise<QueueItem> {
    return SupabaseMeetingService.joinQueue(meetingId, participantId, queueType);
  }

  async leaveQueue(meetingId: string, participantId: string): Promise<void> {
    return SupabaseMeetingService.leaveQueue(meetingId, participantId);
  }

  async nextSpeaker(meetingId: string): Promise<QueueItem | null> {
    return SupabaseMeetingService.nextSpeaker(meetingId);
  }

  async reorderQueueItem(
    meetingId: string,
    participantId: string,
    newPosition: number
  ): Promise<void> {
    return SupabaseMeetingService.reorderQueueItem(
      meetingId,
      participantId,
      newPosition
    );
  }
}

/**
 * Supabase implementation of IMeetingRealtime
 * Wraps SupabaseRealtimeService to conform to the interface
 */
class SupabaseRealtimeAdapter implements IMeetingRealtime {
  private meetingCode: string;

  constructor(meetingCode: string) {
    this.meetingCode = meetingCode;
  }

  subscribe(
    meetingId: string,
    callbacks: MeetingRealtimeCallbacks
  ): () => void {
    return SupabaseRealtimeService.subscribeToMeeting(
      meetingId,
      this.meetingCode,
      {
        onParticipantsUpdated: callbacks.onParticipantsUpdated,
        onQueueUpdated: callbacks.onQueueUpdated,
        onMeetingTitleUpdated: (title) => callbacks.onTitleUpdated?.(title),
        onParticipantJoined: () => {
          // Handled by onParticipantsUpdated
        },
        onParticipantLeft: () => {
          // Handled by onParticipantsUpdated
        },
        onNextSpeaker: () => {
          // Handled by onQueueUpdated
        },
        onError: (error) => {
          callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
        },
      }
    );
  }
}

/**
 * Factory function to create a Supabase-backed meeting service
 */
export function createSupabaseMeetingService(): IMeetingService {
  return new SupabaseMeetingAdapter();
}

/**
 * Factory function to create a Supabase-backed meeting service with realtime
 */
export function createSupabaseMeetingServiceWithRealtime(
  meetingCode: string
): IMeetingServiceWithRealtime {
  const adapter = new SupabaseMeetingAdapter();
  const realtime = new SupabaseRealtimeAdapter(meetingCode);
  
  return Object.assign(adapter, { realtime }) as IMeetingServiceWithRealtime;
}

/** Singleton instance for the default Supabase service */
export const supabaseMeetingService = createSupabaseMeetingService();
