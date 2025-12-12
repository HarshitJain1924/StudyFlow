"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Target, 
  Plus, 
  Flame, 
  Calendar, 
  Clock, 
  Trophy,
  Pencil,
  Trash2,
  MoreHorizontal,
  CheckCircle2,
  ArrowLeft,
  CalendarDays,
  CalendarRange,
  Timer
} from "lucide-react";
import { useStudy } from "@/lib/study-context";
import { toast } from "sonner";
import { format, isWithinInterval, parseISO, startOfMonth, endOfMonth, startOfDay } from "date-fns";

interface Goal {
  id: string;
  title: string;
  type: "daily" | "weekly" | "monthly" | "custom";
  targetMinutes: number;
  createdAt: string;
  deadline?: string;
  emoji?: string;
}

const GOAL_EMOJIS = ["🎯", "📚", "💪", "🚀", "⭐", "🔥", "💡", "🏆", "✨", "📖", "🎓", "💻"];

const DEFAULT_GOALS: Partial<Goal>[] = [
  { title: "Quick Focus", targetMinutes: 30, emoji: "⚡" },
  { title: "Deep Work", targetMinutes: 120, emoji: "🧠" },
  { title: "Marathon Session", targetMinutes: 240, emoji: "🏃" },
  { title: "Full Day", targetMinutes: 480, emoji: "🌟" },
];

interface GoalsPageProps {
  onBack: () => void;
}

