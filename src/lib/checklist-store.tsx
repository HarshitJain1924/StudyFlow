"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useRef,
} from "react";
import { useUser } from "@clerk/nextjs";
import { ParsedChecklist, TodoSection, TodoItem } from "./markdown-parser";

export interface Checklist {
  id: string;
  title: string;
  emoji?: string;
  createdAt: string;
  updatedAt: string;
  type: "markdown" | "quick"; // markdown = parsed from md, quick = created directly
  markdown?: string; // original markdown if type is markdown
  youtubeUrls?: string[]; // YouTube URLs if created from AI
  sections: TodoSection[];
  totalCompleted: number;
  totalItems: number;
}

interface ChecklistStore {
  checklists: Checklist[];
  activeChecklistId: string | null;
  activeChecklist: Checklist | null;
  createChecklist: (
    title: string,
    type: "markdown" | "quick",
    emoji?: string
  ) => Checklist;
  createChecklistWithSections: (
    checklist: Omit<Checklist, "createdAt" | "updatedAt">
  ) => Checklist;
  createFromMarkdown: (
    markdown: string,
    parsed: ParsedChecklist,
    youtubeUrls?: string[]
  ) => Checklist;
  updateChecklist: (id: string, updates: Partial<Checklist>) => void;
  deleteChecklist: (id: string) => void;
  setActiveChecklist: (id: string | null) => void;
  addTaskToChecklist: (
    checklistId: string,
    sectionId: string,
    task: Omit<TodoItem, "id" | "children">
  ) => void;
  toggleTask: (checklistId: string, taskId: string, completed: boolean) => void;
  addSectionToChecklist: (
    checklistId: string,
    title: string,
    emoji?: string
  ) => void;
  duplicateChecklist: (id: string) => Checklist;
  syncToCloud: () => Promise<void>;
  isSyncing: boolean;
}

const ChecklistContext = createContext<ChecklistStore | undefined>(undefined);

const CHECKLISTS_KEY = "markdown-todo-checklists";
const ACTIVE_CHECKLIST_KEY = "markdown-todo-active-checklist";
const LAST_SYNC_KEY = "markdown-todo-last-sync";

function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

// Helper to normalize checklist data and fix any NaN/undefined values
function normalizeChecklist(checklist: Checklist): Checklist {
  const sections = (checklist.sections || []).map((section) => {
    const items = section.items || [];
    // Count items recursively
    const countItems = (
      items: TodoItem[]
    ): { total: number; completed: number } => {
      let total = 0;
      let completed = 0;
      items.forEach((item) => {
        total++;
        if (item.completed) completed++;
        const childCounts = countItems(item.children || []);
        total += childCounts.total;
        completed += childCounts.completed;
      });
      return { total, completed };
    };

    const counts = countItems(items);

    return {
      ...section,
      items,
      totalCount:
        typeof section.totalCount === "number" && !isNaN(section.totalCount)
          ? section.totalCount
          : counts.total,
      completedCount:
        typeof section.completedCount === "number" &&
        !isNaN(section.completedCount)
          ? section.completedCount
          : counts.completed,
    };
  });

  // Recalculate totals
  let totalItems = 0;
  let totalCompleted = 0;
  sections.forEach((s) => {
    totalItems += s.totalCount;
    totalCompleted += s.completedCount;
  });

  return {
    ...checklist,
    sections,
    totalItems:
      typeof checklist.totalItems === "number" && !isNaN(checklist.totalItems)
        ? checklist.totalItems
        : totalItems,
    totalCompleted:
      typeof checklist.totalCompleted === "number" &&
      !isNaN(checklist.totalCompleted)
        ? checklist.totalCompleted
        : totalCompleted,
  };
}

