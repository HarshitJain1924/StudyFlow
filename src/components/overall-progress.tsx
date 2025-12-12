"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Trophy, Target, Flame, Star } from "lucide-react";

interface OverallProgressProps {
  title: string;
  emoji?: string;
  completed: number;
  total: number;
}

export function OverallProgress({ title, emoji, completed, total }: OverallProgressProps) {
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isComplete = completed === total && total > 0;
  
  const getMotivationalMessage = () => {
    if (progress === 0) return "Let's get started! 🚀";
    if (progress < 25) return "Great start! Keep going! 💪";
    if (progress < 50) return "You're making progress! 📈";
    if (progress < 75) return "More than halfway there! 🔥";
    if (progress < 100) return "Almost there! Don't stop now! ⚡";
    return "Congratulations! You did it! 🎉";
  };

  const getProgressColor = () => {
    if (progress < 25) return "text-red-500";
    if (progress < 50) return "text-orange-500";
    if (progress < 75) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-500",
      isComplete && "border-green-500 shadow-green-500/20 shadow-lg"
    )}>
      <div className={cn(
        "h-1.5 transition-all duration-500",
        progress < 25 && "bg-red-500",
        progress >= 25 && progress < 50 && "bg-orange-500",
        progress >= 50 && progress < 75 && "bg-yellow-500",
        progress >= 75 && "bg-green-500"
      )} style={{ width: `${progress}%` }} />
      
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {emoji && <span className="text-3xl">{emoji}</span>}
            <div>
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="text-sm text-muted-foreground">
                {getMotivationalMessage()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isComplete ? (
              <Trophy className="h-8 w-8 text-yellow-500 animate-bounce" />
            ) : (
              <Target className={cn("h-8 w-8", getProgressColor())} />
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className={cn("font-bold", getProgressColor())}>
              {progress}%
            </span>
          </div>
          <Progress value={progress} className="h-3" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {completed} of {total} tasks completed
            </span>
            <span className="text-muted-foreground">
              {total - completed} remaining
            </span>
          </div>
        </div>
        
        {/* Achievement badges */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {progress >= 25 && (
            <div className="flex items-center gap-1 bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-full text-xs">
              <Flame className="h-3 w-3" />
              25% Milestone
            </div>
          )}
          {progress >= 50 && (
            <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded-full text-xs">
              <Star className="h-3 w-3" />
              Halfway There
            </div>
          )}
          {progress >= 75 && (
            <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full text-xs">
              <Target className="h-3 w-3" />
              75% Champion
            </div>
          )}
          {progress === 100 && (
            <div className="flex items-center gap-1 bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400 px-2 py-1 rounded-full text-xs">
              <Trophy className="h-3 w-3" />
              Complete!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
