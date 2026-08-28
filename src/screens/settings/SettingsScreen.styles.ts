import { StyleSheet } from "react-native";
import type { ViewStyle } from "react-native";

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
    paddingTop: 14,
    paddingHorizontal: 18,
    paddingBottom: 110,
  },

  header: {
    marginBottom: 18,
  },

  eyebrow: {
    color: colors.blueBright,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 6,
  },

  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.7,
  },

  subtitle: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "500",
    marginTop: 5,
    lineHeight: 19,
  },

  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    ...cardShadow,
  },

  profileIcon: {
    width: 50,
    height: 50,
    borderRadius: radius.lg,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
    shadowColor: colors.blue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 5,
  },

  profileTextWrap: {
    flex: 1,
  },

  profileName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },

  profileEmail: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "500",
    marginTop: 3,
  },

  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 16,
  },

  sectionTitle: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    paddingTop: 16,
    paddingBottom: 4,
  },

  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },

  settingIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  settingTextWrap: {
    flex: 1,
    paddingRight: 8,
  },

  settingTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },

  settingDesc: {
    color: colors.textSoft,
    fontSize: 11.5,
    fontWeight: "500",
    marginTop: 3,
    lineHeight: 16,
  },

  logoutButton: {
    backgroundColor: "rgba(220, 38, 38, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.30)",
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 6,
  },

  logoutText: {
    color: colors.red,
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
  },

  footerText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 16,
    textAlign: "center",
    marginTop: 14,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  dialogCard: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.xl,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },

  dialogCloseButton: {
    position: "absolute",
    right: 16,
    top: 16,
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.glass,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },

  dialogIcon: {
    width: 58,
    height: 58,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  dialogTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 8,
  },

  dialogMessage: {
    color: colors.textSoft,
    fontSize: 13.5,
    fontWeight: "500",
    lineHeight: 20,
  },

  dialogButtonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
  },

  secondaryButton: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },

  secondaryButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },

  primaryButton: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
});

export const settingIconDynamicStyle = (color: string): ViewStyle => ({
  backgroundColor: `${color}1F`,
  borderWidth: 1,
  borderColor: `${color}3D`,
});

export const dialogIconStyle = (backgroundColor: string): ViewStyle => ({
  backgroundColor,
});

export const primaryButtonStyle = (backgroundColor: string): ViewStyle => ({
  backgroundColor,
});
