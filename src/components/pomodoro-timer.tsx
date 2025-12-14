"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useStudy } from "@/lib/study-context";
import { formatTimeShort } from "@/lib/study-types";
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

type TimerMode = "work" | "shortBreak" | "longBreak";

interface PomodoroTimerProps {
  minimalUI?: boolean;
}

export function PomodoroTimer({ minimalUI = false }: PomodoroTimerProps) {
  const { settings, updateSettings, addStudyTime, addSession } = useStudy();
  const [mode, setMode] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState(settings.pomodoro.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number | null>(null);

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

      // Toast notification
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
    } else {
      toast.info("Break's over! 🎯", {
        description: "Ready to get back to work?",
      });
      setMode("work");
      setTimeLeft(settings.pomodoro.workDuration * 60);
    }

    setIsRunning(false);

    // Show browser notification too
    if (settings.notificationsEnabled && "Notification" in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification(
            mode === "work" ? "Break Time! ☕" : "Back to Work! 🎯",
            {
              body:
                mode === "work"
                  ? "Great work! Take a well-deserved break."
                  : "Break's over. Let's get back to studying!",
            }
          );
        }
      });
    }
  }, [mode, sessionsCompleted, settings, addStudyTime, addSession, playSound]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      handleTimerComplete();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, handleTimerComplete]);

  const toggleTimer = () => {
    if (!isRunning) {
      startTimeRef.current = Date.now();
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(getDuration(mode));
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

  return (
    <Card className="overflow-hidden">
      {!minimalUI && <div className={cn("h-1", getModeColor())} />}
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
        </div>

        {/* Sessions Counter */}
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Sessions completed: {sessionsCompleted}
        </div>
      </CardContent>
    </Card>
  );
}
