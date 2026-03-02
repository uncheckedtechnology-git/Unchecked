// src/screens/profile/EditProfileScreen.js
import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { colors, useTheme, spacing, typography, radius } from "../../theme";
import Card from "../../components/Card";
import Divider from "../../components/Divider";
import { getUid } from "../../services/userService";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";

function Row({ title, subtitle, onPress }) {
  return (
    <Pressable onPress={onPress}>
      <View style={{ paddingVertical: 14, gap: 4 }}>
        <Text style={[typography.body, { color: colors.text }]}>{title}</Text>
        {!!subtitle && (
          <Text style={[typography.small, { color: colors.text2 }]}>
            {subtitle}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export default function EditProfileScreen({ navigation }) {
  const { colors } = useTheme();
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      const uid = await getUid();
      const unsub = onSnapshot(doc(db, "users", uid), (snap) =>
        setUser(snap.data() || null),
      );
      return () => unsub();
    })();
  }, []);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        padding: spacing.xl,
        paddingBottom: spacing.xxl,
      }}
    >
      <Text style={[typography.h2, { color: colors.text, marginTop: 16 }]}>
        Edit profile
      </Text>
      <Text style={[typography.small, { color: colors.text2, marginTop: 6 }]}>
        Update anytime. (Cloud uploads later.)
      </Text>

      <Card style={{ marginTop: spacing.lg }}>
        <Row
          title="Photos"
          subtitle={`${user?.photos?.length || 0} added`}
          onPress={() => navigation.navigate("EditPhotos")}
        />
        <Divider />
        <Row
          title="Prompts"
          subtitle={`${user?.prompts?.length || 0} answers`}
          onPress={() => navigation.navigate("EditPrompts")}
        />
        <Divider />
        <Row
          title="Vibe on"
          subtitle={user?.vibeOn ? user.vibeOn : "Set your vibe topic"}
          onPress={() => navigation.navigate("EditVibe")}
        />
      </Card>

      <Card style={{ marginTop: spacing.lg }}>
        <Row
          title="Intent sliders (total 100)"
          subtitle="Adjust your distribution"
          onPress={() => navigation.navigate("EditIntents")}
        />
        <Divider />
        <Row
          title="Ok with / Self-concerns"
          subtitle="Edit your bubbles"
          onPress={() => navigation.navigate("EditBubbles")}
        />
      </Card>

      <Card style={{ marginTop: spacing.lg, borderRadius: radius.xl }}>
        <Text
          style={[typography.small, { color: colors.text2, lineHeight: 18 }]}
        >
          Note: In MVP, photos are stored locally. In Phase 5 we enable Firebase
          Storage uploads + moderation.
        </Text>
      </Card>
    </ScrollView>
  );
}
