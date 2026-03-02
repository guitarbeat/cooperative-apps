import { memo } from "react";
import { ParticipantAvatar } from "@/components/ui/participant-avatar";
import { SpeakerTimer } from "./SpeakerTimer";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface NowSpeakingProps {
  speakerName?: string;
  startedAt?: Date;
  className?: string;
  compact?: boolean;
}

export const NowSpeaking = memo(({ speakerName, startedAt, className, compact = false }: NowSpeakingProps) => {
  if (!speakerName) {
    return (
      <Card className={cn("border-border/50 bg-muted/30", className)}>
        <CardContent className={cn("flex items-center gap-4", compact ? "p-4" : "p-6")}>
          <div className={cn(
            "rounded-full bg-muted flex items-center justify-center",
            compact ? "w-10 h-10" : "w-14 h-14"
          )}>
            <MicOff className={cn("text-muted-foreground", compact ? "w-5 h-5" : "w-7 h-7")} />
          </div>
          <div>
            <p className={cn("font-semibold text-muted-foreground", compact ? "text-sm" : "text-lg")}>
              No one speaking
            </p>
            <p className="text-xs text-muted-foreground">Waiting for the next speaker</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5 shadow-lg animate-fade-in slide-up-fade dark:from-primary/20 dark:via-primary/15 dark:to-accent/20",
      className
    )}>
      <CardContent className={cn("flex items-center gap-4", compact ? "p-4" : "p-6")}>
        <ParticipantAvatar
          name={speakerName}
          size={compact ? "lg" : "xl"}
          isSpeaking
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Mic className={cn("text-primary animate-pulse", compact ? "w-4 h-4" : "w-5 h-5")} />
            <span className="text-xs font-medium text-primary uppercase tracking-wider">Now Speaking</span>
          </div>
          <p className={cn("font-bold text-foreground truncate", compact ? "text-xl" : "text-2xl sm:text-3xl")}>
            {speakerName}
          </p>
        </div>
        <SpeakerTimer startedAt={startedAt} size={compact ? "sm" : "md"} />
      </CardContent>
    </Card>
  );
});

NowSpeaking.displayName = "NowSpeaking";
