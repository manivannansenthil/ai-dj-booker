import { NextRequest, NextResponse } from "next/server";

const BLAND_API_KEY = process.env.BLAND_API_KEY;
const BLAND_API_URL = "https://api.bland.ai/v1/calls";

// Static list of venues for demo
const venues = [{ name: "your mom's", phone: "+19805059936" }];

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { venue, startDate, endDate, style, notes } = data;

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
      const prompt = `Speak naturally, like a real person. Use a friendly, casual tone, contractions, and natural pauses. Add small talk if it feels right.\n\nHey! This is Walter, trytab's booking agent. Hope your day's going well. I'm reaching out because trytab—a groovy trance house and melodic techno DJ from San Francisco—is in town from ${startDate} to ${endDate}, and we're hoping to line up a few happy hour sets at places like ${venue}.\n\nHis vibe is super chill—think groovy trance house, melodic techno, a little amapiano, sultry pop, and desi rhythms. It's all about building energy slowly, keeping the mood up, but never overpowering the space. Perfect for early evenings, happy hours, or that transition into the night.\n\nHe's played all sorts of creative events back in SF, always shows up early, and adapts to whatever you need. If you're interested, I can send over a 15-min sampler or a past happy hour set so you can hear the vibe.\n\nNo pressure at all—he just hasn't been in ${venue} in forever and loves playing here when he can. Even if it's last minute or just a guest slot, we'd love to work with you if it fits!\n\nWould you be open to having him spin a set at your space during that week? If you're not sure, I can send over some mixes or links—whatever's easiest. What's the best email or number to send a few sample sets and chat next steps?\n\nThanks so much for your time!${
        notes ? `\n\nExtra info: ${notes}` : ""
      }`;
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
