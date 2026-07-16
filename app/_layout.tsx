import "react-native-reanimated";
import React, { useEffect } from "react";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useColorScheme, Alert } from "react-native";
import { useNetworkState } from "expo-network";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getColors } from "@/constants/Colors";

const DevErrorBoundary = __DEV__
  ? ErrorBoundary
  : ({ children }: { children: React.ReactNode }) => <>{children}</>;

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "index",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const dark = colorScheme === "dark";
  const C = getColors(dark);
  const networkState = useNetworkState();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  React.useEffect(() => {
    if (
      !networkState.isConnected &&
      networkState.isInternetReachable === false
    ) {
      Alert.alert(
        "You are offline",
        "You can keep using the app. Changes will sync when you reconnect."
      );
    }
  }, [networkState.isConnected, networkState.isInternetReachable]);

  const CustomDefaultTheme: Theme = {
    ...DefaultTheme,
    dark: false,
    colors: {
      primary: "#1B3A5C",
      background: "#F8F9FB",
      card: "#FFFFFF",
      text: "#0F1C2E",
      border: "rgba(27, 58, 92, 0.10)",
      notification: "#DC2626",
    },
  };

  const CustomDarkTheme: Theme = {
    ...DarkTheme,
    colors: {
      primary: "#4A8FCC",
      background: "#0A1520",
      card: "#111E2E",
      text: "#E8F0F8",
      border: "rgba(255, 255, 255, 0.08)",
      notification: "#EF4444",
    },
  };

  return (
    <DevErrorBoundary>
      <StatusBar style="auto" animated />
      <ThemeProvider value={dark ? CustomDarkTheme : CustomDefaultTheme}>
        <SafeAreaProvider>
          <AuthProvider>
            <WidgetProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <Stack>
                  <Stack.Screen name="index" options={{ headerShown: false, animation: 'none' }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="auth" options={{ headerShown: false }} />
                  <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="job/new"
                    options={{
                      title: "New Job",
                      presentation: "modal",
                      headerStyle: { backgroundColor: C.surface },
                      headerTintColor: C.primary,
                      headerTitleStyle: { color: C.text, fontWeight: '600' },
                    }}
                  />
                  <Stack.Screen
                    name="job/[id]"
                    options={{
                      title: "Job Detail",
                      headerStyle: { backgroundColor: C.surface },
                      headerTintColor: C.primary,
                      headerTitleStyle: { color: C.text, fontWeight: '600' },
                      headerBackButtonDisplayMode: 'minimal',
                    }}
                  />
                  <Stack.Screen
                    name="checklist/[jobId]"
                    options={{
                      title: "Safety Checklist",
                      headerStyle: { backgroundColor: C.surface },
                      headerTintColor: C.primary,
                      headerTitleStyle: { color: C.text, fontWeight: '600' },
                      headerBackButtonDisplayMode: 'minimal',
                    }}
                  />
                  <Stack.Screen
                    name="photos/[jobId]"
                    options={{
                      title: "Photo Log",
                      headerStyle: { backgroundColor: C.surface },
                      headerTintColor: C.primary,
                      headerTitleStyle: { color: C.text, fontWeight: '600' },
                      headerBackButtonDisplayMode: 'minimal',
                    }}
                  />
                  <Stack.Screen
                    name="signoff/[jobId]"
                    options={{
                      title: "Digital Sign-Off",
                      headerStyle: { backgroundColor: C.surface },
                      headerTintColor: C.primary,
                      headerTitleStyle: { color: C.text, fontWeight: '600' },
                      headerBackButtonDisplayMode: 'minimal',
                    }}
                  />
                </Stack>
                <SystemBars style={"auto"} />
              </GestureHandlerRootView>
            </WidgetProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </DevErrorBoundary>
  );
}
