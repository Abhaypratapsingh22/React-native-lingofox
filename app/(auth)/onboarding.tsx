import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { images } from "@/constants/images";

export default function OnboardingScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    // Navigates to home or next step (Sign up screen in future prompts)
    router.push("/");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <View className="flex-1 justify-between px-6 pt-2 pb-6">
        {/* Top Header Logo */}
        <View className="flex-row items-center justify-center gap-2.5 pt-2">
          <Image
            source={images.mascotLogo}
            className="w-10 h-10"
            resizeMode="contain"
          />
          <Text className="font-poppins-bold text-[28px] text-text-primary tracking-tight">
            Lingo<Text className="text-brand-blue">Fox</Text>
          </Text>
        </View>

        {/* Content Section: Headline & Subtitle */}
        <View className="mt-6">
          <Text className="font-poppins-bold text-[32px] leading-[40px] text-text-primary">
            Your AI language{"\n"}
            <Text className="text-brand-blue">teacher</Text>.
          </Text>
          <Text className="font-poppins text-base leading-6 text-text-secondary mt-3">
            Real conversations, personalized{"\n"}lessons, anytime, anywhere.
          </Text>
        </View>

        {/* Hero Mascot Illustration with Floating Speech Bubbles */}
        <View className="flex-1 items-center justify-center relative my-4">
          <Image
            source={images.mascotWelcome}
            className="w-72 h-72"
            resizeMode="contain"
          />

          {/* Speech Bubble 1 - Hello! (Top Left) */}
          <View
            className="absolute top-6 left-1 bg-[#E8F4FD] px-4 py-2 rounded-2xl shadow-sm"
            style={{
              shadowColor: "#0066FF",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Text className="font-poppins-bold text-base text-text-primary">
              Hello!
            </Text>
          </View>

          {/* Speech Bubble 2 - ¡Hola! (Top Right) */}
          <View
            className="absolute top-2 right-4 bg-[#F3E8FF] px-4 py-2 rounded-2xl shadow-sm"
            style={{
              shadowColor: "#7C3AED",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Text className="font-poppins-bold text-base text-[#7C3AED]">
              ¡Hola!
            </Text>
          </View>

          {/* Speech Bubble 3 - 你好! (Mid/Bottom Right) */}
          <View
            className="absolute bottom-16 right-0 bg-[#FFF0ED] px-4 py-2 rounded-2xl shadow-sm"
            style={{
              shadowColor: "#FF7E75",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Text className="font-poppins-bold text-base text-brand-coral">
              你好!
            </Text>
          </View>
        </View>

        {/* Bottom CTA Button */}
        <View className="w-full">
          <TouchableOpacity
            onPress={handleGetStarted}
            activeOpacity={0.85}
            className="w-full bg-brand-blue h-14 rounded-2xl flex-row items-center justify-center relative"
          >
            <Text className="text-white font-poppins-semibold text-lg">
              Get Started
            </Text>
            <Ionicons
              name="chevron-forward"
              size={22}
              color="#FFFFFF"
              style={{ position: "absolute", right: 20 }}
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