export function GoalsPage({ onBack }: GoalsPageProps) {
  const { stats, getTodayStudyTime } = useStudy();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [newGoal, setNewGoal] = useState({
    title: "",
    type: "daily" as Goal["type"],
    targetHours: 2,
    targetMinutes: 0,
    emoji: "🎯",
    deadline: "",
  });

  // Load goals from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("study-goals");
    if (saved) {
      try {
        setGoals(JSON.parse(saved));
      } catch {
        // Invalid JSON, keep empty
      }
    }
    setIsHydrated(true);
  }, []);

  // Save goals to localStorage
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem("study-goals", JSON.stringify(goals));
    }
  }, [goals, isHydrated]);

  const handleAddGoal = () => {
    const totalMinutes = newGoal.targetHours * 60 + newGoal.targetMinutes;
    if (!newGoal.title.trim() || totalMinutes <= 0) {
      toast.error("Please enter a valid goal title and time");
      return;
    }

    const goal: Goal = {
      id: crypto.randomUUID(),
      title: newGoal.title.trim(),
      type: newGoal.type,
      targetMinutes: totalMinutes,
      createdAt: new Date().toISOString(),
      emoji: newGoal.emoji,
      deadline: newGoal.deadline || undefined,
    };

    setGoals((prev) => [...prev, goal]);
    toast.success(`Goal "${goal.title}" created!`);
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEditGoal = () => {
    if (!editingGoal) return;
    const totalMinutes = newGoal.targetHours * 60 + newGoal.targetMinutes;
    if (!newGoal.title.trim() || totalMinutes <= 0) {
      toast.error("Please enter a valid goal title and time");
      return;
    }

    setGoals((prev) =>
      prev.map((g) =>
        g.id === editingGoal.id
          ? {
              ...g,
              title: newGoal.title.trim(),
              type: newGoal.type,
              targetMinutes: totalMinutes,
              emoji: newGoal.emoji,
              deadline: newGoal.deadline || undefined,
            }
          : g
      )
    );
    toast.success("Goal updated!");
    resetForm();
    setEditingGoal(null);
  };

  const handleDeleteGoal = (goal: Goal) => {
    setGoals((prev) => prev.filter((g) => g.id !== goal.id));
    toast.success(`Goal "${goal.title}" deleted`);
  };

  const openEditDialog = (goal: Goal) => {
    setEditingGoal(goal);
    setNewGoal({
      title: goal.title,
      type: goal.type,
      targetHours: Math.floor(goal.targetMinutes / 60),
      targetMinutes: goal.targetMinutes % 60,
      emoji: goal.emoji || "🎯",
      deadline: goal.deadline || "",
    });
  };

  const resetForm = () => {
    setNewGoal({
      title: "",
      type: "daily",
      targetHours: 2,
      targetMinutes: 0,
      emoji: "🎯",
      deadline: "",
    });
  };

  const getProgressForGoal = (goal: Goal) => {
    const today = new Date();
    let studyTime = 0;
    const todayMinutes = Math.floor(getTodayStudyTime() / 60);

    if (goal.type === "daily") {
      studyTime = todayMinutes;
    } else if (goal.type === "weekly") {
      studyTime = stats.weeklyData.reduce((sum, d) => sum + d.minutes, 0);
    } else if (goal.type === "monthly") {
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);
      studyTime = stats.weeklyData
        .filter((d) => {
          const date = parseISO(d.date);
          return isWithinInterval(date, { start: monthStart, end: monthEnd });
        })
        .reduce((sum, d) => sum + d.minutes, 0);
    } else if (goal.type === "custom" && goal.deadline) {
      const goalStart = parseISO(goal.createdAt);
      const goalEnd = parseISO(goal.deadline);
      studyTime = stats.weeklyData
        .filter((d) => {
          const date = parseISO(d.date);
          return isWithinInterval(date, { start: startOfDay(goalStart), end: goalEnd });
        })
        .reduce((sum, d) => sum + d.minutes, 0);
    }

    const progress = Math.min(100, (studyTime / goal.targetMinutes) * 100);
    return { studyTime, progress };
  };

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const getTypeBadgeColor = (type: Goal["type"]) => {
    switch (type) {
      case "daily": return "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300";
      case "weekly": return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
      case "monthly": return "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300";
      case "custom": return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300";
    }
  };

  const todayMinutes = Math.floor(getTodayStudyTime() / 60);
  const weeklyMinutes = stats.weeklyData.reduce((sum, d) => sum + d.minutes, 0);

  const dailyGoals = goals.filter((g) => g.type === "daily");
  const weeklyGoals = goals.filter((g) => g.type === "weekly");
  const monthlyGoals = goals.filter((g) => g.type === "monthly");
  const customGoals = goals.filter((g) => g.type === "custom");

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Goals
          </h1>
          <p className="text-muted-foreground text-sm">Track your study targets and achievements</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Goal
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Today</span>
            </div>
            <p className="text-2xl font-bold">{formatTime(todayMinutes)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-xs">This Week</span>
            </div>
            <p className="text-2xl font-bold">{formatTime(weeklyMinutes)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-xs">Streak</span>
            </div>
            <p className="text-2xl font-bold">{stats.currentStreak} days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-xs">Goals Met</span>
            </div>
            <p className="text-2xl font-bold">
              {goals.filter((g) => getProgressForGoal(g).progress >= 100).length}/{goals.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Custom Goals */}
      <div className="space-y-6">
        {/* Daily Goals */}
        {dailyGoals.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Daily Goals
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {dailyGoals.map((goal) => {
                const { studyTime, progress } = getProgressForGoal(goal);
                return (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    studyTime={studyTime}
                    progress={progress}
                    formatTime={formatTime}
                    getTypeBadgeColor={getTypeBadgeColor}
                    onEdit={() => openEditDialog(goal)}
                    onDelete={() => handleDeleteGoal(goal)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Weekly Goals */}
        {weeklyGoals.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-blue-500" />
              Weekly Goals
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {weeklyGoals.map((goal) => {
                const { studyTime, progress } = getProgressForGoal(goal);
                return (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    studyTime={studyTime}
                    progress={progress}
                    formatTime={formatTime}
                    getTypeBadgeColor={getTypeBadgeColor}
                    onEdit={() => openEditDialog(goal)}
                    onDelete={() => handleDeleteGoal(goal)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Monthly Goals */}
        {monthlyGoals.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-purple-500" />
              Monthly Goals
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {monthlyGoals.map((goal) => {
                const { studyTime, progress } = getProgressForGoal(goal);
                return (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    studyTime={studyTime}
                    progress={progress}
                    formatTime={formatTime}
                    getTypeBadgeColor={getTypeBadgeColor}
                    onEdit={() => openEditDialog(goal)}
                    onDelete={() => handleDeleteGoal(goal)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Custom Goals */}
        {customGoals.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Timer className="h-4 w-4 text-green-500" />
              Custom Goals
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {customGoals.map((goal) => {
                const { studyTime, progress } = getProgressForGoal(goal);
                return (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    studyTime={studyTime}
                    progress={progress}
                    formatTime={formatTime}
                    getTypeBadgeColor={getTypeBadgeColor}
                    onEdit={() => openEditDialog(goal)}
                    onDelete={() => handleDeleteGoal(goal)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {goals.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No custom goals yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create goals to track specific study targets beyond the defaults
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Goal
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Templates */}
        {goals.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Start Templates</CardTitle>
              <CardDescription>Popular goal templates to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {DEFAULT_GOALS.map((template, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    className="h-auto py-3 flex-col gap-1"
                    onClick={() => {
                      setNewGoal({
                        title: template.title || "",
                        type: "daily",
                        targetHours: Math.floor((template.targetMinutes || 0) / 60),
                        targetMinutes: (template.targetMinutes || 0) % 60,
                        emoji: template.emoji || "🎯",
                        deadline: "",
                      });
                      setIsAddDialogOpen(true);
                    }}
                  >
                    <span className="text-2xl">{template.emoji}</span>
                    <span className="text-xs">{template.title}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatTime(template.targetMinutes || 0)}
                    </span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen || !!editingGoal} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setEditingGoal(null);
          resetForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGoal ? "Edit Goal" : "Create New Goal"}</DialogTitle>
            <DialogDescription>
              {editingGoal ? "Update your study goal" : "Set a new study target to achieve"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Goal Name</Label>
              <Input
                placeholder="e.g., Master React Hooks"
                value={newGoal.title}
                onChange={(e) => setNewGoal((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Emoji</Label>
              <div className="flex flex-wrap gap-2">
                {GOAL_EMOJIS.map((emoji) => (
                  <Button
                    key={emoji}
                    type="button"
                    variant={newGoal.emoji === emoji ? "default" : "outline"}
                    size="sm"
                    className="text-lg h-9 w-9 p-0"
                    onClick={() => setNewGoal((prev) => ({ ...prev, emoji }))}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Goal Type</Label>
              <Select
                value={newGoal.type}
                onValueChange={(value: Goal["type"]) =>
                  setNewGoal((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-orange-500" />
                      Daily - Resets every day
                    </div>
                  </SelectItem>
                  <SelectItem value="weekly">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-blue-500" />
                      Weekly - Resets every week
                    </div>
                  </SelectItem>
                  <SelectItem value="monthly">
                    <div className="flex items-center gap-2">
                      <CalendarRange className="h-4 w-4 text-purple-500" />
                      Monthly - Resets every month
                    </div>
                  </SelectItem>
                  <SelectItem value="custom">
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-green-500" />
                      Custom - Set your own deadline
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newGoal.type === "custom" && (
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal((prev) => ({ ...prev, deadline: e.target.value }))}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Target Time</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={99}
                      value={newGoal.targetHours}
                      onChange={(e) =>
                        setNewGoal((prev) => ({
                          ...prev,
                          targetHours: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="text-center"
                    />
                    <span className="text-sm text-muted-foreground">hours</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={59}
                      value={newGoal.targetMinutes}
                      onChange={(e) =>
                        setNewGoal((prev) => ({
                          ...prev,
                          targetMinutes: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="text-center"
                    />
                    <span className="text-sm text-muted-foreground">mins</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setEditingGoal(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={editingGoal ? handleEditGoal : handleAddGoal}>
              {editingGoal ? "Save Changes" : "Create Goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Goal Card Component
function GoalCard({
  goal,
  studyTime,
  progress,
  formatTime,
  getTypeBadgeColor,
  onEdit,
  onDelete,
}: {
  goal: Goal;
  studyTime: number;
  progress: number;
  formatTime: (m: number) => string;
  getTypeBadgeColor: (type: Goal["type"]) => string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isCompleted = progress >= 100;

  return (
    <Card className={isCompleted ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" : ""}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{goal.emoji}</span>
            <div>
              <h4 className="font-medium">{goal.title}</h4>
              <Badge variant="outline" className={`text-[10px] ${getTypeBadgeColor(goal.type)}`}>
                {goal.type}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className={isCompleted ? "text-green-600 dark:text-green-400 font-medium" : ""}>
              {formatTime(studyTime)} / {formatTime(goal.targetMinutes)}
            </span>
          </div>
          <Progress value={progress} className={`h-2 ${isCompleted ? "[&>div]:bg-green-500" : ""}`} />
          {isCompleted && (
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Goal achieved! 🎉
            </p>
          )}
          {goal.deadline && (
            <p className="text-xs text-muted-foreground">
              Deadline: {format(parseISO(goal.deadline), "MMM d, yyyy")}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