export function ChecklistProvider({ children }: { children: ReactNode }) {
  const { user, isSignedIn } = useUser();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [activeChecklistId, setActiveChecklistId] = useState<string | null>(
    null
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncedDataRef = useRef<string>("");

  // Load from localStorage first, then sync with cloud
  useEffect(() => {
    const savedChecklists = localStorage.getItem(CHECKLISTS_KEY);
    const savedActiveId = localStorage.getItem(ACTIVE_CHECKLIST_KEY);

    if (savedChecklists) {
      try {
        const parsed = JSON.parse(savedChecklists);
        // Normalize all loaded checklists to fix any NaN values
        const normalized = Array.isArray(parsed)
          ? parsed.map(normalizeChecklist)
          : [];
        setChecklists(normalized);
      } catch (e) {
        console.error("Failed to load checklists:", e);
      }
    }

    if (savedActiveId) {
      setActiveChecklistId(savedActiveId);
    }

    setIsLoaded(true);
  }, []);

  // Fetch from cloud when user signs in
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    const fetchFromCloud = async () => {
      try {
        const res = await fetch("/api/checklists");
        if (res.ok) {
          const cloudRaw: any[] = await res.json();

          const hasLegacyMissingId =
            Array.isArray(cloudRaw) && cloudRaw.some((c) => !c?.id);
          const normalizedCloud: Checklist[] = Array.isArray(cloudRaw)
            ? cloudRaw.map((c) => {
                const stableId =
                  typeof c?.id === "string" && c.id.length > 0
                    ? c.id
                    : typeof c?._id === "string" && c._id.length > 0
                    ? c._id
                    : generateId();
                // Normalize to fix any NaN values
                return normalizeChecklist({ ...c, id: stableId } as Checklist);
              })
            : [];

          if (normalizedCloud.length > 0) {
            // If cloud rows are from an older schema (missing `id`), prefer local and re-sync.
            // This prevents duplicate lists + fixes sidebar selection / list keys.
            if (hasLegacyMissingId) {
              lastSyncedDataRef.current = "";
              if (checklists.length > 0) {
                syncToCloud();
                return;
              }

              setChecklists(normalizedCloud);
              // Let debounced sync upload normalized IDs.
              return;
            }

            // Normal merge: cloud is source of truth, but keep local items not in cloud
            const cloudIds = new Set(
              normalizedCloud.map((c: Checklist) => c.id)
            );
            const localOnly = checklists.filter((c) => !cloudIds.has(c.id));

            const merged = [...normalizedCloud, ...localOnly].sort(
              (a, b) =>
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime()
            );
            setChecklists(merged);
            lastSyncedDataRef.current = JSON.stringify(merged);
          } else if (checklists.length > 0) {
            // No cloud data, sync local to cloud
            syncToCloud();
          }
        }
      } catch (error) {
        console.error("Failed to fetch checklists from cloud:", error);
      }
    };

    fetchFromCloud();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, user]);

  // Sync to cloud function
  const syncToCloud = useCallback(async () => {
    if (!isSignedIn || isSyncing) return;

    const currentData = JSON.stringify(checklists);
    if (currentData === lastSyncedDataRef.current) return;

    setIsSyncing(true);
    try {
      const res = await fetch("/api/checklists", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklists }),
      });

      if (res.ok) {
        lastSyncedDataRef.current = currentData;
        localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      }
    } catch (error) {
      console.error("Failed to sync checklists to cloud:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSignedIn, isSyncing, checklists]);

  // Save to localStorage and debounced cloud sync
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(CHECKLISTS_KEY, JSON.stringify(checklists));

    // Debounced cloud sync (reduced to 500ms for faster sync)
    if (isSignedIn) {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(() => {
        syncToCloud();
      }, 500); // Sync after 500ms of inactivity for faster updates
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [checklists, isLoaded, isSignedIn, syncToCloud]);

  // Sync immediately when tab becomes visible again (for cross-device sync)
  useEffect(() => {
    if (!isSignedIn) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        // Fetch latest from cloud when tab becomes visible
        try {
          const res = await fetch("/api/checklists");
          if (res.ok) {
            const cloudChecklists = await res.json();
            if (cloudChecklists.length > 0) {
              setChecklists(cloudChecklists);
              lastSyncedDataRef.current = JSON.stringify(cloudChecklists);
            }
          }
        } catch (error) {
          console.error("Failed to fetch on visibility:", error);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isSignedIn]);

  useEffect(() => {
    if (!isLoaded) return;
    if (activeChecklistId) {
      localStorage.setItem(ACTIVE_CHECKLIST_KEY, activeChecklistId);
    } else {
      localStorage.removeItem(ACTIVE_CHECKLIST_KEY);
    }
  }, [activeChecklistId, isLoaded]);

  const activeChecklist =
    checklists.find((c) => c.id === activeChecklistId) || null;

  const createChecklist = useCallback(
    (title: string, type: "markdown" | "quick", emoji?: string): Checklist => {
      const now = new Date().toISOString();
      const newChecklist: Checklist = {
        id: generateId(),
        title,
        emoji,
        createdAt: now,
        updatedAt: now,
        type,
        sections:
          type === "quick"
            ? [
                {
                  id: generateId(),
                  title: "Tasks",
                  items: [],
                  completedCount: 0,
                  totalCount: 0,
                },
              ]
            : [],
        totalCompleted: 0,
        totalItems: 0,
      };

      setChecklists((prev) => [newChecklist, ...prev]);
      setActiveChecklistId(newChecklist.id);
      return newChecklist;
    },
    []
  );

  // Create checklist with custom sections (for auto-creating from goals)
  const createChecklistWithSections = useCallback(
    (input: Omit<Checklist, "createdAt" | "updatedAt">): Checklist => {
      const now = new Date().toISOString();
      const newChecklist: Checklist = normalizeChecklist({
        ...input,
        createdAt: now,
        updatedAt: now,
      });

      setChecklists((prev) => [newChecklist, ...prev]);
      // Don't auto-activate for bulk imports
      return newChecklist;
    },
    []
  );

  const createFromMarkdown = useCallback(
    (
      markdown: string,
      parsed: ParsedChecklist,
      youtubeUrls?: string[]
    ): Checklist => {
      const now = new Date().toISOString();
      const newChecklist: Checklist = {
        id: generateId(),
        title: parsed.title,
        emoji: parsed.emoji,
        createdAt: now,
        updatedAt: now,
        type: "markdown",
        markdown,
        youtubeUrls,
        sections: parsed.sections,
        totalCompleted: parsed.totalCompleted,
        totalItems: parsed.totalItems,
      };

      setChecklists((prev) => [newChecklist, ...prev]);
      setActiveChecklistId(newChecklist.id);
      return newChecklist;
    },
    []
  );

  const updateChecklist = useCallback(
    (id: string, updates: Partial<Checklist>) => {
      setChecklists((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, ...updates, updatedAt: new Date().toISOString() }
            : c
        )
      );
    },
    []
  );

  const deleteChecklist = useCallback(
    (id: string) => {
      setChecklists((prev) => prev.filter((c) => c.id !== id));
      if (activeChecklistId === id) {
        setActiveChecklistId(null);
      }
    },
    [activeChecklistId]
  );

  const setActiveChecklist = useCallback((id: string | null) => {
    setActiveChecklistId(id);
  }, []);

  const addTaskToChecklist = useCallback(
    (
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
              completedCount: task.completed
                ? section.completedCount + 1
                : section.completedCount,
            };
          });

          const totalItems = updatedSections.reduce(
            (sum, s) => sum + s.totalCount,
            0
          );
          const totalCompleted = updatedSections.reduce(
            (sum, s) => sum + s.completedCount,
            0
          );

          return {
            ...checklist,
            sections: updatedSections,
            totalItems,
            totalCompleted,
            updatedAt: new Date().toISOString(),
          };
        })
      );
    },
    []
  );

  const toggleTask = useCallback((checklistId: string, taskId: string, completed: boolean) => {
    setChecklists(prev => prev.map(checklist => {
      if (checklist.id !== checklistId) return checklist;

      // Deep clone to safely mutate
      const newChecklist = { ...checklist };
      
      // Helper to update items recursively
      const updateItems = (items: TodoItem[]): { items: TodoItem[], changed: boolean } => {
        let changed = false;
        const newItems = items.map(item => {
          if (item.id === taskId) {
            changed = true;
            return { ...item, completed };
          }
          if (item.children && item.children.length > 0) {
            const result = updateItems(item.children);
            if (result.changed) {
              changed = true;
              return { ...item, children: result.items };
            }
          }
          return item;
        });
        return { items: newItems, changed };
      };

      // Update sections
      newChecklist.sections = newChecklist.sections.map(section => {
        const result = updateItems(section.items);
        if (result.changed) {
          // Recalculate counts
          const countItems = (items: TodoItem[]): { total: number; completed: number } => {
            let total = 0;
            let comp = 0;
            items.forEach(i => {
              total++;
              if (i.completed) comp++;
              const sub = countItems(i.children || []);
              total += sub.total;
              comp += sub.completed;
            });
            return { total, completed: comp };
          };
          const counts = countItems(result.items);
          return {
            ...section,
            items: result.items,
            totalCount: counts.total,
            completedCount: counts.completed
          };
        }
        return section;
      });

      // Recalculate total checklist counts
      newChecklist.totalItems = newChecklist.sections.reduce((acc, s) => acc + s.totalCount, 0);
      newChecklist.totalCompleted = newChecklist.sections.reduce((acc, s) => acc + s.completedCount, 0);
      newChecklist.updatedAt = new Date().toISOString();
      
      return newChecklist;
    }));
  }, []);

  const addSectionToChecklist = useCallback(
    (checklistId: string, title: string, emoji?: string) => {
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
    },
    []
  );

  const duplicateChecklist = useCallback(
    (id: string): Checklist => {
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
    },
    [checklists]
  );

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
        createChecklistWithSections,
        createFromMarkdown,
        updateChecklist,
        deleteChecklist,
        setActiveChecklist,
        addTaskToChecklist,
        toggleTask,
        addSectionToChecklist,
        duplicateChecklist,
        syncToCloud,
        isSyncing,
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
