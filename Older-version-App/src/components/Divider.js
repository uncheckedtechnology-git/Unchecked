// src/components/Divider.js
import React from "react";
import { View } from "react-native";
import { colors } from "../theme";

export default function Divider({ style }) {
  return (
    <View
      style={[
        {
          height: 1,
          backgroundColor: colors.border,
          width: "100%",
        },
        style,
      ]}
    />
  );
}
