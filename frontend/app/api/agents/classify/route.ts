/**
 * Agent 1 — Vision Classification Agent
 * Sends image to Flask ML API (primary=HuggingFace, secondary=torchvision),
 * runs ensemble logic, returns classificationResult.
 */

import { NextRequest, NextResponse } from "next/server";

const FLASK_API_URL = process.env.FLASK_API_URL || "http://localhost:5000";

// Keys match HuggingFace model id2label exactly
const LABEL_METADATA: Record<string, { cleanDiseaseName: string; isHealthy: boolean }> = {
  "Apple Scab":                                              { cleanDiseaseName: "Apple Scab",             isHealthy: false },
  "Apple with Black Rot":                                    { cleanDiseaseName: "Black Rot",              isHealthy: false },
  "Cedar Apple Rust":                                        { cleanDiseaseName: "Cedar Apple Rust",       isHealthy: false },
  "Healthy Apple":                                           { cleanDiseaseName: "Healthy",                isHealthy: true  },
  "Healthy Blueberry Plant":                                 { cleanDiseaseName: "Healthy",                isHealthy: true  },
  "Cherry with Powdery Mildew":                              { cleanDiseaseName: "Powdery Mildew",         isHealthy: false },
  "Healthy Cherry Plant":                                    { cleanDiseaseName: "Healthy",                isHealthy: true  },
  "Corn (Maize) with Cercospora and Gray Leaf Spot":         { cleanDiseaseName: "Gray Leaf Spot",         isHealthy: false },
  "Corn (Maize) with Common Rust":                           { cleanDiseaseName: "Common Rust",            isHealthy: false },
  "Corn (Maize) with Northern Leaf Blight":                  { cleanDiseaseName: "Northern Leaf Blight",  isHealthy: false },
  "Healthy Corn (Maize) Plant":                              { cleanDiseaseName: "Healthy",                isHealthy: true  },
  "Grape with Black Rot":                                    { cleanDiseaseName: "Black Rot",              isHealthy: false },
  "Grape with Esca (Black Measles)":                         { cleanDiseaseName: "Esca (Black Measles)",   isHealthy: false },
  "Grape with Isariopsis Leaf Spot":                         { cleanDiseaseName: "Leaf Blight",            isHealthy: false },
  "Healthy Grape Plant":                                     { cleanDiseaseName: "Healthy",                isHealthy: true  },
  "Orange with Citrus Greening":                             { cleanDiseaseName: "Citrus Greening (HLB)",  isHealthy: false },
  "Peach with Bacterial Spot":                               { cleanDiseaseName: "Bacterial Spot",         isHealthy: false },
  "Healthy Peach Plant":                                     { cleanDiseaseName: "Healthy",                isHealthy: true  },
  "Bell Pepper with Bacterial Spot":                         { cleanDiseaseName: "Bacterial Spot",         isHealthy: false },
  "Healthy Bell Pepper Plant":                               { cleanDiseaseName: "Healthy",                isHealthy: true  },
  "Potato with Early Blight":                                { cleanDiseaseName: "Early Blight",           isHealthy: false },
  "Potato with Late Blight":                                 { cleanDiseaseName: "Late Blight",            isHealthy: false },
  "Healthy Potato Plant":                                    { cleanDiseaseName: "Healthy",                isHealthy: true  },
  "Healthy Raspberry Plant":                                 { cleanDiseaseName: "Healthy",                isHealthy: true  },
  "Healthy Soybean Plant":                                   { cleanDiseaseName: "Healthy",                isHealthy: true  },
  "Squash with Powdery Mildew":                              { cleanDiseaseName: "Powdery Mildew",         isHealthy: false },
  "Strawberry with Leaf Scorch":                             { cleanDiseaseName: "Leaf Scorch",            isHealthy: false },
  "Healthy Strawberry Plant":                                { cleanDiseaseName: "Healthy",                isHealthy: true  },
  "Tomato with Bacterial Spot":                              { cleanDiseaseName: "Bacterial Spot",         isHealthy: false },
  "Tomato with Early Blight":                                { cleanDiseaseName: "Early Blight",           isHealthy: false },
  "Tomato with Late Blight":                                 { cleanDiseaseName: "Late Blight",            isHealthy: false },
  "Tomato with Leaf Mold":                                   { cleanDiseaseName: "Leaf Mold",              isHealthy: false },
  "Tomato with Septoria Leaf Spot":                          { cleanDiseaseName: "Septoria Leaf Spot",     isHealthy: false },
  "Tomato with Spider Mites or Two-spotted Spider Mite":     { cleanDiseaseName: "Spider Mites",           isHealthy: false },
  "Tomato with Target Spot":                                 { cleanDiseaseName: "Target Spot",            isHealthy: false },
  "Tomato Yellow Leaf Curl Virus":                           { cleanDiseaseName: "Yellow Leaf Curl Virus", isHealthy: false },
  "Tomato Mosaic Virus":                                     { cleanDiseaseName: "Mosaic Virus",           isHealthy: false },
  "Healthy Tomato Plant":                                    { cleanDiseaseName: "Healthy",                isHealthy: true  },
};

