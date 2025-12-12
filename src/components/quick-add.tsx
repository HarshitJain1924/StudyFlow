"use client";

import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, AlertTriangle, X } from "lucide-react";
import { TodoSection } from "@/lib/markdown-parser";
import { cn } from "@/lib/utils";

interface QuickAddProps {
  sections: TodoSection[];
  onAddTask: (sectionId: string, taskText: string, timeEstimate?: number, priority?: 'low' | 'medium' | 'high') => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export function QuickAdd({ sections, onAddTask, inputRef }: QuickAddProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedSection, setSelectedSection] = useState<string | null>(
    sections.length > 0 ? sections[0].id : null
  );
  const localInputRef = useRef<HTMLInputElement>(null);
  const actualInputRef = inputRef || localInputRef;

  // Parse input for time estimate and priority
  const parseInput = (input: string) => {
    let text = input;
    let timeEstimate: number | undefined;
    let priority: 'low' | 'medium' | 'high' | undefined;

    // Parse time: (~25m), (~1h), etc.
    const timeMatch = text.match(/\(~(\d+)(h|m)(?:(\d+)m)?\)/i);
    if (timeMatch) {
      if (timeMatch[2] === 'h') {
        timeEstimate = parseInt(timeMatch[1]) * 60;
        if (timeMatch[3]) timeEstimate += parseInt(timeMatch[3]);
      } else {
        timeEstimate = parseInt(timeMatch[1]);
      }
      text = text.replace(timeMatch[0], '').trim();
    }

    // Parse priority: !!!, !!, !
    if (text.includes('!!!')) {
      priority = 'high';
      text = text.replace(/!!!/g, '').trim();
    } else if (text.includes('!!')) {
      priority = 'medium';
      text = text.replace(/!!/g, '').trim();
    } else if (text.match(/(?<![!])!(?![!])/)) {
      priority = 'low';
      text = text.replace(/(?<![!])!(?![!])/g, '').trim();
    }

    return { text, timeEstimate, priority };
  };

  const handleSubmit = () => {
    if (!inputValue.trim() || !selectedSection) return;

    const { text, timeEstimate, priority } = parseInput(inputValue);
    onAddTask(selectedSection, text, timeEstimate, priority);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      setInputValue("");
      (actualInputRef as React.RefObject<HTMLInputElement>).current?.blur();
    }
  };

  const { text, timeEstimate, priority } = parseInput(inputValue);
  const selectedSectionData = sections.find((s) => s.id === selectedSection);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-[140px] justify-start text-left font-normal"
            >
              {selectedSectionData ? (
                <span className="truncate">
                  {selectedSectionData.emoji} {selectedSectionData.title}
                </span>
              ) : (
                <span className="text-muted-foreground">Select section</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search section..." />
              <CommandList>
                <CommandEmpty>No section found.</CommandEmpty>
                <CommandGroup>
                  {sections.map((section) => (
                    <CommandItem
                      key={section.id}
                      value={section.title}
                      onSelect={() => {
                        setSelectedSection(section.id);
                        setOpen(false);
                      }}
                    >
                      <span className="mr-2">{section.emoji}</span>
                      <span className="truncate">{section.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <div className="relative flex-1">
          <Input
            ref={actualInputRef as React.RefObject<HTMLInputElement>}
            placeholder="Add task... (e.g., Learn React (~30m) !!)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pr-20"
          />
          {inputValue && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => setInputValue("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
            onClick={handleSubmit}
            disabled={!inputValue.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Preview of parsed input */}
      {inputValue && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Task: {text || "..."}</span>
          {timeEstimate && (
            <Badge variant="secondary" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {timeEstimate}m
            </Badge>
          )}
          {priority && (
            <Badge
              variant="secondary"
              className={cn(
                "text-xs",
                priority === "high" && "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
                priority === "medium" && "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
                priority === "low" && "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              )}
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              {priority}
            </Badge>
          )}
        </div>
      )}

      {/* Hint */}
      <p className="text-xs text-muted-foreground">
        Tip: Add time with <code className="bg-muted px-1 rounded">(~25m)</code> and priority with <code className="bg-muted px-1 rounded">!</code> <code className="bg-muted px-1 rounded">!!</code> <code className="bg-muted px-1 rounded">!!!</code>
      </p>
    </div>
  );
}
