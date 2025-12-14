"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Volume1,
  Music2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMusic } from "@/lib/music-context";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function MiniMusicPlayer() {
  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    isLoading,
    togglePlay,
    playNext,
    playPrevious,
    setVolume,
    toggleMute,
  } = useMusic();

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
      {/* Track indicator */}
      <div
        className={cn(
          "h-8 w-8 rounded-md flex items-center justify-center bg-linear-to-br shrink-0",
          currentTrack.color
        )}
      >
        {isPlaying ? (
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
          <Music2 className="h-4 w-4 text-white" />
        )}
      </div>

      {/* Track name */}
      <div className="flex-1 min-w-0 hidden sm:block">
        <p className="text-xs font-medium truncate">{currentTrack.name}</p>
        <p className="text-[10px] text-muted-foreground">Focus Music</p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={playPrevious}
        >
          <SkipBack className="h-3.5 w-3.5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={togglePlay}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="h-3.5 w-3.5 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={playNext}
        >
          <SkipForward className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Volume popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <VolumeIcon className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-32 p-3" side="top">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={toggleMute}
              >
                <VolumeIcon className="h-3 w-3" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {Math.round((isMuted ? 0 : volume) * 100)}%
              </span>
            </div>
            <Slider
              value={[isMuted ? 0 : volume]}
              onValueChange={(v) => setVolume(v[0])}
              max={1}
              step={0.01}
              className="w-full"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
