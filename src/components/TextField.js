import React, { useMemo, useState } from "react";
import { View, Text, TextInput } from "react-native";
import { useTheme, radius, spacing, typography } from "../theme";
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

  // animated placeholder
  tickerPlaceholderItems,
  tickerPlaceholderIntervalMs = 1500,
}) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const showTicker = useMemo(() => {
    const empty = value == null || String(value).length === 0;
    return empty && Array.isArray(tickerPlaceholderItems) && tickerPlaceholderItems.length > 0;
  }, [value, tickerPlaceholderItems]);

  const borderColor = error
    ? colors.danger
    : focused
      ? colors.primary
      : colors.border;

  const shadowColor = focused ? colors.primary : "transparent";

  return (
    <View style={{ gap: 7 }}>
      {!!label && (
        <Text style={[typography.label, { color: colors.text2 }]}>{label}</Text>
      )}

      <View
        style={{
          backgroundColor: colors.card2,
          borderRadius: radius.lg,
          borderWidth: 1.5,
          borderColor,
          position: "relative",
        }}
      >
        {/* Animated placeholder overlay */}
        {showTicker ? (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: spacing.md,
              right: spacing.md,
              top: multiline ? spacing.md : 13,
              opacity: 0.7,
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
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            typography.body,
            {
              color: colors.text,
              paddingHorizontal: spacing.md,
              paddingVertical: multiline ? spacing.md : 13,
              margin: 0
            },
            multiline ? { minHeight: 90, textAlignVertical: "top" } : { minHeight: 50 },
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
