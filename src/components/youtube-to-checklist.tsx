"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Youtube, 
  Sparkles, 
  Key, 
  Loader2, 
  Copy, 
  Check,
  ExternalLink,
  AlertCircle,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

type AIProvider = "gemini" | "groq" | "openrouter";

const PROVIDER_INFO: Record<AIProvider, { name: string; keyUrl: string; keyPrefix: string; description: string }> = {
  gemini: {
    name: "Google Gemini",
    keyUrl: "https://aistudio.google.com/app/apikey",
    keyPrefix: "AIza",
    description: "Free but strict rate limits (2-15 req/min)",
  },
  groq: {
    name: "Groq (Recommended)",
    keyUrl: "https://console.groq.com/keys",
    keyPrefix: "gsk_",
    description: "Very fast! 30 req/min free tier",
  },
  openrouter: {
    name: "OpenRouter",
    keyUrl: "https://openrouter.ai/keys",
    keyPrefix: "sk-or-",
    description: "Many free models, generous limits",
  },
};

const API_KEY_STORAGE_PREFIX = "ai-api-key-";

interface YouTubeToChecklistProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChecklistGenerated: (markdown: string) => void;
}

export function YouTubeToChecklist({ open, onOpenChange, onChecklistGenerated }: YouTubeToChecklistProps) {
  const [provider, setProvider] = useState<AIProvider>("groq");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [videoUrls, setVideoUrls] = useState<string[]>([""]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMarkdown, setGeneratedMarkdown] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  // Load saved API key for current provider
  useEffect(() => {
    const savedKey = localStorage.getItem(`${API_KEY_STORAGE_PREFIX}${provider}`);
    if (savedKey) {
      setApiKey(savedKey);
      setHasStoredKey(true);
    } else {
      setApiKey("");
      setHasStoredKey(false);
    }
  }, [provider]);

  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem(`${API_KEY_STORAGE_PREFIX}${provider}`, apiKey.trim());
      setHasStoredKey(true);
      toast.success(`${PROVIDER_INFO[provider].name} API key saved`);
    }
  };

  const clearApiKey = () => {
    localStorage.removeItem(`${API_KEY_STORAGE_PREFIX}${provider}`);
    setApiKey("");
    setHasStoredKey(false);
    toast.success("API key removed");
  };

  const addVideoUrl = () => {
    if (videoUrls.length < 5) {
      setVideoUrls([...videoUrls, ""]);
    }
  };

  const removeVideoUrl = (index: number) => {
    if (videoUrls.length > 1) {
      setVideoUrls(videoUrls.filter((_, i) => i !== index));
    }
  };

  const updateVideoUrl = (index: number, value: string) => {
    const newUrls = [...videoUrls];
    newUrls[index] = value;
    setVideoUrls(newUrls);
  };

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const generateChecklist = async () => {
    const validUrls = videoUrls.filter(url => url.trim() && extractVideoId(url.trim()));
    
    if (!apiKey.trim()) {
      setError(`Please enter your ${PROVIDER_INFO[provider].name} API key`);
      return;
    }
    
    if (validUrls.length === 0) {
      setError("Please enter at least one valid YouTube URL");
      return;
    }

    setError("");
    setIsGenerating(true);
    setGeneratedMarkdown("");

    try {
      const response = await fetch("/api/generate-checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          videoUrls: validUrls,
          customPrompt: customPrompt.trim(),
          provider: provider,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate checklist");
      }

      setGeneratedMarkdown(data.markdown);
      toast.success("Checklist generated successfully!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedMarkdown);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const useChecklist = () => {
    onChecklistGenerated(generatedMarkdown);
    onOpenChange(false);
    setGeneratedMarkdown("");
    setVideoUrls([""]);
    toast.success("Checklist created!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500" />
            YouTube to Checklist
            <Badge variant="secondary" className="ml-2">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Powered
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Paste YouTube video links and let AI create a comprehensive study checklist for you
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* AI Provider Selection */}
          <div className="space-y-2">
            <Label>AI Provider</Label>
            <Select value={provider} onValueChange={(v) => setProvider(v as AIProvider)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="groq">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-orange-500" />
                    <span>Groq (Recommended) - Fast & Free</span>
                  </div>
                </SelectItem>
                <SelectItem value="gemini">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    <span>Google Gemini</span>
                  </div>
                </SelectItem>
                <SelectItem value="openrouter">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-purple-500" />
                    <span>OpenRouter</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{PROVIDER_INFO[provider].description}</p>
          </div>

          {/* API Key Section */}
          <Accordion type="single" collapsible defaultValue={hasStoredKey ? undefined : "api-key"}>
            <AccordionItem value="api-key" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  <span>{PROVIDER_INFO[provider].name} API Key</span>
                  {hasStoredKey && (
                    <Badge variant="outline" className="ml-2 text-green-600 border-green-600">
                      <Check className="h-3 w-3 mr-1" />
                      Saved
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                <p className="text-sm text-muted-foreground">
                  Your API key is stored locally and never sent to our servers.
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showApiKey ? "text" : "password"}
                      placeholder={`${PROVIDER_INFO[provider].keyPrefix}...`}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button onClick={saveApiKey} variant="outline">
                    Save
                  </Button>
                  {hasStoredKey && (
                    <Button onClick={clearApiKey} variant="outline" size="icon">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
                <a
                  href={PROVIDER_INFO[provider].keyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Get your free API key from {PROVIDER_INFO[provider].name}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Video URLs */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Youtube className="h-4 w-4 text-red-500" />
              YouTube Video URLs
              <Badge variant="outline">{videoUrls.filter(u => u.trim()).length}/5</Badge>
            </Label>
            
            {videoUrls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="https://youtube.com/watch?v=... or https://youtu.be/..."
                  value={url}
                  onChange={(e) => updateVideoUrl(index, e.target.value)}
                />
                {videoUrls.length > 1 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeVideoUrl(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            
            {videoUrls.length < 5 && (
              <Button variant="outline" size="sm" onClick={addVideoUrl} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Another Video
              </Button>
            )}
            
            <p className="text-xs text-muted-foreground">
              Add up to 5 videos to create a comprehensive checklist covering all topics
            </p>
          </div>

          {/* Custom Prompt */}
          <div className="space-y-2">
            <Label>Custom Instructions (Optional)</Label>
            <Textarea
              placeholder="e.g., Focus on practical exercises, Include code examples, Create separate sections for each topic..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm bg-destructive/10 p-3 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="font-medium">
                  {error.includes("rate limit") || error.includes("quota") || error.includes("429") 
                    ? "Rate Limit Exceeded" 
                    : "Error"}
                </span>
              </div>
              <p className="text-muted-foreground">{error}</p>
              {(error.includes("rate limit") || error.includes("quota") || error.includes("All models") || error.includes("429")) && (
                <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-destructive/20">
                  <p className="font-medium mb-1">💡 Tips to fix:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Try switching to <strong>Groq</strong> - it has generous free limits!</li>
                    <li>Wait 1-2 minutes and try again</li>
                    <li>Use fewer videos (try 1 at a time)</li>
                    <li>Create a new API key from provider settings</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Generate Button */}
          <Button 
            onClick={generateChecklist} 
            disabled={isGenerating}
            className="w-full gap-2"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing videos with {PROVIDER_INFO[provider].name}...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Checklist
              </>
            )}
          </Button>

          {/* Generated Markdown */}
          {generatedMarkdown && (
            <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Generated Checklist
                </Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <Textarea
                value={generatedMarkdown}
                onChange={(e) => setGeneratedMarkdown(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
              
              <Button onClick={useChecklist} className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Create Checklist from This
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
