import { Color } from "@/utils/Color";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Tabs } from "expo-router";
import { StatusBar } from "react-native";

export default function RootLayout() {
  return (
    <>
      <StatusBar backgroundColor={Color.background} translucent={false} />
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
          headerTitleAlign: "center",
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
    </>
  );
}
