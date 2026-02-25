// src/components/SliderRow.js
import React from "react";
import { View, Text } from "react-native";
import Slider from "@react-native-community/slider";
import { colors, spacing, typography } from "../theme";

export default function SliderRow({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  hint,
}) {
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={[typography.body, { color: colors.text }]}>{label}</Text>
        <Text style={[typography.body, { color: colors.text }]}>{value}</Text>
      </View>

      <Slider
        value={value}
        onValueChange={onChange}
        minimumValue={min}
        maximumValue={max}
        step={step}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.primary2}
        style={{ height: 36 }}
      />

      {!!hint && (
        <Text style={[typography.tiny, { color: colors.text2 }]}>{hint}</Text>
      )}
    </View>
  );
}
