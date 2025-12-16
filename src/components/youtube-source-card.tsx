"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Youtube, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface YouTubeSourceCardProps {
  videoUrls: string[];
  createdAt: string;
  className?: string;
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

// Get YouTube thumbnail URL
function getThumbnailUrl(videoId: string, quality: "default" | "hq" | "mq" | "sd" | "maxres" = "mq"): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}default.jpg`;
}

// Format date nicely
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins <= 1 ? "Just now" : `${diffMins}m ago`;
    }
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString("en-US", { 
    month: "short", 
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function YouTubeSourceCard({ videoUrls, createdAt, className }: YouTubeSourceCardProps) {
  const videoIds = videoUrls
    .map(url => ({ url, id: extractVideoId(url) }))
    .filter(v => v.id !== null) as { url: string; id: string }[];
  
  if (videoIds.length === 0) return null;
  
  const firstVideo = videoIds[0];
  const hasMultiple = videoIds.length > 1;
  
  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-lg bg-muted/50 border", className)}>
      {/* AI Badge */}
      <Badge variant="secondary" className="gap-1 shrink-0 bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
        <Sparkles className="h-3 w-3" />
        AI Generated
      </Badge>
      
      {/* Thumbnail(s) */}
      <div className="flex items-center gap-1.5">
        {hasMultiple ? (
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1 hover:opacity-80 transition-opacity">
                {/* Stacked thumbnails preview */}
                <div className="flex -space-x-2">
                  {videoIds.slice(0, 3).map(({ id }, i) => (
                    <div 
                      key={id}
                      className="w-10 h-7 rounded overflow-hidden ring-2 ring-background"
                      style={{ zIndex: 3 - i }}
                    >
                      <img
                        src={getThumbnailUrl(id, "default")}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground ml-1">
                  {videoIds.length} videos
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground px-1 pb-1">Source Videos</p>
                {videoIds.map(({ url, id }, index) => (
                  <a
                    key={id}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-1.5 rounded hover:bg-muted transition-colors group"
                  >
                    <div className="w-16 h-10 rounded overflow-hidden shrink-0">
                      <img
                        src={getThumbnailUrl(id, "default")}
                        alt={`Video ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate">Video {index + 1}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Youtube className="h-2.5 w-2.5 text-red-500" />
                        Open on YouTube
                        <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={firstVideo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity group"
                >
                  <div className="w-12 h-8 rounded overflow-hidden ring-1 ring-border">
                    <img
                      src={getThumbnailUrl(firstVideo.id, "default")}
                      alt="Source video"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Youtube className="h-3 w-3 text-red-500" />
                    <span>Source video</span>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </a>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Open on YouTube</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      {/* Timestamp - push to right */}
      <span className="text-xs text-muted-foreground ml-auto shrink-0">
        {formatDate(createdAt)}
      </span>
    </div>
  );
}
