// src/components/Chip.js
import React from "react";
import { Pressable, Text } from "react-native";
import { colors, radius, spacing, typography } from "../theme";
import * as Haptics from "expo-haptics";

export default function Chip({ label, selected, onToggle, style }) {
  return (
    <Pressable
      onPress={async () => {
        try {
          await Haptics.selectionAsync();
        } catch {}
        onToggle?.();
      }}
      style={({ pressed }) => [
        {
          paddingVertical: 10,
          paddingHorizontal: spacing.md,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: selected ? "transparent" : colors.border,
          backgroundColor: selected ? colors.primary : colors.card2,
          opacity: pressed ? 0.9 : 1,
        },
        style,
      ]}
    >
      <Text
        style={[
          typography.small,
          { color: selected ? "#fff" : colors.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
