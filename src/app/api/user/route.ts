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

// GET - Fetch user profile
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

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update user profile
export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    await connectToDatabase();

    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
