/**
 * P2P service exports
 * Provides CRDT-based meeting state synchronization via WebRTC
 */

export { MeetingSync } from "./meeting-sync";
export { SignalingManager, createP2PSession } from "./signaling";
export { P2PMeetingService } from "./p2p-meeting-service";
export type {
  P2PCallbacks,
  P2PConfig,
  P2PConnectionStatus,
  P2PMeetingState,
  SerializedParticipant,
  SerializedQueueItem,
} from "./types";
