import { useState } from "react";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddParticipants } from "@/components/features/meeting/AddParticipants";
import { ParticipantList } from "@/components/features/meeting/ParticipantList";
import { useToast } from "@/hooks/use-toast";
import { copyMeetingLink } from "@/utils/clipboard";
import { generateSecureRandomString } from "@/utils/security";
import QRCode from "qrcode";
import { RefreshCw, Edit3, Check, X, AlertTriangle, Copy, Wifi, WifiOff } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface HostSettingsPanelProps {
  isLiveMeeting: boolean;
  setIsLiveMeeting: (live: boolean) => void;
  meetingCode?: string;
  onQrGenerate?: (url: string, type: 'join' | 'watch') => void;
  onScannerOpen?: () => void;
  onMeetingCodeChange?: (newCode: string) => Promise<void>;
  onEndMeeting?: () => void;
  // * Participant management props
  mockParticipants?: Array<{ id: string; name: string; isFacilitator: boolean; hasRaisedHand: boolean; joinedAt: string; isActive: boolean }>;
  onAddParticipant?: (name: string) => Promise<void>;
  onUpdateParticipant?: (participantId: string, newName: string) => Promise<void>;
  onRemoveParticipant?: (participantId: string) => Promise<void>;
  userRole?: string;
  // * P2P props
  isP2P?: boolean;
  setIsP2P?: (isP2P: boolean) => void;
  isCreationMode?: boolean;
}

/**
 * * Component for host meeting settings and participant management
 * Provides toggles for meeting settings, sharing options, and participant management
 */
