// src/components/AvatarCard.js
import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { useTheme, typography } from "../theme";

export default function AvatarCard({ user, style }) {
  const { colors } = useTheme();
  const g = user?.gender || "other";

  const avatar = useMemo(() => {
    if (g === "man") return "👨";
    if (g === "woman") return "👩";
    return "🙂";
  }, [g]);

  const bg = useMemo(() => {
    if (g === "woman") return ["rgba(236,72,153,0.22)", "rgba(168,85,247,0.18)"];
    if (g === "man") return ["rgba(59,130,246,0.22)", "rgba(139,92,246,0.18)"];
    return ["rgba(16,185,129,0.20)", "rgba(99,102,241,0.16)"];
  }, [g]);

  const name = user?.name || "Someone";
  const age = user?.age != null ? user.age : null;

  return (
    <View
      style={[
        {
          flex: 1,
          borderRadius: 26,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <View style={{ flex: 1, backgroundColor: bg[0] }}>
        <View style={{ position: "absolute", inset: 0, backgroundColor: bg[1] }} />
        <View
          style={{
            position: "absolute",
            width: 280,
            height: 280,
            borderRadius: 280,
            backgroundColor: "rgba(255,255,255,0.08)",
            top: -90,
            left: -80,
          }}
        />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 96 }}>{avatar}</Text>
          <Text style={[typography.small, { color: colors.text2, marginTop: 8 }]}>
            No photos yet
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 14,
            backgroundColor: "rgba(0,0,0,0.35)",
          }}
        >
          <Text style={[typography.h3, { color: "white" }]} numberOfLines={1}>
            {name}
            {age != null ? `, ${age}` : ""}
          </Text>
          {user?.vibeOn ? (
            <Text style={[typography.small, { color: "rgba(255,255,255,0.85)", marginTop: 4 }]} numberOfLines={2}>
              Vibe on: {user.vibeOn}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}
