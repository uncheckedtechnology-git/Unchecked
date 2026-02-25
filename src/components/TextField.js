// src/components/TextField.js
import React, { useMemo } from "react";
import { View, Text, TextInput } from "react-native";
import { colors, radius, spacing, typography } from "../theme";
import VerticalTicker from "./VerticalTicker";

export default function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  maxLength,
  autoCapitalize = "none",
  secureTextEntry,
  multiline,
  helper,
  error,

  // ✅ NEW (optional)
  tickerPlaceholderItems,
  tickerPlaceholderIntervalMs = 1500,
}) {
  const showTicker = useMemo(() => {
    const empty = value == null || String(value).length === 0;
    return empty && Array.isArray(tickerPlaceholderItems) && tickerPlaceholderItems.length > 0;
  }, [value, tickerPlaceholderItems]);

  return (
    <View style={{ gap: 8 }}>
      {!!label && (
        <Text style={[typography.small, { color: colors.text2 }]}>{label}</Text>
      )}

      <View
        style={{
          backgroundColor: colors.card2,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: error ? colors.danger : colors.border,
          paddingHorizontal: spacing.md,
          paddingVertical: multiline ? spacing.md : 12,
          position: "relative",
        }}
      >
        {/* ✅ Animated placeholder overlay */}
        {showTicker ? (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: spacing.md,
              right: spacing.md,
              top: multiline ? spacing.md : 12,
              opacity: 0.85,
            }}
          >
            <VerticalTicker
              items={tickerPlaceholderItems}
              height={20}
              intervalMs={tickerPlaceholderIntervalMs}
              textStyle={[typography.body, { color: colors.muted }]}
            />
          </View>
        ) : null}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={showTicker ? "" : placeholder}
          placeholderTextColor={colors.muted}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          style={[
            typography.body,
            { color: colors.text, padding: 0, margin: 0 },
            multiline ? { minHeight: 90, textAlignVertical: "top" } : null,
          ]}
        />
      </View>

      {!!error ? (
        <Text style={[typography.tiny, { color: colors.danger }]}>{error}</Text>
      ) : !!helper ? (
        <Text style={[typography.tiny, { color: colors.text2 }]}>{helper}</Text>
      ) : null}
    </View>
  );
}
