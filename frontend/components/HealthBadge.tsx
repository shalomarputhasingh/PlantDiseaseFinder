"use client";

interface HealthBadgeProps {
  level: "Healthy" | "Mildly Affected" | "Moderately Affected" | "Severely Affected";
}

const colorMap: Record<
  HealthBadgeProps["level"],
  { bg: string; color: string; emoji: string }
> = {
  Healthy: { bg: "#dcfce7", color: "#166534", emoji: "🟢" },
  "Mildly Affected": { bg: "#fef9c3", color: "#854d0e", emoji: "🟡" },
  "Moderately Affected": { bg: "#ffedd5", color: "#9a3412", emoji: "🟠" },
  "Severely Affected": { bg: "#fee2e2", color: "#991b1b", emoji: "🔴" },
};

export default function HealthBadge({ level }: HealthBadgeProps) {
  const { bg, color, emoji } = colorMap[level];

  return (
    <span
      className="animate-pop-in"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        paddingLeft: "1rem",
        paddingRight: "1rem",
        paddingTop: "0.5rem",
        paddingBottom: "0.5rem",
        borderRadius: "9999px",
        backgroundColor: bg,
        color: color,
        fontWeight: 600,
        fontSize: "0.875rem",
        lineHeight: 1.25,
        whiteSpace: "nowrap",
      }}
      role="status"
      aria-label={`Health level: ${level}`}
    >
      <span aria-hidden="true">{emoji}</span>
      {level}
    </span>
  );
}
