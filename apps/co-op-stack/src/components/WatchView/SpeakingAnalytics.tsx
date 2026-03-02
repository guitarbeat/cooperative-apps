import { memo, type FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTime } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Clock, TrendingUp, Users, Timer, Target, Activity, Zap } from "lucide-react";

interface SpeakingAnalyticsProps {
  speakingDistribution: Array<{
    name: string;
    value: number; // in seconds
  }>;
  totalSpeakingTime?: number;
  averageSpeakingTime?: number;
  // Enhanced metrics
  meetingDuration?: number; // in seconds
  totalParticipants?: number;
  queueActivity?: number; // number of queue actions
  directResponses?: number; // number of direct responses
  currentSpeaker?: string;
  isHostMode?: boolean; // whether this is being displayed in HOST mode
}

export const SpeakingAnalytics: FC<SpeakingAnalyticsProps> = memo(({
  speakingDistribution,
  totalSpeakingTime = 0,
  averageSpeakingTime = 0,
  meetingDuration = 0,
  totalParticipants = 0,
  queueActivity = 0,
  directResponses = 0,
  currentSpeaker,
  isHostMode = false
}) => {
  const formatLongTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sortedDistribution = [...speakingDistribution].sort((a, b) => b.value - a.value);
  const maxTime = Math.max(...speakingDistribution.map(p => p.value), 1);

  // Calculate engagement metrics
  const speakingRatio = totalSpeakingTime > 0 && meetingDuration > 0
    ? (totalSpeakingTime / meetingDuration) * 100 : 0;
  const activeSpeakers = speakingDistribution.filter(p => p.value > 0).length;
  const participationRate = totalParticipants > 0 ? (activeSpeakers / totalParticipants) * 100 : 0;

  return (
    <Card variant="elevated" className="border-border">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          {isHostMode ? "Meeting Analytics" : "Speaking Analytics"}
          {currentSpeaker && (
            <Badge variant="secondary" className="ml-2">
              <Activity className="w-3 h-3 mr-1" />
              {currentSpeaker} speaking
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Stats - 4 columns */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <Clock className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <div className="text-lg font-bold text-foreground">
              {formatTime(totalSpeakingTime)}
            </div>
            <div className="text-xs text-muted-foreground">
              Total Speaking Time
            </div>
          </div>

          <div className="text-center p-4 bg-muted rounded-lg">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <div className="text-lg font-bold text-foreground">
              {formatTime(averageSpeakingTime)}
            </div>
            <div className="text-xs text-muted-foreground">
              Average per Person
            </div>
          </div>

          <div className="text-center p-4 bg-muted rounded-lg">
            <Timer className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <div className="text-lg font-bold text-foreground">
              {formatLongTime(meetingDuration)}
            </div>
            <div className="text-xs text-muted-foreground">
              Meeting Duration
            </div>
          </div>

          <div className="text-center p-4 bg-muted rounded-lg">
            <Target className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <div className="text-lg font-bold text-foreground">
              {participationRate.toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground">
              Participation Rate
            </div>
          </div>
        </div>

        {/* Engagement Stats - 3 columns */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-info/10 rounded-lg">
            <Users className="w-5 h-5 mx-auto mb-1 text-info" />
            <div className="text-lg font-bold text-foreground">
              {activeSpeakers}/{totalParticipants}
            </div>
            <div className="text-xs text-muted-foreground">
              Active Speakers
            </div>
          </div>

          <div className="text-center p-3 bg-success/10 rounded-lg">
            <Activity className="w-5 h-5 mx-auto mb-1 text-success" />
            <div className="text-lg font-bold text-foreground">
              {queueActivity}
            </div>
            <div className="text-xs text-muted-foreground">
              Queue Actions
            </div>
          </div>

          <div className="text-center p-3 bg-accent/10 rounded-lg">
            <Zap className="w-5 h-5 mx-auto mb-1 text-accent" />
            <div className="text-lg font-bold text-foreground">
              {directResponses}
            </div>
            <div className="text-xs text-muted-foreground">
              Direct Responses
            </div>
          </div>
        </div>

        {/* Speaking Ratio Indicator */}
        {meetingDuration > 0 && (
          <div className="p-4 bg-gradient-to-r from-info/10 to-accent/10 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                Speaking vs Meeting Time
              </span>
              <span className="text-sm font-bold text-foreground">
                {speakingRatio.toFixed(1)}%
              </span>
            </div>
            <Progress value={Math.min(speakingRatio, 100)} className="h-2" />
            <div className="text-xs text-muted-foreground mt-1">
              {formatTime(totalSpeakingTime)} speaking of {formatLongTime(meetingDuration)} total
            </div>
          </div>
        )}

        {/* Speaking Distribution */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-foreground">
            Speaking Time Distribution
          </h4>
          {sortedDistribution.length > 0 ? (
            <div className="space-y-3">
              {sortedDistribution.slice(0, 8).map((participant, index) => {
                const percentage = maxTime > 0 ? (participant.value / maxTime) * 100 : 0;
                const totalTime = speakingDistribution.reduce((sum, p) => sum + p.value, 0);
                const sharePercentage = totalTime > 0 ? (participant.value / totalTime) * 100 : 0;
                
                return (
                  <div key={participant.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                          {index + 1}
                        </div>
                        <span className="font-medium text-foreground">
                          {participant.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-foreground">
                          {formatTime(participant.value)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {sharePercentage.toFixed(1)}% of total
                        </div>
                      </div>
                    </div>
                    <Progress 
                      value={percentage} 
                      className="h-3"
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No speaking data available yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

SpeakingAnalytics.displayName = "SpeakingAnalytics";

export default SpeakingAnalytics;