export function HostSettingsPanel({
  isLiveMeeting,
  setIsLiveMeeting,
  meetingCode = "",
  onQrGenerate,
  onScannerOpen: _onScannerOpen,
  onMeetingCodeChange,
  onEndMeeting,
  // * Participant management props
  mockParticipants = [],
  onAddParticipant,
  onUpdateParticipant,
  onRemoveParticipant,
  userRole,
  // * P2P props
  isP2P = false,
  setIsP2P,
  isCreationMode = false,
}: HostSettingsPanelProps) {
  const { toast } = useToast();
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [codeInput, setCodeInput] = useState(meetingCode);
  const [copiedJoin, setCopiedJoin] = useState(false);
  const [copiedWatch, setCopiedWatch] = useState(false);

  const handleCopyLink = async (type: 'join' | 'watch') => {
    if (!meetingCode) return;
    await copyMeetingLink(meetingCode, type);
    
    if (type === 'join') {
      setCopiedJoin(true);
      setTimeout(() => setCopiedJoin(false), 2000);
    } else {
      setCopiedWatch(true);
      setTimeout(() => setCopiedWatch(false), 2000);
    }
    
    toast({
      title: "Copied!",
      description: `${type === 'join' ? 'Join' : 'Watch'} link copied to clipboard`,
    });
  };

  const handleStartEditing = () => {
    setCodeInput(meetingCode);
    setIsEditingCode(true);
  };

  const handleCancelEditing = () => {
    setCodeInput(meetingCode);
    setIsEditingCode(false);
  };

  const handleSaveCode = async () => {
    if (!codeInput.trim()) return;
    if (onMeetingCodeChange) {
      await onMeetingCodeChange(codeInput.trim().toUpperCase());
    }
    setIsEditingCode(false);
  };

  const handleRegenerateCode = async () => {
    const newCode = generateSecureRandomString(6);
    if (onMeetingCodeChange) {
      await onMeetingCodeChange(newCode);
    }
    setCodeInput(newCode);
  };

  const handleGenerateQr = async (type: 'join' | 'watch') => {
    if (!meetingCode || !onQrGenerate) return;
    
    const link = `${window.location.origin}/meeting?mode=${type}&code=${meetingCode}`;
    const dataUrl = await QRCode.toDataURL(link, {
      width: 256,
      margin: 2,
    });
    onQrGenerate(dataUrl, type);
  };

  return (
    <div className="bg-muted/30 text-muted-foreground rounded-lg p-3 border border-border/50 mb-4">
        <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-medium text-foreground">Meeting Settings</h3>
          <div className="flex items-center gap-3 flex-wrap">
            {setIsP2P && (
              <div className="flex items-center gap-3">
                <Toggle
                  checked={isP2P}
                  onCheckedChange={setIsP2P}
                  size="sm"
                  aria-label="Toggle P2P mode"
                />
                <span className="text-sm font-medium flex items-center gap-2">
                   {isP2P ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                   P2P Mode
                </span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Toggle
                checked={isLiveMeeting}
                onCheckedChange={setIsLiveMeeting}
                size="sm"
                aria-label="Toggle live meeting mode"
              />
              <span className="text-sm font-medium">Live Meeting</span>
            </div>
          </div>
        </div>
      </div>

      {/* End Meeting Button */}
      {!isCreationMode && onEndMeeting && (
        <div className="mb-4 pt-2 border-t border-border/50">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                aria-label="End meeting for all participants"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                End Meeting
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>End Meeting?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will end the meeting for all participants. The meeting will be marked as inactive and participants will no longer be able to join. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onEndMeeting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  End Meeting
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Meeting Code Display and Editing */}
      {!isCreationMode && (
      <div className="mt-4 pt-4 border-t border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
          <label className="text-sm font-medium text-foreground">Meeting Code</label>
          <div className="flex items-center gap-2">
            {isEditingCode ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void handleSaveCode();
                  }}
                  disabled={!codeInput.trim()}
                  aria-label="Save meeting code"
                >
                  <Check className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEditing}
                  aria-label="Cancel editing"
                >
                  <X className="w-3 h-3" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleStartEditing}
                  disabled={!onMeetingCodeChange}
                  aria-label="Edit meeting code"
                >
                  <Edit3 className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void handleRegenerateCode();
                  }}
                  disabled={!onMeetingCodeChange}
                  title="Generate new random code"
                  aria-label="Generate new random code"
                >
                  <RefreshCw className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
        </div>

        {isEditingCode ? (
          <Input
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            className="font-mono text-center text-lg tracking-wider"
            maxLength={6}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                void handleSaveCode();
              }
              if (e.key === 'Escape') handleCancelEditing();
            }}
          />
        ) : (
          <div className="flex items-center justify-center">
            <code className="px-4 py-2 bg-primary/10 text-primary font-mono text-xl tracking-wider rounded border">
              {meetingCode}
            </code>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-2 text-center">
          Share this code with participants to join your meeting
        </p>
      </div>
      )}

      <div className="text-xs text-muted-foreground mt-4">
        {isCreationMode ? (
           <>
             {isP2P ? (
                <p><strong>P2P Mode:</strong> Meeting data is synced directly between peers (no central server).</p>
             ) : (
                <p><strong>Supabase Mode:</strong> Meeting data is stored on a central server.</p>
             )}
           </>
        ) : (
           <>
            <p><strong>Live Meeting:</strong> Meeting is active and participants can join remotely</p>
            <p><strong>Local/Manual:</strong> Meeting is for in-person facilitation only</p>
           </>
        )}
      </div>
      
      {!isCreationMode && isLiveMeeting && (
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Join link</span>
            <button
              className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-muted hover:bg-muted/80 text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Copy join link to clipboard"
              onClick={() => void handleCopyLink('join')}
            >
              {copiedJoin ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
              {copiedJoin ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <code className="block break-all p-2 rounded bg-muted text-xs text-foreground">
            {`${window.location.origin}/meeting?mode=join&code=${meetingCode}`}
          </code>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Watch link</span>
            <button
              className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-muted hover:bg-muted/80 text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Copy watch link to clipboard"
              onClick={() => void handleCopyLink('watch')}
            >
              {copiedWatch ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
              {copiedWatch ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <code className="block break-all p-2 rounded bg-muted text-xs text-foreground">
            {`${window.location.origin}/meeting?mode=watch&code=${meetingCode}`}
          </code>
          
          <div className="pt-2 space-y-2">
            <div className="flex gap-2">
              <button
                className="flex-1 py-1.5 px-2 rounded bg-muted hover:bg-muted/80 text-foreground text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                disabled={!meetingCode}
                aria-label="Generate QR code for joining this meeting"
                onClick={() => void handleGenerateQr('join')}
              >
                📱 Join QR
              </button>
              <button
                className="flex-1 py-1.5 px-2 rounded bg-muted hover:bg-muted/80 text-foreground text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                disabled={!meetingCode}
                aria-label="Generate QR code for watching this meeting"
                onClick={() => void handleGenerateQr('watch')}
              >
                👁️ Watch QR
              </button>
            </div>
          </div>
        </div>
      )}
      
      {!isCreationMode && !isLiveMeeting && (
        <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
          <p><strong>Local Meeting Mode:</strong> This meeting is set to local/manual mode. Enable "Live Meeting" to allow remote participants to join.</p>
        </div>
      )}

      {/* Participant Management Section */}
      {!isCreationMode && onAddParticipant && onUpdateParticipant && onRemoveParticipant && (
      <div className="bg-card text-card-foreground rounded-xl p-4 shadow-lg border mt-4">
        <div className="mb-4">
          <h2 className="text-base font-semibold">Participant Management</h2>
          <p className="text-xs text-muted-foreground">
            Add, edit, and manage meeting participants
          </p>
        </div>
        
        <div className="space-y-4">
          {/* Add Participants */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-2">Add Participants</h3>
            <AddParticipants
              onAddParticipant={onAddParticipant}
              placeholder="Enter participant names (comma or newline separated)"
              className="w-full"
            />
          </div>

          {/* Participant List */}
          <ParticipantList
            participants={mockParticipants}
            onUpdateParticipant={onUpdateParticipant}
            onRemoveParticipant={onRemoveParticipant}
            userRole={userRole}
          />
        </div>
      </div>
      )}
    </div>
  );
}