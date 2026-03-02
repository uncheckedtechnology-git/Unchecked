// src/screens/tabs/MatchesScreen.js
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, Image, Modal } from "react-native";
import { colors, spacing, typography, radius, shadow } from "../../theme";
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
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          opacity: pressed ? 0.92 : 1,
        },
        shadow.card,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: "100%", height: "100%" }}
          blurRadius={blurred ? 18 : 0}
        />
      ) : (
        <View style={{ flex: 1, backgroundColor: colors.card2, alignItems: "center", justifyContent: "center" }}>
          <Text style={[typography.small, { color: colors.text2 }]}>No photo</Text>
        </View>
      )}

      <View style={{ position: "absolute", left: 12, bottom: 12, right: 12, gap: 2 }}>
        <Text style={[typography.body, { color: "#fff" }]} numberOfLines={1}>
          {blurred ? "Someone liked you" : (person?.name || "Like")}
        </Text>
        <Text style={[typography.tiny, { color: "rgba(255,255,255,0.85)" }]} numberOfLines={1}>
          {blurred ? "Unlock in Phase 5" : (person?.age ? `${person.age} yrs` : "")}
        </Text>
      </View>

      {blurred ? (
        <View
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            backgroundColor: "rgba(0,0,0,0.55)",
            borderRadius: 999,
            paddingVertical: 6,
            paddingHorizontal: 10,
          }}
        >
          <Text style={[typography.tiny, { color: "#fff" }]}>Blur</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export default function MatchesScreen() {
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
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxl }}>
        <View style={{ marginTop: 16, gap: 6 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Matches</Text>
          <Text style={[typography.small, { color: colors.text2 }]}>
            Likes received (Bumble-style blur).
          </Text>
        </View>

        <Card style={{ marginTop: spacing.lg }}>
          <Text style={[typography.small, { color: colors.text2 }]}>
            {blurred ? "Blur is ON (curiosity mode)." : "Blur is OFF."}{" "}
            Edit in Firebase: <Text style={{ color: colors.text }}>app_config/public → blur_likes_received</Text>
          </Text>
        </Card>

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

      <Modal visible={paywall} transparent animationType="fade" onRequestClose={() => setPaywall(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: spacing.xl }}>
          <View style={{ borderRadius: radius.xl, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: spacing.lg }}>
            <Text style={[typography.h3, { color: colors.text }]}>Unlock likes (Phase 5)</Text>
            <Text style={[typography.small, { color: colors.text2, marginTop: 8, lineHeight: 18 }]}>
              In the MVP we keep Likes Received blurred to build curiosity. In Phase 5 we’ll add ₹99/month and you can
              see who liked you.
            </Text>
            <View style={{ marginTop: spacing.lg, gap: 10 }}>
              <Button title="Okay" onPress={() => setPaywall(false)} />
              <Button title="Keep blur OFF (for testing)" variant="ghost" onPress={() => { setPaywall(false); }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
