// src/components/BubblesPicker.js
import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from "react-native";
import { useTheme, spacing, typography } from "../theme";
import Chip from "./Chip";

const DEFAULT_INITIAL = 10;
const DEFAULT_PAGE = 10;

function norm(s) {
  return String(s || "").trim().toLowerCase();
}

function CheckboxRow({ value, onChange, label, colors }) {
  return (
    <Pressable
      onPress={() => onChange?.(!value)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card2 || "rgba(0,0,0,0.04)",
      }}
      hitSlop={8}
    >
      <View
        style={[
          {
            width: 22,
            height: 22,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.card2 || "rgba(0,0,0,0.04)",
          },
          value && {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
          },
        ]}
      >
        {value ? <Text style={{ color: "#fff", fontSize: 14, fontWeight: "800", marginTop: -1 }}>✓</Text> : null}
      </View>
      <Text style={[typography.small, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

export default function BubblesPicker({
  options = [],
  selectedIds = [],
  onChangeSelected,

  initialVisible = DEFAULT_INITIAL,
  pageSize = DEFAULT_PAGE,

  showSearch = false,
  allowCustom = false,
  customPrefix = "custom:",
  searchPlaceholder = "Search…",

  showVisibilityToggle = false,
  visibleOnProfile = true,
  onChangeVisibleOnProfile,
  visibilityLabel = "Show on my profile",

  moreLabel = "More",
}) {
  const { colors } = useTheme();
  const [visibleCount, setVisibleCount] = useState(initialVisible);
  const [query, setQuery] = useState("");

  const selectedSet = useMemo(() => new Set(selectedIds || []), [selectedIds]);

  const filtered = useMemo(() => {
    if (!showSearch) return options;
    const q = norm(query);
    if (!q) return options;
    return options.filter((o) => norm(o?.label).includes(q));
  }, [options, showSearch, query]);

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  const hasMore = filtered.length > visibleCount;

  function toggle(id) {
    const isSelected = selectedSet.has(id);
    const next = new Set(selectedSet);
    if (isSelected) next.delete(id);
    else next.add(id);
    onChangeSelected?.(Array.from(next));
  }

  function onMore() {
    setVisibleCount((c) => Math.min(c + pageSize, filtered.length));
  }

  function canAddCustom() {
    if (!allowCustom || !showSearch) return false;
    const q = String(query || "").trim();
    if (q.length < 2) return false;
    const exists = options.some((o) => norm(o?.label) === norm(q));
    if (exists) return false;
    return true;
  }

  function addCustom() {
    const q = String(query || "").trim();
    if (!q) return;
    const id = `${customPrefix}${q}`;
    if (selectedSet.has(id)) return;
    const next = new Set(selectedSet);
    next.add(id);
    onChangeSelected?.(Array.from(next));
    setQuery("");
  }

  return (
    <View style={{ flex: 1 }}>
      {showSearch ? (
        <View
          style={{
            marginTop: spacing.lg,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card2 || "rgba(0,0,0,0.04)",
          }}
        >
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.text2}
            style={{ flex: 1, color: colors.text, fontSize: 14, paddingVertical: 0 }}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType={canAddCustom() ? "done" : "search"}
            onSubmitEditing={canAddCustom() ? addCustom : undefined}
          />
          {canAddCustom() ? (
            <Pressable
              onPress={addCustom}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card2 || "rgba(0,0,0,0.04)",
              }}
            >
              <Text style={[typography.tiny, { color: colors.text }]}>Add</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <ScrollView
        style={{ flex: 1, marginTop: showSearch ? spacing.lg : 0 }}
        contentContainerStyle={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          paddingBottom: spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {visible.map((item) => (
          <Chip
            key={item.id}
            label={item.label}
            selected={selectedSet.has(item.id)}
            onToggle={() => toggle(item.id)}
          />
        ))}

        {/* Custom selected chips */}
        {allowCustom
          ? (selectedIds || [])
            .filter((id) => String(id).startsWith(customPrefix))
            .map((id) => {
              const label = String(id).slice(customPrefix.length);
              return (
                <Chip
                  key={id}
                  label={label}
                  selected={true}
                  onToggle={() => toggle(id)}
                />
              );
            })
          : null}

        {/* Checkbox (full width) */}
        {showVisibilityToggle ? (
          <View style={{ width: "100%", marginTop: 12 }}>
            <CheckboxRow
              value={!!visibleOnProfile}
              onChange={onChangeVisibleOnProfile}
              label={visibilityLabel}
              colors={colors}
            />
            <Text style={[typography.tiny, { color: colors.text2, marginTop: 6, lineHeight: 16 }]}>
              If off, this stays private and won't appear on your public profile.
            </Text>
          </View>
        ) : null}

        {/* More button */}
        {hasMore ? (
          <View style={{ width: "100%", alignItems: "center", marginTop: 14 }}>
            <Pressable
              onPress={onMore}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card2 || "rgba(0,0,0,0.04)",
              }}
            >
              <Text style={[typography.tiny, { color: colors.text }]}>
                {moreLabel} (+{pageSize})
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
