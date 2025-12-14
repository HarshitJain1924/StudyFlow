"use client";

import { useState, useEffect } from "react";
import { useUser, useClerk, SignedIn, SignedOut } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  User,
  LogOut,
  Settings,
  Trophy,
  Flame,
  Clock,
  Star,
  Shield,
  Zap,
  Target,
  BookOpen,
  Award,
  TrendingUp,
  Cloud,
  CloudOff,
} from "lucide-react";
import { toast } from "sonner";

interface UserProfileProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserStats {
  totalStudyTime: number;
  totalTasksCompleted: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
  xp: number;
  badges: string[];
}

const BADGE_INFO: Record<string, { icon: React.ReactNode; name: string; description: string }> = {
  "first-session": { icon: <Star className="h-4 w-4" />, name: "First Steps", description: "Complete your first study session" },
  "streak-7": { icon: <Flame className="h-4 w-4" />, name: "Week Warrior", description: "7 day study streak" },
  "streak-30": { icon: <Zap className="h-4 w-4" />, name: "Monthly Master", description: "30 day study streak" },
  "hours-10": { icon: <Clock className="h-4 w-4" />, name: "Dedicated", description: "Study for 10 hours" },
  "hours-100": { icon: <Trophy className="h-4 w-4" />, name: "Century Club", description: "Study for 100 hours" },
  "tasks-100": { icon: <Target className="h-4 w-4" />, name: "Task Master", description: "Complete 100 tasks" },
  "level-10": { icon: <Shield className="h-4 w-4" />, name: "Rising Star", description: "Reach level 10" },
  "early-bird": { icon: <BookOpen className="h-4 w-4" />, name: "Early Bird", description: "Study before 6 AM" },
};

export function UserProfile({ open, onOpenChange }: UserProfileProps) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isPublicProfile, setIsPublicProfile] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  useEffect(() => {
    if (open && user) {
      fetchStats();
    }
  }, [open, user]);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const syncData = async () => {
    setIsSyncing(true);
    try {
      // Get local data
      const localStats = localStorage.getItem("study-stats");
      const localChecklists = localStorage.getItem("markdown-todo-checklists");

      // Sync stats
      if (localStats) {
        await fetch("/api/stats", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: localStats,
        });
      }

      // Sync checklists
      if (localChecklists) {
        await fetch("/api/checklists", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checklists: JSON.parse(localChecklists) }),
        });
      }

      setLastSynced(new Date());
      toast.success("Data synced to cloud!");
      fetchStats();
    } catch (error) {
      console.error("Sync failed:", error);
      toast.error("Failed to sync data");
    } finally {
      setIsSyncing(false);
    }
  };

  const formatStudyTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getXpToNextLevel = () => {
    if (!stats) return { current: 0, needed: 1000 };
    const xpInCurrentLevel = stats.xp % 1000;
    return { current: xpInCurrentLevel, needed: 1000 };
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
          <DialogDescription>Your study progress and achievements</DialogDescription>
        </DialogHeader>

        <SignedIn>
          {user && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.imageUrl} alt={user.fullName || ""} />
                  <AvatarFallback>
                    {user.firstName?.[0]}
                    {user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{user.fullName || user.username}</h3>
                  <p className="text-sm text-muted-foreground">{user.primaryEmailAddress?.emailAddress}</p>
                  {stats && (
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        <Award className="h-3 w-3 mr-1" />
                        Level {stats.level}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Flame className="h-3 w-3 mr-1 text-orange-500" />
                        {stats.currentStreak} day streak
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* XP Progress */}
              {stats && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Level {stats.level}</span>
                    <span className="text-muted-foreground">Level {stats.level + 1}</span>
                  </div>
                  <Progress value={(getXpToNextLevel().current / getXpToNextLevel().needed) * 100} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground">
                    {getXpToNextLevel().current} / {getXpToNextLevel().needed} XP
                  </p>
                </div>
              )}

              {/* Stats Grid */}
              {stats && (
                <div className="grid grid-cols-2 gap-3">
                  <Card>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs">Total Study Time</span>
                      </div>
                      <p className="text-xl font-bold">{formatStudyTime(stats.totalStudyTime)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Target className="h-4 w-4" />
                        <span className="text-xs">Tasks Completed</span>
                      </div>
                      <p className="text-xl font-bold">{stats.totalTasksCompleted}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span className="text-xs">Current Streak</span>
                      </div>
                      <p className="text-xl font-bold">{stats.currentStreak} days</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-xs">Best Streak</span>
                      </div>
                      <p className="text-xl font-bold">{stats.longestStreak} days</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Badges */}
              {stats && stats.badges.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    Achievements
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {stats.badges.map((badge) => {
                      const info = BADGE_INFO[badge];
                      if (!info) return null;
                      return (
                        <Badge key={badge} variant="secondary" className="gap-1">
                          {info.icon}
                          {info.name}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              <Separator />

              {/* Cloud Sync */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Cloud className="h-4 w-4" />
                  Cloud Sync
                </h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Sync your data to the cloud</p>
                    {lastSynced && (
                      <p className="text-xs text-muted-foreground">
                        Last synced: {lastSynced.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                  <Button size="sm" onClick={syncData} disabled={isSyncing}>
                    {isSyncing ? (
                      <>Syncing...</>
                    ) : (
                      <>
                        <Cloud className="h-4 w-4 mr-2" />
                        Sync Now
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Settings */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Privacy
                </h4>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="public-profile">Public Profile</Label>
                    <p className="text-xs text-muted-foreground">Show on leaderboard</p>
                  </div>
                  <Switch
                    id="public-profile"
                    checked={isPublicProfile}
                    onCheckedChange={setIsPublicProfile}
                  />
                </div>
              </div>

              <Separator />

              {/* Sign Out */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  signOut();
                  onOpenChange(false);
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )}
        </SignedIn>

        <SignedOut>
          <div className="text-center py-8">
            <CloudOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Not Signed In</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Sign in to sync your data across devices and compete on the leaderboard
            </p>
            <Button onClick={() => (window.location.href = "/sign-in")}>
              <User className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          </div>
        </SignedOut>
      </DialogContent>
    </Dialog>
  );
}
