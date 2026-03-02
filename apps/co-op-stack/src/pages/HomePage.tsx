import { useState, useRef, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { InlineRoomBrowser } from "@/components/InlineRoomBrowser";
import Confetti from "@/components/ui/Confetti";
import { QrCodeScanner } from "@/components/ui/qr-code-scanner";
import { useAuth } from "@/hooks/useAuth";
import { SupabaseMeetingService } from "@/services/supabase";
import { useToast } from "@/hooks/use-toast";
import { nameSchema, roomCodeSchema, titleSchema } from "@/utils/schemas";
import { 
  Users, 
  Eye, 
  Plus, 
  Loader2, 
  QrCode, 
  ArrowRight,
  Sparkles,
  Hand,
  CheckCircle2
} from "lucide-react";

export default function HomePage() { 
  const navigate = useNavigate();
  const { user, signInAnonymously } = useAuth();
  const { toast } = useToast();

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [rememberName, setRememberName] = useState(true);
  
  // Error state
  const [nameError, setNameError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  
  // UI state
  const [isJoining, setIsJoining] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [codeComplete, setCodeComplete] = useState(false);

  // Refs
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Load saved name from localStorage
  useEffect(() => {
    try {
      const savedName = localStorage.getItem("user_display_name");
      if (savedName) {
        setDisplayName(savedName);
      }
    } catch {
      // localStorage may be unavailable in restricted environments
    }
  }, []);

  // Handlers
  const handleNameChange = (value: string) => {
    setDisplayName(value);
    if (value.length > 0) {
      const result = nameSchema.safeParse(value);
      setNameError(result.success ? null : result.error.errors[0].message);
    } else {
      setNameError(null);
    }
  };

  const handleCodeChange = (value: string) => {
    const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    setRoomCode(normalized);
    
    if (normalized.length === 6) {
      const result = roomCodeSchema.safeParse(normalized);
      if (result.success) {
        setCodeError(null);
        setCodeComplete(true);
      } else {
        setCodeError(result.error.errors[0].message);
        setCodeComplete(false);
      }
    } else {
      setCodeError(null);
      setCodeComplete(false);
    }
  };

  const handleTitleChange = (value: string) => {
    setMeetingTitle(value);
    if (value.length > 0) {
      const result = titleSchema.safeParse(value);
      setTitleError(result.success ? null : result.error.errors[0].message);
    } else {
      setTitleError(null);
    }
  };

  const handleQrScan = (data: string) => {
    const urlMatch = data.match(/[?&]code=([A-Za-z0-9]{6})/i);
    const watchMatch = data.match(/\/watch\/([A-Za-z0-9]{6})/i);
    const code = urlMatch?.[1] || watchMatch?.[1] || data;
    
    if (code && /^[A-Za-z0-9]{6}$/.test(code)) {
      handleCodeChange(code.toUpperCase());
      setShowQrScanner(false);
      toast({
        title: "Code scanned!",
        description: `Room code: ${code.toUpperCase()}`,
      });
    }
  };

  const saveName = () => {
    try {
      if (rememberName && displayName.trim()) {
        localStorage.setItem("user_display_name", displayName.trim());
      }
    } catch {
      // localStorage may be unavailable
    }
  };

  const handleJoin = async () => {
    const codeResult = roomCodeSchema.safeParse(roomCode);
    const nameResult = nameSchema.safeParse(displayName);
    
    if (!codeResult.success) {
      setCodeError(codeResult.error.errors[0].message);
      return;
    }
    if (!nameResult.success) {
      setNameError(nameResult.error.errors[0].message);
      return;
    }

    setIsJoining(true);

    try {
      if (!user) {
        await signInAnonymously(displayName.trim());
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }

      saveName();
      await SupabaseMeetingService.joinMeeting(roomCode, displayName.trim());

      toast({
        title: "Joined meeting",
        description: "You're now in the discussion",
      });

      navigate(`/meeting?code=${roomCode}&mode=join`);
    } catch (error) {
      toast({
        title: "Failed to join",
        description: error instanceof Error ? error.message : "Could not join meeting",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleWatch = () => {
    const codeResult = roomCodeSchema.safeParse(roomCode);
    if (!codeResult.success) {
      setCodeError(codeResult.error.errors[0].message);
      return;
    }
    setIsWatching(true);
    navigate(`/watch/${roomCode}`);
  };

  const handleCreateRoom = async (e: FormEvent) => {
    e.preventDefault();
    
    const nameResult = nameSchema.safeParse(displayName);
    const titleResult = titleSchema.safeParse(meetingTitle);
    
    if (!nameResult.success) {
      setNameError(nameResult.error.errors[0].message);
      return;
    }
    if (!titleResult.success) {
      setTitleError(titleResult.error.errors[0].message);
      return;
    }

    setIsCreating(true);

    try {
      if (!user) {
        await signInAnonymously(displayName.trim());
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }

      saveName();

      const meeting = await SupabaseMeetingService.createMeeting(
        meetingTitle.trim(),
        displayName.trim(),
        user?.id
      );

      toast({
        title: "Room created!",
        description: `Your room code is ${meeting.code}`,
      });

      navigate(`/meeting?code=${meeting.code}&mode=host`);
    } catch (error) {
      toast({
        title: "Failed to create room",
        description: error instanceof Error ? error.message : "Could not create room",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Derived state
  const hasValidName = displayName.length > 0 && !nameError;
  const hasValidCode = roomCode.length === 6 && !codeError;
  const canJoin = hasValidName && hasValidCode;
  const canWatch = hasValidCode;
  const canHost = hasValidName && meetingTitle.length >= 3 && !titleError;

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gradient-to-b from-background via-background to-muted/20">
      {showConfetti && <Confetti />}
      
      <div className="container mx-auto px-4 py-6 sm:py-10 max-w-2xl">
        {/* Hero Section */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-3">
            <Hand className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 tracking-tight">
            Speaking Queue
          </h1>
          <p className="text-muted-foreground">
            Fair, orderly discussions for meetings
          </p>
        </div>

        <div className="space-y-5">
          {/* Name Input - First and Most Prominent */}
          <Card className="shadow-lg border-2 border-primary/20 bg-card">
            <CardContent className="pt-5 pb-5">
              <Label htmlFor="name" className="text-base font-semibold mb-2 block">
                What's your name?
              </Label>
              <div className="flex gap-2">
                <Input
                  id="name"
                  value={displayName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Enter your name..."
                  maxLength={50}
                  autoFocus
                  className={`text-lg h-12 flex-1 ${
                    hasValidName 
                      ? "border-success bg-success/5" 
                      : nameError 
                        ? "border-destructive" 
                        : ""
                  }`}
                />
                {hasValidName && (
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-success/10 text-success">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center mt-2 text-sm">
                <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberName}
                    onChange={(e) => setRememberName(e.target.checked)}
                    className="rounded border-border accent-primary"
                  />
                  Remember me
                </label>
                <span className={nameError ? "text-destructive" : "text-muted-foreground"}>
                  {nameError || ""}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Join/Watch a Room */}
          <Card className="shadow-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Join a Room
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Room Code Input */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    ref={codeInputRef}
                    value={roomCode}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder="ABCD12"
                    maxLength={6}
                    className={`font-mono text-center text-xl uppercase tracking-[0.25em] h-12 ${
                      codeComplete && !codeError
                        ? "border-success bg-success/5"
                        : codeError
                          ? "border-destructive"
                          : ""
                    }`}
                  />
                  {codeComplete && !codeError && (
                    <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-success" />
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowQrScanner(true)}
                  className="h-12 w-12 shrink-0"
                  title="Scan QR Code"
                >
                  <QrCode className="h-5 w-5" />
                </Button>
              </div>
              
              {codeError && (
                <p className="text-sm text-destructive text-center">{codeError}</p>
              )}

              {/* Action Buttons - Always Visible */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleJoin}
                  disabled={!canJoin || isJoining}
                  size="lg"
                  className="h-11"
                >
                  {isJoining ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Users className="mr-2 h-4 w-4" />
                  )}
                  Join & Speak
                </Button>
                <Button
                  onClick={handleWatch}
                  disabled={!canWatch || isWatching}
                  variant="secondary"
                  size="lg"
                  className="h-11"
                >
                  {isWatching ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="mr-2 h-4 w-4" />
                  )}
                  Watch Only
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Create a Room */}
          <Card className="shadow-card border-dashed border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Start Your Own
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateRoom} className="space-y-3">
                <Input
                  value={meetingTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Meeting title (e.g., Team Standup)"
                  maxLength={100}
                  className={`h-11 ${titleError ? "border-destructive" : ""}`}
                />
                {titleError && (
                  <p className="text-sm text-destructive">{titleError}</p>
                )}
                <Button
                  type="submit"
                  disabled={!canHost || isCreating}
                  size="lg"
                  className="w-full h-11"
                >
                  {isCreating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  Create & Host
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Active Rooms Browser */}
          <InlineRoomBrowser />
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showQrScanner && (
        <QrCodeScanner
          onScan={handleQrScan}
          onClose={() => setShowQrScanner(false)}
        />
      )}
    </div>
  );
}
