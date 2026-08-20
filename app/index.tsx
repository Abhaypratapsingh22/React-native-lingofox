import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const router = useRouter();

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
          onPress={() => router.push("/(auth)/onboarding" as any)}
          activeOpacity={0.85}
          className="w-full max-w-xs bg-brand-blue h-14 rounded-2xl items-center justify-center"
        >
          <Text className="text-white font-poppins-semibold text-lg">
            Open Onboarding
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
