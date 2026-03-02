import React, { useRef } from "react";
import { Pressable, Text, ActivityIndicator, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme, radius, spacing, typography, shadow } from "../theme";

export default function Button({
  title,
  onPress,
  disabled,
  loading,
  variant = "primary", // primary | ghost | danger
  style,
}) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;
  const scale = useRef(new Animated.Value(1)).current;

  function onPressIn() {
    Animated.spring(scale, { toValue: 0.965, useNativeDriver: true, speed: 40 }).start();
  }
  function onPressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 28 }).start();
  }

  const txtColor =
    variant === "ghost" ? colors.text : "#fff";

  const ghostStyle = {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    opacity: isDisabled ? 0.5 : 1,
  };

  const dangerStyle = {
    backgroundColor: colors.danger,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    opacity: isDisabled ? 0.5 : 1,
    ...shadow.soft,
  };

  if (variant === "ghost") {
    return (
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        <Pressable
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          disabled={isDisabled}
          style={ghostStyle}
        >
          {loading ? (
            <ActivityIndicator color={txtColor} />
          ) : (
            <Text style={[typography.body, { color: txtColor, fontWeight: "600" }]}>{title}</Text>
          )}
        </Pressable>
      </Animated.View>
    );
  }

  if (variant === "danger") {
    return (
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        <Pressable
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          disabled={isDisabled}
          style={dangerStyle}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[typography.body, { color: "#fff", fontWeight: "700" }]}>{title}</Text>
          )}
        </Pressable>
      </Animated.View>
    );
  }

  // Primary — gradient
  return (
    <Animated.View
      style={[
        { transform: [{ scale }] },
        shadow.glow,
        { borderRadius: radius.lg, opacity: isDisabled ? 0.5 : 1 },
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={isDisabled}
        style={{ borderRadius: radius.lg, overflow: "hidden" }}
      >
        <LinearGradient
          colors={colors.primaryGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            paddingVertical: 15,
            paddingHorizontal: spacing.lg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[typography.body, { color: "#fff", fontWeight: "700", letterSpacing: 0.3 }]}>
              {title}
            </Text>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}
