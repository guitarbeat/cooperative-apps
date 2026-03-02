import type {
  MeetingData,
  MeetingWithParticipants,
  Participant,
  ParticipantSnapshot,
  QueueItem,
} from "@/types/meeting";

export interface IMeetingService {
  // Create a new meeting
  createMeeting(
    title: string,
    facilitatorName: string,
    facilitatorId?: string
  ): Promise<MeetingData>;

  // Get meeting by code
  getMeeting(code: string): Promise<MeetingWithParticipants | null>;

  // Check if a user can rejoin as facilitator
  canRejoinAsFacilitator(
    meetingCode: string,
    participantName: string
  ): Promise<boolean>;

  // Join meeting as participant
  joinMeeting(
    meetingCode: string,
    participantName: string,
    isFacilitator?: boolean
  ): Promise<Participant>;

  // Join speaking queue
  joinQueue(
    meetingId: string,
    participantId: string,
    queueType?: string
  ): Promise<QueueItem>;

  // Leave speaking queue
  leaveQueue(meetingId: string, participantId: string): Promise<void>;

  // Move to next speaker (facilitator only)
  nextSpeaker(meetingId: string): Promise<QueueItem | null>;

  // Update meeting title (facilitator only)
  updateMeetingTitle(meetingId: string, newTitle: string): Promise<void>;

  // Update meeting code (facilitator only)
  updateMeetingCode(meetingId: string, newCode: string): Promise<void>;

  // Update participant name (facilitator only)
  updateParticipantName(participantId: string, newName: string): Promise<void>;

  // Reorder queue item to new position
  reorderQueueItem(
    meetingId: string,
    participantId: string,
    newPosition: number
  ): Promise<void>;

  // Remove participant from meeting (facilitator only)
  removeParticipant(participantId: string): Promise<ParticipantSnapshot>;

  // Restore participant
  restoreParticipant(participantId: string): Promise<void>;

  // Leave meeting (self)
  leaveMeeting(participantId: string): Promise<void>;

  // End meeting (facilitator only)
  endMeeting(meetingId: string): Promise<void>;

  // Get all active meetings (for room browsing)
  getActiveMeetings(): Promise<MeetingData[]>;

  // Get active participants count for a meeting
  getParticipants(meetingId: string): Promise<Participant[]>;

  // Get meetings created by a specific facilitator
  getMeetingsByFacilitator(facilitatorId: string): Promise<MeetingData[]>;

  // Delete empty rooms older than 1 hour
  deleteEmptyOldRooms(): Promise<void>;

  // Delete a meeting (only by facilitator)
  deleteMeeting(meetingId: string, facilitatorId: string): Promise<void>;

  // Subscribe to meeting changes
  subscribeToMeeting(
    meetingId: string,
    callbacks: {
      onParticipantsUpdated: (participants: Participant[]) => void;
      onQueueUpdated: (queue: QueueItem[]) => void;
      onMeetingTitleUpdated: (title: string) => void;
      onParticipantJoined: (participant: Participant) => void;
      onParticipantLeft: (participantId: string) => void;
      onNextSpeaker: (speaker: QueueItem) => void;
      onError: (error: Error | unknown) => void;
    }
  ): () => void;
}
