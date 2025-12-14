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
        "h-1 transition-all duration-500",
        progress < 25 && "bg-red-500",
        progress >= 25 && progress < 50 && "bg-orange-500",
        progress >= 50 && progress < 75 && "bg-yellow-500",
        progress >= 75 && "bg-green-500"
      )} style={{ width: `${progress}%` }} />
      
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {emoji && <span className="text-2xl">{emoji}</span>}
            <div>
              <h2 className="text-lg font-bold">{title}</h2>
              <p className="text-xs text-muted-foreground">
                {getMotivationalMessage()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isComplete ? (
              <Trophy className="h-6 w-6 text-yellow-500 animate-bounce" />
            ) : (
              <Target className={cn("h-6 w-6", getProgressColor())} />
            )}
          </div>
        </div>
        
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className={cn("font-bold", getProgressColor())}>
              {progress}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              {completed} of {total} tasks completed
            </span>
            <span className="text-muted-foreground">
              {total - completed} remaining
            </span>
          </div>
        </div>
        
        {/* Achievement badges */}
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {progress >= 25 && (
            <div className="flex items-center gap-1 bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded-full text-[10px]">
              <Flame className="h-2.5 w-2.5" />
              25%
            </div>
          )}
          {progress >= 50 && (
            <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded-full text-[10px]">
              <Star className="h-2.5 w-2.5" />
              50%
            </div>
          )}
          {progress >= 75 && (
            <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full text-[10px]">
              <Target className="h-2.5 w-2.5" />
              75%
            </div>
          )}
          {progress === 100 && (
            <div className="flex items-center gap-1 bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-full text-[10px]">
              <Trophy className="h-2.5 w-2.5" />
              Done!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
