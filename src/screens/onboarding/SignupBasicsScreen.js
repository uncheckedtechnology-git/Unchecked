// src/screens/onboarding/SignupBasicsScreen.js
import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { colors, useTheme, spacing, typography } from "../../theme";
import Card from "../../components/Card";
import Button from "../../components/Button";
import TextField from "../../components/TextField";
import Chip from "../../components/Chip";

import { GENDER_OPTIONS, INTERESTED_IN_OPTIONS } from "../../data/genderOptions";
import { getUid, updateUser } from "../../services/userService";

export default function SignupBasicsScreen({ navigation }) {
  const { colors } = useTheme();
  const [legalName, setLegalName] = useState("");
  const [gender, setGender] = useState("man");
  const [interestedIn, setInterestedIn] = useState("women");

  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSave() {
    setErr("");
    const uid = getUid();
    if (!uid) return setErr("Auth not ready. Restart app.");

    if (!legalName.trim()) return setErr("Enter your legal name.");

    setSaving(true);
    try {
      await updateUser(uid, {
        legalName: legalName.trim(),
        gender,
        interestedIn,
        signupBasicsComplete: true,
      });

      // ✅ Next = Stage name + DOB screen (NameAge)
      navigation.replace("NameAge");
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxl }}>
      <Text style={[typography.h1, { color: colors.text, marginTop: 16 }]}>Basics</Text>
      <Text style={[typography.small, { color: colors.text2, marginTop: 6 }]}>
        Legal name is for trust/safety. Stage name + DOB comes next.
      </Text>

      {!!err && (
        <Card style={{ marginTop: spacing.lg }}>
          <Text style={[typography.small, { color: colors.warn }]}>{err}</Text>
        </Card>
      )}

      <Card style={{ marginTop: spacing.lg }}>
        <TextField label="Legal name" value={legalName} onChangeText={setLegalName} placeholder="Your real name" />

        <View style={{ marginTop: spacing.md }}>
          <Text style={[typography.small, { color: colors.text2 }]}>Gender</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
            {GENDER_OPTIONS.map((g) => (
              <Chip key={g.key} label={g.label} selected={gender === g.key} onToggle={() => setGender(g.key)} />
            ))}
          </View>
        </View>

        <View style={{ marginTop: spacing.md }}>
          <Text style={[typography.small, { color: colors.text2 }]}>Interested in</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
            {INTERESTED_IN_OPTIONS.map((x) => (
              <Chip key={x.key} label={x.label} selected={interestedIn === x.key} onToggle={() => setInterestedIn(x.key)} />
            ))}
          </View>
        </View>
      </Card>

      <View style={{ marginTop: spacing.xl }}>
        <Button title="Continue" onPress={onSave} loading={saving} />
      </View>
    </ScrollView>
  );
}
