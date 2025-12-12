"use client";

import { useEffect, useCallback, useRef } from "react";

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  // Use ref to avoid recreating the callback when shortcuts change
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || 
                      target.tagName === "TEXTAREA" || 
                      target.isContentEditable;

      for (const shortcut of shortcutsRef.current) {
        // Handle special case for ? which is Shift+/ or just ?
        let keyMatch = false;
        if (shortcut.key === "?") {
          keyMatch = event.key === "?" || (event.key === "/" && event.shiftKey);
        } else {
          keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        }

        // For ctrl/meta, require it if specified, allow either if required
        const ctrlMatch = shortcut.ctrl 
          ? (event.ctrlKey || event.metaKey) 
          : (!event.ctrlKey && !event.metaKey);
        
        // For shift, special handling for ? key
        const shiftMatch = shortcut.key === "?" 
          ? true // ? naturally requires shift
          : (shortcut.shift ? event.shiftKey : !event.shiftKey);
        
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        // For shortcuts with modifiers, allow even in inputs
        const hasModifier = shortcut.ctrl || shortcut.alt;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          if (hasModifier || !isInput) {
            event.preventDefault();
            shortcut.action();
            return;
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}

// Predefined shortcuts for the app
export const SHORTCUTS = {
  FOCUS_SEARCH: { key: "k", ctrl: true, description: "Focus search" },
  NEW_CHECKLIST: { key: "n", ctrl: true, description: "New checklist" },
  TOGGLE_SIDEBAR: { key: "b", ctrl: true, description: "Toggle sidebar" },
  TOGGLE_TIMER: { key: " ", ctrl: true, description: "Start/pause timer" },
  TOGGLE_FOCUS_MODE: { key: "f", ctrl: true, shift: true, description: "Toggle focus mode" },
  EXPORT: { key: "e", ctrl: true, shift: true, description: "Export as markdown" },
  TOGGLE_COMPACT: { key: "d", ctrl: true, description: "Toggle compact view" },
  HELP: { key: "?", description: "Show shortcuts" },
} as const;
