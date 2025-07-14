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

// Color Blind Friendly Themes - Dễ phân biệt cho người mù màu
export const lightColorBlindTheme: Theme = {
  background: '#FFFFFF',
  backgroundSecondary: '#F8F9FA',
  surface: '#E9ECEF',
  primary: '#0077BB',    // Xanh dương đậm - dễ phân biệt
  accent: '#EE7733',     // Cam - dễ phân biệt
  error: '#DD4477',      // Hồng đậm - dễ phân biệt
  warning: '#FFB347',    // Cam nhạt - dễ phân biệt
  success: '#009988',    // Xanh lá đậm - dễ phân biệt
  text: '#2C3E50',       // Xanh đen - dễ đọc
  textSecondary: '#5D6D7E', // Xám đậm - dễ đọc
  placeholder: '#85929E',   // Xám nhạt - dễ phân biệt
  black: '#000000',
  white: '#FFFFFF',
  gradient: ['#FFFFFF', '#F8F9FA'],
};

export const darkColorBlindTheme: Theme = {
  background: '#1A1A1A',
  backgroundSecondary: '#2D2D2D',
  surface: '#404040',
  primary: '#4A90E2',    // Xanh dương sáng - dễ phân biệt
  accent: '#F39C12',     // Cam sáng - dễ phân biệt
  error: '#E74C3C',      // Đỏ sáng - dễ phân biệt
  warning: '#F1C40F',    // Vàng sáng - dễ phân biệt
  success: '#27AE60',    // Xanh lá sáng - dễ phân biệt
  text: '#FFFFFF',
  textSecondary: '#BDC3C7', // Xám sáng - dễ đọc
  placeholder: '#95A5A6',   // Xám nhạt - dễ phân biệt
  black: '#000000',
  white: '#FFFFFF',
  gradient: ['#1A1A1A', '#2D2D2D'],
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

export const themes: { [key in 'lightColorBlind' | 'darkColorBlind' | 'special']: Theme } = {
  lightColorBlind: lightColorBlindTheme,
  darkColorBlind: darkColorBlindTheme,
  special: specialTheme,
};

export const ThemeContext = createContext<{
  theme: Theme;
  themeName: 'lightColorBlind' | 'darkColorBlind' | 'special';
  setThemeName: (name: 'lightColorBlind' | 'darkColorBlind' | 'special') => void;
}>({
  theme: themes.darkColorBlind,
  themeName: 'darkColorBlind',
  setThemeName: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export default function RootLayout() {
  const [themeName, setThemeName] = useState<'lightColorBlind' | 'darkColorBlind' | 'special'>('darkColorBlind');
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
