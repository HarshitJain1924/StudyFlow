"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TodoItem as TodoItemType } from "@/lib/markdown-parser";
import { cn } from "@/lib/utils";
import { ChevronRight, Clock, AlertTriangle, Calendar, Repeat, Tag, MoreHorizontal, Pencil, Trash2, X, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";

const TAG_COLORS: Record<string, string> = {
  Work: "bg-blue-500",
  Personal: "bg-green-500",
  Study: "bg-purple-500",
  Health: "bg-red-500",
  Finance: "bg-yellow-500",
  Home: "bg-orange-500",
};

interface TodoItemProps {
  item: TodoItemType;
  onToggle: (itemId: string, completed: boolean) => void;
  onEdit?: (itemId: string, newText: string) => void;
  onDelete?: (itemId: string) => void;
  depth?: number;
  compact?: boolean;
}

export function TodoItem({ item, onToggle, onEdit, onDelete, depth = 0, compact = false }: TodoItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasChildren = item.children.length > 0;
  
  const completedChildrenCount = item.children.filter(c => c.completed).length;
  const childProgress = hasChildren 
    ? `${completedChildrenCount}/${item.children.length}` 
    : null;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSaveEdit = () => {
    if (editText.trim() && onEdit) {
      onEdit(item.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(item.text);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200';
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes >= 60) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return m > 0 ? `${h}h${m}m` : `${h}h`;
    }
    return `${minutes}m`;
  };

  const formatDueDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d");
  };

  const isDueDateOverdue = (dateStr: string) => {
    const date = parseISO(dateStr);
    return isPast(date) && !isToday(date);
  };

  return (
    <div className={cn("space-y-1", depth > 0 && "ml-6 border-l-2 border-muted pl-4")}>
      <div
        className={cn(
          "group flex items-center gap-3 rounded-lg transition-all",
          compact ? "px-2 py-1" : "px-3 py-2",
          "hover:bg-muted/50",
          item.completed && "opacity-60"
        )}
      >
        {hasChildren && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 hover:bg-muted rounded transition-transform"
          >
            <ChevronRight
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                isExpanded && "rotate-90"
              )}
            />
          </button>
        )}
        
        <Checkbox
          id={item.id}
          checked={item.completed}
          onCheckedChange={(checked) => onToggle(item.id, checked as boolean)}
          className={cn(compact ? "h-4 w-4" : "h-5 w-5")}
        />
        
        {isEditing ? (
          <div className="flex-1 flex items-center gap-2">
            <Input
              ref={inputRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-7 text-sm"
            />
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveEdit}>
              <Check className="h-4 w-4 text-green-500" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancelEdit}>
              <X className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ) : (
          <label
            htmlFor={item.id}
            className={cn(
              "flex-1 cursor-pointer font-medium leading-relaxed",
              compact ? "text-xs" : "text-sm",
              item.completed && "line-through text-muted-foreground"
            )}
          >
            {item.text}
          </label>
        )}
        
        {/* Time Estimate Badge */}
        {item.timeEstimate && !compact && (
          <Badge variant="secondary" className="text-[10px] gap-1 py-0">
            <Clock className="h-3 w-3" />
            {formatTime(item.timeEstimate)}
          </Badge>
        )}
        
        {/* Priority Badge */}
        {item.priority && !compact && (
          <Badge 
            variant="outline" 
            className={cn("text-[10px] gap-1 py-0", getPriorityColor(item.priority))}
          >
            <AlertTriangle className="h-3 w-3" />
            {item.priority}
          </Badge>
        )}

        {/* Due Date Badge */}
        {item.dueDate && !compact && (
          <Badge 
            variant="outline" 
            className={cn(
              "text-[10px] gap-1 py-0",
              isDueDateOverdue(item.dueDate) && !item.completed
                ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200"
                : isToday(parseISO(item.dueDate))
                ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200"
                : ""
            )}
          >
            <Calendar className="h-3 w-3" />
            {formatDueDate(item.dueDate)}
          </Badge>
        )}

        {/* Recurring Badge */}
        {item.recurring && !compact && (
          <Badge variant="secondary" className="text-[10px] gap-1 py-0">
            <Repeat className="h-3 w-3" />
            {item.recurring}
          </Badge>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && !compact && (
          <div className="flex gap-1">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className={cn(
                  "w-2 h-2 rounded-full",
                  TAG_COLORS[tag] || "bg-gray-500"
                )}
                title={tag}
              />
            ))}
          </div>
        )}
        
        {childProgress && (
          <span className={cn(
            "text-muted-foreground bg-muted px-2 py-0.5 rounded-full",
            compact ? "text-[10px]" : "text-xs"
          )}>
            {childProgress}
          </span>
        )}

        {/* Edit/Delete Menu */}
        {(onEdit || onDelete) && !isEditing && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={() => onDelete(item.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      {hasChildren && isExpanded && (
        <div className="space-y-1">
          {item.children.map((child) => (
            <TodoItem
              key={child.id}
              item={child}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              depth={depth + 1}
              compact={compact}
            />
          ))}
        </div>
      )}
    </div>
  );
}
