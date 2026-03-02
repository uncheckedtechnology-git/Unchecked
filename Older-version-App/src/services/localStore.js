// src/services/localStore.js
import AsyncStorage from "@react-native-async-storage/async-storage";

export const LS_KEYS = {
  UID: "unchecked_uid_v1",
  CONFIG_CACHE: "unchecked_config_cache_v1",
  ADMIN_PIN: "unchecked_admin_pin_v1",
};

export async function getItem(key) {
  const v = await AsyncStorage.getItem(key);
  return v;
}

export async function setItem(key, value) {
  await AsyncStorage.setItem(key, value);
}

export async function getJSON(key) {
  const v = await AsyncStorage.getItem(key);
  if (!v) return null;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

export async function setJSON(key, obj) {
  await AsyncStorage.setItem(key, JSON.stringify(obj));
}

export async function removeItem(key) {
  await AsyncStorage.removeItem(key);
}
