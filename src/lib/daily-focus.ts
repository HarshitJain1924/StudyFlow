/**
 * Daily Focus / Execution Engine
 * 
 * Pure derived logic to compute what the user should work on today.
 * No side effects, no state mutations - just reads goals/checklists and returns focus.
 */

import { Goal } from "@/components/goals-page";
import { Checklist } from "@/lib/checklist-store";
import { TodoItem } from "@/lib/markdown-parser";

export interface DailyFocus {
  goal: Goal;
  checklist: Checklist | null;
  nextTask: { text: string; sectionTitle: string; timeEstimate?: number } | null;
  checklistDeleted: boolean; // True if goal had a linked checklist that was deleted
}

/**
 * Find the first uncompleted task in a checklist, including nested children.
 * Returns null if all tasks are completed or checklist is empty.
 */
function findFirstUncompletedTask(
  checklist: Checklist
): { text: string; sectionTitle: string; timeEstimate?: number } | null {
  for (const section of checklist.sections) {
    const task = findUncompletedInItems(section.items);
    if (task) {
      return { text: task.text, sectionTitle: section.title, timeEstimate: task.timeEstimate };
    }
  }
  return null;
}

/**
 * Recursively search items and their children for first uncompleted task.
 */
function findUncompletedInItems(items: TodoItem[]): { text: string; timeEstimate?: number } | null {
  for (const item of items) {
    if (!item.completed) {
      return { text: item.text, timeEstimate: item.timeEstimate };
    }
    // Check children even if parent is completed (parent might be auto-completed)
    if (item.children && item.children.length > 0) {
      const childTask = findUncompletedInItems(item.children);
      if (childTask) {
        return childTask;
      }
    }
  }
  return null;
}

/**
 * Check if a goal has remaining progress (not fully completed).
 */
function hasRemainingProgress(goal: Goal, checklist: Checklist | null): boolean {
  if (goal.mode === "time") {
    // Time-based goals: we can't easily check completion without study stats
    // Always show them as actionable
    return true;
  }
  
  // Check-mode goals
  if (checklist) {
    // Has items remaining
    return checklist.totalCompleted < checklist.totalItems;
  }
  
  // Check-mode without checklist: use completedCount vs targetCount
  const completed = goal.completedCount || 0;
  const target = goal.targetCount || 1;
  return completed < target;
}

/**
 * Sort goals by priority:
 * 1. Daily goals first
 * 2. Weekly goals
 * 3. Monthly goals
 * 4. Custom goals (sorted by deadline, earliest first)
 */
function sortGoalsByPriority(goals: Goal[]): Goal[] {
  const typeOrder: Record<Goal["type"], number> = {
    daily: 0,
    weekly: 1,
    monthly: 2,
    custom: 3,
  };

  return [...goals].sort((a, b) => {
    // First, sort by type priority
    const typeDiff = typeOrder[a.type] - typeOrder[b.type];
    if (typeDiff !== 0) return typeDiff;

    // For custom goals, sort by deadline (earliest first)
    if (a.type === "custom" && b.type === "custom") {
      if (a.deadline && b.deadline) {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      // Goals with deadlines come before goals without
      if (a.deadline && !b.deadline) return -1;
      if (!a.deadline && b.deadline) return 1;
    }

    // Otherwise, maintain original order (by creation date)
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

/**
 * Compute the daily focus - what should the user work on today?
 * 
 * Returns the highest priority goal with an actionable next task,
 * or null if there's nothing actionable.
 */
export function computeDailyFocus(
  goals: Goal[],
  checklists: Checklist[]
): DailyFocus | null {
  if (!goals || goals.length === 0) {
    return null;
  }

  // Create a map for quick checklist lookup
  const checklistMap = new Map<string, Checklist>();
  for (const cl of checklists) {
    checklistMap.set(cl.id, cl);
  }

  // Sort goals by priority
  const sortedGoals = sortGoalsByPriority(goals);

  // Find first goal with remaining progress
  for (const goal of sortedGoals) {
    const linkedChecklist = goal.linkedChecklistId
      ? checklistMap.get(goal.linkedChecklistId) || null
      : null;

    const checklistDeleted = !!(goal.linkedChecklistId && !linkedChecklist);

    // Skip if goal is fully completed (unless checklist was deleted)
    if (!hasRemainingProgress(goal, linkedChecklist) && !checklistDeleted) {
      continue;
    }

    // Find next task if there's a linked checklist
    const nextTask = linkedChecklist
      ? findFirstUncompletedTask(linkedChecklist)
      : null;

    // Return this goal as the focus
    return {
      goal,
      checklist: linkedChecklist,
      nextTask,
      checklistDeleted,
    };
  }

  return null;
}

/**
 * Get a human-readable focus message for the daily focus.
 */
export function getDailyFocusMessage(focus: DailyFocus): string {
  if (focus.nextTask) {
    return focus.nextTask.text;
  }
  
  if (focus.checklist && !focus.nextTask) {
    return "All tasks completed! 🎉";
  }
  
  if (focus.checklistDeleted) {
    return "Linked checklist was deleted";
  }
  
  if (focus.goal.mode === "time") {
    return `Focus on ${focus.goal.title} today`;
  }
  
  return "Create a plan to get started";
}
