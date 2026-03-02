// src/screens/tabs/ProfileScreen.js — Premium profile with theme toggle
import React, { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme, spacing, typography, radius } from "../../theme";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Divider from "../../components/Divider";
import { logout } from "../../services/authService";

import { getUid } from "../../services/userService";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";

function topIntents(intents = {}) {
  const pairs = [
    ["Hookups", intents.hookups || 0],
    ["Marriage", intents.marriage || 0],
    ["Long-term", intents.long_term || 0],
    ["Friendship", intents.friendship || 0],
    ["Other", intents.other || 0],
  ].sort((a, b) => b[1] - a[1]);
  return pairs.slice(0, 3);
}

const THEME_OPTIONS = [
  { key: "light", label: "☀️ Light" },
  { key: "dark", label: "🌙 Dark" },
  { key: "system", label: "📱 System" },
];

export default function ProfileScreen({ navigation }) {
  const { colors, setTheme, themeMode, isDark } = useTheme();
  const [user, setUser] = useState(null);
  const taps = useRef(0);
  const lastTap = useRef(0);

  useEffect(() => {
    (async () => {
      const id = await getUid();
      const ref = doc(db, "users", id);
      const unsub = onSnapshot(ref, (snap) => setUser(snap.data() || null));
      return () => unsub();
    })();
  }, []);

  function handleAdminTap() {
    const now = Date.now();
    if (now - lastTap.current > 900) taps.current = 0;
    lastTap.current = now;
    taps.current += 1;
    if (taps.current >= 5) {
      taps.current = 0;
      // later: open admin panel
    }
  }

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 32 }}>⏳</Text>
        <Text style={[typography.small, { color: colors.text2, marginTop: 8 }]}>Loading…</Text>
      </View>
    );
  }

  const topPhoto = user?.photos?.[0]?.uri;
  const top3 = topIntents(user?.intents);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* Hero photo with gradient scrim */}
      <Pressable onPress={handleAdminTap}>
        <View style={{ width: "100%", height: 380, backgroundColor: colors.surface }}>
          {topPhoto ? (
            <Image source={{ uri: topPhoto }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 64 }}>👤</Text>
              <Text style={[typography.small, { color: colors.text2, marginTop: 12 }]}>No photo yet</Text>
            </View>
          )}

          {/* Bottom gradient scrim */}
          <LinearGradient
            colors={["transparent", isDark ? "rgba(13,13,20,0.7)" : "rgba(250,250,250,0.7)", colors.bg]}
            style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 200 }}
          />

          {/* Name/age overlay */}
          <View style={{ position: "absolute", bottom: 20, left: spacing.xl, right: spacing.xl }}>
            <Text style={[typography.h2, { color: "#fff" }]}>
              {user.name || "—"}
              {user.age ? <Text style={{ color: colors.primary }}> · {user.age}</Text> : ""}
            </Text>
          </View>
        </View>
      </Pressable>

      {/* Stats card */}
      <View style={{ padding: spacing.xl, gap: 16, marginTop: -8 }}>
        <Card>
          <Text style={[typography.label, { color: colors.primary, marginBottom: 12 }]}>
            Top Intents
          </Text>
          {top3.map(([label, val]) => (
            <View key={label} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
              <Text style={[typography.body, { color: colors.text }]}>{label}</Text>
              <Text style={[typography.body, { color: val > 0 ? colors.primary : colors.muted, fontWeight: "700" }]}>
                {val}
              </Text>
            </View>
          ))}

          {!!user.otherText && (
            <Text style={[typography.small, { color: colors.text2, marginTop: 4 }]}>
              Other: <Text style={{ color: colors.text }}>{user.otherText}</Text>
            </Text>
          )}

          <Divider style={{ marginVertical: spacing.sm }} />

          <Text style={[typography.small, { color: colors.text2, lineHeight: 20 }]}>
            Ok with:{" "}
            <Text style={{ color: colors.text }}>
              {(user.okWith || []).slice(0, 4).join(", ") || "—"}
            </Text>
            {user.okWith?.length > 4 ? (
              <Text style={{ color: colors.muted }}> +{user.okWith.length - 4} more</Text>
            ) : null}
          </Text>

          <Text style={[typography.small, { color: colors.text2, lineHeight: 20, marginTop: 6 }]}>
            Self-concerns:{" "}
            <Text style={{ color: colors.text }}>
              {(user.selfConcerns || []).slice(0, 4).join(", ") || "—"}
            </Text>
            {user.selfConcerns?.length > 4 ? (
              <Text style={{ color: colors.muted }}> +{user.selfConcerns.length - 4} more</Text>
            ) : null}
          </Text>
        </Card>

        {/* ── Theme Toggle ────────────────────── */}
        <Card>
          <Text style={[typography.label, { color: colors.primary, marginBottom: 12 }]}>
            🎨 Appearance
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {THEME_OPTIONS.map((opt) => {
              const isActive = themeMode === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setTheme(opt.key)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1.5,
                    borderColor: isActive ? colors.primary : colors.border,
                    backgroundColor: isActive ? (isDark ? "rgba(232,53,109,0.15)" : "rgba(232,53,109,0.10)") : colors.card2,
                  }}
                >
                  <Text
                    style={[
                      typography.small,
                      {
                        color: isActive ? colors.primary : colors.text2,
                        fontWeight: isActive ? "700" : "500",
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Actions */}
        <Button
          title="✏️  Edit Profile"
          variant="ghost"
          onPress={() => navigation.navigate("EditProfile")}
        />
        <Button
          title="Log out"
          variant="ghost"
          onPress={async () => {
            try { await logout(); } catch (e) { console.log("logout error", e); }
          }}
        />
      </View>
    </ScrollView>
  );
}
