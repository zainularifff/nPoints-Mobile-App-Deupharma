import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { tones, type StatusTone } from "../theme/colors";

type Props = {
  label: string;
  tone?: StatusTone;
};

export default function StatusPill({ label, tone = "blue" }: Props) {
  const selected = tones[tone] || tones.blue;

  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: selected.bg, borderColor: selected.border },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: selected.text }]} />
      <Text style={[styles.text, { color: selected.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    marginRight: 6,
  },
  text: {
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
