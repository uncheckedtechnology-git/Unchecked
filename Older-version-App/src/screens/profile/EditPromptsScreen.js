// src/screens/profile/EditPromptsScreen.js
import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { colors, spacing, typography } from "../../theme";
import Card from "../../components/Card";
import Button from "../../components/Button";
import TextField from "../../components/TextField";
import Divider from "../../components/Divider";

import { getUid, updateUser } from "../../services/userService";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";
import { loadConfig } from "../../services/configService";
import { pickDefaultPrompts } from "../../data/defaults";

export default function EditPromptsScreen({ navigation }) {
  const [uid, setUid] = useState(null);
  const [user, setUser] = useState(null);
  const [config, setConfig] = useState(null);
  const [local, setLocal] = useState([]);
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
        const base = (u?.prompts && u.prompts.length) ? u.prompts : pickDefaultPrompts(cfg, cfg.max_prompts || 3);
        setLocal(base.map((p) => ({ q: p.q, a: p.a || "" })));
      });
      return () => unsub();
    })();
  }, []);

  function setAnswer(i, txt) {
    setLocal((prev) => prev.map((p, idx) => (idx === i ? { ...p, a: txt } : p)));
  }

  async function save() {
    if (!uid) return;
    setSaving(true);
    try {
      await updateUser(uid, { prompts: local.map((p) => ({ q: p.q, a: (p.a || "").slice(0, 140) })) });
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

      <Text style={[typography.h2, { color: colors.text, marginTop: 10 }]}>Edit prompts</Text>
      <Text style={[typography.small, { color: colors.text2, marginTop: 6 }]}>Short, specific answers work best.</Text>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={[typography.small, { color: colors.text2 }]}>
          {local.length} prompts • max 140 chars each
        </Text>
      </Card>

      <Card style={{ marginTop: spacing.lg }}>
        <View style={{ gap: spacing.lg }}>
          {local.map((p, i) => (
            <View key={i} style={{ gap: 10 }}>
              <Text style={[typography.body, { color: colors.text }]}>{p.q}</Text>
              <TextField
                value={p.a}
                onChangeText={(t) => setAnswer(i, t)}
                placeholder="Type your answer…"
                maxLength={140}
                multiline
              />
              {i !== local.length - 1 ? <Divider /> : null}
            </View>
          ))}
        </View>
      </Card>

      <View style={{ marginTop: spacing.xl }}>
        <Button title="Save" onPress={save} loading={saving} />
      </View>
    </ScrollView>
  );
}
