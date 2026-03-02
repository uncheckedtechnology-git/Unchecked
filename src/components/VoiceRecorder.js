import React, { useState, useEffect } from "react";
import { View, Text, Pressable, Animated } from "react-native";
import { Audio } from "expo-av";
import { colors, useTheme, radius, spacing, typography, shadow } from "../theme";
import * as Haptics from "expo-haptics";

export default function VoiceRecorder({ onRecordComplete, maxDurationMs = 15000 }) {
    const { colors } = useTheme();
    const [recording, setRecording] = useState(null);
    const [permissionResponse, requestPermission] = Audio.usePermissions();
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);

    // Animation values
    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    useEffect(() => {
        let timer;
        if (isRecording) {
            timer = setInterval(() => {
                setDuration((d) => {
                    if (d >= maxDurationMs) {
                        stopRecording();
                        return d;
                    }
                    return d + 1000;
                });
            }, 1000);

            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
        return () => clearInterval(timer);
    }, [isRecording]);

    async function startRecording() {
        try {
            if (permissionResponse.status !== 'granted') {
                const resp = await requestPermission();
                if (resp.status !== 'granted') return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(recording);
            setDuration(0);
            setIsRecording(true);
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    }

    async function stopRecording() {
        if (!recording) return;
        setIsRecording(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        await recording.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

        const uri = recording.getURI();
        setRecording(null);
        if (onRecordComplete && uri) {
            onRecordComplete(uri, duration);
        }
    }

    const formatTime = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    return (
        <View style={{ alignItems: "center", justifyContent: "center", padding: spacing.md }}>
            {isRecording && (
                <Text style={[typography.h3, { color: colors.primary, marginBottom: spacing.md }]}>
                    {formatTime(duration)} / {formatTime(maxDurationMs)}
                </Text>
            )}

            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Pressable
                    onPressIn={startRecording}
                    onPressOut={stopRecording}
                    delayLongPress={150}
                    style={({ pressed }) => [
                        {
                            width: 80,
                            height: 80,
                            borderRadius: 40,
                            backgroundColor: isRecording ? colors.primary : colors.card2,
                            borderWidth: 2,
                            borderColor: isRecording ? colors.primary2 : colors.border,
                            alignItems: "center",
                            justifyContent: "center",
                        },
                        isRecording ? shadow.glow : null
                    ]}
                >
                    <Text style={{ fontSize: 32 }}>{isRecording ? "🎙️" : "🎤"}</Text>
                </Pressable>
            </Animated.View>

            <Text style={[typography.small, { color: colors.text2, marginTop: spacing.md }]}>
                {isRecording ? "Release to Send" : "Hold to Record Voice Note"}
            </Text>
        </View>
    );
}
