import { useAuth } from "@clerk/expo";
import { Redirect, useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const { isSignedIn, isLoaded, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/(auth)/onboarding");
    } catch (error) {
      console.warn("Sign out error:", error);
    }
  };

  // Wait for Clerk to restore session
  if (!isLoaded) return null;

  // Not authenticated — redirect to onboarding
  if (!isSignedIn) return <Redirect href="/(auth)/onboarding" />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <View className="flex-1 items-center justify-center px-6">
        <Text className="font-poppins-bold text-3xl text-text-primary text-center">
          Welcome to LingoFox!
        </Text>
        <Text className="font-poppins text-base text-text-secondary text-center mt-2 mb-8">
          The wait is almost over!
        </Text>

        <TouchableOpacity
          onPress={() => router.push("/language-selection")}
          activeOpacity={0.85}
          className="w-full max-w-xs bg-brand-blue h-14 rounded-2xl items-center justify-center mb-4"
        >
          <Text className="text-white font-poppins-semibold text-lg">
            Select Language
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSignOut}
          activeOpacity={0.85}
          className="w-full max-w-xs border border-gray-200 h-14 rounded-2xl items-center justify-center"
        >
          <Text className="text-text-secondary font-poppins-semibold text-lg">
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
