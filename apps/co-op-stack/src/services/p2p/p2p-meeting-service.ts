import { MeetingSync } from "./meeting-sync";
import { SignalingManager, createP2PSession } from "./signaling";
import type { IMeetingService } from "../meeting-interface";
import { generateSecureRandomString } from "@/utils/security";
import type {
  MeetingData,
  MeetingWithParticipants,
  Participant,
  ParticipantSnapshot,
  QueueItem,
} from "@/types/meeting";
import type { P2PCallbacks } from "./types";

export class P2PMeetingService implements IMeetingService {
  private activeSync: MeetingSync | null = null;
  private activeSignaling: SignalingManager | null = null;
  private activeCode: string | null = null;
  private activeParticipants: Participant[] = []; // Cache for diffing

  // Helper to ensure we have an active session for the given code
  private async ensureSession(code: string): Promise<MeetingSync> {
    if (this.activeSync && this.activeCode === code) {
      return this.activeSync;
    }

    // Cleanup previous session
    if (this.activeSignaling) {
      this.activeSignaling.disconnect();
      this.activeSignaling = null;
    }
    if (this.activeSync) {
      this.activeSync.destroy();
      this.activeSync = null;
    }

    // Create new session
    this.activeSync = new MeetingSync(code);
    this.activeCode = code;
    this.activeSignaling = createP2PSession(this.activeSync, { roomCode: code });

    return this.activeSync;
  }

