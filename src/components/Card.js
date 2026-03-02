import React from "react";
import { View } from "react-native";
import { useTheme, radius, spacing } from "../theme";

export default function Card({ children, style, padded = true, glow = false }) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: glow ? colors.glowBorder : colors.border,
          padding: padded ? spacing.lg : 0,
          // soft shadow to lift from dark bg
          shadowColor: glow ? "#E8356D" : "#000",
          shadowOpacity: glow ? 0.30 : 0.40,
          shadowRadius: glow ? 20 : 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: glow ? 12 : 8,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
