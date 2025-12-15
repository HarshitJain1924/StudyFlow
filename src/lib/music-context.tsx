"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";

interface Track {
  id: string;
  name: string;
  file: string;
  color: string;
}

const tracks: Track[] = [
  {
    id: "healing-cosmic",
    name: "Healing Cosmic Sleep",
    file: "/sounds/432hz-magic-healing-cosmic-sleep-amp-focus-frequency-361117.mp3",
    color: "from-purple-500 to-indigo-600",
  },
  {
    id: "corporate-focus",
    name: "Corporate Focus",
    file: "/sounds/corporate-focus-1-442910.mp3",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "late-night-focus",
    name: "Late Night Focus",
    file: "/sounds/perfect-for-studying-reading-or-late-night-focus-background-music-361174.mp3",
    color: "from-indigo-500 to-purple-600",
  },
  {
    id: "rainy-cafe",
    name: "Rainy Study Cafe",
    file: "/sounds/rainy-study-cafe-409654.mp3",
    color: "from-slate-500 to-blue-600",
  },
  {
    id: "brain-power",
    name: "Brain Power 432Hz",
    file: "/sounds/study-music-for-focus-and-brain-power-432-hz.mp3",
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "whispering-rain",
    name: "Whispering Rain",
    file: "/sounds/whispering-rain.mp3",
    color: "from-cyan-500 to-blue-500",
  },
];

interface MusicContextType {
  tracks: Track[];
  currentTrackIndex: number;
  currentTrack: Track;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  isRepeat: boolean;
  isShuffle: boolean;
  isLoading: boolean;
  likedTracks: Set<string>;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  playTrack: (index: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  toggleLike: (trackId: string) => void;
  seek: (time: number) => void;
}

const MusicContext = createContext<MusicContextType | null>(null);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shouldAutoPlayRef = useRef(false);
  const currentTrack = tracks[currentTrackIndex];

  // Update Media Session metadata when track changes
  const updateMediaSession = useCallback(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;
    
    navigator.mediaSession.metadata = new MediaMetadata({
      title: tracks[currentTrackIndex].name,
      artist: "StudyFlow Focus Music",
      album: "Focus & Study",
      artwork: [
        { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
      ],
    });
  }, [currentTrackIndex]);

  // Setup Media Session action handlers
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    const actionHandlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", () => {
        audioRef.current?.play().catch(console.error);
      }],
      ["pause", () => {
        audioRef.current?.pause();
      }],
      ["previoustrack", () => {
        const audio = audioRef.current;
        if (audio && audio.currentTime > 3) {
          audio.currentTime = 0;
        } else {
          setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
          setTimeout(() => audioRef.current?.play().catch(console.error), 100);
        }
      }],
      ["nexttrack", () => {
        setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
        setTimeout(() => audioRef.current?.play().catch(console.error), 100);
      }],
      ["seekto", (details) => {
        if (audioRef.current && details.seekTime !== undefined) {
          audioRef.current.currentTime = details.seekTime;
          setCurrentTime(details.seekTime);
        }
      }],
      ["seekbackward", (details) => {
        if (audioRef.current) {
          const skipTime = details.seekOffset || 10;
          audioRef.current.currentTime = Math.max(audioRef.current.currentTime - skipTime, 0);
        }
      }],
      ["seekforward", (details) => {
        if (audioRef.current) {
          const skipTime = details.seekOffset || 10;
          audioRef.current.currentTime = Math.min(
            audioRef.current.currentTime + skipTime,
            audioRef.current.duration || 0
          );
        }
      }],
      ["stop", () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      }],
    ];

    for (const [action, handler] of actionHandlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Action not supported
      }
    }

    return () => {
      for (const [action] of actionHandlers) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // Action not supported
        }
      }
    };
  }, []);

  // Update Media Session playback state
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

  // Update Media Session position state
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;
    if (!duration || duration === 0) return;

    try {
      navigator.mediaSession.setPositionState({
        duration: duration,
        playbackRate: 1,
        position: Math.min(currentTime, duration),
      });
    } catch {
      // Position state not supported or invalid values
    }
  }, [currentTime, duration]);

  // Update metadata when track changes
  useEffect(() => {
    updateMediaSession();
  }, [currentTrackIndex, updateMediaSession]);

  // Initialize audio element once
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    audioRef.current = new Audio();
    audioRef.current.volume = volume;

    const audio = audioRef.current;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    const handleCanPlay = () => setIsLoading(false);
    const handleWaiting = () => setIsLoading(true);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    // Load saved preferences
    const savedLiked = localStorage.getItem("focus-music-liked");
    if (savedLiked) {
      try {
        setLikedTracks(new Set(JSON.parse(savedLiked)));
      } catch {}
    }
    
    const savedVolume = localStorage.getItem("focus-music-volume");
    if (savedVolume) {
      const vol = parseFloat(savedVolume);
      setVolumeState(vol);
      audio.volume = vol;
    }

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.pause();
      audio.src = "";
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle track ended
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0;
        audio.play().catch(console.error);
      } else {
        // Set flag to auto-play next track
        shouldAutoPlayRef.current = true;
        // Play next (with shuffle consideration)
        if (isShuffle) {
          let nextIndex;
          do {
            nextIndex = Math.floor(Math.random() * tracks.length);
          } while (nextIndex === currentTrackIndex && tracks.length > 1);
          setCurrentTrackIndex(nextIndex);
        } else {
          setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
        }
      }
    };

    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [isRepeat, isShuffle, currentTrackIndex]);

  // Load track when index changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    const shouldAutoPlay = shouldAutoPlayRef.current || isPlaying;
    audio.src = currentTrack.file;
    audio.load();
    setCurrentTime(0);
    setIsLoading(true);

    if (shouldAutoPlay) {
      audio.play().catch(console.error);
      shouldAutoPlayRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrackIndex]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Load track if not loaded
    if (!audio.src || audio.src === "") {
      audio.src = currentTrack.file;
      audio.load();
    }

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }
  }, [isPlaying, currentTrack]);

  const playNext = useCallback(() => {
    if (isShuffle) {
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * tracks.length);
      } while (nextIndex === currentTrackIndex && tracks.length > 1);
      setCurrentTrackIndex(nextIndex);
    } else {
      setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
    }
    // Auto-play when using next/prev
    setTimeout(() => {
      audioRef.current?.play().catch(console.error);
    }, 100);
  }, [isShuffle, currentTrackIndex]);

  const playPrevious = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
    } else {
      setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
      setTimeout(() => {
        audioRef.current?.play().catch(console.error);
      }, 100);
    }
  }, []);

  const playTrack = useCallback((index: number) => {
    setCurrentTrackIndex(index);
    setTimeout(() => {
      audioRef.current?.play().catch(console.error);
    }, 100);
  }, []);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    setIsMuted(vol === 0);
    localStorage.setItem("focus-music-volume", vol.toString());
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const toggleRepeat = useCallback(() => {
    setIsRepeat((prev) => !prev);
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev);
  }, []);

  const toggleLike = useCallback((trackId: string) => {
    setLikedTracks((prev) => {
      const newLiked = new Set(prev);
      if (newLiked.has(trackId)) {
        newLiked.delete(trackId);
      } else {
        newLiked.add(trackId);
      }
      localStorage.setItem("focus-music-liked", JSON.stringify([...newLiked]));
      return newLiked;
    });
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  return (
    <MusicContext.Provider
      value={{
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
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error("useMusic must be used within a MusicProvider");
  }
  return context;
}
