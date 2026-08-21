import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "../global.css";
import { fonts } from "../theme/tokens";
import { useLanguageStore } from "../store/useLanguageStore";

void SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env file. Get it from the Clerk Dashboard."
  );
}

function InitialLayout({ fontsLoaded, fontsError }: { fontsLoaded: boolean; fontsError: any }) {
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const segments = useSegments() as string[];
  const router = useRouter();
  const hasHydrated = useLanguageStore((state) => state.hasHydrated);
  const selectedLanguageId = useLanguageStore((state) => state.selectedLanguageId);

  useEffect(() => {
    // Wait for fonts, Clerk, and Zustand storage to be fully loaded
    if (!fontsLoaded && !fontsError) return;
    if (!isAuthLoaded || !hasHydrated) return;

    // Hide splash screen when ready
    void SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === "(auth)";
    const onLanguageSelection = segments[0] === "language-selection";
    const isAtRoot = segments.length === 0 || !segments[0];

    if (!isSignedIn) {
      // Unauthenticated users -> /onboarding
      if (!inAuthGroup) {
        router.replace("/(auth)/onboarding");
      }
    } else {
      // Authenticated users
      if (!selectedLanguageId) {
        // Without language selection -> /language-selection
        if (!onLanguageSelection) {
          router.replace("/language-selection");
        }
      } else {
        // With language selection -> /home (if in auth group or at root)
        if (inAuthGroup || isAtRoot) {
          router.replace("/home" as any);
        }
      }
    }
  }, [fontsLoaded, fontsError, isAuthLoaded, hasHydrated, isSignedIn, selectedLanguageId, segments, router]);

  // Keep showing splash or render nothing until everything is loaded and we did the initial routing checks
  const isReady = (fontsLoaded || fontsError) && isAuthLoaded && hasHydrated;
  if (!isReady) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts(fonts);

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <InitialLayout fontsLoaded={loaded} fontsError={error} />
    </ClerkProvider>
  );
}

