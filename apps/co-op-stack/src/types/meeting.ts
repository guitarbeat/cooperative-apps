/**
 * Centralized meeting-related type definitions
 * All meeting types should be imported from this file
 */

/** Represents a participant in a meeting */
export interface Participant {
  id: string;
  name: string;
  isFacilitator: boolean;
  hasRaisedHand: boolean;
  joinedAt: string;
  isActive: boolean;
}

/** Snapshot of participant data for undo/restore operations */
export interface ParticipantSnapshot {
  id: string;
  meetingId: string;
  name: string;
  isFacilitator: boolean;
  joinedAt: string;
}

/** Basic meeting metadata */
export interface MeetingData {
  id: string;
  code: string;
  title: string;
  facilitator: string;
  facilitatorId: string | null;
  createdAt: string;
  isActive: boolean;
}

/** Represents an item in the speaking queue */
export interface QueueItem {
  id: string;
  participantId: string;
  participantName: string;
  type: string;
  position: number;
  timestamp: number;
  joinedQueueAt?: string;
  isSpeaking: boolean;
  isFacilitator: boolean;
}

/** Meeting with full participant and queue data */
export interface MeetingWithParticipants extends MeetingData {
  participants: Participant[];
  speakingQueue: QueueItem[];
}

/** Current speaker information for display components */
export interface CurrentSpeaker {
  name: string;
  participantName?: string;
  speakingTime: number;
  startedSpeakingAt?: Date;
}

/** Speaking queue entry for display components (alias for QueueItem) */
export type SpeakingQueue = QueueItem;

/** Meeting mode options */
export type MeetingMode = "host" | "join" | "watch";
