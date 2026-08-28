import { StyleSheet } from "react-native";

import { accentGlow, cardShadow, colors } from "../../theme/colors";
import { radius } from "../../theme/spacing";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  page: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 24,
  },

  glowTop: {
    position: "absolute",
    top: -120,
    right: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(79, 70, 229, 0.14)",
  },

  glowBottom: {
    position: "absolute",
    bottom: -150,
    left: -120,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(8, 145, 178, 0.08)",
  },

  backButton: {
    position: "absolute",
    top: 18,
    left: 24,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 5,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  backText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
  },

  brandSection: {
    alignItems: "center",
    marginBottom: 28,
  },

  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    ...accentGlow,
    shadowOpacity: 0.5,
  },

  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    textAlign: "center",
  },

  subtitle: {
    color: colors.textSoft,
    marginTop: 8,
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 19,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: 22,
    ...cardShadow,
  },

  cardHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: "rgba(79, 70, 229, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(79, 70, 229, 0.28)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  cardTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.4,
  },

  cardDescription: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 19,
    marginTop: 8,
  },

  codeBox: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 14,
  },

  codeText: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 4,
  },

  hiddenInput: {
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
  },

  errorText: {
    color: colors.red,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 12,
  },

  noteText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 16,
    textAlign: "center",
    marginTop: 14,
  },
});
