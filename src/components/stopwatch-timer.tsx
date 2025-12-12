"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useStudy } from "@/lib/study-context";
import {
  Play,
  Pause,
  RotateCcw,
  Flag,
  Timer,
  Trash2,
  Save,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface LapTime {
  id: number;
  time: number;
  delta: number;
}

export function StopwatchTimer() {
  const { addStudyTime, addSession } = useStudy();
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<LapTime[]>([]);
  const [lastLapTime, setLastLapTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);

  // Format time as HH:MM:SS.ms
  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`;
  };

  // Format time short (for laps)
  const formatTimeShort = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        setTime(accumulatedTimeRef.current + (Date.now() - startTimeRef.current));
      }, 10);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  // Save accumulated time when pausing
  useEffect(() => {
    if (!isRunning) {
      accumulatedTimeRef.current = time;
    }
  }, [isRunning, time]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTime(0);
    setLaps([]);
    setLastLapTime(0);
    accumulatedTimeRef.current = 0;
  };

  const addLap = () => {
    if (time === 0) return;
    
    const delta = time - lastLapTime;
    const newLap: LapTime = {
      id: laps.length + 1,
      time: time,
      delta: delta,
    };
    setLaps((prev) => [newLap, ...prev]);
    setLastLapTime(time);
  };

  const clearLaps = () => {
    setLaps([]);
    setLastLapTime(0);
  };

  const saveSession = useCallback(() => {
    if (time < 1000) {
      toast.error("Session too short", { description: "Record at least 1 second to save" });
      return;
    }
    
    const durationSeconds = Math.floor(time / 1000);
    addStudyTime(durationSeconds);
    addSession({
      date: new Date().toISOString(),
      duration: durationSeconds,
      tasksCompleted: 0,
    });
    
    // Format time for toast
    const mins = Math.floor(durationSeconds / 60);
    const secs = durationSeconds % 60;
    const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    
    toast.success("Session saved! ⏱️", { 
      description: `Added ${timeStr} to your study time` 
    });
    
    // Reset after saving
    setIsRunning(false);
    setTime(0);
    setLaps([]);
    setLastLapTime(0);
    accumulatedTimeRef.current = 0;
  }, [time, addStudyTime, addSession]);

  // Find best and worst laps
  const bestLap = laps.length > 1 
    ? laps.reduce((min, lap) => lap.delta < min.delta ? lap : min, laps[0])
    : null;
  const worstLap = laps.length > 1
    ? laps.reduce((max, lap) => lap.delta > max.delta ? lap : max, laps[0])
    : null;

  return (
    <Card className="overflow-hidden">
      <div className="h-1 bg-violet-500" />
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            <span className="font-semibold">Stopwatch</span>
          </div>
          {time > 0 && !isRunning && (
            <Button
              variant="ghost"
              size="sm"
              onClick={saveSession}
              className="text-xs gap-1"
            >
              <Save className="h-3 w-3" />
              Save
            </Button>
          )}
        </div>

        {/* Main Time Display */}
        <div className="text-center mb-6">
          <div
            className={cn(
              "font-mono text-4xl font-bold tabular-nums tracking-tight",
              isRunning && "text-violet-500"
            )}
          >
            {formatTime(time)}
          </div>
          {laps.length > 0 && (
            <div className="text-sm text-muted-foreground mt-1">
              Current lap: {formatTimeShort(time - lastLapTime)}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <Button
            variant="outline"
            size="icon"
            onClick={resetTimer}
            disabled={time === 0 && !isRunning}
            className="rounded-full h-10 w-10"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            onClick={toggleTimer}
            className={cn(
              "rounded-full h-14 w-14 transition-colors",
              isRunning
                ? "bg-orange-500 hover:bg-orange-600"
                : "bg-violet-500 hover:bg-violet-600"
            )}
          >
            {isRunning ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-0.5" />
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={addLap}
            disabled={!isRunning && time === 0}
            className="rounded-full h-10 w-10"
          >
            <Flag className="h-4 w-4" />
          </Button>
        </div>

        {/* Lap Times */}
        {laps.length > 0 && (
          <div className="border-t pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">
                Laps ({laps.length})
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearLaps}
                className="h-6 text-xs"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
            <ScrollArea className="h-32">
              <div className="space-y-1">
                {laps.map((lap) => (
                  <div
                    key={lap.id}
                    className={cn(
                      "flex items-center justify-between text-sm py-1 px-2 rounded",
                      bestLap?.id === lap.id && laps.length > 1 && "bg-green-500/10 text-green-600 dark:text-green-400",
                      worstLap?.id === lap.id && laps.length > 1 && "bg-red-500/10 text-red-600 dark:text-red-400"
                    )}
                  >
                    <span className="font-medium">Lap {lap.id}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-muted-foreground">
                        +{formatTimeShort(lap.delta)}
                      </span>
                      <span className="font-mono font-medium">
                        {formatTimeShort(lap.time)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
