"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { StickyNote, Plus, Trash2, Edit2, Save, X, Clock, Cloud, RefreshCw } from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  taskId?: string;
}

const NOTES_KEY = "markdown-todo-notes";
const NOTE_COLORS = [
  "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300",
  "bg-blue-100 dark:bg-blue-900/30 border-blue-300",
  "bg-green-100 dark:bg-green-900/30 border-green-300",
  "bg-pink-100 dark:bg-pink-900/30 border-pink-300",
  "bg-purple-100 dark:bg-purple-900/30 border-purple-300",
  "bg-orange-100 dark:bg-orange-900/30 border-orange-300",
];

export function StudyNotes() {
  const { user } = useUser();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load notes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(NOTES_KEY);
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load notes:", e);
      }
    }
  }, []);

  // Save notes to localStorage and sync to cloud
  useEffect(() => {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  }, [notes]);

  // Auto-sync to cloud when user is logged in
  const syncToCloud = useCallback(async () => {
    if (!user) return;
    
    setIsSyncing(true);
    try {
      await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: JSON.stringify(notes) }),
      });
    } catch (error) {
      console.error("Failed to sync notes:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [user, notes]);

  // Load notes from cloud on mount if user is logged in
  useEffect(() => {
    const loadFromCloud = async () => {
      if (!user) return;
      
      try {
        const res = await fetch("/api/notes");
        if (res.ok) {
          const data = await res.json();
          if (data.content) {
            try {
              const cloudNotes = JSON.parse(data.content);
              if (Array.isArray(cloudNotes) && cloudNotes.length > 0) {
                setNotes(cloudNotes);
                localStorage.setItem(NOTES_KEY, data.content);
              }
            } catch {
              // Content is not valid JSON, ignore
            }
          }
        }
      } catch (error) {
        console.error("Failed to load notes from cloud:", error);
      }
    };
    
    loadFromCloud();
  }, [user]);

  const handleSyncNow = async () => {
    if (!user) {
      toast.error("Sign in to sync notes to cloud");
      return;
    }
    await syncToCloud();
    toast.success("Notes synced to cloud!");
  };

  const addNote = () => {
    if (!newTitle.trim() && !newContent.trim()) return;

    const note: Note = {
      id: Math.random().toString(36).substring(2, 11),
      title: newTitle || "Untitled Note",
      content: newContent,
      color: selectedColor,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newNotes = [note, ...notes];
    setNotes(newNotes);
    resetForm();
    setIsDialogOpen(false);
    
    // Auto-sync to cloud
    if (user) {
      setTimeout(() => syncToCloud(), 500);
    }
  };

  const updateNote = () => {
    if (!editingNote) return;

    setNotes(
      notes.map((n) =>
        n.id === editingNote.id
          ? {
              ...n,
              title: newTitle || "Untitled Note",
              content: newContent,
              color: selectedColor,
              updatedAt: new Date().toISOString(),
            }
          : n
      )
    );
    resetForm();
    setIsDialogOpen(false);
    
    // Auto-sync to cloud
    if (user) {
      setTimeout(() => syncToCloud(), 500);
    }
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
    
    // Auto-sync to cloud
    if (user) {
      setTimeout(() => syncToCloud(), 500);
    }
  };

  const startEditing = (note: Note) => {
    setEditingNote(note);
    setNewTitle(note.title);
    setNewContent(note.content);
    setSelectedColor(note.color);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setNewTitle("");
    setNewContent("");
    setSelectedColor(NOTE_COLORS[0]);
    setEditingNote(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <StickyNote className="h-4 w-4" />
            Study Notes
            {user && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleSyncNow}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <Cloud className="h-3 w-3" />
                )}
              </Button>
            )}
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Note
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingNote ? "Edit Note" : "New Note"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input
                  placeholder="Note title..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
                <Textarea
                  placeholder="Write your note here..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="min-h-[150px]"
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium">Color</label>
                  <div className="flex gap-2">
                    {NOTE_COLORS.map((color) => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 ${color} ${
                          selectedColor === color
                            ? "ring-2 ring-primary ring-offset-2"
                            : ""
                        }`}
                        onClick={() => setSelectedColor(color)}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={editingNote ? updateNote : addNote}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingNote ? "Update" : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetForm();
                      setIsDialogOpen(false);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No notes yet. Add your first study note!
          </p>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-3 pr-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={`p-3 rounded-lg border ${note.color}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm">{note.title}</h4>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => startEditing(note)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => deleteNote(note.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {note.content && (
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                      {note.content}
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDate(note.updatedAt)}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
