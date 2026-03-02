// src/navigation/OnboardingNavigator.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import WelcomeScreen from "../screens/onboarding/WelcomeScreen";
import NameAgeScreen from "../screens/onboarding/NameAgeScreen";
import IntentSlidersScreen from "../screens/onboarding/IntentSlidersScreen";
import OkWithBubblesScreen from "../screens/onboarding/OkWithBubblesScreen";
import SelfConcernsBubblesScreen from "../screens/onboarding/SelfConcernsBubblesScreen";
import PhotosPromptsScreen from "../screens/onboarding/PhotosPromptsScreen";
import OnboardingDoneScreen from "../screens/onboarding/OnboardingDoneScreen";
import SignupBasicsScreen from "../screens/onboarding/SignupBasicsScreen";
import VibeOnboardingScreen from "../screens/onboarding/VibeOnboardingScreen";

const Stack = createNativeStackNavigator();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator initialRouteName="SignupBasics" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SignupBasics" component={SignupBasicsScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="NameAge" component={NameAgeScreen} />
      <Stack.Screen name="IntentSliders" component={IntentSlidersScreen} />
      <Stack.Screen name="OkWith" component={OkWithBubblesScreen} />
      <Stack.Screen name="SelfConcerns" component={SelfConcernsBubblesScreen} />
      <Stack.Screen name="PhotosPrompts" component={PhotosPromptsScreen} />
      <Stack.Screen name="VibeOnboarding" component={VibeOnboardingScreen} />

      <Stack.Screen name="OnboardingDone" component={OnboardingDoneScreen} />

    </Stack.Navigator>
  );
}
