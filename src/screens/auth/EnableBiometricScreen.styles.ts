import { StyleSheet } from "react-native";

import { cardShadow, colors } from "../../theme/colors";
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
    backgroundColor: "rgba(22, 163, 74, 0.12)",
  },

  glowBottom: {
    position: "absolute",
    bottom: -150,
    left: -120,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(79, 70, 229, 0.12)",
  },

  brandSection: {
    alignItems: "center",
    marginBottom: 28,
  },

  // Circular gradient badge with a faint outer ring and a small shield
  // overlapping its bottom-right corner.
  iconRingWrap: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  iconRingOuter: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBadge: {
    width: 74,
    height: 74,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.blue,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 8,
  },
  shieldBadge: {
    position: "absolute",
    bottom: 4,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "rgba(22, 163, 74, 0.14)",
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    color: colors.text,
    fontSize: 25,
    fontWeight: "800",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  titleAccent: {
    color: colors.blue,
  },

  subtitle: {
    color: colors.textSoft,
    marginTop: 8,
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 19,
  },
  subtitleAccent: {
    color: colors.blue,
    fontWeight: "700",
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: 22,
    ...cardShadow,
  },

  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  cardHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: "rgba(22, 163, 74, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(22, 163, 74, 0.28)",
    alignItems: "center",
    justifyContent: "center",
  },

  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.4,
  },

  cardDescription: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 19,
  },

  securityList: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginTop: 18,
    marginBottom: 16,
  },

  securityDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },

  securityItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  securityIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  securityTextWrap: {
    flex: 1,
  },

  securityTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },

  securityDesc: {
    color: colors.textSoft,
    fontSize: 11.5,
    fontWeight: "500",
    marginTop: 2,
    lineHeight: 15,
  },

  enableButton: {
    minHeight: 54,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    marginBottom: 10,
    overflow: "hidden",
  },
  enableButtonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  enableButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  buttonDisabled: {
    opacity: 0.65,
  },

  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 18,
  },
  footerText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
});
