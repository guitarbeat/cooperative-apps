import { useState, useEffect, type Dispatch, type SetStateAction } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { AppError, ErrorCode } from "@/utils/errorHandling";
import { validateMeetingCode } from "@/utils/schemas";
import { SupabaseMeetingService } from "@/services/supabase";
import type { MeetingWithParticipants, Participant, QueueItem, MeetingMode } from "@/types/meeting";
import { logProduction } from "@/utils/productionLogger";

interface UseMeetingStateReturn {
  // * Core meeting state
  meetingCode: string;
  setMeetingCode: (code: string) => void;
  meetingId: string;
  setMeetingId: (id: string) => void;
  mode: MeetingMode | null;
  setMode: (mode: MeetingMode | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: AppError | string | null;
  codeInput: string;
  setCodeInput: (code: string) => void;
  participantName: string;
  setParticipantName: (name: string) => void;
  setError: (error: AppError | string | null) => void;
  
  // * Server state
  serverMeeting: MeetingWithParticipants | null;
  setServerMeeting: Dispatch<SetStateAction<MeetingWithParticipants | null>>;
  serverParticipants: Participant[];
  setServerParticipants: Dispatch<SetStateAction<Participant[]>>;
  serverQueue: QueueItem[];
  setServerQueue: Dispatch<SetStateAction<QueueItem[]>>;
  currentParticipantId: string;
  setCurrentParticipantId: (id: string) => void;
  
  // * UI state
  isLiveMeeting: boolean;
  setIsLiveMeeting: (live: boolean) => void;
  showJohnDoe: boolean;
  setShowJohnDoe: (show: boolean) => void;
  
  // * Speaker management
  lastSpeaker: QueueItem | null;
  setLastSpeaker: (speaker: QueueItem | null) => void;
  
  // * QR/Scanner state
  qrOpen: boolean;
  setQrOpen: (open: boolean) => void;
  qrUrl: string;
  setQrUrl: (url: string) => void;
  qrType: 'join' | 'watch';
  setQrType: (type: 'join' | 'watch') => void;
  scannerOpen: boolean;
  setScannerOpen: (open: boolean) => void;
  
  // * Computed values
  userRole: string;
}

/**
 * * Custom hook for managing meeting state and initialization
 * Centralizes all meeting-related state management and initialization logic
 */
export function useMeetingState(): UseMeetingStateReturn {
  const [searchParams] = useSearchParams();
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // * Core meeting state
  const [meetingCode, setMeetingCode] = useState<string>("");
  const [meetingId, setMeetingId] = useState<string>("");
  const [mode, setMode] = useState<MeetingMode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AppError | string | null>(null);
  const [codeInput, setCodeInput] = useState<string>("");
  // Load saved name from localStorage if available
  const [participantName, setParticipantName] = useState<string>(() => {
    try {
      return localStorage.getItem("user_display_name") ?? "";
    } catch {
      return "";
    }
  });
  
  // * Server state
  const [serverMeeting, setServerMeeting] = useState<MeetingWithParticipants | null>(null);
  const [serverParticipants, setServerParticipants] = useState<Participant[]>([]);
  const [serverQueue, setServerQueue] = useState<QueueItem[]>([]);
  const [currentParticipantId, setCurrentParticipantId] = useState<string>("");
  
  // * UI state
  const [isLiveMeeting, setIsLiveMeeting] = useState<boolean>(false);
  const [showJohnDoe, setShowJohnDoe] = useState(true);
  
  // * Speaker management
  const [lastSpeaker, setLastSpeaker] = useState<QueueItem | null>(null);
  
  // * QR/Scanner state
  const [qrOpen, setQrOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [qrType, setQrType] = useState<'join' | 'watch'>('join');
  const [scannerOpen, setScannerOpen] = useState(false);

  // * Determine user role based on mode
  const userRole = mode === "host" ? "facilitator" : mode === "watch" ? "observer" : "participant";

  // * Initialize meeting based on URL parameters
  useEffect(() => {
    // * Handle /watch/:code route
    if (params.code) {
      setMode("watch");
      setMeetingCode(params.code);
    } else {
      const modeParam = searchParams.get("mode") as MeetingMode;
      const codeParam = searchParams.get("code");
      const nameParam = searchParams.get("name");

      if (!modeParam || !["host", "join", "watch"].includes(modeParam)) {
        setError(new AppError(ErrorCode.INVALID_OPERATION, undefined, "Invalid meeting mode. Please use host, join, or watch."));
        setIsLoading(false);
        return;
      }

      setMode(modeParam);

      // * For join mode, extract participant name from URL if provided
      if (modeParam === "join" && nameParam) {
        setParticipantName(decodeURIComponent(nameParam));
      }

      // * For join/watch modes, we need a meeting code; for host mode, code is optional
      if ((modeParam === "join" || modeParam === "watch") && !codeParam) {
        // * Will show code input form in render logic
        setIsLoading(false);
        return;
      }
    }

    // * Check for facilitator rejoin toast on mount
    const shouldShowRejoinToast = sessionStorage.getItem("facilitator_rejoin_toast");
    if (shouldShowRejoinToast) {
      sessionStorage.removeItem("facilitator_rejoin_toast");
      toast({
        title: "Welcome back, facilitator!",
        description: "You've been restored as the meeting host.",
        variant: "success",
      });
    }

    // * Bootstrap meeting based on mode
    const bootstrap = async () => {
      try {
        const currentMode = params.code ? "watch" : (searchParams.get("mode") as MeetingMode);
        const currentCode = params.code ?? searchParams.get("code");
        const currentName = searchParams.get("name");

        if (currentMode === "host") {
          await handleHostMode(setMeetingId, setMeetingCode, setServerMeeting, setServerParticipants, setServerQueue);
        } else if (currentCode) {
          await handleJoinOrWatchMode(
            currentMode as MeetingMode,
            currentCode,
            currentName ? decodeURIComponent(currentName) : "",
            user,
            setError,
            setMeetingId,
            setMeetingCode,
            setServerMeeting,
            setServerParticipants,
            setServerQueue,
            setCurrentParticipantId
          );
        }
      } catch (error) {
        logProduction("error", {
          action: "bootstrap_meeting",
          error: error instanceof Error ? error.message : String(error),
        });
        setError(new AppError(ErrorCode.CONNECTION_FAILED, undefined, "Failed to connect to meeting."));
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrap();
  }, [searchParams, user?.email, params.code, user, toast]);

  return {
    // * Core meeting state
    meetingCode,
    setMeetingCode,
    meetingId,
    setMeetingId,
    mode,
    setMode,
    isLoading,
    setIsLoading,
    error,
    codeInput,
    setCodeInput,
    participantName,
    setParticipantName,
    setError,
    
    // * Server state
    serverMeeting,
    setServerMeeting,
    serverParticipants,
    setServerParticipants,
    serverQueue,
    setServerQueue,
    currentParticipantId,
    setCurrentParticipantId,
    
    // * UI state
    isLiveMeeting,
    setIsLiveMeeting,
    showJohnDoe,
    setShowJohnDoe,
    
    // * Speaker management
    lastSpeaker,
    setLastSpeaker,
    
    // * QR/Scanner state
    qrOpen,
    setQrOpen,
    qrUrl,
    setQrUrl,
    qrType,
    setQrType,
    scannerOpen,
    setScannerOpen,
    
    // * Computed values
    userRole,
  };
}

/**
 * * Handles host mode initialization
 * Creates a new meeting and sets up initial state
 */
async function handleHostMode(
  setMeetingId: (id: string) => void,
  setMeetingCode: (code: string) => void,
  setServerMeeting: Dispatch<SetStateAction<MeetingWithParticipants | null>>,
  setServerParticipants: Dispatch<SetStateAction<Participant[]>>,
  setServerQueue: Dispatch<SetStateAction<QueueItem[]>>
) {
  // Don't automatically create a meeting - let the user create one manually
  // This allows users to choose custom room names and only create when ready
  setMeetingId("");
  setMeetingCode("");
  setServerMeeting(null);
  setServerParticipants([]);
  setServerQueue([]);
}

/**
 * * Handles join or watch mode initialization
 * Validates meeting code and joins meeting if in join mode
 */
async function handleJoinOrWatchMode(
  currentMode: MeetingMode,
  currentCode: string,
  participantName: string,
  user: User | null,
  setError: (error: AppError | string | null) => void,
  setMeetingId: (id: string) => void,
  setMeetingCode: (code: string) => void,
  setServerMeeting: Dispatch<SetStateAction<MeetingWithParticipants | null>>,
  setServerParticipants: Dispatch<SetStateAction<Participant[]>>,
  setServerQueue: Dispatch<SetStateAction<QueueItem[]>>,
  setCurrentParticipantId: (id: string) => void
) {
  try {
    // * Validate meeting code before making API call
    const validation = validateMeetingCode(currentCode);
    if (!validation.isValid) {
      setError(new AppError(ErrorCode.INVALID_MEETING_CODE, undefined, validation.error ?? "Invalid meeting code format"));
      return;
    }

    const full = await SupabaseMeetingService.getMeeting(validation.normalizedCode);
    if (!full) {
      setError(new AppError(ErrorCode.MEETING_NOT_FOUND, undefined, `Meeting "${validation.normalizedCode}" not found or inactive. Please check the code and try again.`));
      return;
    }
    
    setMeetingId(full.id);
    setMeetingCode(full.code);
    setServerMeeting(full);
    setServerParticipants(full.participants);
    setServerQueue(full.speakingQueue);

    // * For JOIN mode, create participant if meeting exists
    if (currentMode === "join") {
      const trimmedParticipantName = participantName?.trim();
      try {
        // Use provided participant name or fallback to user email or generated name
        const finalParticipantName = trimmedParticipantName && trimmedParticipantName.length > 0
          ? trimmedParticipantName
          : user?.email ?? `Participant-${Date.now()}`;
        
        // joinMeeting auto-detects facilitator status based on name match
        const participant = await SupabaseMeetingService.joinMeeting(
          validation.normalizedCode,
          finalParticipantName,
          false // Let the service auto-detect facilitator status
        );
        
        // * Store the current participant ID for queue operations
        setCurrentParticipantId(participant.id);
        // * Add the new participant to the list
        setServerParticipants(prev => [...prev, participant]);
        
        // * If user rejoined as facilitator (name matched), redirect to host mode
        if (participant.isFacilitator) {
          logProduction("info", {
            action: "facilitator_rejoin_detected",
            meetingCode: validation.normalizedCode,
            participantName: finalParticipantName,
          });
          
          // Show toast notification about facilitator upgrade
          // Store in sessionStorage so it shows after reload
          sessionStorage.setItem("facilitator_rejoin_toast", "true");
          
          // Redirect to host mode by updating URL
          window.history.replaceState(
            null, 
            "", 
            `/meeting?code=${validation.normalizedCode}&mode=host`
          );
          // Force page reload to reinitialize with host mode
          window.location.reload();
        }
      } catch (joinError) {
        logProduction("error", {
          action: "join_meeting_participant",
          meetingCode: validation.normalizedCode,
          participantName: trimmedParticipantName && trimmedParticipantName.length > 0
            ? trimmedParticipantName
            : user?.email ?? `Participant-${Date.now()}`,
          error: joinError instanceof Error ? joinError.message : String(joinError)
        });
        
        // * Provide more specific error messages based on error type
        if (joinError instanceof AppError) {
          setError(joinError);
        } else {
          setError(new AppError(ErrorCode.MEETING_ACCESS_DENIED, undefined, "Failed to join meeting. Please try again."));
        }
      }
    }
  } catch (fetchError) {
    logProduction("error", {
      action: "fetch_meeting",
      meetingCode: currentCode,
      mode: currentMode,
      error: fetchError instanceof Error ? fetchError.message : String(fetchError)
    });
    
    // * Provide more specific error messages based on error type
    if (fetchError instanceof AppError) {
      setError(fetchError);
    } else {
      setError(new AppError(ErrorCode.CONNECTION_FAILED, undefined, "Unable to connect to meeting. Please check your internet connection and try again."));
    }
  }
}