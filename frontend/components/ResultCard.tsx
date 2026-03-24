"use client";

import HealthBadge from "@/components/HealthBadge";
import { getDiseaseInfo } from "@/lib/diseaseKnowledge";

interface ClassificationResult {
  rawLabel: string;
  cleanDiseaseName: string;
  isHealthy: boolean;
  healthLevel: "Healthy" | "Mildly Affected" | "Moderately Affected" | "Severely Affected";
  confidence: number;
  confidenceFlag: "high" | "moderate" | "low";
}

interface ExplanationResult {
  explanation: string;
  symptoms: string[];
  immediateAction: string;
}

interface ResultCardProps {
  imagePreview: string;
  classification: ClassificationResult;
  explanation: ExplanationResult | null;
  language: "en" | "ta";
  onReset: () => void;
}

const confidenceColors = { high: "#16a34a", moderate: "#d97706", low: "#dc2626" };

const urgencyConfig = {
  none:   { label: null,         bg: "transparent",  color: "transparent" },
  low:    { label: "Low Risk",    bg: "#dcfce7",       color: "#166534"     },
  medium: { label: "Moderate Risk", bg: "#fef9c3",     color: "#854d0e"     },
  high:   { label: "High Risk",   bg: "#fee2e2",       color: "#991b1b"     },
};

