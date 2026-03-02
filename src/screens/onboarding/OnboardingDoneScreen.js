import React, { useEffect, useMemo, useState } from "react";
import { View, Text } from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { colors, useTheme, spacing, typography } from "../../theme";
import Card from "../../components/Card";
import Button from "../../components/Button";

import { getUid, updateUser } from "../../services/userService";
import { getCurrentLatLng } from "../../services/locationService";
import { computeProfileComplete, isIntentsValid } from "../../services/profileCompletion";

export default function OnboardingDoneScreen({ navigation }) {
  const { colors } = useTheme();
  const [saving, setSaving] = useState(false);
  const [missing, setMissing] = useState([]);

  const canEnter = useMemo(() => missing.length === 0, [missing.length]);

  async function evaluateAndSave() {
    const uid = getUid();
    if (!uid) return;

    setSaving(true);
    try {
      const loc = await getCurrentLatLng();
      await updateUser(uid, { location: loc || null });

      const snap = await getDoc(doc(db, "users", uid));
      const user = snap.exists() ? snap.data() : null;

      // Auto-create arrays if missing (common reason it gets stuck)
      const patch = {};
      if (!Array.isArray(user?.okWith)) patch.okWith = [];
      if (!Array.isArray(user?.selfConcerns)) patch.selfConcerns = [];
      if (Object.keys(patch).length) await updateUser(uid, patch);

      const snap2 = await getDoc(doc(db, "users", uid));
      const u = snap2.exists() ? snap2.data() : null;

      const miss = [];
      if (!u?.name) miss.push("Name");
      if (!u?.dobISO) miss.push("DOB");
      if (!u?.gender) miss.push("Gender");
      if (!u?.interestedIn) miss.push("Interested in");

      setMissing(miss);

      const complete = computeProfileComplete(u);
      await updateUser(uid, { profileComplete: complete });
      // RootNavigator will auto-switch to Tabs when profileComplete becomes true
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    evaluateAndSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.xl, justifyContent: "center" }}>
      <Card>
        <Text style={[typography.h2, { color: colors.text }]}>Profile status</Text>

        {canEnter ? (
          <Text style={[typography.small, { color: colors.text2, marginTop: 8, lineHeight: 18 }]}>
            You’re good. Taking you to the app…
          </Text>
        ) : (
          <Text style={[typography.small, { color: colors.warn, marginTop: 8, lineHeight: 18 }]}>
            Not complete yet. Missing: {missing.join(", ")}
          </Text>
        )}

        <View style={{ marginTop: spacing.lg, gap: 10 }}>
          <Button title="Re-check & Go to App" onPress={evaluateAndSave} loading={saving} />
          <Button title="Back to onboarding" variant="ghost" onPress={() => navigation.goBack()} />
        </View>
      </Card>
    </View>
  );
}
