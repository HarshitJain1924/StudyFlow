"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useStudy } from "@/lib/study-context";
import { formatTime } from "@/lib/study-types";
import { cn } from "@/lib/utils";
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  addMonths,
  subMonths,
} from "date-fns";
import {
  Clock,
  CheckCircle2,
  Flame,
  Trophy,
  Target,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AchievementBadges } from "@/components/achievement-badges";

export function StatsOverview() {
  const { stats, settings, getTodayStudyTime, getTodayTasks } = useStudy();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const todayStudyTime = getTodayStudyTime();
  const todayTasks = getTodayTasks();
  const dailyGoalSeconds = settings.dailyGoal * 60;
  const dailyProgress = Math.min((todayStudyTime / dailyGoalSeconds) * 100, 100);

  const today = new Date();
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 0 });
  const currentWeekEnd = endOfWeek(today, { weekStartsOn: 0 });

  // Calendar days for current month view
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Get activity data for a date
  const getDateActivity = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return stats.weeklyData.find((d) => d.date === dateStr);
  };

  // Get intensity level for heatmap
  const getIntensityLevel = (minutes: number): number => {
    if (minutes === 0) return 0;
    if (minutes < 15) return 1;
    if (minutes < 30) return 2;
    if (minutes < 60) return 3;
    return 4;
  };

  const intensityColors = [
    "bg-muted/30",
    "bg-emerald-200 dark:bg-emerald-900/70",
    "bg-emerald-300 dark:bg-emerald-700",
    "bg-emerald-400 dark:bg-emerald-500",
    "bg-emerald-500 dark:bg-emerald-400",
  ];

  // Generate last 10 weeks of data for contribution heatmap
  const contributionData = useMemo(() => {
    const startDate = subDays(startOfWeek(today, { weekStartsOn: 0 }), 9 * 7);
    const days = eachDayOfInterval({ start: startDate, end: today });
    
    return days.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const dayData = stats.weeklyData.find((d) => d.date === dateStr);
      return {
        date: day,
        dateStr,
        minutes: dayData?.minutes || 0,
        tasks: dayData?.tasks || 0,
      };
    });
  }, [stats.weeklyData, today]);

  // Group by weeks for heatmap grid
  const weeks = useMemo(() => {
    const weekGroups: typeof contributionData[] = [];
    for (let i = 0; i < contributionData.length; i += 7) {
      weekGroups.push(contributionData.slice(i, i + 7));
    }
    return weekGroups;
  }, [contributionData]);

  // Stats totals
  const totalMinutes = contributionData.reduce((sum, d) => sum + d.minutes, 0);
  const totalTasks = contributionData.reduce((sum, d) => sum + d.tasks, 0);
  const activeDays = contributionData.filter((d) => d.minutes > 0).length;

  // Current week stats (for the highlighted week)
  const currentWeekStats = useMemo(() => {
    const weekDays = eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd });
    let minutes = 0;
    let tasks = 0;
    let daysActive = 0;
    
    weekDays.forEach((day) => {
      const activity = getDateActivity(day);
      if (activity) {
        minutes += activity.minutes;
        tasks += activity.tasks;
        if (activity.minutes > 0) daysActive++;
      }
    });
    
    // Use weekly goal from settings (or fallback to daily * 7)
    const weeklyGoal = settings.weeklyGoal || settings.dailyGoal * 7;
    const progress = Math.min((minutes / weeklyGoal) * 100, 100);
    
    return { minutes, tasks, daysActive, weeklyGoal, progress };
  }, [currentWeekStart, currentWeekEnd, stats.weeklyData, settings.dailyGoal, settings.weeklyGoal]);

  return (
    <div className="space-y-3">
      {/* Daily Goal Progress */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Daily Goal</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatTime(todayStudyTime)} / {settings.dailyGoal}m
            </span>
          </div>
          <Progress value={dailyProgress} className="h-2" />
        </CardContent>
      </Card>

      {/* This Week Summary - Connected to the highlighted week in calendar */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Weekly Goal</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {format(currentWeekStart, "MMM d")} - {format(currentWeekEnd, "MMM d")}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">
              {formatTime(currentWeekStats.minutes * 60)} / {Math.floor(currentWeekStats.weeklyGoal / 60)}h goal
            </span>
            <span className="font-medium text-primary">
              {Math.round(currentWeekStats.progress)}%
            </span>
          </div>
          <Progress value={currentWeekStats.progress} className="h-2 mb-2" />
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-sm font-bold">{formatTime(currentWeekStats.minutes * 60)}</div>
              <p className="text-[10px] text-muted-foreground">studied</p>
            </div>
            <div>
              <div className="text-sm font-bold">{currentWeekStats.tasks}</div>
              <p className="text-[10px] text-muted-foreground">tasks</p>
            </div>
            <div>
              <div className="text-sm font-bold">{currentWeekStats.daysActive}/7</div>
              <p className="text-[10px] text-muted-foreground">days active</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compact Stats Row */}
      <div className="grid grid-cols-4 gap-2">
        <div className="text-center p-2 bg-muted/50 rounded-lg">
          <Clock className="h-4 w-4 mx-auto mb-1 text-blue-500" />
          <div className="text-sm font-bold">{formatTime(todayStudyTime)}</div>
          <p className="text-[10px] text-muted-foreground">Today</p>
        </div>
        <div className="text-center p-2 bg-muted/50 rounded-lg">
          <CheckCircle2 className="h-4 w-4 mx-auto mb-1 text-green-500" />
          <div className="text-sm font-bold">{todayTasks}</div>
          <p className="text-[10px] text-muted-foreground">Tasks</p>
        </div>
        <div className="text-center p-2 bg-muted/50 rounded-lg">
          <Flame className="h-4 w-4 mx-auto mb-1 text-orange-500" />
          <div className="text-sm font-bold">{stats.currentStreak}</div>
          <p className="text-[10px] text-muted-foreground">Streak</p>
        </div>
        <div className="text-center p-2 bg-muted/50 rounded-lg">
          <Trophy className="h-4 w-4 mx-auto mb-1 text-yellow-500" />
          <div className="text-sm font-bold">{stats.longestStreak}</div>
          <p className="text-[10px] text-muted-foreground">Best</p>
        </div>
      </div>

      {/* Monthly Calendar with Current Week Highlight */}
      <Card>
        <CardHeader className="pb-2 px-3 pt-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Calendar
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs font-medium w-20 text-center">
                {format(currentMonth, "MMM yyyy")}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
              <div
                key={i}
                className="text-[10px] text-center text-muted-foreground font-medium"
              >
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, today);
              const isCurrentWeek = isWithinInterval(day, {
                start: currentWeekStart,
                end: currentWeekEnd,
              });
              const activity = getDateActivity(day);
              const hasStudied = activity && activity.minutes > 0;
              
              return (
                <TooltipProvider key={day.toISOString()} delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "aspect-square flex items-center justify-center text-[11px] rounded-md transition-all cursor-default",
                          !isCurrentMonth && "text-muted-foreground/30",
                          isCurrentMonth && "text-foreground",
                          isCurrentWeek && isCurrentMonth && "bg-primary/10",
                          isToday && "ring-2 ring-primary ring-offset-1 ring-offset-background font-bold",
                          hasStudied && isCurrentMonth && "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-medium",
                          hasStudied && isToday && "bg-emerald-500/30"
                        )}
                      >
                        {format(day, "d")}
                      </div>
                    </TooltipTrigger>
                    {activity && activity.minutes > 0 && (
                      <TooltipContent side="top" className="text-xs">
                        <p className="font-medium">{format(day, "MMM d")}</p>
                        <p className="text-muted-foreground">
                          {activity.minutes}m studied
                          {activity.tasks > 0 && ` • ${activity.tasks} tasks`}
                        </p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Activity Heatmap */}
      <Card>
        <CardHeader className="pb-2 px-3 pt-3">
          <CardTitle className="text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Activity
            </span>
            <span className="text-muted-foreground font-normal">
              {activeDays} active days
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <TooltipProvider delayDuration={100}>
            <div className="flex gap-1 justify-center">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day) => {
                    const level = getIntensityLevel(day.minutes);
                    const isToday = isSameDay(day.date, today);
                    return (
                      <Tooltip key={day.dateStr}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "w-3 h-3 rounded-sm cursor-pointer transition-all hover:scale-110",
                              intensityColors[level],
                              isToday && "ring-1 ring-primary"
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <p className="font-medium">{format(day.date, "MMM d, yyyy")}</p>
                          <p className="text-muted-foreground">
                            {day.minutes > 0 ? `${day.minutes}m studied` : "No activity"}
                            {day.tasks > 0 && ` • ${day.tasks} tasks`}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </TooltipProvider>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-2 mt-3 text-[10px] text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-1">
              {intensityColors.map((color, i) => (
                <div key={i} className={cn("w-3 h-3 rounded-sm", color)} />
              ))}
            </div>
            <span>More</span>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
            <div className="text-center">
              <div className="text-sm font-bold">{formatTime(totalMinutes * 60)}</div>
              <p className="text-[10px] text-muted-foreground">Last 10 weeks</p>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold">{totalTasks}</div>
              <p className="text-[10px] text-muted-foreground">Tasks done</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievement Badges */}
      <AchievementBadges />
    </div>
  );
}
