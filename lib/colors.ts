// Palette colori condivisa dell'app. Questo file NON ha "use client":
// deve restare un modulo puro, importabile sia da Server Component
// (pagine .tsx senza "use client") sia da Client Component, senza il
// problema del confine RSC che rende undefined i valori non-componente
// esportati da un file "use client" quando importati lato server.
export const COLORS = {
  primary: "#0f6e8c",
  primaryDark: "#0a4f63",
  primaryLight: "#e6f2f6",
  bg: "#f7f9fa",
  surface: "#ffffff",
  text: "#1e2a32",
  textMuted: "#64748b",
  border: "#e2e8ee",
  success: "#1d8a4d",
  successBg: "#e8f6ee",
  warning: "#c07a1a",
  warningBg: "#fbf1e0",
  danger: "#c23b3b",
  dangerBg: "#fbecec",
};
