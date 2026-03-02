// src/screens/admin/ConfigEditorScreen.js
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useTheme, spacing, typography } from "../../theme";
import Card from "../../components/Card";
import Button from "../../components/Button";
import TextField from "../../components/TextField";
import Divider from "../../components/Divider";

import { loadPublicConfigRaw, savePublicConfigPatch } from "../../services/adminService";

function parseCSV(str) {
  return (str || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function csvOf(arr) {
  return (arr || []).join(", ");
}

export default function ConfigEditorScreen({ navigation }) {
  const { colors } = useTheme();
  const [cfg, setCfg] = useState(null);
  const [saving, setSaving] = useState(false);

  // editable fields
  const [blurLikes, setBlurLikes] = useState(true);
  const [okCSV, setOkCSV] = useState("");
  const [selfCSV, setSelfCSV] = useState("");
  const [otherExamplesCSV, setOtherExamplesCSV] = useState("");

  // intent options editor (label + key)
  const [intent0, setIntent0] = useState({ key: "hookups", label: "Hookups" });
  const [intent1, setIntent1] = useState({ key: "marriage", label: "Marriage" });
  const [intent2, setIntent2] = useState({ key: "long_term", label: "Long-term relationship" });
  const [intent3, setIntent3] = useState({ key: "friendship", label: "Friendship" });
  const [intent4, setIntent4] = useState({ key: "other", label: "Other" });

  useEffect(() => {
    (async () => {
      const c = await loadPublicConfigRaw();
      setCfg(c || {});
    })();
  }, []);

  useEffect(() => {
    if (!cfg) return;

    setBlurLikes(cfg.blur_likes_received ?? true);
    setOkCSV(csvOf(cfg.ok_with_bubbles || []));
    setSelfCSV(csvOf(cfg.self_concern_bubbles || []));
    setOtherExamplesCSV(csvOf(cfg.other_examples || []));

    const intents = cfg.intent_options || [];
    const byKey = {};
    intents.forEach((x) => (byKey[x.key] = x));
    setIntent0(byKey.hookups || intent0);
    setIntent1(byKey.marriage || intent1);
    setIntent2(byKey.long_term || intent2);
    setIntent3(byKey.friendship || intent3);
    setIntent4(byKey.other || { ...intent4, textMaxLen: 80 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg]);

  const intentOptions = useMemo(() => {
    return [
      { ...intent0 },
      { ...intent1 },
      { ...intent2 },
      { ...intent3 },
      { ...intent4, textMaxLen: intent4.textMaxLen ?? 80 },
    ];
  }, [intent0, intent1, intent2, intent3, intent4]);

  async function save() {
    setSaving(true);
    try {
      const patch = {
        blur_likes_received: !!blurLikes,
        ok_with_bubbles: parseCSV(okCSV).slice(0, 40),
        self_concern_bubbles: parseCSV(selfCSV).slice(0, 40),
        other_examples: parseCSV(otherExamplesCSV).slice(0, 10),
        intent_options: intentOptions,
      };

      await savePublicConfigPatch(patch);
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }

  if (!cfg) {
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

      <Text style={[typography.h2, { color: colors.text, marginTop: 10 }]}>Edit config</Text>
      <Text style={[typography.small, { color: colors.text2, marginTop: 6 }]}>
        Writes to Firestore: app_config/public
      </Text>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={[typography.h3, { color: colors.text }]}>Toggles</Text>
        <Divider />
        <Text style={[typography.small, { color: colors.text2 }]}>
          Likes received blur: <Text style={{ color: colors.text }}>{String(blurLikes)}</Text>
        </Text>
        <View style={{ marginTop: spacing.md, flexDirection: "row", gap: 12 }}>
          <Button title="Blur ON" onPress={() => setBlurLikes(true)} />
          <Button title="Blur OFF" variant="ghost" onPress={() => setBlurLikes(false)} />
        </View>
      </Card>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={[typography.h3, { color: colors.text }]}>Intent options</Text>
        <Text style={[typography.small, { color: colors.text2, marginTop: 6 }]}>
          Keys should stay: hookups, marriage, long_term, friendship, other
        </Text>

        <View style={{ marginTop: spacing.md, gap: spacing.lg }}>
          <TextField label="Hookups label" value={intent0.label} onChangeText={(t) => setIntent0((p) => ({ ...p, label: t }))} />
          <TextField label="Marriage label" value={intent1.label} onChangeText={(t) => setIntent1((p) => ({ ...p, label: t }))} />
          <TextField label="Long-term label" value={intent2.label} onChangeText={(t) => setIntent2((p) => ({ ...p, label: t }))} />
          <TextField label="Friendship label" value={intent3.label} onChangeText={(t) => setIntent3((p) => ({ ...p, label: t }))} />
          <TextField label="Other label" value={intent4.label} onChangeText={(t) => setIntent4((p) => ({ ...p, label: t }))} />
          <TextField
            label="Other max length"
            value={String(intent4.textMaxLen ?? 80)}
            onChangeText={(t) => setIntent4((p) => ({ ...p, textMaxLen: Number(t || 80) }))}
            keyboardType="number-pad"
          />
        </View>
      </Card>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={[typography.h3, { color: colors.text }]}>Ok with bubbles (comma separated)</Text>
        <TextField value={okCSV} onChangeText={setOkCSV} placeholder="e.g., Short height, Introvert, ..." multiline />
      </Card>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={[typography.h3, { color: colors.text }]}>Self-concern bubbles (comma separated)</Text>
        <TextField value={selfCSV} onChangeText={setSelfCSV} placeholder="e.g., Bad texter, Anxiety, ..." multiline />
      </Card>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={[typography.h3, { color: colors.text }]}>Other examples (comma separated)</Text>
        <TextField value={otherExamplesCSV} onChangeText={setOtherExamplesCSV} placeholder="hiking buddy, movie partner, ..." multiline />
      </Card>

      <View style={{ marginTop: spacing.xl }}>
        <Button title="Save to Firebase" onPress={save} loading={saving} />
      </View>
    </ScrollView>
  );
}
