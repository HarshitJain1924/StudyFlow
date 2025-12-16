"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Trophy, Target, Flame, Star, Youtube, ExternalLink, Sparkles } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface OverallProgressProps {
  title: string;
  emoji?: string;
  completed: number;
  total: number;
  youtubeUrls?: string[];
}

// Extract video ID from YouTube URL
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /youtube\.com\/shorts\/([^&\s?]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function OverallProgress({ title, emoji, completed, total, youtubeUrls }: OverallProgressProps) {
  // Defensive: ensure we have valid numbers
  const safeTotal = typeof total === 'number' && !isNaN(total) ? total : 0;
  const safeCompleted = typeof completed === 'number' && !isNaN(completed) ? Math.min(completed, safeTotal) : 0;
  
  const progress = safeTotal > 0 ? Math.round((safeCompleted / safeTotal) * 100) : 0;
  const isComplete = safeCompleted === safeTotal && safeTotal > 0;
  
  // Get first video thumbnail if available
  const firstVideoId = youtubeUrls?.[0] ? extractVideoId(youtubeUrls[0]) : null;
  const hasYouTube = firstVideoId !== null;
  
  const getMotivationalMessage = () => {
    if (progress === 0) return "Let's get started! 🚀";
    if (progress < 25) return "Great start! Keep going! 💪";
    if (progress < 50) return "You're making progress! 📈";
    if (progress < 75) return "More than halfway there! 🔥";
    if (progress < 100) return "Almost there! Don't stop now! ⚡";
    return "Congratulations! You did it! 🎉";
  };

  const getProgressColor = () => {
    if (progress < 25) return "text-red-500";
    if (progress < 50) return "text-orange-500";
    if (progress < 75) return "text-yellow-500";
    return "text-green-500";
  };

  const getGradientClass = () => {
    if (isComplete) return "bg-gradient-to-br from-green-500/10 via-transparent to-emerald-500/5";
    if (progress >= 75) return "bg-gradient-to-br from-green-500/5 via-transparent to-transparent";
    if (progress >= 50) return "bg-gradient-to-br from-yellow-500/5 via-transparent to-transparent";
    return "";
  };

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-500 relative",
      isComplete && "border-green-500 shadow-green-500/20 shadow-lg",
      getGradientClass()
    )}>
      {/* Animated progress bar at top */}
      <div className="h-1 bg-muted overflow-hidden">
        <div 
          className={cn(
            "h-full transition-all duration-700 ease-out",
            progress < 25 && "bg-gradient-to-r from-red-400 to-red-500",
            progress >= 25 && progress < 50 && "bg-gradient-to-r from-orange-400 to-orange-500",
            progress >= 50 && progress < 75 && "bg-gradient-to-r from-yellow-400 to-yellow-500",
            progress >= 75 && "bg-gradient-to-r from-green-400 to-green-500"
          )} 
          style={{ width: `${progress}%` }} 
        />
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {emoji && <span className="text-2xl drop-shadow-sm">{emoji}</span>}
            <div className="min-w-0">
              <h2 className="text-lg font-bold truncate">{title}</h2>
              <p className="text-xs text-muted-foreground">
                {getMotivationalMessage()}
              </p>
            </div>
          </div>
          
          {/* YouTube Thumbnail OR Target Icon */}
          {hasYouTube ? (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={youtubeUrls![0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative group shrink-0"
                  >
                    {/* AI Generated badge */}
                    <div className="absolute -top-1 -left-1 z-10">
                      <div className="flex items-center gap-0.5 bg-purple-500 text-white text-[8px] font-medium px-1 py-0.5 rounded">
                        <Sparkles className="h-2 w-2" />
                        AI
                      </div>
                    </div>
                    {/* Thumbnail */}
                    <div className="w-24 h-16 rounded-lg overflow-hidden ring-2 ring-border group-hover:ring-primary transition-all">
                      <img
                        src={`https://img.youtube.com/vi/${firstVideoId}/mqdefault.jpg`}
                        alt="Source video"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center rounded-lg">
                        <div className="flex items-center gap-1 text-white opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                          <Youtube className="h-4 w-4 text-red-500" />
                          <ExternalLink className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                    {/* Video count badge */}
                    {youtubeUrls && youtubeUrls.length > 1 && (
                      <div className="absolute -bottom-1 -right-1 bg-background border text-[10px] px-1.5 py-0.5 rounded-full">
                        +{youtubeUrls.length - 1}
                      </div>
                    )}
                  </a>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="text-xs">
                    {youtubeUrls && youtubeUrls.length > 1 
                      ? `Open source videos (${youtubeUrls.length})`
                      : "Open source video on YouTube"
                    }
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <div className="flex items-center gap-2">
              {isComplete ? (
                <Trophy className="h-6 w-6 text-yellow-500 animate-bounce" />
              ) : (
                <Target className={cn("h-6 w-6", getProgressColor())} />
              )}
            </div>
          )}
        </div>
        
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className={cn("font-bold", getProgressColor())}>
              {progress}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              {safeCompleted} of {safeTotal} tasks completed
            </span>
            <span className="text-muted-foreground">
              {safeTotal - safeCompleted} remaining
            </span>
          </div>
        </div>
        
        {/* Achievement badges */}
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {progress >= 25 && (
            <div className="flex items-center gap-1 bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded-full text-[10px]">
              <Flame className="h-2.5 w-2.5" />
              25%
            </div>
          )}
          {progress >= 50 && (
            <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded-full text-[10px]">
              <Star className="h-2.5 w-2.5" />
              50%
            </div>
          )}
          {progress >= 75 && (
            <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full text-[10px]">
              <Target className="h-2.5 w-2.5" />
              75%
            </div>
          )}
          {progress === 100 && (
            <div className="flex items-center gap-1 bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-full text-[10px]">
              <Trophy className="h-2.5 w-2.5" />
              Done!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
