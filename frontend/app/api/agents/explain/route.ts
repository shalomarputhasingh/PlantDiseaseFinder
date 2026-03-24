/**
 * Agent 2 — Explanation Agent
 * Converts raw classification result into human-friendly explanation via OpenRouter.
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Plant Health AI",
  },
});

const SYSTEM_PROMPT = `You are a friendly and knowledgeable agricultural assistant helping farmers,
students, and everyday users understand their plant's health.

You receive a structured classification result from an ML model.
Your job is to produce a JSON response with exactly these fields:
- explanation: A short, clear explanation of the plant's condition (2–3 sentences max)
- symptoms: An array of 2–4 primary visual symptoms the disease causes (strings)
- immediateAction: One immediate action the user should take (1 sentence)

Rules:
- Never use scientific jargon. Write at the level of a non-expert farmer.
- Be empathetic and practical. If the plant is healthy, celebrate it.
- If language is Tamil, respond entirely in natural Tamil. Not word-for-word translation. Natural, conversational Tamil.
- Never say "the model detected" — speak as if you examined the leaf yourself.
- Keep explanation under 80 words total.
- Return ONLY valid JSON — no markdown, no extra text.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { classificationResult, language = "en" } = body;

    if (!classificationResult) {
      return NextResponse.json({ error: "No classification result provided" }, { status: 400 });
    }

    const { plantName, cleanDiseaseName, isHealthy, healthLevel, confidence, confidenceFlag } = classificationResult;

    const userMessage = `
Plant: ${plantName}
Condition: ${cleanDiseaseName}
Health Level: ${healthLevel}
Is Healthy: ${isHealthy}
Confidence: ${confidence}%
Confidence Flag: ${confidenceFlag}
Language: ${language === "ta" ? "Tamil" : "English"}

Please provide the explanation, symptoms list, and immediate action in ${language === "ta" ? "Tamil" : "English"}.
Return ONLY valid JSON with fields: explanation (string), symptoms (string[]), immediateAction (string), language (string).
    `.trim();

    const completion = await openrouter.chat.completions.create({
      model: "meta-llama/llama-3.2-11b-vision-instruct",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 400,
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    // Extract JSON even if model wraps it in markdown fences
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[explain agent] No JSON in response:", raw);
      return NextResponse.json({ error: "Could not parse explanation response" }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ ...parsed, language });
  } catch (err) {
    console.error("[explain agent]", err);
    return NextResponse.json({ error: "Explanation agent failed" }, { status: 500 });
  }
}
