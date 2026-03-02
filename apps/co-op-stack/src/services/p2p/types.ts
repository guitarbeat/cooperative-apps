/**
 * P2P-specific type definitions for meeting state synchronization
 */

import type { Participant, QueueItem } from "@/types/meeting";

/** P2P meeting state stored in CRDT document */
export interface P2PMeetingState {
  participants: Map<string, Participant>;
  queue: QueueItem[];
  title: string;
  facilitatorId: string;
  facilitatorName: string;
  createdAt: number;
  isActive: boolean;
}

/** Configuration for P2P meeting connection */
export interface P2PConfig {
  roomCode: string;
  signalingServers?: string[];
  password?: string;
}

/** P2P connection status */
export type P2PConnectionStatus = 
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

/** Callbacks for P2P state changes */
export interface P2PCallbacks {
  onParticipantsUpdated: (participants: Participant[]) => void;
  onQueueUpdated: (queue: QueueItem[]) => void;
  onTitleUpdated: (title: string) => void;
  onConnectionStatusChanged: (status: P2PConnectionStatus) => void;
  onPeerCountChanged: (count: number) => void;
  onError: (error: Error) => void;
}

/** Serialized participant for CRDT storage */
export interface SerializedParticipant {
  id: string;
  name: string;
  isFacilitator: boolean;
  hasRaisedHand: boolean;
  joinedAt: string;
  isActive: boolean;
}

/** Serialized queue item for CRDT storage */
export interface SerializedQueueItem {
  id: string;
  participantId: string;
  participantName: string;
  type: string;
  position: number;
  timestamp: number;
  isSpeaking: boolean;
  isFacilitator: boolean;
}
