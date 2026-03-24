"use client";

interface LanguageToggleProps {
  language: "en" | "ta";
  onChange: (lang: "en" | "ta") => void;
}

export default function LanguageToggle({ language, onChange }: LanguageToggleProps) {
  return (
    <div
      style={{
        display: "inline-flex",
        borderRadius: "9999px",
        border: "1px solid #2d5a40",
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => onChange("en")}
        style={{
          paddingLeft: "1rem",
          paddingRight: "1rem",
          paddingTop: "0.5rem",
          paddingBottom: "0.5rem",
          cursor: "pointer",
          border: "none",
          background: language === "en" ? "#1a3c2b" : "transparent",
          color: language === "en" ? "#ffffff" : "#1a3c2b",
          fontFamily: "inherit",
          fontSize: "0.875rem",
          fontWeight: language === "en" ? 600 : 400,
          transition: "background 0.2s, color 0.2s",
          outline: "none",
        }}
        aria-pressed={language === "en"}
      >
        English
      </button>
      <button
        onClick={() => onChange("ta")}
        style={{
          paddingLeft: "1rem",
          paddingRight: "1rem",
          paddingTop: "0.5rem",
          paddingBottom: "0.5rem",
          cursor: "pointer",
          border: "none",
          background: language === "ta" ? "#1a3c2b" : "transparent",
          color: language === "ta" ? "#ffffff" : "#1a3c2b",
          fontFamily: "inherit",
          fontSize: "0.875rem",
          fontWeight: language === "ta" ? 600 : 400,
          transition: "background 0.2s, color 0.2s",
          outline: "none",
        }}
        aria-pressed={language === "ta"}
      >
        தமிழ்
      </button>
    </div>
  );
}
