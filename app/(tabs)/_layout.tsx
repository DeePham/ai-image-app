import AuthGuard from "@/components/AuthGuard";
import { MainColor } from "@/constants/MainColor";
import { AuthService } from "@/services/authService";
import { supabase } from "@/utils/supabase";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Tabs, router } from "expo-router";
import { useEffect, useState } from "react";
import { StatusBar, TouchableOpacity } from "react-native";
import Toast from 'react-native-toast-message';

export default function TabLayout() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    checkUser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const currentUser = await AuthService.getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  };

  const handleSignOut = async () => {
    await AuthService.signOut();
    router.replace("/auth/login");
  };

  return (
    <AuthGuard>
      <StatusBar backgroundColor={MainColor.background} translucent={false} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: MainColor.primary,
          tabBarInactiveTintColor: MainColor.placeholder,
          tabBarStyle: {
            backgroundColor: MainColor.background,
            borderTopColor: MainColor.backgroundSecondary,
            borderTopWidth: 1,
          },
          headerStyle: {
            backgroundColor: MainColor.background,
          },
          headerTitleStyle: {
            color: MainColor.text,
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
                    color={MainColor.textSecondary}
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
                    color={MainColor.textSecondary}
                  />
                </TouchableOpacity>
              ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <FontAwesome5 name="user" size={size} color={color} />
            ),
            headerRight: () =>
              user && (
                <TouchableOpacity
                  onPress={handleSignOut}
                  style={{ marginRight: 16, padding: 8 }}
                >
                  <FontAwesome5
                    name="sign-out-alt"
                    size={18}
                    color={MainColor.textSecondary}
                  />
                </TouchableOpacity>
              ),
          }}
        />
      </Tabs>
      <Toast />
    </AuthGuard>
  );
}
