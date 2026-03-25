"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ImageUpload from "@/components/ImageUpload";
import HealthBadge from "@/components/HealthBadge";
import ResultCard from "@/components/ResultCard";
import ChatPanel from "@/components/ChatPanel";
import LanguageToggle from "@/components/LanguageToggle";

// ─── Types ────────────────────────────────────────────────────────────────────

type PageState = "idle" | "analyzing" | "results";

interface ClassificationResult {
  rawLabel: string;
  plantName: string;
  cleanDiseaseName: string;
  isHealthy: boolean;
  healthLevel: "Healthy" | "Mildly Affected" | "Moderately Affected" | "Severely Affected";
  confidence: number;
  confidenceFlag: "high" | "moderate" | "low";
  inference_time_ms: number | null;
}

interface ExplanationResult {
  explanation: string;
  symptoms: string[];
  immediateAction: string;
  language: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LOADING_MESSAGES = [
  "Reading leaf patterns...",
  "Running AI analysis...",
  "Checking both models...",
  "Preparing your report...",
  "Almost there...",
];

// ─── Page Component ───────────────────────────────────────────────────────────

export default function AnalyzePage() {
  // State
  const [pageState, setPageState] = useState<PageState>("idle");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [language, setLanguage] = useState<"en" | "ta">("en");

  useEffect(() => {
    const saved = localStorage.getItem("plant-ai-language");
    if (saved === "en" || saved === "ta") setLanguage(saved);
  }, []);
  const [classification, setClassification] = useState<ClassificationResult | null>(null);
  const [explanation, setExplanation] = useState<ExplanationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>(LOADING_MESSAGES[0]);

  // Refs
  const msgIndexRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Rotating status messages while analyzing ────────────────────────────────
  useEffect(() => {
    if (pageState === "analyzing") {
      msgIndexRef.current = 0;
      setStatusMessage(LOADING_MESSAGES[0]);

      intervalRef.current = setInterval(() => {
        msgIndexRef.current = (msgIndexRef.current + 1) % LOADING_MESSAGES.length;
        setStatusMessage(LOADING_MESSAGES[msgIndexRef.current]);
      }, 1500);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [pageState]);

  // ── Analysis handler ────────────────────────────────────────────────────────
  async function handleAnalyze() {
    if (!imageBase64) return;
    setPageState("analyzing");
    setError(null);

    try {
      // Step 1: classify
      const classifyRes = await fetch("/api/agents/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageBase64 }),
      });
      if (!classifyRes.ok) {
        const err = await classifyRes.json();
        const detail = err.detail ? ` — ${err.detail}` : "";
        throw new Error((err.error || "Classification failed") + detail);
      }
      const classResult: ClassificationResult = await classifyRes.json();
      setClassification(classResult);

      // Step 2: explain
      const explainRes = await fetch("/api/agents/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classificationResult: classResult, language }),
      });
      const explResult: ExplanationResult = explainRes.ok ? await explainRes.json() : null;
      setExplanation(explResult);

      setPageState("results");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      setError(message);
      setPageState("idle");
    }
  }

  // ── Reset handler ───────────────────────────────────────────────────────────
  function handleReset() {
    setPageState("idle");
    setImageBase64(null);
    setImagePreview(null);
    setClassification(null);
    setExplanation(null);
    setError(null);
  }

  // ── Language change handler ─────────────────────────────────────────────────
  async function handleLanguageChange(lang: "en" | "ta") {
    setLanguage(lang);
    localStorage.setItem("plant-ai-language", lang);

    if (pageState === "results" && classification) {
      try {
        const explainRes = await fetch("/api/agents/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ classificationResult: classification, language: lang }),
        });
        if (explainRes.ok) {
          const explResult: ExplanationResult = await explainRes.json();
          setExplanation(explResult);
        }
      } catch {
        // silently fail — keep existing explanation
      }
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--warm)" }}>

      {/* ── Navigation Bar ── */}
      <nav
        style={{
          backgroundColor: "#1a3c2b",
          color: "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingLeft: "1.5rem",
          paddingRight: "1.5rem",
          paddingTop: "1rem",
          paddingBottom: "1rem",
        }}
      >
        <Link
          href="/"
          style={{
            color: "#ffffff",
            textDecoration: "none",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            fontSize: "1rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            opacity: 0.9,
            transition: "opacity 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.opacity = "0.9";
          }}
        >
          ← Plant Health AI
        </Link>

        <LanguageToggle language={language} onChange={handleLanguageChange} />
      </nav>

      {/* ── Main Content ── */}
      <main style={{ minHeight: "calc(100vh - 60px)", backgroundColor: "var(--warm)" }}>

        {/* ════════════════════════════════════════════
            IDLE STATE
        ════════════════════════════════════════════ */}
        {pageState === "idle" && (
          <div
            className="animate-fade-in"
            style={{
              maxWidth: "42rem",
              marginLeft: "auto",
              marginRight: "auto",
              paddingTop: "3rem",
              paddingBottom: "5rem",
              paddingLeft: "1rem",
              paddingRight: "1rem",
            }}
          >
            {/* Heading */}
            <h1
              style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: "clamp(2rem, 5vw, 2.5rem)",
                color: "var(--primary)",
                textAlign: "center",
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              Analyze Your Plant
            </h1>

            {/* Subtext */}
            <p
              style={{
                textAlign: "center",
                color: "var(--muted)",
                marginTop: "0.5rem",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "1rem",
                lineHeight: 1.6,
              }}
            >
              Upload a clear photo of the leaf for instant AI analysis
            </p>

            {/* Image upload */}
            <div style={{ marginTop: "2rem" }}>
              <ImageUpload
                onImageSelect={(base64: string, preview: string) => {
                  setImageBase64(base64);
                  setImagePreview(preview);
                  setError(null);
                }}
              />
            </div>

            {/* Image preview */}
            {imagePreview && (
              <div
                className="animate-fade-in"
                style={{ marginTop: "1rem", textAlign: "center" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Selected leaf"
                  style={{
                    maxHeight: "16rem",
                    borderRadius: "0.75rem",
                    margin: "0 auto",
                    objectFit: "contain",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                    display: "block",
                  }}
                />
              </div>
            )}

            {/* Error alert */}
            {error && (
              <div
                style={{
                  backgroundColor: "#fee2e2",
                  color: "#991b1b",
                  borderRadius: "0.5rem",
                  padding: "0.75rem 1rem",
                  marginTop: "1rem",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.875rem",
                  border: "1px solid #fecaca",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
                role="alert"
              >
                <span aria-hidden="true">⚠️</span>
                {error}
              </div>
            )}

            {/* Analyze button */}
            <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
              <button
                onClick={handleAnalyze}
                disabled={!imageBase64}
                style={{
                  display: "block",
                  maxWidth: "20rem",
                  width: "100%",
                  marginLeft: "auto",
                  marginRight: "auto",
                  backgroundColor: "#1a3c2b",
                  color: "#ffffff",
                  paddingTop: "1rem",
                  paddingBottom: "1rem",
                  paddingLeft: "1.5rem",
                  paddingRight: "1.5rem",
                  borderRadius: "1rem",
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                  border: "none",
                  cursor: imageBase64 ? "pointer" : "not-allowed",
                  opacity: imageBase64 ? 1 : 0.5,
                  transition: "transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease",
                  boxShadow: imageBase64
                    ? "0 4px 16px rgba(26,60,43,0.3)"
                    : "none",
                }}
                onMouseEnter={(e) => {
                  if (!imageBase64) return;
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "0 8px 24px rgba(26,60,43,0.4)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = imageBase64
                    ? "0 4px 16px rgba(26,60,43,0.3)"
                    : "none";
                }}
                aria-label="Analyze plant health"
              >
                Analyze Plant
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════
            ANALYZING STATE
        ════════════════════════════════════════════ */}
        {pageState === "analyzing" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingTop: "5rem",
              paddingBottom: "5rem",
              paddingLeft: "1rem",
              paddingRight: "1rem",
              gap: "2rem",
            }}
          >
            {/* Dimmed image preview */}
            {imagePreview && (
              <div
                className="animate-fade-in-only"
                style={{ textAlign: "center" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Analyzing leaf"
                  style={{
                    maxHeight: "12rem",
                    borderRadius: "0.75rem",
                    margin: "0 auto",
                    objectFit: "contain",
                    opacity: 0.6,
                    display: "block",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                  }}
                />
              </div>
            )}

            {/* Pulsing leaf indicator */}
            <div
              className="animate-pulse"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "80px",
                height: "80px",
                borderRadius: "9999px",
                backgroundColor: "#dcfce7",
                border: "3px solid #1a3c2b",
                fontSize: "2.25rem",
                boxShadow: "0 0 0 8px rgba(26,60,43,0.08)",
              }}
              aria-hidden="true"
            >
              🌿
            </div>

            {/* Rotating status message */}
            <div
              key={statusMessage}
              className="animate-fade-in-only"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "1.125rem",
                fontWeight: 600,
                color: "var(--primary)",
                textAlign: "center",
                minHeight: "2rem",
              }}
            >
              {statusMessage}
            </div>

            {/* Muted wait message */}
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.875rem",
                color: "var(--muted)",
                textAlign: "center",
                marginTop: "-0.75rem",
              }}
            >
              Please wait while we analyze your plant...
            </p>

            {/* Spinner bar */}
            <div
              style={{
                width: "160px",
                height: "4px",
                borderRadius: "9999px",
                backgroundColor: "#d1fae5",
                overflow: "hidden",
                position: "relative",
              }}
              aria-label="Loading"
              role="progressbar"
            >
              <div
                className="animate-spin-slow"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "60%",
                  height: "100%",
                  borderRadius: "9999px",
                  background: "linear-gradient(90deg, #1a3c2b, #7ab648)",
                  animation: "slideProgress 1.4s ease-in-out infinite",
                }}
              />
            </div>

            <style>{`
              @keyframes slideProgress {
                0%   { transform: translateX(-100%); }
                50%  { transform: translateX(167%); }
                100% { transform: translateX(-100%); }
              }
            `}</style>
          </div>
        )}

        {/* ════════════════════════════════════════════
            RESULTS STATE
        ════════════════════════════════════════════ */}
        {pageState === "results" && classification && (
          <div
            className="animate-fade-in"
            style={{
              maxWidth: "72rem",
              marginLeft: "auto",
              marginRight: "auto",
              paddingLeft: "1rem",
              paddingRight: "1rem",
              paddingTop: "2rem",
              paddingBottom: "2rem",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 28rem), 1fr))",
                gap: "1.5rem",
                alignItems: "start",
              }}
            >
              {/* Left column — ResultCard */}
              <div className="animate-slide-up" style={{ animationDelay: "0ms" }}>
                <ResultCard
                  imagePreview={imagePreview ?? ""}
                  classification={classification!}
                  explanation={explanation}
                  language={language}
                  onReset={handleReset}
                />
              </div>

              {/* Right column — ChatPanel */}
              <div className="animate-slide-up" style={{ animationDelay: "120ms", position: "sticky", top: "1rem" }}>
                <ChatPanel
                  classificationResult={classification!}
                  language={language}
                />
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
