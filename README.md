  # 📚 StudyFlow - Your Personal Study & Work Companion

  Transform your markdown checklists into a powerful productivity app with AI-powered features, cloud sync, progress tracking, focus music, achievements, and more!

  🌐 **Live Demo**: [https://study-flow-virid.vercel.app](https://study-flow-virid.vercel.app)

  ![Next.js](https://img.shields.io/badge/Next.js-16-black)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
  ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)
  ![shadcn/ui](https://img.shields.io/badge/shadcn/ui-latest-black)
  ![PWA](https://img.shields.io/badge/PWA-Ready-purple)
  ![Clerk](https://img.shields.io/badge/Clerk-Auth-6c47ff)
  ![MongoDB](https://img.shields.io/badge/MongoDB-Cloud-47A248)

  ## ✨ Features

  ### 🔐 Authentication & Cloud Sync
  - **Clerk Authentication**: Secure sign-in with Google, GitHub, or email
  - **Cloud Sync**: Your checklists and stats sync across all devices
  - **User Profiles**: View your study stats, level, XP, and badges
  - **Public Leaderboard**: Compete with other users globally
  - **Auto Checklist Sync**: Checklists automatically sync across all devices

  ### 📋 Core Task Management
  - **Markdown Parsing**: Paste any markdown checklist and convert it to an interactive todo list
  - **Quick Lists**: Create simple checklists without markdown
  - **Multiple Checklists**: ChatGPT-style sidebar to manage multiple lists
  - **File Upload**: Upload `.md` files directly
  - **Nested Tasks**: Support for deeply nested subtasks with collapsible sections
  - **Auto-Save**: Your progress is automatically saved locally and synced to cloud
  - **Real-time Sync**: Changes sync to cloud within 2 seconds
  - **Due Dates**: Add due dates with calendar picker (Today, Tomorrow, Next Week shortcuts)
  - **Tags/Categories**: Organize tasks with color-coded tags (Work, Personal, Study, Health, Finance, Home)
  - **Recurring Tasks**: Set tasks to repeat daily, weekly, or monthly
  - **Quick Templates**: Start with pre-made templates (Study Plan, Home Tasks, Work Projects, etc.)

  ### 🤖 AI-Powered YouTube to Checklist
  - **YouTube Video Analysis**: Generate study checklists from any YouTube video
  - **Multi-Provider Support**: Choose from Gemini, Groq (recommended), or OpenRouter
  - **BYOK (Bring Your Own Key)**: Use your own API keys for privacy
  - **Custom Prompts**: Customize how the AI generates your checklist
  - **Multiple Videos**: Analyze up to 5 YouTube videos at once
  - **Secure Key Storage**: API keys stored locally, never sent to our servers

  ### ⏱️ Pomodoro Timer
  - **Customizable Timer**: Set work/break durations (default 25/5/15 minutes)
  - **Session Counter**: Track completed focus sessions
  - **Auto-switch**: Automatically switches between work and break modes
  - **Sound & Desktop Notifications**: Get notified when timer completes
  - **Long Breaks**: Automatic long break after 4 sessions
  - **Background-safe**: Timer continues accurately even when tab is in background
  - **Minimal UI Mode**: Clean, distraction-free timer display

  ### ⏱️ Stopwatch Timer
  - **Simple Stopwatch**: Start, stop, and reset timer for flexible tracking
  - **Lap Times**: Record lap times while timing
  - **Best/Worst Lap**: Automatically highlights fastest and slowest laps
  - **Save Sessions**: Save stopwatch time directly to your study statistics
  - **Millisecond Precision**: Accurate timing display
  - **Minimal UI Mode**: Hide decorative elements for focus

  ### 🎵 Focus Music Player
  - **6 Royalty-Free Tracks**: Curated focus music including:
    - Healing Cosmic Sleep (432Hz)
    - Corporate Focus
    - Late Night Focus
    - Rainy Study Cafe
    - Brain Power 432Hz
    - Whispering Rain
  - **Spotify-like UI**: Beautiful, modern music player interface
  - **Shuffle & Repeat**: With visual indicators (dot + highlight)
  - **Progress Bar**: Seek to any position in the track
  - **Volume Control**: Adjustable with mute toggle
  - **Like Tracks**: Heart your favorite tracks
  - **Playlist View**: See all tracks with current playing indicator
  - **Mini Player**: Compact player shown in sidebar
  - **Bluetooth/Lock Screen Controls**: Full Media Session API support
  - **Background Playback**: Music continues across tab switches
  - **Minimal UI Mode**: Hide visualizer animations

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
  - **Level & XP System**: Earn experience points and level up

  ### 🎯 Goals Manager
  - **Custom Goals**: Create daily, weekly, monthly, or custom deadline goals
  - **Goal Templates**: Quick Focus (30m), Deep Work (2h), Marathon (4h), Full Day (8h)
  - **Progress Tracking**: Visual progress bars for each goal
  - **Goal Emojis**: Personalize goals with emojis
  - **Goal History**: Track completed and failed goals
  - **Two Goal Modes**:
    - **Time-based**: Track study time automatically from timer sessions
    - **Checklist-based**: Manual completion for tasks like "2 LeetCode problems"
  - **Checklist Goals Features**:
    - Set a target count (e.g., 5 chapters, 3 exercises)
    - "Mark Done" button to increment progress manually
    - Visual progress as "X / Y items"
    - Green completion state when goal is achieved
  - **Daily Auto-Reset**: Daily checklist goals automatically reset at midnight (localStorage-based, no backend required)
  - **Mode Preservation**: Editing goals correctly preserves time/checklist mode
  - **Import Goals from Markdown**: Bulk import goals using a simple markdown format:
    ```markdown
    ## 📚 Read 10 Books
    type: monthly
    mode: check
    target: 10

    ## ⏱️ Study 2 Hours Daily
    type: daily
    mode: time
    target: 120
    ```

  ### 🏆 Achievement Badges (12 Badges)
  **Time-Based:**
  - 🌟 First Hour - Complete 1 hour of study
  - 📚 Dedicated - Reach 10 hours total
  - 🎓 Scholar - Achieve 50 hours
  - 👑 Master - Complete 100 hours

  **Task-Based:**
  - ✅ Starter - Complete 10 tasks
  - 🎯 Productive - Complete 50 tasks
  - 🏆 Achiever - Complete 100 tasks
  - 🏅 Champion - Complete 500 tasks

  **Streak-Based:**
  - 🔥 Consistent - 3-day streak
  - ⚡ Weekly Warrior - 7-day streak
  - 💪 Unstoppable - 14-day streak
  - 👑 Legendary - 30-day streak

  ### 🏅 Leaderboard
  - **Global Rankings**: See top studiers worldwide
  - **Weekly/All-Time**: Switch between leaderboard views
  - **Your Rank**: See where you stand among all users
  - **Study Time Display**: Compare hours studied
  - **Streak Display**: See everyone's current streaks

  ### 🎯 Focus & View Modes
  - **Minimal UI Toggle**: Remove decorative elements for distraction-free studying
    - Hides color bars, visualizers, confetti celebrations
    - Clean, minimal interface
  - **Compact Mode**: Toggle compact view to see more tasks
  - **Focus on Section**: Hide other sections while working

  ### 🔍 Search & Filter
  - **Full-text Search**: Find tasks by keyword
  - **Status Filter**: Filter by completed, incomplete, or in-progress
  - **Section Filter**: Focus on specific sections

  ### 📝 Study Notes
  - **Quick Notes**: Jot down thoughts while studying
  - **Color Coding**: Organize notes with different colors
  - **Persistent Storage**: Notes are saved locally and to cloud

  ### 💾 Data Export
  - **Export to JSON**: Full backup of all data (checklists, stats, settings)
  - **Export to CSV**: Export stats for spreadsheet analysis
  - **Reset Stats**: Start fresh when needed

  ### ⌨️ Keyboard Shortcuts
  - `Alt+S` - Toggle sidebar
  - `Alt+M` - Toggle compact mode
  - `/` - Show all shortcuts
  - `Escape` - Close dialogs

  ### 📱 Progressive Web App (PWA)
  - **Installable**: Install as a native app on desktop/mobile
  - **Offline Support**: Works without internet connection
  - **Auto Updates**: Get notified when updates are available
  - **Offline Indicator**: See when you're working offline

  ### 🎉 Celebrations
  - **Confetti Effects**: Celebrate task and section completions
  - **Achievement Animations**: Special effects for milestones
  - **Disable in Minimal UI**: Turn off celebrations for focus

  ### 🌙 Additional Features
  - **Dark Mode**: Toggle between light and dark themes
  - **Responsive Design**: Works beautifully on desktop and mobile
  - **Mobile Menu**: Access all features via slide-out panel
  - **Loading Quotes**: Inspirational quotes while app loads

  ## 🚀 Getting Started

  ### Prerequisites

  - Node.js 18+ 
  - npm, yarn, or pnpm
  - MongoDB Atlas account (for cloud sync)
  - Clerk account (for authentication)

  ### Environment Variables

  Create a `.env.local` file with:

  ```env
  # Clerk Authentication
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
  CLERK_SECRET_KEY=sk_test_...
  NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
  NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
  CLERK_WEBHOOK_SECRET=your_webhook_secret

  # MongoDB
  MONGODB_URI=mongodb+srv://...
  ```

  ### Installation

  1. Clone and install dependencies:
  ```bash
  git clone <repo-url>
  cd markdown-todo
  npm install
  ```

  2. Set up environment variables (see above)

  3. Run the development server:
  ```bash
  npm run dev
  ```

  4. Open [http://localhost:3000](http://localhost:3000) in your browser

  ## 📖 Usage

  ### Getting Started
  1. **Sign Up/Sign In**: Create an account to sync your data across devices
  2. **Create Quick List**: Click "Create Quick List" for simple tasks
  3. **Or Import Markdown**: Click "Import Markdown" to paste structured checklists
  4. **Or Use AI**: Click the magic wand (✨) to generate a checklist from YouTube videos
  5. **Or Use Template**: Choose from Study Plan, Home Tasks, Work Projects, etc.

  ### AI YouTube Checklist
  1. Click the **Wand icon** (✨) in the header
  2. Select your AI provider (Groq recommended for speed)
  3. Enter your API key (get one free from provider)
  4. Paste YouTube video URL(s)
  5. Optionally add a custom prompt
  6. Click Generate and use the checklist!

  ### Study Session
  1. **Start Timer**: Use Pomodoro for structured sessions or Stopwatch for flexible timing
  2. **Play Focus Music**: Choose from 6 curated focus tracks
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

  - **Framework**: Next.js 16 with App Router & Turbopack
  - **Language**: TypeScript
  - **Styling**: Tailwind CSS 4
  - **Components**: shadcn/ui
  - **Icons**: Lucide React
  - **Date Utils**: date-fns
  - **Animations**: canvas-confetti
  - **Authentication**: Clerk
  - **Database**: MongoDB with Mongoose
  - **Audio**: HTML5 Audio API + Media Session API
  - **State Management**: React Context

  ## 📂 Project Structure

  ```
  src/
  ├── app/
  │   ├── page.tsx              # Main page component
  │   ├── layout.tsx            # Root layout with providers
  │   ├── globals.css           # Global styles
  │   ├── api/
  │   │   ├── checklists/       # Checklist CRUD endpoints
  │   │   ├── generate-checklist/ # AI YouTube to checklist
  │   │   ├── leaderboard/      # Leaderboard API
  │   │   ├── notes/            # Notes API
  │   │   ├── stats/            # Stats sync API
  │   │   ├── user/             # User profile API
  │   │   └── webhooks/clerk/   # Clerk webhook handler
  │   ├── sign-in/              # Sign in page
  │   └── sign-up/              # Sign up page
  ├── components/
  │   ├── ui/                   # shadcn/ui components
  │   ├── markdown-input.tsx    # Markdown input area
  │   ├── todo-list.tsx         # Main todo list container
  │   ├── todo-section.tsx      # Section with progress
  │   ├── todo-item.tsx         # Individual todo item
  │   ├── quick-task-adder.tsx  # Quick task creation
  │   ├── overall-progress.tsx  # Progress overview card
  │   ├── pomodoro-timer.tsx    # Pomodoro timer
  │   ├── stopwatch-timer.tsx   # Stopwatch timer
  │   ├── focus-sounds.tsx      # Spotify-like music player
  │   ├── mini-music-player.tsx # Compact music player
  │   ├── stats-overview.tsx    # Statistics dashboard
  │   ├── achievement-badges.tsx # Achievement system
  │   ├── study-notes.tsx       # Notes feature
  │   ├── goals-page.tsx        # Goals manager
  │   ├── daily-quote.tsx       # Motivational quotes
  │   ├── settings-panel.tsx    # Settings and export
  │   ├── checklist-sidebar.tsx # ChatGPT-style sidebar
  │   ├── user-profile.tsx      # User profile dialog
  │   ├── leaderboard.tsx       # Leaderboard dialog
  │   ├── youtube-to-checklist.tsx # AI checklist generator
  │   ├── search-filter.tsx     # Search and filter
  │   └── confetti.tsx          # Celebration animations
  ├── hooks/
  │   ├── use-keyboard-shortcuts.ts  # Keyboard shortcuts
  │   └── use-pwa.ts                 # PWA hooks
  └── lib/
      ├── markdown-parser.ts    # Markdown parsing
      ├── study-types.ts        # Type definitions
      ├── study-context.tsx     # Study state management
      ├── view-context.tsx      # View settings context
      ├── checklist-store.tsx   # Checklist state
      ├── music-context.tsx     # Global music state with Media Session
      ├── models.ts             # MongoDB models
      ├── mongodb.ts            # Database connection
      └── utils.ts              # Utility functions

  public/
  ├── sounds/                   # 6 focus music MP3 files
  ├── icons/                    # PWA icons
  ├── manifest.json             # PWA manifest
  └── sw.js                     # Service worker
  ```

  ## 🎯 Ideal For

  - 📚 Students following course curriculums
  - 💻 Developers learning new technologies
  - 🏢 Professionals managing work tasks
  - 🎓 Anyone with structured learning or work goals
  - 📋 People who love markdown checklists
  - ⏱️ Anyone who uses Pomodoro technique
  - 🎵 People who need focus music while studying
  - 🏆 Gamification enthusiasts who love achievements
  - 📺 Learners who study from YouTube tutorials

  ## 🤝 Contributing

  Contributions are welcome! Please feel free to submit a Pull Request.

  ## 📄 License

  MIT License - feel free to use this project for personal or commercial purposes.

  ---

  Made with ❤️ for productive people everywhere

  **[Try StudyFlow Now →](https://study-flow-virid.vercel.app)**

