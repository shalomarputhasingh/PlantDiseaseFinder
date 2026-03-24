"use client";

import { useState, useEffect } from "react";

const quotes = [
  {
    text: "In every walk with nature, one receives far more than he seeks.",
    attribution: "— John Muir",
  },
  {
    text: "Look deep into nature, and then you will understand everything better.",
    attribution: "— Einstein",
  },
  {
    text: "The clearest way into the universe is through a forest wilderness.",
    attribution: "— John Muir",
  },
  {
    text: "Plants give us oxygen for the lungs and for the soul.",
    attribution: "— Linda Solegato",
  },
  {
    text: "Nature does not hurry, yet everything is accomplished.",
    attribution: "— Lao Tzu",
  },
  {
    text: "He who plants a tree, plants a hope.",
    attribution: "— Lucy Larcom",
  },
  {
    text: "The earth laughs in flowers.",
    attribution: "— Ralph Waldo Emerson",
  },
  {
    text: "To plant a garden is to believe in tomorrow.",
    attribution: "— Audrey Hepburn",
  },
];

export default function QuoteCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % quotes.length);
        setIsVisible(true);
      }, 400);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const current = quotes[currentIndex];

  return (
    <div
      className="text-center px-4"
      style={{
        opacity: isVisible ? 1 : 0,
        transition: "opacity 0.8s ease-in-out",
        minHeight: "120px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <p
        style={{
          fontFamily: "'Playfair Display', serif",
          fontStyle: "italic",
          fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
          color: "#ffffff",
          lineHeight: 1.6,
          maxWidth: "720px",
          margin: "0 auto 12px auto",
          textShadow: "0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        &ldquo;{current.text}&rdquo;
      </p>
      <span
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.95rem",
          color: "rgba(255,255,255,0.8)",
          letterSpacing: "0.02em",
        }}
      >
        {current.attribution}
      </span>
    </div>
  );
}
