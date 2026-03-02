// src/components/ProgressDots.js
import React from "react";
import { View } from "react-native";
import { useTheme } from "../theme";

export default function ProgressDots({ total = 5, index = 0 }) {
  const { colors } = useTheme();

  return (
    <View style={{ flexDirection: "row", gap: 8, alignSelf: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === index ? 22 : 8,
            height: 8,
            borderRadius: 999,
            backgroundColor: i === index ? colors.primary : colors.border,
          }}
        />
      ))}
    </View>
  );
}
