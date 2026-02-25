// src/services/imagePicker.js
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

export async function pickImageCompressed() {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error("Media library permission denied");

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 1,
    allowsEditing: true,
    aspect: [4, 5],
  });

  if (result.canceled) return null;

  const asset = result.assets?.[0];
  if (!asset?.uri) return null;

  // compress + resize
  const out = await manipulateAsync(
    asset.uri,
    [{ resize: { width: 1080 } }],
    { compress: 0.75, format: SaveFormat.JPEG }
  );

  return { uri: out.uri };
}
