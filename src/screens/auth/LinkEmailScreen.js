// src/screens/auth/LinkEmailScreen.js
import React, { useState } from "react";
import { View, Text } from "react-native";
import { colors, useTheme, spacing, typography } from "../../theme";
import TextField from "../../components/TextField";
import Button from "../../components/Button";
import Card from "../../components/Card";

import { auth } from "../../config/firebase";
import { EmailAuthProvider, linkWithCredential } from "firebase/auth";

export default function LinkEmailScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);

  async function link() {
    setErr("");
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No signed-in user to link.");
      const cred = EmailAuthProvider.credential(email.trim(), pass);
      await linkWithCredential(user, cred);
      setOk(true);
    } catch (e) {
      setErr(e?.message || "Link error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.xl, justifyContent: "center", gap: spacing.lg }}>
      <Text style={[typography.h2, { color: colors.text }]}>Link email</Text>

      <Card>
        <Text style={[typography.small, { color: colors.text2, lineHeight: 18 }]}>
          Later we’ll link your ghost profile to your email account. This screen is ready for Phase 2.
        </Text>
      </Card>

      <TextField label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" />
      <TextField label="Password" value={pass} onChangeText={setPass} placeholder="Minimum 6 characters" secureTextEntry />

      {!!err && <Text style={[typography.tiny, { color: colors.danger }]}>{err}</Text>}
      {!!ok && <Text style={[typography.tiny, { color: colors.success }]}>Linked successfully.</Text>}

      <Button title="Link" onPress={link} loading={loading} disabled={!email.trim() || pass.length < 6} />
    </View>
  );
}
