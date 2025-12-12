export interface StudySession {
  id: string;
  date: string;
  duration: number; // in seconds
  tasksCompleted: number;
  sectionId?: string;
}

export interface StudyStats {
  totalStudyTime: number; // in seconds
  totalTasksCompleted: number;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string;
  sessionsHistory: StudySession[];
  dailyGoal: number; // in minutes
  weeklyData: { date: string; minutes: number; tasks: number }[];
}

export interface PomodoroSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

export interface AppSettings {
  pomodoro: PomodoroSettings;
  dailyGoal: number;
  weeklyGoal: number; // in minutes
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
  focusMode: boolean;
}

export const defaultSettings: AppSettings = {
  pomodoro: {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
  },
  dailyGoal: 120, // 2 hours
  weeklyGoal: 600, // 10 hours
  soundEnabled: true,
  notificationsEnabled: true,
  theme: 'system',
  focusMode: false,
};

export const defaultStats: StudyStats = {
  totalStudyTime: 0,
  totalTasksCompleted: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastStudyDate: '',
  sessionsHistory: [],
  dailyGoal: 120,
  weeklyData: [],
};

export function calculateStreak(lastStudyDate: string, currentStreak: number): number {
  if (!lastStudyDate) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastDate = new Date(lastStudyDate);
  lastDate.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return currentStreak; // Same day
  if (diffDays === 1) return currentStreak; // Yesterday, streak continues
  return 0; // Streak broken
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

export function formatTimeShort(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

export function getWeekDates(): string[] {
  const dates: string[] = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}
