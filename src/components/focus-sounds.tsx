"use client";

import { useState, useRef, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Volume1,
  Repeat,
  Shuffle,
  Music2,
  ListMusic,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMusic } from "@/lib/music-context";

function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

interface FocusSoundsProps {
  minimalUI?: boolean;
}

export function FocusSounds({ minimalUI = false }: FocusSoundsProps) {
  const [showPlaylist, setShowPlaylist] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  const {
    tracks,
    currentTrackIndex,
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    currentTime,
    duration,
    isRepeat,
    isShuffle,
    isLoading,
    likedTracks,
    togglePlay,
    playNext,
    playPrevious,
    playTrack,
    setVolume,
    toggleMute,
    toggleRepeat,
    toggleShuffle,
    toggleLike,
    seek,
  } = useMusic();

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    
    seek(newTime);
  };

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume[0]);
  };

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Pre-generate random values for the visualizer bars
  const visualizerBars = useMemo(() => 
    [...Array(20)].map((_, i) => ({
      height: 20 + (i * 3) % 60 + 10,  // deterministic pseudo-random
      duration: 0.5 + (i % 5) * 0.1,
    })), []);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Album Art / Visualizer */}
        <div 
          className={cn(
            "relative h-28 bg-linear-to-br flex items-center justify-center overflow-hidden",
            currentTrack.color
          )}
        >
          {/* Animated background - only show when not minimal UI */}
          {!minimalUI && (
            <div className="absolute inset-0 opacity-30">
              {isPlaying && (
                <div className="absolute inset-0 flex items-end justify-center gap-0.5 px-4 pb-2">
                  {visualizerBars.map((bar, i) => (
                    <div
                      key={i}
                      className="w-1 bg-white/60 rounded-full animate-pulse"
                      style={{
                        height: `${bar.height}%`,
                        animationDelay: `${i * 0.05}s`,
                        animationDuration: `${bar.duration}s`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Center icon */}
          <div className={cn(
            "relative z-10 h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transition-transform",
            isPlaying && "animate-spin-slow"
          )}>
            <Music2 className="h-8 w-8 text-white" />
          </div>

          {/* Playlist toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 bg-black/20 hover:bg-black/40 text-white"
            onClick={() => setShowPlaylist(!showPlaylist)}
          >
            <ListMusic className="h-4 w-4" />
          </Button>
        </div>

        {/* Track Info */}
        <div className="px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-sm truncate">{currentTrack.name}</h3>
              <p className="text-[10px] text-muted-foreground">Focus Music</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => toggleLike(currentTrack.id)}
            >
              <Heart 
                className={cn(
                  "h-4 w-4 transition-colors",
                  likedTracks.has(currentTrack.id) 
                    ? "fill-red-500 text-red-500" 
                    : "text-muted-foreground"
                )} 
              />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-3 pb-1">
          <div
            ref={progressRef}
            className="relative h-1 bg-muted rounded-full cursor-pointer group"
            onClick={handleProgressClick}
          >
            <div
              className="absolute h-full bg-primary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute h-3 w-3 bg-primary rounded-full -top-1 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progress}% - 6px)` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-muted-foreground">{formatTime(currentTime)}</span>
            <span className="text-[10px] text-muted-foreground">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="px-3 pb-2">
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7 relative",
                isShuffle && "text-primary bg-primary/10"
              )}
              onClick={toggleShuffle}
            >
              <Shuffle className="h-3.5 w-3.5" />
              {isShuffle && (
                <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 bg-primary rounded-full" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={playPrevious}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            
            <Button
              variant="default"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={togglePlay}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={playNext}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7 relative",
                isRepeat && "text-primary bg-primary/10"
              )}
              onClick={toggleRepeat}
            >
              <Repeat className="h-3.5 w-3.5" />
              {isRepeat && (
                <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 bg-primary rounded-full" />
              )}
            </Button>
          </div>
        </div>

        {/* Volume */}
        <div className="px-3 pb-3 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={toggleMute}
          >
            <VolumeIcon className="h-3.5 w-3.5" />
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            onValueChange={handleVolumeChange}
            max={1}
            step={0.01}
            className="w-20"
          />
        </div>

        {/* Playlist */}
        {showPlaylist && (
          <div className="border-t">
            <ScrollArea className="h-40">
              <div className="p-2 space-y-1">
                {tracks.map((track, index) => (
                  <button
                    key={track.id}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors",
                      index === currentTrackIndex
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    )}
                    onClick={() => playTrack(index)}
                  >
                    <div className={cn(
                      "h-8 w-8 rounded flex items-center justify-center bg-linear-to-br shrink-0",
                      track.color
                    )}>
                      {index === currentTrackIndex && isPlaying ? (
                        <div className="flex items-end gap-0.5 h-4">
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className="w-0.5 bg-white rounded-full animate-pulse"
                              style={{
                                height: `${40 + i * 20}%`,
                                animationDelay: `${i * 0.15}s`,
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <Music2 className="h-3.5 w-3.5 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{track.name}</p>
                      <p className="text-[10px] text-muted-foreground">Focus Music</p>
                    </div>
                    {likedTracks.has(track.id) && (
                      <Heart className="h-3 w-3 fill-red-500 text-red-500 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>

      {/* Add custom animation */}
      <style jsx global>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </Card>
  );
}
