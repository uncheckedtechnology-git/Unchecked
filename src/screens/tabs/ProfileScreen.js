// src/screens/tabs/ProfileScreen.js
import React, { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, Image } from "react-native";
import { colors, spacing, typography } from "../../theme";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Divider from "../../components/Divider";
import { logout } from "../../services/authService";

import { getUid } from "../../services/userService";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";

function topIntents(intents = {}) {
  const pairs = [
    ["Hookups", intents.hookups || 0],
    ["Marriage", intents.marriage || 0],
    ["Long-term", intents.long_term || 0],
    ["Friendship", intents.friendship || 0],
    ["Other", intents.other || 0],
  ].sort((a, b) => b[1] - a[1]);
  return pairs.slice(0, 3);
}

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);

  const taps = useRef(0);
  const lastTap = useRef(0);

  useEffect(() => {
    (async () => {
      const id = await getUid();
      const ref = doc(db, "users", id);
      const unsub = onSnapshot(ref, (snap) => setUser(snap.data() || null));
      return () => unsub();
    })();
  }, []);

  function handleAdminTap() {
    const now = Date.now();
    if (now - lastTap.current > 900) taps.current = 0;
    lastTap.current = now;
    taps.current += 1;
    if (taps.current >= 5) {
      taps.current = 0;
      // later: open admin panel
    }
  }

  if (!user) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={[typography.small, { color: colors.text2 }]}>
          Loading…
        </Text>
      </View>
    );
  }

  const topPhoto = user?.photos?.[0]?.uri;
  const top3 = topIntents(user?.intents);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        padding: spacing.xl,
        paddingBottom: spacing.xxl,
      }}
    >
      <Pressable onPress={handleAdminTap} style={{ gap: 6, marginTop: 16 }}>
        <Text style={[typography.h2, { color: colors.text }]}>Profile</Text>
        <Text style={[typography.small, { color: colors.text2 }]}>
          {user.name || "—"} {user.age ? `• ${user.age}` : ""}
        </Text>
      </Pressable>

      <Card
        style={{ marginTop: spacing.lg, overflow: "hidden" }}
        padded={false}
      >
        {topPhoto ? (
          <Image
            source={{ uri: topPhoto }}
            style={{ width: "100%", height: 280 }}
          />
        ) : (
          <View
            style={{
              height: 220,
              backgroundColor: colors.card2,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={[typography.small, { color: colors.text2 }]}>
              No photo yet
            </Text>
          </View>
        )}

        <View style={{ padding: spacing.lg, gap: 10 }}>
          <Text style={[typography.h3, { color: colors.text }]}>
            Top intents
          </Text>

          {top3.map(([label, val]) => (
            <View
              key={label}
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={[typography.body, { color: colors.text }]}>
                {label}
              </Text>
              <Text style={[typography.body, { color: colors.text }]}>
                {val}
              </Text>
            </View>
          ))}

          {!!user.otherText ? (
            <Text style={[typography.small, { color: colors.text2 }]}>
              Other:{" "}
              <Text style={{ color: colors.text }}>{user.otherText}</Text>
            </Text>
          ) : null}

          <Divider />

          <Text
            style={[typography.small, { color: colors.text2, lineHeight: 18 }]}
          >
            Ok with:{" "}
            <Text style={{ color: colors.text }}>
              {(user.okWith || []).slice(0, 4).join(", ") || "—"}
            </Text>
            {user.okWith?.length > 4 ? (
              <Text style={{ color: colors.text2 }}>
                {" "}
                +{user.okWith.length - 4} more
              </Text>
            ) : null}
          </Text>

          <Text
            style={[typography.small, { color: colors.text2, lineHeight: 18 }]}
          >
            Self-concerns:{" "}
            <Text style={{ color: colors.text }}>
              {(user.selfConcerns || []).slice(0, 4).join(", ") || "—"}
            </Text>
            {user.selfConcerns?.length > 4 ? (
              <Text style={{ color: colors.text2 }}>
                {" "}
                +{user.selfConcerns.length - 4} more
              </Text>
            ) : null}
          </Text>
        </View>
      </Card>

      <View style={{ marginTop: spacing.lg }}>
        <Button
          title="Edit profilee"
          variant="ghost"
          onPress={() => navigation.navigate("EditProfile")}
        />
        <Button
          title="Log out"
          variant="ghost"
          onPress={async () => {
            try {
              await logout();
            } catch (e) {
              console.log("logout error", e);
            }
          }}
        />
      </View>
    </ScrollView>
  );
}
