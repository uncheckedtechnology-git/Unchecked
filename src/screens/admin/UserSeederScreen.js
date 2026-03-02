// src/screens/admin/UserSeederScreen.js
import React, { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { colors, useTheme, spacing, typography } from "../../theme";
import Card from "../../components/Card";
import Button from "../../components/Button";
import TextField from "../../components/TextField";
import Divider from "../../components/Divider";

import { seedDemoUsers } from "../../services/userService";

export default function UserSeederScreen({ navigation }) {
  const { colors } = useTheme();
  const [count, setCount] = useState("20");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function seed() {
    setMsg("");
    setLoading(true);
    try {
      const n = Math.max(1, Math.min(200, Number(count || 20)));
      await seedDemoUsers(n);
      setMsg(`Seeded ${n} demo users.`);
    } catch (e) {
      setMsg(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxl }}>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={[typography.small, { color: colors.text2, marginTop: 16 }]}>← Back</Text>
      </Pressable>

      <Text style={[typography.h2, { color: colors.text, marginTop: 10 }]}>Seed demo users</Text>
      <Text style={[typography.small, { color: colors.text2, marginTop: 6 }]}>
        Creates random profiles in Firestore users collection for swiping/testing.
      </Text>

      <Card style={{ marginTop: spacing.lg }}>
        <TextField label="How many" value={count} onChangeText={setCount} keyboardType="number-pad" />
        <Divider />
        <Button title="Seed now" onPress={seed} loading={loading} />
        {!!msg && <Text style={[typography.tiny, { color: colors.text2, marginTop: spacing.md }]}>{msg}</Text>}
      </Card>
    </ScrollView>
  );
}
