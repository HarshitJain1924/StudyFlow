"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStudy } from "@/lib/study-context";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Trophy,
  Flame,
  Clock,
  CheckCircle2,
  Star,
  Zap,
  Crown,
  Medal,
  Target,
  Rocket,
  Brain,
  Calendar,
} from "lucide-react";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  requirement: string;
  isUnlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

export function AchievementBadges() {
  const { stats } = useStudy();

  const badges: Badge[] = useMemo(() => {
    const totalHours = Math.floor(stats.totalStudyTime / 3600);
    const totalTasks = stats.totalTasksCompleted;
    const streak = stats.currentStreak;
    const longestStreak = stats.longestStreak;

    return [
      // Time-based badges
      {
        id: "first-hour",
        name: "First Hour",
        description: "Study for 1 hour total",
        icon: <Clock className="h-5 w-5" />,
        color: "text-blue-500",
        bgColor: "bg-blue-500/20",
        requirement: "1 hour studied",
        isUnlocked: totalHours >= 1,
        progress: Math.min(stats.totalStudyTime / 3600, 1),
        maxProgress: 1,
      },
      {
        id: "dedicated",
        name: "Dedicated",
        description: "Study for 10 hours total",
        icon: <Brain className="h-5 w-5" />,
        color: "text-purple-500",
        bgColor: "bg-purple-500/20",
        requirement: "10 hours studied",
        isUnlocked: totalHours >= 10,
        progress: Math.min(totalHours, 10),
        maxProgress: 10,
      },
      {
        id: "scholar",
        name: "Scholar",
        description: "Study for 50 hours total",
        icon: <Star className="h-5 w-5" />,
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/20",
        requirement: "50 hours studied",
        isUnlocked: totalHours >= 50,
        progress: Math.min(totalHours, 50),
        maxProgress: 50,
      },
      {
        id: "master",
        name: "Master",
        description: "Study for 100 hours total",
        icon: <Crown className="h-5 w-5" />,
        color: "text-amber-500",
        bgColor: "bg-amber-500/20",
        requirement: "100 hours studied",
        isUnlocked: totalHours >= 100,
        progress: Math.min(totalHours, 100),
        maxProgress: 100,
      },

      // Task-based badges
      {
        id: "starter",
        name: "Starter",
        description: "Complete 10 tasks",
        icon: <CheckCircle2 className="h-5 w-5" />,
        color: "text-green-500",
        bgColor: "bg-green-500/20",
        requirement: "10 tasks completed",
        isUnlocked: totalTasks >= 10,
        progress: Math.min(totalTasks, 10),
        maxProgress: 10,
      },
      {
        id: "productive",
        name: "Productive",
        description: "Complete 50 tasks",
        icon: <Zap className="h-5 w-5" />,
        color: "text-orange-500",
        bgColor: "bg-orange-500/20",
        requirement: "50 tasks completed",
        isUnlocked: totalTasks >= 50,
        progress: Math.min(totalTasks, 50),
        maxProgress: 50,
      },
      {
        id: "achiever",
        name: "Achiever",
        description: "Complete 100 tasks",
        icon: <Medal className="h-5 w-5" />,
        color: "text-cyan-500",
        bgColor: "bg-cyan-500/20",
        requirement: "100 tasks completed",
        isUnlocked: totalTasks >= 100,
        progress: Math.min(totalTasks, 100),
        maxProgress: 100,
      },
      {
        id: "champion",
        name: "Champion",
        description: "Complete 500 tasks",
        icon: <Trophy className="h-5 w-5" />,
        color: "text-rose-500",
        bgColor: "bg-rose-500/20",
        requirement: "500 tasks completed",
        isUnlocked: totalTasks >= 500,
        progress: Math.min(totalTasks, 500),
        maxProgress: 500,
      },

      // Streak-based badges
      {
        id: "consistent",
        name: "Consistent",
        description: "Maintain a 3-day streak",
        icon: <Flame className="h-5 w-5" />,
        color: "text-red-500",
        bgColor: "bg-red-500/20",
        requirement: "3-day streak",
        isUnlocked: longestStreak >= 3,
        progress: Math.min(streak, 3),
        maxProgress: 3,
      },
      {
        id: "weekly-warrior",
        name: "Weekly Warrior",
        description: "Maintain a 7-day streak",
        icon: <Calendar className="h-5 w-5" />,
        color: "text-indigo-500",
        bgColor: "bg-indigo-500/20",
        requirement: "7-day streak",
        isUnlocked: longestStreak >= 7,
        progress: Math.min(streak, 7),
        maxProgress: 7,
      },
      {
        id: "unstoppable",
        name: "Unstoppable",
        description: "Maintain a 30-day streak",
        icon: <Rocket className="h-5 w-5" />,
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/20",
        requirement: "30-day streak",
        isUnlocked: longestStreak >= 30,
        progress: Math.min(streak, 30),
        maxProgress: 30,
      },
      {
        id: "legendary",
        name: "Legendary",
        description: "Maintain a 100-day streak",
        icon: <Target className="h-5 w-5" />,
        color: "text-pink-500",
        bgColor: "bg-pink-500/20",
        requirement: "100-day streak",
        isUnlocked: longestStreak >= 100,
        progress: Math.min(streak, 100),
        maxProgress: 100,
      },
    ];
  }, [stats]);

  const unlockedCount = badges.filter((b) => b.isUnlocked).length;

  return (
    <Card>
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Achievements
          </span>
          <span className="text-xs text-muted-foreground font-normal">
            {unlockedCount}/{badges.length} unlocked
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <TooltipProvider delayDuration={100}>
          <div className="grid grid-cols-4 gap-2">
            {badges.map((badge) => (
              <Tooltip key={badge.id}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "aspect-square rounded-lg flex items-center justify-center transition-all cursor-pointer",
                      badge.isUnlocked
                        ? cn(badge.bgColor, badge.color, "hover:scale-110")
                        : "bg-muted/50 text-muted-foreground/30"
                    )}
                  >
                    {badge.icon}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px]">
                  <div className="space-y-1">
                    <p className={cn("font-semibold", badge.isUnlocked && badge.color)}>
                      {badge.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                    {!badge.isUnlocked && badge.progress !== undefined && (
                      <div className="space-y-1">
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", badge.bgColor.replace("/20", ""))}
                            style={{
                              width: `${(badge.progress / (badge.maxProgress || 1)) * 100}%`,
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {badge.progress}/{badge.maxProgress}
                        </p>
                      </div>
                    )}
                    {badge.isUnlocked && (
                      <p className="text-[10px] text-green-500">✓ Unlocked!</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
