import { Tabs } from "expo-router";
import { Code, Compass, Home, Info } from "lucide-react-native";
import React from "react";
import { Colors } from "@/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="roadmap"
        options={{
          title: "Roadmap",
          tabBarIcon: ({ color }) => <Compass color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: "Projects",
          tabBarIcon: ({ color }) => <Code color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: "About",
          tabBarIcon: ({ color }) => <Info color={color} size={22} />,
        }}
      />
    </Tabs>
  );
}