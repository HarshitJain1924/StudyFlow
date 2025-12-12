"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  ParsedChecklist,
  TodoSection as TodoSectionType,
  TodoItem,
  updateItemCompletion,
  toggleAllInSection,
  recalculateTotals,
} from "@/lib/markdown-parser";
import { TodoSection } from "./todo-section";
import { OverallProgress } from "./overall-progress";
import { SearchFilter } from "./search-filter";
import { useStudy } from "@/lib/study-context";
import { fireTaskConfetti, fireSectionConfetti, fireAllCompleteConfetti } from "./confetti";
import { Download, RotateCcw, Edit3, Focus, Expand } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TodoListProps {
  checklist: ParsedChecklist;
  onEdit?: () => void;
  onUpdate: (checklist: ParsedChecklist) => void;
  compactMode?: boolean;
}

export function TodoList({ checklist, onEdit, onUpdate, compactMode = false }: TodoListProps) {
  const [sections, setSections] = useState<TodoSectionType[]>(checklist.sections);
  const [filteredSections, setFilteredSections] = useState<TodoSectionType[]>(checklist.sections);
  const [totalCompleted, setTotalCompleted] = useState(checklist.totalCompleted);
  const [totalItems, setTotalItems] = useState(checklist.totalItems);
  const [focusMode, setFocusMode] = useState(false);
  const [focusedSectionId, setFocusedSectionId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("");
  const { addCompletedTask, removeCompletedTask } = useStudy();
  const prevCompletedRef = useRef(checklist.totalCompleted);

  useEffect(() => {
    setSections(checklist.sections);
    setFilteredSections(checklist.sections);
    setTotalCompleted(checklist.totalCompleted);
    setTotalItems(checklist.totalItems);
    prevCompletedRef.current = checklist.totalCompleted;
  }, [checklist]);

  const handleToggleItem = (sectionId: string, itemId: string, completed: boolean) => {
    const updatedSections = updateItemCompletion(sections, sectionId, itemId, completed);
    const totals = recalculateTotals(updatedSections);
    
    setSections(updatedSections);
    setFilteredSections(updatedSections);
    setTotalCompleted(totals.totalCompleted);
    setTotalItems(totals.totalItems);
    
    // Track completion in stats
    if (completed) {
      addCompletedTask();
      fireTaskConfetti();
    } else {
      removeCompletedTask();
    }

    // Check for section completion
    const section = updatedSections.find(s => s.id === sectionId);
    if (section && section.completedCount === section.totalCount && completed) {
      fireSectionConfetti();
    }

    // Check for all complete
    if (totals.totalCompleted === totals.totalItems && completed) {
      fireAllCompleteConfetti();
    }
    
    onUpdate({
      ...checklist,
      sections: updatedSections,
      totalCompleted: totals.totalCompleted,
      totalItems: totals.totalItems,
    });
  };

  const handleToggleAll = (sectionId: string, completed: boolean) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const taskDelta = completed 
      ? section.totalCount - section.completedCount 
      : -section.completedCount;

    const updatedSections = toggleAllInSection(sections, sectionId, completed);
    const totals = recalculateTotals(updatedSections);
    
    setSections(updatedSections);
    setFilteredSections(updatedSections);
    setTotalCompleted(totals.totalCompleted);
    setTotalItems(totals.totalItems);

    // Update stats
    if (taskDelta > 0) {
      for (let i = 0; i < taskDelta; i++) addCompletedTask();
      fireSectionConfetti();
    } else if (taskDelta < 0) {
      for (let i = 0; i < Math.abs(taskDelta); i++) removeCompletedTask();
    }

    // Check for all complete
    if (totals.totalCompleted === totals.totalItems && completed) {
      fireAllCompleteConfetti();
    }
    
    onUpdate({
      ...checklist,
      sections: updatedSections,
      totalCompleted: totals.totalCompleted,
      totalItems: totals.totalItems,
    });
  };

  // Helper to update item text recursively
  const updateItemTextInItems = (items: TodoItem[], itemId: string, newText: string): TodoItem[] => {
    return items.map(item => {
      if (item.id === itemId) {
        return { ...item, text: newText };
      }
      if (item.children.length > 0) {
        return { ...item, children: updateItemTextInItems(item.children, itemId, newText) };
      }
      return item;
    });
  };

  // Helper to delete item recursively
  const deleteItemFromItems = (items: TodoItem[], itemId: string): { items: TodoItem[], deleted: TodoItem | null } => {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === itemId) {
        const deleted = items[i];
        return { items: [...items.slice(0, i), ...items.slice(i + 1)], deleted };
      }
      if (items[i].children.length > 0) {
        const result = deleteItemFromItems(items[i].children, itemId);
        if (result.deleted) {
          return { 
            items: items.map((item, idx) => idx === i ? { ...item, children: result.items } : item),
            deleted: result.deleted
          };
        }
      }
    }
    return { items, deleted: null };
  };

  const handleEditItem = (sectionId: string, itemId: string, newText: string) => {
    const updatedSections = sections.map(section => {
      if (section.id === sectionId) {
        return { ...section, items: updateItemTextInItems(section.items, itemId, newText) };
      }
      return section;
    });
    
    setSections(updatedSections);
    setFilteredSections(updatedSections);
    toast.success("Task updated");
    
    onUpdate({
      ...checklist,
      sections: updatedSections,
    });
  };

  const handleDeleteItem = (sectionId: string, itemId: string) => {
    let deletedItem: TodoItem | null = null;
    
    const updatedSections = sections.map(section => {
      if (section.id === sectionId) {
        const result = deleteItemFromItems(section.items, itemId);
        if (result.deleted) {
          deletedItem = result.deleted;
        }
        return { ...section, items: result.items };
      }
      return section;
    });
    
    const totals = recalculateTotals(updatedSections);
    
    // Update stats if deleted item was completed
    if (deletedItem && (deletedItem as TodoItem).completed) {
      removeCompletedTask();
    }
    
    setSections(updatedSections);
    setFilteredSections(updatedSections);
    setTotalCompleted(totals.totalCompleted);
    setTotalItems(totals.totalItems);
    toast.success("Task deleted");
    
    onUpdate({
      ...checklist,
      sections: updatedSections,
      totalCompleted: totals.totalCompleted,
      totalItems: totals.totalItems,
    });
  };

  const handleResetAll = () => {
    const resetSections = sections.map(section => toggleAllInSection([section], section.id, false)[0]);
    const totals = recalculateTotals(resetSections);
    
    // Remove all completed tasks from stats
    for (let i = 0; i < totalCompleted; i++) removeCompletedTask();
    
    setSections(resetSections);
    setFilteredSections(resetSections);
    setTotalCompleted(totals.totalCompleted);
    setTotalItems(totals.totalItems);
    
    onUpdate({
      ...checklist,
      sections: resetSections,
      totalCompleted: totals.totalCompleted,
      totalItems: totals.totalItems,
    });
  };

  const handleFilterChange = (filtered: TodoSectionType[], filter: string) => {
    setFilteredSections(filtered);
    setActiveFilter(filter);
  };

  const exportAsMarkdown = () => {
    const generateMarkdown = (items: typeof sections[0]["items"], indent = ""): string => {
      return items.map(item => {
        const checkbox = item.completed ? "[x]" : "[ ]";
        const line = `${indent}- ${checkbox} ${item.text}\n`;
        const children = item.children.length > 0 
          ? generateMarkdown(item.children, indent + "    ")
          : "";
        return line + children;
      }).join("");
    };

    let markdown = `# ${checklist.emoji || ""} ${checklist.title}\n\n`;
    
    sections.forEach(section => {
      markdown += `## ${section.emoji || ""} ${section.title}\n`;
      if (section.description) {
        markdown += `*${section.description}*\n\n`;
      }
      markdown += generateMarkdown(section.items);
      markdown += "\n---\n\n";
    });

    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${checklist.title.replace(/[^a-z0-9]/gi, "_")}_checklist.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const displaySections = focusMode && focusedSectionId 
    ? filteredSections.filter(s => s.id === focusedSectionId)
    : filteredSections;

  return (
    <div className="space-y-6">
      <OverallProgress
        title={checklist.title}
        emoji={checklist.emoji}
        completed={totalCompleted}
        total={totalItems}
      />
      
      <div className="flex gap-2 flex-wrap items-center">
        {onEdit && (
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit3 className="h-4 w-4 mr-2" />
            Edit Markdown
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={handleResetAll}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset All
        </Button>
        <Button variant="outline" size="sm" onClick={exportAsMarkdown}>
          <Download className="h-4 w-4 mr-2" />
          Export Progress
        </Button>
        
        <div className="flex items-center gap-2 ml-auto">
          <Switch
            id="focus-mode"
            checked={focusMode}
            onCheckedChange={(checked) => {
              setFocusMode(checked);
              if (!checked) setFocusedSectionId(null);
            }}
          />
          <Label htmlFor="focus-mode" className="text-sm flex items-center gap-1 cursor-pointer">
            <Focus className="h-4 w-4" />
            Focus Mode
          </Label>
        </div>
      </div>

      <SearchFilter sections={sections} onFilterChange={handleFilterChange} />
      
      <Separator />

      {focusMode && !focusedSectionId && (
        <div className="text-center py-4 text-muted-foreground">
          <p className="mb-2">Select a section to focus on:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {sections.map((section) => (
              <Button
                key={section.id}
                variant="outline"
                size="sm"
                onClick={() => setFocusedSectionId(section.id)}
              >
                {section.emoji} {section.title}
              </Button>
            ))}
          </div>
        </div>
      )}

      {focusMode && focusedSectionId && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setFocusedSectionId(null)}
          className="mb-2"
        >
          <Expand className="h-4 w-4 mr-2" />
          Show All Sections
        </Button>
      )}
      
      <ScrollArea className="max-h-[calc(100vh-520px)]">
        <div className={cn("space-y-4 pr-4", compactMode && "space-y-2")}>
          {displaySections.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {activeFilter ? "No tasks match your filter." : "No sections to display."}
            </p>
          ) : (
            displaySections.map((section) => (
              <TodoSection
                key={section.id}
                section={section}
                onToggleItem={handleToggleItem}
                onToggleAll={handleToggleAll}
                onEditItem={handleEditItem}
                onDeleteItem={handleDeleteItem}
                compact={compactMode}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
