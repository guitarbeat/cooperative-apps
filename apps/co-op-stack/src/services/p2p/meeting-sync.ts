/**
 * Core CRDT document manager for P2P meeting state synchronization
 * Uses Yjs for conflict-free distributed state
 */

import { Doc, Map as YMap, Array as YArray } from "yjs";
import type { Participant, QueueItem } from "@/types/meeting";
import type { 
  P2PCallbacks, 
  P2PConnectionStatus,
  SerializedParticipant,
  SerializedQueueItem 
} from "./types";

/**
 * Manages a Yjs document for P2P meeting state
 * Handles local mutations and observes remote changes
 */
export class MeetingSync {
  private doc: Doc;
  private participants: YMap<SerializedParticipant>;
  private queue: YArray<SerializedQueueItem>;
  private metadata: YMap<string | number | boolean>;
  private callbacks: Partial<P2PCallbacks> = {};
  private _status: P2PConnectionStatus = "disconnected";

  constructor(roomCode: string) {
    this.doc = new Doc();
    
    // Initialize shared types with room-specific names
    this.participants = this.doc.getMap<SerializedParticipant>(`participants-${roomCode}`);
    this.queue = this.doc.getArray<SerializedQueueItem>(`queue-${roomCode}`);
    this.metadata = this.doc.getMap<string | number | boolean>(`metadata-${roomCode}`);

    // Set up observers for remote changes
    this.setupObservers();
  }

  /** Get the underlying Yjs document for provider attachment */
  getDoc(): Doc {
    return this.doc;
  }

  /** Get current connection status */
  get status(): P2PConnectionStatus {
    return this._status;
  }

  /** Update connection status and notify callbacks */
  setStatus(status: P2PConnectionStatus): void {
    this._status = status;
    this.callbacks.onConnectionStatusChanged?.(status);
  }

  /** Register callbacks for state changes */
  setCallbacks(callbacks: Partial<P2PCallbacks>): void {
    this.callbacks = callbacks;
  }

  private setupObservers(): void {
    // Observe participant changes
    this.participants.observe(() => {
      const participantList = this.getParticipantsList();
      this.callbacks.onParticipantsUpdated?.(participantList);
    });

    // Observe queue changes
    this.queue.observe(() => {
      const queueList = this.getQueueList();
      this.callbacks.onQueueUpdated?.(queueList);
    });

    // Observe metadata changes
    this.metadata.observe((event) => {
      event.keysChanged.forEach((key) => {
        if (key === "title") {
          const title = this.metadata.get("title") as string;
          this.callbacks.onTitleUpdated?.(title);
        }
      });
    });
  }

  // ============ READ OPERATIONS ============

  /** Get all participants as array */
  getParticipantsList(): Participant[] {
    const result: Participant[] = [];
    this.participants.forEach((value) => {
      result.push(this.deserializeParticipant(value));
    });
    return result;
  }

  /** Get a specific participant by ID */
  getParticipant(id: string): Participant | null {
    const serialized = this.participants.get(id);
    return serialized ? this.deserializeParticipant(serialized) : null;
  }

  /** Get the speaking queue */
  getQueueList(): QueueItem[] {
    return this.queue.toArray().map((item) => this.deserializeQueueItem(item));
  }

  /** Get meeting title */
  getTitle(): string {
    return (this.metadata.get("title") as string) || "";
  }

  /** Get facilitator ID */
  getFacilitatorId(): string {
    return (this.metadata.get("facilitatorId") as string) || "";
  }

  /** Get facilitator name */
  getFacilitatorName(): string {
    return (this.metadata.get("facilitatorName") as string) || "";
  }

  // ============ WRITE OPERATIONS ============

  /** Initialize meeting metadata (called by facilitator) */
  initializeMeeting(title: string, facilitatorId: string, facilitatorName: string): void {
    this.doc.transact(() => {
      this.metadata.set("title", title);
      this.metadata.set("facilitatorId", facilitatorId);
      this.metadata.set("facilitatorName", facilitatorName);
      this.metadata.set("createdAt", Date.now());
      this.metadata.set("isActive", true);
    });
  }

