import { Color } from "@/utils/Color";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Tabs } from "expo-router";

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Color.accent,
        tabBarInactiveTintColor: Color.placeholder,
        tabBarStyle: {
          backgroundColor: Color.background,
          borderTopColor: Color.accent,
        },
        headerStyle: {
          backgroundColor: Color.background,
        },
        headerTitleStyle: {
          color: Color.text,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Generate",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="magic" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="history" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
