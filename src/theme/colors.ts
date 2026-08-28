// Light premium theme — warm-neutral off-white background, white lifted
// cards, and a single indigo accent. Approved direction: replaces the
// previous all-black theme app-wide.
export const colors = {
  // Brand
  navy: "#6D63F2",
  navySoft: "#EEF0FF",
  blue: "#4F46E5",
  blueBright: "#7C6FFF",
  blueDeep: "#3B33C4",
  cyan: "#0891B2",
  green: "#16A34A",
  amber: "#D97706",
  red: "#DC2626",
  purple: "#7C3AED",

  // Surfaces
  background: "#F6F7FB",
  surface: "#FFFFFF",
  surfaceSoft: "#EEF0FF",
  surfaceHigh: "#F0F1F8",
  border: "#E4E7F2",
  borderSoft: "#EDEFF7",

  // Text
  text: "#14151F",
  textSoft: "#6B7086",
  muted: "#9297AC",

  white: "#FFFFFF",
  black: "#000000",

  // Glass / overlay effects
  glass: "rgba(79, 70, 229, 0.06)",
  glassStrong: "rgba(79, 70, 229, 0.10)",
  glassBorder: "rgba(79, 70, 229, 0.16)",
  overlay: "rgba(20, 21, 31, 0.55)",
};

export type StatusTone = "green" | "red" | "amber" | "blue" | "purple" | "cyan" | "neutral";

// Translucent tone chips that sit well on light surfaces.
export const tones: Record<StatusTone, { bg: string; border: string; text: string }> = {
  green: { bg: "rgba(22, 163, 74, 0.12)", border: "rgba(22, 163, 74, 0.24)", text: "#15803D" },
  red: { bg: "rgba(220, 38, 38, 0.10)", border: "rgba(220, 38, 38, 0.22)", text: "#DC2626" },
  amber: { bg: "rgba(217, 119, 6, 0.12)", border: "rgba(217, 119, 6, 0.24)", text: "#B45309" },
  blue: { bg: "rgba(79, 70, 229, 0.10)", border: "rgba(79, 70, 229, 0.22)", text: "#4F46E5" },
  purple: { bg: "rgba(124, 58, 237, 0.10)", border: "rgba(124, 58, 237, 0.22)", text: "#7C3AED" },
  cyan: { bg: "rgba(8, 145, 178, 0.10)", border: "rgba(8, 145, 178, 0.22)", text: "#0E7490" },
  neutral: { bg: "rgba(107, 112, 134, 0.10)", border: "rgba(107, 112, 134, 0.20)", text: "#6B7086" },
};

// Soft glow shadow for the primary accent (buttons, active elements).
export const accentGlow = {
  shadowColor: "#4F46E5",
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.28,
  shadowRadius: 18,
  elevation: 6,
};

// Subtle depth shadow for lifted cards on the light background.
export const cardShadow = {
  shadowColor: "#14151F",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.08,
  shadowRadius: 18,
  elevation: 3,
};

// Shared palette for the "drilldown" screens (endpoints, tickets,
// geolocation, risk, patch, software). Kept as a single source of truth so
// every drilldown screen reads as one design instead of drifting
// hex-by-hex copy — import as `ui` in place of a local re-declaration.
export const drilldownPalette = {
  bg: "#F6F7FB",
  card: "#FFFFFF",
  ink: "#14151F",
  soft: "#6B7086",
  muted: "#9297AC",
  line: "#E4E7F2",
  navy: "#6D63F2",
  navy2: "#4F46E5",
  blue: "#4F46E5",
  green: "#16A34A",
  red: "#DC2626",
  cyan: "#0891B2",
  amber: "#D97706",
  purple: "#7C3AED",
};