  /** Add or update a participant */
  upsertParticipant(participant: Participant): void {
    this.participants.set(participant.id, this.serializeParticipant(participant));
  }

  /** Remove a participant */
  removeParticipant(participantId: string): void {
    this.participants.delete(participantId);
    // Also remove from queue
    this.removeFromQueue(participantId);
  }

  /** Set participant as inactive (soft delete) */
  deactivateParticipant(participantId: string): void {
    const existing = this.participants.get(participantId);
    if (existing) {
      this.participants.set(participantId, { ...existing, isActive: false });
    }
  }

  /** Restore participant (undo soft delete) */
  restoreParticipant(participantId: string): void {
    const existing = this.participants.get(participantId);
    if (existing) {
      this.participants.set(participantId, { ...existing, isActive: true });
    }
  }

  /** Add participant to speaking queue */
  addToQueue(item: QueueItem): void {
    // Check if already in queue
    const existingIndex = this.findQueueIndex(item.participantId);
    if (existingIndex === -1) {
      this.queue.push([this.serializeQueueItem(item)]);
    }
  }

  /** Remove participant from speaking queue */
  removeFromQueue(participantId: string): void {
    const index = this.findQueueIndex(participantId);
    if (index !== -1) {
      this.queue.delete(index, 1);
    }
  }

  /** Pop the next speaker from the queue */
  nextSpeaker(): QueueItem | null {
    if (this.queue.length === 0) return null;
    
    const first = this.queue.get(0);
    this.queue.delete(0, 1);
    return this.deserializeQueueItem(first);
  }

  /** Reorder queue item to new position */
  reorderQueue(participantId: string, newPosition: number): void {
    const currentIndex = this.findQueueIndex(participantId);
    if (currentIndex === -1) return;

    const item = this.queue.get(currentIndex);
    
    this.doc.transact(() => {
      this.queue.delete(currentIndex, 1);
      const insertAt = Math.min(newPosition, this.queue.length);
      this.queue.insert(insertAt, [{ ...item, position: insertAt }]);
      
      // Update positions for all items
      this.normalizeQueuePositions();
    });
  }

  /** Update meeting title */
  updateTitle(title: string): void {
    this.metadata.set("title", title);
  }

  /** End the meeting */
  endMeeting(): void {
    this.metadata.set("isActive", false);
  }

  // ============ HELPERS ============

  private findQueueIndex(participantId: string): number {
    const items = this.queue.toArray();
    return items.findIndex((item) => item.participantId === participantId);
  }

  private normalizeQueuePositions(): void {
    const items = this.queue.toArray();
    items.forEach((item, index) => {
      if (item.position !== index) {
        // Can't update in place, need to delete and reinsert
        // This is handled by the full reorder operation
      }
    });
  }

  private serializeParticipant(p: Participant): SerializedParticipant {
    return {
      id: p.id,
      name: p.name,
      isFacilitator: p.isFacilitator,
      hasRaisedHand: p.hasRaisedHand,
      joinedAt: p.joinedAt,
      isActive: p.isActive,
    };
  }

  private deserializeParticipant(s: SerializedParticipant): Participant {
    return {
      id: s.id,
      name: s.name,
      isFacilitator: s.isFacilitator,
      hasRaisedHand: s.hasRaisedHand,
      joinedAt: s.joinedAt,
      isActive: s.isActive,
    };
  }

  private serializeQueueItem(q: QueueItem): SerializedQueueItem {
    return {
      id: q.id,
      participantId: q.participantId,
      participantName: q.participantName,
      type: q.type,
      position: q.position,
      timestamp: q.timestamp,
      isSpeaking: q.isSpeaking,
      isFacilitator: q.isFacilitator,
    };
  }

  private deserializeQueueItem(s: SerializedQueueItem): QueueItem {
    return {
      id: s.id,
      participantId: s.participantId,
      participantName: s.participantName,
      type: s.type,
      position: s.position,
      timestamp: s.timestamp,
      isSpeaking: s.isSpeaking,
      isFacilitator: s.isFacilitator,
    };
  }

  /** Clean up resources */
  destroy(): void {
    this.doc.destroy();
  }
}
