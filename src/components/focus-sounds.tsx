"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  CloudRain,
  Wind,
  Flame,
  Coffee,
  Waves,
  Volume2,
  VolumeX,
  TreePine,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Sound {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  // Using free ambient sound URLs (we'll use Web Audio API oscillators as fallback)
}

const sounds: Sound[] = [
  { id: "rain", name: "Rain", icon: <CloudRain className="h-4 w-4" />, color: "bg-blue-500" },
  { id: "wind", name: "Wind", icon: <Wind className="h-4 w-4" />, color: "bg-gray-500" },
  { id: "fire", name: "Fire", icon: <Flame className="h-4 w-4" />, color: "bg-orange-500" },
  { id: "cafe", name: "Café", icon: <Coffee className="h-4 w-4" />, color: "bg-amber-600" },
  { id: "waves", name: "Waves", icon: <Waves className="h-4 w-4" />, color: "bg-cyan-500" },
  { id: "forest", name: "Forest", icon: <TreePine className="h-4 w-4" />, color: "bg-green-600" },
];

// Generate ambient noise using Web Audio API
class AmbientGenerator {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private isPlaying = false;

  constructor() {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  generateNoise(type: string, volume: number) {
    if (!this.audioContext) return;

    this.stop();

    const bufferSize = this.audioContext.sampleRate * 2; // 2 seconds
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = buffer.getChannelData(0);

    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.noiseNode = this.audioContext.createBufferSource();
    this.noiseNode.buffer = buffer;
    this.noiseNode.loop = true;

    this.filterNode = this.audioContext.createBiquadFilter();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = volume;

    // Different filter settings for different sounds
    switch (type) {
      case "rain":
        this.filterNode.type = "lowpass";
        this.filterNode.frequency.value = 1000;
        this.filterNode.Q.value = 1;
        break;
      case "wind":
        this.filterNode.type = "bandpass";
        this.filterNode.frequency.value = 300;
        this.filterNode.Q.value = 0.5;
        break;
      case "fire":
        this.filterNode.type = "lowpass";
        this.filterNode.frequency.value = 500;
        this.filterNode.Q.value = 2;
        break;
      case "cafe":
        this.filterNode.type = "bandpass";
        this.filterNode.frequency.value = 800;
        this.filterNode.Q.value = 0.7;
        break;
      case "waves":
        this.filterNode.type = "lowpass";
        this.filterNode.frequency.value = 400;
        this.filterNode.Q.value = 1.5;
        break;
      case "forest":
        this.filterNode.type = "highpass";
        this.filterNode.frequency.value = 200;
        this.filterNode.Q.value = 0.3;
        break;
      default:
        this.filterNode.type = "lowpass";
        this.filterNode.frequency.value = 800;
    }

    this.noiseNode.connect(this.filterNode);
    this.filterNode.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    this.noiseNode.start();
    this.isPlaying = true;
  }

  setVolume(volume: number) {
    if (this.gainNode) {
      this.gainNode.gain.value = volume;
    }
  }

  stop() {
    if (this.noiseNode && this.isPlaying) {
      this.noiseNode.stop();
      this.noiseNode.disconnect();
      this.isPlaying = false;
    }
  }

  resume() {
    if (this.audioContext?.state === "suspended") {
      this.audioContext.resume();
    }
  }
}

export function FocusSounds() {
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.3);
  const generatorRef = useRef<AmbientGenerator | null>(null);

  useEffect(() => {
    generatorRef.current = new AmbientGenerator();
    return () => {
      generatorRef.current?.stop();
    };
  }, []);

  const toggleSound = (soundId: string) => {
    if (!generatorRef.current) return;
    
    generatorRef.current.resume();

    if (activeSound === soundId) {
      generatorRef.current.stop();
      setActiveSound(null);
    } else {
      generatorRef.current.generateNoise(soundId, volume);
      setActiveSound(soundId);
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    const vol = newVolume[0];
    setVolume(vol);
    if (generatorRef.current && activeSound) {
      generatorRef.current.setVolume(vol);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">Focus Sounds</span>
          <div className="flex items-center gap-2">
            {activeSound ? (
              <Volume2 className="h-4 w-4 text-muted-foreground" />
            ) : (
              <VolumeX className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Sound Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {sounds.map((sound) => (
            <Button
              key={sound.id}
              variant={activeSound === sound.id ? "default" : "outline"}
              size="sm"
              className={cn(
                "flex flex-col h-auto py-2 gap-1",
                activeSound === sound.id && sound.color
              )}
              onClick={() => toggleSound(sound.id)}
            >
              {sound.icon}
              <span className="text-[10px]">{sound.name}</span>
            </Button>
          ))}
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-2">
          <VolumeX className="h-3 w-3 text-muted-foreground" />
          <Slider
            value={[volume]}
            onValueChange={handleVolumeChange}
            max={1}
            step={0.1}
            className="flex-1"
          />
          <Volume2 className="h-3 w-3 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}
