"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Trophy,
  Medal,
  Crown,
  Flame,
  Clock,
  TrendingUp,
  RefreshCw,
  Award,
} from "lucide-react";

interface LeaderboardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LeaderboardUser {
  rank: number;
  username: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  totalStudyTime: number;
  currentStreak: number;
  level: number;
  xp: number;
}

interface LeaderboardData {
  leaderboard: LeaderboardUser[];
  userRank: number | null;
  currentUser: LeaderboardUser | null;
}

export function Leaderboard({ open, onOpenChange }: LeaderboardProps) {
  const { user } = useUser();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("weekly");
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leaderboard?type=${activeTab}&limit=20`);
      if (res.ok) {
        const leaderboardData = await res.json();
        setData(leaderboardData);
      } else {
        setError("Failed to load leaderboard");
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchLeaderboard();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeTab]);

  const formatStudyTime = (seconds: number | undefined | null) => {
    // Defensive: handle undefined/null/NaN
    const safeSeconds = typeof seconds === 'number' && !isNaN(seconds) ? seconds : 0;
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-medium text-muted-foreground w-5 text-center">{rank}</span>;
    }
  };

  const getRankBackground = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) return "bg-primary/10 border-primary";
    switch (rank) {
      case 1:
        return "bg-yellow-500/10 border-yellow-500/30";
      case 2:
        return "bg-gray-500/10 border-gray-500/30";
      case 3:
        return "bg-amber-500/10 border-amber-500/30";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Leaderboard
          </DialogTitle>
          <DialogDescription>See how you rank against other learners</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weekly">This Week</TabsTrigger>
            <TabsTrigger value="monthly">This Month</TabsTrigger>
            <TabsTrigger value="alltime">All Time</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-sm text-red-500">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchLeaderboard} className="mt-4">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : data ? (
              <div className="space-y-4">
                {/* User's Rank Card */}
                {data.userRank && data.currentUser && (
                  <Card className="border-primary bg-primary/5">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                          {data.userRank}
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={data.currentUser.imageUrl} />
                          <AvatarFallback>
                            {data.currentUser.firstName?.[0]}
                            {data.currentUser.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">
                            {data.currentUser.firstName} {data.currentUser.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">Your Rank</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatStudyTime(data.currentUser.totalStudyTime)}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Flame className="h-3 w-3 text-orange-500" />
                            {data.currentUser.currentStreak} days
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Leaderboard List */}
                <ScrollArea className="h-[350px] pr-4">
                  <div className="space-y-2">
                    {data.leaderboard.map((entry) => {
                      const isCurrentUser = user?.id === entry.username;
                      return (
                        <div
                          key={entry.rank}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${getRankBackground(
                            entry.rank,
                            isCurrentUser
                          )}`}
                        >
                          <div className="w-8 flex justify-center">{getRankIcon(entry.rank)}</div>
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={entry.imageUrl} />
                            <AvatarFallback className="text-xs">
                              {entry.firstName?.[0]}
                              {entry.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {entry.firstName} {entry.lastName}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-[10px] h-4">
                                <Award className="h-2.5 w-2.5 mr-0.5" />
                                Lv.{entry.level}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <Flame className="h-2.5 w-2.5 text-orange-500" />
                                {entry.currentStreak}d
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm">{formatStudyTime(entry.totalStudyTime)}</p>
                            <p className="text-[10px] text-muted-foreground">{entry.xp} XP</p>
                          </div>
                        </div>
                      );
                    })}

                    {data.leaderboard.length === 0 && (
                      <div className="text-center py-12">
                        <Trophy className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground">No entries yet</p>
                        <p className="text-xs text-muted-foreground">Start studying to appear on the leaderboard!</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Refresh Button */}
                <Button variant="outline" size="sm" onClick={fetchLeaderboard} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Sign in to see the leaderboard</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
