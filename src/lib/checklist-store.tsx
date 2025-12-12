"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { ParsedChecklist, TodoSection, TodoItem } from "./markdown-parser";

export interface Checklist {
  id: string;
  title: string;
  emoji?: string;
  createdAt: string;
  updatedAt: string;
  type: "markdown" | "quick"; // markdown = parsed from md, quick = created directly
  markdown?: string; // original markdown if type is markdown
  sections: TodoSection[];
  totalCompleted: number;
  totalItems: number;
}

interface ChecklistStore {
  checklists: Checklist[];
  activeChecklistId: string | null;
  activeChecklist: Checklist | null;
  createChecklist: (title: string, type: "markdown" | "quick", emoji?: string) => Checklist;
  createFromMarkdown: (markdown: string, parsed: ParsedChecklist) => Checklist;
  updateChecklist: (id: string, updates: Partial<Checklist>) => void;
  deleteChecklist: (id: string) => void;
  setActiveChecklist: (id: string | null) => void;
  addTaskToChecklist: (checklistId: string, sectionId: string, task: Omit<TodoItem, "id" | "children">) => void;
  addSectionToChecklist: (checklistId: string, title: string, emoji?: string) => void;
  duplicateChecklist: (id: string) => Checklist;
}

const ChecklistContext = createContext<ChecklistStore | undefined>(undefined);

const CHECKLISTS_KEY = "markdown-todo-checklists";
const ACTIVE_CHECKLIST_KEY = "markdown-todo-active-checklist";

function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export function ChecklistProvider({ children }: { children: ReactNode }) {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [activeChecklistId, setActiveChecklistId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const savedChecklists = localStorage.getItem(CHECKLISTS_KEY);
    const savedActiveId = localStorage.getItem(ACTIVE_CHECKLIST_KEY);

    if (savedChecklists) {
      try {
        const parsed = JSON.parse(savedChecklists);
        setChecklists(parsed);
      } catch (e) {
        console.error("Failed to load checklists:", e);
      }
    }

    if (savedActiveId) {
      setActiveChecklistId(savedActiveId);
    }

    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(CHECKLISTS_KEY, JSON.stringify(checklists));
  }, [checklists, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    if (activeChecklistId) {
      localStorage.setItem(ACTIVE_CHECKLIST_KEY, activeChecklistId);
    } else {
      localStorage.removeItem(ACTIVE_CHECKLIST_KEY);
    }
  }, [activeChecklistId, isLoaded]);

  const activeChecklist = checklists.find((c) => c.id === activeChecklistId) || null;

  const createChecklist = useCallback((title: string, type: "markdown" | "quick", emoji?: string): Checklist => {
    const now = new Date().toISOString();
    const newChecklist: Checklist = {
      id: generateId(),
      title,
      emoji,
      createdAt: now,
      updatedAt: now,
      type,
      sections: type === "quick" ? [{
        id: generateId(),
        title: "Tasks",
        items: [],
        completedCount: 0,
        totalCount: 0,
      }] : [],
      totalCompleted: 0,
      totalItems: 0,
    };

    setChecklists((prev) => [newChecklist, ...prev]);
    setActiveChecklistId(newChecklist.id);
    return newChecklist;
  }, []);

  const createFromMarkdown = useCallback((markdown: string, parsed: ParsedChecklist): Checklist => {
    const now = new Date().toISOString();
    const newChecklist: Checklist = {
      id: generateId(),
      title: parsed.title,
      emoji: parsed.emoji,
      createdAt: now,
      updatedAt: now,
      type: "markdown",
      markdown,
      sections: parsed.sections,
      totalCompleted: parsed.totalCompleted,
      totalItems: parsed.totalItems,
    };

    setChecklists((prev) => [newChecklist, ...prev]);
    setActiveChecklistId(newChecklist.id);
    return newChecklist;
  }, []);

  const updateChecklist = useCallback((id: string, updates: Partial<Checklist>) => {
    setChecklists((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, ...updates, updatedAt: new Date().toISOString() }
          : c
      )
    );
  }, []);

  const deleteChecklist = useCallback((id: string) => {
    setChecklists((prev) => prev.filter((c) => c.id !== id));
    if (activeChecklistId === id) {
      setActiveChecklistId(null);
    }
  }, [activeChecklistId]);

  const setActiveChecklist = useCallback((id: string | null) => {
    setActiveChecklistId(id);
  }, []);

  const addTaskToChecklist = useCallback((
    checklistId: string,
    sectionId: string,
    task: Omit<TodoItem, "id" | "children">
  ) => {
    setChecklists((prev) =>
      prev.map((checklist) => {
        if (checklist.id !== checklistId) return checklist;

        const updatedSections = checklist.sections.map((section) => {
          if (section.id !== sectionId) return section;

          const newTask: TodoItem = {
            ...task,
            id: generateId(),
            children: [],
          };

          return {
            ...section,
            items: [...section.items, newTask],
            totalCount: section.totalCount + 1,
            completedCount: task.completed ? section.completedCount + 1 : section.completedCount,
          };
        });

        const totalItems = updatedSections.reduce((sum, s) => sum + s.totalCount, 0);
        const totalCompleted = updatedSections.reduce((sum, s) => sum + s.completedCount, 0);

        return {
          ...checklist,
          sections: updatedSections,
          totalItems,
          totalCompleted,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  const addSectionToChecklist = useCallback((checklistId: string, title: string, emoji?: string) => {
    setChecklists((prev) =>
      prev.map((checklist) => {
        if (checklist.id !== checklistId) return checklist;

        const newSection: TodoSection = {
          id: generateId(),
          title,
          emoji,
          items: [],
          completedCount: 0,
          totalCount: 0,
        };

        return {
          ...checklist,
          sections: [...checklist.sections, newSection],
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  const duplicateChecklist = useCallback((id: string): Checklist => {
    const original = checklists.find((c) => c.id === id);
    if (!original) throw new Error("Checklist not found");

    const now = new Date().toISOString();
    const duplicated: Checklist = {
      ...JSON.parse(JSON.stringify(original)),
      id: generateId(),
      title: `${original.title} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };

    // Generate new IDs for sections and items
    duplicated.sections = duplicated.sections.map((section: TodoSection) => ({
      ...section,
      id: generateId(),
      items: section.items.map((item: TodoItem) => ({
        ...item,
        id: generateId(),
        children: item.children.map((child: TodoItem) => ({
          ...child,
          id: generateId(),
        })),
      })),
    }));

    setChecklists((prev) => [duplicated, ...prev]);
    return duplicated;
  }, [checklists]);

  if (!isLoaded) {
    return null;
  }

  return (
    <ChecklistContext.Provider
      value={{
        checklists,
        activeChecklistId,
        activeChecklist,
        createChecklist,
        createFromMarkdown,
        updateChecklist,
        deleteChecklist,
        setActiveChecklist,
        addTaskToChecklist,
        addSectionToChecklist,
        duplicateChecklist,
      }}
    >
      {children}
    </ChecklistContext.Provider>
  );
}

export function useChecklists() {
  const context = useContext(ChecklistContext);
  if (context === undefined) {
    throw new Error("useChecklists must be used within a ChecklistProvider");
  }
  return context;
}
