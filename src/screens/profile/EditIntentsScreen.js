// src/screens/profile/EditIntentsScreen.js
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useTheme, spacing, typography } from "../../theme";
import Card from "../../components/Card";
import Button from "../../components/Button";
import SliderRow from "../../components/SliderRow";
import TextField from "../../components/TextField";
import VerticalTicker from "../../components/VerticalTicker";

import { getUid, updateUser } from "../../services/userService";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";
import { loadConfig } from "../../services/configService";

const TOTAL = 100;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function redistribute(intents, changedKey, newValue, keys) {
  const next = { ...intents };
  newValue = clamp(Math.round(newValue), 0, TOTAL);
  next[changedKey] = newValue;

  const others = keys.filter((k) => k !== changedKey);
  const remaining = TOTAL - newValue;

  if (others.length === 0) return next;

  const currentSum = others.reduce((s, k) => s + (next[k] || 0), 0);

  if (currentSum === 0) {
    const base = Math.floor(remaining / others.length);
    let extra = remaining - base * others.length;
    for (const k of others) {
      next[k] = base + (extra > 0 ? 1 : 0);
      if (extra > 0) extra--;
    }
    return next;
  }

  let allocated = 0;
  const floats = {};
  for (const k of others) {
    const portion = (next[k] || 0) / currentSum;
    const v = portion * remaining;
    floats[k] = v;
    next[k] = Math.floor(v);
    allocated += next[k];
  }

  let leftover = remaining - allocated;
  const fracSorted = others
    .map((k) => ({ k, frac: floats[k] - Math.floor(floats[k]) }))
    .sort((a, b) => b.frac - a.frac);

  let i = 0;
  while (leftover > 0) {
    next[fracSorted[i % fracSorted.length].k] += 1;
    leftover--;
    i++;
  }

  return next;
}

export default function EditIntentsScreen({ navigation }) {
  const { colors } = useTheme();
  const [uid, setUid] = useState(null);
  const [user, setUser] = useState(null);
  const [config, setConfig] = useState(null);

  const [local, setLocal] = useState({});
  const [otherText, setOtherText] = useState("");
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

        const keys = (cfg.intent_options || []).map((o) => o.key);
        let intents = u?.intents || {};
        // ensure all keys exist and sum to 100
        const sum = keys.reduce((s, k) => s + (intents[k] || 0), 0);
        if (sum !== 100) {
          // normalize roughly
          const base = Math.floor(TOTAL / keys.length);
          let extra = TOTAL - base * keys.length;
          const init = {};
          keys.forEach((k) => {
            init[k] = base + (extra > 0 ? 1 : 0);
            if (extra > 0) extra--;
          });
          intents = init;
        } else {
          const fixed = {};
          keys.forEach((k) => (fixed[k] = intents[k] || 0));
          intents = fixed;
        }

        setLocal(intents);
        setOtherText(u?.otherText || "");
      });

      return () => unsub();
    })();
  }, []);

  const keys = useMemo(
    () => (config?.intent_options || []).map((o) => o.key),
    [config?.intent_options],
  );
  const otherDef = useMemo(
    () => (config?.intent_options || []).find((x) => x.key === "other"),
    [config?.intent_options],
  );
  const totalNow = useMemo(
    () => keys.reduce((s, k) => s + (local[k] || 0), 0),
    [keys, local],
  );

  function onChange(key, v) {
    setLocal((prev) => redistribute(prev, key, v, keys));
  }

  async function save() {
    if (!uid) return;
    setSaving(true);
    try {
      const maxLen = otherDef?.textMaxLen ?? 80;
      await updateUser(uid, {
        intents: local,
        otherText: (otherText || "").trim().slice(0, maxLen),
      });
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }

  if (!user || !config) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={[typography.small, { color: colors.text2 }]}>
          Loading…
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.xl }}>
      <Pressable onPress={() => navigation.goBack()}>
        <Text
          style={[typography.small, { color: colors.text2, marginTop: 16 }]}
        >
          ← Back
        </Text>
      </Pressable>

      <Text style={[typography.h2, { color: colors.text, marginTop: 10 }]}>
        Edit intents
      </Text>
      <Text style={[typography.small, { color: colors.text2, marginTop: 6 }]}>
        Total must be 100. Moving one adjusts the others.
      </Text>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={[typography.small, { color: colors.text2 }]}>
          Total: <Text style={{ color: colors.text }}>{totalNow}</Text> / 100
        </Text>
      </Card>

      <ScrollView
        style={{ marginTop: spacing.lg }}
        contentContainerStyle={{ paddingBottom: spacing.xl, gap: spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        {(config.intent_options || []).map((o) => (
          <Card key={o.key}>
            <SliderRow
              label={o.label}
              value={local[o.key] ?? 0}
              min={0}
              max={100}
              step={1}
              onChange={(v) => onChange(o.key, v)}
            />
            {o.key === "other" ? (
              <View style={{ marginTop: spacing.md }}>
                {/* <TextField
                  label="Other (optional)"
                  value={otherText}
                  onChangeText={setOtherText}
                  placeholder="e.g., hiking buddy / movie partner"
                  maxLength={o.textMaxLen ?? 80}
                /> */}
                <TextField
  label="Other (optional)"
  value={otherText}
  onChangeText={setOtherText}
  placeholder="Type your own…"
  maxLength={o.textMaxLen ?? 80}
  tickerPlaceholderItems={config?.other_examples || ["hiking buddy", "movie partner", "gym partner", "late-night talks", "someone to travel with"]}
  tickerPlaceholderIntervalMs={1300}
/>

                {Array.isArray(config?.other_examples) &&
                config.other_examples.length ? (
                  <View style={{ marginTop: 8 }}>
                    <VerticalTicker
                      items={config.other_examples}
                      height={20}
                      intervalMs={1500}
                    />
                  </View>
                ) : null}
              </View>
            ) : null}
          </Card>
        ))}
      </ScrollView>

      <Button title="Save" onPress={save} loading={saving} />
    </View>
  );
}
