export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  level: number;
  children: TodoItem[];
  timeEstimate?: number; // in minutes
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string; // ISO date string
  tags?: string[];
  recurring?: 'daily' | 'weekly' | 'monthly' | null;
  lastCompleted?: string; // ISO date for recurring tasks
  links?: { label: string; url: string }[]; // optional links
}

export interface TodoSection {
  id: string;
  title: string;
  emoji?: string;
  description?: string;
  items: TodoItem[];
  completedCount: number;
  totalCount: number;
  totalTimeEstimate?: number; // in minutes
}

export interface ParsedChecklist {
  title: string;
  emoji?: string;
  sections: TodoSection[];
  totalCompleted: number;
  totalItems: number;
  totalTimeEstimate?: number; // in minutes
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
      cleanText: text.replace(emojiRegex, '').trim()
    };
  }
  return { cleanText: text.trim() };
}

function parseCheckboxLine(line: string): { text: string; completed: boolean; level: number } | null {
  const match = line.match(/^(\s*)- \[([ xX])\]\s*(.+)$/);
  if (!match) return null;
  
  const indent = match[1].length;
  const level = Math.floor(indent / 4); // 4 spaces = 1 level
  const completed = match[2].toLowerCase() === 'x';
  const text = match[3].trim();
  
  return { text, completed, level };
}

