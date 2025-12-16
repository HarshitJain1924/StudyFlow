"use client";

import { useTimer } from "@/lib/timer-context";
import { Timer, Play } from "lucide-react";
import { cn } from "@/lib/utils";

function formatTime(seconds: number): string {
  const mins = Math.floor(Math.abs(seconds) / 60);
  const secs = Math.floor(Math.abs(seconds) % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatStopwatchTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function BackgroundTimerIndicator() {
  const { timerState } = useTimer();
  const { pomodoroRunning, stopwatchRunning, pomodoroTimeLeft, stopwatchTime, pomodoroMode } = timerState;

  const isAnyRunning = pomodoroRunning || stopwatchRunning;

  if (!isAnyRunning) return null;

  const getModeColor = () => {
    if (stopwatchRunning) return "from-blue-500 to-cyan-500";
    switch (pomodoroMode) {
      case "work":
        return "from-orange-500 to-red-500";
      case "shortBreak":
        return "from-green-500 to-emerald-500";
      case "longBreak":
        return "from-blue-500 to-indigo-500";
      default:
        return "from-orange-500 to-red-500";
    }
  };

  const getModeLabel = () => {
    if (stopwatchRunning) return "Stopwatch";
    switch (pomodoroMode) {
      case "work":
        return "Focus";
      case "shortBreak":
        return "Short Break";
      case "longBreak":
        return "Long Break";
      default:
        return "Timer";
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div
        className={cn(
          "flex items-center gap-2.5 px-3 py-2 rounded-full shadow-lg",
          "bg-linear-to-r text-white",
          getModeColor()
        )}
      >
        {/* Pulsing dot indicator - like Blinkit */}
        <div className="relative flex items-center justify-center">
          <div className="h-2.5 w-2.5 rounded-full bg-white" />
          <div className="absolute h-2.5 w-2.5 rounded-full bg-white animate-ping" />
        </div>

        {/* Icon */}
        {stopwatchRunning ? (
          <Play className="h-4 w-4" />
        ) : (
          <Timer className="h-4 w-4" />
        )}

        {/* Label and time */}
        <div className="flex flex-col items-start leading-tight">
          <span className="text-[10px] font-medium opacity-90">{getModeLabel()}</span>
          <span className="text-sm font-bold tabular-nums">
            {stopwatchRunning ? formatStopwatchTime(stopwatchTime) : formatTime(pomodoroTimeLeft)}
          </span>
        </div>
      </div>
    </div>
  );
}
