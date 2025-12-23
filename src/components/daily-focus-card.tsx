"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Target,
  Play,
  ListTodo,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  Square,
  Clock,
} from "lucide-react";
import { DailyFocus, getDailyFocusMessage } from "@/lib/daily-focus";
import { useTimer } from "@/lib/timer-context";
import { useStudy } from "@/lib/study-context";
import { parseTimeEstimate } from "@/lib/markdown-parser";

interface DailyFocusCardProps {
  focus: DailyFocus;
  onStartNow: (plannedMinutes?: number) => void; // Extended to pass time to Pomodoro
  onViewPlan: () => void;
}

/**
 * DailyFocusCard - Shows the user's highest priority task for today.
 * 
 * Design principles:
 * - Calm, focused, Notion-like aesthetic
 * - One clear task - reduce decision fatigue to zero
 * - Immediate action with "Start Now" button
 * - Execution lock integration - only one task at a time
 * - Task-Aware Pomodoro: parses time from task text
 */
export function DailyFocusCard({ focus, onStartNow, onViewPlan }: DailyFocusCardProps) {
  const { goal, checklist, nextTask, checklistDeleted } = focus;
  const focusMessage = getDailyFocusMessage(focus);
  const { timerState, lockTask, unlockTask, isTaskLocked, startPomodoro } = useTimer();
  const { settings } = useStudy();
  
  // Check if THIS task is the locked one
  const isThisTaskLocked = timerState.activeTask?.goalId === goal.id;
  
  // Parse time estimate from task text (e.g., "Arrays – Basics (25m)" → 25)
  // v1.1 Fix: nextTask now carries the pre-parsed timeEstimate from the parser
  const plannedMinutes = nextTask?.timeEstimate;
  
  // Calculate checklist progress
  const checklistProgress = checklist
    ? Math.round((checklist.totalCompleted / Math.max(checklist.totalItems, 1)) * 100)
    : 0;

  // Determine badge color based on goal type
  const getTypeBadgeColor = (type: typeof goal.type) => {
    switch (type) {
      case "daily":
        return "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300";
      case "weekly":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
      case "monthly":
        return "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300";
      case "custom":
        return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300";
    }
  };

  const hasActionablePlan = checklist && nextTask;
  const allTasksComplete = checklist && !nextTask && !checklistDeleted;

  // Find taskId and sectionId for marking complete later
  const findTaskIds = (): { taskId?: string; sectionId?: string } => {
    if (!checklist || !nextTask) return {};
    for (const section of checklist.sections) {
      for (const item of section.items) {
        if (item.text === nextTask.text && !item.completed) {
          return { taskId: item.id, sectionId: section.id };
        }
        // Check children
        for (const child of item.children || []) {
          if (child.text === nextTask.text && !child.completed) {
            return { taskId: child.id, sectionId: section.id };
          }
        }
      }
    }
    return {};
  };

  // Handle starting work - locks the task AND starts the timer
  const handleStartNow = () => {
    const { taskId, sectionId } = findTaskIds();
    
    // Step 1: Lock the task (sets activeTask state)
    lockTask({
      goalId: goal.id,
      goalTitle: goal.title,
      goalEmoji: goal.emoji,
      taskText: nextTask?.text || focusMessage,
      checklistId: checklist?.id,
      taskId,
      sectionId,
      plannedMinutes,
    });
    
    // Step 2: Issue START COMMAND to Pomodoro timer
    // If task has a time estimate, use it. Otherwise use default setting.
    const duration = plannedMinutes || settings.pomodoro.workDuration;
    startPomodoro(duration, "task");
    
    // Step 3: Notify parent (for navigation)
    onStartNow(plannedMinutes);
  };

  // Handle stopping work - unlocks the task  
  const handleStopWorking = () => {
    unlockTask();
  };

  return (
    <Card className={`border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 shadow-lg ${isThisTaskLocked ? "ring-2 ring-amber-500" : ""}`}>
      <CardContent className="pt-5 pb-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50">
            <Target className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
            Today&apos;s Focus
          </span>
          {isThisTaskLocked ? (
            <Badge className="bg-green-500 text-white text-[10px] ml-auto">
              <Clock className="h-3 w-3 mr-1" />
              In Progress
            </Badge>
          ) : (
            <Sparkles className="h-3.5 w-3.5 text-amber-500/70" />
          )}
        </div>

        {/* Goal Info */}
        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl">{goal.emoji || "🎯"}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{goal.title}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge variant="outline" className={`text-[10px] ${getTypeBadgeColor(goal.type)}`}>
                {goal.type}
              </Badge>
              {goal.mode === "check" && (
                <Badge variant="outline" className="text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                  checklist
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Focus Message / Next Task */}
        <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3 mb-4 border border-amber-200/50 dark:border-amber-800/50">
          {checklistDeleted ? (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="text-sm">{focusMessage}</span>
            </div>
          ) : allTasksComplete ? (
            <div className="text-center py-2">
              <span className="text-lg">🎉</span>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-1">
                All tasks completed!
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-foreground leading-relaxed">
                {focusMessage}
              </p>
              {nextTask && (
                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                  <ListTodo className="h-3 w-3" />
                  {nextTask.sectionTitle}
                </p>
              )}
            </>
          )}
        </div>

        {/* Checklist Progress */}
        {checklist && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Progress</span>
              <span>{checklist.totalCompleted} / {checklist.totalItems} tasks</span>
            </div>
            <Progress 
              value={checklistProgress} 
              className={`h-2 ${allTasksComplete ? "[&>div]:bg-green-500" : ""}`} 
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {isThisTaskLocked ? (
            // Task is locked - show stop button
            <>
              <Button 
                variant="outline"
                onClick={handleStopWorking}
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400"
              >
                <Square className="h-4 w-4 mr-2" />
                Stop Working
              </Button>
              <Button 
                variant="outline" 
                onClick={onViewPlan}
                className="border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50"
              >
                <ListTodo className="h-4 w-4" />
              </Button>
            </>
          ) : hasActionablePlan ? (
            <>
              <Button 
                onClick={handleStartNow} 
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                disabled={isTaskLocked && !isThisTaskLocked}
              >
                <Play className="h-4 w-4 mr-2" />
                {isTaskLocked ? "Another Task Active" : "Start Now"}
              </Button>
              <Button 
                variant="outline" 
                onClick={onViewPlan}
                className="border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50"
              >
                <ListTodo className="h-4 w-4" />
              </Button>
            </>
          ) : checklist ? (
            <Button 
              variant="outline" 
              onClick={onViewPlan}
              className="w-full border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50"
            >
              <ListTodo className="h-4 w-4 mr-2" />
              View Plan
              <ChevronRight className="h-4 w-4 ml-auto" />
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={onViewPlan}
              className="w-full border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50"
            >
              <Target className="h-4 w-4 mr-2" />
              Go to Goals
              <ChevronRight className="h-4 w-4 ml-auto" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Empty state when there's no focus available.
 */
export function DailyFocusEmptyState({ onCreateGoal }: { onCreateGoal: () => void }) {
  return (
    <Card className="border-dashed border-2 border-muted-foreground/20">
      <CardContent className="py-8 text-center">
        <div className="inline-flex p-3 rounded-full bg-muted mb-3">
          <Target className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium mb-1">No Focus Set</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Create a goal to get personalized daily focus
        </p>
        <Button variant="outline" onClick={onCreateGoal}>
          <Target className="h-4 w-4 mr-2" />
          Set a Goal
        </Button>
      </CardContent>
    </Card>
  );
}
