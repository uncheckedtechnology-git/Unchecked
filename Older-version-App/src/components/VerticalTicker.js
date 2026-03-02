// src/components/VerticalTicker.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";
import { typography, colors } from "../theme";

/**
 * Vertical ticker: cycles strings top->bottom smoothly.
 * No external deps. Very stable.
 */
export default function VerticalTicker({
  items = [],
  height = 20,
  intervalMs = 1800,
  style,
  textStyle,
}) {
  const safe = useMemo(() => (Array.isArray(items) ? items.filter(Boolean) : []), [items]);
  const [idx, setIdx] = useState(0);

  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (safe.length <= 1) return;

    const t = setInterval(() => {
      anim.setValue(-height);
      Animated.timing(anim, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      setIdx((p) => (p + 1) % safe.length);
    }, intervalMs);

    return () => clearInterval(t);
  }, [safe.length, intervalMs, height, anim]);

  if (!safe.length) return null;

  const current = safe[idx];

  return (
    <View style={[{ height, overflow: "hidden" }, style]}>
      <Animated.View style={{ transform: [{ translateY: anim }] }}>
        <Text
          numberOfLines={1}
          style={[
            typography.small,
            { color: colors.text2, lineHeight: height },
            textStyle,
          ]}
        >
          {current}
        </Text>
      </Animated.View>
    </View>
  );
}
