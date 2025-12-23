"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { useChecklists } from "@/lib/checklist-store";

/**
 * ActiveTask represents the currently "locked" task being worked on.
 * Only one task can be active at a time - this is the execution lock.
 * 
 * Extended for Task-Aware Pomodoro:
 * - plannedMinutes: parsed from task text like (25m)
 * - taskId/sectionId: for marking task complete later
 */
export interface ActiveTask {
  goalId: string;
  goalTitle: string;
  goalEmoji?: string;
  taskText: string;
  checklistId?: string;
  taskId?: string;        // Task ID within checklist (for marking complete)
  sectionId?: string;     // Section ID within checklist
  startedAt: string;
  plannedMinutes?: number; // From parsed time like (25m) - drives Pomodoro
}

/**
 * PendingStart represents a command to start the Pomodoro timer.
 * This is consumed by PomodoroTimer and then cleared.
 * This is the IMPERATIVE COMMAND that actually starts the timer.
 */
export interface PendingStart {
  durationSeconds: number;
  source: "manual" | "task" | "moreTime";
  timestamp: number; // Used to detect new commands
}

interface TimerState {
  pomodoroRunning: boolean;
  stopwatchRunning: boolean;
  pomodoroTimeLeft: number;
  stopwatchTime: number;
  pomodoroMode: "work" | "shortBreak" | "longBreak";
  activeTask: ActiveTask | null;
  pendingStart: PendingStart | null; // Command to start timer
}

interface TimerContextType {
  timerState: TimerState;
  setPomodoroRunning: (running: boolean) => void;
  setStopwatchRunning: (running: boolean) => void;
  updatePomodoroTime: (time: number) => void;
  updateStopwatchTime: (time: number) => void;
  setPomodoroMode: (mode: "work" | "shortBreak" | "longBreak") => void;
  // Execution lock functions
  lockTask: (task: Omit<ActiveTask, "startedAt">) => void;
  unlockTask: () => void;
  completeActiveTask: () => void;
  isTaskLocked: boolean;
  // Timer command functions
  startPomodoro: (durationMinutes: number, source?: "manual" | "task" | "moreTime") => void;
  clearPendingStart: () => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({ children }: { children: ReactNode }) {
  const { toggleTask } = useChecklists();
  const [timerState, setTimerState] = useState<TimerState>({
    pomodoroRunning: false,
    stopwatchRunning: false,
    pomodoroTimeLeft: 0,
    stopwatchTime: 0,
    pomodoroMode: "work",
    activeTask: null,
    pendingStart: null,
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

  // Lock a task - sets the active execution focus (but does NOT start timer)
  const lockTask = useCallback((task: Omit<ActiveTask, "startedAt">) => {
    setTimerState(prev => ({
      ...prev,
      activeTask: {
        ...task,
        startedAt: new Date().toISOString(),
      },
    }));
  }, []);

  // Unlock the current task - clears execution focus
  const unlockTask = useCallback(() => {
    setTimerState(prev => ({ ...prev, activeTask: null }));
  }, []);

  // Complete the active task (mark done + unlock)
  const completeActiveTask = useCallback(() => {
    // 1. Perform side effect (mark as completed) using current state
    const active = timerState.activeTask;
    if (active?.checklistId && active?.taskId) {
      toggleTask(active.checklistId, active.taskId, true);
    }
    
    // 2. Update timer state (unlock)
    // We can do this safely now that the side effect is done
    setTimerState(prev => ({ ...prev, activeTask: null }));
  }, [timerState.activeTask, toggleTask]);

  /**
   * START POMODORO - The canonical command to start the timer.
   * This issues an imperative command that PomodoroTimer will consume.
   * 
   * @param durationMinutes - Duration in minutes
   * @param source - Where the start command came from (for analytics/behavior)
   */
  const startPomodoro = useCallback((durationMinutes: number, source: "manual" | "task" | "moreTime" = "manual") => {
    setTimerState(prev => ({
      ...prev,
      pendingStart: {
        durationSeconds: durationMinutes * 60,
        source,
        timestamp: Date.now(),
      },
    }));
  }, []);

  // Clear the pending start command after PomodoroTimer consumes it
  const clearPendingStart = useCallback(() => {
    setTimerState(prev => ({ ...prev, pendingStart: null }));
  }, []);

  const isTaskLocked = timerState.activeTask !== null;

  return (
    <TimerContext.Provider
      value={{
        timerState,
        setPomodoroRunning,
        setStopwatchRunning,
        updatePomodoroTime,
        updateStopwatchTime,
        setPomodoroMode,
        lockTask,
        unlockTask,
        completeActiveTask,
        isTaskLocked,
        startPomodoro,
        clearPendingStart,
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


