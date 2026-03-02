import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  Alert,
  ScrollView,
  Dimensions,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, useTheme, spacing, typography } from "../../theme";
import Chip from "../../components/Chip";
import Divider from "../../components/Divider";
import AvatarCard from "../../components/AvatarCard";
import SwipeFiltersModal from "../../components/SwipeFiltersModal";

import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { getUid } from "../../services/userService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import {
  computeMatchScore,
  fetchCandidates,
  likeUser,
  passUser,
} from "../../services/matchService";
import { distanceKm } from "../../services/locationService";
import { recordSwipe } from "../../services/swipeService";
import { resetMySwipes } from "../../services/resetService";

const { width: W, height: H } = Dimensions.get("window");

const CARD_MARGIN = 10;
const CARD_RADIUS = 26;
const SWIPE_THRESHOLD = Math.min(140, W * 0.28);

const TAB_BAR_GUESS = 62;
const CARD_BG = colors.card || "#0F1117";

const DEFAULT_FILTERS = {
  ageMin: 18,
  ageMax: 35,
  maxDistanceKm: 25,
  genders: ["woman", "man", "other"],
};

function getAge(dobLike) {
  try {
    if (!dobLike) return null;
    const d =
      typeof dobLike?.toDate === "function"
        ? dobLike.toDate()
        : dobLike instanceof Date
          ? dobLike
          : typeof dobLike === "string"
            ? new Date(dobLike)
            : null;

    if (!d || Number.isNaN(d.getTime())) return null;

    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    if (age < 18 || age > 99) return null;
    return age;
  } catch {
    return null;
  }
}

function normalizePhotos(photosLike) {
  if (!Array.isArray(photosLike)) return [];
  return photosLike
    .map((p) => (typeof p === "string" ? p : p?.uri))
    .filter(Boolean);
}

function SectionTitle({ children }) {
  const { colors } = useTheme();
  return (
    <Text style={[typography.small, { color: colors.text2, marginBottom: 8 }]}>
      {children}
    </Text>
  );
}

function BubbleRow({ items }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {items.slice(0, 12).map((t) => (
        <Chip key={String(t)} label={String(t)} />
      ))}
    </View>
  );
}

function PromptCard({ prompt, idx }) {
  const { colors } = useTheme();
  const q = prompt?.q || prompt?.question || `Prompt ${idx + 1}`;
  const a = prompt?.a || prompt?.answer || "";
  if (!a && !q) return null;

  return (
    <View style={styles.promptCard}>
      <Text style={[typography.tiny, { color: colors.text2 }]}>{q}</Text>
      {a ? (
        <Text style={[typography.small, { color: colors.text, marginTop: 8, lineHeight: 20 }]}>
          {a}
        </Text>
      ) : null}
    </View>
  );
}

function PhotoBlock({ uri, ratio = "4:3" }) {
  const usableW = W - (CARD_MARGIN * 2);
  const h = ratio === "square" ? usableW : Math.round(usableW * 0.75); // 4:3
  return (
    <Image
      source={{ uri }}
      style={[styles.subPhoto, { height: h }]}
      resizeMode="cover"
    />
  );
}

function getVibeText(u) {
  // ✅ your confirmed field
  return u?.vibeOn || "";
}

function getAboutText(u) {
  return u?.aboutMe || u?.about || u?.bio || u?.intro || "";
}

