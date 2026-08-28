import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient as SvgGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

export type EndpointVisualKind = "managed" | "online" | "offline" | "stale";

type VisualPalette = {
  primary: string;
  secondary: string;
  light: string;
  glow: string;
};

const palettes: Record<EndpointVisualKind, VisualPalette> = {
  managed: {
    primary: "#4F6BFF",
    secondary: "#A9B8FF",
    light: "#EEF2FF",
    glow: "#DDE6FF",
  },
  online: {
    primary: "#10A66B",
    secondary: "#73E0B4",
    light: "#EAFBF3",
    glow: "#D5F7E7",
  },
  offline: {
    primary: "#E84A5F",
    secondary: "#FF9AAA",
    light: "#FFF0F3",
    glow: "#FFE0E7",
  },
  stale: {
    primary: "#E49A22",
    secondary: "#FFD58A",
    light: "#FFF7E8",
    glow: "#FFE9BD",
  },
};

export default function EndpointVisual({ kind }: { kind: EndpointVisualKind; color?: string }) {
  const palette = palettes[kind] || palettes.managed;

  return (
    <View style={styles.frame}>
      <EnterpriseArtwork kind={kind} palette={palette} />
    </View>
  );
}

function EnterpriseArtwork({ kind, palette }: { kind: EndpointVisualKind; palette: VisualPalette }) {
  const isOnline = kind === "online";
  const isOffline = kind === "offline";
  const isStale = kind === "stale";

  return (
    <Svg width="104" height="104" viewBox="0 0 104 104">
      <Defs>
        <SvgGradient id="panelBg" x1="8" y1="5" x2="98" y2="102" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="0.45" stopColor={palette.light} />
          <Stop offset="1" stopColor="#FFFFFF" />
        </SvgGradient>
        <SvgGradient id="ribbonA" x1="18" y1="16" x2="86" y2="88" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
          <Stop offset="0.45" stopColor={palette.secondary} stopOpacity="0.95" />
          <Stop offset="1" stopColor={palette.primary} stopOpacity="0.95" />
        </SvgGradient>
        <SvgGradient id="ribbonB" x1="86" y1="18" x2="20" y2="92" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={palette.primary} stopOpacity="0.88" />
          <Stop offset="0.55" stopColor={palette.secondary} stopOpacity="0.7" />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0.85" />
        </SvgGradient>
        <SvgGradient id="glass" x1="20" y1="20" x2="82" y2="82" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.98" />
          <Stop offset="1" stopColor={palette.glow} stopOpacity="0.82" />
        </SvgGradient>
        <RadialGradient id="halo" cx="50%" cy="45%" r="58%">
          <Stop offset="0" stopColor={palette.secondary} stopOpacity="0.36" />
          <Stop offset="1" stopColor={palette.primary} stopOpacity="0.02" />
        </RadialGradient>
      </Defs>

      <Rect x="4" y="4" width="96" height="96" rx="27" fill="url(#panelBg)" />
      <Circle cx="70" cy="25" r="28" fill="url(#halo)" />
      <Circle cx="27" cy="76" r="24" fill={palette.glow} opacity="0.75" />
      <Ellipse cx="52" cy="88" rx="31" ry="7" fill="#111827" opacity="0.07" />

      <G opacity={isOffline ? 0.9 : 1}>
        <Path
          d="M23 68 C34 42 55 30 80 25"
          fill="none"
          stroke="url(#ribbonA)"
          strokeWidth="16"
          strokeLinecap="round"
          opacity="0.88"
        />
        <Path
          d="M22 70 C39 77 58 74 82 58"
          fill="none"
          stroke="url(#ribbonB)"
          strokeWidth="15"
          strokeLinecap="round"
          opacity="0.82"
        />
        <Path
          d="M29 42 C48 22 70 34 76 52 C82 72 52 83 32 60"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="7"
          strokeLinecap="round"
          opacity="0.74"
        />
      </G>

      <G>
        <Circle cx="54" cy="52" r="21" fill="url(#glass)" opacity="0.96" />
        <Circle cx="54" cy="52" r="20" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity="0.85" />
        <Circle cx="54" cy="52" r="10" fill={palette.primary} opacity={isOnline ? 0.92 : 0.78} />
        <Circle cx="50" cy="48" r="4" fill="#FFFFFF" opacity="0.88" />
      </G>

      {isOnline ? (
        <G>
          <Circle cx="54" cy="52" r="31" fill="none" stroke={palette.primary} strokeWidth="2" opacity="0.36" />
          <Circle cx="54" cy="52" r="39" fill="none" stroke={palette.primary} strokeWidth="1.5" opacity="0.18" />
          <Circle cx="82" cy="38" r="4.5" fill={palette.primary} opacity="0.9" />
          <Circle cx="28" cy="65" r="3.5" fill={palette.primary} opacity="0.5" />
        </G>
      ) : null}

      {isOffline ? (
        <G>
          <Path d="M26 28 L78 80" stroke={palette.primary} strokeWidth="6" strokeLinecap="round" opacity="0.75" />
          <Path d="M26 28 L78 80" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
          <Circle cx="26" cy="78" r="5" fill={palette.primary} opacity="0.82" />
          <Circle cx="78" cy="27" r="4" fill={palette.primary} opacity="0.65" />
        </G>
      ) : null}

      {isStale ? (
        <G>
          <Path
            d="M23 49 C29 27 58 18 76 36"
            fill="none"
            stroke={palette.primary}
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.52"
          />
          <Path d="M76 36 L74 47 L85 42" fill="none" stroke={palette.primary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.58" />
          <Circle cx="27" cy="47" r="4" fill={palette.primary} opacity="0.62" />
        </G>
      ) : null}

      {!isOnline && !isOffline && !isStale ? (
        <G>
          <Circle cx="82" cy="60" r="4.5" fill={palette.primary} opacity="0.8" />
          <Circle cx="27" cy="38" r="3.8" fill={palette.primary} opacity="0.52" />
          <Path d="M31 40 C45 33 65 35 80 58" fill="none" stroke={palette.primary} strokeWidth="2" strokeLinecap="round" opacity="0.34" />
        </G>
      ) : null}
    </Svg>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: 104,
    height: 104,
    alignItems: "center",
    justifyContent: "center",
  },
});
