import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Clock, SkipForward, Plus } from "lucide-react";

interface TaskCompleteDialogProps {
  open: boolean;
  taskText: string;
  goalEmoji?: string;
  plannedMinutes?: number;
  defaultDuration?: number;
  onCompleted: () => void;
  onNeedMoreTime: (additionalMinutes: number) => void;
  onSkip: () => void;
}

export function TaskCompleteDialog({
  open,
  taskText,
  goalEmoji,
  plannedMinutes,
  defaultDuration = 25,
  onCompleted,
  onNeedMoreTime,
  onSkip,
}: TaskCompleteDialogProps) {
  const [showTimeOptions, setShowTimeOptions] = useState(false);

  // Clean task text (remove time estimate for display)
  const cleanTaskText = taskText.replace(/\(~?\d+\s*(?:h(?:\s*\d+\s*m(?:in)?)?|m(?:in)?)\)/gi, '').trim();

  const handleCompleted = () => {
    setShowTimeOptions(false);
    onCompleted();
  };

  const handleNeedMoreTime = (mins: number) => {
    setShowTimeOptions(false);
    onNeedMoreTime(mins);
  };

  const handleSkip = () => {
    setShowTimeOptions(false);
    onSkip();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center">
          <div className="text-4xl mb-2">{goalEmoji || "⏰"}</div>
          <DialogTitle className="text-xl">Time&apos;s up!</DialogTitle>
          <DialogDescription className="text-base mt-2">
            Did you complete <span className="font-medium text-foreground">&ldquo;{cleanTaskText}&rdquo;</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-4">
          {!showTimeOptions ? (
            <>
              {/* Primary action: Completed */}
              <Button
                onClick={handleCompleted}
                className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
              >
                <Check className="h-5 w-5 mr-2" />
                Completed
              </Button>

              {/* Secondary: Need more time */}
              <Button
                variant="outline"
                onClick={() => setShowTimeOptions(true)}
                className="w-full h-11"
              >
                <Clock className="h-4 w-4 mr-2" />
                Need more time
              </Button>

              {/* Tertiary: Skip */}
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                <SkipForward className="h-4 w-4 mr-2" />
                Skip for now
              </Button>
            </>
          ) : (
            <>
              {/* Time options */}
              <p className="text-sm text-center text-muted-foreground mb-3">
                How much more time do you need?
              </p>
              
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleNeedMoreTime(10)}
                  className="h-12"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  10 min
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleNeedMoreTime(15)}
                  className="h-12"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  15 min
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleNeedMoreTime(plannedMinutes || defaultDuration)}
                  className="h-12"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Restart
                </Button>
              </div>

              <Button
                variant="ghost"
                onClick={() => setShowTimeOptions(false)}
                className="w-full mt-2 text-muted-foreground"
              >
                Back
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