function cleanText(text: string): string {
  // Remove markdown bold markers
  return text.replace(/\*\*/g, '').replace(/`/g, '');
}

/**
 * Parse time estimates from task text.
 * Supports formats: (25m), (~25m), (40 min), (1h), (1h30m), (1h 30m), (~90min)
 * Returns cleanText (without time marker) and timeEstimate in minutes.
 * 
 * EXPORTED for use in DailyFocusCard to drive Task-Aware Pomodoro.
 */
export function parseTimeEstimate(text: string): { cleanText: string; timeEstimate?: number } {
  // Match patterns:
  // (25m), (~25m) - simple minutes
  // (40 min), (40 minutes) - minutes with word
  // (1h), (~1h) - hours only
  // (1h30m), (1h 30m), (~1h30m) - hours and minutes
  const timeRegex = /\(~?(\d+)\s*h(?:\s*(\d+)\s*m(?:in(?:utes?)?)?)?\)|(\(~?(\d+)\s*m(?:in(?:utes?)?)?\))/gi;
  
  let match = timeRegex.exec(text);
  if (!match) {
    // Try simpler pattern for (25m) or (~25m)
    const simpleRegex = /\(~?(\d+)\s*m(?:in(?:utes?)?)?\)/i;
    const simpleMatch = text.match(simpleRegex);
    if (simpleMatch) {
      const minutes = parseInt(simpleMatch[1], 10);
      return {
        cleanText: text.replace(simpleMatch[0], '').trim(),
        timeEstimate: minutes > 0 ? minutes : undefined,
      };
    }
    
    // Try hours pattern (1h) or (1h 30m)
    const hourRegex = /\(~?(\d+)\s*h(?:\s*(\d+)\s*m(?:in)?)?\)/i;
    const hourMatch = text.match(hourRegex);
    if (hourMatch) {
      let minutes = parseInt(hourMatch[1], 10) * 60;
      if (hourMatch[2]) {
        minutes += parseInt(hourMatch[2], 10);
      }
      return {
        cleanText: text.replace(hourMatch[0], '').trim(),
        timeEstimate: minutes > 0 ? minutes : undefined,
      };
    }
    
    return { cleanText: text };
  }
  
  let minutes = 0;
  if (match[1]) {
    // Hours format: (1h) or (1h30m)
    minutes = parseInt(match[1], 10) * 60;
    if (match[2]) {
      minutes += parseInt(match[2], 10);
    }
  } else if (match[4]) {
    // Minutes only: (25m)
    minutes = parseInt(match[4], 10);
  }
  
  return {
    cleanText: text.replace(match[0], '').trim(),
    timeEstimate: minutes > 0 ? minutes : undefined,
  };
}

// Parse priority markers like !!! (high), !! (medium), ! (low)
function parsePriority(text: string): { cleanText: string; priority?: 'low' | 'medium' | 'high' } {
  if (text.includes('!!!') || text.toLowerCase().includes('[high]')) {
    return { 
      cleanText: text.replace(/!!!/g, '').replace(/\[high\]/gi, '').trim(), 
      priority: 'high' 
    };
  }
  if (text.includes('!!') || text.toLowerCase().includes('[medium]')) {
    return { 
      cleanText: text.replace(/!!/g, '').replace(/\[medium\]/gi, '').trim(), 
      priority: 'medium' 
    };
  }
  if (text.match(/(?<![!])!(?![!])/) || text.toLowerCase().includes('[low]')) {
    return { 
      cleanText: text.replace(/(?<![!])!(?![!])/g, '').replace(/\[low\]/gi, '').trim(), 
      priority: 'low' 
    };
  }
  return { cleanText: text };
}

// Parse inline URLs and markdown links from text
function parseLinks(text: string): { cleanText: string; links: { label: string; url: string }[] } {
  const links: { label: string; url: string }[] = [];
  let cleanText = text;
  
  // Match markdown links: [label](url)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = markdownLinkRegex.exec(text)) !== null) {
    links.push({ label: match[1], url: match[2] });
  }
  cleanText = cleanText.replace(markdownLinkRegex, '').trim();
  
  // Match standalone URLs (http/https)
  const urlRegex = /(?:^|\s)(https?:\/\/[^\s]+)/g;
  while ((match = urlRegex.exec(text)) !== null) {
    const url = match[1];
    // Don't add if already captured as markdown link
    if (!links.some(l => l.url === url)) {
      // Extract domain as label
      try {
        const domain = new URL(url).hostname.replace('www.', '');
        links.push({ label: domain, url });
      } catch {
        links.push({ label: 'Link', url });
      }
    }
  }
  cleanText = cleanText.replace(/(?:^|\s)https?:\/\/[^\s]+/g, '').trim();
  
  return { cleanText, links: links.length > 0 ? links : [] };
}

// Check if a line is a link sub-bullet: - link: https://...
function parseLinkSubBullet(line: string): { url: string; label: string } | null {
  const match = line.match(/^\s*-\s*link:\s*(https?:\/\/[^\s]+)(?:\s+(.+))?$/i);
  if (match) {
    const url = match[1];
    let label = match[2]?.trim();
    if (!label) {
      try {
        label = new URL(url).hostname.replace('www.', '');
      } catch {
        label = 'Link';
      }
    }
    return { url, label };
  }
  return null;
}

export function parseMarkdownChecklist(markdown: string): ParsedChecklist {
  const lines = markdown.split('\n');
  let title = '';
  let titleEmoji: string | undefined;
  const sections: TodoSection[] = [];
  let currentSection: TodoSection | null = null;
  let itemStack: TodoItem[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Parse main title (# heading)
    const titleMatch = line.match(/^#\s+(.+)$/);
    if (titleMatch && !title) {
      const { emoji, cleanText: cleanTitle } = extractEmoji(titleMatch[1]);
      title = cleanTitle;
      titleEmoji = emoji;
      continue;
    }
    
    // Parse section (## heading)
    const sectionMatch = line.match(/^##\s+(.+)$/);
    if (sectionMatch) {
      if (currentSection) {
        sections.push(currentSection);
      }
      const { emoji, cleanText: cleanTitle } = extractEmoji(sectionMatch[1]);
      currentSection = {
        id: generateId(),
        title: cleanTitle,
        emoji,
        items: [],
        completedCount: 0,
        totalCount: 0
      };
      itemStack = [];
      continue;
    }
    
    // Parse description (italic text under section)
    const descMatch = line.match(/^\*(.+)\*$/);
    if (descMatch && currentSection && currentSection.items.length === 0) {
      currentSection.description = descMatch[1].trim();
      continue;
    }
    
    // Parse checkbox items
    const checkboxData = parseCheckboxLine(line);
    if (checkboxData && currentSection) {
      // Parse time estimate, priority, and links from text
      const { cleanText: textWithoutTime, timeEstimate } = parseTimeEstimate(checkboxData.text);
      const { cleanText: textWithoutPriority, priority } = parsePriority(textWithoutTime);
      const { cleanText: finalText, links } = parseLinks(textWithoutPriority);
      
      const item: TodoItem = {
        id: generateId(),
        text: cleanText(finalText),
        completed: checkboxData.completed,
        level: checkboxData.level,
        children: [],
        timeEstimate,
        priority,
        links: links.length > 0 ? links : undefined,
      };
      
      currentSection.totalCount++;
      if (item.completed) {
        currentSection.completedCount++;
      }
      
      // Add time estimate to section total
      if (timeEstimate) {
        currentSection.totalTimeEstimate = (currentSection.totalTimeEstimate || 0) + timeEstimate;
      }
      
      if (checkboxData.level === 0) {
        currentSection.items.push(item);
        itemStack = [item];
      } else {
        // Find parent at appropriate level
        while (itemStack.length > checkboxData.level) {
          itemStack.pop();
        }
        
        if (itemStack.length > 0) {
          const parent = itemStack[itemStack.length - 1];
          parent.children.push(item);
        } else {
          currentSection.items.push(item);
        }
        
        itemStack.push(item);
      }
    }
  }
  
  // Add last section
  if (currentSection) {
    sections.push(currentSection);
  }
  
  // Calculate totals
  let totalCompleted = 0;
  let totalItems = 0;
  let totalTimeEstimate = 0;
  
  sections.forEach(section => {
    totalCompleted += section.completedCount;
    totalItems += section.totalCount;
    totalTimeEstimate += section.totalTimeEstimate || 0;
  });
  
  return {
    title: title || 'Untitled Checklist',
    emoji: titleEmoji,
    sections,
    totalCompleted,
    totalItems,
    totalTimeEstimate: totalTimeEstimate > 0 ? totalTimeEstimate : undefined,
  };
}

export function updateItemCompletion(
  sections: TodoSection[],
  sectionId: string,
  itemId: string,
  completed: boolean
): TodoSection[] {
  return sections.map(section => {
    if (section.id !== sectionId) return section;
    
    let completedDelta = 0;
    
    const updateItem = (items: TodoItem[]): TodoItem[] => {
      return items.map(item => {
        if (item.id === itemId) {
          if (item.completed !== completed) {
            completedDelta = completed ? 1 : -1;
          }
          return { ...item, completed, children: updateItem(item.children) };
        }
        return { ...item, children: updateItem(item.children) };
      });
    };
    
    const updatedItems = updateItem(section.items);
    
    return {
      ...section,
      items: updatedItems,
      completedCount: section.completedCount + completedDelta
    };
  });
}

export function toggleAllInSection(
  sections: TodoSection[],
  sectionId: string,
  completed: boolean
): TodoSection[] {
  return sections.map(section => {
    if (section.id !== sectionId) return section;
    
    const updateItems = (items: TodoItem[]): TodoItem[] => {
      return items.map(item => ({
        ...item,
        completed,
        children: updateItems(item.children)
      }));
    };
    
    return {
      ...section,
      items: updateItems(section.items),
      completedCount: completed ? section.totalCount : 0
    };
  });
}

export function recalculateTotals(sections: TodoSection[]): { totalCompleted: number; totalItems: number } {
  let totalCompleted = 0;
  let totalItems = 0;
  
  sections.forEach(section => {
    // Defensive check: ensure values are valid numbers, default to 0
    const completed = typeof section.completedCount === 'number' && !isNaN(section.completedCount) 
      ? section.completedCount 
      : 0;
    const total = typeof section.totalCount === 'number' && !isNaN(section.totalCount) 
      ? section.totalCount 
      : (section.items?.length || 0);
    
    totalCompleted += completed;
    totalItems += total;
  });
  
  return { totalCompleted, totalItems };
}
