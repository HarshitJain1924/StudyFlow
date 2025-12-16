"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";

interface TimerState {
  pomodoroRunning: boolean;
  stopwatchRunning: boolean;
  pomodoroTimeLeft: number;
  stopwatchTime: number;
  pomodoroMode: "work" | "shortBreak" | "longBreak";
}

interface TimerContextType {
  timerState: TimerState;
  setPomodoroRunning: (running: boolean) => void;
  setStopwatchRunning: (running: boolean) => void;
  updatePomodoroTime: (time: number) => void;
  updateStopwatchTime: (time: number) => void;
  setPomodoroMode: (mode: "work" | "shortBreak" | "longBreak") => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({ children }: { children: ReactNode }) {
  const [timerState, setTimerState] = useState<TimerState>({
    pomodoroRunning: false,
    stopwatchRunning: false,
    pomodoroTimeLeft: 0,
    stopwatchTime: 0,
    pomodoroMode: "work",
  });

  const setPomodoroRunning = useCallback((running: boolean) => {
    setTimerState(prev => ({ ...prev, pomodoroRunning: running }));
  }, []);

  const setStopwatchRunning = useCallback((running: boolean) => {
    setTimerState(prev => ({ ...prev, stopwatchRunning: running }));
  }, []);

  const updatePomodoroTime = useCallback((time: number) => {
    setTimerState(prev => ({ ...prev, pomodoroTimeLeft: time }));
  }, []);

  const updateStopwatchTime = useCallback((time: number) => {
    setTimerState(prev => ({ ...prev, stopwatchTime: time }));
  }, []);

  const setPomodoroMode = useCallback((mode: "work" | "shortBreak" | "longBreak") => {
    setTimerState(prev => ({ ...prev, pomodoroMode: mode }));
  }, []);

  return (
    <TimerContext.Provider
      value={{
        timerState,
        setPomodoroRunning,
        setStopwatchRunning,
        updatePomodoroTime,
        updateStopwatchTime,
        setPomodoroMode,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error("useTimer must be used within a TimerProvider");
  }
  return context;
}
