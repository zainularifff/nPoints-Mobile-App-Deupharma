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

  headerCard: {
    backgroundColor: colors.white,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 16,
  },

  moduleIcon: {
    width: 58,
    height: 58,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
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
    marginTop: 5,
    lineHeight: 18,
  },

  purposeCard: {
    backgroundColor: colors.navy,
    borderRadius: 28,
    padding: 20,
    marginBottom: 18,
  },

  purposeLabel: {
    color: "#8FA3BC",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  purposeText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
    marginTop: 8,
  },

  metricRow: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
    flexDirection: "row",
    alignItems: "center",
  },

  metricBlock: {
    flex: 1,
  },

  metricValue: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "900",
  },

  metricLabel: {
    color: "#8FA3BC",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },

  metricDivider: {
    width: 1,
    height: 38,
    backgroundColor: "rgba(255,255,255,0.14)",
    marginHorizontal: 16,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 3,
  },

  sectionDesc: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 12,
  },

  categoryList: {
    gap: 12,
  },

  categoryCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
  },

  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  categoryTextWrap: {
    flex: 1,
  },

  categoryTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },

  categoryDesc: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 15,
    marginTop: 3,
  },

  categoryRight: {
    alignItems: "flex-end",
    marginRight: 8,
    gap: 5,
  },

  categoryValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
});

export const moduleIconStyle = (color: string): ViewStyle => ({
  backgroundColor: color,
});

export const eyebrowStyle = (color: string): TextStyle => ({
  color,
});

export const categoryIconStyle = (color: string): ViewStyle => ({
  backgroundColor: `${color}18`,
});