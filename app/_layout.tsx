import { createToastConfig } from "@/components/ToastConfig";
import { Stack } from "expo-router";
import React, { createContext, useContext, useState } from "react";
import { StatusBar } from "react-native";
import Toast from "react-native-toast-message";

export type Theme = {
  background: string;
  backgroundSecondary: string;
  surface: string;
  primary: string;
  accent: string;
  error: string;
  warning: string;
  success: string;
  text: string;
  textSecondary: string;
  placeholder: string;
  black: string;
  white: string;
  gradient: string[];
};

export const lightTheme: Theme = {
  background: '#FFFFFF',
  backgroundSecondary: '#F5F5F5',
  surface: '#F0F0F0',
  primary: '#007AFF',
  accent: '#FF4081',
  error: '#FF3B30',
  warning: '#FFD600',
  success: '#4CD964',
  text: '#222222',
  textSecondary: '#666666',
  placeholder: '#B0B0B0',
  black: '#000000',
  white: '#FFFFFF',
  gradient: ['#FFFFFF', '#F5F5F5'],
};

export const darkTheme: Theme = {
  background: '#181A20',
  backgroundSecondary: '#23262F',
  surface: '#23262F',
  primary: '#007AFF',
  accent: '#FF4081',
  error: '#FF3B30',
  warning: '#FFD600',
  success: '#4CD964',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  placeholder: '#666666',
  black: '#000000',
  white: '#FFFFFF',
  gradient: ['#23262F', '#181A20'],
};

export const specialTheme: Theme = {
  background: 'transparent', // will use gradient
  backgroundSecondary: 'transparent',
  surface: 'rgba(255,255,255,0.1)',
  primary: '#2196F3', // blue
  accent: '#00B8D4', // cyan accent
  error: '#FF3B30',
  warning: '#FFD600',
  success: '#4CD964',
  text: '#FFFFFF',
  textSecondary: '#B3E5FC', // light blue
  placeholder: '#90CAF9', // blue-grey
  black: '#000000',
  white: '#FFFFFF',
  gradient: ['#0d47a1', '#1976d2', '#42a5f5', '#7b1fa2'], // deep blue to light blue to purple
};

export const themes: { [key in 'light' | 'dark' | 'special']: Theme } = {
  light: lightTheme,
  dark: darkTheme,
  special: specialTheme,
};

export const ThemeContext = createContext<{
  theme: Theme;
  themeName: 'light' | 'dark' | 'special';
  setThemeName: (name: 'light' | 'dark' | 'special') => void;
}>({
  theme: themes.dark,
  themeName: 'dark',
  setThemeName: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export default function RootLayout() {
  const [themeName, setThemeName] = useState<'light' | 'dark' | 'special'>('dark');
  const theme = themes[themeName];

  return (
    <ThemeContext.Provider value={{ theme, themeName, setThemeName }}>
      <>
        <StatusBar backgroundColor={theme.background} translucent={false} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth/login" options={{ headerShown: false }} />
          <Stack.Screen name="auth/register" options={{ headerShown: false }} />
          <Stack.Screen name="index" redirect={true} />
        </Stack>
        <Toast config={createToastConfig(theme)} />
      </>
    </ThemeContext.Provider>
  );
}
