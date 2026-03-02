// src/screens/tabs/MatchesScreen.js — Premium dark matches grid
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, Image, Modal } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, useTheme, spacing, typography, radius } from "../../theme";
import Card from "../../components/Card";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";

import { getUid } from "../../services/userService";
import { loadConfig } from "../../services/configService";
import { getLikesReceived } from "../../services/matchService";

function LikeCard({ person, blurred, onPress }) {
  const uri = person?.photos?.[0]?.uri;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: "48%",
          aspectRatio: 4 / 5,
          borderRadius: radius.xl,
          overflow: "hidden",
          borderWidth: 1.5,
          borderColor: blurred ? colors.border : colors.glowBorder,
          backgroundColor: colors.card,
          opacity: pressed ? 0.88 : 1,
          shadowColor: blurred ? "#000" : "#E8356D",
          shadowOpacity: blurred ? 0.30 : 0.50,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 10,
        },
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: "100%", height: "100%" }}
          blurRadius={blurred ? 18 : 0}
        />
      ) : (
        <View style={{ flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 32 }}>👤</Text>
          <Text style={[typography.tiny, { color: colors.text2, marginTop: 4 }]}>No photo</Text>
        </View>
      )}

      {/* Name overlay */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.75)"]}
        style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 12, paddingBottom: 12, paddingTop: 28 }}
      >
        <Text style={[typography.body, { color: "#fff", fontWeight: "700" }]} numberOfLines={1}>
          {blurred ? "Someone liked you" : (person?.name || "Like")}
        </Text>
        <Text style={[typography.tiny, { color: "rgba(255,255,255,0.75)" }]} numberOfLines={1}>
          {blurred ? "Unlock to see" : (person?.age ? `${person.age} yrs` : "")}
        </Text>
      </LinearGradient>

      {blurred ? (
        <View
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            backgroundColor: "rgba(0,0,0,0.65)",
            borderRadius: 999,
            paddingVertical: 5,
            paddingHorizontal: 10,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={[typography.tiny, { color: "#fff" }]}>🔒</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export default function MatchesScreen() {
  const { colors } = useTheme();
  const [uid, setUid] = useState(null);
  const [config, setConfig] = useState(null);
  const [likes, setLikes] = useState([]);
  const [paywall, setPaywall] = useState(false);

  useEffect(() => {
    (async () => {
      const id = await getUid();
      setUid(id);
      const cfg = await loadConfig();
      setConfig(cfg);
      const list = await getLikesReceived(id);
      setLikes(list || []);
    })();
  }, []);

  const blurred = useMemo(() => (config?.blur_likes_received ?? true), [config]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 100 }}>
        {/* Header */}
        <View style={{ marginTop: 16, gap: 6 }}>
          <Text style={[typography.h2, { color: colors.text }]}>💌 Matches</Text>
          <Text style={[typography.small, { color: colors.text2 }]}>
            People who liked you
          </Text>
        </View>

        {/* Info card */}
        <Card style={{ marginTop: spacing.lg }} glow={false}>
          <Text style={[typography.small, { color: colors.text2 }]}>
            {blurred ? "🔒 Blur is ON — curiosity mode." : "✅ Blur is OFF."}{" "}
            <Text style={{ color: colors.text2 }}>Edit in Firebase: </Text>
            <Text style={{ color: colors.primary }}>app_config/public → blur_likes_received</Text>
          </Text>
        </Card>

        {/* Grid */}
        <View style={{ marginTop: spacing.lg }}>
          {likes.length === 0 ? (
            <Card>
              <EmptyState title="No likes yet" subtitle="Seed users or swipe a bit. Likes will appear here." />
            </Card>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
              {likes.map((p, i) => (
                <LikeCard
                  key={p.uid || i}
                  person={p}
                  blurred={blurred}
                  onPress={() => (blurred ? setPaywall(true) : null)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Paywall modal */}
      <Modal visible={paywall} transparent animationType="fade" onRequestClose={() => setPaywall(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "center", padding: spacing.xl }}>
          <Card style={{ borderColor: colors.glowBorder }}>
            <Text style={{ fontSize: 36, textAlign: "center", marginBottom: 8 }}>💌</Text>
            <Text style={[typography.h3, { color: colors.text, textAlign: "center" }]}>Unlock Likes</Text>
            <Text style={[typography.small, { color: colors.text2, marginTop: 8, lineHeight: 20, textAlign: "center" }]}>
              In Phase 5 we'll add ₹99/month and you can see who liked you.
            </Text>
            <View style={{ marginTop: spacing.lg, gap: 10 }}>
              <Button title="Got it 👍" onPress={() => setPaywall(false)} />
              <Button title="Keep blur OFF (testing)" variant="ghost" onPress={() => setPaywall(false)} />
            </View>
          </Card>
        </View>
      </Modal>
    </View>
  );
}
