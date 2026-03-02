import "react-native-gesture-handler";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import RootNavigator from "./src/navigation/RootNavigator";
import { ThemeProvider, useTheme } from "./src/theme";
import { AppStateProvider } from "./src/state/appState";
import { GestureHandlerRootView } from "react-native-gesture-handler";

function AppContent() {
  const { colors, isDark } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <RootNavigator />
      </GestureHandlerRootView>
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppStateProvider>
        <AppContent />
      </AppStateProvider>
    </ThemeProvider>
  );
}