export default function ResultCard({
  imagePreview,
  classification,
  explanation,
  language,
  onReset,
}: ResultCardProps) {
  const { rawLabel, cleanDiseaseName, isHealthy, healthLevel, confidence, confidenceFlag } = classification;
  const info = getDiseaseInfo(rawLabel);
  const urgency = urgencyConfig[info.urgency];
  const confColor = confidenceColors[confidenceFlag];

  return (
    <div
      className="animate-fade-in"
      style={{
        borderRadius: "1rem",
        backgroundColor: "#ffffff",
        overflow: "hidden",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      }}
    >
      {/* ── Image ── */}
      <div style={{ position: "relative" }}>
        <img
          src={imagePreview}
          alt="Uploaded leaf"
          style={{ width: "100%", height: "200px", objectFit: "cover", display: "block" }}
        />
        <div
          style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: "5rem",
            background: "linear-gradient(to bottom, transparent, #ffffff)",
          }}
          aria-hidden="true"
        />
        {/* Health badge */}
        <div style={{ position: "absolute", top: "0.75rem", left: "0.75rem" }}>
          <HealthBadge level={healthLevel} />
        </div>
        {/* Confidence pill */}
        <div
          style={{
            position: "absolute", top: "0.75rem", right: "0.75rem",
            backgroundColor: "rgba(255,255,255,0.92)",
            borderRadius: "999px", padding: "4px 12px",
            fontSize: "0.8125rem", fontWeight: 600, color: confColor,
            backdropFilter: "blur(4px)",
          }}
        >
          {confidence}% confidence
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "1.25rem" }}>

        {/* ── Headline ── */}
        {isHealthy ? (
          <div style={{ textAlign: "center", padding: "0.5rem 0 0.75rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>✅</div>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.375rem", fontWeight: 700, color: "#166534", margin: "0 0 0.25rem",
            }}>
              Your plant looks healthy!
            </h2>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>
              No signs of disease detected.
            </p>
          </div>
        ) : (
          <div style={{ marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", flexWrap: "wrap" }}>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.375rem", fontWeight: 700, color: "#1a3c2b",
                margin: 0, lineHeight: 1.3,
              }}>
                {rawLabel}
              </h2>
              {info.urgency !== "none" && (
                <span
                  className="animate-pop-in"
                  style={{
                    backgroundColor: urgency.bg, color: urgency.color,
                    borderRadius: "999px", padding: "2px 10px",
                    fontSize: "0.75rem", fontWeight: 600, alignSelf: "center",
                    flexShrink: 0,
                  }}
                >
                  {urgency.label}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Low confidence warning ── */}
        {confidenceFlag === "low" && (
          <div
            role="alert"
            style={{
              backgroundColor: "#fef9c3", border: "1px solid #fde047",
              borderRadius: "0.5rem", padding: "0.625rem 0.75rem", marginBottom: "0.75rem",
            }}
          >
            <p style={{ fontSize: "0.8125rem", color: "#854d0e", margin: 0, lineHeight: 1.5 }}>
              ⚠️ Results are approximate. Try a clearer photo or consult an agricultural expert.
            </p>
          </div>
        )}

        <hr style={{ border: "none", borderTop: "1px solid #f0f0f0", margin: "0.75rem 0" }} />

        {/* ── Disease Details (only for diseased plants) ── */}
        {!isHealthy && (
          <>
            {/* 2-col info grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.625rem",
                marginBottom: "0.75rem",
              }}
            >
              {/* Cause */}
              <InfoCard icon="🦠" label="CAUSE" value={info.cause} />
              {/* Spread */}
              <InfoCard icon="💨" label="SPREADS VIA" value={info.spread} />
              {/* Treatment — full width */}
              <div style={{ gridColumn: "1 / -1" }}>
                <InfoCard icon="💊" label="TREATMENT" value={info.treatmentType} />
              </div>
            </div>

            {/* Prevention tips */}
            {info.prevention.length > 0 && (
              <div
                style={{
                  backgroundColor: "#f0fdf4",
                  borderRadius: "0.625rem",
                  padding: "0.75rem",
                  marginBottom: "0.75rem",
                }}
              >
                <p style={{
                  fontSize: "0.75rem", fontWeight: 700, color: "#1a3c2b",
                  textTransform: "uppercase", letterSpacing: "0.05em",
                  margin: "0 0 0.5rem",
                }}>
                  🌱 Prevention Tips
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  {info.prevention.map((tip, i) => (
                    <li key={i} style={{ fontSize: "0.8125rem", color: "#1a1a1a", display: "flex", gap: "0.4rem" }}>
                      <span style={{ color: "#7ab648", flexShrink: 0 }}>✓</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <hr style={{ border: "none", borderTop: "1px solid #f0f0f0", margin: "0.75rem 0" }} />
          </>
        )}

        {/* ── AI Explanation ── */}
        {explanation && (
          <>
            {explanation.explanation && (
              <p style={{ fontSize: "0.875rem", color: "#1a1a1a", lineHeight: 1.65, margin: "0 0 0.75rem" }}>
                {explanation.explanation}
              </p>
            )}

            {explanation.symptoms && explanation.symptoms.length > 0 && (
              <div style={{ marginBottom: "0.75rem" }}>
                <p style={{
                  fontWeight: 700, fontSize: "0.8125rem", color: "#1a3c2b",
                  margin: "0 0 0.375rem", textTransform: "uppercase", letterSpacing: "0.04em",
                }}>
                  Visible Symptoms
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  {explanation.symptoms.map((s, i) => (
                    <li key={i} style={{ fontSize: "0.875rem", color: "#1a1a1a", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                      <span style={{ color: "#dc2626", flexShrink: 0 }}>•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {explanation.immediateAction && (
              <div
                style={{
                  backgroundColor: "#f0fdf4",
                  borderLeft: "3px solid #7ab648",
                  borderRadius: "0.375rem",
                  padding: "0.75rem",
                  marginBottom: "0.75rem",
                }}
              >
                <p style={{
                  fontWeight: 700, fontSize: "0.7rem", color: "#166534",
                  textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 0.25rem",
                }}>
                  Immediate Action
                </p>
                <p style={{ fontSize: "0.875rem", color: "#1a1a1a", margin: 0, lineHeight: 1.6 }}>
                  {explanation.immediateAction}
                </p>
              </div>
            )}
          </>
        )}

        {/* ── Reset ── */}
        <button
          onClick={onReset}
          style={{
            width: "100%", backgroundColor: "#1a3c2b", color: "#ffffff",
            padding: "0.75rem", borderRadius: "0.75rem",
            cursor: "pointer", fontWeight: 500, fontSize: "0.9375rem",
            border: "none", marginTop: "0.5rem", fontFamily: "inherit",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#2d5a40"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#1a3c2b"; }}
        >
          Analyze Another Plant
        </button>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div
      style={{
        backgroundColor: "#f8faf8",
        border: "1px solid #e5e7eb",
        borderRadius: "0.625rem",
        padding: "0.625rem 0.75rem",
      }}
    >
      <p style={{
        fontSize: "0.6875rem", fontWeight: 700, color: "#6b7280",
        textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 0.25rem",
      }}>
        {icon} {label}
      </p>
      <p style={{ fontSize: "0.8125rem", color: "#1a1a1a", margin: 0, lineHeight: 1.5 }}>
        {value}
      </p>
    </div>
  );
}
