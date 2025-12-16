import mongoose, { Schema, Document, Model } from "mongoose";

// User Profile
export interface IUser extends Document {
  clerkId: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  bio?: string;
  totalStudyTime: number; // in seconds
  totalTasksCompleted: number;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate?: Date;
  level: number;
  xp: number;
  badges: string[];
  settings: {
    dailyGoal: number;
    weeklyGoal: number;
    soundEnabled: boolean;
    notificationsEnabled: boolean;
    theme: "light" | "dark" | "system";
    isPublicProfile: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    firstName: String,
    lastName: String,
    imageUrl: String,
    bio: { type: String, default: "" },
    totalStudyTime: { type: Number, default: 0 },
    totalTasksCompleted: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastStudyDate: Date,
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    badges: [{ type: String }],
    settings: {
      dailyGoal: { type: Number, default: 120 },
      weeklyGoal: { type: Number, default: 600 },
      soundEnabled: { type: Boolean, default: true },
      notificationsEnabled: { type: Boolean, default: true },
      theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
      isPublicProfile: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

// Checklist Model
export interface IChecklist extends Document {
  id: string;
  userId: string;
  title: string;
  emoji?: string;
  type: "markdown" | "quick";
  markdown?: string;
  youtubeUrls?: string[];
  sections: {
    id: string;
    title: string;
    emoji?: string;
    items: {
      id: string;
      text: string;
      completed: boolean;
      indent: number;
      children: unknown[];
    }[];
  }[];
  totalCompleted: number;
  totalItems: number;
  isShared: boolean;
  sharedWith: string[]; // clerkIds
  createdAt: Date;
  updatedAt: Date;
}

const ChecklistSchema = new Schema<IChecklist>(
  {
    id: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    emoji: String,
    type: { type: String, enum: ["markdown", "quick"], default: "quick" },
    markdown: String,
    youtubeUrls: [{ type: String }],
    sections: [
      {
        id: String,
        title: String,
        emoji: String,
        items: [
          {
            id: String,
            text: String,
            completed: Boolean,
            indent: Number,
            children: Schema.Types.Mixed,
          },
        ],
      },
    ],
    totalCompleted: { type: Number, default: 0 },
    totalItems: { type: Number, default: 0 },
    isShared: { type: Boolean, default: false },
    sharedWith: [{ type: String }],
  },
  { timestamps: true }
);

// Goal Model
export interface IGoal extends Document {
  userId: string;
  title: string;
  type: "daily" | "weekly" | "monthly" | "custom";
  targetMinutes: number;
  emoji?: string;
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    type: { type: String, enum: ["daily", "weekly", "monthly", "custom"], required: true },
    targetMinutes: { type: Number, required: true },
    emoji: String,
    deadline: Date,
  },
  { timestamps: true }
);

// Study Session Model
export interface IStudySession extends Document {
  userId: string;
  type: "pomodoro" | "stopwatch";
  duration: number; // in seconds
  tasksCompleted: number;
  date: Date;
  notes?: string;
}

const StudySessionSchema = new Schema<IStudySession>(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ["pomodoro", "stopwatch"], required: true },
    duration: { type: Number, required: true },
    tasksCompleted: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
    notes: String,
  },
  { timestamps: true }
);

// Study Group Model
export interface IStudyGroup extends Document {
  name: string;
  description?: string;
  emoji?: string;
  ownerId: string;
  members: {
    clerkId: string;
    role: "owner" | "admin" | "member";
    joinedAt: Date;
  }[];
  isPublic: boolean;
  inviteCode?: string;
  weeklyGoal?: number;
  createdAt: Date;
  updatedAt: Date;
}

const StudyGroupSchema = new Schema<IStudyGroup>(
  {
    name: { type: String, required: true },
    description: String,
    emoji: { type: String, default: "📚" },
    ownerId: { type: String, required: true },
    members: [
      {
        clerkId: { type: String, required: true },
        role: { type: String, enum: ["owner", "admin", "member"], default: "member" },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    isPublic: { type: Boolean, default: false },
    inviteCode: String,
    weeklyGoal: Number,
  },
  { timestamps: true }
);

// Notes Model
export interface INote extends Document {
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    content: { type: String, default: "" },
  },
  { timestamps: true }
);

// Export models (handle hot reload in development)
export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export const Checklist: Model<IChecklist> =
  mongoose.models.Checklist || mongoose.model<IChecklist>("Checklist", ChecklistSchema);

export const Goal: Model<IGoal> =
  mongoose.models.Goal || mongoose.model<IGoal>("Goal", GoalSchema);

export const StudySession: Model<IStudySession> =
  mongoose.models.StudySession || mongoose.model<IStudySession>("StudySession", StudySessionSchema);

export const StudyGroup: Model<IStudyGroup> =
  mongoose.models.StudyGroup || mongoose.model<IStudyGroup>("StudyGroup", StudyGroupSchema);

export const Note: Model<INote> =
  mongoose.models.Note || mongoose.model<INote>("Note", NoteSchema);
