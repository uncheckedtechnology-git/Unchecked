// src/components/Card.js
import React from "react";
import { View } from "react-native";
import { colors, radius, spacing, shadow } from "../theme";

export default function Card({ children, style, padded = true }) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.border,
          padding: padded ? spacing.lg : 0,
        },
        shadow.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}
