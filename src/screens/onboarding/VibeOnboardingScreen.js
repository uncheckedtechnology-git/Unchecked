import React, { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { colors, useTheme, spacing, typography } from "../../theme";
import Card from "../../components/Card";
import Button from "../../components/Button";
import TextField from "../../components/TextField";
import VerticalTicker from "../../components/VerticalTicker";
import ProgressDots from "../../components/ProgressDots";
import { getUid, updateUser } from "../../services/userService";
import { loadConfig } from "../../services/configService";

const FALLBACK = ["memes", "Spotify playlists", "travel plans", "books", "web series", "gym", "late night talks"];

export default function VibeOnboardingScreen({ navigation }) {
  const { colors } = useTheme();
  const [vibeOn, setVibeOn] = useState("");
  const [saving, setSaving] = useState(false);
  const [cfg, setCfg] = useState(null);

  React.useEffect(() => {
    (async () => {
      const c = await loadConfig();
      setCfg(c || {});
    })();
  }, []);

  const examples = useMemo(() => {
    const arr = cfg?.vibe_examples;
    return Array.isArray(arr) && arr.length ? arr : FALLBACK;
  }, [cfg]);

  async function onNext() {
    const uid = getUid();
    if (!uid) return;
    setSaving(true);
    try {
      await updateUser(uid, { vibeOn: (vibeOn || "").trim().slice(0, 80) });
      navigation.navigate("OnboardingDone");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxl }}>
      <Text style={[typography.h2, { color: colors.text, marginTop: 16 }]}>What you want to vibe on</Text>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={[typography.small, { color: colors.text2 }]}>Examples</Text>
        <VerticalTicker items={examples} height={20} intervalMs={1300} />
      </Card>

      <Card style={{ marginTop: spacing.lg }}>
        <TextField
          label="Vibe on"
          value={vibeOn}
          onChangeText={setVibeOn}
          placeholder="Type your vibe…"
          maxLength={80}
          tickerPlaceholderItems={examples}
          tickerPlaceholderIntervalMs={1300}
        />
      </Card>

      <View style={{ marginTop: spacing.xl }}>
        <Button title="Next" onPress={onNext} loading={saving} />
      </View>
    </ScrollView>
  );
}
