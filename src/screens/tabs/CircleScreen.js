// src/screens/tabs/CircleScreen.js
import React, { useEffect, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { useTheme, spacing, typography } from "../../theme";
import Card from "../../components/Card";
import Chip from "../../components/Chip";
import EmptyState from "../../components/EmptyState";
import { loadConfig } from "../../services/configService";

export default function CircleScreen() {
  const { colors } = useTheme();
  const [config, setConfig] = useState(null);

  useEffect(() => {
    (async () => {
      const cfg = await loadConfig();
      setConfig(cfg);
    })();
  }, []);

  const preview = (config?.ok_with_bubbles || []).slice(0, 10);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxl }}>
      <Text style={[typography.h2, { color: colors.text, marginTop: 16 }]}>Circle</Text>
      <Text style={[typography.small, { color: colors.text2, marginTop: 6 }]}>
        Coming soon: circles, communities, and safer meetups.
      </Text>

      <Card style={{ marginTop: spacing.lg }}>
        <EmptyState
          title="Circles will feel different"
          subtitle="We’ll connect people through hobbies, intent alignment, and safe public meetups (Phase 6+)."
        />
      </Card>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={[typography.h3, { color: colors.text }]}>Preview</Text>
        <Text style={[typography.small, { color: colors.text2, marginTop: 6 }]}>
          Your bubbles will later influence circle recommendations.
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: spacing.md }}>
          {preview.map((x) => (
            <Chip key={x} label={x} selected={false} onToggle={() => {}} />
          ))}
        </View>
      </Card>
    </ScrollView>
  );
}
