// src/screens/chat/ChatScreen.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, useTheme, spacing, typography, radius } from "../../theme";
import Card from "../../components/Card";
import Divider from "../../components/Divider";

import { getUid } from "../../services/userService";
import { listenMessages, sendMessage, markMatchRead, listenMatch } from "../../services/chatService";
import { blockMatch, reportUser } from "../../services/safetyService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";

function fmt(ts) {
  const sec = ts?.seconds;
  if (!sec) return "";
  const d = new Date(sec * 1000);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export default function ChatScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { matchId, otherId } = route.params || {};
  const insets = useSafeAreaInsets();

  const [uid, setUid] = useState(null);
  const [other, setOther] = useState(null);
  const [match, setMatch] = useState(null);

  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);

  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const unsubMsgsRef = useRef(null);
  const unsubMatchRef = useRef(null);

  useEffect(() => {
    (async () => {
      const myUid = await getUid();
      setUid(myUid);

      // load other user
      if (otherId) {
        const snap = await getDoc(doc(db, "users", otherId));
        setOther(snap.exists() ? snap.data() : null);
      }

      if (matchId) {
        // listen match for read receipts + blocked state
        unsubMatchRef.current = listenMatch(matchId, (m) => setMatch(m));

        // mark read on open
        if (myUid) await markMatchRead(matchId, myUid);

        unsubMsgsRef.current = listenMessages(matchId, 80, async (msgs) => {
          setMessages(msgs);

          // if newest is from other, mark read
          const latest = msgs?.[0];
          if (latest && myUid && latest.fromUid && latest.fromUid !== myUid) {
            await markMatchRead(matchId, myUid);
          }
        });
      }
    })();

    return () => {
      if (unsubMsgsRef.current) unsubMsgsRef.current();
      if (unsubMatchRef.current) unsubMatchRef.current();
    };
  }, [matchId, otherId]);

  const headerName = useMemo(() => other?.name || "Match", [other?.name]);

  // Read receipt foundation:
  // Default ON, later you can set match.readReceiptsEnabled=false for female-controlled logic.
  const readReceiptsEnabled = match?.readReceiptsEnabled !== false;
  const otherReadSec = match?.lastReadAtBy?.[otherId]?.seconds || 0;

  // If blocked by either side, bounce back (MVP safety)
  useEffect(() => {
    const blockedMe = uid ? !!match?.blockedBy?.[uid] : false;
    const blockedOther = otherId ? !!match?.blockedBy?.[otherId] : false;
    if (blockedMe || blockedOther) {
      navigation.navigate("ChatList", { refresh: Date.now() });
    }
  }, [match, uid, otherId, navigation]);

  async function onSend() {
    const t = text.trim();
    if (!uid || !matchId || !t) return;
    setText("");
    await sendMessage(matchId, uid, t, otherId);
  }

  async function onBlock() {
    if (!uid || !matchId) return;
    await blockMatch(matchId, uid, otherId);
    setMenuOpen(false);

    // Force refresh + return to list
    navigation.navigate("ChatList", { refresh: Date.now() });
  }

  async function onReport(reason) {
    if (!uid || !otherId) return;
    await reportUser({ matchId, reporterUid: uid, reportedUid: otherId, reason });
    setReportOpen(false);
    setMenuOpen(false);
  }

  const canSend = text.trim().length > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingTop: insets.top + spacing.md,
          paddingBottom: spacing.md,
          gap: 8,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
            <Text style={[typography.small, { color: colors.text2 }]}>← Back</Text>
          </Pressable>

          <Pressable onPress={() => setMenuOpen(true)} hitSlop={10}>
            <Ionicons name="ellipsis-horizontal" size={22} color={colors.text2} />
          </Pressable>
        </View>

        <Text style={[typography.h2, { color: colors.text }]} numberOfLines={1}>
          {headerName}
        </Text>

        <Text style={[typography.tiny, { color: colors.text2 }]}>
          Matched • Be respectful • No screenshots
        </Text>
      </View>

      <Divider />

      {/* Messages */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        inverted
        contentContainerStyle={{ padding: spacing.lg, gap: 10 }}
        renderItem={({ item }) => {
          const mine = item.fromUid === uid;

          // tick logic for my messages
          const createdSec = item?.createdAt?.seconds || 0;
          const isRead = readReceiptsEnabled && otherReadSec && createdSec && otherReadSec >= createdSec;

          return (
            <View
              style={{
                alignSelf: mine ? "flex-end" : "flex-start",
                maxWidth: "84%",
                gap: 4,
              }}
            >
              <View
                style={{
                  backgroundColor: mine ? colors.primary : colors.card,
                  borderRadius: radius.lg,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderWidth: mine ? 0 : 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={[typography.body, { color: mine ? "#fff" : colors.text }]}>
                  {item.text}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  alignSelf: mine ? "flex-end" : "flex-start",
                }}
              >
                <Text style={[typography.tiny, { color: colors.text2 }]}>
                  {fmt(item.createdAt)}
                </Text>

                {mine && readReceiptsEnabled ? (
                  <Ionicons
                    name={isRead ? "checkmark-done" : "checkmark"}
                    size={14}
                    color={isRead ? colors.primary : colors.text2}
                  />
                ) : null}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={() => (
          <Card style={{ alignSelf: "stretch" }}>
            <Text style={[typography.h3, { color: colors.text }]}>Say hi 👋</Text>
            <Text
              style={[
                typography.small,
                { color: colors.text2, marginTop: 6, lineHeight: 18 },
              ]}
            >
              Start with something specific from their profile.
            </Text>
          </Card>
        )}
      />

      {/* Composer */}
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: insets.bottom + spacing.md,
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 10,
        }}
      >
        <Card
          padded={false}
          style={{
            flex: 1,
            backgroundColor: colors.card2,
            borderRadius: radius.xl,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Message…"
            placeholderTextColor={colors.muted}
            style={[typography.body, { color: colors.text }]}
            returnKeyType="send"
            onSubmitEditing={onSend}
            blurOnSubmit={false}
          />
        </Card>

        <Pressable
          onPress={onSend}
          disabled={!canSend}
          style={({ pressed }) => [
            {
              height: 48,
              width: 48,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.primary,
              opacity: !canSend ? 0.45 : pressed ? 0.85 : 1,
            },
          ]}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </Pressable>
      </View>

      {/* ⋯ Menu */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable
          onPress={() => setMenuOpen(false)}
          style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end" }}
        >
          <Pressable onPress={() => {}} style={{ padding: spacing.lg, gap: 10 }}>
            <View style={{ backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg, gap: 12 }}>
              <Pressable onPress={() => { setMenuOpen(false); setReportOpen(true); }}>
                <Text style={[typography.body, { color: colors.text }]}>Report</Text>
              </Pressable>

              <View style={{ height: 1, backgroundColor: colors.border }} />

              <Pressable onPress={onBlock}>
                <Text style={[typography.body, { color: colors.danger }]}>Block</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => setMenuOpen(false)}
              style={{ backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg, alignItems: "center" }}
            >
              <Text style={[typography.body, { color: colors.text }]}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Report */}
      <Modal visible={reportOpen} transparent animationType="fade" onRequestClose={() => setReportOpen(false)}>
        <Pressable
          onPress={() => setReportOpen(false)}
          style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end" }}
        >
          <Pressable onPress={() => {}} style={{ padding: spacing.lg, gap: 10 }}>
            <View style={{ backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg, gap: 12 }}>
              <Text style={[typography.h3, { color: colors.text }]}>Report user</Text>

              {[
                ["harassment", "Harassment / Abuse"],
                ["spam", "Spam"],
                ["inappropriate", "Inappropriate content"],
                ["scam", "Scam / Fake profile"],
                ["other", "Other"],
              ].map(([key, label]) => (
                <Pressable key={key} onPress={() => onReport(key)}>
                  <Text style={[typography.body, { color: colors.text }]}>{label}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={() => setReportOpen(false)}
              style={{ backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg, alignItems: "center" }}
            >
              <Text style={[typography.body, { color: colors.text }]}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}
