// src/screens/auth/LoginScreen.js — Premium dark-mode login
import React, { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, useTheme, spacing, typography, radius } from "../../theme";
import Card from "../../components/Card";
import Button from "../../components/Button";
import TextField from "../../components/TextField";
import { Alert } from "react-native";
import { loginEmail, emailExistsInUsersCollection, sendPasswordReset } from "../../services/authService";

export default function LoginScreen({ navigation }) {
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [resetting, setResetting] = useState(false);

  async function onForgotPassword() {
    const em = email.trim().toLowerCase();
    if (!em) {
      setErr("Enter your email above first, then tap Forgot password.");
      return;
    }
    setResetting(true);
    try {
      await sendPasswordReset(em);
      Alert.alert(
        "Email Sent! 📧",
        `Password reset link has been sent to ${em}. Check your inbox and spam folder.`,
        [{ text: "OK" }]
      );
    } catch (e) {
      setErr(e?.message || "Could not send reset email. Please try again.");
    } finally {
      setResetting(false);
    }
  }

  async function onLogin() {
    setErr("");
    const em = email.trim().toLowerCase();
    if (!em) return setErr("Enter email.");
    if (!password) return setErr("Enter password.");

    setLoading(true);
    try {
      await loginEmail({ email: em, password });
      return;
    } catch (e) {
      try {
        const exists = await emailExistsInUsersCollection(em);
        if (!exists) {
          navigation.navigate("Signup", { email: em });
          return;
        }
        if (e?.code === "auth/too-many-requests") {
          setErr("Too many attempts. Try again later.");
        } else {
          setErr("Wrong password.");
        }
      } catch {
        setErr(e?.message || "Login failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Background bloom gradient */}
      <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }}>
        <LinearGradient
          colors={["rgba(232,53,109,0.18)", "transparent"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.55 }}
          style={{ height: 320 }}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxl }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <View style={{ marginTop: 48, marginBottom: 8, alignItems: "flex-start" }}>
          <LinearGradient
            colors={colors.primaryGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 8, paddingHorizontal: 2 }}
          >
            <Text
              style={[
                typography.h1,
                { color: "#fff", paddingHorizontal: 0 },
              ]}
            >
              Unchecked ✦
            </Text>
          </LinearGradient>
          <Text style={[typography.small, { color: colors.text2, marginTop: 10 }]}>
            Real connections, no filters.
          </Text>
        </View>

        {/* Error card */}
        {!!err && (
          <Card style={{ marginTop: spacing.lg, borderColor: colors.danger + "66" }}>
            <Text style={[typography.small, { color: colors.danger }]}>{err}</Text>
          </Card>
        )}

        {/* Form card */}
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
                  top: 34,
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: radius.lg,
                  backgroundColor: "rgba(255,255,255,0.08)",
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

        {/* Forgot password link */}
        <Pressable
          onPress={onForgotPassword}
          style={{ marginTop: 14, alignSelf: "flex-end" }}
        >
          <Text style={[typography.small, { color: colors.primary }]}>
            {resetting ? "Sending reset email…" : "Forgot password?"}
          </Text>
        </Pressable>

        <View style={{ marginTop: spacing.lg, gap: 12 }}>
          <Button title="Login" onPress={onLogin} loading={loading} />
          <Button
            title="Create new account"
            variant="ghost"
            onPress={() =>
              navigation.navigate("Signup", {
                email: email.trim().toLowerCase(),
              })
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}
