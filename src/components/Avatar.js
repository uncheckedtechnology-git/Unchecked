// src/components/Avatar.js
import React from "react";
import { Image, View, Text } from "react-native";
import { useTheme, radius, typography } from "../theme";

export default function Avatar({ uri, size = 44, label }) {
  const { colors } = useTheme();

  if (!uri) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.card2,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={[typography.small, { color: colors.text2 }]}>
          {(label || "?").slice(0, 1).toUpperCase()}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={{
        width: size,
        height: size,
        borderRadius: Math.min(radius.lg, size / 2),
        borderWidth: 1,
        borderColor: colors.border,
      }}
    />
  );
}
