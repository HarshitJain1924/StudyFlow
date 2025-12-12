"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStudy } from "@/lib/study-context";
import { cn } from "@/lib/utils";
import {
  Target,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Circle,
  Calendar,
  Trophy,
  Flame,
} from "lucide-react";
import { toast } from "sonner";

interface Goal {
  id: string;
  title: string;
  type: "daily" | "weekly" | "monthly" | "custom";
  targetValue: number;
  currentValue: number;
  unit: "minutes" | "tasks" | "sessions";
  completed: boolean;
  createdAt: string;
}

const defaultGoals: Goal[] = [];

export function GoalsManager() {
  const { stats, settings, updateSettings, getTodayStudyTime, getTodayTasks } = useStudy();
  const [goals, setGoals] = useState<Goal[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("studyflow-goals");
      return saved ? JSON.parse(saved) : defaultGoals;
    }
    return defaultGoals;
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [newGoal, setNewGoal] = useState({
    title: "",
    type: "daily" as Goal["type"],
    targetValue: 60,
    unit: "minutes" as Goal["unit"],
  });

  const saveGoals = (updatedGoals: Goal[]) => {
    setGoals(updatedGoals);
    localStorage.setItem("studyflow-goals", JSON.stringify(updatedGoals));
  };

  const addGoal = () => {
    if (!newGoal.title.trim()) {
      toast.error("Please enter a goal title");
      return;
    }

    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title,
      type: newGoal.type,
      targetValue: newGoal.targetValue,
      currentValue: 0,
      unit: newGoal.unit,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    saveGoals([...goals, goal]);
    setNewGoal({ title: "", type: "daily", targetValue: 60, unit: "minutes" });
    setIsAddDialogOpen(false);
    toast.success("Goal added successfully!");
  };

  const updateGoal = () => {
    if (!editingGoal) return;

    const updatedGoals = goals.map((g) =>
      g.id === editingGoal.id ? editingGoal : g
    );
    saveGoals(updatedGoals);
    setEditingGoal(null);
    toast.success("Goal updated!");
  };

  const deleteGoal = (id: string) => {
    saveGoals(goals.filter((g) => g.id !== id));
    toast.success("Goal deleted");
  };

  const toggleGoalComplete = (id: string) => {
    const updatedGoals = goals.map((g) =>
      g.id === id ? { ...g, completed: !g.completed } : g
    );
    saveGoals(updatedGoals);
    const goal = goals.find((g) => g.id === id);
    if (goal && !goal.completed) {
      toast.success("🎉 Goal completed!", { description: goal.title });
    }
  };

  // Calculate current values based on stats
  const getGoalProgress = (goal: Goal) => {
    let current = 0;
    switch (goal.unit) {
      case "minutes":
        if (goal.type === "daily") {
          current = Math.floor(getTodayStudyTime() / 60);
        } else if (goal.type === "weekly") {
          current = Math.floor(stats.totalStudyTime / 60); // Simplified - would need weekly calc
        } else {
          current = Math.floor(stats.totalStudyTime / 60);
        }
        break;
      case "tasks":
        if (goal.type === "daily") {
          current = getTodayTasks();
        } else {
          current = stats.totalTasksCompleted;
        }
        break;
      case "sessions":
        current = stats.sessionsHistory.length;
        break;
    }
    return Math.min(current, goal.targetValue);
  };

  const getProgressPercent = (goal: Goal) => {
    const current = getGoalProgress(goal);
    return Math.min((current / goal.targetValue) * 100, 100);
  };

  const getUnitLabel = (unit: Goal["unit"], value: number) => {
    switch (unit) {
      case "minutes":
        return value >= 60 ? `${Math.floor(value / 60)}h ${value % 60}m` : `${value}m`;
      case "tasks":
        return value === 1 ? "task" : "tasks";
      case "sessions":
        return value === 1 ? "session" : "sessions";
    }
  };

  const getTypeIcon = (type: Goal["type"]) => {
    switch (type) {
      case "daily":
        return <Flame className="h-3 w-3" />;
      case "weekly":
        return <Calendar className="h-3 w-3" />;
      case "monthly":
        return <Trophy className="h-3 w-3" />;
      default:
        return <Target className="h-3 w-3" />;
    }
  };

  // Built-in daily and weekly goals from settings
  const dailyGoalProgress = Math.min((getTodayStudyTime() / (settings.dailyGoal * 60)) * 100, 100);
  const weeklyGoalProgress = Math.min((stats.totalStudyTime / (settings.weeklyGoal * 60)) * 100, 100);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Goals
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Goal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Goal Title</Label>
                  <Input
                    placeholder="e.g., Study for 2 hours"
                    value={newGoal.title}
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, title: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={newGoal.type}
                      onValueChange={(v) =>
                        setNewGoal({ ...newGoal, type: v as Goal["type"] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Measure By</Label>
                    <Select
                      value={newGoal.unit}
                      onValueChange={(v) =>
                        setNewGoal({ ...newGoal, unit: v as Goal["unit"] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minutes">Minutes</SelectItem>
                        <SelectItem value="tasks">Tasks</SelectItem>
                        <SelectItem value="sessions">Sessions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Target Value</Label>
                  <Input
                    type="number"
                    min={1}
                    value={newGoal.targetValue}
                    onChange={(e) =>
                      setNewGoal({
                        ...newGoal,
                        targetValue: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {newGoal.unit === "minutes" && newGoal.targetValue >= 60
                      ? `${Math.floor(newGoal.targetValue / 60)}h ${newGoal.targetValue % 60}m`
                      : `${newGoal.targetValue} ${newGoal.unit}`}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addGoal}>Add Goal</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Built-in Daily Goal */}
        <div className="p-2 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Flame className="h-3 w-3 text-orange-500" />
              <span className="text-xs font-medium">Daily Study Goal</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {Math.floor(getTodayStudyTime() / 60)}m / {settings.dailyGoal}m
            </span>
          </div>
          <Progress value={dailyGoalProgress} className="h-1.5" />
        </div>

        {/* Built-in Weekly Goal */}
        <div className="p-2 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-blue-500" />
              <span className="text-xs font-medium">Weekly Study Goal</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {Math.floor(stats.totalStudyTime / 3600)}h / {Math.floor(settings.weeklyGoal / 60)}h
            </span>
          </div>
          <Progress value={weeklyGoalProgress} className="h-1.5" />
        </div>

        {/* Custom Goals */}
        {goals.length > 0 && (
          <ScrollArea className="max-h-48">
            <div className="space-y-2">
              {goals.map((goal) => {
                const progress = getProgressPercent(goal);
                const current = getGoalProgress(goal);
                return (
                  <div
                    key={goal.id}
                    className={cn(
                      "p-2 rounded-lg border transition-colors",
                      goal.completed
                        ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                        : "bg-background"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <Checkbox
                          checked={goal.completed}
                          onCheckedChange={() => toggleGoalComplete(goal.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-xs font-medium truncate",
                              goal.completed && "line-through text-muted-foreground"
                            )}
                          >
                            {goal.title}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                              {getTypeIcon(goal.type)}
                              <span className="ml-1">{goal.type}</span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setEditingGoal(goal)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => deleteGoal(goal.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {!goal.completed && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                          <span>
                            {current} / {goal.targetValue}{" "}
                            {goal.unit === "minutes" ? "min" : goal.unit}
                          </span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-1" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {goals.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            No custom goals yet. Click + to add one!
          </p>
        )}

        {/* Edit Goal Dialog */}
        <Dialog open={!!editingGoal} onOpenChange={() => setEditingGoal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Goal</DialogTitle>
            </DialogHeader>
            {editingGoal && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Goal Title</Label>
                  <Input
                    value={editingGoal.title}
                    onChange={(e) =>
                      setEditingGoal({ ...editingGoal, title: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={editingGoal.type}
                      onValueChange={(v) =>
                        setEditingGoal({ ...editingGoal, type: v as Goal["type"] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Target Value</Label>
                    <Input
                      type="number"
                      min={1}
                      value={editingGoal.targetValue}
                      onChange={(e) =>
                        setEditingGoal({
                          ...editingGoal,
                          targetValue: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingGoal(null)}>
                Cancel
              </Button>
              <Button onClick={updateGoal}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
