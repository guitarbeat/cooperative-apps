import { useState, useEffect, useCallback, useRef } from 'react';

interface SpeakerTimer {
  participantId: string;
  startTime: Date;
  isActive: boolean;
  pausedTime?: number;
}

interface UseSpeakerTimerReturn {
  speakerTimer: SpeakerTimer | null;
  elapsedTime: number;
  startTimer: (participantId: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  stopTimer: () => void;
  formatTime: (ms: number) => string;
}

export const useSpeakerTimer = (): UseSpeakerTimerReturn => {
  const [speakerTimer, setSpeakerTimer] = useState<SpeakerTimer | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedAtRef = useRef<number | null>(null);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Timer effect with proper cleanup
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (speakerTimer?.isActive) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const startTime = speakerTimer.startTime.getTime();
        const pausedTime = speakerTimer.pausedTime ?? 0;
        setElapsedTime(now - startTime - pausedTime);
      }, 100);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [speakerTimer?.isActive, speakerTimer?.startTime, speakerTimer?.pausedTime]);

  const startTimer = useCallback((participantId: string) => {
    setSpeakerTimer({
      participantId,
      startTime: new Date(),
      isActive: true,
      pausedTime: 0
    });
    setElapsedTime(0);
    pausedAtRef.current = null;
  }, []);

  const pauseTimer = useCallback(() => {
    if (!speakerTimer) {
      return;
    }

    const now = Date.now();
    const currentElapsed = now - speakerTimer.startTime.getTime() - (speakerTimer.pausedTime ?? 0);

    setSpeakerTimer(prev => prev ? {
      ...prev,
      isActive: false,
      pausedTime: (prev.pausedTime ?? 0) + currentElapsed
    } : null);

    pausedAtRef.current = now;
  }, [speakerTimer]);

  const resumeTimer = useCallback(() => {
    if (!speakerTimer) {
      return;
    }

    setSpeakerTimer(prev => prev ? {
      ...prev,
      isActive: true,
      startTime: new Date()
    } : null);

    pausedAtRef.current = null;
  }, [speakerTimer]);

  const resetTimer = useCallback(() => {
    if (!speakerTimer) {
      return;
    }

    setSpeakerTimer(prev => prev ? {
      ...prev,
      startTime: new Date(),
      pausedTime: 0
    } : null);
    setElapsedTime(0);
    pausedAtRef.current = null;
  }, [speakerTimer]);

  const stopTimer = useCallback(() => {
    setSpeakerTimer(null);
    setElapsedTime(0);
    pausedAtRef.current = null;
  }, []);

  const formatTime = useCallback((ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  return {
    speakerTimer,
    elapsedTime,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    stopTimer,
    formatTime
  };
};