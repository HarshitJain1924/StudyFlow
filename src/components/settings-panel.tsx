"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStudy } from "@/lib/study-context";
import { useChecklists } from "@/lib/checklist-store";
import {
  Bell,
  Volume2,
  Target,
  Clock,
  RotateCcw,
  Coffee,
  Brain,
  Download,
  FileJson,
  FileText,
  CalendarDays,
} from "lucide-react";

export function SettingsPanel() {
  const { settings, updateSettings, resetStats, stats } = useStudy();
  const { checklists } = useChecklists();

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        updateSettings({ notificationsEnabled: true });
      }
    }
  };

  // Export data functions
  const exportToJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      settings,
      stats,
      checklists,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `studyflow-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    // Export stats as CSV
    const headers = ["Date", "Minutes Studied", "Tasks Completed"];
    const rows = stats.weeklyData.map((d) => [d.date, d.minutes, d.tasks]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `studyflow-stats-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      {/* Notifications */}
      <Card>
        <CardHeader className="pb-3 px-4 pt-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="desktop-notif" className="text-xs">
              Desktop notifications
            </Label>
            <Switch
              id="desktop-notif"
              checked={settings.notificationsEnabled}
              onCheckedChange={(checked) => {
                if (checked) {
                  requestNotificationPermission();
                } else {
                  updateSettings({ notificationsEnabled: false });
                }
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="sound-notif" className="text-xs flex items-center gap-2">
              <Volume2 className="h-3.5 w-3.5" />
              Sound effects
            </Label>
            <Switch
              id="sound-notif"
              checked={settings.soundEnabled}
              onCheckedChange={(checked) =>
                updateSettings({ soundEnabled: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Daily Goal */}
      <Card>
        <CardHeader className="pb-3 px-4 pt-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4" />
            Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Daily Goal</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={5}
                max={480}
                value={settings.dailyGoal}
                onChange={(e) =>
                  updateSettings({ dailyGoal: parseInt(e.target.value) || 60 })
                }
                className="w-20 h-8 text-sm"
              />
              <span className="text-xs text-muted-foreground">min/day</span>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5" />
              Weekly Goal
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={30}
                max={3360}
                value={settings.weeklyGoal || settings.dailyGoal * 7}
                onChange={(e) =>
                  updateSettings({ weeklyGoal: parseInt(e.target.value) || 600 })
                }
                className="w-20 h-8 text-sm"
              />
              <span className="text-xs text-muted-foreground">min/week</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pomodoro Settings */}
      <Card>
        <CardHeader className="pb-3 px-4 pt-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pomodoro Timer
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-2">
              <Brain className="h-3.5 w-3.5" />
              Focus duration
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={60}
                value={settings.pomodoro.workDuration}
                onChange={(e) =>
                  updateSettings({
                    pomodoro: {
                      ...settings.pomodoro,
                      workDuration: parseInt(e.target.value) || 25,
                    },
                  })
                }
                className="w-16 h-8 text-sm"
              />
              <span className="text-xs text-muted-foreground">min</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-2">
              <Coffee className="h-3.5 w-3.5" />
              Short break
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={30}
                value={settings.pomodoro.shortBreakDuration}
                onChange={(e) =>
                  updateSettings({
                    pomodoro: {
                      ...settings.pomodoro,
                      shortBreakDuration: parseInt(e.target.value) || 5,
                    },
                  })
                }
                className="w-16 h-8 text-sm"
              />
              <span className="text-xs text-muted-foreground">min</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Long break</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={60}
                value={settings.pomodoro.longBreakDuration}
                onChange={(e) =>
                  updateSettings({
                    pomodoro: {
                      ...settings.pomodoro,
                      longBreakDuration: parseInt(e.target.value) || 15,
                    },
                  })
                }
                className="w-16 h-8 text-sm"
              />
              <span className="text-xs text-muted-foreground">min</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Sessions until long break</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={10}
                value={settings.pomodoro.sessionsUntilLongBreak}
                onChange={(e) =>
                  updateSettings({
                    pomodoro: {
                      ...settings.pomodoro,
                      sessionsUntilLongBreak: parseInt(e.target.value) || 4,
                    },
                  })
                }
                className="w-16 h-8 text-sm"
              />
              <span className="text-xs text-muted-foreground">sessions</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reset Stats */}
      {/* Export Data */}
      <Card>
        <CardHeader className="pb-3 px-4 pt-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={exportToJSON}
          >
            <FileJson className="h-4 w-4 mr-2" />
            Export as JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={exportToCSV}
          >
            <FileText className="h-4 w-4 mr-2" />
            Export Stats as CSV
          </Button>
          <p className="text-[10px] text-muted-foreground text-center">
            JSON includes all data • CSV includes study stats only
          </p>
        </CardContent>
      </Card>

      {/* Reset Stats */}
      <Card>
        <CardHeader className="pb-3 px-4 pt-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Data
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => {
              if (confirm("Are you sure you want to reset all statistics? This cannot be undone.")) {
                resetStats();
              }
            }}
          >
            Reset All Statistics
          </Button>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            This will reset your streaks, study time, and task history
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
