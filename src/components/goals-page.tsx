"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
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
  Timer,
  FileUp,
  ExternalLink,
  Paperclip,
  Lightbulb,
  Link2,
  ListTodo,
  AlertTriangle,
} from "lucide-react";
import {
  parseGoalsMarkdown,
  createGoalFromParsed,
  ParsedGoalSection,
} from "@/lib/goals-parser";
import { useStudy } from "@/lib/study-context";
import { useChecklists, Checklist } from "@/lib/checklist-store";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  format,
  isWithinInterval,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfDay,
} from "date-fns";

export interface Goal {
  id: string;
  title: string;
  type: "daily" | "weekly" | "monthly" | "custom";
  mode: "time" | "check";
  targetMinutes: number;
  targetCount?: number;
  completedCount?: number;
  createdAt: string;
  deadline?: string;
  emoji?: string;
  links?: { label: string; url: string }[];
  linkedChecklistId?: string; // Link to a checklist for execution tracking
}

const GOAL_EMOJIS = [
  "🎯",
  "📚",
  "💪",
  "🚀",
  "⭐",
  "🔥",
  "💡",
  "🏆",
  "✨",
  "📖",
  "🎓",
  "💻",
];

const DEFAULT_GOALS: Partial<Goal>[] = [
  { title: "Quick Focus", mode: "time", targetMinutes: 30, emoji: "⚡" },
  { title: "Deep Work", mode: "time", targetMinutes: 120, emoji: "🧠" },
  { title: "Marathon Session", mode: "time", targetMinutes: 240, emoji: "🏃" },
  { title: "Full Day", mode: "time", targetMinutes: 480, emoji: "🌟" },
];

// Migration helper: ensures existing goals have the new mode field
const migrateGoals = (goals: Goal[]): Goal[] => {
  return goals.map((goal) => ({
    ...goal,
    mode: goal.mode || "time",
  }));
};

// Get today's date key for daily reset
const getTodayKey = () => new Date().toISOString().split("T")[0];

// Reset daily checklist goals if date changed
const resetDailyChecklistGoals = (
  goals: Goal[],
  lastResetDate: string | null
): Goal[] => {
  const today = getTodayKey();
  if (lastResetDate === today) return goals;

  return goals.map((goal) => {
    if (goal.mode === "check" && goal.type === "daily") {
      return { ...goal, completedCount: 0 };
    }
    return goal;
  });
};

interface GoalsPageProps {
  onBack: () => void;
}

