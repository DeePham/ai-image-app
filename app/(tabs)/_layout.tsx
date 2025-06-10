import { getCurrentUser, signOut } from "@/utils/auth";
import { Color } from "@/utils/Color";
import { supabase } from "@/utils/supabase";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Tabs, router } from "expo-router";
import { useEffect, useState } from "react";
import { StatusBar, TouchableOpacity } from "react-native";

export default function TabLayout() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    checkUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/auth/login");
  };

  return (
    <>
      <StatusBar backgroundColor={Color.background} translucent={false} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Color.primary,
          tabBarInactiveTintColor: Color.placeholder,
          tabBarStyle: {
            backgroundColor: Color.background,
            borderTopColor: Color.backgroundSecondary,
            borderTopWidth: 1,
          },
          headerStyle: {
            backgroundColor: Color.background,
          },
          headerTitleStyle: {
            color: Color.text,
            fontSize: 18,
            fontWeight: "600",
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
            headerRight: () =>
              user && (
                <TouchableOpacity
                  onPress={handleSignOut}
                  style={{ marginRight: 16, padding: 8 }}
                >
                  <FontAwesome5
                    name="sign-out-alt"
                    size={20}
                    color={Color.textSecondary}
                  />
                </TouchableOpacity>
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
            headerRight: () =>
              user && (
                <TouchableOpacity
                  onPress={handleSignOut}
                  style={{ marginRight: 16, padding: 8 }}
                >
                  <FontAwesome5
                    name="sign-out-alt"
                    size={20}
                    color={Color.textSecondary}
                  />
                </TouchableOpacity>
              ),
          }}
        />
      </Tabs>
    </>
  );
}
