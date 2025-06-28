import { NextRequest, NextResponse } from "next/server";

const BLAND_API_KEY = process.env.BLAND_API_KEY;
const BLAND_API_URL = "https://api.bland.ai/v1/calls";

// Static list of venues for demo
const venues = [{ name: "Test Venue", phone: "+19805059936" }];

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { city, startDate, endDate, style, notes } = data;

    // Basic validation (optional)
    if (!city || !startDate || !endDate || !style) {
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

    // Webhook URL for Bland AI to notify us (update this if deployed)
    const webhook =
      "https://flexible-narwhal-suitably.ngrok-free.app/api/bland-webhook";

    // Call each venue with Bland AI
    const results = [];
    for (const venue of venues) {
      const prompt = `You are Walter, a friendly, professional booking agent for trytab, a groovy trance house and melodic techno/house DJ based in San Francisco. trytab will be in NYC from July 1–8 and is looking to book happy hour or early-evening sets at bars and clubs. 

trytab's sets are perfect for early evening — he builds energy slowly with danceable grooves, keeping the mood elevated without overwhelming the space. He shows up early, adapts to whatever the venue needs, and is happy to send over a 15-min sampler or past happy hour set so you can hear the vibe directly. The goal is to complement your space and help keep people staying for that second drink — all about that slow build that keeps people hanging out. It's totally fine if it's short notice — he's happy to fill a last-minute slot or do a guest set, no pressure. No expectations — Mani (trytab) just hasn't been in NYC in forever and loves playing there when he can, and we'd love to work with you if it fits!

Your goal is to convince NYC bars and clubs to book trytab for happy hour sets between July 1st and July 8th. If the venue is interested, collect an email or phone number to follow up with sample mixes and next steps.

Call Flow:
1. Introduction
- Introduce yourself as Walter, trytab's booking agent
- Explain you're reaching out about DJ bookings during happy hour for the week of July 1–8 while he's in NYC
2. Artist Description
- Pitch trytab's sound: "His style sits somewhere between groovy trance house and melodic techno/house — with touches of amapiano, sultry pop, desi influences, and uptempo stutter rhythms. It's a sound that builds energy without overpowering a space — great for early evening sets and transitions into the night."
- Mention his approach: builds energy slowly, keeps the mood elevated, adapts to the venue, and is all about helping people stay for that second drink.
3. Credibility and Context
- Mention he's based in SF, has played creative and curated events, and brings thoughtful energy to his sets
- Mention he's booking a few select happy hour slots while in NYC
- Mention he can send a 15-min sampler or past set if they want to hear the vibe
- Mention he's happy to fill a last-minute slot or do a guest set, no pressure
4. Ask for Interest
- Ask: "Would you be open to having him spin a set at your space during that week?"
- If they're unsure: Offer to send sample mixes or links via email or text
5. Close
- Ask: "What's the best email or number to send over a few sample sets and chat next steps?"
- Thank them for their time regardless of interest

Sample Dialogue:
You (Walter): Hi there — this is Walter calling on behalf of trytab, a groovy trance house and melodic techno DJ visiting from San Francisco. He'll be in NYC from July 1st through the 8th, and we're looking to line up a few happy hour sets at venues like yours. Would you be the right person to speak with about bookings?

If they ask about the music, say: His sound blends groovy trance house and melodic techno/house with some amapiano, sultry pop, and desi rhythms mixed in. It's super danceable but still vibey — great for building energy in early evening slots. He's all about building energy slowly, keeping the mood elevated, and making sure the vibe fits your space.

If they're interested, say: Awesome — if there's any interest, I'd love to send over a 15-min sampler or a past happy hour set so you can hear the vibe. Would email or text be better for that?

If they give a contact, thank them and say: Got it — thanks so much! I'll send over some links and we'll go from there. Appreciate your time!`;
      const payload = {
        phone_number: venue.phone,
        task: prompt,
        voice_id: "Estella",
        language: "eng",
        record: true,
        reduce_latency: true,
        ivr_mode: false,
        wait_for_greeting: true,
        max_duration: 300,
        webhook,
        first_sentence: `hey how's it going? am I speaking to someone at ${venue.name}?`,
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
        results.push({ venue: venue.name, status: blandRes.status, blandData });
      } catch (err) {
        console.error("Error calling Bland AI API:", err);
        results.push({ venue: venue.name, error: "Failed to initiate call." });
      }
    }

    return NextResponse.json({
      message: "Booking requests sent to venues!",
      results,
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
