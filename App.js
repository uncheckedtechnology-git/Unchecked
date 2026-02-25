import "react-native-gesture-handler";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import RootNavigator from "./src/navigation/RootNavigator";
import { colors } from "./src/theme";
import { AppStateProvider } from "./src/state/appState";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function App() {
  return (
    <AppStateProvider>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar style="light" />
          <RootNavigator />
    </GestureHandlerRootView>
        </View>
      </AppStateProvider>
  );
}
