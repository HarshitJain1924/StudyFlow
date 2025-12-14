"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { MarkdownInput } from "@/components/markdown-input";
import { TodoList } from "@/components/todo-list";
import { PomodoroTimer } from "@/components/pomodoro-timer";
import { StopwatchTimer } from "@/components/stopwatch-timer";
import { StatsOverview } from "@/components/stats-overview";
import { StudyNotes } from "@/components/study-notes";
import { SettingsPanel } from "@/components/settings-panel";
import { DailyQuote } from "@/components/daily-quote";
import { FocusSounds } from "@/components/focus-sounds";
import { GoalsPage } from "@/components/goals-page";
import { KeyboardShortcutsDialog } from "@/components/keyboard-shortcuts-dialog";
import { ChecklistSidebar } from "@/components/checklist-sidebar";
import { QuickTaskAdder } from "@/components/quick-task-adder";
import { UserProfile } from "@/components/user-profile";
import { Leaderboard } from "@/components/leaderboard";
import { YouTubeToChecklist } from "@/components/youtube-to-checklist";
import { MiniMusicPlayer } from "@/components/mini-music-player";
import { ParsedChecklist, parseMarkdownChecklist } from "@/lib/markdown-parser";
import { StudyProvider } from "@/lib/study-context";
import { ViewProvider, useViewSettings } from "@/lib/view-context";
import { ChecklistProvider, useChecklists } from "@/lib/checklist-store";
import { MusicProvider, useMusic } from "@/lib/music-context";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useServiceWorker, usePWAInstall } from "@/hooks/use-pwa";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckSquare,
  Moon,
  Sun,
  Github,
  Timer,
  BarChart3,
  StickyNote,
  Menu,
  BookOpen,
  Keyboard,
  Download,
  Maximize2,
  Minimize2,
  WifiOff,
  PanelLeft,
  FileText,
  List,
  Sparkles,
  Settings,
  Clock,
  Target,
  Trophy,
  User,
  LogIn,
  Wand2,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  Music2,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

