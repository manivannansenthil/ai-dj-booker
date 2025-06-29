import { NextRequest, NextResponse } from "next/server";

const BLAND_API_KEY = process.env.BLAND_API_KEY;
const BLAND_API_URL = "https://api.bland.ai/v1/calls";

// Static list of venues for demo
const venues = [{ name: "arcana", phone: "+19805059936" }];

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const {
      venue,
      startDate,
      endDate,
      style,
      notes,
      agentName,
      talentName,
      testCall,
      testPhoneNumber,
    } = data;

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

    const results = [];
    if (testCall && testPhoneNumber) {
      // Test call to user's phone
      const prompt = `This is a test call for your booking request. Please speak as naturally as possible, with warmth and genuine enthusiasm. Use a friendly, persuasive, and conversational tone.\n\nHi there!${
        agentName ? ` This is ${agentName},` : ""
      } I hope your day's going well. I'm reaching out because I'm helping book a talented DJ named ${talentName} for some happy hour sets at places like ${venue} between ${startDate} and ${endDate}.\n\n${talentName} is truly special and brings an amazing energy to every event. I genuinely believe they'd be a perfect fit for your space and your crowd. ${
        notes
          ? notes
          : "If you have any questions or need more info, let me know!"
      }\n\nWould you be open to having ${talentName} perform at your venue during that week? I can send over some mixes or links—whatever's easiest. What's the best email or number to send a few sample sets and chat next steps?\n\nThank you so much for your time!`;
      const payload = {
        phone_number: testPhoneNumber,
        task: prompt,
        voice_id: "Samantha",
        language: "eng",
        record: true,
        reduce_latency: true,
        ivr_mode: false,
        wait_for_greeting: true,
        max_duration: 300,
        webhook,
        first_sentence: `Hi! This is a test call for your booking request. Am I speaking to you?`,
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
        results.push({
          venue: "Test Call",
          status: blandRes.status,
          blandData,
        });
      } catch {
        results.push({
          venue: "Test Call",
          error: "Failed to initiate test call.",
        });
      }
    } else {
      for (const venueObj of venues) {
        // Use form data to personalize the prompt and first sentence
        const prompt = `Please speak as naturally as possible, with warmth and genuine enthusiasm. Use a friendly, persuasive, and conversational tone.\n\nHi there!${
          agentName ? ` This is ${agentName},` : ""
        } I hope your day's going well. I'm reaching out because I'm helping book a talented DJ named ${talentName} for some happy hour sets at places like ${venue} between ${startDate} and ${endDate}.\n\n${talentName} is truly special and brings an amazing energy to every event. I genuinely believe they'd be a perfect fit for your space and your crowd. ${
          notes
            ? notes
            : "If you have any questions or need more info, let me know!"
        }\n\nWould you be open to having ${talentName} perform at your venue during that week? I can send over some mixes or links—whatever's easiest. What's the best email or number to send a few sample sets and chat next steps?\n\nThank you so much for your time!`;
        const payload = {
          phone_number: venueObj.phone,
          task: prompt,
          voice_id: "Samantha",
          language: "eng",
          record: true,
          reduce_latency: true,
          ivr_mode: false,
          wait_for_greeting: true,
          max_duration: 300,
          webhook,
          first_sentence: `Hi! Am I speaking to someone at ${venue}?`,
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
          results.push({
            venue: venue,
            status: blandRes.status,
            blandData,
          });
        } catch {
          results.push({
            venue: venue,
            error: "Failed to initiate call.",
          });
        }
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
