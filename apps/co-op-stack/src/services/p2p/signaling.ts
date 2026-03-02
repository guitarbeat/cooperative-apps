/**
 * WebRTC signaling wrapper for P2P meeting connections
 * Uses y-webrtc for peer discovery and state synchronization
 */

import { WebrtcProvider } from "y-webrtc";
import type { MeetingSync } from "./meeting-sync";
import type { P2PConfig } from "./types";

/** Default public signaling servers for y-webrtc */
const DEFAULT_SIGNALING_SERVERS = [
  "wss://signaling.yjs.dev",
  "wss://y-webrtc-signaling-eu.herokuapp.com",
  "wss://y-webrtc-signaling-us.herokuapp.com",
];

/**
 * Manages WebRTC connections for a meeting room
 * Wraps y-webrtc provider with connection lifecycle handling
 */
export class SignalingManager {
  private provider: WebrtcProvider | null = null;
  private meetingSync: MeetingSync;
  private config: P2PConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(meetingSync: MeetingSync, config: P2PConfig) {
    this.meetingSync = meetingSync;
    this.config = config;
  }

  /** Connect to the signaling server and start peer discovery */
  connect(): void {
    if (this.provider) {
      console.warn("[SignalingManager] Already connected, disconnecting first");
      this.disconnect();
    }

    this.meetingSync.setStatus("connecting");

    try {
      const signalingServers = this.config.signalingServers?.length
        ? this.config.signalingServers
        : DEFAULT_SIGNALING_SERVERS;

      this.provider = new WebrtcProvider(
        `meeting-${this.config.roomCode}`,
        this.meetingSync.getDoc(),
        {
          signaling: signalingServers,
          password: this.config.password,
          // WebRTC configuration for better NAT traversal
          peerOpts: {
            config: {
              iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
                { urls: "stun:stun2.l.google.com:19302" },
              ],
            },
          },
        }
      );

      this.setupProviderListeners();
      this.reconnectAttempts = 0;
    } catch (error) {
      console.error("[SignalingManager] Failed to connect:", error);
      this.meetingSync.setStatus("error");
      this.scheduleReconnect();
    }
  }

  /** Disconnect from signaling and close all peer connections */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.provider) {
      this.provider.destroy();
      this.provider = null;
    }

    this.meetingSync.setStatus("disconnected");
  }

  /** Get current peer count (excluding self) */
  getPeerCount(): number {
    if (!this.provider) return 0;
    return this.provider.awareness.getStates().size - 1;
  }

  /** Check if connected to at least one peer */
  isConnected(): boolean {
    return this.provider !== null && this.meetingSync.status === "connected";
  }

  private setupProviderListeners(): void {
    if (!this.provider) return;

    // Track connection status based on signaling WebSocket
    this.provider.on("status", (event: { connected: boolean }) => {
      console.log("[SignalingManager] Status:", event.connected ? "connected" : "disconnected");

      if (event.connected) {
        this.meetingSync.setStatus("connected");
        this.reconnectAttempts = 0;
      } else {
        this.meetingSync.setStatus("disconnected");
        this.scheduleReconnect();
      }
    });

    // Track peer connections through awareness
    this.provider.awareness.on("change", () => {
      const peerCount = this.getPeerCount();
      console.log("[SignalingManager] Peer count:", peerCount);
    });

    // Handle sync events
    this.provider.on("synced", (event: { synced: boolean }) => {
      console.log("[SignalingManager] Synced:", event.synced);
      if (event.synced) {
        this.meetingSync.setStatus("connected");
      }
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[SignalingManager] Max reconnect attempts reached");
      this.meetingSync.setStatus("error");
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    console.log(`[SignalingManager] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  /** Clean up all resources */
  destroy(): void {
    this.disconnect();
    this.meetingSync.destroy();
  }
}

/**
 * Factory function to create a connected P2P meeting session
 */
export function createP2PSession(
  meetingSync: MeetingSync,
  config: P2PConfig
): SignalingManager {
  const manager = new SignalingManager(meetingSync, config);
  manager.connect();
  return manager;
}
