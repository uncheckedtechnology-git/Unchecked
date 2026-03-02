// src/components/Chip.js — Premium pill with gradient selected state
import React from "react";
import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, useTheme, radius, spacing, typography } from "../theme";
import * as Haptics from "expo-haptics";

export default function Chip({ label, selected, onToggle, style }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={async () => {
        try {
          await Haptics.selectionAsync();
        } catch { }
        onToggle?.();
      }}
      style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }, style]}
    >
      {selected ? (
        <LinearGradient
          colors={colors.primaryGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            paddingVertical: 9,
            paddingHorizontal: spacing.md,
            borderRadius: 999,
          }}
        >
          <Text style={[typography.small, { color: "#fff", fontWeight: "600" }]}>
            {label}
          </Text>
        </LinearGradient>
      ) : (
        <View
          style={{
            paddingVertical: 9,
            paddingHorizontal: spacing.md,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card2,
          }}
        >
          <Text style={[typography.small, { color: colors.text2 }]}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
