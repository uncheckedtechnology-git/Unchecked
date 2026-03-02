// src/navigation/TabsNavigator.js — Premium frosted glass tab bar
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View } from "react-native";
import { colors, useTheme, typography } from "../theme";
import ProfileTab from "../screens/tabs/ProfileTab";

import ProfileScreen from "../screens/tabs/ProfileScreen";
import MatchesScreen from "../screens/tabs/MatchesScreen";
import SwipeScreen from "../screens/tabs/SwipeScreen";
import CircleScreen from "../screens/tabs/CircleScreen";
import ChatListScreen from "../screens/tabs/ChatListScreen";

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Profile: "👤",
  Circle: "⭕",
  Swipe: "🔥",
  Matches: "💌",
  Chat: "💬",
};

function TabIcon({ name, focused }) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: "center", gap: 4, paddingTop: 6 }}>
      <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.45 }}>
        {TAB_ICONS[name]}
      </Text>
      <Text
        style={[
          typography.tiny,
          {
            color: focused ? colors.primary : colors.muted,
            fontWeight: focused ? "700" : "500",
            letterSpacing: 0.4,
          },
        ]}
      >
        {name}
      </Text>
      {focused && (
        <View
          style={{
            width: 18,
            height: 3,
            borderRadius: 99,
            backgroundColor: colors.primary,
            marginTop: -2,
          }}
        />
      )}
    </View>
  );
}

export default function TabsNavigator() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          bottom: 24,
          left: 20,
          right: 20,
          borderRadius: 40,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          height: 70,
          paddingBottom: 0,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 10 },
          elevation: 10,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Profile"
        component={ProfileTab}
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="Profile" focused={focused} /> }}
      />
      <Tab.Screen
        name="Circle"
        component={CircleScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="Circle" focused={focused} /> }}
      />
      <Tab.Screen
        name="Swipe"
        component={SwipeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="Swipe" focused={focused} /> }}
      />
      <Tab.Screen
        name="Matches"
        component={MatchesScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="Matches" focused={focused} /> }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatListScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="Chat" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}
