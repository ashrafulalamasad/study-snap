import { NextRequest, NextResponse } from "next/server";

const DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL";

export async function POST(request: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ElevenLabs is not configured. Add ELEVENLABS_API_KEY to .env." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const language = body.language === "bn" ? "bn" : "en";

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }
    if (text.length > 12_000) {
      return NextResponse.json({ error: "Text is too long" }, { status: 413 });
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: language === "bn" ? "eleven_multilingual_v2" : "eleven_multilingual_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    );

    if (!response.ok) {
      console.error("[tts] ElevenLabs returned", response.status);
      return NextResponse.json(
        { error: "Text-to-speech is temporarily unavailable." },
        { status: 502 }
      );
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    console.error(
      "[tts] Request failed:",
      error instanceof Error ? error.message : "unknown error"
    );
    return NextResponse.json(
      { error: "Text-to-speech is temporarily unavailable." },
      { status: 502 }
    );
  }
}