function HomeContent() {
  const [showMarkdownInput, setShowMarkdownInput] = useState(false);
  const [markdownValue, setMarkdownValue] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showGoalsPage, setShowGoalsPage] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showYouTubeAI, setShowYouTubeAI] = useState(false);
  const [minimalUI, setMinimalUI] = useState(false);
  
  const { user } = useUser();
  const { settings: viewSettings, toggleCompactMode } = useViewSettings();
  const { isPlaying: isMusicPlaying } = useMusic();
  const { isUpdateAvailable, updateApp } = useServiceWorker();
  const { canInstall, install } = usePWAInstall();
  const {
    checklists,
    activeChecklist,
    activeChecklistId,
    setActiveChecklist,
    createFromMarkdown,
    updateChecklist,
    createChecklist,
    deleteChecklist,
    duplicateChecklist,
  } = useChecklists();

  // Load preferences on mount
  useEffect(() => {
    // Check for dark mode preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const savedTheme = localStorage.getItem("theme");
    const shouldBeDark = savedTheme === "dark" || (!savedTheme && prefersDark);
    setIsDark(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    }
    
    // Check online status
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    setIsLoaded(true);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Keyboard shortcuts (avoiding Chrome conflicts)
  const shortcuts = [
    {
      key: "/",
      description: "Show shortcuts",
      action: useCallback(() => setShowShortcuts(true), []),
    },
    {
      key: "m",
      alt: true,
      description: "Toggle compact mode",
      action: toggleCompactMode,
    },
    {
      key: "s",
      alt: true,
      description: "Toggle sidebar",
      action: useCallback(() => setSidebarOpen((prev) => !prev), []),
    },
    {
      key: "Escape",
      description: "Close dialogs",
      action: useCallback(() => {
        setShowShortcuts(false);
        setShowMarkdownInput(false);
        setSidebarOpen(false);
      }, []),
    },
  ];
  
  useKeyboardShortcuts(shortcuts);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem("theme", newDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newDark);
  };

  const handleParseMarkdown = () => {
    if (!markdownValue.trim()) return;
    const parsed = parseMarkdownChecklist(markdownValue);
    createFromMarkdown(markdownValue, parsed);
    setMarkdownValue("");
    setShowMarkdownInput(false);
  };

  const handleUpdateChecklist = (updated: ParsedChecklist) => {
    if (!activeChecklistId) return;
    updateChecklist(activeChecklistId, {
      sections: updated.sections,
      totalCompleted: updated.totalCompleted,
      totalItems: updated.totalItems,
    });
  };

  // Convert Checklist to ParsedChecklist for TodoList component
  const activeAsParsed: ParsedChecklist | null = activeChecklist
    ? {
        title: activeChecklist.title,
        emoji: activeChecklist.emoji,
        sections: activeChecklist.sections,
        totalCompleted: activeChecklist.totalCompleted,
        totalItems: activeChecklist.totalItems,
      }
    : null;

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6">
        <div className="text-center max-w-md px-6">
          <p className="text-sm italic text-amber-600 dark:text-amber-400">
            "The secret of getting ahead is getting started."
          </p>
          <p className="text-xs text-amber-500/70 mt-1">— Mark Twain</p>
        </div>
        <div className="animate-pulse flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <CheckSquare className="h-6 w-6" />
          <span className="font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-background via-background to-muted/20">
      {/* Checklist Sidebar */}
      <ChecklistSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onCreateFromMarkdown={() => {
          setSidebarOpen(false);
          setShowMarkdownInput(true);
        }}
        onOpenGoals={() => setShowGoalsPage(true)}
        isGoalsActive={showGoalsPage}
      />

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} />
        
      {/* Update Available Banner */}
      {isUpdateAvailable && (
        <div className="bg-primary text-primary-foreground text-center py-2 px-4 text-sm">
          A new version is available!{" "}
          <button onClick={updateApp} className="underline font-medium">
            Update now
          </button>
        </div>
      )}
        
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Sidebar Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="rounded-full"
              >
                <PanelLeft className="h-5 w-5" />
              </Button>

              <button
                onClick={() => {
                  setShowGoalsPage(false);
                  setShowMarkdownInput(false);
                  setActiveChecklist(null);
                }}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <h1 className="text-lg font-bold">StudyFlow</h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    Your personal study companion
                  </p>
                </div>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Online/Offline Status */}
              {!isOnline && (
                <Badge variant="secondary" className="gap-1">
                  <WifiOff className="h-3 w-3" />
                  Offline
                </Badge>
              )}
                
              {/* Compact Mode Toggle */}
              <div className="hidden sm:flex items-center gap-2">
                <Switch
                  id="compact-mode"
                  checked={viewSettings.compactMode}
                  onCheckedChange={toggleCompactMode}
                />
                <Label htmlFor="compact-mode" className="text-xs cursor-pointer">
                  {viewSettings.compactMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Label>
              </div>

              {/* Minimal UI Toggle */}
              <Button
                variant={minimalUI ? "default" : "ghost"}
                size="icon"
                onClick={() => setMinimalUI(!minimalUI)}
                className="rounded-full hidden sm:flex"
                title={minimalUI ? "Show full UI" : "Minimal UI"}
              >
                {minimalUI ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
                
              {/* Install PWA Button */}
              {canInstall && (
                <Button variant="outline" size="sm" onClick={install} className="hidden sm:flex">
                  <Download className="h-4 w-4 mr-2" />
                  Install App
                </Button>
              )}
                
              {/* Keyboard Shortcuts */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowShortcuts(true)}
                className="rounded-full hidden sm:flex"
                title="Keyboard shortcuts (?)"
              >
                <Keyboard className="h-5 w-5" />
              </Button>

              {/* AI YouTube Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowYouTubeAI(true)}
                className="rounded-full hidden sm:flex"
                title="Generate checklist from YouTube"
              >
                <Wand2 className="h-5 w-5 text-purple-500" />
              </Button>
                
              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 overflow-y-auto">
                  <div className="space-y-6 mt-6">
                    {/* Goals Quick Access */}
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2"
                      onClick={() => setShowGoalsPage(true)}
                    >
                      <Target className="h-4 w-4" />
                      Goals & Targets
                    </Button>
                    <PomodoroTimer />
                    <StopwatchTimer />
                    <FocusSounds />
                    <DailyQuote />
                    <StatsOverview />
                    <StudyNotes />
                    <SettingsPanel />
                  </div>
                </SheetContent>
              </Sheet>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full"
              >
                {isDark ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>

              {/* Leaderboard Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowLeaderboard(true)}
                className="rounded-full"
              >
                <Trophy className="h-5 w-5" />
              </Button>

              {/* User Auth */}
              <SignedIn>
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "h-9 w-9"
                    }
                  }}
                />
              </SignedIn>
              <SignedOut>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  asChild
                >
                  <a href="/sign-in">
                    <LogIn className="h-5 w-5" />
                  </a>
                </Button>
              </SignedOut>
            </div>
          </div>
        </div>
      </header>

      {/* Profile & Leaderboard Dialogs */}
      <UserProfile open={showProfile} onOpenChange={setShowProfile} />
      <Leaderboard open={showLeaderboard} onOpenChange={setShowLeaderboard} />
      <YouTubeToChecklist 
        open={showYouTubeAI} 
        onOpenChange={setShowYouTubeAI}
        onChecklistGenerated={(markdown) => {
          const parsed = parseMarkdownChecklist(markdown);
          createFromMarkdown(markdown, parsed);
          setShowYouTubeAI(false);
        }}
      />

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Main Todo Area */}
          <div className="flex-1 min-w-0">
            {showGoalsPage ? (
              <GoalsPage onBack={() => setShowGoalsPage(false)} />
            ) : showMarkdownInput ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <MarkdownInput
                  value={markdownValue}
                  onChange={setMarkdownValue}
                  onParse={handleParseMarkdown}
                />
                <Button
                  variant="ghost"
                  className="mt-2"
                  onClick={() => setShowMarkdownInput(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : activeChecklist ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                {/* Active Checklist Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{activeChecklist.emoji || "📋"}</span>
                    <h2 className="text-xl font-semibold">{activeChecklist.title}</h2>
                    <Badge variant="secondary" className="ml-2">
                      {activeChecklist.type === "markdown" ? "Markdown" : "Quick"}
                    </Badge>
                  </div>
                  
                  {/* Checklist Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {activeChecklist.type === "markdown" && (
                        <DropdownMenuItem onClick={() => {
                          setMarkdownValue(activeChecklist.markdown || "");
                          setShowMarkdownInput(true);
                        }}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Markdown
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => {
                        duplicateChecklist(activeChecklist.id);
                        toast.success("Checklist duplicated!");
                      }}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        const data = JSON.stringify(activeChecklist, null, 2);
                        navigator.clipboard.writeText(data);
                        toast.success("Copied to clipboard!");
                      }}>
                        <Download className="mr-2 h-4 w-4" />
                        Export JSON
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          deleteChecklist(activeChecklist.id);
                          toast.success("Checklist deleted");
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Quick Task Adder for Quick Lists */}
                {activeChecklist.type === "quick" && activeChecklist.sections.length > 0 && (
                  <Card>
                    <CardContent className="pt-4">
                      <QuickTaskAdder
                        checklistId={activeChecklist.id}
                        sectionId={activeChecklist.sections[0].id}
                        autoFocus={false}
                      />
                    </CardContent>
                  </Card>
                )}

                <TodoList
                  checklist={activeAsParsed!}
                  onEdit={
                    activeChecklist.type === "markdown"
                      ? () => {
                          setMarkdownValue(activeChecklist.markdown || "");
                          setShowMarkdownInput(true);
                        }
                      : undefined
                  }
                  onUpdate={handleUpdateChecklist}
                  compactMode={viewSettings.compactMode}
                  minimalUI={minimalUI}
                />
              </div>
            ) : (
              <div className="text-center py-12 pt-16">
                <div className="inline-flex p-4 rounded-full bg-muted mb-4">
                  <Sparkles className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Welcome to StudyFlow</h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Create a quick checklist or import from markdown to start tracking your progress
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-2">
                  <Button
                    onClick={() => createChecklist("My Tasks", "quick", "📋")}
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    <List className="h-4 w-4 mr-2" />
                    Create Quick List
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowMarkdownInput(true)}
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Import Markdown
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowYouTubeAI(true)}
                    size="lg"
                    className="w-full sm:w-auto bg-linear-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 hover:border-purple-500/50"
                  >
                    <Wand2 className="h-4 w-4 mr-2 text-purple-500" />
                    AI from YouTube
                  </Button>
                </div>

                {/* Quick Start Templates */}
                <div className="mt-8 pt-8 border-t">
                  <p className="text-sm text-muted-foreground mb-4">Or start with a template:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[
                      { emoji: "📚", title: "Study Plan" },
                      { emoji: "🏠", title: "Home Tasks" },
                      { emoji: "💼", title: "Work Projects" },
                      { emoji: "🛒", title: "Shopping List" },
                      { emoji: "🎯", title: "Goals" },
                    ].map((template) => (
                      <Button
                        key={template.title}
                        variant="outline"
                        size="sm"
                        onClick={() => createChecklist(template.title, "quick", template.emoji)}
                      >
                        {template.emoji} {template.title}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Desktop Only */}
          <aside className="hidden lg:block w-72 xl:w-80 shrink-0 space-y-4">
            <Tabs defaultValue="timer" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="timer" className="text-xs" title="Pomodoro">
                  <Timer className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="stopwatch" className="text-xs" title="Stopwatch">
                  <Clock className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="music" className="text-xs relative" title="Music">
                  <Music2 className="h-4 w-4" />
                  {isMusicPlaying && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-primary rounded-full animate-pulse" />
                  )}
                </TabsTrigger>
                <TabsTrigger value="stats" className="text-xs" title="Stats">
                  <BarChart3 className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="notes" className="text-xs" title="Notes">
                  <StickyNote className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-xs" title="Settings">
                  <Settings className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
              <TabsContent value="timer" className="mt-4 space-y-4">
                <PomodoroTimer minimalUI={minimalUI} />
                {!minimalUI && <MiniMusicPlayer />}
                {!minimalUI && <DailyQuote />}
              </TabsContent>
              <TabsContent value="stopwatch" className="mt-4 space-y-4">
                <StopwatchTimer minimalUI={minimalUI} />
                {!minimalUI && <MiniMusicPlayer />}
                {!minimalUI && <DailyQuote />}
              </TabsContent>
              <TabsContent value="music" className="mt-4 space-y-4">
                <FocusSounds minimalUI={minimalUI} />
              </TabsContent>
              <TabsContent value="stats" className="mt-4 space-y-4">
                <StatsOverview />
              </TabsContent>
              <TabsContent value="notes" className="mt-4">
                <StudyNotes />
              </TabsContent>
              <TabsContent value="settings" className="mt-4">
                <SettingsPanel />
              </TabsContent>
            </Tabs>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              📋 {checklists.length} checklists • ⏱️ Pomodoro timer • 📊 Track progress • 📝 Take notes
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="font-mono text-[10px]">Alt+S</Badge>
              <span>sidebar</span>
              <Badge variant="outline" className="font-mono text-[10px]">/</Badge>
              <span>shortcuts</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <StudyProvider>
      <ViewProvider>
        <ChecklistProvider>
          <MusicProvider>
            <HomeContent />
          </MusicProvider>
        </ChecklistProvider>
      </ViewProvider>
    </StudyProvider>
  );
}
