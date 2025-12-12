"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, X, Clock, Flag, Calendar, Tag, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChecklists } from "@/lib/checklist-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, isToday, isTomorrow, addDays } from "date-fns";

const TAG_COLORS = [
  { name: "Work", color: "bg-blue-500" },
  { name: "Personal", color: "bg-green-500" },
  { name: "Study", color: "bg-purple-500" },
  { name: "Health", color: "bg-red-500" },
  { name: "Finance", color: "bg-yellow-500" },
  { name: "Home", color: "bg-orange-500" },
];

interface QuickTaskAdderProps {
  checklistId: string;
  sectionId: string;
  onClose?: () => void;
  autoFocus?: boolean;
}

export function QuickTaskAdder({ checklistId, sectionId, onClose, autoFocus = true }: QuickTaskAdderProps) {
  const { addTaskToChecklist } = useChecklists();
  const [taskText, setTaskText] = useState("");
  const [timeEstimate, setTimeEstimate] = useState<string>("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [recurring, setRecurring] = useState<"daily" | "weekly" | "monthly" | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = () => {
    if (!taskText.trim()) return;

    // Parse time estimate
    let parsedTime: number | undefined;
    if (timeEstimate) {
      const match = timeEstimate.match(/^(\d+)([hm]?)$/i);
      if (match) {
        const value = parseInt(match[1]);
        const unit = match[2]?.toLowerCase() || "m";
        parsedTime = unit === "h" ? value * 60 : value;
      }
    }

    addTaskToChecklist(checklistId, sectionId, {
      text: taskText.trim(),
      completed: false,
      level: 0,
      timeEstimate: parsedTime,
      priority,
      dueDate: dueDate?.toISOString(),
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      recurring,
    });

    setTaskText("");
    setTimeEstimate("");
    setPriority(undefined);
    setDueDate(undefined);
    setSelectedTags([]);
    setRecurring(null);
    setIsExpanded(false);
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const formatDueDate = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      if (onClose) {
        onClose();
      } else {
        setTaskText("");
        setIsExpanded(false);
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            placeholder="Add a task..."
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsExpanded(true)}
            className="pr-10"
          />
          {taskText && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setTaskText("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={!taskText.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Expanded options */}
      {isExpanded && (
        <div className="space-y-2 pl-1">
          {/* Row 1: Time, Priority, Due Date, Recurring */}
          <div className="flex items-center gap-2 flex-wrap">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8",
                    timeEstimate && "text-primary"
                  )}
                >
                  <Clock className="h-4 w-4 mr-1" />
                  {timeEstimate || "Time"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48" align="start">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Time Estimate</p>
                  <Input
                    placeholder="e.g., 30m, 2h"
                    value={timeEstimate}
                    onChange={(e) => setTimeEstimate(e.target.value)}
                    className="h-8"
                  />
                  <div className="flex flex-wrap gap-1">
                    {["15m", "30m", "1h", "2h"].map((time) => (
                      <Button
                        key={time}
                        variant="outline"
                        size="sm"
                        className="h-7"
                        onClick={() => setTimeEstimate(time)}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Select
              value={priority || "none"}
              onValueChange={(v) => setPriority(v === "none" ? undefined : v as "low" | "medium" | "high")}
            >
              <SelectTrigger className="w-[100px] h-8">
                <SelectValue>
                  <span className="flex items-center gap-1">
                    <Flag className={cn(
                      "h-3 w-3",
                      priority === "high" && "text-red-500",
                      priority === "medium" && "text-yellow-500",
                      priority === "low" && "text-blue-500"
                    )} />
                    {priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : "Priority"}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="low">
                  <span className="flex items-center gap-2">
                    <Flag className="h-3 w-3 text-blue-500" />
                    Low
                  </span>
                </SelectItem>
                <SelectItem value="medium">
                  <span className="flex items-center gap-2">
                    <Flag className="h-3 w-3 text-yellow-500" />
                    Medium
                  </span>
                </SelectItem>
                <SelectItem value="high">
                  <span className="flex items-center gap-2">
                    <Flag className="h-3 w-3 text-red-500" />
                    High
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Due Date */}
            <Popover open={showCalendar} onOpenChange={setShowCalendar}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8",
                    dueDate && "text-primary"
                  )}
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  {dueDate ? formatDueDate(dueDate) : "Due"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-2 border-b">
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setDueDate(new Date());
                        setShowCalendar(false);
                      }}
                    >
                      Today
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setDueDate(addDays(new Date(), 1));
                        setShowCalendar(false);
                      }}
                    >
                      Tomorrow
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setDueDate(addDays(new Date(), 7));
                        setShowCalendar(false);
                      }}
                    >
                      Next Week
                    </Button>
                  </div>
                </div>
                <CalendarComponent
                  mode="single"
                  selected={dueDate}
                  onSelect={(date) => {
                    setDueDate(date);
                    setShowCalendar(false);
                  }}
                  initialFocus
                />
                {dueDate && (
                  <div className="p-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-7 text-xs text-muted-foreground"
                      onClick={() => {
                        setDueDate(undefined);
                        setShowCalendar(false);
                      }}
                    >
                      Clear due date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* Recurring */}
            <Select
              value={recurring || "none"}
              onValueChange={(v) => setRecurring(v === "none" ? null : v as "daily" | "weekly" | "monthly")}
            >
              <SelectTrigger className="w-[100px] h-8">
                <SelectValue>
                  <span className="flex items-center gap-1">
                    <Repeat className={cn(
                      "h-3 w-3",
                      recurring && "text-primary"
                    )} />
                    {recurring ? recurring.charAt(0).toUpperCase() + recurring.slice(1) : "Repeat"}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No repeat</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Row 2: Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="h-4 w-4 text-muted-foreground" />
            {TAG_COLORS.map((tag) => (
              <Badge
                key={tag.name}
                variant={selectedTags.includes(tag.name) ? "default" : "outline"}
                className={cn(
                  "cursor-pointer text-xs",
                  selectedTags.includes(tag.name) && tag.color + " text-white border-transparent"
                )}
                onClick={() => toggleTag(tag.name)}
              >
                {tag.name}
              </Badge>
            ))}
          </div>

          {/* Cancel button */}
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => setIsExpanded(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
