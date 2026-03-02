// src/screens/onboarding/IntentSlidersScreen.js
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { colors, spacing, typography } from "../../theme";
import ProgressDots from "../../components/ProgressDots";
import Button from "../../components/Button";
import Card from "../../components/Card";
import SliderRow from "../../components/SliderRow";
import TextField from "../../components/TextField";

import { getUid, updateUser } from "../../services/userService";
import { loadConfig } from "../../services/configService";

const TOTAL = 100;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function roundInt(n) {
  return Math.round(n);
}

// Redistribute remaining points across "other keys" proportionally to their current weights.
// If all others are zero, distribute equally.
function redistribute(intents, changedKey, newValue, keys) {
  const next = { ...intents };

  newValue = clamp(roundInt(newValue), 0, TOTAL);
  next[changedKey] = newValue;

  const others = keys.filter((k) => k !== changedKey);
  const remaining = TOTAL - newValue;

  if (others.length === 0) return next;

  const currentSum = others.reduce((s, k) => s + (next[k] || 0), 0);

  if (currentSum === 0) {
    // equal distribution
    const base = Math.floor(remaining / others.length);
    let extra = remaining - base * others.length;
    for (const k of others) {
      next[k] = base + (extra > 0 ? 1 : 0);
      if (extra > 0) extra--;
    }
    return next;
  }

  // proportional distribution
  let allocated = 0;
  const floats = {};
  for (const k of others) {
    const portion = (next[k] || 0) / currentSum;
    const v = portion * remaining;
    floats[k] = v;
    next[k] = Math.floor(v);
    allocated += next[k];
  }

  // distribute leftover by largest fractional parts
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

export default function IntentSlidersScreen({ navigation }) {
  const [uid, setUid] = useState(null);
  const [config, setConfig] = useState(null);
  const [saving, setSaving] = useState(false);

  const [intents, setIntents] = useState({});
  const [otherText, setOtherText] = useState("");

  useEffect(() => {
    (async () => {
      const id = await getUid();
      setUid(id);
      const cfg = await loadConfig();
      setConfig(cfg);

      const keys = (cfg.intent_options || []).map((o) => o.key);
      // start balanced (20 each if 5 items)
      const base = Math.floor(TOTAL / keys.length);
      let extra = TOTAL - base * keys.length;
      const init = {};
      keys.forEach((k) => {
        init[k] = base + (extra > 0 ? 1 : 0);
        if (extra > 0) extra--;
      });
      setIntents(init);
    })();
  }, []);

  const keys = useMemo(() => (config?.intent_options || []).map((o) => o.key), [config?.intent_options]);
  const otherDef = useMemo(() => (config?.intent_options || []).find((x) => x.key === "other"), [config?.intent_options]);

  const totalNow = useMemo(() => keys.reduce((s, k) => s + (intents[k] || 0), 0), [keys, intents]);

  function onChange(key, v) {
    setIntents((prev) => redistribute(prev, key, v, keys));
  }

  async function onNext() {
    if (!uid) return;
    setSaving(true);
    try {
      const maxLen = otherDef?.textMaxLen ?? 80;
      const cleanOtherText = (otherText || "").trim().slice(0, maxLen);

      await updateUser(uid, { intents, otherText: cleanOtherText });
      navigation.navigate("OkWith");
    } finally {
      setSaving(false);
    }
  }

  if (!config) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <Text style={[typography.small, { color: colors.text2 }]}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.xl }}>
      <View style={{ gap: 8, marginTop: 16 }}>
        <Text style={[typography.h2, { color: colors.text }]}>Intent sliders</Text>
        <Text style={[typography.small, { color: colors.text2, lineHeight: 18 }]}>
          Total must be 100. Moving one slider automatically adjusts the others.
        </Text>
      </View>

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
              value={intents[o.key] ?? 0}
              min={0}
              max={100}
              step={1}
              onChange={(v) => onChange(o.key, v)}
              hint={o.key === "other" ? "If you choose Other, add a short line below." : null}
            />

            {o.key === "other" ? (
              <View style={{ marginTop: spacing.md }}>
                {/* <TextField
                  label="Other (optional)"
                  value={otherText}
                  onChangeText={setOtherText}
                  placeholder="e.g., hiking buddy / movie partner / removing loneliness"
                  maxLength={o.textMaxLen ?? 80}
                  helper={`Examples: ${(config.other_examples || []).slice(0, 3).join(", ")}`}
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


              </View>
            ) : null}
          </Card>
        ))}
      </ScrollView>

      <ProgressDots total={5} index={1} />
      <View style={{ marginTop: spacing.lg }}>
        <Button title="Next" onPress={onNext} loading={saving} />
      </View>
    </View>
  );
}
