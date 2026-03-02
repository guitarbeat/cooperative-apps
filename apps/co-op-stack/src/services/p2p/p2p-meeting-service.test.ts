import { describe, it, expect, vi, beforeEach } from 'vitest';
import { P2PMeetingService } from './p2p-meeting-service';
import { MeetingSync } from './meeting-sync';
import type { SignalingManager } from './signaling';

// Mock crypto.randomUUID
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9)
    }
  });
} else if (!globalThis.crypto.randomUUID) {
    // @ts-expect-error - globalThis.crypto is read-only in some environments
    // @ts-expect-error - mock function
    globalThis.crypto.randomUUID = () => 'test-uuid-' + Math.random().toString(36).substr(2, 9);
}

// Mock MeetingSync
vi.mock('./meeting-sync', () => {
  return {
    MeetingSync: vi.fn().mockImplementation(() => ({
      initializeMeeting: vi.fn(),
      destroy: vi.fn(),
      setStatus: vi.fn(),
      getParticipantsList: vi.fn().mockReturnValue([]),
      getQueueList: vi.fn().mockReturnValue([]),
      getTitle: vi.fn().mockReturnValue('Test Meeting'),
      getFacilitatorId: vi.fn().mockReturnValue('fac-123'),
      getFacilitatorName: vi.fn().mockReturnValue('Facilitator'), // Added mock
      upsertParticipant: vi.fn(),
      getParticipant: vi.fn(),
      addToQueue: vi.fn(),
      removeFromQueue: vi.fn(),
      nextSpeaker: vi.fn(),
      updateTitle: vi.fn(),
      reorderQueue: vi.fn(),
      removeParticipant: vi.fn(),
      deactivateParticipant: vi.fn(),
      restoreParticipant: vi.fn(), // Added mock
      endMeeting: vi.fn(),
      setCallbacks: vi.fn(),
      status: 'connected'
    }))
  };
});

// Mock SignalingManager
vi.mock('./signaling', () => ({
  SignalingManager: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  createP2PSession: vi.fn().mockImplementation((_sync: MeetingSync, _config: { roomCode: string }): SignalingManager => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
  } as unknown as SignalingManager))
}));

describe('P2PMeetingService', () => {
  let service: P2PMeetingService;

  beforeEach(() => {
    service = new P2PMeetingService();
    vi.clearAllMocks();
  });

  it('creates a meeting', async () => {
    const meeting = await service.createMeeting('Test', 'Facilitator');
    expect(meeting.title).toBe('Test');
    expect(meeting.facilitator).toBe('Facilitator');
    expect(meeting.code).toHaveLength(6);
    expect(MeetingSync).toHaveBeenCalled();
  });

  it('joins a meeting', async () => {
    const participant = await service.joinMeeting('ABCDEF', 'User');
    expect(participant.name).toBe('User');
    expect(participant.isFacilitator).toBe(false);
  });
});
