"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useStudy } from "@/lib/study-context";
import { useTimer } from "@/lib/timer-context";
import { useChecklists } from "@/lib/checklist-store";
import { formatTimeShort } from "@/lib/study-types";
import { parseTimeEstimate } from "@/lib/markdown-parser";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Coffee,
  Brain,
  Settings,
  Volume2,
  VolumeX,
  Save,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { TaskCompleteDialog } from "@/components/task-complete-dialog";
import { NextTaskDialog } from "@/components/next-task-dialog";

type TimerMode = "work" | "shortBreak" | "longBreak";

const STORAGE_KEY = "studyflow-pomodoro-state";

interface PomodoroState {
  mode: TimerMode;
  timeLeft: number;
  isRunning: boolean;
  sessionsCompleted: number;
  targetEndTime: number; // When the timer should end (for calculating remaining time)
}

interface PomodoroTimerProps {
  minimalUI?: boolean;
}

export function PomodoroTimer({ minimalUI = false }: PomodoroTimerProps) {
  const { settings, updateSettings, addStudyTime, addSession } = useStudy();
  const { timerState, setPomodoroRunning, updatePomodoroTime, setPomodoroMode, unlockTask, clearPendingStart, startPomodoro, completeActiveTask, lockTask } = useTimer();
  const { checklists } = useChecklists();
  const [mode, setMode] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState(settings.pomodoro.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [studiedTimeThisSession, setStudiedTimeThisSession] = useState(0);
  const [showTaskCompleteDialog, setShowTaskCompleteDialog] = useState(false); // Task-Aware Pomodoro
  
  // Next Task Suggestion
  const [showNextTaskDialog, setShowNextTaskDialog] = useState(false);
  const [nextTaskSuggestion, setNextTaskSuggestion] = useState<{ 
    text: string; 
    id: string; 
    sectionId: string; 
    estimate?: number;
    checklistId: string;
    goalId: string;
    goalTitle: string;
    goalEmoji?: string;
  } | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Timestamp-based timer - stores when timer should end
  const targetEndTimeRef = useRef<number>(0);
  const sessionStartTimeRef = useRef<number>(0); // When we started current work session
  const handleTimerCompleteRef = useRef<() => void>(() => {});
  const notificationPermissionRef = useRef<NotificationPermission>("default");

  // Request notification permission early (on mount)
  useEffect(() => {
    if ("Notification" in window) {
      notificationPermissionRef.current = Notification.permission;
    }
  }, []);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state: PomodoroState = JSON.parse(saved);
        
        setMode(state.mode);
        setSessionsCompleted(state.sessionsCompleted);
        
        if (state.isRunning && state.targetEndTime > 0) {
          // Timer was running - calculate remaining time
          const now = Date.now();
          const remaining = Math.max(0, Math.ceil((state.targetEndTime - now) / 1000));
          
          if (remaining > 0) {
            setTimeLeft(remaining);
            targetEndTimeRef.current = state.targetEndTime;
            setIsRunning(true);
          } else {
            // Timer would have completed - reset to start of current mode
            setTimeLeft(getDuration(state.mode));
          }
        } else {
          // Timer was paused - restore the paused time
          setTimeLeft(state.timeLeft);
        }
      }
    } catch (e) {
      console.error("Failed to restore pomodoro state:", e);
    }
    setIsHydrated(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!isHydrated) return;
    
    const state: PomodoroState = {
      mode,
      timeLeft,
      isRunning,
      sessionsCompleted,
      targetEndTime: isRunning ? targetEndTimeRef.current : 0,
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [mode, timeLeft, isRunning, sessionsCompleted, isHydrated]);

  // Helper to request notification permission (called when starting timer)
  const requestNotificationPermission = useCallback(async () => {
    if (!("Notification" in window)) return;
    
    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      notificationPermissionRef.current = permission;
    } else {
      notificationPermissionRef.current = Notification.permission;
    }
  }, []);

  // Show browser notification
  const showNotification = useCallback((title: string, body: string) => {
    if (!("Notification" in window)) return;
    if (notificationPermissionRef.current !== "granted") return;
    
    try {
      const notification = new Notification(title, {
        body,
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        tag: "studyflow-timer",
        requireInteraction: true, // Stay visible until user interacts
      });
      
      // Focus tab when notification is clicked
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (e) {
      // Notification failed, ignore
    }
  }, []);

  // Sync with timer context for background indicator
  useEffect(() => {
    setPomodoroRunning(isRunning);
  }, [isRunning, setPomodoroRunning]);

  useEffect(() => {
    updatePomodoroTime(timeLeft);
  }, [timeLeft, updatePomodoroTime]);

  useEffect(() => {
    setPomodoroMode(mode);
  }, [mode, setPomodoroMode]);

  // CONSUME PENDING START COMMAND - This is the imperative bridge
  // When pendingStart is set (from DailyFocusCard, Need more time, etc),
  // this effect actually starts the timer engine.
  const lastProcessedTimestampRef = useRef<number>(0);
  useEffect(() => {
    const pending = timerState.pendingStart;
    if (!pending) return;
    
    // Prevent processing the same command twice
    if (pending.timestamp <= lastProcessedTimestampRef.current) return;
    lastProcessedTimestampRef.current = pending.timestamp;
    
    // Set mode to work and duration based on command
    setMode("work");
    setTimeLeft(pending.durationSeconds);
    setIsRunning(true);
    setStudiedTimeThisSession(0);
    sessionStartTimeRef.current = Date.now();
    
    // Request notification permission
    if (settings.notificationsEnabled) {
      requestNotificationPermission();
    }
    
    // Clear the command so it doesn't re-trigger
    clearPendingStart();
  }, [timerState.pendingStart, clearPendingStart, settings.notificationsEnabled, requestNotificationPermission]);

  const getDuration = useCallback(
    (timerMode: TimerMode) => {
      switch (timerMode) {
        case "work":
          return settings.pomodoro.workDuration * 60;
        case "shortBreak":
          return settings.pomodoro.shortBreakDuration * 60;
        case "longBreak":
          return settings.pomodoro.longBreakDuration * 60;
      }
    },
    [settings.pomodoro]
  );

  const totalDuration = getDuration(mode);
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;

  useEffect(() => {
    // Create audio element for notification
    audioRef.current = new Audio(
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleyo8ntjLnT8ODmavzryELS0eo9PSmk0bFpPP06FNIxuFytevYSgggcTZt2klJHa+2MB3MCxxud3If0A4bbPf0ZBVSGur4tejeVxhp+3lo4JuWJXl7K+Ui3Bklunqr5GIcmSQ5Oioj4RvXI7h5aWJf21Yi97gpYl8alOL3d2jiHdoT4fZ2p+GdGRNg9XWm4NwYEp/0dKYgG1cRnrNzpR9aVlCdc"
    );
  }, []);

  const playSound = useCallback(() => {
    if (settings.soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [settings.soundEnabled]);

  const handleTimerComplete = useCallback(() => {
    playSound();

    if (mode === "work") {
      const duration = settings.pomodoro.workDuration * 60;
      addStudyTime(duration);
      addSession({
        date: new Date().toISOString(),
        duration,
        tasksCompleted: 0,
      });

      const newSessionsCompleted = sessionsCompleted + 1;
      setSessionsCompleted(newSessionsCompleted);

      // Check if there's an active task - show task complete dialog instead of toast
      if (timerState.activeTask) {
        setShowTaskCompleteDialog(true);
      } else {
        // Normal Pomodoro flow (no active task)
        toast.success("Focus session complete! ☕", {
          description: `Great work! ${settings.pomodoro.workDuration}min added. Take a break!`,
        });

        if (newSessionsCompleted % settings.pomodoro.sessionsUntilLongBreak === 0) {
          setMode("longBreak");
          setTimeLeft(settings.pomodoro.longBreakDuration * 60);
        } else {
          setMode("shortBreak");
          setTimeLeft(settings.pomodoro.shortBreakDuration * 60);
        }
      }
    } else {
      toast.info("Break's over! 🎯", {
        description: "Ready to get back to work?",
      });
      setMode("work");
      setTimeLeft(settings.pomodoro.workDuration * 60);
    }

    setIsRunning(false);

    // Show browser notification (permission was already requested on start)
    if (settings.notificationsEnabled) {
      showNotification(
        mode === "work" ? "Break Time! ☕" : "Back to Work! 🎯",
        mode === "work"
          ? `Great work! You studied for ${settings.pomodoro.workDuration} minutes. Take a break!`
          : "Break's over. Let's get back to studying!"
      );
    }
  }, [mode, sessionsCompleted, settings, addStudyTime, addSession, playSound, showNotification, timerState.activeTask]);

  // Store handleTimerComplete in ref so timer effect can access latest version
  handleTimerCompleteRef.current = handleTimerComplete;

  // TIMESTAMP-BASED TIMER - accurate even when tab is backgrounded
  // When tab sleeps, interval pauses. When it resumes, we calculate
  // remaining time from targetEndTime, so it's always accurate on return.
  useEffect(() => {
    if (!isRunning) return;

    // Set target end time when starting
    targetEndTimeRef.current = Date.now() + timeLeft * 1000;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((targetEndTimeRef.current - now) / 1000));
      
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        handleTimerCompleteRef.current();
      }
    }, 1000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]); // Only depend on isRunning - timeLeft is captured at start

  // Track studied time when running in work mode
  useEffect(() => {
    if (isRunning && mode === "work") {
      // Starting a work session
      sessionStartTimeRef.current = Date.now();
    } else if (!isRunning && sessionStartTimeRef.current > 0 && mode === "work") {
      // Paused during work - accumulate the time
      const elapsed = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
      setStudiedTimeThisSession(prev => prev + elapsed);
      sessionStartTimeRef.current = 0;
    }
  }, [isRunning, mode]);

  const toggleTimer = () => {
    if (!isRunning && settings.notificationsEnabled) {
      // Request permission when starting (better UX than waiting until completion)
      requestNotificationPermission();
    }
    setIsRunning(!isRunning);
  };

  // Save partial progress
  const saveProgress = useCallback(() => {
    // Calculate current studied time: accumulated + current session progress (from timer)
    let totalStudied = studiedTimeThisSession;
    if (isRunning && mode === "work") {
      // Use timer progress: totalDuration - timeLeft = elapsed time
      totalStudied += getDuration("work") - timeLeft;
    }
    
    if (totalStudied < 60) {
      toast.error("Session too short", { description: "Study at least 1 minute to save" });
      return;
    }
    
    addStudyTime(totalStudied);
    addSession({
      date: new Date().toISOString(),
      duration: totalStudied,
      tasksCompleted: 0,
    });
    
    const mins = Math.floor(totalStudied / 60);
    toast.success("Progress saved! 📚", { 
      description: `Added ${mins} minute${mins !== 1 ? "s" : ""} to your study time` 
    });
    
    // Reset timer and studied time
    setIsRunning(false);
    setTimeLeft(getDuration(mode));
    setStudiedTimeThisSession(0);
    sessionStartTimeRef.current = 0;
    targetEndTimeRef.current = 0;
    localStorage.removeItem(STORAGE_KEY);
  }, [studiedTimeThisSession, isRunning, mode, timeLeft, addStudyTime, addSession, getDuration]);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(getDuration(mode));
    setStudiedTimeThisSession(0);
    sessionStartTimeRef.current = 0;
    targetEndTimeRef.current = 0;
    // Clear saved state to reset to defaults
    localStorage.removeItem(STORAGE_KEY);
  };

  const skipToNext = () => {
    if (mode === "work") {
      setMode("shortBreak");
      setTimeLeft(settings.pomodoro.shortBreakDuration * 60);
    } else {
      setMode("work");
      setTimeLeft(settings.pomodoro.workDuration * 60);
    }
    setIsRunning(false);
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(getDuration(newMode));
    setIsRunning(false);
  };

  const getModeColor = () => {
    switch (mode) {
      case "work":
        return "bg-red-500";
      case "shortBreak":
        return "bg-green-500";
      case "longBreak":
        return "bg-blue-500";
    }
  };

  const getModeIcon = () => {
    switch (mode) {
      case "work":
        return <Brain className="h-5 w-5" />;
      case "shortBreak":
      case "longBreak":
        return <Coffee className="h-5 w-5" />;
    }
  };

  // Task-Aware Pomodoro: Handler for "Completed" button
  const handleTaskCompleted = useCallback(() => {
    // Ensure timer stops immediately when task is marked complete (especially if done early via banner)
    setIsRunning(false);

    const active = timerState.activeTask;
    setShowTaskCompleteDialog(false);
    
    // 1. Mark active task as complete
    completeActiveTask();
    
    // 2. Find next task (if possible)
    if (active && active.checklistId && active.taskId) {
      const checklist = checklists.find(c => c.id === active.checklistId);
      if (checklist) {
        let foundCurrent = false;
        let nextTaskFound: { text: string; id: string; sectionId: string; estimate?: number } | null = null;
        
        // Iteration to find next uncompleted task
        // We use a simple loop because we need to break after finding the next one
        outerLoop:
        for (const section of checklist.sections) {
          for (const item of section.items) {
            // Check current level
            if (foundCurrent && !item.completed) {
              const estimate = item.timeEstimate;
              nextTaskFound = { text: item.text, id: item.id, sectionId: section.id, estimate };
              break outerLoop;
            }
            if (item.id === active.taskId) foundCurrent = true;
            
            // Check children
            if (item.children) {
              for (const child of item.children) {
                if (foundCurrent && !child.completed) {
                  const estimate = child.timeEstimate;
                  nextTaskFound = { text: child.text, id: child.id, sectionId: section.id, estimate };
                  break outerLoop;
                }
                if (child.id === active.taskId) foundCurrent = true;
              }
            }
          }
        }

        if (nextTaskFound) {
          setNextTaskSuggestion({
            ...nextTaskFound,
            checklistId: active.checklistId,
            goalId: active.goalId,
            goalTitle: active.goalTitle,
            goalEmoji: active.goalEmoji,
          });
          setShowNextTaskDialog(true);
          return; // Don't go to break yet, wait for user decision
        }
      }
    }

    // No next task found -> Standard completion flow
    toast.success("Task completed! 🎉", {
      description: "Great work! Take a break.",
    });
    // Return to break mode
    if (sessionsCompleted % settings.pomodoro.sessionsUntilLongBreak === 0) {
      setMode("longBreak");
      setTimeLeft(settings.pomodoro.longBreakDuration * 60);
    } else {
      setMode("shortBreak");
      setTimeLeft(settings.pomodoro.shortBreakDuration * 60);
    }
  }, [timerState.activeTask, completeActiveTask, checklists, sessionsCompleted, settings.pomodoro]);

  // Handler for starting the suggested next task
  const handleStartNextTask = useCallback(() => {
    if (!nextTaskSuggestion) return;
    
    lockTask({
      goalId: nextTaskSuggestion.goalId,
      goalTitle: nextTaskSuggestion.goalTitle,
      goalEmoji: nextTaskSuggestion.goalEmoji,
      taskText: nextTaskSuggestion.text,
      checklistId: nextTaskSuggestion.checklistId,
      taskId: nextTaskSuggestion.id,
      sectionId: nextTaskSuggestion.sectionId,
      plannedMinutes: nextTaskSuggestion.estimate,
    });

    // Auto-start timer
    const duration = nextTaskSuggestion.estimate || settings.pomodoro.workDuration;
    startPomodoro(duration, "task");
    
    setShowNextTaskDialog(false);
  }, [nextTaskSuggestion, lockTask, startPomodoro, settings.pomodoro.workDuration]);

  // Task-Aware Pomodoro: Handler for "Need more time" button
  const handleNeedMoreTime = useCallback((additionalMinutes: number) => {
    setShowTaskCompleteDialog(false);
    setTimeLeft(additionalMinutes * 60);
    setIsRunning(true);
    toast.info(`Added ${additionalMinutes} more minutes`, {
      description: "Keep going! You've got this.",
    });
  }, []);

  // Task-Aware Pomodoro: Handler for "Skip" button
  const handleTaskSkip = useCallback(() => {
    setShowTaskCompleteDialog(false);
    unlockTask();
    toast.info("Task skipped", {
      description: "No worries — you can come back to it later.",
    });
    // Return to break mode
    setMode("shortBreak");
    setTimeLeft(settings.pomodoro.shortBreakDuration * 60);
  }, [unlockTask, settings.pomodoro.shortBreakDuration]);

  return (
    <Card className="overflow-hidden">
      {!minimalUI && <div className={cn("h-1", getModeColor())} />}
      
      {/* Active Task Banner - shows what you're working on */}
      {timerState.activeTask && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{timerState.activeTask.goalEmoji || "🎯"}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Working on</p>
              <p className="text-sm font-medium truncate">{timerState.activeTask.taskText}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTaskCompleted}
              className="text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/50 h-7 px-2"
            >
              Done
            </Button>
          </div>
        </div>
      )}
      
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {getModeIcon()}
            <span className="font-semibold capitalize">
              {mode === "work"
                ? "Focus Time"
                : mode === "shortBreak"
                ? "Short Break"
                : "Long Break"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() =>
                updateSettings({ soundEnabled: !settings.soundEnabled })
              }
            >
              {settings.soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Timer Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Work Duration (minutes)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={60}
                      value={settings.pomodoro.workDuration}
                      onChange={(e) =>
                        updateSettings({
                          pomodoro: {
                            ...settings.pomodoro,
                            workDuration: parseInt(e.target.value) || 25,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Short Break (minutes)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={settings.pomodoro.shortBreakDuration}
                      onChange={(e) =>
                        updateSettings({
                          pomodoro: {
                            ...settings.pomodoro,
                            shortBreakDuration: parseInt(e.target.value) || 5,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Long Break (minutes)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={60}
                      value={settings.pomodoro.longBreakDuration}
                      onChange={(e) =>
                        updateSettings({
                          pomodoro: {
                            ...settings.pomodoro,
                            longBreakDuration: parseInt(e.target.value) || 15,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sessions until long break</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={settings.pomodoro.sessionsUntilLongBreak}
                      onChange={(e) =>
                        updateSettings({
                          pomodoro: {
                            ...settings.pomodoro,
                            sessionsUntilLongBreak: parseInt(e.target.value) || 4,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Sound notifications</Label>
                    <Switch
                      checked={settings.soundEnabled}
                      onCheckedChange={(checked) =>
                        updateSettings({ soundEnabled: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Desktop notifications</Label>
                    <Switch
                      checked={settings.notificationsEnabled}
                      onCheckedChange={(checked) =>
                        updateSettings({ notificationsEnabled: checked })
                      }
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex gap-2 mb-6">
          {(["work", "shortBreak", "longBreak"] as TimerMode[]).map((m) => (
            <Button
              key={m}
              variant={mode === m ? "default" : "outline"}
              size="sm"
              onClick={() => switchMode(m)}
              className="flex-1"
            >
              {m === "work" ? "Focus" : m === "shortBreak" ? "Short" : "Long"}
            </Button>
          ))}
        </div>

        {/* Timer Display */}
        <div className="text-center mb-6">
          <div className="text-6xl font-bold font-mono mb-2">
            {formatTimeShort(timeLeft)}
          </div>
          <Progress value={progress} className="h-2" />
          {/* Show studied time - calculate from timer progress for running, use accumulated for paused */}
          {mode === "work" && (studiedTimeThisSession > 0 || (isRunning && timeLeft < totalDuration)) && (
            <div className="text-sm text-muted-foreground mt-2">
              Studied: {Math.floor((studiedTimeThisSession + (isRunning ? totalDuration - timeLeft : 0)) / 60)}m
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="icon" onClick={resetTimer}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            size="lg"
            onClick={toggleTimer}
            className={cn("px-8", isRunning && "bg-orange-500 hover:bg-orange-600")}
          >
            {isRunning ? (
              <Pause className="h-5 w-5 mr-2" />
            ) : (
              <Play className="h-5 w-5 mr-2" />
            )}
            {isRunning ? "Pause" : "Start"}
          </Button>
          <Button variant="outline" size="icon" onClick={skipToNext}>
            <SkipForward className="h-4 w-4" />
          </Button>
          {/* Save button - only show when there's progress to save in work mode */}
          {mode === "work" && (studiedTimeThisSession > 0 || timeLeft < getDuration("work")) && (
            <Button 
              variant="outline" 
              size="icon" 
              onClick={saveProgress}
              title="Save progress"
            >
              <Save className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Sessions Counter */}
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Sessions completed: {sessionsCompleted}
        </div>
      </CardContent>

      {/* Task-Aware Pomodoro: Post-timer dialog */}
      <TaskCompleteDialog
        open={showTaskCompleteDialog}
        taskText={timerState.activeTask?.taskText || ""}
        goalEmoji={timerState.activeTask?.goalEmoji}
        plannedMinutes={timerState.activeTask?.plannedMinutes}
        defaultDuration={settings.pomodoro.workDuration}
        onCompleted={handleTaskCompleted}
        onNeedMoreTime={handleNeedMoreTime}
        onSkip={handleTaskSkip}
      />
      
      {/* Next Task Suggestion Dialog */}
      <NextTaskDialog 
        open={showNextTaskDialog}
        nextTaskText={nextTaskSuggestion?.text || ""}
        nextGoalEmoji={timerState.activeTask?.goalEmoji || "🎯"} 
        nextGoalTitle={timerState.activeTask?.goalTitle || "Next Task"}
        nextTaskMinutes={nextTaskSuggestion?.estimate}
        onStartNext={handleStartNextTask}
        onDismiss={() => {
          setShowNextTaskDialog(false);
           // Return to break mode only when dismissed
           if (sessionsCompleted % settings.pomodoro.sessionsUntilLongBreak === 0) {
            setMode("longBreak");
            setTimeLeft(settings.pomodoro.longBreakDuration * 60);
          } else {
            setMode("shortBreak");
            setTimeLeft(settings.pomodoro.shortBreakDuration * 60);
          }
        }}
      />
    </Card>
  );
}
