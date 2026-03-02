import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { SupabaseMeetingService } from "@/services/supabase";
import type { QueueItem } from "@/types/meeting";
import { logProduction } from "@/utils/productionLogger";

interface UseMeetingActionsProps {
  meetingId: string;
  currentParticipantId: string;
  serverQueue: QueueItem[];
  setLastSpeaker: (speaker: QueueItem | null) => void;
  setShowJohnDoe: (show: boolean) => void;
}

interface UseMeetingActionsReturn {
  // * Speaker management
  handleNextSpeaker: () => Promise<void>;
  handleUndo: () => Promise<void>;
  lastSpeaker: QueueItem | null;
  
  // * Queue management
  handleJoinQueue: () => Promise<void>;
  handleLeaveQueue: () => Promise<void>;
  handleReorderQueue: (dragIndex: number, targetIndex: number) => Promise<void>;
  
  // * Participant management
  handleUpdateParticipant: (participantId: string, newName: string) => Promise<void>;
  handleRemoveParticipant: (participantId: string) => Promise<void>;
  handleAddParticipant: (name: string) => Promise<void>;
  
  // * Meeting management
  handleEndMeeting: () => Promise<void>;
  
  // * QR handling
  handleQrScan: (scannedUrl: string) => void;
}

/**
 * * Custom hook for managing meeting actions
 * Centralizes all meeting-related actions and handlers
 */
