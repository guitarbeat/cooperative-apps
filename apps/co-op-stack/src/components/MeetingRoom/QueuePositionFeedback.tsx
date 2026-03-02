import { useState, useEffect } from "react";
import { 
  Clock, 
  Users, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Timer,
  BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { playBeep } from "@/utils/sound";

interface QueuePositionFeedbackProps {
  participantName: string;
  queuePosition: number;
  totalInQueue: number;
  joinedAt: Date;
  averageSpeakingTime?: number; // in seconds
  currentSpeaker?: {
    participantName: string;
    startedSpeakingAt?: Date;
  };
  queueHistory?: Array<{
    participantName: string;
    duration: number; // in seconds
    completedAt: Date;
  }>;
}

export const QueuePositionFeedback = ({
  queuePosition,
  totalInQueue,
  joinedAt,
  averageSpeakingTime = 120, // 2 minutes default
  currentSpeaker,
  queueHistory = []
}: QueuePositionFeedbackProps) => {
  const [timeInQueue, setTimeInQueue] = useState<string>('');
  const [estimatedWaitTime, setEstimatedWaitTime] = useState<string>('');
  const [currentSpeakerDuration, setCurrentSpeakerDuration] = useState<string>('');

  // Update time in queue
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const diff = now.getTime() - joinedAt.getTime();
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      
      if (minutes > 0) {
        setTimeInQueue(`${minutes}m ${seconds}s`);
      } else {
        setTimeInQueue(`${seconds}s`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [joinedAt]);

  // Update current speaker duration
  useEffect(() => {
    if (!currentSpeaker?.startedSpeakingAt) {
      setCurrentSpeakerDuration('');
      return;
    }

    const updateSpeakerTime = () => {
      const now = new Date();
      // * Safe null check instead of non-null assertion
      if (!currentSpeaker.startedSpeakingAt) {
        setCurrentSpeakerDuration('');
        return;
      }
      const diff = now.getTime() - currentSpeaker.startedSpeakingAt.getTime();
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      
      if (minutes > 0) {
        setCurrentSpeakerDuration(`${minutes}m ${seconds}s`);
      } else {
        setCurrentSpeakerDuration(`${seconds}s`);
      }
    };

    updateSpeakerTime();
    const interval = setInterval(updateSpeakerTime, 1000);
    return () => clearInterval(interval);
  }, [currentSpeaker?.startedSpeakingAt]);

  // Play sound notification when user reaches front of queue
  useEffect(() => {
    if (queuePosition === 1) {
      playBeep(880, 200, 0.1); // Play notification sound
    }
  }, [queuePosition]);

  // Calculate estimated wait time
  useEffect(() => {
    if (queuePosition <= 1) {
      setEstimatedWaitTime('You\'re next!');
      return;
    }

    // Calculate average from history if available, otherwise use default
    const recentHistory = queueHistory.slice(-5); // Last 5 speakers
    const avgTime = recentHistory.length > 0 
      ? recentHistory.reduce((sum, entry) => sum + entry.duration, 0) / recentHistory.length
      : averageSpeakingTime;

    const estimatedSeconds = Math.round((queuePosition - 1) * avgTime);
    const minutes = Math.floor(estimatedSeconds / 60);
    const seconds = estimatedSeconds % 60;

    if (minutes > 0) {
      setEstimatedWaitTime(`~${minutes}m ${seconds}s`);
    } else {
      setEstimatedWaitTime(`~${seconds}s`);
    }
  }, [queuePosition, averageSpeakingTime, queueHistory]);

  const getPositionColor = () => {
    if (queuePosition === 1) return 'text-success bg-success/10';
    if (queuePosition <= 3) return 'text-warning bg-warning/10';
    return 'text-info bg-info/10';
  };

  const getPositionIcon = () => {
    if (queuePosition === 1) return <CheckCircle className="w-4 h-4" />;
    if (queuePosition <= 3) return <TrendingUp className="w-4 h-4" />;
    return <Users className="w-4 h-4" />;
  };

  const progressPercentage = totalInQueue > 0 ? ((totalInQueue - queuePosition + 1) / totalInQueue) * 100 : 0;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Timer className="w-5 h-5" />
          Your Queue Position
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Position and Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className={`${getPositionColor()} border-0`}>
                {getPositionIcon()}
                <span className="ml-1">
                  {queuePosition === 1 ? 'Next to speak' : `Position #${queuePosition}`}
                </span>
              </Badge>
              <span className="text-sm text-muted-foreground">
                of {totalInQueue} in queue
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {timeInQueue} in queue
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress through queue</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>

        {/* Wait Time Estimation */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Estimated wait time</span>
          </div>
          <div className="text-lg font-semibold text-primary">
            {estimatedWaitTime}
          </div>
          {queuePosition > 1 && (
            <div className="text-xs text-muted-foreground mt-1">
              Based on recent speaking times
            </div>
          )}
        </div>

        {/* Current Speaker Info */}
        {currentSpeaker && (
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-sm font-medium">Currently speaking</span>
            </div>
            <div className="text-sm">
              <span className="font-medium">{currentSpeaker.participantName}</span>
              {currentSpeakerDuration && (
                <span className="text-muted-foreground ml-2">
                  ({currentSpeakerDuration})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Queue Statistics */}
        {queueHistory.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Queue Statistics</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Average speaking time</div>
                <div className="font-medium">
                  {Math.round(averageSpeakingTime / 60)}m {averageSpeakingTime % 60}s
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Recent speakers</div>
                <div className="font-medium">{queueHistory.length}</div>
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="bg-info/10 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-info mt-0.5 flex-shrink-0" />
            <div className="text-sm text-info">
              <div className="font-medium mb-1">Tips while waiting:</div>
              <ul className="text-xs space-y-1">
                <li>• Keep this tab open to maintain your position</li>
                <li>• You'll hear a sound when it's your turn</li>
                <li>• You can leave and rejoin the queue anytime</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
