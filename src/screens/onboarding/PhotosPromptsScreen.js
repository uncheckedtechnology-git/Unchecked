// src/screens/onboarding/PhotosPromptsScreen.js
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Image, Pressable, Alert } from "react-native";
import { useTheme, spacing, typography, radius } from "../../theme";
import ProgressDots from "../../components/ProgressDots";
import Button from "../../components/Button";
import Card from "../../components/Card";
import TextField from "../../components/TextField";
import Divider from "../../components/Divider";

import { getUid, updateUser } from "../../services/userService";
import { loadConfig } from "../../services/configService";
import { pickImageCompressed } from "../../services/imagePicker";
import { uploadAllPhotosToCloudinary } from "../../services/cloudinaryService";
import { pickDefaultPrompts } from "../../data/defaults";

export default function PhotosPromptsScreen({ navigation }) {
  const { colors } = useTheme();
  const [uid, setUid] = useState(null);
  const [config, setConfig] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  useEffect(() => {
    (async () => {
      const id = await getUid();
      setUid(id);
      const cfg = await loadConfig();
      setConfig(cfg);
      setPrompts(pickDefaultPrompts(cfg, cfg.max_prompts || 3));
    })();
  }, []);

  const maxPhotos = config?.max_photos || 6;

  const photoSlots = useMemo(() => {
    const arr = [...photos];
    while (arr.length < maxPhotos) arr.push(null);
    return arr.slice(0, maxPhotos);
  }, [photos, maxPhotos]);

  async function addPhoto() {
    if (photos.length >= maxPhotos) return;
    const picked = await pickImageCompressed();
    if (!picked) return;
    setPhotos((prev) => [...prev, { uri: picked.uri, type: "local" }]);
  }

  function removePhoto(index) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function setAnswer(i, text) {
    setPrompts((prev) => prev.map((p, idx) => (idx === i ? { ...p, a: text } : p)));
  }

  async function onFinish() {
    if (!uid) return;
    setSaving(true);
    try {
      setUploadStatus("Uploading photos to cloud…");
      const uploadedPhotos = await uploadAllPhotosToCloudinary(uid, photos);
      setUploadStatus("Saving profile…");
      await updateUser(uid, { photos: uploadedPhotos, prompts });
      navigation.navigate("VibeOnboarding");
    } catch (err) {
      Alert.alert(
        "Upload failed",
        err.message || "Could not upload photos. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setSaving(false);
      setUploadStatus("");
    }
  }

  if (!config) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <Text style={[typography.small, { color: colors.text2 }]}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.xl }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <View style={{ gap: 8, marginTop: 16 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Photos & prompts</Text>
          <Text style={[typography.small, { color: colors.text2, lineHeight: 18 }]}>
            Add up to {maxPhotos} photos. Prompts make you stand out.
          </Text>
        </View>

        <Card style={{ marginTop: spacing.lg }}>
          <Text style={[typography.h3, { color: colors.text }]}>Photos</Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: spacing.md }}>
            {photoSlots.map((p, idx) => (
              <Pressable
                key={idx}
                onPress={() => (p ? removePhoto(idx) : addPhoto())}
                style={{
                  width: "31%",
                  aspectRatio: 3 / 4,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  overflow: "hidden",
                  backgroundColor: colors.card2,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {p?.uri ? (
                  <Image source={{ uri: p.uri }} style={{ width: "100%", height: "100%" }} />
                ) : (
                  <Text style={[typography.h3, { color: colors.text2 }]}>+</Text>
                )}
              </Pressable>
            ))}
          </View>

          <Text style={[typography.tiny, { color: colors.text2, marginTop: spacing.md, lineHeight: 16 }]}>
            Tip: Tap a photo to remove it. Photos are uploaded to the cloud when you press Next.
          </Text>
        </Card>

        <Card style={{ marginTop: spacing.lg }}>
          <Text style={[typography.h3, { color: colors.text }]}>Prompts</Text>
          <Text style={[typography.small, { color: colors.text2, marginTop: 8 }]}>
            Keep answers short, real, and specific.
          </Text>

          <View style={{ marginTop: spacing.md, gap: spacing.lg }}>
            {prompts.map((p, i) => (
              <View key={i} style={{ gap: 10 }}>
                <Text style={[typography.body, { color: colors.text }]}>{p.q}</Text>
                <TextField
                  value={p.a}
                  onChangeText={(t) => setAnswer(i, t)}
                  placeholder="Type your answer…"
                  maxLength={140}
                  multiline
                />
                {i !== prompts.length - 1 ? <Divider /> : null}
              </View>
            ))}
          </View>
        </Card>

        <View style={{ marginTop: spacing.lg }}>
          <ProgressDots total={3} index={1} />
          {!!uploadStatus && (
            <Text style={[typography.small, { color: colors.text2, textAlign: "center", marginTop: spacing.md }]}>
              {uploadStatus}
            </Text>
          )}
          <View style={{ marginTop: spacing.lg }}>
            <Button
              title={saving ? uploadStatus || "Uploading…" : "Next"}
              onPress={onFinish}
              loading={saving}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
