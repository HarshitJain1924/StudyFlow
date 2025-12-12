"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ViewSettings {
  compactMode: boolean;
  showTimeEstimates: boolean;
  showProgress: boolean;
  animationsEnabled: boolean;
}

interface ViewContextType {
  settings: ViewSettings;
  toggleCompactMode: () => void;
  toggleTimeEstimates: () => void;
  toggleProgress: () => void;
  toggleAnimations: () => void;
  updateSettings: (newSettings: Partial<ViewSettings>) => void;
}

const defaultSettings: ViewSettings = {
  compactMode: false,
  showTimeEstimates: true,
  showProgress: true,
  animationsEnabled: true,
};

const ViewContext = createContext<ViewContextType | undefined>(undefined);

const VIEW_SETTINGS_KEY = "markdown-todo-view-settings";

export function ViewProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ViewSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(VIEW_SETTINGS_KEY);
    if (saved) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      } catch (e) {
        console.error("Failed to load view settings:", e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(VIEW_SETTINGS_KEY, JSON.stringify(settings));
  }, [settings, isLoaded]);

  const toggleCompactMode = () => {
    setSettings((prev) => ({ ...prev, compactMode: !prev.compactMode }));
  };

  const toggleTimeEstimates = () => {
    setSettings((prev) => ({ ...prev, showTimeEstimates: !prev.showTimeEstimates }));
  };

  const toggleProgress = () => {
    setSettings((prev) => ({ ...prev, showProgress: !prev.showProgress }));
  };

  const toggleAnimations = () => {
    setSettings((prev) => ({ ...prev, animationsEnabled: !prev.animationsEnabled }));
  };

  const updateSettings = (newSettings: Partial<ViewSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  if (!isLoaded) return null;

  return (
    <ViewContext.Provider
      value={{
        settings,
        toggleCompactMode,
        toggleTimeEstimates,
        toggleProgress,
        toggleAnimations,
        updateSettings,
      }}
    >
      {children}
    </ViewContext.Provider>
  );
}

export function useViewSettings() {
  const context = useContext(ViewContext);
  if (context === undefined) {
    throw new Error("useViewSettings must be used within a ViewProvider");
  }
  return context;
}
