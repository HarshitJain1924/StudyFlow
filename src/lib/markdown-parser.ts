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

// Parse time estimates like (~25m), (~1h), (~1h30m), (~90min)
function parseTimeEstimate(text: string): { cleanText: string; timeEstimate?: number } {
  const timeRegex = /\(~(\d+)(?:h)?(?:(\d+)?m(?:in)?)?(?:\)|$)|\(~(\d+)\s*min(?:utes?)?\)/i;
  const match = text.match(timeRegex);
  
  if (match) {
    let minutes = 0;
    if (match[3]) {
      // Format: (~90min) or (~90 minutes)
      minutes = parseInt(match[3], 10);
    } else if (match[1]) {
      const firstNum = parseInt(match[1], 10);
      if (text.includes('h')) {
        // Format: (~1h) or (~1h30m)
        minutes = firstNum * 60;
        if (match[2]) {
          minutes += parseInt(match[2], 10);
        }
      } else {
        // Format: (~25m)
        minutes = firstNum;
      }
    }
    
    return {
      cleanText: text.replace(timeRegex, '').trim(),
      timeEstimate: minutes > 0 ? minutes : undefined,
    };
  }
  
  return { cleanText: text };
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
      // Parse time estimate and priority from text
      const { cleanText: textWithoutTime, timeEstimate } = parseTimeEstimate(checkboxData.text);
      const { cleanText: finalText, priority } = parsePriority(textWithoutTime);
      
      const item: TodoItem = {
        id: generateId(),
        text: cleanText(finalText),
        completed: checkboxData.completed,
        level: checkboxData.level,
        children: [],
        timeEstimate,
        priority,
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
