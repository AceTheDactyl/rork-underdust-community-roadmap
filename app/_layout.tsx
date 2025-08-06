import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { RoadmapProvider } from "@/hooks/useRoadmap";
import { Colors } from "@/constants/colors";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack 
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'fade_from_bottom',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="pillar/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="project/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="values" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <RoadmapProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar style="light" />
          <RootLayoutNav />
        </GestureHandlerRootView>
      </RoadmapProvider>
    </QueryClientProvider>
  );
}