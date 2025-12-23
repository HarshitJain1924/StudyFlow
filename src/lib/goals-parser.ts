// Goals Markdown Parser
// Parses markdown into Goal objects for import

export interface ParsedGoalTask {
  text: string;
  completed?: boolean;
}

export interface ParsedGoalSection {
  title: string;
  items: ParsedGoalTask[];
}

export interface ParsedGoal {
  title: string;
  type: "daily" | "weekly" | "monthly" | "custom";
  mode: "time" | "check";
  targetMinutes: number;
  targetCount?: number;
  emoji?: string;
  deadline?: string;
  links?: { label: string; url: string }[];
  tasks?: ParsedGoalSection[]; // For auto-creating checklists
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function extractEmoji(text: string): { emoji?: string; cleanText: string } {
  const emojiRegex = /^([\p{Emoji_Presentation}\p{Extended_Pictographic}]+)\s*/u;
  const match = text.match(emojiRegex);
  if (match) {
    return {
      emoji: match[1],
      cleanText: text.replace(emojiRegex, "").trim(),
    };
  }
  return { cleanText: text.trim() };
}

function parseUrl(text: string): { label: string; url: string } | null {
  // Match markdown link: [label](url)
  const mdMatch = text.match(/\[([^\]]+)\]\(([^)]+)\)/);
  if (mdMatch) {
    return { label: mdMatch[1], url: mdMatch[2] };
  }
  
  // Match standalone URL
  const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
  if (urlMatch) {
    const url = urlMatch[1];
    try {
      const domain = new URL(url).hostname.replace("www.", "");
      const textWithoutUrl = text.replace(url, "").trim();
      return { label: textWithoutUrl || domain, url };
    } catch {
      return { label: "Link", url };
    }
  }
  
  return null;
}

