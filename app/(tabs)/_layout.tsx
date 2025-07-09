import { useTheme } from "@/app/_layout";
import AuthGuard from "@/components/AuthGuard";
import { AuthService } from "@/services/authService";
import { supabase } from "@/utils/supabase";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs, router } from "expo-router";
import { useEffect, useState } from "react";
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Toast from 'react-native-toast-message';

const createStyles = (theme: any) => StyleSheet.create({
  // ... migrate all MainColor usages to theme
});

function GradientHeader({ title, right, theme, themeName }: { title: string, right?: React.ReactNode, theme: any, themeName: string }) {
  if (themeName === 'special') {
    return (
      <LinearGradient
        colors={theme.gradient as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: 40, paddingBottom: 16, paddingHorizontal: 16 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: '600' }}>{title}</Text>
          {right}
        </View>
      </LinearGradient>
    );
  }
  return (
    <View style={{ backgroundColor: theme.background, paddingTop: 40, paddingBottom: 16, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: theme.text, fontSize: 18, fontWeight: '600' }}>{title}</Text>
        {right}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { theme, themeName } = useTheme();
  const styles = createStyles(theme);
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
      <StatusBar backgroundColor={theme.background} translucent={false} />
      {themeName === 'special' ? (
        <LinearGradient
          colors={theme.gradient as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        >
          <Tabs
            screenOptions={{
              tabBarActiveTintColor: theme.primary,
              tabBarInactiveTintColor: theme.placeholder,
              tabBarStyle: {
                backgroundColor: 'transparent',
                borderTopColor: 'transparent',
                borderTopWidth: 1,
              },
              header: (props) => (
                <GradientHeader
                  title={props.options.title as string || props.route.name}
                  right={typeof props.options.headerRight === 'function' ? props.options.headerRight({ canGoBack: false }) : null}
                  theme={theme}
                  themeName={themeName}
                />
              ),
              headerTitle: '', // Remove default title
              headerStyle: {
                backgroundColor: 'transparent',
              },
              headerTitleStyle: {
                color: theme.text,
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
                        color={theme.textSecondary}
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
                        color={theme.textSecondary}
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
                        color={theme.textSecondary}
                      />
                    </TouchableOpacity>
                  ),
              }}
            />
          </Tabs>
          <Toast />
        </LinearGradient>
      ) : (
        <>
          <Tabs
            screenOptions={{
              tabBarActiveTintColor: theme.primary,
              tabBarInactiveTintColor: theme.placeholder,
              tabBarStyle: {
                backgroundColor: theme.background,
                borderTopColor: theme.backgroundSecondary,
                borderTopWidth: 1,
              },
              header: (props) => (
                <GradientHeader
                  title={props.options.title as string || props.route.name}
                  right={typeof props.options.headerRight === 'function' ? props.options.headerRight({ canGoBack: false }) : null}
                  theme={theme}
                  themeName={themeName}
                />
              ),
              headerTitle: '', // Remove default title
              headerStyle: {
                backgroundColor: theme.background,
              },
              headerTitleStyle: {
                color: theme.text,
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
                        color={theme.textSecondary}
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
                        color={theme.textSecondary}
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
                        color={theme.textSecondary}
                      />
                    </TouchableOpacity>
                  ),
              }}
            />
          </Tabs>
          <Toast />
        </>
      )}
    </AuthGuard>
  );
}
