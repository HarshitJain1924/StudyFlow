# 📚 StudyFlow - Your Personal Study & Work Companion

Transform your markdown checklists into a powerful productivity app with progress tracking, timers, statistics, achievements, and more!

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)
![shadcn/ui](https://img.shields.io/badge/shadcn/ui-latest-black)
![PWA](https://img.shields.io/badge/PWA-Ready-purple)

## ✨ Features

### 📋 Core Task Management
- **Markdown Parsing**: Paste any markdown checklist and convert it to an interactive todo list
- **Quick Lists**: Create simple checklists without markdown
- **Multiple Checklists**: ChatGPT-style sidebar to manage multiple lists
- **File Upload**: Upload `.md` files directly
- **Nested Tasks**: Support for deeply nested subtasks with collapsible sections
- **Auto-Save**: Your progress is automatically saved to localStorage
- **Due Dates**: Add due dates with calendar picker (Today, Tomorrow, Next Week shortcuts)
- **Tags/Categories**: Organize tasks with color-coded tags (Work, Personal, Study, Health, Finance, Home)
- **Recurring Tasks**: Set tasks to repeat daily, weekly, or monthly
- **Quick Templates**: Start with pre-made templates (Study Plan, Home Tasks, Work Projects, etc.)

### ⏱️ Pomodoro Timer
- **Customizable Timer**: Set work/break durations (default 25/5/15 minutes)
- **Session Counter**: Track completed focus sessions
- **Auto-switch**: Automatically switches between work and break modes
- **Sound & Desktop Notifications**: Get notified when timer completes
- **Long Breaks**: Automatic long break after 4 sessions

### ⏱️ Stopwatch Timer
- **Simple Stopwatch**: Start, stop, and reset timer for flexible tracking
- **Lap Times**: Record lap times while timing
- **Best/Worst Lap**: Automatically highlights fastest and slowest laps
- **Save Sessions**: Save stopwatch time directly to your study statistics
- **Millisecond Precision**: Accurate timing display

### 🎵 Focus Sounds
- **Ambient Sounds**: Rain, Wind, Fire, Café, Waves, Forest
- **Volume Control**: Adjust volume to your preference
- **Background Audio**: Helps maintain focus during study sessions

### 💬 Daily Motivation
- **Inspirational Quotes**: Daily motivational quotes from famous thinkers
- **Refresh Option**: Get a new random quote anytime
- **Study-focused**: Curated quotes for learning and productivity

### 📊 Statistics Dashboard
- **Daily Goal Tracking**: Set and track daily study time goals
- **Weekly Goal Tracking**: Set weekly hour targets with progress bar
- **This Week Summary**: See current week's stats at a glance
- **Streak System**: Build and maintain study streaks
- **Monthly Calendar**: LeetCode-style activity calendar with current week highlight
- **Activity Heatmap**: 10-week contribution graph showing study patterns
- **All-time Stats**: Total study time, tasks completed, active days

### 🏆 Achievement Badges (12 Badges)
**Time-Based:**
- 🌟 First Hour - Complete 1 hour of study
- 📚 Dedicated - Reach 10 hours total
- 🎓 Scholar - Achieve 50 hours
- 👑 Master - Complete 100 hours

**Task-Based:**
- ✅ Starter - Complete first task
- 🎯 Productive - Complete 10 tasks
- 🏆 Achiever - Complete 50 tasks
- 🏅 Champion - Complete 100 tasks

**Streak-Based:**
- 🔥 Consistent - 3-day streak
- ⚡ Weekly Warrior - 7-day streak
- 💪 Unstoppable - 14-day streak
- 👑 Legendary - 30-day streak

### 🎯 Focus Mode
- **Single Section Focus**: Focus on one section at a time
- **Distraction-free**: Hide other sections while studying
- **Compact Mode**: Toggle compact view to see more tasks

### 🔍 Search & Filter
- **Full-text Search**: Find tasks by keyword
- **Status Filter**: Filter by completed, incomplete, or in-progress
- **Section Filter**: Focus on specific sections

### 📝 Study Notes
- **Quick Notes**: Jot down thoughts while studying
- **Color Coding**: Organize notes with different colors
- **Persistent Storage**: Notes are saved locally

### 💾 Data Export
- **Export to JSON**: Full backup of all data (checklists, stats, settings)
- **Export to CSV**: Export stats for spreadsheet analysis
- **Reset Stats**: Start fresh when needed

### ⌨️ Keyboard Shortcuts
- `Alt+S` - Toggle sidebar
- `Alt+N` - New quick list
- `Alt+M` - New markdown list
- `Alt+T` - Toggle theme
- `/` - Show all shortcuts

### 📱 Progressive Web App (PWA)
- **Installable**: Install as a native app on desktop/mobile
- **Offline Support**: Works without internet connection
- **Auto Updates**: Get notified when updates are available
- **Offline Indicator**: See when you're working offline

### 🎉 Celebrations
- **Confetti Effects**: Celebrate task and section completions
- **Achievement Animations**: Special effects for milestones

### 🌙 Additional Features
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works beautifully on desktop and mobile
- **Mobile Menu**: Access all features via slide-out panel

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. Clone and install dependencies:
```bash
git clone <repo-url>
cd markdown-todo
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📖 Usage

### Getting Started
1. **Create Quick List**: Click "Create Quick List" for simple tasks
2. **Or Import Markdown**: Click "Import Markdown" to paste structured checklists
3. **Or Use Template**: Choose from Study Plan, Home Tasks, Work Projects, etc.

### Study Session
1. **Start Timer**: Use Pomodoro for structured sessions or Stopwatch for flexible timing
2. **Enable Focus Sounds**: Add ambient sounds for better concentration
3. **Complete Tasks**: Check off items and see your progress
4. **Take Breaks**: Pomodoro automatically switches to break mode
5. **Track Progress**: View your stats, calendar, and achievements
6. **Take Notes**: Use the Notes tab to jot down important points

### Task Management
1. **Add Due Dates**: Click the calendar icon when adding tasks
2. **Add Tags**: Select from Work, Personal, Study, Health, Finance, Home
3. **Set Recurring**: Make tasks repeat daily, weekly, or monthly
4. **Focus Mode**: Toggle to hide completed tasks or focus on sections

### Supported Markdown Format

```markdown
# 📜 My Checklist Title

## Section 1
*Optional section description*

- [ ] Main task
    - [ ] Subtask 1
    - [ ] Subtask 2
- [ ] Another task

## Section 2

- [ ] Task A
- [ ] Task B
```

## 🛠️ Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Components**: shadcn/ui
- **Icons**: Lucide React
- **Date Utils**: date-fns
- **Animations**: canvas-confetti

## 📂 Project Structure

```
src/
├── app/
│   ├── page.tsx          # Main page component
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── markdown-input.tsx    # Markdown input area
│   ├── todo-list.tsx         # Main todo list container
│   ├── todo-section.tsx      # Section component with progress
│   ├── todo-item.tsx         # Individual todo item with badges
│   ├── quick-task-adder.tsx  # Quick task creation with due dates/tags
│   ├── overall-progress.tsx  # Progress overview card
│   ├── pomodoro-timer.tsx    # Pomodoro timer component
│   ├── stopwatch-timer.tsx   # Stopwatch timer component
│   ├── stats-overview.tsx    # Statistics dashboard with calendar
│   ├── achievement-badges.tsx # Achievement system
│   ├── study-notes.tsx       # Notes feature
│   ├── focus-sounds.tsx      # Ambient sounds generator
│   ├── daily-quote.tsx       # Motivational quotes
│   ├── settings-panel.tsx    # Settings and export
│   ├── checklist-sidebar.tsx # ChatGPT-style sidebar
│   ├── search-filter.tsx     # Search and filter controls
│   └── confetti.tsx          # Celebration animations
├── hooks/
│   ├── use-keyboard-shortcuts.ts  # Keyboard shortcuts hook
│   └── use-pwa.ts                 # PWA hooks
└── lib/
    ├── markdown-parser.ts    # Markdown parsing logic
    ├── study-types.ts        # Type definitions
    ├── study-context.tsx     # Global study state management
    ├── view-context.tsx      # View settings context
    ├── checklist-store.tsx   # Checklist state management
    └── utils.ts              # Utility functions
```

## 🎯 Ideal For

- 📚 Students following course curriculums
- 💻 Developers learning new technologies
- 🏢 Professionals managing work tasks
- 🎓 Anyone with structured learning or work goals
- 📋 People who love markdown checklists
- ⏱️ Anyone who uses Pomodoro technique
- 🏆 Gamification enthusiasts who love achievements

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

---

Made with ❤️ for productive people everywhere

