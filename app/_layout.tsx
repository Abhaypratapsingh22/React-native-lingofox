import { ClerkProvider, useAuth, useUser } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { useFonts } from "expo-font";
import { Stack, usePathname, useGlobalSearchParams, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import "../global.css";
import { fonts } from "../theme/tokens";
import { useLanguageStore } from "../store/useLanguageStore";
import { useProgressStore } from "../store/useProgressStore";
import { PostHogProvider } from "posthog-react-native";
import { posthog } from "../config/posthog";

void SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env file. Get it from the Clerk Dashboard."
  );
}

function InitialLayout({ fontsLoaded, fontsError }: { fontsLoaded: boolean; fontsError: any }) {
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const { user } = useUser();
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const previousPathname = useRef<string | undefined>(undefined);

  // Identify authenticated users in PostHog
  useEffect(() => {
    if (isSignedIn && user) {
      posthog.identify(user.id, {
        $set: {
          email: user.primaryEmailAddress?.emailAddress ?? null,
          name: user.fullName ?? user.firstName ?? null,
        },
        $set_once: {
          first_seen_at: new Date().toISOString(),
        },
      });
    } else if (isAuthLoaded && !isSignedIn) {
      posthog.reset();
    }
  }, [isSignedIn, user, isAuthLoaded]);

  // Scope progress store to Clerk user ID
  const progressHydrated = useProgressStore((s) => s.hasHydrated);
  useEffect(() => {
    if (isAuthLoaded && progressHydrated) {
      if (isSignedIn && user?.id) {
        useProgressStore.getState().setUserId(user.id);
      } else {
        useProgressStore.getState().setUserId(null);
      }
    }
  }, [isSignedIn, user?.id, isAuthLoaded, progressHydrated]);

  // Manual screen tracking for Expo Router
  useEffect(() => {
    if (previousPathname.current !== pathname) {
      posthog.screen(pathname, {
        previous_screen: previousPathname.current ?? null,
        ...params,
      });
      previousPathname.current = pathname;
    }
  }, [pathname, params]);
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
      <PostHogProvider
        client={posthog}
        autocapture={{
          captureScreens: false, // Manual screen tracking via usePathname
          captureTouches: true,
          propsToCapture: ["testID"],
        }}
      >
        <InitialLayout fontsLoaded={loaded} fontsError={error} />
      </PostHogProvider>
    </ClerkProvider>
  );
}

