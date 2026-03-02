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
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { useState } from "react";

interface EndMeetingDialogProps {
  onConfirm: () => Promise<void>;
  meetingTitle?: string;
  participantCount?: number;
}

export function EndMeetingDialog({ 
  onConfirm, 
  meetingTitle,
  participantCount = 0 
}: EndMeetingDialogProps) {
  const [isEnding, setIsEnding] = useState(false);
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    setIsEnding(true);
    try {
      await onConfirm();
    } finally {
      setIsEnding(false);
      setOpen(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="destructive" 
          size="sm"
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          End Meeting
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>End this meeting?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              This will permanently close{" "}
              {meetingTitle ? (
                <span className="font-semibold text-foreground">"{meetingTitle}"</span>
              ) : (
                "this meeting"
              )}.
            </p>
            {participantCount > 0 && (
              <p className="text-warning">
                {participantCount} participant{participantCount !== 1 ? "s" : ""} will be disconnected.
              </p>
            )}
            <p className="text-muted-foreground text-xs mt-2">
              This action cannot be undone.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isEnding}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              void handleConfirm();
            }}
            disabled={isEnding}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isEnding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ending...
              </>
            ) : (
              "End Meeting"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
