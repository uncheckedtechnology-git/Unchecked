// src/screens/auth/SignupScreen.js
import React, { useState } from "react";
import { Text, ScrollView } from "react-native";
import { colors, spacing, typography } from "../../theme";
import Card from "../../components/Card";
import Button from "../../components/Button";
import TextField from "../../components/TextField";
import { signupEmailCredentialsOnly } from "../../services/authService";

export default function SignupScreen({ navigation  ,route= {}}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const prefillEmail = route?.params?.email || "";
  const prefillPassword = route?.params?.password || "";
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState(prefillPassword);

  async function onSignup() {
    setErr("");
    if (!email.trim()) return setErr("Enter email.");
    if (password.length < 6) return setErr("Password must be 6+ characters.");

    setLoading(true);
    try {
      await signupEmailCredentialsOnly({ email, password });
      // ✅ RootNavigator will send user to Onboarding (Basics screen will be first)
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        padding: spacing.xl,
        paddingBottom: spacing.xxl,
      }}
    >
      <Text style={[typography.h1, { color: colors.text, marginTop: 16 }]}>
        Create account
      </Text>

      {!!err && (
        <Card style={{ marginTop: spacing.lg }}>
          <Text style={[typography.small, { color: colors.warn }]}>{err}</Text>
        </Card>
      )}

      <Card style={{ marginTop: spacing.lg }}>
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          placeholder="you@email.com"
        />
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          helper="Minimum 6 characters"
        />
      </Card>

      <ScrollView contentContainerStyle={{ height: 16 }} />

      <Button title="Sign up" onPress={onSignup} loading={loading} />

      <ScrollView contentContainerStyle={{ height: 10 }} />

      <Button
        title="I already have an account"
        variant="ghost"
        onPress={() => navigation.navigate("Login")}
      />
    </ScrollView>
  );
}
