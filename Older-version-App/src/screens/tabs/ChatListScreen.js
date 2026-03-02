// src/screens/tabs/ChatListScreen.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  RefreshControl,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { doc, getDoc } from "firebase/firestore";

import { colors, spacing, typography, radius } from "../../theme";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import Avatar from "../../components/Avatar";
import Chip from "../../components/Chip";

import { db } from "../../config/firebase";
import { getUid } from "../../services/userService";
import { getMyMatches, setMatchPinned } from "../../services/matchService";
import ChatScreen from "../chat/ChatScreen";

const Stack = createNativeStackNavigator();

const DEAD_DAYS = 7;

async function fetchUser(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { uid: snap.id, ...(snap.data() || {}) };
}

function fmtListTime(ts) {
  const sec = ts?.seconds;
  if (!sec) return "";
  const d = new Date(sec * 1000);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();

  if (sameDay) {
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  }
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

function isDead(match) {
  const sec = match?.lastMessageAt?.seconds || match?.createdAt?.seconds || 0;
  if (!sec) return false;
  const ageDays = (Date.now() - sec * 1000) / (1000 * 60 * 60 * 24);
  return ageDays >= DEAD_DAYS;
}

function ChatListInner({ navigation, route }) {
  const insets = useSafeAreaInsets();

  const [uid, setUid] = useState(null);
  const [matches, setMatches] = useState([]);
  const [users, setUsers] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("recent"); // recent | unread | pinned | yourturn | dead

  const load = useCallback(async () => {
    try {
      setRefreshing(true);

      const myUid = await getUid();
      setUid(myUid);

      if (!myUid) {
        setMatches([]);
        setUsers({});
        return;
      }

      const m = await getMyMatches(myUid);
      const list = Array.isArray(m) ? m : [];
      setMatches(list);

      const otherIds = [
        ...new Set(
          list
            .map((mm) => mm?.participants?.find((p) => p !== myUid))
            .filter(Boolean)
        ),
      ];

      const arr = await Promise.all(otherIds.map((x) => fetchUser(x)));
      const map = {};
      arr.filter(Boolean).forEach((u) => {
        if (u?.uid) map[u.uid] = u;
      });
      setUsers(map);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // If another screen triggers refresh via params
  useEffect(() => {
    if (route?.params?.refresh) load();
  }, [route?.params?.refresh, load]);

  const sorted = useMemo(() => {
    const myUid = uid;
    const copy = [...matches];

    // pinned first, then lastMessageAt desc
    return copy.sort((a, b) => {
      const pa = myUid && a?.pinnedBy?.[myUid] ? 1 : 0;
      const pb = myUid && b?.pinnedBy?.[myUid] ? 1 : 0;
      if (pb !== pa) return pb - pa;

      const ta = a?.lastMessageAt?.seconds || 0;
      const tb = b?.lastMessageAt?.seconds || 0;
      return tb - ta;
    });
  }, [matches, uid]);

  const filtered = useMemo(() => {
    const myUid = uid;
    const needle = (q || "").trim().toLowerCase();

    return sorted.filter((m) => {
      const otherId = m?.participants?.find((p) => p !== myUid);
      const u = (otherId && users[otherId]) || {};

      const unread = myUid ? (m?.unreadBy?.[myUid] || 0) : 0;
      const pinned = myUid ? !!m?.pinnedBy?.[myUid] : false;

      // ✅ Hide blocked chats (either side)
      const blockedMe = myUid ? !!m?.blockedBy?.[myUid] : false;
      const blockedByOther = otherId ? !!m?.blockedBy?.[otherId] : false;
      if (blockedMe || blockedByOther) return false;

      const hasMsg = !!(m?.lastMessage && String(m.lastMessage).trim());
      const lastFrom = m?.lastMessageFromUid;
      const yourTurn = hasMsg && lastFrom && myUid && lastFrom !== myUid;

      if (filter === "unread" && unread <= 0) return false;
      if (filter === "pinned" && !pinned) return false;
      if (filter === "yourturn" && !yourTurn) return false;
      if (filter === "dead" && !isDead(m)) return false;

      if (!needle) return true;

      const name = (u?.name || "").toLowerCase();
      const last = (m?.lastMessage || "").toLowerCase();
      return name.includes(needle) || last.includes(needle);
    });
  }, [sorted, users, uid, q, filter]);

  const summary = useMemo(() => {
    if (!uid) return { totalUnread: 0, yourTurn: 0 };

    let totalUnread = 0;
    let yourTurn = 0;

    for (const m of sorted) {
      // skip blocked from summary too
      const otherId = m?.participants?.find((p) => p !== uid);
      const blockedMe = !!m?.blockedBy?.[uid];
      const blockedByOther = otherId ? !!m?.blockedBy?.[otherId] : false;
      if (blockedMe || blockedByOther) continue;

      totalUnread += m?.unreadBy?.[uid] || 0;

      const hasMsg = !!(m?.lastMessage && String(m.lastMessage).trim());
      const lastFrom = m?.lastMessageFromUid;
      if (hasMsg && lastFrom && lastFrom !== uid) yourTurn += 1;
    }

    return { totalUnread, yourTurn };
  }, [sorted, uid]);

  async function onTogglePin(matchId, nextPinned) {
    if (!uid || !matchId) return;

    // optimistic
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? { ...m, pinnedBy: { ...(m.pinnedBy || {}), [uid]: nextPinned } }
          : m
      )
    );

    try {
      await setMatchPinned(matchId, uid, nextPinned);
    } catch {
      load();
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingHorizontal: spacing.lg,
        paddingTop: insets.top + spacing.md,
        paddingBottom: insets.bottom + spacing.xl,
      }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
    >
      <Text style={[typography.h2, { color: colors.text }]}>Chat</Text>

      <Text style={[typography.small, { color: colors.text2, marginTop: 6 }]}>
        {summary.totalUnread > 0 ? `${summary.totalUnread} unread • ` : ""}
        {summary.yourTurn > 0 ? `${summary.yourTurn} your turn • ` : ""}
        Only mutual matches can chat.
      </Text>

      {/* Filters (Bumble-ish) */}
      <View style={{ marginTop: spacing.md }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Chip label="Recent" selected={filter === "recent"} onToggle={() => setFilter("recent")} />
            <Chip label="Unread" selected={filter === "unread"} onToggle={() => setFilter("unread")} />
            <Chip label="Pinned" selected={filter === "pinned"} onToggle={() => setFilter("pinned")} />
            <Chip label="Your turn" selected={filter === "yourturn"} onToggle={() => setFilter("yourturn")} />
            <Chip label="Dead" selected={filter === "dead"} onToggle={() => setFilter("dead")} />
          </View>
        </ScrollView>
      </View>

      {/* Search */}
      <View style={{ marginTop: spacing.md }}>
        <Card
          padded={false}
          style={{
            backgroundColor: colors.card2,
            borderRadius: radius.xl,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search chats…"
            placeholderTextColor={colors.muted}
            style={[typography.body, { color: colors.text }]}
          />
        </Card>
      </View>

      {/* List */}
      <View style={{ marginTop: spacing.md, gap: spacing.md }}>
        {filtered.length === 0 ? (
          <Card>
            <EmptyState
              title={sorted.length === 0 ? "No chats yet" : "No results"}
              subtitle={
                sorted.length === 0
                  ? "Get a match first, then chat will open here."
                  : "Try another filter or search."
              }
            />
          </Card>
        ) : (
          filtered.map((m) => {
            const otherId = m?.participants?.find((p) => p !== uid);
            const u = (otherId && users[otherId]) || {};

            const unread = uid ? (m?.unreadBy?.[uid] || 0) : 0;
            const pinned = uid ? !!m?.pinnedBy?.[uid] : false;

            const timeText =
              fmtListTime(m?.lastMessageAt) || fmtListTime(m?.createdAt) || "";

            const hasMsg = !!(m?.lastMessage && String(m.lastMessage).trim());
            const lastFrom = m?.lastMessageFromUid;
            const prefix = lastFrom && uid && lastFrom === uid ? "You: " : "";
            const preview = hasMsg ? `${prefix}${m.lastMessage}` : "Say hi 👋";

            return (
              <Pressable
                key={m.id}
                onPress={() => navigation.navigate("ChatScreen", { matchId: m.id, otherId })}
              >
                <Card
                  style={{
                    padding: spacing.md,
                    borderColor: pinned ? colors.primary : colors.border,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <Avatar uri={u?.photos?.[0]?.uri} label={u?.name} />

                    <View style={{ flex: 1, gap: 4 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <Text style={[typography.h3, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                          {u?.name || "Match"}
                        </Text>

                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                          {!!timeText && (
                            <Text style={[typography.tiny, { color: colors.text2 }]}>{timeText}</Text>
                          )}

                          <Pressable
                            hitSlop={10}
                            onPress={(e) => {
                              e?.stopPropagation?.();
                              onTogglePin(m.id, !pinned);
                            }}
                          >
                            <Ionicons
                              name={pinned ? "star" : "star-outline"}
                              size={18}
                              color={pinned ? colors.primary : colors.text2}
                            />
                          </Pressable>
                        </View>
                      </View>

                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <Text
                          style={[
                            typography.small,
                            { flex: 1, color: unread > 0 ? colors.text : colors.text2, fontWeight: unread > 0 ? "800" : "400" },
                          ]}
                          numberOfLines={1}
                        >
                          {preview}
                        </Text>

                        {/* WhatsApp-ish pending badge */}
                        {unread > 0 ? (
                          <View
                            style={{
                              minWidth: 26,
                              height: 26,
                              paddingHorizontal: 9,
                              borderRadius: 999,
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: colors.primary,
                            }}
                          >
                            <Text style={[typography.tiny, { color: "#fff", fontWeight: "800" }]} numberOfLines={1}>
                              {unread > 99 ? "99+" : String(unread)}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

export default function ChatListScreen() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChatList" component={ChatListInner} />
      <Stack.Screen name="ChatScreen" component={ChatScreen} />
    </Stack.Navigator>
  );
}
