// src/navigation/TabsNavigator.js
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";
import { colors, typography } from "../theme";
import ProfileTab from "../screens/tabs/ProfileTab";

import ProfileScreen from "../screens/tabs/ProfileScreen";
import MatchesScreen from "../screens/tabs/MatchesScreen";
import SwipeScreen from "../screens/tabs/SwipeScreen";
import CircleScreen from "../screens/tabs/CircleScreen";
import ChatListScreen from "../screens/tabs/ChatListScreen";

const Tab = createBottomTabNavigator();

function TabLabel({ focused, title }) {
  return (
    <Text
      style={[
        typography.tiny,
        { color: focused ? colors.text : colors.text2, marginBottom: 6 },
      ]}
    >
      {title}
    </Text>
  );
}

export default function TabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 66,
        },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.text2,
      }}
    >
      <Tab.Screen
        name="Profile"
        component={ProfileTab}
        options={{ tabBarLabel: ({ focused }) => <TabLabel focused={focused} title="Profile" /> }}
      />
      <Tab.Screen
        name="Circle"
        component={CircleScreen}
        options={{ tabBarLabel: ({ focused }) => <TabLabel focused={focused} title="Circle" /> }}
      />
    
      <Tab.Screen
        name="Swipe"
        component={SwipeScreen}
        options={{ tabBarLabel: ({ focused }) => <TabLabel focused={focused} title="Swipe" /> }}
      />
      <Tab.Screen
        name="Matches"
        component={MatchesScreen}
        options={{ tabBarLabel: ({ focused }) => <TabLabel focused={focused} title="Matches" /> }}
      />
    
      <Tab.Screen
        name="Chat"
        component={ChatListScreen}
        options={{ tabBarLabel: ({ focused }) => <TabLabel focused={focused} title="Chat" /> }}
      />
    </Tab.Navigator>
  );
}
