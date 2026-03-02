// src/screens/profile/EditPhotosScreen.js
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Image, Pressable, ScrollView, Alert } from "react-native";
import { colors, useTheme, spacing, typography, radius, shadow } from "../../theme";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Divider from "../../components/Divider";

import { getUid, updateUser } from "../../services/userService";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";
import { pickImageCompressed } from "../../services/imagePicker";
import { uploadProfilePhoto, deleteProfilePhoto } from "../../services/storageService";

function Tile({ uri, index, onAdd, onRemove, uploading }) {
  const { colors } = useTheme();
  const isAdd = !uri;
  return (
    <Pressable
      onPress={() => (isAdd ? onAdd() : onRemove(index))}
      style={({ pressed }) => [
        {
          width: "48%",
          aspectRatio: 4 / 5,
          borderRadius: radius.xl,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          opacity: pressed ? 0.92 : 1,
        },
        shadow.card,
      ]}
    >
      {uri ? (
        <>
          <Image source={{ uri }} style={{ width: "100%", height: "100%" }} />
          <View
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              backgroundColor: "rgba(0,0,0,0.6)",
              borderRadius: 999,
              paddingVertical: 6,
              paddingHorizontal: 10,
            }}
          >
            <Text style={[typography.tiny, { color: "#fff" }]}>Remove</Text>
          </View>

          <View
            style={{
              position: "absolute",
              left: 10,
              top: 10,
              backgroundColor: "rgba(0,0,0,0.6)",
              borderRadius: 999,
              paddingVertical: 6,
              paddingHorizontal: 10,
            }}
          >
            <Text style={[typography.tiny, { color: "#fff" }]}>#{index + 1}</Text>
          </View>
        </>
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.card2 }}>
          <Text style={[typography.h2, { color: colors.text2 }]}>+</Text>
          <Text style={[typography.small, { color: colors.text2 }]}>
            {uploading ? "Uploading…" : "Add photo"}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export default function EditPhotosScreen({ navigation }) {
  const { colors } = useTheme();
  const [uid, setUid] = useState(null);
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const id = await getUid();
      setUid(id);
      const unsub = onSnapshot(doc(db, "users", id), (snap) => setUser(snap.data() || null));
      return () => unsub();
    })();
  }, []);

  const maxPhotos = 6;

  const photos = useMemo(() => (user?.photos || []).slice(0, maxPhotos), [user?.photos]);
  const tiles = useMemo(() => {
    const arr = photos.map((p) => p?.uri).filter(Boolean);
    while (arr.length < maxPhotos) arr.push(null);
    return arr;
  }, [photos]);

  async function addPhoto() {
    if (!uid) return;
    if (photos.length >= maxPhotos) return;
    const picked = await pickImageCompressed();
    if (!picked?.uri) return;

    setSaving(true);
    try {
      // Upload to Firebase Storage first
      const newIndex = photos.length;
      const downloadURL = await uploadProfilePhoto(uid, picked.uri, newIndex);

      // Save the download URL to Firestore
      const next = [...(user?.photos || []), { uri: downloadURL, type: "remote" }].slice(0, maxPhotos);
      await updateUser(uid, { photos: next });
    } catch (err) {
      Alert.alert("Upload failed", err.message || "Could not upload photo. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function removePhoto(index) {
    if (!uid) return;
    setSaving(true);
    try {
      // Delete from Firebase Storage
      await deleteProfilePhoto(uid, index);

      // Remove from Firestore
      const next = (user?.photos || []).filter((_, i) => i !== index);
      await updateUser(uid, { photos: next });
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxl }}>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={[typography.small, { color: colors.text2, marginTop: 16 }]}>← Back</Text>
      </Pressable>

      <Text style={[typography.h2, { color: colors.text, marginTop: 10 }]}>Edit photos</Text>
      <Text style={[typography.small, { color: colors.text2, marginTop: 6 }]}>
        Tap a tile to add. Tap a photo to remove. Photos are uploaded to the cloud automatically.
      </Text>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={[typography.small, { color: colors.text2 }]}>
          Photos: <Text style={{ color: colors.text }}>{(user?.photos || []).length}</Text> / {maxPhotos}
        </Text>
        <Divider />
        <Text style={[typography.tiny, { color: colors.text2, lineHeight: 16 }]}>
          Photos are stored securely in the cloud and visible to other users.
        </Text>
      </Card>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: spacing.lg }}>
        {tiles.map((uri, i) => (
          <Tile key={i} uri={uri} index={i} onAdd={addPhoto} onRemove={removePhoto} uploading={saving} />
        ))}
      </View>

      <View style={{ marginTop: spacing.xl }}>
        <Button title={saving ? "Uploading…" : "Add photo"} onPress={addPhoto} loading={saving} />
      </View>
    </ScrollView>
  );
}