export default function SwipeScreen() {
  const { colors } = useTheme();
  const [uid, setUid] = useState(null);
  const [me, setMe] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const insets = useSafeAreaInsets();
  const current = queue[0] || null;
  const nextPeek = queue[1] || null;

  // Reanimated
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const locked = useSharedValue(false);

  const nativeScroll = Gesture.Native();

  const loadQueue = useCallback(
    async (id, f) => {
      const cand = await fetchCandidates(id, { take: 30, filters: f });
      setQueue(Array.isArray(cand) ? cand : []);
    },
    []
  );

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const id = await getUid();
        if (!mounted) return;
        setUid(id);

        const mineSnap = await getDoc(doc(db, "users", id));
        const mine = mineSnap.exists() ? mineSnap.data() : null;
        if (!mounted) return;
        setMe(mine);

        await loadQueue(id, filters);
      } catch (e) {
        console.log("[SwipeScreen] load error:", e);
        if (mounted) setErr(e?.message || String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset swipe position when card changes
  useEffect(() => {
    tx.value = 0;
    ty.value = 0;
    locked.value = false;
  }, [current?.uid]);

  const score = useMemo(() => {
    if (!me || !current) return 0;
    return computeMatchScore(me, current);
  }, [me, current]);

  const kmAway = useMemo(() => {
    if (!me?.location || !current?.location) return null;
    const km = distanceKm(me.location, current.location);
    if (km == null || Number.isNaN(km)) return null;
    if (km < 1) return "<1 km";
    return `${Math.round(km)} km`;
  }, [me?.location, current?.location]);

  async function refillIfNeeded(nextQueue) {
    if (!uid) return;
    if (nextQueue.length >= 8) return;

    const more = await fetchCandidates(uid, { take: 30, filters });
    const seen = new Set(nextQueue.map((x) => x.uid));
    const merged = [...nextQueue, ...more.filter((x) => !seen.has(x.uid))];
    setQueue(merged);
  }

  async function doPass() {
    if (!uid || !current) return;

    const nextQueue = queue.slice(1);
    setQueue(nextQueue);

    try {
      await recordSwipe({ fromUid: uid, toUid: current.uid, decision: "pass" });
    } catch (e) {
      console.log("[SwipeScreen] recordSwipe(pass) failed:", e);
    }

    try {
      await passUser(uid, current.uid);
    } catch (e) {
      console.log("[SwipeScreen] passUser failed:", e);
    }

    refillIfNeeded(nextQueue);
  }

  async function doLike() {
    if (!uid || !current) return;

    const nextQueue = queue.slice(1);
    setQueue(nextQueue);

    try {
      await recordSwipe({ fromUid: uid, toUid: current.uid, decision: "like" });
    } catch (e) {
      console.log("[SwipeScreen] recordSwipe(like) failed:", e);
    }

    try {
      await likeUser(uid, current.uid, score);
    } catch (e) {
      console.log("[SwipeScreen] likeUser failed:", e);
    }

    refillIfNeeded(nextQueue);
  }

  async function doReset() {
    if (!uid) return;
    try {
      const res = await resetMySwipes(uid, { alsoClearReceived: true });
      Alert.alert(
        "Reset complete",
        `likes_sent: ${res.likesSentDeleted}\npasses: ${res.passesDeleted}\nlikes_received: ${res.likesReceivedDeleted}`
      );

      setLoading(true);
      await loadQueue(uid, filters);
      setLoading(false);
    } catch (e) {
      Alert.alert("Reset failed", e?.message || String(e));
      setLoading(false);
    }
  }

  const handleVoiceReact = useCallback(async (uri, duration, promptQ) => {
    Alert.alert(
      "Voice Note Sent! 🎙️",
      `Sent a ${Math.round(duration / 1000)}s reaction to: "${promptQ}"`
    );
    runOnJS(flyOut)("like");
  }, [flyOut]);

  const onDecision = useCallback(
    (decision) => {
      if (decision === "like") doLike();
      else doPass();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid, current, score, queue]
  );

  const flyOut = useCallback(
    (decision) => {
      if (!current) return;
      const toX = decision === "like" ? W * 1.2 : -W * 1.2;

      locked.value = true;
      ty.value = withTiming(0, { duration: 160 });

      tx.value = withTiming(toX, { duration: 220 }, (finished) => {
        if (finished) runOnJS(onDecision)(decision);
        locked.value = false;
      });
    },
    [current, onDecision, locked, tx, ty]
  );

  // ----- animations -----
  const topCardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      tx.value,
      [-W / 2, 0, W / 2],
      [-8, 0, 8],
      Extrapolate.CLAMP
    );
    const scale = interpolate(
      Math.abs(tx.value),
      [0, SWIPE_THRESHOLD],
      [1, 0.99],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateX: tx.value },
        { translateY: ty.value },
        { rotateZ: `${rotate}deg` },
        { scale },
      ],
    };
  });

  // next card hidden until swipe begins
  const nextCardStyle = useAnimatedStyle(() => {
    const p = Math.min(Math.abs(tx.value) / SWIPE_THRESHOLD, 1);
    const opacity = interpolate(p, [0, 0.08, 1], [0, 0, 1], Extrapolate.CLAMP);
    const scale = interpolate(p, [0, 1], [0.985, 1], Extrapolate.CLAMP);
    const translateY = interpolate(p, [0, 1], [18, 0], Extrapolate.CLAMP);
    return { opacity, transform: [{ translateY }, { scale }] };
  });

  const likeStampStyle = useAnimatedStyle(() => {
    const p = Math.min(Math.max(tx.value / SWIPE_THRESHOLD, 0), 1);
    const opacity = interpolate(p, [0, 0.2, 1], [0, 0.4, 1], Extrapolate.CLAMP);
    const s = interpolate(p, [0, 1], [0.92, 1.04], Extrapolate.CLAMP);
    const x = interpolate(p, [0, 1], [18, 0], Extrapolate.CLAMP);
    return { opacity, transform: [{ translateX: x }, { scale: s }] };
  });

  const passStampStyle = useAnimatedStyle(() => {
    const p = Math.min(Math.max(-tx.value / SWIPE_THRESHOLD, 0), 1);
    const opacity = interpolate(p, [0, 0.2, 1], [0, 0.4, 1], Extrapolate.CLAMP);
    const s = interpolate(p, [0, 1], [0.92, 1.04], Extrapolate.CLAMP);
    const x = interpolate(p, [0, 1], [-18, 0], Extrapolate.CLAMP);
    return { opacity, transform: [{ translateX: x }, { scale: s }] };
  });

  const heartPopStyle = useAnimatedStyle(() => {
    const p = Math.min(Math.max(tx.value / (SWIPE_THRESHOLD * 1.05), 0), 1);
    const opacity = interpolate(p, [0, 0.25, 1], [0, 0.55, 1], Extrapolate.CLAMP);
    const s = interpolate(p, [0, 1], [0.6, 1.2], Extrapolate.CLAMP);
    const y = interpolate(p, [0, 1], [10, -10], Extrapolate.CLAMP);
    return { opacity, transform: [{ translateY: y }, { scale: s }] };
  });

  const pan = Gesture.Pan()
    .enabled(!!current)
    .activeOffsetX([-12, 12])
    .failOffsetY([-12, 12])
    .simultaneousWithExternalGesture(nativeScroll)
    .onUpdate((e) => {
      if (locked.value) return;
      tx.value = e.translationX;
      ty.value = e.translationY * 0.08;
    })
    .onEnd(() => {
      if (locked.value) return;

      if (tx.value > SWIPE_THRESHOLD) {
        runOnJS(flyOut)("like");
        return;
      }
      if (tx.value < -SWIPE_THRESHOLD) {
        runOnJS(flyOut)("pass");
        return;
      }

      tx.value = withSpring(0, { damping: 16, stiffness: 190 });
      ty.value = withSpring(0, { damping: 16, stiffness: 190 });
    });

  // ----- states -----
  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={[typography.small, { color: colors.text2 }]}>Loading…</Text>
      </View>
    );
  }

  if (err) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
        <Header onReset={doReset} onFilters={() => setFiltersOpen(true)} />
        <View style={{ padding: spacing.xl }}>
          <View style={styles.simpleCard}>
            <Text style={[typography.h3, { color: colors.text }]}>Swipe crashed</Text>
            <Text style={[typography.small, { color: colors.text2, marginTop: 8, lineHeight: 18 }]}>
              {err}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (!current) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
        <Header onReset={doReset} onFilters={() => setFiltersOpen(true)} />
        <View style={{ padding: spacing.xl, flex: 1, justifyContent: "center" }}>
          <View style={styles.simpleCard}>
            <Text style={[typography.h3, { color: colors.text }]}>No more profiles</Text>
            <Text style={[typography.small, { color: colors.text2, marginTop: 8, lineHeight: 18 }]}>
              Seed demo users from Firebase.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // ----- mapping -----
  const photos = normalizePhotos(current?.photos);
  const heroUri = photos[0] || null;

  const age = getAge(current?.dobISO || current?.dob);
  const name = current?.name || "Name";
  const headline = age ? `${name}, ${age}` : name;

  const vibeText = getVibeText(current);
  const aboutText = getAboutText(current);

  const intentItems = [
    current?.intentPrimary,
    current?.intentSecondary,
    current?.otherText ? `Other: ${current.otherText}` : null,
  ].filter(Boolean);

  // Habits will be wired later; keep layout ready but hidden for now.
  const habitItems = [];

  const prompts = Array.isArray(current?.prompts) ? current.prompts : [];

  // exact sequence after Intent: photo -> prompt -> photo -> photo
  const blocks = [];
  if (photos[1]) blocks.push({ type: "photo", uri: photos[1], ratio: "4:3" });
  if (prompts[0]) blocks.push({ type: "prompt", p: prompts[0], idx: 0 });
  if (photos[2]) blocks.push({ type: "photo", uri: photos[2], ratio: "4:3" });
  if (photos[3]) blocks.push({ type: "photo", uri: photos[3], ratio: "4:3" });

  const remainingPhotos = photos.slice(4);
  const remainingPrompts = prompts.slice(1);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <Header onReset={doReset} onFilters={() => setFiltersOpen(true)} />

      <SwipeFiltersModal
        visible={filtersOpen}
        value={filters}
        onClose={() => setFiltersOpen(false)}
        onReset={(f) => setFilters(f)}
        onApply={async (f) => {
          setFilters(f);
          if (!uid) return;
          setLoading(true);
          await loadQueue(uid, f);
          setLoading(false);
        }}
      />

      {/* stack touches bottom */}
      <View style={{ flex: 1 }}>
        {/* next card behind (photo, not name) */}
        {nextPeek ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.stackCard, { top: 0, bottom: 0 }, nextCardStyle]}
          >
            <View style={styles.cardShell}>
              <PeekCard profile={nextPeek} />
            </View>
          </Animated.View>
        ) : null}

        {/* top card */}
        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.stackCard, { top: 0, bottom: 0 }, topCardStyle]}>
            <View style={styles.cardShell}>
              {/* stamps */}
              <Animated.View style={[styles.likeStamp, likeStampStyle]}>
                <Text style={styles.stampText}>❤ LIKE</Text>
              </Animated.View>
              <Animated.View style={[styles.passStamp, passStampStyle]}>
                <Text style={styles.stampText}>✕ NOPE</Text>
              </Animated.View>

              {/* heart pop */}
              <Animated.View style={[styles.heartPop, heartPopStyle]}>
                <Text style={{ fontSize: 42 }}>❤</Text>
              </Animated.View>

              {/* scroll content */}
              <GestureDetector gesture={nativeScroll}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingBottom: Math.max(insets.bottom, 0) + TAB_BAR_GUESS + 90,
                  }}
                >
                  {/* HERO: full screen feel */}
                  <View style={{ height: H - insets.top - 56, backgroundColor: CARD_BG }}>
                    {heroUri ? (
                      <Image source={{ uri: heroUri }} style={styles.heroFull} resizeMode="cover" />
                    ) : (
                      <View style={{ flex: 1 }}>
                        <AvatarCard
                          gender={current?.gender}
                          title={headline}
                          subtitle={vibeText ? vibeText : undefined}
                          height={H - insets.top - 56}
                        />
                      </View>
                    )}

                    <View style={styles.heroScrim} />

                    <View style={styles.heroOverlay}>
                      <Text style={styles.heroName} numberOfLines={1}>
                        {headline}
                      </Text>
                      {vibeText ? (
                        <Text style={styles.heroVibe} numberOfLines={2}>
                          {vibeText}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  {/* Habits (later) */}
                  {habitItems.length ? (
                    <View style={styles.sectionPad}>
                      <SectionTitle>Habits</SectionTitle>
                      <BubbleRow items={habitItems} />
                    </View>
                  ) : null}

                  {/* About me */}
                  {aboutText ? (
                    <>
                      <Divider style={styles.divider} />
                      <View style={styles.sectionPad}>
                        <SectionTitle>About me</SectionTitle>
                        <Text style={[typography.small, { color: colors.text, lineHeight: 20 }]}>
                          {aboutText}
                        </Text>
                      </View>
                    </>
                  ) : null}

                  {/* Intent */}
                  {intentItems.length ? (
                    <>
                      <Divider style={styles.divider} />
                      <View style={styles.sectionPad}>
                        <SectionTitle>Intent</SectionTitle>
                        <BubbleRow items={intentItems} />
                      </View>
                    </>
                  ) : null}

                  {/* photo -> prompt -> photo -> photo */}
                  {blocks.map((b, i) => {
                    if (b.type === "photo") {
                      return (
                        <View key={`b-photo-${i}`} style={{ marginTop: 14, paddingHorizontal: 0 }}>
                          <PhotoBlock uri={b.uri} ratio={b.ratio} />
                        </View>
                      );
                    }
                    if (b.type === "prompt") {
                      return (
                        <View key={`b-prompt-${i}`} style={styles.sectionPad}>
                          <PromptCard prompt={b.p} idx={b.idx} onVoiceReact={handleVoiceReact} />
                        </View>
                      );
                    }
                    return null;
                  })}

                  {/* Distance */}
                  <Divider style={styles.divider} />
                  <View style={styles.sectionPad}>
                    <SectionTitle>Distance</SectionTitle>
                    <Text style={[typography.small, { color: colors.text }]}>
                      {kmAway ? `${kmAway} away` : "—"}
                    </Text>
                  </View>

                  {/* remaining photos */}
                  {remainingPhotos.length ? (
                    <>
                      <Divider style={styles.divider} />
                      <View style={styles.sectionPad}>
                        <SectionTitle>More photos</SectionTitle>
                      </View>
                      {remainingPhotos.map((uri, idx) => (
                        <View key={`rp-${idx}`} style={{ marginTop: idx === 0 ? 0 : 14 }}>
                          <PhotoBlock uri={uri} ratio="4:3" />
                        </View>
                      ))}
                    </>
                  ) : null}

                  {/* remaining prompts */}
                  {remainingPrompts.length ? (
                    <>
                      <Divider style={styles.divider} />
                      <View style={styles.sectionPad}>
                        <SectionTitle>More prompts</SectionTitle>
                        <View style={{ gap: 12 }}>
                          {remainingPrompts.map((p, idx) => (
                            <PromptCard key={`mp-${idx}`} prompt={p} idx={idx + 1} onVoiceReact={handleVoiceReact} />
                          ))}
                        </View>
                      </View>
                    </>
                  ) : null}
                </ScrollView>
              </GestureDetector>
            </View>
          </Animated.View>
        </GestureDetector>
      </View>

      {/* floating actions close to tab bar */}
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: Math.max(insets.bottom, 0) + TAB_BAR_GUESS,
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", gap: 22, alignItems: "center" }}>
          {/* Pass button */}
          <Pressable onPress={() => flyOut("pass")} style={styles.btnPass}>
            <Text style={{ fontSize: 26, color: "rgba(255,255,255,0.70)" }}>✕</Text>
          </Pressable>

          {/* Like button — gradient circle */}
          <Pressable onPress={() => flyOut("like")} style={styles.btnLikeWrap}>
            <LinearGradient
              colors={colors.primaryGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.btnLike}
            >
              <Text style={{ fontSize: 30 }}>❤</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function PeekCard({ profile }) {
  const photos = normalizePhotos(profile?.photos);
  const heroUri = photos[0] || null;
  const age = getAge(profile?.dobISO || profile?.dob);
  const name = profile?.name || "Name";
  const headline = age ? `${name}, ${age}` : name;

  return (
    <View style={{ flex: 1, backgroundColor: CARD_BG }}>
      {heroUri ? (
        <Image source={{ uri: heroUri }} style={{ flex: 1 }} resizeMode="cover" />
      ) : (
        <AvatarCard gender={profile?.gender} title={headline} height={9999} />
      )}
      <View style={styles.peekScrim} />
    </View>
  );
}

function Header({ onReset, onFilters }) {
  const { colors } = useTheme();
  return (
    <View style={styles.header}>
      {/* Gradient brand name */}
      <LinearGradient
        colors={colors.primaryGrad}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ borderRadius: 6 }}
      >
        <Text style={[styles.brand, { color: "#fff", paddingHorizontal: 2 }]}>Unchecked ✦</Text>
      </LinearGradient>

      <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
        <Pressable onPress={onFilters} style={styles.filterBtn}>
          <Text style={[typography.tiny, { color: colors.text }]}>⚙ Filters</Text>
        </Pressable>

        <Pressable onPress={onReset} style={styles.resetBtn}>
          <Text style={[typography.tiny, { color: colors.text2 }]}>↺ Reset</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },

  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: 10,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  brand: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: 0.2,
  },

  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  resetBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  simpleCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: CARD_BG,
    padding: 16,
  },

  stackCard: {
    position: "absolute",
    left: CARD_MARGIN,
    right: CARD_MARGIN,
  },

  cardShell: {
    flex: 1,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: CARD_BG,
    overflow: "hidden",
  },

  heroFull: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  heroScrim: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 180,
    backgroundColor: "rgba(0,0,0,0.38)",
  },

  heroOverlay: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 18,
    zIndex: 5,
  },

  heroName: {
    color: "white",
    fontSize: 30,
    fontWeight: "800",
  },

  heroVibe: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 14,
    marginTop: 6,
    lineHeight: 18,
  },

  sectionPad: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },

  divider: {
    marginTop: 16,
    marginHorizontal: 16,
  },

  subPhoto: {
    width: "100%",
    borderRadius: 18,
    backgroundColor: CARD_BG,
  },

  promptCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  peekScrim: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  likeStamp: {
    position: "absolute",
    top: 18,
    left: 18,
    zIndex: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: "#00C896",  // green LIKE
    backgroundColor: "rgba(0,200,150,0.12)",
  },

  passStamp: {
    position: "absolute",
    top: 18,
    right: 18,
    zIndex: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: "#FF4060",  // red NOPE
    backgroundColor: "rgba(255,64,96,0.12)",
  },

  stampText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1,
  },

  heartPop: {
    position: "absolute",
    top: 70,
    right: 22,
    zIndex: 7,
  },

  btnPass: {
    width: 64,
    height: 64,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.20)",
    backgroundColor: "rgba(255,255,255,0.07)",
    shadowColor: "#fff",
    shadowOpacity: 0.10,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },

  btnLikeWrap: {
    borderRadius: 999,
    shadowColor: "#E8356D",
    shadowOpacity: 0.65,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 16,
  },

  btnLike: {
    width: 74,
    height: 74,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
});
