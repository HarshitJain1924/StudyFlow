import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Note } from "@/lib/models";

// GET - Fetch user notes
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const note = await Note.findOne({ userId });

    return NextResponse.json({ content: note?.content || "" });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Save/update user notes
export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content } = await request.json();
    await connectToDatabase();

    const note = await Note.findOneAndUpdate(
      { userId },
      { content },
      { new: true, upsert: true }
    );

    return NextResponse.json({ content: note.content });
  } catch (error) {
    console.error("Error saving notes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
