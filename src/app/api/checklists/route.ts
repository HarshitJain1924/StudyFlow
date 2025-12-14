import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Checklist } from "@/lib/models";

// GET - Fetch all checklists for user
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const checklists = await Checklist.find({
      $or: [{ userId }, { sharedWith: userId }],
    }).sort({ updatedAt: -1 });

    return NextResponse.json(checklists);
  } catch (error) {
    console.error("Error fetching checklists:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create new checklist
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    await connectToDatabase();

    const checklist = await Checklist.create({
      ...body,
      userId,
    });

    return NextResponse.json(checklist, { status: 201 });
  } catch (error) {
    console.error("Error creating checklist:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Sync all checklists (bulk update)
export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { checklists } = await request.json();
    await connectToDatabase();

    // Delete existing checklists and replace with new ones
    await Checklist.deleteMany({ userId });
    
    if (checklists && checklists.length > 0) {
      const checklistsWithUser = checklists.map((c: Record<string, unknown>) => ({
        ...c,
        userId,
      }));
      await Checklist.insertMany(checklistsWithUser);
    }

    const updatedChecklists = await Checklist.find({ userId }).sort({ updatedAt: -1 });
    return NextResponse.json(updatedChecklists);
  } catch (error) {
    console.error("Error syncing checklists:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
