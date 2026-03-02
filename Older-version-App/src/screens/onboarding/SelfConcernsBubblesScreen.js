// src/screens/onboarding/SelfConcernsBubblesScreen.js
import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { colors, spacing, typography } from "../../theme";

import ProgressDots from "../../components/ProgressDots";
import Button from "../../components/Button";
import Card from "../../components/Card";
import BubblesPicker from "../../components/BubblesPicker";

import { getUid, updateUser } from "../../services/userService";
import { loadBubbleSet } from "../../services/configService";

export default function SelfConcernsBubblesScreen({ navigation }) {
  const [uid, setUid] = useState(null);
  const [options, setOptions] = useState(null); // BubbleOption[]
  const [selectedIds, setSelectedIds] = useState([]);
  const [visibleOnProfile, setVisibleOnProfile] = useState(true); // ✅ default ON
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const id = await getUid();
      if (!mounted) return;
      setUid(id);

      const bubbles = await loadBubbleSet("selfConcerns");
      if (!mounted) return;

      setOptions(bubbles);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function onNext() {
    if (!uid) return;

    setSaving(true);
    try {
      const idToLabel = new Map((options || []).map((b) => [b.id, b.label]));
      const selectedLabels = (selectedIds || [])
        .map((id) =>
          String(id).startsWith("custom:")
            ? String(id).slice("custom:".length)
            : idToLabel.get(id)
        )
        .filter(Boolean);

      await updateUser(uid, {
        selfConcerns: selectedIds,                    // ids
        selfConcernsLabels: selectedLabels,           // snapshot labels
        selfConcernsVisible: !!visibleOnProfile,      // ✅ separate checkbox
      });

      // ✅ Must go PhotosPrompts before profileComplete
      navigation.navigate("PhotosPrompts");
    } finally {
      setSaving(false);
    }
  }

  if (!options) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <Text style={[typography.small, { color: colors.text2 }]}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.xl }}>
      <View style={{ gap: 8, marginTop: 16 }}>
        <Text style={[typography.h2, { color: colors.text }]}>Self-concerns</Text>
        <Text style={[typography.small, { color: colors.text2, lineHeight: 18 }]}>
          Be honest with yourself. This helps compatibility.
        </Text>
      </View>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={[typography.small, { color: colors.text2 }]}>
          Selected: <Text style={{ color: colors.text }}>{selectedIds.length}</Text>
        </Text>
      </Card>

      <View style={{ marginTop: spacing.lg, flex: 1 }}>
        <BubblesPicker
          options={options}
          selectedIds={selectedIds}
          onChangeSelected={setSelectedIds}
          initialVisible={10}
          pageSize={10}
          showSearch={false}
          allowCustom={false}
          moreLabel="More"
          // ✅ checkbox
          showVisibilityToggle={true}
          visibleOnProfile={visibleOnProfile}
          onChangeVisibleOnProfile={setVisibleOnProfile}
          visibilityLabel="Show this on my profile"
        />
      </View>

      <ProgressDots total={5} index={3} />
      <View style={{ marginTop: spacing.lg }}>
        <Button title="Next" onPress={onNext} loading={saving} />
      </View>
    </View>
  );
}