export function GoalsPage({ onBack }: GoalsPageProps) {
  const { stats, getTodayStudyTime } = useStudy();
  const { checklists, setActiveChecklist, createChecklistWithSections } =
    useChecklists();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importMarkdown, setImportMarkdown] = useState("");
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [newGoal, setNewGoal] = useState({
    title: "",
    type: "daily" as Goal["type"],
    mode: "time" as Goal["mode"],
    targetHours: 2,
    targetMinutes: 0,
    targetCount: 1,
    emoji: "🎯",
    deadline: "",
    linkedChecklistId: "" as string,
    autoCreateChecklist: false,
  });

  // Load goals from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("study-goals");
    const lastResetDate = localStorage.getItem("study-goals-reset-date");
    const today = getTodayKey();

    if (saved) {
      try {
        let loadedGoals = migrateGoals(JSON.parse(saved));
        // Reset daily checklist goals if date changed
        if (lastResetDate !== today) {
          loadedGoals = resetDailyChecklistGoals(loadedGoals, lastResetDate);
          localStorage.setItem("study-goals-reset-date", today);
        }
        setGoals(loadedGoals);
      } catch {
        // Invalid JSON, keep empty
      }
    } else {
      localStorage.setItem("study-goals-reset-date", today);
    }
    setIsHydrated(true);
  }, []);

  // Save goals to localStorage
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem("study-goals", JSON.stringify(goals));
    }
  }, [goals, isHydrated]);

  // Helper: Create a checklist from parsed goal tasks
  const createChecklistForGoal = (
    goalTitle: string,
    goalEmoji: string,
    tasks?: ParsedGoalSection[]
  ): Checklist => {
    const now = new Date().toISOString();
    const checklistId =
      crypto.randomUUID?.() ||
      Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

    // Build sections from parsed tasks or create default
    const sections =
      tasks && tasks.length > 0
        ? tasks.map((section) => ({
            id:
              crypto.randomUUID?.() ||
              Math.random().toString(36).substring(2, 11),
            title: section.title,
            items: section.items.map((item) => ({
              id:
                crypto.randomUUID?.() ||
                Math.random().toString(36).substring(2, 11),
              text: item.text,
              completed: item.completed || false,
              level: 0,
              children: [],
            })),
            completedCount: section.items.filter((i) => i.completed).length,
            totalCount: section.items.length,
          }))
        : [
            {
              id:
                crypto.randomUUID?.() ||
                Math.random().toString(36).substring(2, 11),
              title: "Today's Tasks",
              items: [
                {
                  id:
                    crypto.randomUUID?.() ||
                    Math.random().toString(36).substring(2, 11),
                  text: "Work on this goal",
                  completed: false,
                  level: 0,
                  children: [],
                },
              ],
              completedCount: 0,
              totalCount: 1,
            },
          ];

    // Calculate totals
    let totalItems = 0;
    let totalCompleted = 0;
    sections.forEach((s) => {
      totalItems += s.totalCount;
      totalCompleted += s.completedCount;
    });

    const newChecklist: Checklist = {
      id: checklistId,
      title: `${goalTitle} – Plan`,
      emoji: goalEmoji || "📋",
      createdAt: now,
      updatedAt: now,
      type: "quick",
      sections,
      totalCompleted,
      totalItems,
    };

    return newChecklist;
  };

  const handleAddGoal = () => {
    if (newGoal.mode === "time") {
      const totalMinutes = newGoal.targetHours * 60 + newGoal.targetMinutes;
      if (!newGoal.title.trim() || totalMinutes <= 0) {
        toast.error("Please enter a valid goal title and time");
        return;
      }

      const goal: Goal = {
        id: crypto.randomUUID(),
        title: newGoal.title.trim(),
        type: newGoal.type,
        mode: "time",
        targetMinutes: totalMinutes,
        createdAt: new Date().toISOString(),
        emoji: newGoal.emoji,
        deadline: newGoal.deadline || undefined,
        linkedChecklistId: newGoal.linkedChecklistId || undefined,
      };

      setGoals((prev) => [...prev, goal]);
      toast.success(`Goal "${goal.title}" created!`);
    } else {
      if (!newGoal.title.trim() || newGoal.targetCount <= 0) {
        toast.error("Please enter a valid goal title and target count");
        return;
      }

      let linkedChecklistId = newGoal.linkedChecklistId || undefined;

      // Auto-create checklist if enabled
      if (newGoal.autoCreateChecklist) {
        const checklistData = createChecklistForGoal(
          newGoal.title.trim(),
          newGoal.emoji,
          undefined // No pre-defined tasks, just default placeholder
        );

        const createdChecklist = createChecklistWithSections({
          id: checklistData.id,
          title: checklistData.title,
          emoji: checklistData.emoji,
          type: checklistData.type,
          sections: checklistData.sections,
          totalCompleted: checklistData.totalCompleted,
          totalItems: checklistData.totalItems,
        });

        linkedChecklistId = createdChecklist.id;
      }

      const goal: Goal = {
        id: crypto.randomUUID(),
        title: newGoal.title.trim(),
        type: newGoal.type,
        mode: "check",
        targetMinutes: 0,
        targetCount: newGoal.targetCount,
        completedCount: 0,
        createdAt: new Date().toISOString(),
        emoji: newGoal.emoji,
        deadline: newGoal.deadline || undefined,
        linkedChecklistId,
      };

      setGoals((prev) => [...prev, goal]);
      const checklistMessage = newGoal.autoCreateChecklist
        ? " with checklist"
        : "";
      toast.success(
        `Checklist goal "${goal.title}" created${checklistMessage}!`
      );
    }
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleImportGoals = () => {
    if (!importMarkdown.trim()) {
      toast.error("Please enter markdown content to import");
      return;
    }

    try {
      const parsedGoals = parseGoalsMarkdown(importMarkdown);

      if (parsedGoals.length === 0) {
        toast.error(
          "No valid goals found in the markdown. Use ## for goal titles."
        );
        return;
      }

      let checklistsCreated = 0;

      const newGoals = parsedGoals.map((parsed) => {
        const baseGoal = createGoalFromParsed(parsed);

        // Auto-create checklist for check-mode goals or goals with tasks
        const shouldAutoCreate =
          parsed.mode === "check" || (parsed.tasks && parsed.tasks.length > 0);

        if (shouldAutoCreate) {
          // Create checklist using the helper
          const checklistData = createChecklistForGoal(
            parsed.title,
            parsed.emoji || "📋",
            parsed.tasks
          );

          // Add to store
          const createdChecklist = createChecklistWithSections({
            id: checklistData.id,
            title: checklistData.title,
            emoji: checklistData.emoji,
            type: checklistData.type,
            sections: checklistData.sections,
            totalCompleted: checklistData.totalCompleted,
            totalItems: checklistData.totalItems,
          });

          checklistsCreated++;

          // Link goal to checklist
          return {
            ...baseGoal,
            linkedChecklistId: createdChecklist.id,
          };
        }

        return baseGoal;
      });

      setGoals((prev) => [...prev, ...newGoals]);

      const checklistMessage =
        checklistsCreated > 0
          ? ` with ${checklistsCreated} checklist${
              checklistsCreated > 1 ? "s" : ""
            }`
          : "";
      toast.success(
        `Imported ${newGoals.length} goal${
          newGoals.length > 1 ? "s" : ""
        }${checklistMessage}!`
      );
      setImportMarkdown("");
      setIsImportDialogOpen(false);
    } catch (err) {
      console.error("Import error:", err);
      toast.error("Failed to parse markdown. Please check the format.");
    }
  };

  const handleEditGoal = () => {
    if (!editingGoal) return;

    if (newGoal.mode === "time") {
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
                mode: "time",
                targetMinutes: totalMinutes,
                targetCount: undefined,
                completedCount: undefined,
                emoji: newGoal.emoji,
                deadline: newGoal.deadline || undefined,
                linkedChecklistId: newGoal.linkedChecklistId || undefined,
              }
            : g
        )
      );
    } else {
      if (!newGoal.title.trim() || newGoal.targetCount <= 0) {
        toast.error("Please enter a valid goal title and target count");
        return;
      }

      setGoals((prev) =>
        prev.map((g) =>
          g.id === editingGoal.id
            ? {
                ...g,
                title: newGoal.title.trim(),
                type: newGoal.type,
                mode: "check",
                targetMinutes: 0,
                targetCount: newGoal.targetCount,
                completedCount: Math.min(
                  g.completedCount || 0,
                  newGoal.targetCount
                ),
                emoji: newGoal.emoji,
                deadline: newGoal.deadline || undefined,
                linkedChecklistId: newGoal.linkedChecklistId || undefined,
              }
            : g
        )
      );
    }
    toast.success("Goal updated!");
    resetForm();
    setEditingGoal(null);
  };

  const handleDeleteGoal = (goal: Goal) => {
    setGoals((prev) => prev.filter((g) => g.id !== goal.id));
    toast.success(`Goal "${goal.title}" deleted`);
  };

  const handleMarkDone = (goalId: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId || g.mode !== "check") return g;
        const newCompletedCount = (g.completedCount || 0) + 1;
        const targetCount = g.targetCount || 1;
        if (newCompletedCount >= targetCount) {
          toast.success(`Goal "${g.title}" completed! 🎉`);
        }
        return {
          ...g,
          completedCount: Math.min(newCompletedCount, targetCount),
        };
      })
    );
  };

  const openEditDialog = (goal: Goal) => {
    setEditingGoal(goal);
    setNewGoal({
      title: goal.title,
      type: goal.type,
      mode: goal.mode || "time",
      targetHours: Math.floor(goal.targetMinutes / 60),
      targetMinutes: goal.targetMinutes % 60,
      targetCount: goal.targetCount || 1,
      emoji: goal.emoji || "🎯",
      deadline: goal.deadline || "",
      linkedChecklistId: goal.linkedChecklistId || "",
      autoCreateChecklist: false, // Already has a checklist or not
    });
  };

  const resetForm = () => {
    setNewGoal({
      title: "",
      type: "daily",
      mode: "time",
      targetHours: 2,
      targetMinutes: 0,
      targetCount: 1,
      emoji: "🎯",
      deadline: "",
      linkedChecklistId: "",
      autoCreateChecklist: false,
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
          return isWithinInterval(date, {
            start: startOfDay(goalStart),
            end: goalEnd,
          });
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
          <p className="text-muted-foreground text-sm">
            Track your study targets and achievements
          </p>
        </div>
        <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
          <FileUp className="h-4 w-4 mr-2" />
          Import
        </Button>
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
              {
                goals.filter((g) => getProgressForGoal(g).progress >= 100)
                  .length
              }
              /{goals.length}
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
                    onMarkDone={() => handleMarkDone(goal.id)}
                    checklists={checklists}
                    onOpenFullPlan={(checklistId) => {
                      setActiveChecklist(checklistId);
                      onBack();
                    }}
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
                    onMarkDone={() => handleMarkDone(goal.id)}
                    checklists={checklists}
                    onOpenFullPlan={(checklistId) => {
                      setActiveChecklist(checklistId);
                      onBack();
                    }}
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
                    onMarkDone={() => handleMarkDone(goal.id)}
                    checklists={checklists}
                    onOpenFullPlan={(checklistId) => {
                      setActiveChecklist(checklistId);
                      onBack();
                    }}
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
                    onMarkDone={() => handleMarkDone(goal.id)}
                    checklists={checklists}
                    onOpenFullPlan={(checklistId) => {
                      setActiveChecklist(checklistId);
                      onBack();
                    }}
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
              <CardDescription>
                Popular goal templates to get started
              </CardDescription>
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
                        mode: template.mode || "time",
                        targetHours: Math.floor(
                          (template.targetMinutes || 0) / 60
                        ),
                        targetMinutes: (template.targetMinutes || 0) % 60,
                        targetCount: 1,
                        emoji: template.emoji || "🎯",
                        deadline: "",
                        linkedChecklistId: "",
                        autoCreateChecklist: false,
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
      <Dialog
        open={isAddDialogOpen || !!editingGoal}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setEditingGoal(null);
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGoal ? "Edit Goal" : "Create New Goal"}
            </DialogTitle>
            <DialogDescription>
              {editingGoal
                ? "Update your study goal"
                : "Set a new study target to achieve"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Goal Name</Label>
              <Input
                placeholder="e.g., Master React Hooks"
                value={newGoal.title}
                onChange={(e) =>
                  setNewGoal((prev) => ({ ...prev, title: e.target.value }))
                }
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
                  onChange={(e) =>
                    setNewGoal((prev) => ({
                      ...prev,
                      deadline: e.target.value,
                    }))
                  }
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Goal Mode</Label>
              <Select
                value={newGoal.mode}
                onValueChange={(value: Goal["mode"]) =>
                  setNewGoal((prev) => ({ ...prev, mode: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      Time-based - Track study time
                    </div>
                  </SelectItem>
                  <SelectItem value="check">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-violet-500" />
                      Checklist - Manual completion
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newGoal.mode === "time" ? (
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
                      <span className="text-sm text-muted-foreground">
                        hours
                      </span>
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
                      <span className="text-sm text-muted-foreground">
                        mins
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Target Count</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={newGoal.targetCount}
                  onChange={(e) =>
                    setNewGoal((prev) => ({
                      ...prev,
                      targetCount: parseInt(e.target.value) || 1,
                    }))
                  }
                  placeholder="e.g., 2 problems, 5 chapters"
                />
                <p className="text-xs text-muted-foreground">
                  How many items to complete for this goal
                </p>
              </div>
            )}

            {/* Auto-create or Link Checklist */}
            <div className="space-y-3">
              {/* Auto-create toggle (only for check mode) */}
              {newGoal.mode === "check" && !editingGoal && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                  <Checkbox
                    id="auto-create-checklist"
                    checked={newGoal.autoCreateChecklist}
                    onCheckedChange={(checked) =>
                      setNewGoal((prev) => ({
                        ...prev,
                        autoCreateChecklist: !!checked,
                        linkedChecklistId: checked
                          ? ""
                          : prev.linkedChecklistId,
                      }))
                    }
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="auto-create-checklist"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Auto-create checklist for this goal
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Creates &quot;{newGoal.title || "Goal"} – Plan&quot; with
                      a starter task
                    </p>
                  </div>
                </div>
              )}

              {/* Link to Checklist (hidden when auto-create is enabled) */}
              {!newGoal.autoCreateChecklist && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    Link to Checklist
                    <span className="text-xs text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </Label>
                  <Select
                    value={newGoal.linkedChecklistId}
                    onValueChange={(value: string) =>
                      setNewGoal((prev) => ({
                        ...prev,
                        linkedChecklistId: value === "none" ? "" : value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a checklist..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          No linked checklist
                        </div>
                      </SelectItem>
                      {checklists.map((checklist) => {
                        const completionPercent =
                          checklist.totalItems > 0
                            ? Math.round(
                                (checklist.totalCompleted /
                                  checklist.totalItems) *
                                  100
                              )
                            : 0;
                        return (
                          <SelectItem key={checklist.id} value={checklist.id}>
                            <div className="flex items-center gap-2">
                              <span>{checklist.emoji || "📝"}</span>
                              <span className="truncate max-w-[180px]">
                                {checklist.title}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({completionPercent}%)
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Link a checklist to see your next task and track execution
                    progress
                  </p>
                </div>
              )}
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

      {/* Import Goals Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5" />
              Import Goals from Markdown
            </DialogTitle>
            <DialogDescription>
              Paste your goals in markdown format. Use ## for goal titles.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Markdown Content</Label>
              <Textarea
                placeholder={`## 📚 Read 10 Books
type: monthly
mode: check
target: 10

## ⏱️ Study 2 Hours Daily
type: daily
mode: time
target: 120

## 💪 Complete LeetCode
type: weekly
mode: check
target: 7
- Two Sum https://leetcode.com/problems/two-sum/
- Add Two Numbers https://leetcode.com/problems/add-two-numbers/`}
                value={importMarkdown}
                onChange={(e) => setImportMarkdown(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="font-medium mb-2">Format Guide:</p>
              <ul className="space-y-1 text-muted-foreground text-xs">
                <li>
                  <code className="bg-muted px-1 rounded">## Goal Title</code> -
                  Goal name (emoji optional)
                </li>
                <li>
                  <code className="bg-muted px-1 rounded">
                    type: daily|weekly|monthly|custom
                  </code>{" "}
                  - Goal type
                </li>
                <li>
                  <code className="bg-muted px-1 rounded">
                    mode: time|check
                  </code>{" "}
                  - Time-based or checklist goal
                </li>
                <li>
                  <code className="bg-muted px-1 rounded">target: 120</code> -
                  Minutes (time mode) or count (check mode)
                </li>
                <li>
                  <code className="bg-muted px-1 rounded">hours: 2</code> -
                  Alternative for time (converts to minutes)
                </li>
                <li>
                  <code className="bg-muted px-1 rounded">
                    deadline: 2024-12-31
                  </code>{" "}
                  - Optional deadline
                </li>
                <li>
                  <code className="bg-muted px-1 rounded">
                    - Item with link https://...
                  </code>{" "}
                  - Optional links
                </li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setImportMarkdown("");
                setIsImportDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleImportGoals}>
              <FileUp className="h-4 w-4 mr-2" />
              Import Goals
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
  onMarkDone,
  checklists,
  onOpenFullPlan,
}: {
  goal: Goal;
  studyTime: number;
  progress: number;
  formatTime: (m: number) => string;
  getTypeBadgeColor: (type: Goal["type"]) => string;
  onEdit: () => void;
  onDelete: () => void;
  onMarkDone: () => void;
  checklists: Checklist[];
  onOpenFullPlan: (checklistId: string) => void;
}) {
  const [showResources, setShowResources] = useState(false);
  const isCheckMode = goal.mode === "check";
  const completedCount = goal.completedCount || 0;
  const targetCount = goal.targetCount || 1;
  const checkProgress = isCheckMode
    ? (completedCount / targetCount) * 100
    : progress;
  const isCompleted = isCheckMode
    ? completedCount >= targetCount
    : progress >= 100;
  const hasLinks = goal.links && goal.links.length > 0;
  const isLongTermGoal =
    goal.type === "weekly" || goal.type === "monthly" || goal.type === "custom";

  // Find linked checklist and get first unchecked task
  const linkedChecklist = goal.linkedChecklistId
    ? checklists.find((c) => c.id === goal.linkedChecklistId)
    : null;

  const getFirstUncheckedTask = () => {
    if (!linkedChecklist) return null;
    for (const section of linkedChecklist.sections) {
      for (const item of section.items) {
        if (!item.completed) {
          return { task: item.text, section: section.title };
        }
        // Also check children
        if (item.children) {
          for (const child of item.children) {
            if (!child.completed) {
              return { task: child.text, section: section.title };
            }
          }
        }
      }
    }
    return null; // All tasks completed
  };

  const nextTask = linkedChecklist ? getFirstUncheckedTask() : null;
  const hasLinkedChecklist = !!goal.linkedChecklistId;
  const checklistDeleted = hasLinkedChecklist && !linkedChecklist;

  const getTodaysFocusMessage = () => {
    // If there's a linked checklist with a next task, show that
    if (nextTask) {
      return nextTask.task;
    }
    if (linkedChecklist && !nextTask) {
      return "All tasks completed! 🎉";
    }
    if (goal.type === "daily") {
      return isCheckMode
        ? "Complete your daily checklist items"
        : "Focus on this goal today";
    }
    return "Pick ONE task to work on today";
  };

  return (
    <>
      <Card
        className={
          isCompleted
            ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20"
            : ""
        }
      >
        <CardContent className="pt-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{goal.emoji}</span>
              <div>
                <h4 className="font-medium">{goal.title}</h4>
                <div className="flex items-center gap-1">
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${getTypeBadgeColor(goal.type)}`}
                  >
                    {goal.type}
                  </Badge>
                  {isCheckMode && (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                    >
                      checklist
                    </Badge>
                  )}
                </div>
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
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span
                className={
                  isCompleted
                    ? "text-green-600 dark:text-green-400 font-medium"
                    : ""
                }
              >
                {isCheckMode
                  ? `${completedCount} / ${targetCount} items`
                  : `${formatTime(studyTime)} / ${formatTime(
                      goal.targetMinutes > 0 ? goal.targetMinutes : 1
                    )}`}
              </span>
            </div>
            <Progress
              value={checkProgress}
              className={`h-2 ${isCompleted ? "[&>div]:bg-green-500" : ""}`}
            />
            {isCheckMode && !isCompleted && (
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-2"
                onClick={onMarkDone}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark Done ({completedCount}/{targetCount})
              </Button>
            )}
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
            {/* Linked Checklist Indicator */}
            {linkedChecklist && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <ListTodo className="h-3.5 w-3.5" />
                <span className="truncate">
                  {linkedChecklist.emoji} {linkedChecklist.title}
                </span>
                <span className="text-muted-foreground/60">
                  (
                  {Math.round(
                    (linkedChecklist.totalCompleted /
                      Math.max(linkedChecklist.totalItems, 1)) *
                      100
                  )}
                  %)
                </span>
              </div>
            )}
            {checklistDeleted && (
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 mt-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Linked checklist was deleted</span>
              </div>
            )}
            {(hasLinks || linkedChecklist) && (
              <Button
                size="sm"
                variant="ghost"
                className="w-full mt-1 text-muted-foreground hover:text-foreground"
                onClick={() => setShowResources(true)}
              >
                <Paperclip className="h-3.5 w-3.5 mr-1.5" />
                {linkedChecklist
                  ? "View Details"
                  : `Resources (${goal.links!.length})`}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resources Dialog */}
      {(hasLinks || linkedChecklist) && (
        <Dialog open={showResources} onOpenChange={setShowResources}>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-xl">{goal.emoji}</span>
                {goal.title}
              </DialogTitle>
              <DialogDescription>
                {goal.type.charAt(0).toUpperCase() + goal.type.slice(1)}{" "}
                {isCheckMode ? "checklist" : "time"} goal
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Today's Focus Section */}
              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
                  <Lightbulb className="h-4 w-4" />
                  <span className="font-medium text-sm">
                    Today&apos;s Focus
                  </span>
                  {nextTask && (
                    <span className="text-xs text-amber-600/70 dark:text-amber-400/60">
                      from {linkedChecklist?.title}
                    </span>
                  )}
                </div>
                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                  {getTodaysFocusMessage()}
                </p>
                {nextTask && (
                  <p className="text-xs text-amber-600/80 dark:text-amber-400/70 mt-1">
                    Section: {nextTask.section}
                  </p>
                )}
                {isLongTermGoal && !nextTask && (
                  <p className="text-xs text-amber-600/80 dark:text-amber-400/70 mt-2 italic">
                    You don&apos;t need to complete everything at once.
                  </p>
                )}
              </div>

              {/* Linked Checklist Section */}
              {linkedChecklist && (
                <>
                  <div className="border-t border-border" />
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-3">
                      <ListTodo className="h-4 w-4" />
                      <span className="font-medium text-sm">
                        Linked Checklist
                      </span>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 border">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">
                          {linkedChecklist.emoji || "📝"}
                        </span>
                        <span className="font-medium">
                          {linkedChecklist.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <span>
                          {linkedChecklist.totalCompleted} /{" "}
                          {linkedChecklist.totalItems} tasks
                        </span>
                        <span className="text-muted-foreground/50">•</span>
                        <span>
                          {Math.round(
                            (linkedChecklist.totalCompleted /
                              Math.max(linkedChecklist.totalItems, 1)) *
                              100
                          )}
                          % complete
                        </span>
                      </div>
                      <Progress
                        value={
                          (linkedChecklist.totalCompleted /
                            Math.max(linkedChecklist.totalItems, 1)) *
                          100
                        }
                        className="h-2 mb-3"
                      />
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setShowResources(false);
                          onOpenFullPlan(linkedChecklist.id);
                        }}
                      >
                        <ListTodo className="h-4 w-4 mr-2" />
                        Open Full Plan
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {/* Resources Section */}
              {hasLinks && (
                <>
                  <div className="border-t border-border" />
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-3">
                      <Link2 className="h-4 w-4" />
                      <span className="font-medium text-sm">Resources</span>
                      <span className="text-xs text-muted-foreground/60">
                        ({goal.links!.length})
                      </span>
                    </div>
                    <div className="space-y-1">
                      {goal.links!.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted transition-colors group border border-transparent hover:border-border"
                        >
                          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
                          <span className="text-sm truncate group-hover:text-primary">
                            {link.label}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowResources(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
