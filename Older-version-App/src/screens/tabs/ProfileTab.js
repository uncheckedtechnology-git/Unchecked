// src/screens/tabs/ProfileTab.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ProfileScreen from "./ProfileScreen";
import EditProfileScreen from "../profile/EditProfileScreen";
import EditPhotosScreen from "../profile/EditPhotosScreen";
import EditVibeScreen from "../profile/EditVibeScreen";

// next files we’ll add after this:
import EditPromptsScreen from "../profile/EditPromptsScreen";
import EditIntentsScreen from "../profile/EditIntentsScreen";
import EditBubblesScreen from "../profile/EditBubblesScreen";

const Stack = createNativeStackNavigator();

export default function ProfileTab() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="EditPhotos" component={EditPhotosScreen} />
      <Stack.Screen name="EditPrompts" component={EditPromptsScreen} />
      <Stack.Screen name="EditIntents" component={EditIntentsScreen} />
      <Stack.Screen name="EditBubbles" component={EditBubblesScreen} />
      <Stack.Screen name="EditVibe" component={EditVibeScreen} />

    </Stack.Navigator>
  );
}
