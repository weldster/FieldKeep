import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter, useSegments } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "react-native";
import { getColors } from "@/constants/Colors";

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const colorScheme = useColorScheme();
  const dark = colorScheme === "dark";
  const C = getColors(dark);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup =
      segments[0] === "auth" || segments[0] === "auth-callback";

    if (!user && !inAuthGroup) {
      console.log("[AuthGuard] No user, redirecting to /auth");
      router.replace("/auth" as never);
    } else if (user) {
      console.log("[AuthGuard] User authenticated, redirecting to /(tabs)");
      router.replace("/(tabs)" as never);
    }
  }, [user, loading, segments, router]);

  return (
    <View
      style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.background }}
    >
      <ActivityIndicator size="large" color={C.primary} />
    </View>
  );
}
