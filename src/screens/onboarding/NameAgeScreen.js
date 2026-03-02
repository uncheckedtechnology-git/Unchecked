// src/screens/onboarding/NameAgeScreen.js
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Modal,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme, spacing, typography } from "../../theme";
import TextField from "../../components/TextField";
import Button from "../../components/Button";
import ProgressDots from "../../components/ProgressDots";
import Card from "../../components/Card";
import { getUid, updateUser } from "../../services/userService";

function calcAge(dob) {
  if (!dob) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

function formatDate(d) {
  if (!d) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
}

function toISODateOnly(d) {
  if (!d) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function NameAgeScreen({ navigation }) {
  const { colors } = useTheme();
  const [uid, setUid] = useState(null);
  const [name, setName] = useState("");
  const [dob, setDob] = useState(null);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState({ name: "", dob: "" });

  const [showPicker, setShowPicker] = useState(false);

  const age = useMemo(() => calcAge(dob), [dob]);

  useEffect(() => {
    (async () => {
      const id = getUid();

      setUid(id);
    })();
  }, []);

  function validate() {
    const e = { name: "", dob: "" };
    if (!name.trim()) e.name = "Enter your name";
    if (!dob) e.dob = "Pick your date of birth";
    else if (age === null || Number.isNaN(age)) e.dob = "Invalid date";
    else if (age < 18) e.dob = "You must be 18+";
    else if (age > 99) e.dob = "Age must be below 100";
    setErr(e);
    return !e.name && !e.dob;
  }

  async function onNext() {
    if (!uid) return;
    if (!validate()) return;

    setSaving(true);
    try {
      await updateUser(uid, {
        name: name.trim(), // ✅ stage name (public)
        dobISO: toISODateOnly(dob), // ✅ what our completion gate expects
        dobLocked: true, // ✅ lock later in edit
        age: age, // ✅ keep for filtering convenience
      });

      navigation.navigate("IntentSliders");
    } finally {
      setSaving(false);
    }
  }

  const maxDate = new Date(); // today
  // Default picker date if empty: 22 years ago
  const pickerValue = dob || new Date(maxDate.getFullYear() - 22, 0, 1);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.xl }}
    >
      <View style={{ marginTop: 16, gap: 8 }}>
        <Text style={[typography.h2, { color: colors.text }]}>Basics</Text>
        <Text style={[typography.small, { color: colors.text2 }]}>
          Name + DOB. We’ll calculate your age automatically.
        </Text>
      </View>

      <View style={{ marginTop: spacing.xl, gap: spacing.lg }}>
        <TextField
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          autoCapitalize="words"
          error={err.name}
        />

        <View style={{ gap: 8 }}>
          <Text style={[typography.small, { color: colors.text2 }]}>
            Date of Birth
          </Text>

          <Pressable onPress={() => setShowPicker(true)}>
            <Card
              padded={false}
              style={{
                paddingVertical: 14,
                paddingHorizontal: spacing.md,
                backgroundColor: colors.card2,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={[
                    typography.body,
                    { color: dob ? colors.text : colors.muted },
                  ]}
                >
                  {dob ? formatDate(dob) : "Tap to pick date"}
                </Text>

                <View
                  style={{
                    backgroundColor: "rgba(139,92,246,0.15)",
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: 999,
                  }}
                >
                  <Text style={[typography.small, { color: colors.text }]}>
                    {age ? `${age} yrs` : "—"}
                  </Text>
                </View>
              </View>
            </Card>
          </Pressable>

          {!!err.dob ? (
            <Text style={[typography.tiny, { color: colors.danger }]}>
              {err.dob}
            </Text>
          ) : (
            <Text style={[typography.tiny, { color: colors.text2 }]}>
              You can’t change DOB later (we’ll enforce this after auth).
            </Text>
          )}
        </View>
      </View>

      <View style={{ flex: 1 }} />

      <ProgressDots total={5} index={0} />
      <View style={{ marginTop: spacing.lg }}>
        <Button title="Next" onPress={onNext} loading={saving} />
      </View>

      {/* Date picker UX: iOS modal, Android inline pop */}
      {showPicker && Platform.OS === "ios" ? (
        <Modal
          transparent
          animationType="fade"
          onRequestClose={() => setShowPicker(false)}
        >
          <Pressable
            onPress={() => setShowPicker(false)}
            style={{
              flex: 1,
              backgroundColor: colors.overlay,
              padding: spacing.xl,
              justifyContent: "flex-end",
            }}
          >
            <Pressable
              onPress={() => { }}
              style={{
                backgroundColor: colors.card,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: colors.border,
                padding: spacing.lg,
                gap: 10,
              }}
            >
              <Text style={[typography.h3, { color: colors.text }]}>
                Select your DOB
              </Text>

              <DateTimePicker
                value={pickerValue}
                mode="date"
                display="spinner"
                maximumDate={maxDate}
                onChange={(event, selected) => {
                  if (selected) setDob(selected);
                }}
                style={{ alignSelf: "stretch" }}
              />

              <Button title="Done" onPress={() => setShowPicker(false)} />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

      {showPicker && Platform.OS !== "ios" ? (
        <DateTimePicker
          value={pickerValue}
          mode="date"
          display="default"
          maximumDate={maxDate}
          onChange={(event, selected) => {
            setShowPicker(false);
            if (selected) setDob(selected);
          }}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}
