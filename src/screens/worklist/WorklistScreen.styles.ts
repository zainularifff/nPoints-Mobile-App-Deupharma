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

  header: {
    marginBottom: 16,
  },

  eyebrow: {
    color: colors.blue,
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

  heroCard: {
    backgroundColor: colors.navy,
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
  },

  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 19,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
  },

  heroTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 18,
  },

  heroDesc: {
    color: "#AFC0D6",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 7,
  },

  heroMetricRow: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
    flexDirection: "row",
    alignItems: "center",
  },

  heroMetric: {
    flex: 1,
  },

  heroValue: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "900",
  },

  heroMetricLabel: {
    color: "#8FA3BC",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },

  heroDivider: {
    width: 1,
    height: 38,
    backgroundColor: "rgba(255,255,255,0.14)",
    marginHorizontal: 16,
  },

  filterHeader: {
    marginBottom: 9,
  },

  filterTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
  },

  filterTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
    marginLeft: 6,
  },

  dropdownButton: {
    backgroundColor: colors.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 15,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  dropdownLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 3,
  },

  dropdownValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },

  dropdownIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#EAF1FF",
    alignItems: "center",
    justifyContent: "center",
  },

  resultSummary: {
    marginBottom: 12,
  },

  resultText: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "800",
  },

  listWrap: {
    gap: 12,
  },

  workCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 15,
  },

  workTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  workTextWrap: {
    flex: 1,
  },

  workIdRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 4,
  },

  workId: {
    fontSize: 10,
    fontWeight: "900",
  },

  workTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 18,
  },

  workSource: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },

  metaBox: {
    backgroundColor: colors.background,
    borderRadius: 18,
    padding: 12,
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },

  metaItem: {
    flex: 1,
  },

  metaLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "800",
  },

  metaValue: {
    color: colors.text,
    fontSize: 10,
    fontWeight: "900",
    marginTop: 3,
  },

  workFooter: {
    marginTop: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  updatedText: {
    color: colors.textSoft,
    fontSize: 10,
    fontWeight: "700",
  },

  openWrap: {
    flexDirection: "row",
    alignItems: "center",
  },

  openText: {
    fontSize: 10,
    fontWeight: "900",
    marginRight: 4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(7, 17, 32, 0.62)",
    justifyContent: "flex-end",
  },

  dropdownModal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
    maxHeight: "76%",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
  },

  modalSubtitle: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },

  optionList: {
    gap: 10,
  },

  optionRow: {
    backgroundColor: colors.background,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  optionRowActive: {
    backgroundColor: "#EAF1FF",
    borderColor: "#BFD7FF",
  },

  optionTextWrap: {
    flex: 1,
    paddingRight: 10,
  },

  optionText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
  },

  optionTextActive: {
    color: colors.blue,
  },

  optionSubtext: {
    color: colors.textSoft,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 3,
    lineHeight: 14,
  },
});

export const typeIconStyle = (color: string): ViewStyle => ({
  backgroundColor: `${color}18`,
});

export const workIdStyle = (color: string): TextStyle => ({
  color,
});

export const openTextStyle = (color: string): TextStyle => ({
  color,
});