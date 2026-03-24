"use client";

import Link from "next/link";
import QuoteCarousel from "@/components/QuoteCarousel";

export default function HomePage() {
  return (
    <main style={{ fontFamily: "'DM Sans', sans-serif", color: "#1a1a1a" }}>
      {/* ── HERO SECTION ── */}
      <section
        className="relative"
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, #1a3c2b 0%, #2d5a40 50%, #1a3c2b 100%)",
          overflow: "hidden",
        }}
      >
        {/* Leaf SVG background */}
        <div
          className="animate-leaf-pulse"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <svg
            viewBox="0 0 400 500"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            preserveAspectRatio="xMidYMid slice"
          >
            <path
              d="M200 20 C350 20 400 150 380 280 C360 400 280 470 200 480 C120 470 40 400 20 280 C0 150 50 20 200 20 Z"
              fill="#2d5a40"
              opacity="0.6"
            />
            <path
              d="M200 60 C200 60 200 200 200 460"
              stroke="#7ab648"
              strokeWidth="3"
              fill="none"
              opacity="0.4"
            />
            <path
              d="M200 150 C160 130 130 110 100 130"
              stroke="#7ab648"
              strokeWidth="2"
              fill="none"
              opacity="0.3"
            />
            <path
              d="M200 200 C240 180 270 160 300 180"
              stroke="#7ab648"
              strokeWidth="2"
              fill="none"
              opacity="0.3"
            />
            <path
              d="M200 260 C160 240 130 220 110 240"
              stroke="#7ab648"
              strokeWidth="2"
              fill="none"
              opacity="0.3"
            />
            <path
              d="M200 320 C240 300 270 280 290 300"
              stroke="#7ab648"
              strokeWidth="2"
              fill="none"
              opacity="0.3"
            />
          </svg>
        </div>

        {/* Dark overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        />

        {/* Hero content */}
        <div
          className="relative z-10 flex flex-col items-center justify-center text-center px-4"
          style={{ minHeight: "100vh", gap: "2rem" }}
        >
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              border: "1px solid rgba(255,255,255,0.4)",
              borderRadius: "9999px",
              padding: "6px 20px",
              color: "#ffffff",
              fontSize: "0.875rem",
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: "0.04em",
              background: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(4px)",
            }}
          >
            🌿 AI-Powered Plant Analysis
          </div>

          {/* Quote carousel */}
          <QuoteCarousel />

          {/* CTA button */}
          <Link
            href="/analyze"
            style={{
              display: "inline-block",
              backgroundColor: "#7ab648",
              color: "#1a1a1a",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              fontSize: "1.125rem",
              padding: "16px 32px",
              borderRadius: "9999px",
              textDecoration: "none",
              letterSpacing: "0.01em",
              boxShadow: "0 4px 24px rgba(122,182,72,0.35)",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.transform =
                "translateY(-2px)";
              (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                "0 8px 32px rgba(122,182,72,0.5)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.transform =
                "translateY(0)";
              (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                "0 4px 24px rgba(122,182,72,0.35)";
            }}
          >
            Analyze Your Plant →
          </Link>
        </div>
      </section>

      {/* ── HOW IT WORKS SECTION ── */}
      <section
        style={{
          backgroundColor: "#f5f0e8",
          padding: "80px 24px",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              color: "#1a3c2b",
              textAlign: "center",
              marginBottom: "48px",
              fontWeight: 700,
            }}
          >
            How It Works
          </h2>

          <div
            className="grid grid-cols-2 md:grid-cols-4"
            style={{ gap: "24px" }}
          >
            {[
              { icon: "📸", title: "Upload a leaf photo" },
              { icon: "🤖", title: "AI analyzes the image" },
              { icon: "📊", title: "Get health results instantly" },
              { icon: "💬", title: "Ask AI for deeper guidance" },
            ].map((step, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  padding: "24px",
                  textAlign: "center",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <span style={{ fontSize: "2.25rem" }}>{step.icon}</span>
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    color: "#1a1a1a",
                    lineHeight: 1.4,
                    margin: 0,
                  }}
                >
                  {step.title}
                </p>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "28px",
                    height: "28px",
                    borderRadius: "9999px",
                    backgroundColor: "#1a3c2b",
                    color: "#ffffff",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    fontFamily: "'DM Sans', sans-serif",
                    marginTop: "4px",
                  }}
                >
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HEALTH LEVELS SECTION ── */}
      <section
        style={{
          backgroundColor: "#ffffff",
          padding: "80px 24px",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              color: "#1a1a1a",
              textAlign: "center",
              marginBottom: "48px",
              fontWeight: 700,
            }}
          >
            Understanding Health Levels
          </h2>

          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            style={{ gap: "24px" }}
          >
            {[
              {
                emoji: "🟢",
                label: "Healthy",
                description: "No visible issues",
                borderColor: "#22c55e",
                bgColor: "rgba(34,197,94,0.06)",
                badgeColor: "#16a34a",
              },
              {
                emoji: "🟡",
                label: "Mildly Affected",
                description: "Early-stage symptoms",
                borderColor: "#eab308",
                bgColor: "rgba(234,179,8,0.06)",
                badgeColor: "#ca8a04",
              },
              {
                emoji: "🟠",
                label: "Moderately Affected",
                description: "Clear visible damage",
                borderColor: "#f97316",
                bgColor: "rgba(249,115,22,0.06)",
                badgeColor: "#ea580c",
              },
              {
                emoji: "🔴",
                label: "Severely Affected",
                description: "Serious infection or damage",
                borderColor: "#ef4444",
                bgColor: "rgba(239,68,68,0.06)",
                badgeColor: "#dc2626",
              },
            ].map((level, i) => (
              <div
                key={i}
                style={{
                  border: `2px solid ${level.borderColor}`,
                  borderRadius: "12px",
                  padding: "28px 20px",
                  textAlign: "center",
                  backgroundColor: level.bgColor,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span style={{ fontSize: "2rem" }}>{level.emoji}</span>
                <h3
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: "1rem",
                    color: level.badgeColor,
                    margin: 0,
                  }}
                >
                  {level.label}
                </h3>
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.875rem",
                    color: "#6b7280",
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {level.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        style={{
          backgroundColor: "#1a3c2b",
          padding: "24px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        {/* Left */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "4px" }}
        >
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              fontSize: "1.1rem",
              color: "#f5f0e8",
            }}
          >
            🌿 Plant Health AI
          </span>
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.8rem",
              color: "rgba(245,240,232,0.6)",
            }}
          >
            Powered by AI · Built for farmers
          </span>
        </div>

        {/* Right — language toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.875rem",
          }}
        >
          <button
            style={{
              background: "none",
              border: "1px solid rgba(245,240,232,0.4)",
              borderRadius: "6px",
              padding: "4px 12px",
              color: "#f5f0e8",
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            EN
          </button>
          <span style={{ color: "rgba(245,240,232,0.4)" }}>|</span>
          <button
            style={{
              background: "none",
              border: "1px solid rgba(245,240,232,0.25)",
              borderRadius: "6px",
              padding: "4px 12px",
              color: "rgba(245,240,232,0.7)",
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.875rem",
            }}
          >
            தமிழ்
          </button>
        </div>
      </footer>
    </main>
  );
}
