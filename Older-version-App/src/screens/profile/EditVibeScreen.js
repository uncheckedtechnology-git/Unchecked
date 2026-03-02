// src/screens/profile/EditVibeScreen.js
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { colors, spacing, typography } from "../../theme";
import Card from "../../components/Card";
import Button from "../../components/Button";
import TextField from "../../components/TextField";
import Divider from "../../components/Divider";
import VerticalTicker from "../../components/VerticalTicker";

import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";
import { getUid, updateUser } from "../../services/userService";
import { loadConfig } from "../../services/configService";

const FALLBACK_VIBES = [
  "AC temperature",
  "Spotify playlist",
  "Memes",
  "YouTube channels you follow",
  "Gym / fitness",
  "Travel plans",
  "Books",
  "Web series",
  "Food spots",
  "Late-night talks",
];

export default function EditVibeScreen({ navigation }) {
  const [uid, setUid] = useState(null);
  const [user, setUser] = useState(null);
  const [config, setConfig] = useState(null);

  const [vibeOn, setVibeOn] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const id = getUid();
      if (!id) return;
      setUid(id);

      const cfg = await loadConfig();
      setConfig(cfg);

      const unsub = onSnapshot(doc(db, "users", id), (snap) => {
        const u = snap.data() || null;
        setUser(u);
        setVibeOn(u?.vibeOn || "");
      });

      return () => unsub();
    })();
  }, []);

  const examples = useMemo(() => {
    const arr = config?.vibe_examples;
    return Array.isArray(arr) && arr.length ? arr : FALLBACK_VIBES;
  }, [config]);

  async function save() {
    if (!uid) return;
    setSaving(true);
    try {
      await updateUser(uid, { vibeOn: (vibeOn || "").trim().slice(0, 80) });
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }

  if (!user || !config) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <Text style={[typography.small, { color: colors.text2 }]}>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxl }}>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={[typography.small, { color: colors.text2, marginTop: 16 }]}>← Back</Text>
      </Pressable>

      <Text style={[typography.h2, { color: colors.text, marginTop: 10 }]}>What you want to vibe on</Text>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={[typography.small, { color: colors.text2 }]}>Examples</Text>
        <VerticalTicker items={examples} height={20} intervalMs={1500} />
        <Divider />
        <Text style={[typography.tiny, { color: colors.text2, lineHeight: 16 }]}>
          Write anything — we’ll use this later for better matching/search.
        </Text>
      </Card>

      <Card style={{ marginTop: spacing.lg }}>
        {/* <TextField
          label="Vibe on (short)"
          value={vibeOn}
          onChangeText={setVibeOn}
          placeholder="e.g., memes + Spotify playlists"
          maxLength={80}
        /> */}
        <TextField
  label="Vibe on (short)"
  value={vibeOn}
  onChangeText={setVibeOn}
  placeholder="Type your vibe…"
  maxLength={80}
  tickerPlaceholderItems={examples}
  tickerPlaceholderIntervalMs={1300}
/>

      </Card>

      <View style={{ marginTop: spacing.xl }}>
        <Button title="Save" onPress={save} loading={saving} />
      </View>
    </ScrollView>
  );
}
