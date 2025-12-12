"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TodoSection } from "@/lib/markdown-parser";
import { Search, Filter, X } from "lucide-react";

interface SearchFilterProps {
  sections: TodoSection[];
  onFilterChange: (filteredSections: TodoSection[], activeFilter: string) => void;
}

type FilterType = "all" | "completed" | "incomplete" | "in-progress";

export function SearchFilter({ sections, onFilterChange }: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [selectedSection, setSelectedSection] = useState<string>("all");

  const filterSections = useMemo(() => {
    let filtered = sections;

    // Filter by section
    if (selectedSection !== "all") {
      filtered = filtered.filter((s) => s.id === selectedSection);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.map((section) => {
        const filterItems = (items: typeof section.items): typeof section.items => {
          return items
            .map((item) => ({
              ...item,
              children: filterItems(item.children),
            }))
            .filter(
              (item) =>
                item.text.toLowerCase().includes(query) ||
                item.children.length > 0
            );
        };

        return {
          ...section,
          items: filterItems(section.items),
        };
      }).filter((s) => s.items.length > 0 || s.title.toLowerCase().includes(query));
    }

    // Filter by completion status
    if (filterType !== "all") {
      filtered = filtered.map((section) => {
        const filterItems = (items: typeof section.items): typeof section.items => {
          return items
            .map((item) => ({
              ...item,
              children: filterItems(item.children),
            }))
            .filter((item) => {
              if (filterType === "completed") return item.completed;
              if (filterType === "incomplete") return !item.completed;
              if (filterType === "in-progress") {
                // Has some completed children but not all
                if (item.children.length === 0) return false;
                const completedChildren = item.children.filter((c) => c.completed).length;
                return completedChildren > 0 && completedChildren < item.children.length;
              }
              return true;
            });
        };

        return {
          ...section,
          items: filterItems(section.items),
        };
      }).filter((s) => s.items.length > 0);
    }

    return filtered;
  }, [sections, searchQuery, filterType, selectedSection]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleFilterChange = (value: FilterType) => {
    setFilterType(value);
  };

  const handleSectionChange = (value: string) => {
    setSelectedSection(value);
  };

  const getActiveFilterLabel = useCallback(() => {
    const parts: string[] = [];
    if (searchQuery) parts.push(`"${searchQuery}"`);
    if (filterType !== "all") parts.push(filterType);
    if (selectedSection !== "all") {
      const section = sections.find((s) => s.id === selectedSection);
      if (section) parts.push(section.title);
    }
    return parts.join(" in ");
  }, [searchQuery, filterType, selectedSection, sections]);

  const clearFilters = () => {
    setSearchQuery("");
    setFilterType("all");
    setSelectedSection("all");
  };

  const hasActiveFilters = searchQuery || filterType !== "all" || selectedSection !== "all";

  // Update parent when filters change - using useEffect to avoid setState during render
  useEffect(() => {
    onFilterChange(filterSections, hasActiveFilters ? getActiveFilterLabel() : "");
  }, [filterSections, hasActiveFilters, getActiveFilterLabel, onFilterChange]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={filterType} onValueChange={(v) => handleFilterChange(v as FilterType)}>
          <SelectTrigger className="w-[140px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tasks</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="incomplete">Incomplete</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedSection} onValueChange={handleSectionChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sections</SelectItem>
            {sections.map((section) => (
              <SelectItem key={section.id} value={section.id}>
                {section.emoji} {section.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="icon" onClick={clearFilters}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtering:</span>
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Search: {searchQuery}
              <button onClick={() => setSearchQuery("")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filterType !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {filterType}
              <button onClick={() => setFilterType("all")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedSection !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {sections.find((s) => s.id === selectedSection)?.title}
              <button onClick={() => setSelectedSection("all")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <span className="text-sm text-muted-foreground ml-2">
            ({filterSections.reduce((acc, s) => acc + s.items.length, 0)} results)
          </span>
        </div>
      )}
    </div>
  );
}