export function useMeetingActions({
  meetingId,
  currentParticipantId,
  serverQueue,
  setLastSpeaker,
  setShowJohnDoe,
}: UseMeetingActionsProps): UseMeetingActionsReturn {
  const navigate = useNavigate();
  const { showToast, toast: pushToast } = useToast();
  const [lastSpeaker, setLastSpeakerState] = useState<QueueItem | null>(null);

  // * Use ref to keep track of queue without updating callback dependencies
  const serverQueueRef = useRef(serverQueue);

  useEffect(() => {
    serverQueueRef.current = serverQueue;
  }, [serverQueue]);

  // * Update the external lastSpeaker state when internal state changes
  const updateLastSpeaker = useCallback((speaker: QueueItem | null) => {
    setLastSpeakerState(speaker);
    setLastSpeaker(speaker);
  }, [setLastSpeaker]);

  /**
   * * Handles moving to the next speaker in the queue
   */
  const handleNextSpeaker = useCallback(async () => {
    if (!meetingId) {
      return;
    }
    try {
      const removedSpeaker = await SupabaseMeetingService.nextSpeaker(meetingId);
      updateLastSpeaker(removedSpeaker);
    } catch (error) {
      logProduction("error", {
        action: "next_speaker",
        meetingId,
        error: error instanceof Error ? error.message : String(error)
      });
      // TODO: Show user-friendly error toast
    }
  }, [meetingId, updateLastSpeaker]);

  /**
   * * Handles undoing the last speaker action
   */
  const handleUndo = useCallback(async () => {
    if (!meetingId || !lastSpeaker) {
      return;
    }
    try {
      await SupabaseMeetingService.joinQueue(
        meetingId,
        lastSpeaker.participantId,
      );
      updateLastSpeaker(null); // Clear the last speaker after undoing
    } catch (error) {
      logProduction("error", {
        action: "undo_speaker",
        meetingId,
        lastSpeaker: lastSpeaker?.participantId,
        error: error instanceof Error ? error.message : String(error)
      });
      // TODO: Show user-friendly error toast
    }
  }, [meetingId, lastSpeaker, updateLastSpeaker]);

  /**
   * * Handles joining the speaking queue
   */
  const handleJoinQueue = useCallback(async () => {
    if (!meetingId || !currentParticipantId) {
      return;
    }
    try {
      await SupabaseMeetingService.joinQueue(meetingId, currentParticipantId);
      // * The real-time subscription will update the UI
    } catch (error) {
      logProduction("error", {
        action: "join_queue",
        meetingId,
        participantId: currentParticipantId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }, [meetingId, currentParticipantId]);

  /**
   * * Handles leaving the speaking queue
   */
  const handleLeaveQueue = useCallback(async () => {
    if (!meetingId || !currentParticipantId) {
      return;
    }
    try {
      await SupabaseMeetingService.leaveQueue(meetingId, currentParticipantId);
      // * The real-time subscription will update the UI
    } catch (error) {
      logProduction("error", {
        action: "leave_queue",
        meetingId,
        participantId: currentParticipantId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }, [meetingId, currentParticipantId]);

  /**
   * * Handles reordering items in the speaking queue
   */
  const handleReorderQueue = useCallback(async (dragIndex: number, targetIndex: number) => {
    const queue = serverQueueRef.current;
    if (!meetingId || queue.length === 0) {
      return;
    }

    try {
      const itemToMove = queue[dragIndex];
      if (!itemToMove?.id) {
        logProduction("warn", {
          action: "reorder_queue_no_item",
          meetingId,
          dragIndex,
          targetIndex
        });
        return;
      }

      // Calculate new position based on target index
      const newPosition = targetIndex + 1; // positions are 1-based in DB

      await SupabaseMeetingService.reorderQueueItem(
        meetingId,
        itemToMove.participantId,
        newPosition
      );

      logProduction("info", {
        action: "reorder_queue_success",
        meetingId,
        dragIndex,
        targetIndex,
        participantId: itemToMove.participantId,
        newPosition
      });
    } catch (error) {
      logProduction("error", {
        action: "reorder_queue",
        meetingId,
        dragIndex,
        targetIndex,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }, [meetingId]); // * serverQueue dependency removed to keep callback stable

  /**
   * * Handles updating participant information
   */
  const handleUpdateParticipant = useCallback(async (participantId: string, newName: string) => {
    if (!participantId || !newName.trim()) {
      return;
    }

    try {
      const normalizedName = newName.trim();
      await SupabaseMeetingService.updateParticipantName(participantId, normalizedName);
      showToast({
        type: 'success',
        title: 'Name Updated',
        message: `Participant name updated to ${normalizedName}`
      });
      // * Real-time subscription will update the UI
    } catch (error) {
      logProduction("error", {
        action: "update_participant",
        participantId,
        newName,
        error: error instanceof Error ? error.message : String(error)
      });
      showToast({
        type: 'error',
        title: 'Failed to Update Name',
        message: 'Please try again or check your connection'
      });
    }
  }, [showToast]);

  /**
   * * Handles removing a participant from the meeting
   */
  const handleRemoveParticipant = useCallback(async (participantId: string) => {
    if (!participantId) {
      return;
    }

    // * Handle fake John Doe participant (ID "1")
    if (participantId === "1") {
      setShowJohnDoe(false);
      showToast({
        type: 'success',
        title: 'Participant Removed',
        message: 'John Doe has been removed from the meeting'
      });
      return;
    }

    try {
      const removedParticipant = await SupabaseMeetingService.removeParticipant(participantId);
      const toastHandle = pushToast({
        variant: 'warning',
        title: 'Participant Removed',
        description: `${removedParticipant.name} has been removed from the meeting`,
        duration: 7000,
        action: (
          <ToastAction
            altText="Undo removal"
            onClick={() => {
              void (async () => {
                try {
                  await SupabaseMeetingService.restoreParticipant(removedParticipant.id);
                  showToast({
                    type: 'success',
                    title: 'Participant Restored',
                    message: `${removedParticipant.name} has been returned to the meeting`
                  });
                } catch (restoreError) {
                  logProduction('error', {
                    action: 'restore_participant',
                    participantId: removedParticipant.id,
                    error: restoreError instanceof Error ? restoreError.message : String(restoreError)
                  });
                  showToast({
                    type: 'error',
                    title: 'Failed to Restore Participant',
                    message: 'Please try again or check your connection'
                  });
                } finally {
                  toastHandle.dismiss();
                }
              })();
            }}
          >
            Undo
          </ToastAction>
        )
      });
      // * Real-time subscription will update the UI
    } catch (error) {
      logProduction("error", {
        action: "remove_participant",
        participantId,
        error: error instanceof Error ? error.message : String(error)
      });
      showToast({
        type: 'error',
        title: 'Failed to Remove Participant',
        message: 'Please try again or check your connection'
      });
    }
  }, [setShowJohnDoe, showToast, pushToast]);

  /**
   * * Handles adding a new participant to the meeting
   */
  const handleAddParticipant = useCallback(async (name: string) => {
    if (!meetingId) {
      return Promise.resolve();
    }

    try {
      await SupabaseMeetingService.joinMeeting(meetingId, name, false);
      showToast({
        type: 'success',
        title: 'Participant Added',
        message: `${name} has been added to the meeting`
      });
      // * Real-time subscription will update the UI
      return Promise.resolve();
    } catch (error) {
      logProduction("error", {
        action: "add_participant",
        meetingId,
        participantName: name,
        error: error instanceof Error ? error.message : String(error)
      });
      showToast({
        type: 'error',
        title: 'Failed to Add Participant',
        message: 'Please try again or check your connection'
      });
      return Promise.reject(error);
    }
  }, [meetingId, showToast]);


  /**
   * * Handles ending the meeting
   */
  const handleEndMeeting = useCallback(async () => {
    if (!meetingId) {
      return;
    }

    try {
      await SupabaseMeetingService.endMeeting(meetingId);
      // * Navigate back to home after ending meeting
      navigate("/");
    } catch (error) {
      logProduction("error", {
        action: "end_meeting",
        meetingId,
        error: error instanceof Error ? error.message : String(error)
      });
      // * Still navigate home even if cleanup fails
      navigate("/");
    }
  }, [meetingId, navigate]);

  /**
   * * Handles QR code scanning
   */
  const handleQrScan = useCallback((scannedUrl: string) => {
    // * For now, QR scanning is not fully implemented
    // * This function provides the framework for when proper QR scanning is added
    logProduction('info', {
      action: 'qr_scan_attempted',
      scannedUrl
    });
  }, []);

  return {
    // * Speaker management
    handleNextSpeaker,
    handleUndo,
    lastSpeaker,
    
    // * Queue management
    handleJoinQueue,
    handleLeaveQueue,
    handleReorderQueue,
    
    // * Participant management
    handleUpdateParticipant,
    handleRemoveParticipant,
    handleAddParticipant,
    
    // * Meeting management
    handleEndMeeting,
    
    // * QR handling
    handleQrScan,
  };
}
