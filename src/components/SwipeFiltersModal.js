import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, Text, View, StyleSheet } from "react-native";
import { colors, spacing, typography } from "../theme";
import Chip from "./Chip";

const DEFAULTS = {
  ageMin: 18,
  ageMax: 35,
  maxDistanceKm: 25,
  genders: ["woman", "man", "other"],
};

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function StepperRow({ label, valueText, onMinus, onPlus, hint }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={[typography.small, { color: colors.text }]}>{label}</Text>
        <Text style={[typography.small, { color: colors.text2 }]}>{valueText}</Text>
      </View>

      {hint ? (
        <Text style={[typography.tiny, { color: colors.text2, marginTop: 6 }]}>{hint}</Text>
      ) : null}

      <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
        <Pressable onPress={onMinus} style={styles.stepBtn}>
          <Text style={styles.stepBtnText}>−</Text>
        </Pressable>
        <Pressable onPress={onPlus} style={styles.stepBtn}>
          <Text style={styles.stepBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function SwipeFiltersModal({
  visible,
  value,
  onClose,
  onApply,
  onReset,
}) {
  const base = useMemo(() => ({ ...DEFAULTS, ...(value || {}) }), [value]);
  const [draft, setDraft] = useState(base);

  useEffect(() => {
    if (visible) setDraft(base);
  }, [visible, base]);

  const genders = draft.genders || [];

  function toggleGender(g) {
    setDraft((p) => {
      const set = new Set(p.genders || []);
      if (set.has(g)) set.delete(g);
      else set.add(g);
      return { ...p, genders: Array.from(set) };
    });
  }

  function apply() {
    const ageMin = clamp(Number(draft.ageMin || 18), 18, 99);
    const ageMax = clamp(Number(draft.ageMax || 35), 18, 99);
    const maxDistanceKm = clamp(Number(draft.maxDistanceKm || 25), 1, 500);

    const fixed = {
      ageMin: Math.min(ageMin, ageMax),
      ageMax: Math.max(ageMin, ageMax),
      maxDistanceKm,
      genders: Array.isArray(draft.genders) && draft.genders.length ? draft.genders : DEFAULTS.genders,
    };

    onApply?.(fixed);
    onClose?.();
  }

  function reset() {
    setDraft(DEFAULTS);
    onReset?.(DEFAULTS);
  }

  return (
    <Modal visible={!!visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>Filters</Text>

          <Pressable onPress={onClose} style={styles.iconBtn}>
            <Text style={{ color: colors.text, fontSize: 18 }}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.body}>
          <StepperRow
            label="Age range"
            valueText={`${draft.ageMin}–${draft.ageMax}`}
            hint="Who you want to see"
            onMinus={() =>
              setDraft((p) => ({ ...p, ageMin: clamp((p.ageMin || 18) - 1, 18, 99) }))
            }
            onPlus={() =>
              setDraft((p) => ({ ...p, ageMin: clamp((p.ageMin || 18) + 1, 18, 99) }))
            }
          />

          <StepperRow
            label="Max age"
            valueText={`${draft.ageMax}`}
            onMinus={() =>
              setDraft((p) => ({ ...p, ageMax: clamp((p.ageMax || 35) - 1, 18, 99) }))
            }
            onPlus={() =>
              setDraft((p) => ({ ...p, ageMax: clamp((p.ageMax || 35) + 1, 18, 99) }))
            }
          />

          <StepperRow
            label="Distance"
            valueText={`${draft.maxDistanceKm} km`}
            hint="Uses your saved location"
            onMinus={() =>
              setDraft((p) => ({ ...p, maxDistanceKm: clamp((p.maxDistanceKm || 25) - 5, 1, 500) }))
            }
            onPlus={() =>
              setDraft((p) => ({ ...p, maxDistanceKm: clamp((p.maxDistanceKm || 25) + 5, 1, 500) }))
            }
          />

          <Text style={[typography.small, { color: colors.text, marginBottom: 10 }]}>
            Show me
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
            <Pressable onPress={() => toggleGender("woman")}>
              <Chip label={`Women${genders.includes("woman") ? " ✓" : ""}`} />
            </Pressable>
            <Pressable onPress={() => toggleGender("man")}>
              <Chip label={`Men${genders.includes("man") ? " ✓" : ""}`} />
            </Pressable>
            <Pressable onPress={() => toggleGender("other")}>
              <Chip label={`Other${genders.includes("other") ? " ✓" : ""}`} />
            </Pressable>
          </View>

          <View style={styles.comingSoonBox}>
            <Text style={[typography.small, { color: colors.text }]}>Advanced filters</Text>
            <Text style={[typography.tiny, { color: colors.text2, marginTop: 6, lineHeight: 16 }]}>
              Coming next: Drinking, Smoking, Workout, etc. (placeholders are ready).
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable onPress={reset} style={styles.secondaryBtn}>
            <Text style={[typography.small, { color: colors.text }]}>Reset</Text>
          </Pressable>

          <Pressable onPress={apply} style={styles.primaryBtn}>
            <Text style={[typography.small, { color: colors.text }]}>Apply</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  iconBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  body: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 14,
  },
  stepBtn: {
    width: 56,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  stepBtnText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  comingSoonBox: {
    marginTop: 6,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    gap: 12,
  },
  secondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  primaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
});
