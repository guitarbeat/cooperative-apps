import { memo } from "react";
import { Hand } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { SpeakingQueueItem } from "./SpeakingQueueItem";
import type { QueueItem } from "@/types/meeting";

interface SpeakingQueueProps {
  speakingQueue: QueueItem[];
  participantName: string;
  onLeaveQueue: () => void;
  currentUserId?: string;
  isFacilitator?: boolean;
  onReorderQueue?: (dragIndex: number, targetIndex: number) => void;
}

export const SpeakingQueue = memo(({
  speakingQueue,
  participantName,
  onLeaveQueue,
  currentUserId: _currentUserId,
  isFacilitator = false,
  onReorderQueue
}: SpeakingQueueProps) => {
  const {
    dragIndex,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    isDragOver
  } = useDragAndDrop({ isFacilitator });

  if (speakingQueue.length === 0) {
    return (
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Hand className="w-6 h-6" />
            Speaking Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="bg-muted rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Hand className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Ready for discussion
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              No one is currently in the speaking queue. Participants can raise their hand to join the discussion.
            </p>
            <div className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2 inline-block">
              💡 Tip: Use keyboard shortcuts for faster facilitation
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
          <Hand className="w-6 h-6" />
          Speaking Queue
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {speakingQueue.map((entry, index) => {
          return (
            <SpeakingQueueItem
              key={entry.id}
              entry={entry}
              index={index}
              participantName={participantName}
              isFacilitator={isFacilitator}
              onLeaveQueue={onLeaveQueue}
              onReorderQueue={onReorderQueue}
              isDragging={dragIndex === index}
              isDragOver={isDragOver(index)}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
            />
          );
        })}
      </CardContent>
    </Card>
  );
});

SpeakingQueue.displayName = "SpeakingQueue";