function mapHealthLevel(isHealthy: boolean, confidence: number, label: string): string {
  if (isHealthy) return "Healthy";
  const lower = label.toLowerCase();
  const severe = ["late blight", "virus", "mosaic", "curl", "greening", "esca"];
  if (severe.some((kw) => lower.includes(kw)) && confidence >= 0.70) return "Severely Affected";
  if (confidence >= 0.85) return "Severely Affected";
  if (confidence >= 0.70) return "Moderately Affected";
  return "Mildly Affected";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image } = body;
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // ── Call Flask ML API ──────────────────────────────────────────────────
    let flaskResponse: Response;
    try {
      flaskResponse = await fetch(`${FLASK_API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
        signal: AbortSignal.timeout(60_000),
      });
    } catch {
      return NextResponse.json(
        { error: "Analysis server is offline. Please start the Flask API." },
        { status: 503 }
      );
    }

    if (!flaskResponse.ok) {
      const detail = await flaskResponse.text().catch(() => "");
      return NextResponse.json({ error: "Flask API error", detail }, { status: 502 });
    }

    const flaskData = await flaskResponse.json();
    const { primary, secondary, inference_time_ms } = flaskData;

    if (!primary) {
      return NextResponse.json({ error: "Primary model failed inference." }, { status: 500 });
    }

    // ── Ensemble: primary (HuggingFace) is authoritative ─────────────────
    // If secondary agrees (after mapping), boost confidence slightly
    let finalLabel: string = primary.label;
    let finalConfidence: number = primary.confidence;

    if (secondary) {
      // Secondary uses old-style labels; just use its confidence to modulate
      // If both models agree on healthy vs. diseased, average confidences
      const primaryMeta = LABEL_METADATA[primary.label];
      const secondaryIsHealthy = secondary.label.toLowerCase().includes("healthy");
      if (primaryMeta && primaryMeta.isHealthy === secondaryIsHealthy) {
        finalConfidence = (primary.confidence * 0.7 + secondary.confidence * 0.3);
      }
    }

    let confidenceFlag: "high" | "moderate" | "low" = "high";
    if (finalConfidence < 0.60) confidenceFlag = "low";
    else if (finalConfidence < 0.85) confidenceFlag = "moderate";

    // ── Metadata lookup ───────────────────────────────────────────────────
    const meta = LABEL_METADATA[finalLabel] ?? {
      cleanDiseaseName: finalLabel,
      isHealthy: finalLabel.toLowerCase().includes("healthy"),
    };

    const healthLevel = mapHealthLevel(meta.isHealthy, finalConfidence, finalLabel);

    return NextResponse.json({
      rawLabel: finalLabel,
      cleanDiseaseName: meta.cleanDiseaseName,
      isHealthy: meta.isHealthy,
      healthLevel,
      confidence: Math.round(finalConfidence * 100),
      confidenceFlag,
      inference_time_ms: inference_time_ms ?? null,
      models: { primary, secondary: secondary ?? null },
    });
  } catch (err) {
    console.error("[classify agent]", err);
    return NextResponse.json({ error: "Internal error in classify agent" }, { status: 500 });
  }
}
