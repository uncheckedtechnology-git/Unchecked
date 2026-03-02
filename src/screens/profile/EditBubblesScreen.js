// src/screens/profile/EditBubblesScreen.js
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useTheme, spacing, typography } from "../../theme";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Chip from "../../components/Chip";
import Divider from "../../components/Divider";

import { getUid, updateUser } from "../../services/userService";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";
import { loadConfig } from "../../services/configService";

function ChipsBlock({ title, subtitle, items, selected, onToggle }) {
  const { colors } = useTheme();
  return (
    <Card>
      <Text style={[typography.h3, { color: colors.text }]}>{title}</Text>
      {!!subtitle && <Text style={[typography.small, { color: colors.text2, marginTop: 6 }]}>{subtitle}</Text>}

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: spacing.md }}>
        {items.map((x) => (
          <Chip key={x} label={x} selected={selected.includes(x)} onToggle={() => onToggle(x)} />
        ))}
      </View>
    </Card>
  );
}

export default function EditBubblesScreen({ navigation }) {
  const { colors } = useTheme();
  const [uid, setUid] = useState(null);
  const [user, setUser] = useState(null);
  const [config, setConfig] = useState(null);

  const [okWith, setOkWith] = useState([]);
  const [selfConcerns, setSelfConcerns] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const id = await getUid();
      setUid(id);
      const cfg = await loadConfig();
      setConfig(cfg);

      const unsub = onSnapshot(doc(db, "users", id), (snap) => {
        const u = snap.data() || null;
        setUser(u);
        setOkWith(u?.okWith || []);
        setSelfConcerns(u?.selfConcerns || []);
      });

      return () => unsub();
    })();
  }, []);

  const okOptions = useMemo(() => config?.ok_with_bubbles || [], [config?.ok_with_bubbles]);
  const selfOptions = useMemo(() => config?.self_concerns_bubbles || [], [config?.self_concerns_bubbles]);

  function toggle(setter, arr, value, max) {
    setter((prev) => {
      const has = prev.includes(value);
      if (has) return prev.filter((x) => x !== value);
      if (prev.length >= max) return prev;
      return [...prev, value];
    });
  }

  async function save() {
    if (!uid) return;
    setSaving(true);
    try {
      await updateUser(uid, { okWith, selfConcerns });
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

  const maxOk = 20;
  const maxSelf = 20;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxl }}>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={[typography.small, { color: colors.text2, marginTop: 16 }]}>← Back</Text>
      </Pressable>

      <Text style={[typography.h2, { color: colors.text, marginTop: 10 }]}>Edit bubbles</Text>
      <Text style={[typography.small, { color: colors.text2, marginTop: 6 }]}>
        Choose up to {maxOk} per section.
      </Text>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={[typography.small, { color: colors.text2 }]}>
          Ok with: <Text style={{ color: colors.text }}>{okWith.length}</Text> / {maxOk}
        </Text>
        <Text style={[typography.small, { color: colors.text2, marginTop: 4 }]}>
          Self-concerns: <Text style={{ color: colors.text }}>{selfConcerns.length}</Text> / {maxSelf}
        </Text>
        <Divider />
        <Text style={[typography.tiny, { color: colors.text2, lineHeight: 16 }]}>
          Matching uses intents + how your "ok with" overlaps with their "self-concerns".
        </Text>
      </Card>

      <View style={{ marginTop: spacing.lg, gap: spacing.lg }}>
        <ChipsBlock
          title="What are you ok with?"
          subtitle="Select what you can accept in others."
          items={okOptions}
          selected={okWith}
          onToggle={(x) => toggle(setOkWith, okWith, x, maxOk)}
        />
        <ChipsBlock
          title="Self-concerns"
          subtitle="Select things you worry about in yourself."
          items={selfOptions}
          selected={selfConcerns}
          onToggle={(x) => toggle(setSelfConcerns, selfConcerns, x, maxSelf)}
        />
      </View>

      <View style={{ marginTop: spacing.xl }}>
        <Button title="Save" onPress={save} loading={saving} />
      </View>
    </ScrollView>
  );
}
