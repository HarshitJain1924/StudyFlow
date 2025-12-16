"use client";

import { useMemo, useState } from "react";
import { Plus, FileText, List, MoreHorizontal, Trash2, Copy, Pencil, ChevronDown, Sparkles, Target, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChecklists, Checklist } from "@/lib/checklist-store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ChecklistSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFromMarkdown: () => void;
  onOpenGoals?: () => void;
  isGoalsActive?: boolean;
}

const EMOJI_OPTIONS = ["📋", "📝", "✅", "🎯", "📚", "💼", "🏠", "🛒", "✨", "🔥", "💡", "🚀"];

export function ChecklistSidebar({ isOpen, onClose, onCreateFromMarkdown, onOpenGoals, isGoalsActive }: ChecklistSidebarProps) {
  const {
    checklists,
    activeChecklistId,
    setActiveChecklist,
    createChecklist,
    deleteChecklist,
    updateChecklist,
    duplicateChecklist,
  } = useChecklists();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("📋");
  const [editingChecklist, setEditingChecklist] = useState<Checklist | null>(null);
  const [todayExpanded, setTodayExpanded] = useState(true);
  const [previousExpanded, setPreviousExpanded] = useState(true);

  const todayString = useMemo(() => new Date().toDateString(), []);

  const todayChecklists = checklists.filter((c) => new Date(c.createdAt).toDateString() === todayString);
  const previousChecklists = checklists.filter((c) => new Date(c.createdAt).toDateString() !== todayString);

  const handleCreateQuick = () => {
    if (!newTitle.trim()) return;
    createChecklist(newTitle.trim(), "quick", selectedEmoji);
    setNewTitle("");
    setSelectedEmoji("📋");
    setIsCreateDialogOpen(false);
  };

  const handleRename = () => {
    if (!editingChecklist || !newTitle.trim()) return;
    updateChecklist(editingChecklist.id, { title: newTitle.trim(), emoji: selectedEmoji });
    setNewTitle("");
    setSelectedEmoji("📋");
    setIsRenameDialogOpen(false);
    setEditingChecklist(null);
  };

  const openRenameDialog = (checklist: Checklist) => {
    setEditingChecklist(checklist);
    setNewTitle(checklist.title);
    setSelectedEmoji(checklist.emoji || "📋");
    setIsRenameDialogOpen(true);
  };

  const renderChecklistItem = (checklist: Checklist) => {
    const isActive = checklist.id === activeChecklistId;
    const progress = checklist.totalItems > 0
      ? Math.round((checklist.totalCompleted / checklist.totalItems) * 100)
      : 0;

    return (
      <div
        className={cn(
          "group flex items-start gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all",
          isActive
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted"
        )}
        onClick={() => {
          setActiveChecklist(checklist.id);
          onClose();
        }}
      >
        <span className="text-sm shrink-0 mt-0.5">{checklist.emoji || (checklist.type === "markdown" ? "📄" : "📋")}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium leading-tight line-clamp-2">{checklist.title}</p>
          <p className={cn(
            "text-[10px] mt-0.5",
            isActive ? "text-primary-foreground/70" : "text-muted-foreground"
          )}>
            {checklist.totalCompleted}/{checklist.totalItems} • {progress}%
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-5 w-5 shrink-0",
                isActive 
                  ? "text-primary-foreground hover:bg-primary-foreground/20" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => openRenameDialog(checklist)}>
              <Pencil className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => duplicateChecklist(checklist.id)}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              const data = JSON.stringify(checklist, null, 2);
              navigator.clipboard.writeText(data);
            }}>
              <Download className="mr-2 h-4 w-4" />
              Export JSON
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => deleteChecklist(checklist.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <>
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 xl:w-80 bg-background border-r transform transition-transform duration-300 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="pt-20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">My Checklists</h2>
          </div>
          
          {/* Create buttons */}
          <div className="flex gap-2 pt-5">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <List className="mr-2 h-4 w-4" />
              Quick List
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onCreateFromMarkdown}
            >
              <FileText className="mr-2 h-4 w-4" />
              Markdown
            </Button>
          </div>
        </div>

        {/* Pinned Section - Goals */}
        {onOpenGoals && (
          <div className="px-5 pt-6 pb-4 border-b">
            <p className="text-xs font-medium text-muted-foreground mb-3">Pinned</p>
            <div
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all",
                isGoalsActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
              onClick={() => {
                onOpenGoals();
                onClose();
              }}
            >
              <Target className="h-5 w-5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Goals</p>
                <p className={cn(
                  "text-xs",
                  isGoalsActive ? "text-primary-foreground/70" : "text-muted-foreground"
                )}>
                  Track your study targets
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Checklists */}
        <ScrollArea className="flex-1 p-3">
          {checklists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground mb-2">No checklists yet</p>
              <p className="text-xs text-muted-foreground">
                Create a quick list or import from markdown
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Today's checklists */}
              {todayChecklists.length > 0 && (
                <Collapsible open={todayExpanded} onOpenChange={setTodayExpanded}>
                  <CollapsibleTrigger className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground w-full">
                    <ChevronDown className={cn("h-3 w-3 transition-transform", !todayExpanded && "-rotate-90")} />
                    Today
                    <span className="ml-auto">{todayChecklists.length}</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 mt-1">
                    {todayChecklists.map(checklist => (
                      <div key={checklist.id || `${checklist.title}-${checklist.createdAt}`}>
                        {renderChecklistItem(checklist)}
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Previous checklists */}
              {previousChecklists.length > 0 && (
                <Collapsible open={previousExpanded} onOpenChange={setPreviousExpanded}>
                  <CollapsibleTrigger className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground w-full">
                    <ChevronDown className={cn("h-3 w-3 transition-transform", !previousExpanded && "-rotate-90")} />
                    Previous
                    <span className="ml-auto">{previousChecklists.length}</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 mt-1">
                    {previousChecklists.map(checklist => (
                      <div key={checklist.id || `${checklist.title}-${checklist.createdAt}`}>
                        {renderChecklistItem(checklist)}
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30"
          onClick={onClose}
        />
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Checklist</DialogTitle>
            <DialogDescription>
              Create a quick checklist to track your tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="My Tasks"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateQuick()}
              />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={cn(
                      "w-10 h-10 text-xl rounded-lg border-2 transition-colors",
                      selectedEmoji === emoji
                        ? "border-primary bg-primary/10"
                        : "border-transparent hover:bg-muted"
                    )}
                    onClick={() => setSelectedEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateQuick} disabled={!newTitle.trim()}>
              <Plus className="mr-2 h-4 w-4" />
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Checklist</DialogTitle>
            <DialogDescription>
              Update the title and icon for this checklist.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rename-title">Title</Label>
              <Input
                id="rename-title"
                placeholder="My Tasks"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRename()}
              />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={cn(
                      "w-10 h-10 text-xl rounded-lg border-2 transition-colors",
                      selectedEmoji === emoji
                        ? "border-primary bg-primary/10"
                        : "border-transparent hover:bg-muted"
                    )}
                    onClick={() => setSelectedEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!newTitle.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
