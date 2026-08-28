import { StyleSheet } from "react-native";
import type { TextStyle, ViewStyle } from "react-native";

import { colors } from "../../theme/colors";

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

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 16,
  },

  backText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900",
    marginLeft: 6,
  },

  profileCard: {
    backgroundColor: colors.navy,
    borderRadius: 30,
    padding: 20,
    marginBottom: 16,
  },

  profileTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  profileIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  badgeWrap: {
    alignItems: "flex-end",
  },

  profileLabel: {
    color: "#8FA3BC",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginTop: 20,
  },

  profileTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginTop: 6,
    lineHeight: 28,
  },

  profileDesc: {
    color: "#AFC0D6",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 8,
  },

  profileMetricRow: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
    flexDirection: "row",
    alignItems: "center",
  },

  profileMetric: {
    flex: 1,
  },

  profileValue: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "900",
  },

  profileMetricLabel: {
    color: "#8FA3BC",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },

  profileDivider: {
    width: 1,
    height: 38,
    backgroundColor: "rgba(255,255,255,0.14)",
    marginHorizontal: 16,
  },

  infoPanel: {
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 16,
  },

  panelTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
    paddingTop: 14,
    paddingBottom: 2,
  },

  infoTextRow: {
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  infoTextLabel: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "800",
  },

  infoTextValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 4,
    lineHeight: 18,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
    marginLeft: 7,
  },

  sectionList: {
    gap: 12,
    marginBottom: 16,
  },

  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 15,
    flexDirection: "row",
  },

  sectionNumber: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  sectionNumberText: {
    fontSize: 13,
    fontWeight: "900",
  },

  sectionTextWrap: {
    flex: 1,
  },

  sectionCardTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },

  sectionStatement: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 4,
  },

  actionPanel: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    marginBottom: 16,
  },

  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "#EBF8F1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  actionTextWrap: {
    flex: 1,
  },

  actionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },

  actionText: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 4,
  },

  generateButton: {
    backgroundColor: colors.blue,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  generateButtonDisabled: {
    opacity: 0.65,
  },

  generateButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "900",
    marginLeft: 8,
  },
});

export const solidBackgroundStyle = (color: string): ViewStyle => ({
  backgroundColor: color,
});

export const softBackgroundStyle = (color: string): ViewStyle => ({
  backgroundColor: `${color}18`,
});

export const dynamicTextStyle = (color: string): TextStyle => ({
  color,
});