"use client";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Upload, Sparkles } from "lucide-react";
import { useRef } from "react";

interface MarkdownInputProps {
  value: string;
  onChange: (value: string) => void;
  onParse: () => void;
}

const sampleMarkdown = `# 📜 My Learning Checklist

## Part 1: Getting Started
*Foundation concepts*

- [ ] **1. Introduction** (~15m)
    - [ ] Read the documentation (~10m)
    - [ ] Set up development environment (~5m)
- [ ] **2. Basic Concepts** (~45m) !!
    - [ ] Understand core principles (~20m)
    - [ ] Practice with examples (~25m)

## Part 2: Advanced Topics
*Deep dive into complex concepts*

- [ ] **1. Advanced Patterns** (~1h30m) !!!
    - [ ] Learn design patterns (~45m)
    - [ ] Implement real-world examples (~45m)
- [ ] **✅ Practice Projects** (~2h)
    - [ ] Build a sample project (~1h30m)
    - [ ] Review and refactor (~30m)`;

export function MarkdownInput({ value, onChange, onParse }: MarkdownInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        onChange(content);
      };
      reader.readAsText(file);
    }
  };

  const loadSample = () => {
    onChange(sampleMarkdown);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Markdown Input
        </CardTitle>
        <CardDescription>
          Paste your markdown checklist or upload a .md file
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload .md
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button variant="outline" size="sm" onClick={loadSample}>
            <Sparkles className="h-4 w-4 mr-2" />
            Load Sample
          </Button>
        </div>
        
        <Textarea
          placeholder={`Paste your markdown checklist here...

Example:
# 📜 My Checklist

## Section 1
- [ ] Task 1
    - [ ] Subtask 1.1
    - [ ] Subtask 1.2
- [ ] Task 2`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[400px] font-mono text-sm resize-none"
        />
        
        <Button onClick={onParse} className="w-full" size="lg">
          <Sparkles className="h-4 w-4 mr-2" />
          Generate Todo List
        </Button>
      </CardContent>
    </Card>
  );
}
