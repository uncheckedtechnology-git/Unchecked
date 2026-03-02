// src/screens/auth/EmailAuthScreen.js
import React, { useState } from "react";
import { View, Text } from "react-native";
import { colors, useTheme, spacing, typography } from "../../theme";
import TextField from "../../components/TextField";
import Button from "../../components/Button";
import Card from "../../components/Card";

import { auth } from "../../config/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

export default function EmailAuthScreen() {
  const { colors } = useTheme();
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setErr("");
    setLoading(true);
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email.trim(), pass);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), pass);
      }
    } catch (e) {
      setErr(e?.message || "Auth error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.xl, justifyContent: "center", gap: spacing.lg }}>
      <Text style={[typography.h2, { color: colors.text }]}>
        {mode === "signup" ? "Create account" : "Sign in"}
      </Text>

      <Card>
        <Text style={[typography.small, { color: colors.text2, lineHeight: 18 }]}>
          MVP uses ghost onboarding. Email auth is optional now and will be linked later.
        </Text>
      </Card>

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextField
        label="Password"
        value={pass}
        onChangeText={setPass}
        placeholder="Minimum 6 characters"
        secureTextEntry
      />

      {!!err && <Text style={[typography.tiny, { color: colors.danger }]}>{err}</Text>}

      <Button
        title={mode === "signup" ? "Sign up" : "Sign in"}
        onPress={submit}
        loading={loading}
        disabled={!email.trim() || pass.length < 6}
      />

      <Button
        variant="ghost"
        title={mode === "signup" ? "Have an account? Sign in" : "New here? Create account"}
        onPress={() => setMode((m) => (m === "signup" ? "signin" : "signup"))}
      />
    </View>
  );
}
