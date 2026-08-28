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

  header: {
    marginBottom: 16,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 4,
  },

  title: {
    color: colors.text,
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -0.8,
  },

  subtitle: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
    lineHeight: 18,
  },

  summaryCard: {
    backgroundColor: colors.navy,
    borderRadius: 28,
    padding: 20,
    marginBottom: 18,
  },

  summaryTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "900",
  },

  summaryDesc: {
    color: "#AFC0D6",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 7,
  },

  summaryMetricRow: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
    flexDirection: "row",
    alignItems: "center",
  },

  summaryMetric: {
    flex: 1,
  },

  summaryValue: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "900",
  },

  summaryLabel: {
    color: "#8FA3BC",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },

  summaryDivider: {
    width: 1,
    height: 38,
    backgroundColor: "rgba(255,255,255,0.14)",
    marginHorizontal: 16,
  },

  recordList: {
    gap: 12,
  },

  recordCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 15,
  },

  recordTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  recordIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  recordIconText: {
    fontSize: 12,
    fontWeight: "900",
  },

  recordTextWrap: {
    flex: 1,
  },

  recordIdRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    alignItems: "center",
    marginBottom: 4,
  },

  recordId: {
    fontSize: 10,
    fontWeight: "900",
  },

  recordTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 18,
  },

  recordSource: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },

  recordMetaBox: {
    backgroundColor: colors.background,
    borderRadius: 18,
    padding: 12,
    marginTop: 14,
    gap: 8,
  },

  metaLine: {
    flexDirection: "row",
    alignItems: "center",
  },

  metaText: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 7,
  },

  recordFooter: {
    marginTop: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  tapText: {
    fontSize: 10,
    fontWeight: "900",
  },
});

export const dynamicTextStyle = (color: string): TextStyle => ({
  color,
});

export const dynamicBackgroundStyle = (color: string): ViewStyle => ({
  backgroundColor: `${color}18`,
});