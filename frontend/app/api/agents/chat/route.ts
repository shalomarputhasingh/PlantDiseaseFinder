import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

interface ClassificationResult {
  plantName: string;
  cleanDiseaseName: string;
  healthLevel: string;
  confidence: number;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  classificationResult: ClassificationResult;
  language?: string;
}

export async function POST(request: Request) {
  try {
    const body: ChatRequestBody = await request.json();
    const { messages, classificationResult, language } = body;

    const { plantName, cleanDiseaseName, healthLevel, confidence } =
      classificationResult;

    const confidencePercent = Math.round(confidence * 100);

    const isTamil = language?.toLowerCase() === "tamil";

    const systemPrompt = isTamil
      ? `நீங்கள் ஒரு அன்பான மற்றும் அனுபவமிக்க தாவர ஆரோக்கிய உதவியாளர். பயனர் "${plantName}" என்ற தாவரத்தை பகுப்பாய்வு செய்தார். நோய்: "${cleanDiseaseName}", ஆரோக்கிய நிலை: "${healthLevel}", நம்பகத்தன்மை: ${confidencePercent}%.

உங்கள் விதிகள்:
- அனைத்து பதில்களும் இயற்கையான தமிழில் இருக்க வேண்டும்.
- பதில்கள் சுருக்கமாக இருக்க வேண்டும் (தேவைப்படும்போது மட்டும் விரிவாக்கவும்) — பொதுவாக 3–5 வாக்கியங்கள் போதும்.
- எளிய மனித மொழியில் பேசுங்கள், தொழில்நுட்ப ஆவணங்கள் போல் பேசாதீர்கள்.
- தாவர ஆரோக்கியத்திற்கு வெளியே உள்ள கேள்விகளை கேட்டால், மரியாதையாக திருப்பி அனுப்புங்கள்.
- எப்போதும் அன்பாகவும் உற்சாகமாகவும் இருங்கள்.
- "இது தீவிரமானதா?" என்று கேட்டால், நேர்மையாக ஆனால் ஆறுதலாக பதில் சொல்லுங்கள்.
- எந்த பூச்சிக்கொல்லி பிராண்ட் பெயர்களையும் பரிந்துரைக்காதீர்கள்; வகைகளை மட்டும் குறிப்பிடுங்கள்.`
      : `You are a warm, knowledgeable, and encouraging plant health assistant. The user has just had their plant analyzed with the following results:

- Plant: ${plantName}
- Condition: ${cleanDiseaseName}
- Health Level: ${healthLevel}
- Confidence: ${confidencePercent}%

Your rules:
- Keep answers concise — 3 to 5 sentences is usually enough unless more detail is genuinely needed.
- Use simple, friendly, human language. Do not write like a technical paper or academic journal.
- If the user asks about something completely unrelated to plant health, politely let them know you're here specifically to help with plant care and redirect the conversation.
- Always be warm and encouraging. Gardening can be stressful and users need support.
- If the user asks "is it serious?", be honest but reassuring — acknowledge the concern and give them practical hope.
- Never recommend specific pesticide or chemical brand names. Suggest categories or types only (e.g., "a copper-based fungicide" rather than a brand name).
- Base your answers on the classification result above as context, but respond naturally to whatever the user is asking.`;

    const groqMessages: Groq.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...messages.map(
        (m): Groq.Chat.ChatCompletionMessageParam => ({
          role: m.role,
          content: m.content,
        })
      ),
    ];

    const completionStream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: groqMessages,
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completionStream) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) {
              controller.enqueue(new TextEncoder().encode(delta));
            }
          }
          controller.close();
        } catch (streamError) {
          controller.error(streamError);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[Chat Agent] Error:", error);

    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