export function parseGoalsMarkdown(markdown: string): ParsedGoal[] {
  const lines = markdown.split("\n");
  const goals: ParsedGoal[] = [];
  
  let currentGoal: Partial<ParsedGoal> | null = null;
  let currentLinks: { label: string; url: string }[] = [];
  let currentTasks: ParsedGoalSection[] = [];
  let currentSection: ParsedGoalSection | null = null;
  
  const finalizeSection = () => {
    if (currentSection && currentSection.items.length > 0) {
      currentTasks.push(currentSection);
    }
    currentSection = null;
  };
  
  const finalizeGoal = () => {
    finalizeSection();
    if (currentGoal && currentGoal.title) {
      const mode = currentGoal.mode || "time";
      // If tasks were parsed, auto-set mode to "check"
      const hasTasksFromParsing = currentTasks.length > 0;
      const finalMode = hasTasksFromParsing ? "check" : mode;
      
      goals.push({
        title: currentGoal.title,
        type: currentGoal.type || "daily",
        mode: finalMode,
        // Time goals need valid targetMinutes (default 60 if unset/0)
        // Check goals don't use targetMinutes
        targetMinutes: finalMode === "time" ? (currentGoal.targetMinutes || 60) : 0,
        targetCount: finalMode === "check" ? (currentGoal.targetCount || 1) : undefined,
        emoji: currentGoal.emoji,
        deadline: currentGoal.deadline,
        links: currentLinks.length > 0 ? currentLinks : undefined,
        tasks: currentTasks.length > 0 ? currentTasks : undefined,
      });
    }
    currentGoal = null;
    currentLinks = [];
    currentTasks = [];
    currentSection = null;
  };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Parse goal title (## heading)
    const goalMatch = line.match(/^##\s+(.+)$/);
    if (goalMatch) {
      finalizeGoal();
      const { emoji, cleanText } = extractEmoji(goalMatch[1]);
      currentGoal = {
        title: cleanText,
        emoji,
        type: "daily",
        mode: "time",
        targetMinutes: 0,
      };
      continue;
    }
    
    // Parse metadata (key: value)
    if (currentGoal) {
      // type: daily/weekly/monthly/custom
      const typeMatch = line.match(/^type:\s*(daily|weekly|monthly|custom)$/i);
      if (typeMatch) {
        currentGoal.type = typeMatch[1].toLowerCase() as ParsedGoal["type"];
        continue;
      }
      
      // mode: time/check
      const modeMatch = line.match(/^mode:\s*(time|check)$/i);
      if (modeMatch) {
        currentGoal.mode = modeMatch[1].toLowerCase() as ParsedGoal["mode"];
        continue;
      }
      
      // target: number (for check mode - count, or minutes for time mode)
      const targetMatch = line.match(/^target:\s*(\d+)$/i);
      if (targetMatch) {
        const value = parseInt(targetMatch[1], 10);
        if (currentGoal.mode === "check") {
          currentGoal.targetCount = value;
        } else {
          currentGoal.targetMinutes = value;
        }
        continue;
      }
      
      // targetMinutes: number
      const targetMinutesMatch = line.match(/^targetMinutes:\s*(\d+)$/i);
      if (targetMinutesMatch) {
        currentGoal.targetMinutes = parseInt(targetMinutesMatch[1], 10);
        continue;
      }
      
      // targetCount: number
      const targetCountMatch = line.match(/^targetCount:\s*(\d+)$/i);
      if (targetCountMatch) {
        currentGoal.targetCount = parseInt(targetCountMatch[1], 10);
        continue;
      }
      
      // hours: number (converts to targetMinutes)
      const hoursMatch = line.match(/^hours:\s*(\d+(?:\.\d+)?)$/i);
      if (hoursMatch) {
        currentGoal.targetMinutes = Math.round(parseFloat(hoursMatch[1]) * 60);
        continue;
      }
      
      // deadline: date string
      const deadlineMatch = line.match(/^deadline:\s*(.+)$/i);
      if (deadlineMatch) {
        currentGoal.deadline = deadlineMatch[1].trim();
        continue;
      }
      
      // emoji: emoji character
      const emojiMatch = line.match(/^emoji:\s*(.+)$/i);
      if (emojiMatch) {
        currentGoal.emoji = emojiMatch[1].trim();
        continue;
      }
      
      // Parse task section header (### heading within a goal)
      const taskSectionMatch = line.match(/^###\s+(.+)$/);
      if (taskSectionMatch) {
        finalizeSection();
        const { emoji, cleanText } = extractEmoji(taskSectionMatch[1]);
        currentSection = {
          title: cleanText || "Tasks",
          items: [],
        };
        continue;
      }
      
      // Parse list items - could be links OR task items
      const listMatch = line.match(/^-\s+(.+)$/);
      if (listMatch) {
        const itemText = listMatch[1].trim();
        
        // Check if it's a checkbox item: - [ ] or - [x]
        const checkboxMatch = itemText.match(/^\[([ xX])\]\s*(.+)$/);
        if (checkboxMatch) {
          // It's a task item
          const completed = checkboxMatch[1].toLowerCase() === "x";
          const taskText = checkboxMatch[2].trim();
          
          // If no section exists, create a default one
          if (!currentSection) {
            currentSection = { title: "Tasks", items: [] };
          }
          currentSection.items.push({ text: taskText, completed });
          continue;
        }
        
        // Check if it's a link
        const linkData = parseUrl(itemText);
        if (linkData) {
          currentLinks.push(linkData);
          continue;
        }
        
        // Otherwise treat as a plain task item
        if (!currentSection) {
          currentSection = { title: "Tasks", items: [] };
        }
        currentSection.items.push({ text: itemText, completed: false });
        continue;
      }
    }
    
    // Parse section header (# heading) - used for grouping, ignored for now
    const sectionMatch = line.match(/^#\s+(.+)$/);
    if (sectionMatch) {
      finalizeGoal();
      continue;
    }
  }
  
  // Finalize last goal
  finalizeGoal();
  
  return goals;
}

// Convert ParsedGoal to full Goal object with id and timestamps
export function createGoalFromParsed(parsed: ParsedGoal): {
  id: string;
  title: string;
  type: "daily" | "weekly" | "monthly" | "custom";
  mode: "time" | "check";
  targetMinutes: number;
  targetCount?: number;
  completedCount?: number;
  createdAt: string;
  deadline?: string;
  emoji?: string;
  links?: { label: string; url: string }[];
} {
  return {
    id: crypto.randomUUID?.() || generateId(),
    title: parsed.title,
    type: parsed.type,
    mode: parsed.mode,
    targetMinutes: parsed.targetMinutes,
    targetCount: parsed.mode === "check" ? (parsed.targetCount || 1) : undefined,
    completedCount: parsed.mode === "check" ? 0 : undefined,
    createdAt: new Date().toISOString(),
    deadline: parsed.deadline,
    emoji: parsed.emoji || "🎯",
    links: parsed.links,
  };
}
