import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { lightColors, darkColors } from "./colors";

const ThemeContext = createContext({
    isDark: true,
    colors: darkColors,
    setTheme: () => { },
});

export function ThemeProvider({ children }) {
    const systemScheme = useColorScheme();

    // 'system', 'light', or 'dark'
    const [themeMode, setThemeMode] = useState("system");
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        if (themeMode === "system") {
            setIsDark(systemScheme === "dark");
        } else {
            setIsDark(themeMode === "dark");
        }
    }, [themeMode, systemScheme]);

    const activeColors = isDark ? darkColors : lightColors;

    return (
        <ThemeContext.Provider value={{ isDark, colors: activeColors, setTheme: setThemeMode, themeMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
