import { useEffect, useState, useMemo, useCallback, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { MeetingHeader } from "@/components/MeetingRoom/MeetingHeader";
import { SpeakingQueue } from "@/components/MeetingRoom/SpeakingQueue";
import { NowSpeaking } from "@/components/MeetingRoom/NowSpeaking";
import { ActionsPanel } from "@/components/MeetingRoom/ActionsPanel";
import { MobileActionBar } from "@/components/MeetingRoom/MobileActionBar";
import { ErrorState } from "@/components/MeetingRoom/ErrorState";
import { HostSettingsPanel } from "@/components/MeetingRoom/HostSettingsPanel";
// import { KeyboardShortcutsModal } from "@/components/MeetingRoom/KeyboardShortcutsModal";
import { AppError, ErrorCode } from "@/utils/errorHandling";
import { QueuePositionFeedback } from "@/components/MeetingRoom/QueuePositionFeedback";
// import { DisplayLayout } from "@/components/WatchView/DisplayLayout";
// import { SpeakingAnalytics } from "@/components/WatchView/SpeakingAnalytics";
import { LoadingState } from "@/components/shared/LoadingState";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

// import { QrCodeScanner } from "@/components/ui/qr-code-scanner";
import { CodeInputForm } from "@/components/MeetingRoom/CodeInputForm";
import { useAuth } from "@/hooks/useAuth";
import { useMeetingState } from "@/hooks/useMeetingState";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useSpeakerTimer } from "@/hooks/useSpeakerTimer";
import { useSpeakingHistory } from "@/hooks/useSpeakingHistory";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { useMeetingActions } from "@/hooks/useMeetingActions";
import {
  SupabaseMeetingService,
  SupabaseRealtimeService,
  type MeetingWithParticipants,
} from "@/services/supabase";
import { validateMeetingCode } from "@/utils/schemas";
import { logProduction } from "@/utils/productionLogger";
import { generateSecureRandomString } from "@/utils/security";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const QrCodeScanner = lazy(() => import("@/components/ui/qr-code-scanner").then(module => ({ default: module.QrCodeScanner })));
const KeyboardShortcutsModal = lazy(() => import("@/components/MeetingRoom/KeyboardShortcutsModal").then(module => ({ default: module.KeyboardShortcutsModal })));
const DisplayLayout = lazy(() => import("@/components/WatchView/DisplayLayout"));
const SpeakingAnalytics = lazy(() => import("@/components/WatchView/SpeakingAnalytics"));

