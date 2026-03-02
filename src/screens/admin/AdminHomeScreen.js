// src/screens/admin/AdminHomeScreen.js
import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useTheme, spacing, typography, radius } from "../../theme";
import Card from "../../components/Card";
import Button from "../../components/Button";
import TextField from "../../components/TextField";
import Divider from "../../components/Divider";
import { ensureAdminDoc, getAdminPin } from "../../services/adminService";

function Row({ title, subtitle, onPress }) {
  return (
    <Pressable onPress={onPress}>
      <View style={{ paddingVertical: 14, gap: 4 }}>
        <Text style={[typography.body, { color: colors.text }]}>{title}</Text>
        {!!subtitle && <Text style={[typography.small, { color: colors.text2 }]}>{subtitle}</Text>}
      </View>
    </Pressable>
  );
}

export default function AdminHomeScreen({ navigation }) {
  const { colors } = useTheme();
  const [pin, setPin] = useState("");
  const [realPin, setRealPin] = useState(null);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    (async () => {
      await ensureAdminDoc();
      const p = await getAdminPin();
      setRealPin(p);
    })();
  }, []);

  function unlock() {
    if (!realPin) return;
    if (pin.trim() === String(realPin)) setUnlocked(true);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxl }}>
      <Text style={[typography.h2, { color: colors.text, marginTop: 16 }]}>Admin</Text>
      <Text style={[typography.small, { color: colors.text2, marginTop: 6 }]}>
        Control sliders + bubbles from Firebase.
      </Text>

      {!unlocked ? (
        <Card style={{ marginTop: spacing.lg }}>
          <Text style={[typography.h3, { color: colors.text }]}>Unlock</Text>
          <Text style={[typography.small, { color: colors.text2, marginTop: 6 }]}>
            Enter admin PIN stored in Firestore: app_config/admin.
          </Text>

          <View style={{ marginTop: spacing.md }}>
            <TextField label="PIN" value={pin} onChangeText={setPin} placeholder="1234" keyboardType="number-pad" />
          </View>

          <View style={{ marginTop: spacing.md }}>
            <Button title="Unlock" onPress={unlock} />
          </View>

          <Text style={[typography.tiny, { color: colors.text2, marginTop: spacing.md, lineHeight: 16 }]}>
            Default is 1234 (you can change it in Firestore).
          </Text>
        </Card>
      ) : (
        <>
          <Card style={{ marginTop: spacing.lg }}>
            <Row title="Edit app config" subtitle="Intent options, bubbles, toggles" onPress={() => navigation.navigate("ConfigEditor")} />
            <Divider />
            <Row title="Seed demo users" subtitle="Generate sample users for swipe/matches" onPress={() => navigation.navigate("UserSeeder")} />
          </Card>

          <Card style={{ marginTop: spacing.lg, borderRadius: radius.xl }}>
            <Text style={[typography.small, { color: colors.text2, lineHeight: 18 }]}>
              Tip: Keep the public config clean — users depend on it for onboarding.
            </Text>
          </Card>
        </>
      )}
    </ScrollView>
  );
}
