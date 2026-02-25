// src/screens/auth/LoginScreen.js
import React, { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { colors, spacing, typography, radius } from "../../theme";
import Card from "../../components/Card";
import Button from "../../components/Button";
import TextField from "../../components/TextField";
import { loginEmail, emailExistsInUsersCollection } from "../../services/authService";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function onLogin() {
    setErr("");

    const em = email.trim().toLowerCase();
    if (!em) return setErr("Enter email.");
    if (!password) return setErr("Enter password.");

    setLoading(true);
    try {
      // 1) Try login first
      await loginEmail({ email: em, password });
      // RootNavigator will switch automatically
      return;
    } catch (e) {
      // 2) Login failed -> decide using our Firestore truth
      try {
        const exists = await emailExistsInUsersCollection(em);

        if (!exists) {
          // New email -> send to signup with prefill
          navigation.navigate("Signup", { email: em, password });
          return;
        }

        // Email exists -> wrong password (or account issue)
        if (e?.code === "auth/too-many-requests") {
          setErr("Too many attempts. Try again later.");
        } else {
          setErr("Wrong password.");
        }
      } catch {
        // If Firestore query fails, show a safe fallback
        setErr(e?.message || "Login failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxl }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[typography.h1, { color: colors.text, marginTop: 16 }]}>
        Login
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

        <View style={{ marginTop: spacing.md }}>
          <View style={{ position: "relative" }}>
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              placeholder="••••••••"
            />

            <Pressable
              onPress={() => setShowPass((p) => !p)}
              style={{
                position: "absolute",
                right: 12,
                top: 38,
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: radius.lg,
                backgroundColor: "rgba(255,255,255,0.06)",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={[typography.tiny, { color: colors.text2 }]}>
                {showPass ? "Hide" : "Show"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Card>

      <View style={{ marginTop: spacing.xl, gap: 10 }}>
        <Button title="Login" onPress={onLogin} loading={loading} />
        <Button
          title="Create new account"
          variant="ghost"
          onPress={() =>
            navigation.navigate("Signup", {
              email: email.trim().toLowerCase(),
              password,
            })
          }
        />
      </View>
    </ScrollView>
  );
}