export default function MeetingRoom() {
  const navigate = useNavigate();
  const { user, signInAnonymously } = useAuth();
  const { showToast, toast: pushToast } = useToast();

  // * Use the centralized meeting state hook
  const {
    meetingCode,
    setMeetingCode,
    meetingId,
    setMeetingId,
    mode,
    isLoading,
    setIsLoading,
    error,
    codeInput,
    setCodeInput,
    participantName,
    setParticipantName,
    setError,
    serverMeeting,
    setServerMeeting,
    serverParticipants,
    setServerParticipants,
    serverQueue,
    setServerQueue,
    currentParticipantId,
    isLiveMeeting,
    setIsLiveMeeting,
    showJohnDoe,
    setShowJohnDoe,
    lastSpeaker,
    setLastSpeaker,
    qrOpen,
    setQrOpen,
    qrUrl,
    setQrUrl,
    qrType,
    setQrType,
    scannerOpen,
    setScannerOpen,
    userRole,
  } = useMeetingState();

  // * Meeting actions hook for host functionality
  const { handleEndMeeting, handleReorderQueue } = useMeetingActions({
    meetingId,
    currentParticipantId,
    serverQueue,
    setLastSpeaker,
    setShowJohnDoe,
  });

  const [isP2P, setIsP2P] = useState(false);

  const handleCreateRoom = useCallback(async () => {
    if (!codeInput.trim()) return;

    if (isP2P) {
      logProduction("info", {
        action: "create_p2p_room",
        name: codeInput
      });
      showToast({
        title: "P2P Mode",
        description: "P2P room creation is not yet fully implemented. Please use Supabase mode.",
        variant: "default",
      });
      return;
    }

    try {
      setIsLoading(true);
      // Use participantName from state (loaded from localStorage) or fallback
      const facilitatorName = participantName.trim() || user?.email || "Anonymous Facilitator";
      const created = await SupabaseMeetingService.createMeeting(
        codeInput.trim(),
        facilitatorName,
        user?.id,
      );

      // Update the meeting state
      setMeetingId(created.id);
      setMeetingCode(created.code);

      // Load the full meeting data
      const full = await SupabaseMeetingService.getMeeting(created.code);
      if (full) {
        setServerMeeting(full);
        setServerParticipants(full.participants);
        setServerQueue(full.speakingQueue);
      }

      // Clear the input
      setCodeInput("");
      showToast({
        title: "Room Created!",
        description: `Room "${created.title}" is now live with code ${created.code}`,
      });
    } catch (error) {
      logProduction("error", {
        action: "create_room_failed",
        error: error instanceof Error ? error.message : String(error),
      });
      showToast({
        title: "Failed to create room",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [codeInput, isP2P, participantName, user, setMeetingId, setMeetingCode, setServerMeeting, setServerParticipants, setServerQueue, setCodeInput, showToast, setIsLoading]);

  const handleQrScan = useCallback((scannedUrl: string) => {
    // For now, QR scanning is not fully implemented
    // This function provides the framework for when proper QR scanning is added
    // * Log QR scan for debugging in development
    if (import.meta.env.DEV) {
      logProduction('info', {
        action: 'qr_scan_attempted',
        scannedUrl
      });
    }
    setScannerOpen(false);
  }, [setScannerOpen]);

  // Advanced features hooks

  const handleNextSpeaker = useCallback(async () => {
    if (!meetingId) {
      return;
    }
    try {
      const removedSpeaker = await SupabaseMeetingService.nextSpeaker(meetingId);
      setLastSpeaker(removedSpeaker);
    } catch (error) {
      logProduction("error", {
        action: "next_speaker",
        meetingId,
        error: error instanceof Error ? error.message : String(error)
      });
      showToast({
        type: 'error',
        title: 'Failed to Advance Speaker',
        message: 'Could not move to the next speaker. Please try again.',
      });
    }
  }, [meetingId, setLastSpeaker]);

  const handleUndo = useCallback(async () => {
    if (!meetingId || !lastSpeaker) {
      return;
    }
    try {
      await SupabaseMeetingService.joinQueue(
        meetingId,
        lastSpeaker.participantId,
      );
      setLastSpeaker(null);
    } catch (error) {
      logProduction("error", {
        action: "undo_speaker",
        meetingId,
        lastSpeaker: lastSpeaker?.participantId,
        error: error instanceof Error ? error.message : String(error)
      });
      showToast({
        type: 'error',
        title: 'Failed to Undo',
        message: 'Could not restore the previous speaker. Please try again.',
      });
    }
  }, [meetingId, lastSpeaker, setLastSpeaker]);

  const handleLeaveQueue = useCallback(async () => {
    if (!meetingId || !currentParticipantId) {
      return;
    }
    try {
      await SupabaseMeetingService.leaveQueue(meetingId, currentParticipantId);
      showToast({
        type: 'success',
        title: 'Left Queue',
        message: 'You have been removed from the speaking queue.'
      });
    } catch (error) {
      logProduction('error', {
        action: 'leave_queue',
        meetingId,
        participantId: currentParticipantId,
        error: error instanceof Error ? error.message : String(error)
      });
      showToast({
        type: 'error',
        title: 'Failed to Leave Queue',
        message: 'There was an error removing you from the queue. Please try again.'
      });
    }
  }, [meetingId, currentParticipantId, showToast]);

  const handleJoinQueue = useCallback(async (queueType: string) => {
    if (!meetingId || !currentParticipantId) {
      return;
    }
    try {
      await SupabaseMeetingService.joinQueue(meetingId, currentParticipantId, queueType);
      showToast({
        type: 'success',
        title: 'Added to Queue',
        message: 'You have been added to the speaking queue.'
      });
    } catch (error) {
      logProduction('error', {
        action: 'join_queue',
        meetingId,
        participantId: currentParticipantId,
        queueType,
        error: error instanceof Error ? error.message : String(error)
      });
      showToast({
        type: 'error',
        title: 'Failed to Join Queue',
        message: 'There was an error adding you to the queue. Please try again.'
      });
    }
  }, [meetingId, currentParticipantId, showToast]);

  const { showKeyboardShortcuts: _showKeyboardShortcuts, toggleShortcuts: _toggleShortcuts } = useKeyboardShortcuts({
    onNextSpeaker: () => {
      void handleNextSpeaker();
    },
    onUndo: () => {
      void handleUndo();
    },
    onToggleShortcuts: () => setShowKeyboardShortcutsModal(prev => !prev)
  });

  const [showKeyboardShortcutsModal, setShowKeyboardShortcutsModal] = useState(false);

  const { speakerTimer: _speakerTimer, elapsedTime: _elapsedTime, startTimer: _startTimer, stopTimer: _stopTimer, formatTime: _formatTime } = useSpeakerTimer();
  const { speakingHistory, addSpeakingSegment: _addSpeakingSegment, getTotalSpeakingTime: _getTotalSpeakingTime, getSpeakingDistribution } = useSpeakingHistory();
  const { dragIndex: _dragIndex, handleDragStart: _handleDragStart, handleDrop: _handleDrop, isDragOver: _isDragOver } = useDragAndDrop({ isFacilitator: mode === 'host' });

  const isInQueue = serverQueue.some(entry => entry.participantId === currentParticipantId);

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
      // Real-time subscription will update the UI
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

    const existingParticipant = serverParticipants.find(p => p.id === participantId);
    const originalIndex = serverParticipants.findIndex(p => p.id === participantId);

    try {
      const removedParticipant = await SupabaseMeetingService.removeParticipant(participantId);
      setServerParticipants(prev => prev.filter(p => p.id !== participantId));

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
                  const baseParticipant = existingParticipant ?? {
                    id: removedParticipant.id,
                    name: removedParticipant.name,
                    isFacilitator: removedParticipant.isFacilitator,
                    hasRaisedHand: false,
                    joinedAt: removedParticipant.joinedAt,
                    isActive: true,
                  };

                  setServerParticipants(prev => {
                    const restoredParticipant = {
                      ...baseParticipant,
                      isActive: true,
                    };
                    const next = [...prev];
                    const insertIndex = originalIndex >= 0 ? Math.min(originalIndex, next.length) : next.length;
                    next.splice(insertIndex, 0, restoredParticipant);
                    return next;
                  });
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
  }, [serverParticipants, setShowJohnDoe, showToast, pushToast, setServerParticipants]);


  // Handler for AddParticipants component
  const handleAddParticipant = useCallback(async (name: string) => {
    if (!meetingCode) {
      return Promise.resolve();
    }

    try {
      await SupabaseMeetingService.joinMeeting(meetingCode, name, false);
      showToast({
        type: 'success',
        title: 'Participant Added',
        message: `${name} has been added to the meeting`
      });
      // Real-time subscription will update the UI
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
  }, [meetingCode, meetingId, showToast]);


  const handleMeetingCodeChange = useCallback(async (newCode: string) => {
    if (!meetingId) return;

    try {
      await SupabaseMeetingService.updateMeetingCode(meetingId, newCode);
      // Update local state
      setMeetingCode(newCode);
      showToast({
        type: 'success',
        title: 'Meeting code updated',
        message: `New meeting code: ${newCode}`,
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update meeting code',
      });
      throw error; // Re-throw to let the UI handle it
    }
  }, [meetingId, setMeetingCode, showToast]);

  // Meeting initialization is handled by useMeetingState hook

  // Realtime subscriptions
  useEffect(() => {
    if (!meetingId || !meetingCode) {
      return;
    }
    const unsubscribe = SupabaseRealtimeService.subscribeToMeeting(meetingId, meetingCode, {
      onParticipantsUpdated: (participants) => {
        setServerParticipants(participants);
        // * Hide John Doe when real participants join
        if (participants.length > 0) {
          setShowJohnDoe(false);
        }
      },
      onQueueUpdated: setServerQueue,
      onMeetingTitleUpdated: (title) =>
        setServerMeeting((m) =>
          m ? ({ ...m, title } as MeetingWithParticipants) : m,
        ),
      onParticipantJoined: () => void 0,
      onParticipantLeft: () => void 0,
      onNextSpeaker: () => void 0,
      onError: () => void 0,
    });
    return () => {
      unsubscribe?.();
    };
  }, [meetingId, meetingCode, setShowJohnDoe, setServerParticipants, setServerQueue, setServerMeeting]);

  // Cleanup: Mark participant as inactive when leaving
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentParticipantId && mode === "join") {
        const url = `${import.meta.env.VITE_SUPABASE_URL ?? "https://jectngcrpikxwnjdwana.supabase.co"}/rest/v1/participants?id=eq.${currentParticipantId}`;
        const body = JSON.stringify({ is_active: false });
        try {
          const blob = new Blob([body], { type: 'application/json' });
          // sendBeacon is reliable during page unload
          if (!navigator.sendBeacon?.(url, blob)) {
            void fetch(url, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''}`,
                'Prefer': 'return=minimal',
              },
              body,
              keepalive: true,
            });
          }
        } catch (error) {
          logProduction('warn', {
            action: 'mark_participant_inactive',
            participantId: currentParticipantId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Mark as inactive when component unmounts (navigating away)
      if (currentParticipantId && mode === "join") {
        void SupabaseMeetingService.leaveMeeting(currentParticipantId).catch(error => {
          logProduction('warn', {
            action: 'mark_participant_inactive_unmount',
            participantId: currentParticipantId,
            error: error instanceof Error ? error.message : String(error),
          });
        });
      }
    };
  }, [currentParticipantId, mode]);

  const mockMeetingData = useMemo(() => ({
    id: serverMeeting?.id ?? "mock-id",
    title:
      serverMeeting?.title ??
      (mode === "host"
        ? "New Meeting"
        : meetingCode
          ? `Meeting ${meetingCode}`
          : "Meeting"),
    code: meetingCode,
    facilitator: serverMeeting?.facilitator ?? "Meeting Facilitator",
    facilitatorId: serverMeeting?.facilitatorId ?? null,
    createdAt: serverMeeting?.createdAt ?? new Date().toISOString(),
    isActive: serverMeeting?.isActive ?? true,
  }), [serverMeeting, mode, meetingCode]);

  const mockParticipants = useMemo(() => serverParticipants.length
    ? serverParticipants
        .filter(p => p.isActive !== false) // Only include active participants (default to active if not specified)
        .map((p) => ({
          id: p.id,
          name: p.name,
          isFacilitator: p.isFacilitator,
          hasRaisedHand: false,
          joinedAt: p.joinedAt,
          isActive: p.isActive,
        }))
    : showJohnDoe ? [
        {
          id: "1",
          name: "John Doe",
          isFacilitator: mode === "host",
          hasRaisedHand: false,
          joinedAt: new Date().toISOString(),
          isActive: true,
        },
      ] : [], [serverParticipants, showJohnDoe, mode]);

  // Determine current speaker from the actual queue (first person in queue)
  const currentSpeakerFromQueue = useMemo(() => serverQueue.length > 0 ? {
    name: serverQueue[0].participantName,
    participantName: serverQueue[0].participantName,
    startedSpeakingAt: serverQueue[0].joinedQueueAt ? new Date(serverQueue[0].joinedQueueAt) : undefined,
    speakingTime: 0,
  } : undefined, [serverQueue]);

  // ⚡ Bolt Optimization: Memoize navigation callback
  const handleLeaveMeeting = useCallback(() => navigate("/"), [navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="bg-card rounded-2xl p-6 shadow-xl border border-border text-center">
          <LoadingState 
            message="Loading meeting..." 
            size="lg"
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <ErrorState
          error={error}
          onRetry={() => {
            // For join/watch modes, clear error and go back to code entry
            if (mode === "join" || mode === "watch") {
              setError(null);
              setCodeInput("");
              window.history.replaceState(null, "", `/${window.location.pathname.split('/')[1]}?mode=${mode}`);
            } else {
              navigate("/");
            }
          }}
          showHomeButton={true}
        />
      </div>
    );
  }

  // Join flow with code and name entry UI when no code provided
  if (mode === "join" && !meetingCode) {
    return (
      <div className="container mx-auto px-4 py-8 sm:py-10 max-w-xl">
        <div className="bg-card text-card-foreground rounded-2xl p-6 sm:p-8 shadow-lg border">
          <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Join a Meeting</h1>
          <p className="text-base sm:text-sm text-muted-foreground mb-6 sm:mb-8">
            Enter your name and the 6-character meeting code shared by the host.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const codeValidation = validateMeetingCode(codeInput);
              if (!codeValidation.isValid) {
                setError(new AppError(ErrorCode.INVALID_MEETING_CODE, undefined, codeValidation.error ?? "Invalid meeting code"));
                return;
              }
              if (!participantName.trim()) {
                setError(new AppError(ErrorCode.VALIDATION_ERROR, undefined, "Please enter your name"));
                return;
              }
              navigate(`/meeting?mode=join&code=${codeValidation.normalizedCode}&name=${encodeURIComponent(participantName.trim())}`);
            }}
            className="space-y-5 sm:space-y-6"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="participant-name" className="text-sm font-medium text-foreground">
                  Your Name
                </label>
                <input
                  id="participant-name"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-4 sm:py-3 rounded-lg bg-transparent border border-border focus-ring text-base sm:text-sm min-h-[48px]"
                  aria-label="Your name"
                  autoComplete="name"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="meeting-code" className="text-sm font-medium text-foreground">
                  Meeting Code
                </label>
                <div className="flex gap-2">
                  <input
                    id="meeting-code"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    placeholder="e.g. 54ANDG"
                    className="flex-1 px-4 py-4 sm:py-3 rounded-lg bg-transparent border border-border focus-ring text-base sm:text-sm min-h-[48px]"
                    aria-label="Meeting code"
                    autoComplete="off"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                  <button
                    type="button"
                    onClick={() => setCodeInput(generateSecureRandomString(6))}
                    className="px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors min-h-[48px]"
                    title="Generate random code"
                    aria-label="Generate random meeting code"
                  >
                    🎲
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-4 sm:py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 active:bg-primary/80 min-h-[48px] text-base sm:text-sm transition-colors"
                disabled={!codeInput.trim() || !participantName.trim()}
              >
                Join Meeting
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Watch mode - show code input if no code provided
  if (mode === "watch" && !meetingCode) {
    return (
      <CodeInputForm
        mode="watch"
        onError={(formError) => {
          if (!formError) {
            setError(null);
            return;
          }

          if (formError instanceof AppError) {
            setError(formError);
            return;
          }

          setError(
            new AppError(
              ErrorCode.VALIDATION_ERROR,
              undefined,
              typeof formError === "string" ? formError : "Invalid meeting code",
            ),
          );
        }}
      />
    );
  }

  // Watch mode with meeting loaded
  if (mode === "watch") {
    // Use real speaking history data
    const speakingDistribution = getSpeakingDistribution();
    // Fallback to basic participant data if no speaking history
    const fallbackDistribution = serverParticipants.length > 0
      ? serverParticipants.map(p => ({
          name: p.name,
          value: 0 // No speaking time yet
        }))
      : [];

    return (
      <Suspense fallback={<LoadingState message="Loading watch view..." />}>
        <DisplayLayout
          meetingData={mockMeetingData}
          participants={mockParticipants}
          currentSpeaker={currentSpeakerFromQueue}
          speakingQueue={serverQueue}
          speakingDistribution={speakingDistribution.length > 0 ? speakingDistribution : fallbackDistribution}
          totalSpeakingTime={speakingHistory.reduce((sum, seg) => sum + seg.durationMs, 0) / 1000}
          averageSpeakingTime={
            speakingHistory.length > 0
              ? speakingHistory.reduce((sum, seg) => sum + seg.durationMs, 0) / speakingHistory.length / 1000
              : 0
          }
          meetingDuration={Math.floor((Date.now() - new Date(mockMeetingData.createdAt).getTime()) / 1000)}
          totalParticipants={mockParticipants.length}
          queueActivity={speakingHistory.length}
          directResponses={speakingHistory.filter(seg => seg.isDirectResponse).length}
        />
      </Suspense>
    );
  }

  // Show room creation interface for host mode when no meeting exists
  if (mode === "host" && !meetingId) {
    // If user is not authenticated, show inline name prompt first
    if (!user) {
      return (
        <div className="container mx-auto px-4 py-8 max-w-xl">
          <div className="bg-card text-card-foreground rounded-2xl p-6 sm:p-8 shadow-lg border">
            <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Host a Meeting</h1>
            <p className="text-base sm:text-sm text-muted-foreground mb-6 sm:mb-8">
              To host a meeting, we need to save your name as the facilitator.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!participantName.trim()) {
                  setError(new AppError(ErrorCode.VALIDATION_ERROR, undefined, "Please enter your name"));
                  return;
                }
                if (!codeInput.trim()) {
                  setError(new AppError(ErrorCode.VALIDATION_ERROR, undefined, "Please enter a meeting name"));
                  return;
                }
                try {
                  setIsLoading(true);
                  const { error: authError } = await signInAnonymously(participantName.trim());
                  if (authError) {
                    setError(new AppError(ErrorCode.AUTH_ERROR, authError, "Failed to authenticate"));
                    return;
                  }
                  // * User is now authenticated, will show creation form on next render
                } catch (error) {
                  setError(new AppError(
                    ErrorCode.UNKNOWN,
                    error instanceof Error ? error : undefined,
                    "An unexpected error occurred"
                  ));
                } finally {
                  setIsLoading(false);
                }
              }}
              className="space-y-5 sm:space-y-6"
            >
              <div className="space-y-2">
                <label htmlFor="facilitator-name" className="text-sm font-medium text-foreground">
                  Your Name (Facilitator)
                </label>
                <input
                  id="facilitator-name"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-4 sm:py-3 rounded-lg bg-transparent border border-border focus-ring text-base sm:text-sm min-h-[48px]"
                  aria-label="Your name as facilitator"
                  autoComplete="name"
                  autoFocus
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="meeting-name" className="text-sm font-medium text-foreground">
                  Meeting Name
                </label>
                <input
                  id="meeting-name"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="Enter meeting name"
                  className="w-full px-4 py-4 sm:py-3 rounded-lg bg-transparent border border-border focus-ring text-base sm:text-sm min-h-[48px]"
                  aria-label="Meeting name"
                  autoComplete="off"
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 sm:py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 active:bg-primary/80 min-h-[48px] text-base sm:text-sm transition-colors disabled:opacity-50"
                disabled={!participantName.trim() || isLoading}
              >
                {isLoading ? 'Authenticating...' : 'Continue'}
              </button>
            </form>
          </div>
        </div>
      );
    }

    // User is authenticated, show room creation form
    return (
      <>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Create a Meeting Room</h1>
            <p className="text-muted-foreground">
              Set up a new meeting room that anyone can discover and join
            </p>
          </div>

          <div className="bg-card rounded-lg p-6 shadow-lg border">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Room Name</label>
                <input
                  type="text"
                  placeholder="e.g. Team Standup, Strategy Session, Open Forum"
                  className="w-full px-3 py-2 border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        void handleCreateRoom();
                      }
                    }}
                />
              </div>

              <HostSettingsPanel
                isCreationMode={true}
                isLiveMeeting={false}
                setIsLiveMeeting={() => {}}
                isP2P={isP2P}
                setIsP2P={setIsP2P}
              />

                <button
                  onClick={() => {
                    void handleCreateRoom();
                  }}
                disabled={!codeInput.trim()}
                className="w-full bg-primary text-primary-foreground px-4 py-3 rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                🚀 Create Room
              </button>

              <div className="text-center pt-4 border-t">
                <button
                  onClick={() => navigate("/rooms")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back to Rooms
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={`container mx-auto px-3 sm:px-4 pt-4 sm:py-6 space-y-4 sm:space-y-6 ${mode === "join" ? "pb-28 sm:pb-6" : "pb-6"}`}>
        {/* Host Management Panel */}
        {mode === "host" && meetingId && (
          <HostSettingsPanel
            isLiveMeeting={isLiveMeeting}
            setIsLiveMeeting={setIsLiveMeeting}
            meetingCode={meetingCode}
            onQrGenerate={(url, type) => {
              setQrUrl(url);
              setQrType(type);
              setQrOpen(true);
            }}
            onScannerOpen={() => setScannerOpen(true)}
              onMeetingCodeChange={handleMeetingCodeChange}
              onEndMeeting={handleEndMeeting}
            mockParticipants={mockParticipants}
            onAddParticipant={handleAddParticipant}
            onUpdateParticipant={handleUpdateParticipant}
            onRemoveParticipant={handleRemoveParticipant}
            userRole={userRole}
          />
        )}

        <MeetingHeader
          meetingData={mockMeetingData}
          participantCount={mockParticipants.length}
          onLeaveMeeting={handleLeaveMeeting}
        />

        {/* Now Speaking Spotlight */}
        <NowSpeaking
          speakerName={currentSpeakerFromQueue?.participantName}
          startedAt={currentSpeakerFromQueue?.startedSpeakingAt}
          compact
        />

        {/* Main Content - Speaking Queue and Analytics Side by Side */}
        <div className={`grid gap-4 sm:gap-6 mb-6 ${mode === "host" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
          {/* Speaking Queue */}
          <div className={mode === "host" ? "md:col-span-1" : ""}>
            <SpeakingQueue
              speakingQueue={serverQueue}
              participantName={user?.email ?? "Current User"}
              onLeaveQueue={handleLeaveQueue}
              currentUserId={currentParticipantId}
              isFacilitator={mode === "host"}
              onReorderQueue={handleReorderQueue}
            />
          </div>

          {/* Meeting Analytics - Only visible in host mode */}
          {mode === "host" && (
            <div>
              <Suspense fallback={<div className="p-4 bg-muted rounded-lg text-center"><LoadingState size="sm" /></div>}>
                <SpeakingAnalytics
                  speakingDistribution={getSpeakingDistribution()}
                  totalSpeakingTime={speakingHistory.reduce((sum, seg) => sum + seg.durationMs, 0) / 1000}
                  averageSpeakingTime={
                    speakingHistory.length > 0
                      ? speakingHistory.reduce((sum, seg) => sum + seg.durationMs, 0) / speakingHistory.length / 1000
                      : 0
                  }
                  meetingDuration={Math.floor((Date.now() - new Date(mockMeetingData.createdAt).getTime()) / 1000)}
                  totalParticipants={mockParticipants.length}
                  queueActivity={speakingHistory.length}
                  directResponses={speakingHistory.filter(seg => seg.isDirectResponse).length}
                  currentSpeaker={currentSpeakerFromQueue?.name}
                  isHostMode={mode === "host"}
                />
              </Suspense>
            </div>
          )}
        </div>

        {/* Queue Position Feedback for participants */}
        {mode === "join" && (
          /* Participant: Personal actions view */
          <>
            <QueuePositionFeedback
              participantName={participantName || "You"}
              queuePosition={1}
              totalInQueue={serverQueue.length}
              joinedAt={new Date()}
              currentSpeaker={currentSpeakerFromQueue ? {
                participantName: currentSpeakerFromQueue.participantName ?? currentSpeakerFromQueue.name,
                startedSpeakingAt: currentSpeakerFromQueue.startedSpeakingAt
              } : undefined}
              queueHistory={[]}
            />
            <div className="hidden sm:block">
              <ActionsPanel
                isInQueue={isInQueue}
                onJoinQueue={handleJoinQueue}
                onLeaveQueue={handleLeaveQueue}
                participantName={participantName || "Current User"}
              />
            </div>
          </>
        )}

        {mode !== "host" && mode !== "join" && (
          /* Observer: Read-only queue view */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <SpeakingQueue
                speakingQueue={serverQueue}
                participantName={user?.email ?? "Observer"}
                onLeaveQueue={() => {}}
                currentUserId={undefined}
                isFacilitator={false}
              />
            </div>
            <div>
              <Suspense fallback={<div className="p-4 bg-muted rounded-lg text-center"><LoadingState size="sm" /></div>}>
                <SpeakingAnalytics
                  speakingDistribution={getSpeakingDistribution()}
                  totalSpeakingTime={speakingHistory.reduce((sum, seg) => sum + seg.durationMs, 0) / 1000}
                  averageSpeakingTime={
                    speakingHistory.length > 0
                      ? speakingHistory.reduce((sum, seg) => sum + seg.durationMs, 0) / speakingHistory.length / 1000
                      : 0
                  }
                  meetingDuration={Math.floor((Date.now() - new Date(mockMeetingData.createdAt).getTime()) / 1000)}
                  totalParticipants={mockParticipants.length}
                  queueActivity={speakingHistory.length}
                  directResponses={speakingHistory.filter(seg => seg.isDirectResponse).length}
                  currentSpeaker={currentSpeakerFromQueue?.name}
                  isHostMode={false}
                />
              </Suspense>
            </div>
          </div>
        )}
      </div>

      {mode === "join" && (
        <MobileActionBar
          isInQueue={isInQueue}
          onJoinQueue={handleJoinQueue}
          onLeaveQueue={handleLeaveQueue}
        />
      )}

      <>
        {/* QR Code Scanner */}
      {scannerOpen && (
        <Suspense fallback={null}>
          <QrCodeScanner
            onScan={handleQrScan}
            onClose={() => setScannerOpen(false)}
          />
        </Suspense>
      )}

      {/* Keyboard Shortcuts Modal */}
      <Suspense fallback={null}>
        <KeyboardShortcutsModal
          isOpen={showKeyboardShortcutsModal}
          onClose={() => setShowKeyboardShortcutsModal(false)}
          isHost={mode === "host"}
        />
      </Suspense>

      {/* QR Code Dialog */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-md bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {qrType === 'join' ? 'Join via QR code' : 'Watch via QR code'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {qrType === 'join'
                ? 'Scan this QR code with your phone to join the meeting as a participant.'
                : 'Scan this QR code with your phone to observe the meeting remotely.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-4">
            {qrUrl && (
              <div className="bg-card p-4 rounded-lg shadow-sm border border-border">
                <img
                  src={qrUrl}
                  alt={`${qrType === 'join' ? 'Join' : 'Watch'} QR Code`}
                  className="w-48 h-48 sm:w-64 sm:h-64"
                />
              </div>
            )}
          </div>
          <div className="text-center text-sm text-muted-foreground">
            {qrType === 'join'
              ? 'Participants can scan this code to join the speaking queue.'
              : 'Observers can scan this code to watch the meeting remotely.'
            }
          </div>
        </DialogContent>
      </Dialog>
      </>
    </>
  );
}
