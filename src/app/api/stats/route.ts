import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User, StudySession } from "@/lib/models";

// Helper to get or create user in MongoDB
async function getOrCreateUser(userId: string) {
  let user = await User.findOne({ clerkId: userId });
  
  if (!user) {
    // User doesn't exist in MongoDB, create from Clerk data
    const clerkUser = await currentUser();
    if (clerkUser) {
      const username = clerkUser.username || 
        clerkUser.emailAddresses[0]?.emailAddress?.split("@")[0] || 
        `user_${userId.slice(-8)}`;
      
      user = new User({
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || `${userId}@temp.com`,
        username: username,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
      });
      await user.save();
    }
  }
  
  return user;
}

// GET - Fetch user stats and leaderboard position
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const user = await getOrCreateUser(userId);

    if (!user) {
      return NextResponse.json({ error: "Could not create user" }, { status: 500 });
    }

    // Get recent sessions
    const recentSessions = await StudySession.find({ userId })
      .sort({ date: -1 })
      .limit(30);

    // Calculate weekly data
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyData = await StudySession.aggregate([
      {
        $match: {
          userId,
          date: { $gte: weekAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          minutes: { $sum: { $divide: ["$duration", 60] } },
          tasks: { $sum: "$tasksCompleted" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return NextResponse.json({
      totalStudyTime: user.totalStudyTime,
      totalTasksCompleted: user.totalTasksCompleted,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      level: user.level,
      xp: user.xp,
      badges: user.badges,
      weeklyData: weeklyData.map((d) => ({
        date: d._id,
        minutes: Math.round(d.minutes),
        tasks: d.tasks,
      })),
      recentSessions,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Log study session
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    await connectToDatabase();

    // Create study session
    const session = await StudySession.create({
      ...body,
      userId,
    });

    // Update user stats
    const user = await User.findOne({ clerkId: userId });
    if (user) {
      const today = new Date().toDateString();
      const lastStudy = user.lastStudyDate?.toDateString();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

      let newStreak = user.currentStreak;
      if (lastStudy === yesterday) {
        newStreak += 1;
      } else if (lastStudy !== today) {
        newStreak = 1;
      }

      // Calculate XP (1 XP per minute studied)
      const xpGained = Math.floor(body.duration / 60);
      const newXp = user.xp + xpGained;
      const newLevel = Math.floor(newXp / 1000) + 1; // Level up every 1000 XP

      await User.findOneAndUpdate(
        { clerkId: userId },
        {
          $inc: {
            totalStudyTime: body.duration,
            totalTasksCompleted: body.tasksCompleted || 0,
          },
          $set: {
            currentStreak: newStreak,
            longestStreak: Math.max(user.longestStreak, newStreak),
            lastStudyDate: new Date(),
            xp: newXp,
            level: newLevel,
          },
        }
      );
    }

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error("Error logging session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Sync stats from local storage
export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await request.json();
    await connectToDatabase();

    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        $set: {
          totalStudyTime: stats.totalStudyTime || 0,
          totalTasksCompleted: stats.totalTasksCompleted || 0,
          currentStreak: stats.currentStreak || 0,
          longestStreak: stats.longestStreak || 0,
          lastStudyDate: stats.lastStudyDate ? new Date(stats.lastStudyDate) : undefined,
        },
      },
      { new: true }
    );

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error syncing stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
