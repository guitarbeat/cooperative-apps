import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Users, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SupabaseMeetingService } from "@/services/supabase";
import { useToast } from "@/hooks/use-toast";
import { nameSchema } from "@/utils/schemas";

interface QuickJoinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomCode: string;
  roomTitle: string;
  mode: "join" | "watch";
}

export function QuickJoinModal({
  open,
  onOpenChange,
  roomCode,
  roomTitle,
  mode,
}: QuickJoinModalProps) {
  const navigate = useNavigate();
  const { user, signInAnonymously } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [hasExistingName, setHasExistingName] = useState(false);

  // Load saved name from localStorage and auto-join if valid
  useEffect(() => {
    const savedName = localStorage.getItem("user_display_name");
    if (savedName) {
      setDisplayName(savedName);
      const result = nameSchema.safeParse(savedName);
      setHasExistingName(result.success);
    }
  }, []);

  const handleNameChange = (value: string) => {
    setDisplayName(value);
    if (value.length > 0) {
      const result = nameSchema.safeParse(value);
      setNameError(result.success ? null : result.error.errors[0].message);
    } else {
      setNameError(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (mode === "watch") {
      // Watch mode doesn't need a name
      navigate(`/watch/${roomCode}`);
      onOpenChange(false);
      return;
    }

    // Join mode requires name validation
    const nameResult = nameSchema.safeParse(displayName);
    if (!nameResult.success) {
      setNameError(nameResult.error.errors[0].message);
      return;
    }

    setIsJoining(true);

    try {
      // Ensure user is authenticated
      if (!user) {
        await signInAnonymously(displayName.trim());
      }

      // Save name to localStorage
      localStorage.setItem("user_display_name", displayName.trim());

      // Join the meeting
      await SupabaseMeetingService.joinMeeting(roomCode, displayName.trim());

      toast({
        title: "Joined meeting",
        description: `You've joined "${roomTitle}"`,
      });

      navigate(`/meeting?code=${roomCode}&mode=join`);
      onOpenChange(false);
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

  const isValid = mode === "watch" || (displayName.length > 0 && !nameError);

  // Skip the modal entirely if we have a valid name - just join directly
  const showNameInput = mode === "join" && !hasExistingName;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "join" ? (
              <Users className="h-5 w-5 text-primary" />
            ) : (
              <Eye className="h-5 w-5 text-primary" />
            )}
            {mode === "join" ? "Join Discussion" : "Watch Meeting"}
          </DialogTitle>
          <DialogDescription>
            {showNameInput
              ? `Enter your name to join "${roomTitle}"`
              : mode === "join"
              ? `Join "${roomTitle}" as ${displayName}`
              : `You're about to watch "${roomTitle}"`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {showNameInput && (
            <div className="space-y-2">
              <Label htmlFor="quick-join-name">Your Name</Label>
              <Input
                id="quick-join-name"
                value={displayName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Enter your display name"
                autoFocus
                maxLength={50}
                className={nameError ? "border-destructive" : ""}
              />
              <div className="flex justify-between text-xs">
                <span className={nameError ? "text-destructive" : "text-muted-foreground"}>
                  {nameError || "How others will see you"}
                </span>
                <span className="text-muted-foreground">{displayName.length}/50</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isJoining} className="flex-1">
              {isJoining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : mode === "join" ? (
                "Join Now"
              ) : (
                "Start Watching"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
