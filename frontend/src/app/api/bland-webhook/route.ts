import { NextRequest, NextResponse } from "next/server";

// In-memory store for webhook results
export const blandCallResults: any[] = [];

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    // Log the webhook data for now
    console.log("Bland AI Webhook received:", JSON.stringify(data, null, 2));
    // Store the webhook data in memory
    blandCallResults.push({ ...data, receivedAt: new Date().toISOString() });
    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid webhook payload." },
      { status: 400 }
    );
  }
}
