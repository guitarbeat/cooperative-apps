/**
 * Unified Meeting Service Interface
 * 
 * Abstracts backend implementation (Supabase or P2P) behind a common interface.
 * This enables the same UI code to work with different sync backends.
 */

import type {
  MeetingData,
  MeetingWithParticipants,
  Participant,
  ParticipantSnapshot,
  QueueItem,
} from "@/types/meeting";

/** Core meeting operations interface */
export interface IMeetingService {
  // Meeting lifecycle
  createMeeting(
    title: string,
    facilitatorName: string,
    facilitatorId?: string
  ): Promise<MeetingData>;
  
  getMeeting(code: string): Promise<MeetingWithParticipants | null>;
  
  endMeeting(meetingId: string): Promise<void>;

  // Participant management
  joinMeeting(
    meetingCode: string,
    participantName: string,
    isFacilitator?: boolean
  ): Promise<Participant>;
  
  leaveMeeting(participantId: string): Promise<void>;
  
  removeParticipant(participantId: string): Promise<ParticipantSnapshot>;
  
  restoreParticipant(participantId: string): Promise<void>;
  
  updateParticipantName(participantId: string, newName: string): Promise<void>;

  // Meeting settings
  updateMeetingTitle(meetingId: string, newTitle: string): Promise<void>;
  
  updateMeetingCode(meetingId: string, newCode: string): Promise<void>;
  
  canRejoinAsFacilitator(
    meetingCode: string,
    participantName: string
  ): Promise<boolean>;

  // Speaking queue operations
  joinQueue(
    meetingId: string,
    participantId: string,
    queueType?: string
  ): Promise<QueueItem>;
  
  leaveQueue(meetingId: string, participantId: string): Promise<void>;
  
  nextSpeaker(meetingId: string): Promise<QueueItem | null>;
  
  reorderQueueItem(
    meetingId: string,
    participantId: string,
    newPosition: number
  ): Promise<void>;
}

/** Realtime subscription callbacks */
export interface MeetingRealtimeCallbacks {
  onParticipantsUpdated: (participants: Participant[]) => void;
  onQueueUpdated: (queue: QueueItem[]) => void;
  onMeetingEnded: () => void;
  onTitleUpdated?: (title: string) => void;
  onError?: (error: Error) => void;
}

/** Realtime subscription interface */
export interface IMeetingRealtime {
  subscribe(
    meetingId: string,
    callbacks: MeetingRealtimeCallbacks
  ): () => void;
}

/** Combined service with data operations and realtime */
export interface IMeetingServiceWithRealtime extends IMeetingService {
  realtime: IMeetingRealtime;
}

/**
 * Backend type for meeting services
 * - 'supabase': Server-based sync via Supabase Realtime
 * - 'p2p': Client-side CRDT sync via WebRTC
 */
export type MeetingBackendType = "supabase" | "p2p";
