import { NextRequest, NextResponse } from "next/server";
import { blandCallResults } from "../bland-memory";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    // Log the webhook data for now
    console.log("Bland AI Webhook received:", JSON.stringify(data, null, 2));
    // Extract email/phone if present
    const contactInfo = {};
    if (data.entities) {
      if (data.entities.email) contactInfo.email = data.entities.email;
      if (data.entities.phone) contactInfo.phone = data.entities.phone;
    }
    if (data.email) contactInfo.email = data.email;
    if (data.phone) contactInfo.phone = data.phone;
    // Store the webhook data in memory, including contact info if found
    blandCallResults.push({
      ...data,
      ...contactInfo,
      receivedAt: new Date().toISOString(),
    });
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid webhook payload." },
      { status: 400 }
    );
  }
}
