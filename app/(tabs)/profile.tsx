import { useAuth, useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import { Image, Text, TouchableOpacity, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLanguageStore } from "@/store/useLanguageStore";
import { languages } from "@/data/languages";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const selectedLanguageId = useLanguageStore((state) => state.selectedLanguageId);
  const setSelectedLanguageId = useLanguageStore((state) => state.setSelectedLanguageId);

  const selectedLanguage = languages.find((lang) => lang.id === selectedLanguageId);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.warn("Sign out error:", error);
    }
  };

  const handleClearLanguage = async () => {
    try {
      await AsyncStorage.removeItem("lingofox-language-storage");
      setSelectedLanguageId(null);
    } catch (error) {
      console.warn("Clear storage error:", error);
    }
  };

  // User details fallback
  const displayName = user?.firstName || user?.fullName || "LingoFox Learner";
  const emailAddress = user?.primaryEmailAddress?.emailAddress || "";
  const userAvatar = user?.imageUrl;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View className="items-center px-6 pt-8 pb-6 border-b border-gray-100">
          <View className="w-24 h-24 rounded-full bg-blue-50 items-center justify-center overflow-hidden border-2 border-brand-blue/20 mb-4 shadow-sm">
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} className="w-full h-full" />
            ) : (
              <Ionicons name="person" size={48} color="#0066ff" />
            )}
          </View>
          <Text className="font-poppins-bold text-2xl text-text-primary text-center">
            {displayName}
          </Text>
          {emailAddress ? (
            <Text className="font-poppins text-sm text-text-secondary text-center mt-1">
              {emailAddress}
            </Text>
          ) : null}
        </View>

        {/* Selected Language Section */}
        <View className="px-6 py-6 border-b border-gray-100">
          <Text className="font-poppins-semibold text-lg text-text-primary mb-4">
            Learning Language
          </Text>
          {selectedLanguage ? (
            <View className="flex-row items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <View className="w-12 h-12 bg-white rounded-xl items-center justify-center border border-gray-100 shadow-sm mr-4">
                <Text className="text-2xl">{selectedLanguage.flagEmoji}</Text>
              </View>
              <View className="flex-1">
                <Text className="font-poppins-bold text-base text-text-primary">
                  {selectedLanguage.name}
                </Text>
                <Text className="font-poppins text-xs text-text-secondary mt-0.5">
                  {selectedLanguage.nativeName}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push("/language-selection")}
                activeOpacity={0.7}
                className="px-4 py-2 bg-blue-50 rounded-xl"
              >
                <Text className="text-brand-blue font-poppins-semibold text-xs">
                  Change
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => router.push("/language-selection")}
              className="flex-row items-center justify-center p-4 border border-dashed border-gray-300 rounded-2xl"
            >
              <Ionicons name="add-circle-outline" size={20} color="#0066ff" className="mr-2" />
              <Text className="text-brand-blue font-poppins-semibold text-sm">
                Select a Language
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Actions Section */}
        <View className="px-6 py-6 gap-y-4">
          <Text className="font-poppins-semibold text-lg text-text-primary mb-2">
            Account Options
          </Text>

          <TouchableOpacity
            onPress={handleSignOut}
            activeOpacity={0.85}
            className="w-full flex-row items-center px-4 h-14 border border-gray-100 rounded-2xl bg-white shadow-sm"
          >
            <View className="w-10 h-10 rounded-xl bg-gray-50 items-center justify-center mr-3">
              <Ionicons name="log-out-outline" size={20} color="#687280" />
            </View>
            <Text className="flex-1 text-text-primary font-poppins-semibold text-base">
              Sign Out
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          {__DEV__ && (
            <TouchableOpacity
              onPress={handleClearLanguage}
              activeOpacity={0.85}
              className="w-full flex-row items-center px-4 h-14 border border-red-100 rounded-2xl bg-red-50/10 shadow-sm"
            >
              <View className="w-10 h-10 rounded-xl bg-red-50 items-center justify-center mr-3">
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </View>
              <Text className="flex-1 text-red-600 font-poppins-semibold text-base">
                Clear Selected Language
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
