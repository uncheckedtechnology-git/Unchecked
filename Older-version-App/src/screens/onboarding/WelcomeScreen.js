// src/screens/onboarding/WelcomeScreen.js
import React from "react";
import { View, Text } from "react-native";
import { colors, spacing, typography } from "../../theme";
import Button from "../../components/Button";
import Card from "../../components/Card";

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.xl, justifyContent: "center", gap: spacing.lg }}>
      <Text style={[typography.h1, { color: colors.text }]}>Unchecked</Text>
      <Text style={[typography.body, { color: colors.text2, lineHeight: 22 }]}>
        Intention-first dating, with clarity.
      </Text>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={[typography.h3, { color: colors.text }]}>Quick setup</Text>
        <Text style={[typography.small, { color: colors.text2, marginTop: 8, lineHeight: 18 }]}>
          Set your intent sliders, boundaries, and self-concerns. You can edit anytime.
        </Text>
      </Card>

      <View style={{ marginTop: spacing.xl }}>
        <Button title="Start" onPress={() => navigation.navigate("NameAge")} />
      </View>
    </View>
  );
}
