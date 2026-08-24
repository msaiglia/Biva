"use client";

import type { RangeZones } from "@/lib/reference-ranges";

export default function RangeBar({
  label,
  value,
  unit,
  zones,
}: {
  label: string;
  value: number;
  unit: string;
  zones: RangeZones;
}) {
  const { min, lowBoundary, normalLow, normalHigh, highBoundary, max, sourceLabel } = zones;
  const clampedValue = Math.min(Math.max(value, min), max);
  const pct = (v: number) => ((v - min) / (max - min)) * 100;

  const segments = [
    { from: min, to: lowBoundary, color: "#c23b3b" },
    { from: lowBoundary, to: normalLow, color: "#c07a1a" },
    { from: normalLow, to: normalHigh, color: "#1d8a4d" },
    { from: normalHigh, to: highBoundary, color: "#c07a1a" },
    { from: highBoundary, to: max, color: "#c23b3b" },
  ];

  const ticks = [min, lowBoundary, normalLow, normalHigh, highBoundary, max];

  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: "#1e2a32" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700 }}>
          {value.toFixed(1)} {unit}
        </span>
      </div>

      <div style={{ position: "relative", height: 22, marginTop: 14 }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 8, borderRadius: 4, overflow: "hidden", display: "flex" }}>
          {segments.map((s, i) => (
            <div key={i} style={{ width: `${pct(s.to) - pct(s.from)}%`, background: s.color }} />
          ))}
        </div>

        <div
          title={`${value.toFixed(1)} ${unit}`}
          style={{
            position: "absolute",
            top: -10,
            left: `calc(${pct(clampedValue)}% - 6px)`,
            width: 0,
            height: 0,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: "10px solid #1e2a32",
          }}
        />
      </div>

      <div style={{ position: "relative", height: 14, marginTop: 2 }}>
        {ticks.map((t, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${pct(t)}%`,
              transform: "translateX(-50%)",
              fontSize: 9,
              color: "#8a96a3",
              whiteSpace: "nowrap",
            }}
          >
            {t.toFixed(1)}
          </span>
        ))}
      </div>

      <div style={{ fontSize: 9, color: "#a0aab3", marginTop: 4 }}>{sourceLabel}</div>
    </div>
  );
}
