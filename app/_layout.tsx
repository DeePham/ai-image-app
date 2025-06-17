import { MainColor } from "@/constants/MainColor";
import { Stack } from "expo-router";
import React from 'react';
import { StatusBar } from "react-native";
import Toast from 'react-native-toast-message';

export default function RootLayout() {
  return (
    <>
      <StatusBar backgroundColor={MainColor.background} translucent={false} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/register" options={{ headerShown: false }} />
        <Stack.Screen name="index" redirect={true} />
      </Stack>
      <Toast />
    </>
  );
}
