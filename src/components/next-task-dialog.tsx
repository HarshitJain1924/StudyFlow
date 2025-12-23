"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

interface NextTaskDialogProps {
  open: boolean;
  nextTaskText: string;
  nextGoalEmoji?: string;
  nextGoalTitle?: string;
  nextTaskMinutes?: number;
  onStartNext: () => void;
  onDismiss: () => void;
}

export function NextTaskDialog({
  open,
  nextTaskText,
  nextGoalEmoji = "🎯",
  nextGoalTitle,
  nextTaskMinutes,
  onStartNext,
  onDismiss,
}: NextTaskDialogProps) {
  // Clean task text for display
  const cleanNextText = nextTaskText.replace(/\(~?\d+\s*(?:h(?:\s*\d+\s*m(?:in)?)?|m(?:in)?)\)/gi, '').trim();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onDismiss()}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center">
          <div className="text-4xl mb-2">🎉</div>
          <DialogTitle className="text-xl">Great work!</DialogTitle>
          <DialogDescription className="text-base mt-2">
            Ready for the next task?
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-4 my-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{nextGoalEmoji}</span>
            <div className="flex-1 min-w-0">
              {nextGoalTitle && (
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">
                  {nextGoalTitle}
                </p>
              )}
              <p className="font-medium truncate">{cleanNextText}</p>
              {nextTaskMinutes && (
                <p className="text-sm text-muted-foreground mt-1">
                  ~{nextTaskMinutes} min
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onDismiss} className="flex-1">
            Not now
          </Button>
          <Button 
            onClick={onStartNext} 
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Play className="h-4 w-4 mr-2" /> 
            Start Next
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
