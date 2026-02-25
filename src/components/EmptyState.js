// src/components/EmptyState.js
import React from "react";
import { View, Text } from "react-native";
import { colors, spacing, typography } from "../theme";

export default function EmptyState({ title, subtitle }) {
  return (
    <View style={{ padding: spacing.xl, alignItems: "center", gap: 8 }}>
      <Text style={[typography.h3, { color: colors.text, textAlign: "center" }]}>
        {title}
      </Text>
      {!!subtitle && (
        <Text
          style={[
            typography.small,
            { color: colors.text2, textAlign: "center", lineHeight: 18 },
          ]}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}
