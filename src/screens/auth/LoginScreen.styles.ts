import { StyleSheet } from "react-native";
import { accentGlow, colors } from "../../theme/colors";
import { radius } from "../../theme/spacing";

export const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 20,
  },

  brandBlock: {
    position: "relative",
    marginBottom: 20,
  },
  dotPattern: {
    position: "absolute",
    top: -6,
    right: 0,
  },
  logoBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    ...accentGlow,
    shadowOpacity: 0.2,
  },
  logoImage: {
    width: 36,
    height: 36,
  },
  brandWordmark: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  brandName: {
    color: colors.blue,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 2,
  },
  brandTag: {
    color: colors.textSoft,
    fontSize: 12.5,
    fontWeight: "600",
    marginTop: 3,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: 20,
    ...accentGlow,
    shadowOpacity: 0.06,
    shadowColor: colors.black,
  },

  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  subtitle: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 17,
    marginTop: 4,
    marginBottom: 16,
  },

  fieldLabel: {
    color: colors.blue,
    fontSize: 12.5,
    fontWeight: "700",
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    marginBottom: 12,
    minHeight: 48,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: "500",
    paddingVertical: 10,
  },
  eyeButton: {
    width: 36,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginRight: -8,
  },

  errorBox: {
    backgroundColor: "rgba(220, 38, 38, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.28)",
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  errorText: {
    color: colors.red,
    fontSize: 11.5,
    fontWeight: "600",
    lineHeight: 16,
  },

  button: {
    minHeight: 50,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    overflow: "hidden",
    ...accentGlow,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
    marginBottom: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderSoft,
  },
  dividerText: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
  },

  guestButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  guestButtonText: {
    color: colors.blue,
    fontSize: 12.5,
    fontWeight: "700",
  },

  protectedLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
    textAlign: "center",
    marginTop: 18,
    marginBottom: 10,
  },
  securityRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  securityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  securityChipText: {
    color: colors.textSoft,
    fontSize: 10.5,
    fontWeight: "600",
  },

  taglineBlock: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 8,
  },
  taglineTitle: {
    color: colors.text,
    fontSize: 12.5,
    fontWeight: "700",
    marginTop: 6,
  },
  taglineText: {
    color: colors.muted,
    fontSize: 10.5,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 3,
    maxWidth: 280,
    lineHeight: 15,
  },
});
