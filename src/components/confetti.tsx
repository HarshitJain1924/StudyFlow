"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";

interface ConfettiProps {
  trigger: boolean;
  onComplete?: () => void;
}

export function useConfetti() {
  const [shouldFire, setShouldFire] = useState(false);

  const fireConfetti = () => {
    setShouldFire(true);
    setTimeout(() => setShouldFire(false), 100);
  };

  return { shouldFire, fireConfetti };
}

export function Confetti({ trigger, onComplete }: ConfettiProps) {
  useEffect(() => {
    if (trigger) {
      const duration = 3000;
      const end = Date.now() + duration;

      const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        } else {
          onComplete?.();
        }
      };

      frame();
    }
  }, [trigger, onComplete]);

  return null;
}

export function fireTaskConfetti() {
  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.7 },
    colors: ["#22c55e", "#10b981", "#059669"],
  });
}

export function fireSectionConfetti() {
  const end = Date.now() + 1000;
  const colors = ["#ffd700", "#ffb347", "#ff6b6b", "#4ecdc4"];

  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}

export function fireAllCompleteConfetti() {
  const duration = 5000;
  const end = Date.now() + duration;
  const colors = ["#ffd700", "#ff6b6b", "#4ecdc4", "#a786ff", "#fd8bbc"];

  const frame = () => {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.5 },
      colors,
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.5 },
      colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  // Also fire some center bursts
  setTimeout(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors,
    });
  }, 500);

  setTimeout(() => {
    confetti({
      particleCount: 100,
      spread: 100,
      origin: { y: 0.6 },
      colors,
    });
  }, 1000);

  frame();
}
