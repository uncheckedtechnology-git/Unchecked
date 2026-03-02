// src/components/BlurredCard.js
import React from "react";
import { View, Text, Image, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { useTheme, radius, spacing, typography, shadow } from "../theme";

export default function BlurredCard({
  photoUri,
  title,
  subtitle,
  blurred = true,
  cta = "Tap to reveal",
  onPress,
  style,
}) {
  const { colors, isDark } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          borderRadius: radius.xl,
          overflow: "hidden",
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          opacity: pressed ? 0.95 : 1,
        },
        shadow.card,
        style,
      ]}
    >
      <View style={{ height: 220, backgroundColor: colors.card2 }}>
        {!!photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : null}

        {blurred ? (
          <BlurView
            intensity={35}
            tint={isDark ? "dark" : "light"}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              alignItems: "center",
              justifyContent: "center",
              padding: spacing.lg,
            }}
          >
            <Text style={[typography.h3, { color: "#fff", textAlign: "center" }]}>
              {cta}
            </Text>
          </BlurView>
        ) : null}
      </View>

      <View style={{ padding: spacing.lg, gap: 6 }}>
        <Text style={[typography.h3, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={[typography.small, { color: colors.text2 }]} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
