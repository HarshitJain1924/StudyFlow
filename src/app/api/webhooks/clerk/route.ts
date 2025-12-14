import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models";

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occurred -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!WEBHOOK_SECRET) {
    console.error("Missing CLERK_WEBHOOK_SECRET");
    return new Response("Error occurred -- missing webhook secret", {
      status: 500,
    });
  }

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occurred", {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, username, first_name, last_name, image_url } = evt.data;

    try {
      await connectToDatabase();

      // Generate username if not provided
      const generatedUsername = username || 
        email_addresses[0]?.email_address?.split("@")[0] || 
        `user_${id.slice(-8)}`;

      const newUser = new User({
        clerkId: id,
        email: email_addresses[0]?.email_address,
        username: generatedUsername,
        firstName: first_name,
        lastName: last_name,
        imageUrl: image_url,
      });
      await newUser.save();

      return NextResponse.json({ message: "User created" }, { status: 201 });
    } catch (error) {
      console.error("Error creating user:", error);
      return NextResponse.json({ error: "Error creating user" }, { status: 500 });
    }
  }

  if (eventType === "user.updated") {
    const { id, email_addresses, username, first_name, last_name, image_url } = evt.data;

    try {
      await connectToDatabase();

      await User.findOneAndUpdate(
        { clerkId: id },
        {
          email: email_addresses[0]?.email_address,
          username: username || undefined,
          firstName: first_name,
          lastName: last_name,
          imageUrl: image_url,
        }
      );

      return NextResponse.json({ message: "User updated" }, { status: 200 });
    } catch (error) {
      console.error("Error updating user:", error);
      return NextResponse.json({ error: "Error updating user" }, { status: 500 });
    }
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;

    try {
      await connectToDatabase();
      await User.findOneAndDelete({ clerkId: id });

      return NextResponse.json({ message: "User deleted" }, { status: 200 });
    } catch (error) {
      console.error("Error deleting user:", error);
      return NextResponse.json({ error: "Error deleting user" }, { status: 500 });
    }
  }

  return NextResponse.json({ message: "Webhook received" }, { status: 200 });
}
