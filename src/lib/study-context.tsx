"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import {
  StudyStats,
  AppSettings,
  StudySession,
  defaultSettings,
  defaultStats,
  calculateStreak,
  getTodayKey,
  getWeekDates,
} from "@/lib/study-types";

interface StudyContextType {
  stats: StudyStats;
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  addStudyTime: (seconds: number) => void;
  addCompletedTask: () => void;
  removeCompletedTask: () => void;
  addSession: (session: Omit<StudySession, "id">) => void;
  resetStats: () => void;
  getTodayStudyTime: () => number;
  getTodayTasks: () => number;
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

const STATS_KEY = "markdown-todo-stats";
const SETTINGS_KEY = "markdown-todo-settings";

export function StudyProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<StudyStats>(defaultStats);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const savedStats = localStorage.getItem(STATS_KEY);
    const savedSettings = localStorage.getItem(SETTINGS_KEY);

    if (savedStats) {
      try {
        const parsed = JSON.parse(savedStats);
        // Check and update streak
        const newStreak = calculateStreak(parsed.lastStudyDate, parsed.currentStreak);
        setStats({ ...defaultStats, ...parsed, currentStreak: newStreak });
      } catch (e) {
        console.error("Failed to parse stats:", e);
      }
    }

    if (savedSettings) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
      } catch (e) {
        console.error("Failed to parse settings:", e);
      }
    }

    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }, [stats, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings, isLoaded]);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const addStudyTime = useCallback((seconds: number) => {
    setStats((prev) => {
      const today = getTodayKey();
      const isNewDay = prev.lastStudyDate !== today;
      const newStreak = isNewDay ? prev.currentStreak + 1 : prev.currentStreak;

      // Update weekly data
      const weekDates = getWeekDates();
      const weeklyData = weekDates.map((date) => {
        const existing = prev.weeklyData.find((d) => d.date === date);
        if (date === today) {
          return {
            date,
            minutes: (existing?.minutes || 0) + Math.floor(seconds / 60),
            tasks: existing?.tasks || 0,
          };
        }
        return existing || { date, minutes: 0, tasks: 0 };
      });

      return {
        ...prev,
        totalStudyTime: prev.totalStudyTime + seconds,
        currentStreak: newStreak,
        longestStreak: Math.max(prev.longestStreak, newStreak),
        lastStudyDate: today,
        weeklyData,
      };
    });
  }, []);

  const addCompletedTask = useCallback(() => {
    setStats((prev) => {
      const today = getTodayKey();
      const weekDates = getWeekDates();
      const weeklyData = weekDates.map((date) => {
        const existing = prev.weeklyData.find((d) => d.date === date);
        if (date === today) {
          return {
            date,
            minutes: existing?.minutes || 0,
            tasks: (existing?.tasks || 0) + 1,
          };
        }
        return existing || { date, minutes: 0, tasks: 0 };
      });

      return {
        ...prev,
        totalTasksCompleted: prev.totalTasksCompleted + 1,
        weeklyData,
      };
    });
  }, []);

  const removeCompletedTask = useCallback(() => {
    setStats((prev) => {
      const today = getTodayKey();
      const weekDates = getWeekDates();
      const weeklyData = weekDates.map((date) => {
        const existing = prev.weeklyData.find((d) => d.date === date);
        if (date === today) {
          return {
            date,
            minutes: existing?.minutes || 0,
            tasks: Math.max((existing?.tasks || 0) - 1, 0),
          };
        }
        return existing || { date, minutes: 0, tasks: 0 };
      });

      return {
        ...prev,
        totalTasksCompleted: Math.max(prev.totalTasksCompleted - 1, 0),
        weeklyData,
      };
    });
  }, []);

  const addSession = useCallback((session: Omit<StudySession, "id">) => {
    const newSession: StudySession = {
      ...session,
      id: Math.random().toString(36).substring(2, 11),
    };

    setStats((prev) => ({
      ...prev,
      sessionsHistory: [...prev.sessionsHistory.slice(-99), newSession],
    }));
  }, []);

  const resetStats = useCallback(() => {
    setStats(defaultStats);
  }, []);

  const getTodayStudyTime = useCallback(() => {
    const today = getTodayKey();
    const todayData = stats.weeklyData.find((d) => d.date === today);
    return (todayData?.minutes || 0) * 60;
  }, [stats.weeklyData]);

  const getTodayTasks = useCallback(() => {
    const today = getTodayKey();
    const todayData = stats.weeklyData.find((d) => d.date === today);
    return todayData?.tasks || 0;
  }, [stats.weeklyData]);

  if (!isLoaded) {
    return null;
  }

  return (
    <StudyContext.Provider
      value={{
        stats,
        settings,
        updateSettings,
        addStudyTime,
        addCompletedTask,
        removeCompletedTask,
        addSession,
        resetStats,
        getTodayStudyTime,
        getTodayTasks,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
}

export function useStudy() {
  const context = useContext(StudyContext);
  if (context === undefined) {
    throw new Error("useStudy must be used within a StudyProvider");
  }
  return context;
}
