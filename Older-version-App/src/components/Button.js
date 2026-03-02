// src/components/Button.js
import React from "react";
import { Pressable, Text, ActivityIndicator } from "react-native";
import { colors, radius, spacing, typography, shadow } from "../theme";

export default function Button({
  title,
  onPress,
  disabled,
  loading,
  variant = "primary", // primary | ghost | danger
  style,
}) {
  const isDisabled = disabled || loading;

  const bg =
    variant === "ghost"
      ? "transparent"
      : variant === "danger"
      ? colors.danger
      : colors.primary;

  const border =
    variant === "ghost" ? { borderWidth: 1, borderColor: colors.border } : null;

  const txt =
    variant === "ghost" ? colors.text : variant === "danger" ? "#fff" : "#fff";

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          paddingVertical: 14,
          paddingHorizontal: spacing.lg,
          borderRadius: radius.lg,
          alignItems: "center",
          justifyContent: "center",
          opacity: isDisabled ? 0.55 : pressed ? 0.9 : 1,
        },
        variant !== "ghost" ? shadow.soft : null,
        border,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={txt} />
      ) : (
        <Text style={[typography.body, { color: txt }]}>{title}</Text>
      )}
    </Pressable>
  );
}
