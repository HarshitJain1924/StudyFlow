"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts = [
  { keys: ["Alt", "S"], description: "Toggle checklist sidebar" },
  { keys: ["Alt", "M"], description: "Toggle compact view" },
  { keys: ["/"], description: "Show this help" },
  { keys: ["Esc"], description: "Close dialogs / cancel" },
];

const taskShortcuts = [
  { keys: ["Space"], description: "Toggle selected task (when focused)" },
  { keys: ["↑", "↓"], description: "Navigate between tasks" },
  { keys: ["Enter"], description: "Expand/collapse section" },
];

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">
              Global
            </h4>
            <div className="space-y-2">
              {shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-1"
                >
                  <span className="text-sm">{shortcut.description}</span>
                  <div className="flex gap-1">
                    {shortcut.keys.map((key, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="font-mono text-xs px-2"
                      >
                        {key}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">
              Task Navigation
            </h4>
            <div className="space-y-2">
              {taskShortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-1"
                >
                  <span className="text-sm">{shortcut.description}</span>
                  <div className="flex gap-1">
                    {shortcut.keys.map((key, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="font-mono text-xs px-2"
                      >
                        {key}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center pt-2">
            Press <Badge variant="outline" className="font-mono text-xs mx-1">?</Badge> anytime to show this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
