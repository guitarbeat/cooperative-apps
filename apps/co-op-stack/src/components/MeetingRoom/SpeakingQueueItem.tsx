import { memo } from "react";
import { Button } from "@/components/ui/button";
import { ParticipantAvatar } from "@/components/ui/participant-avatar";
import type { QueueItem } from "@/types/meeting";

export interface SpeakingQueueItemProps {
  entry: QueueItem;
  index: number;
  participantName: string;
  isFacilitator: boolean;
  onLeaveQueue: () => void;
  onReorderQueue?: (dragIndex: number, targetIndex: number) => void;
  // * Drag and Drop props
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragLeave: () => void;
  onDrop: (index: number, onReorder: (dragIndex: number, targetIndex: number) => void) => void;
  onDragEnd: () => void;
}

export const SpeakingQueueItem = memo(({
  entry,
  index,
  participantName,
  isFacilitator,
  onLeaveQueue,
  onReorderQueue,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd
}: SpeakingQueueItemProps) => {
  const { type, participantName: entryName, participantId: _participantId } = entry;
  const isSelf = entryName === participantName;
  const isDirect = type === 'direct-response';
  const isPointInfo = type === 'point-of-info';
  const isClarify = type === 'clarification';
  const isCurrentSpeaker = index === 0;
  const canDrag = index !== 0 && (isFacilitator || isSelf);

  return (
    <div
      draggable={canDrag}
      onDragStart={() => canDrag && onDragStart(index)}
      onDragOver={(e) => canDrag && onDragOver(e, index)}
      onDragLeave={onDragLeave}
      onDrop={() => canDrag && onReorderQueue && onDrop(index, onReorderQueue)}
      onDragEnd={onDragEnd}
      className={`p-4 rounded-lg border-l-4 transition-all slide-up-fade card-hover-lift ${
        isCurrentSpeaker
          ? 'bg-primary/5 border-primary shadow-sm dark:bg-primary/15'
          : isDirect
          ? 'bg-warning/10 border-warning dark:bg-warning/20'
          : isPointInfo
          ? 'bg-info/10 border-info dark:bg-info/20'
          : isClarify
          ? 'bg-accent/10 border-accent dark:bg-accent/20'
          : 'bg-muted border-border dark:bg-muted/60'
      } ${isSelf ? 'ring-2 ring-primary/20 bg-primary/5' : ''} ${
        canDrag ? 'draggable-item cursor-grab' : ''
      } ${isDragging ? 'dragging opacity-50 cursor-grabbing' : ''} ${
        isDragOver ? 'drag-over border-2 border-dashed border-primary bg-primary/5' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Avatar with position overlay */}
          <div className="relative">
            <ParticipantAvatar
              name={entryName}
              size="md"
              isSpeaking={isCurrentSpeaker}
            />
            {!isCurrentSpeaker && (
              <span className="absolute -bottom-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-card/90 text-muted-foreground text-[10px] font-bold border-2 border-card shadow-sm">
                {index + 1}
              </span>
            )}
          </div>

          {/* Name and type indicator */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className={`font-semibold text-lg truncate ${
              isCurrentSpeaker
                ? 'text-primary'
                : isSelf
                ? 'text-primary font-bold'
                : 'text-foreground'
            }`}>
              {entryName}
            </span>

            {/* Compact type indicator */}
            {type !== 'speak' && (
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                isDirect ? 'bg-warning/20 text-warning-foreground' :
                isPointInfo ? 'bg-info/20 text-info-foreground' :
                isClarify ? 'bg-accent/20 text-accent-foreground' :
                'bg-muted text-muted-foreground'
              }`}>
                {type === 'direct-response' ? 'Direct' :
                 type === 'point-of-info' ? 'Info' :
                 type === 'clarification' ? 'Q&A' : type}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isSelf && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onLeaveQueue}
              className="hover:bg-destructive/20 hover:text-destructive rounded-lg transition-fast px-3 text-sm"
            >
              Leave
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

SpeakingQueueItem.displayName = "SpeakingQueueItem";