  private async waitForSync(sync: MeetingSync, timeoutMs = 2000): Promise<void> {
    if ((sync.status as string) === 'connected') return;

    const startTime = Date.now();
    while ((sync.status as string) !== 'connected' && Date.now() - startTime < timeoutMs) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Helper to generate IDs
  private generateId(): string {
    return crypto.randomUUID();
  }

  private generateMeetingCode(): string {
    return generateSecureRandomString(6);
  }

  async createMeeting(
    title: string,
    facilitatorName: string,
    facilitatorId?: string
  ): Promise<MeetingData> {
    const code = this.generateMeetingCode();
    // Meeting ID is the code in P2P mode
    const facId = facilitatorId ?? this.generateId();

    const sync = await this.ensureSession(code);
    sync.initializeMeeting(title, facId, facilitatorName);

    // In P2P, the creator is implicitly connected.
    // We construct the return data from what we just set.
    return {
      id: code, // Using code as ID for P2P simplicity, or we could use a UUID if stored in metadata
      code,
      title,
      facilitator: facilitatorName,
      facilitatorId: facId,
      createdAt: new Date().toISOString(),
      isActive: true,
    };
  }

  async getMeeting(code: string): Promise<MeetingWithParticipants | null> {
    const sync = await this.ensureSession(code);
    await this.waitForSync(sync);

    const participants = sync.getParticipantsList();
    const queue = sync.getQueueList();

    const title = sync.getTitle();

    // If no title and no participants, assuming empty/invalid meeting for now
    if (!title && participants.length === 0) {
       // Could return null, but let's return what we have to be safe or maybe null?
       // Supabase returns null if not found.
       // P2P "not found" is ambiguous. But empty state implies it.
       // Let's check if we are connected.
       if (sync.status !== 'connected') {
           // Failed to connect, maybe invalid code or no peers.
           // Can return null or empty meeting.
           // Returning null seems safer for "not found".
           // But offline creation? If we created it, we have it locally.
           // If we created it, title should be there.
           // So if title is missing, it's likely not found.
           return null;
       }
    }

    return {
      id: code,
      code,
      title: sync.getTitle(),
      facilitator: sync.getFacilitatorName(),
      facilitatorId: sync.getFacilitatorId(),
      createdAt: new Date().toISOString(), // Metadata 'createdAt' is number
      isActive: true, // Metadata 'isActive'
      participants,
      speakingQueue: queue,
    } as unknown as MeetingWithParticipants;
  }

  async canRejoinAsFacilitator(
    meetingCode: string,
    participantName: string
  ): Promise<boolean> {
    const sync = await this.ensureSession(meetingCode);
    await this.waitForSync(sync);

    const facilitatorName = sync.getFacilitatorName();
    return facilitatorName.toLowerCase() === participantName.trim().toLowerCase();
  }

  async joinMeeting(
    meetingCode: string,
    participantName: string,
    isFacilitator: boolean = false
  ): Promise<Participant> {
    const sync = await this.ensureSession(meetingCode);
    await this.waitForSync(sync); // Wait to ensure we have latest state before adding (to check duplicates?)

    const participant: Participant = {
      id: this.generateId(),
      name: participantName,
      isFacilitator,
      hasRaisedHand: false,
      joinedAt: new Date().toISOString(),
      isActive: true,
    };

    sync.upsertParticipant(participant);
    return participant;
  }

  async joinQueue(
    _meetingId: string,
    participantId: string,
    queueType: string = "speak"
  ): Promise<QueueItem> {
    if (!this.activeSync) throw new Error("No active meeting");

    const participant = this.activeSync.getParticipant(participantId);
    if (!participant) throw new Error("Participant not found");

    const item: QueueItem = {
      id: this.generateId(),
      participantId,
      participantName: participant.name,
      type: queueType,
      position: this.activeSync.getQueueList().length + 1, // rough estimate
      timestamp: Date.now(),
      isSpeaking: false,
      isFacilitator: participant.isFacilitator,
    };

    this.activeSync.addToQueue(item);
    return item;
  }

  async leaveQueue(_meetingId: string, participantId: string): Promise<void> {
    if (!this.activeSync) return;
    this.activeSync.removeFromQueue(participantId);
  }

  async nextSpeaker(_meetingId: string): Promise<QueueItem | null> {
    if (!this.activeSync) return null;
    return this.activeSync.nextSpeaker();
  }

  async updateMeetingTitle(_meetingId: string, newTitle: string): Promise<void> {
    if (!this.activeSync) return;
    this.activeSync.updateTitle(newTitle);
  }

  async updateMeetingCode(_meetingId: string, _newCode: string): Promise<void> {
    throw new Error("Updating meeting code not supported in P2P");
  }

  async updateParticipantName(participantId: string, newName: string): Promise<void> {
    if (!this.activeSync) return;
    const p = this.activeSync.getParticipant(participantId);
    if (p) {
      this.activeSync.upsertParticipant({ ...p, name: newName });
    }
  }

  async reorderQueueItem(
    _meetingId: string,
    participantId: string,
    newPosition: number
  ): Promise<void> {
    if (!this.activeSync) return;
    this.activeSync.reorderQueue(participantId, newPosition);
  }

  async removeParticipant(participantId: string): Promise<ParticipantSnapshot> {
    if (!this.activeSync) throw new Error("No active meeting");

    const p = this.activeSync.getParticipant(participantId);
    if (!p) throw new Error("Participant not found");

    // Use deactivateParticipant for soft delete to allow restore
    this.activeSync.deactivateParticipant(participantId);

    return {
      id: p.id,
      meetingId: this.activeCode!,
      name: p.name,
      isFacilitator: p.isFacilitator,
      joinedAt: p.joinedAt,
    };
  }

  async restoreParticipant(participantId: string): Promise<void> {
    if (!this.activeSync) return;
    this.activeSync.restoreParticipant(participantId);
  }

  async leaveMeeting(participantId: string): Promise<void> {
    if (!this.activeSync) return;
    // Client leaving.
    this.activeSync.deactivateParticipant(participantId);
    // Maybe also disconnect?
    // this.activeSignaling?.disconnect();
  }

  async endMeeting(_meetingId: string): Promise<void> {
    if (!this.activeSync) return;
    this.activeSync.endMeeting();
  }

  // Queries
  async getActiveMeetings(): Promise<MeetingData[]> {
    return []; // Not supported
  }

  async getParticipants(_meetingId: string): Promise<Participant[]> {
    if (this.activeSync && this.activeCode === _meetingId) {
      return this.activeSync.getParticipantsList();
    }
    return [];
  }

  async getMeetingsByFacilitator(_facilitatorId: string): Promise<MeetingData[]> {
    return []; // Not supported
  }

  async deleteEmptyOldRooms(): Promise<void> {
    // No-op
  }

  async deleteMeeting(meetingId: string, _facilitatorId: string): Promise<void> {
    // No-op or end meeting
    return this.endMeeting(meetingId);
  }

  // Subscription
  subscribeToMeeting(
    _meetingId: string,
    callbacks: {
      onParticipantsUpdated: (participants: Participant[]) => void;
      onQueueUpdated: (queue: QueueItem[]) => void;
      onMeetingTitleUpdated: (title: string) => void;
      onParticipantJoined: (participant: Participant) => void;
      onParticipantLeft: (participantId: string) => void;
      onNextSpeaker: (speaker: QueueItem) => void;
      onError: (error: Error | unknown) => void;
    }
  ): () => void {
    if (!this.activeSync) {
        callbacks.onError(new Error("No active P2P session to subscribe to"));
        return () => {};
    }

    // Initial state
    this.activeParticipants = this.activeSync.getParticipantsList();

    const p2pCallbacks: Partial<P2PCallbacks> = {
      onParticipantsUpdated: (participants) => {
        callbacks.onParticipantsUpdated(participants);

        // derived events
        const prevIds = new Set(this.activeParticipants.map(p => p.id));
        const currIds = new Set(participants.map(p => p.id));

        // Joined
        participants.forEach(p => {
            if (!prevIds.has(p.id)) {
                callbacks.onParticipantJoined(p);
            }
        });

        // Left
        this.activeParticipants.forEach(p => {
            if (!currIds.has(p.id)) {
                callbacks.onParticipantLeft(p.id);
            }
        });

        this.activeParticipants = participants;
      },
      onQueueUpdated: (queue) => {
        callbacks.onQueueUpdated(queue);
      },
      onTitleUpdated: (title) => {
        callbacks.onMeetingTitleUpdated(title);
      },
      onError: (err) => {
        callbacks.onError(err);
      }
    };

    this.activeSync.setCallbacks(p2pCallbacks);

    return () => {
      if (this.activeSync) {
        this.activeSync.setCallbacks({});
      }
    };
  }
}
