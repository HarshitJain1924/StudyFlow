import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models";

// Helper to get or create user in MongoDB
async function getOrCreateUser(userId: string) {
  let user = await User.findOne({ clerkId: userId });
  
  if (!user) {
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

// GET - Fetch leaderboard
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "weekly"; // weekly, monthly, alltime
    const limit = parseInt(searchParams.get("limit") || "10");

    await connectToDatabase();

    let sortField: string;
    switch (type) {
      case "weekly":
        sortField = "totalStudyTime"; // Would need weekly calculation in production
        break;
      case "monthly":
        sortField = "totalStudyTime"; // Would need monthly calculation in production
        break;
      default:
        sortField = "totalStudyTime";
    }

    // Get top users with public profiles
    const leaderboard = await User.find({ "settings.isPublicProfile": true })
      .select("username firstName lastName imageUrl totalStudyTime currentStreak level xp badges")
      .sort({ [sortField]: -1 })
      .limit(limit);

    // Get current user's rank
    const allUsers = await User.find({ "settings.isPublicProfile": true })
      .select("clerkId totalStudyTime")
      .sort({ totalStudyTime: -1 });

    const userRank = allUsers.findIndex((u) => u.clerkId === userId) + 1;
    
    // Get or create current user
    const currentUserData = await getOrCreateUser(userId);

    return NextResponse.json({
      leaderboard: leaderboard.map((user, index) => ({
        rank: index + 1,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        totalStudyTime: user.totalStudyTime,
        currentStreak: user.currentStreak,
        level: user.level,
        xp: user.xp,
      })),
      userRank: userRank > 0 ? userRank : null,
      currentUser: currentUserData
        ? {
            username: currentUserData.username,
            firstName: currentUserData.firstName,
            lastName: currentUserData.lastName,
            imageUrl: currentUserData.imageUrl,
            totalStudyTime: currentUserData.totalStudyTime,
            currentStreak: currentUserData.currentStreak,
            level: currentUserData.level,
            xp: currentUserData.xp,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
