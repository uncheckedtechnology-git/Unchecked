// src/navigation/RootNavigator.js
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { computeProfileComplete } from "../services/profileCompletion";

import { auth, db } from "../config/firebase";
import { colors, useTheme, typography } from "../theme";
import { useAppState } from "../state/appState";

import AuthNavigator from "./AuthNavigator";
import TabsNavigator from "./TabsNavigator";
import OnboardingNavigator from "./OnboardingNavigator";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { colors } = useTheme();
  const { profileCompleteTick } = useAppState();

  const [boot, setBoot] = useState({
    loading: true,
    authedUid: null,
    userDoc: null,
  });

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setBoot((p) => ({ ...p, authedUid: u ? u.uid : null, loading: false, userDoc: null }));
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!boot.authedUid) return;

    const ref = doc(db, "users", boot.authedUid);
    const unsubUser = onSnapshot(ref, (snap) => {
      setBoot((p) => ({ ...p, userDoc: snap.exists() ? snap.data() : null }));
    });

    return () => unsubUser();
  }, [boot.authedUid, profileCompleteTick]);

  if (boot.loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", gap: 12 }}>
        <ActivityIndicator />
        <Text style={[typography.small, { color: colors.text2 }]}>Loading…</Text>
      </View>
    );
  }

  // Not logged in -> Auth flow
  if (!boot.authedUid) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Auth" component={AuthNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  const profileComplete = boot.userDoc?.profileComplete === true;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!profileComplete ? (
          <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : (
          <Stack.Screen name="Tabs" component={TabsNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
