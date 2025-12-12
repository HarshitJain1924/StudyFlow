"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TodoSection as TodoSectionType } from "@/lib/markdown-parser";
import { TodoItem } from "./todo-item";
import { cn } from "@/lib/utils";
import { ChevronDown, CheckCircle2, Circle, RotateCcw, Clock } from "lucide-react";
import { useState } from "react";

interface TodoSectionProps {
  section: TodoSectionType;
  onToggleItem: (sectionId: string, itemId: string, completed: boolean) => void;
  onToggleAll: (sectionId: string, completed: boolean) => void;
  onEditItem?: (sectionId: string, itemId: string, newText: string) => void;
  onDeleteItem?: (sectionId: string, itemId: string) => void;
  compact?: boolean;
}

export function TodoSection({ section, onToggleItem, onToggleAll, onEditItem, onDeleteItem, compact = false }: TodoSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  
  const progress = section.totalCount > 0 
    ? Math.round((section.completedCount / section.totalCount) * 100) 
    : 0;
  
  const isComplete = section.completedCount === section.totalCount && section.totalCount > 0;
  
  const handleToggleItem = (itemId: string, completed: boolean) => {
    onToggleItem(section.id, itemId, completed);
  };

  const handleEditItem = (itemId: string, newText: string) => {
    onEditItem?.(section.id, itemId, newText);
  };

  const handleDeleteItem = (itemId: string) => {
    onDeleteItem?.(section.id, itemId);
  };

  const formatTime = (minutes: number) => {
    if (minutes >= 60) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    return `${minutes}m`;
  };

  return (
    <Card className={cn(
      "transition-all duration-300",
      isComplete && "border-green-500/50 bg-green-50/30 dark:bg-green-950/10"
    )}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className={cn("pb-3", compact && "py-2")}>
          <div className="flex items-start justify-between gap-4">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity">
                <ChevronDown className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform",
                  !isOpen && "-rotate-90"
                )} />
                <div className="space-y-1">
                  <CardTitle className={cn("flex items-center gap-2", compact ? "text-base" : "text-lg")}>
                    {section.emoji && <span className={compact ? "text-lg" : "text-xl"}>{section.emoji}</span>}
                    {section.title}
                    {isComplete && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                  </CardTitle>
                  {section.description && !compact && (
                    <p className="text-sm text-muted-foreground italic">
                      {section.description}
                    </p>
                  )}
                </div>
              </button>
            </CollapsibleTrigger>
            
            <div className="flex items-center gap-2">
              {/* Time estimate badge */}
              {section.totalTimeEstimate && !compact && (
                <Badge variant="outline" className="font-mono text-xs gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(section.totalTimeEstimate)}
                </Badge>
              )}
              
              <Badge variant={isComplete ? "default" : "secondary"} className="font-mono">
                {section.completedCount}/{section.totalCount}
              </Badge>
              
              {isComplete ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleAll(section.id, false)}
                  className="h-8 px-2"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleAll(section.id, true)}
                  className="h-8 px-2"
                >
                  <Circle className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          <div className="mt-3 space-y-1">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">
              {progress}% complete
            </p>
          </div>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className={cn("pt-0", compact && "pb-2")}>
            <div className="space-y-1">
              {section.items.map((item) => (
                <TodoItem
                  key={item.id}
                  item={item}
                  onToggle={handleToggleItem}
                  onEdit={onEditItem ? handleEditItem : undefined}
                  onDelete={onDeleteItem ? handleDeleteItem : undefined}
                  compact={compact}
                />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
