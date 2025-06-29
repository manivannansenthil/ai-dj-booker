import { NextRequest, NextResponse } from "next/server";

const BLAND_API_KEY = process.env.BLAND_API_KEY;
const BLAND_API_URL = "https://api.bland.ai/v1/calls";

// Static list of venues for demo
const venues = [{ name: "arcana", phone: "+19805059936" }];

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { venue, startDate, endDate, style, notes, agentName } = data;

    // Basic validation (optional)
    if (!venue || !startDate || !endDate || !style) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    if (!BLAND_API_KEY) {
      console.log("BLAND_API_KEY: NOT FOUND");
      return NextResponse.json(
        { error: "Bland AI API key not set." },
        { status: 500 }
      );
    } else {
      console.log("BLAND_API_KEY: Loaded");
    }

    // Webhook URL for Bland AI to notify us (production)
    const webhook = "https://ai-dj-booker.vercel.app/api/bland-webhook";

    // Call each venue with Bland AI
    const results = [];
    for (const venueObj of venues) {
      // Use form data to personalize the prompt and first sentence
      const prompt = `Speak naturally, like a real person. Use a friendly, casual tone, contractions, and natural pauses. Add small talk if it feels right.\n\nHey!${
        agentName ? ` This is ${agentName},` : ""
      } Hope your day's going well. I'm reaching out because I'm helping organize music for some happy hour sets at places like ${venue} between ${startDate} and ${endDate}.\n\n$${
        notes
          ? notes
          : "If you have any questions or need more info, let me know!"
      }\n\nWould you be open to having a DJ spin a set at your space during that week? If you're not sure, I can send over some mixes or links—whatever's easiest. What's the best email or number to send a few sample sets and chat next steps?\n\nThanks so much for your time!`;
      const payload = {
        phone_number: venueObj.phone,
        task: prompt,
        voice_id: "Estella",
        language: "eng",
        record: true,
        reduce_latency: true,
        ivr_mode: false,
        wait_for_greeting: true,
        max_duration: 300,
        webhook,
        first_sentence: `Hey! How's it going? Am I speaking to someone at ${venueObj.name}?`,
      };
      try {
        const blandRes = await fetch(BLAND_API_URL, {
          method: "POST",
          headers: {
            authorization: BLAND_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        const blandData = await blandRes.json();
        console.log("Bland AI API call status:", blandRes.status);
        console.log(
          "Bland AI API call response:",
          JSON.stringify(blandData, null, 2)
        );
        results.push({
          venue: venueObj.name,
          status: blandRes.status,
          blandData,
        });
      } catch (err) {
        console.error("Error calling Bland AI API:", err);
        results.push({
          venue: venueObj.name,
          error: "Failed to initiate call.",
        });
      }
    }

    return NextResponse.json({
      message: "Booking requests sent to venues!",
      results,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
