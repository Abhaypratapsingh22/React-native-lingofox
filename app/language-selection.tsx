import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { languages } from "@/data/languages";
import { images } from "@/constants/images";
import { usePostHog } from "posthog-react-native";

import { useLanguageStore } from "@/store/useLanguageStore";

export default function LanguageSelectionScreen() {
  const router = useRouter();
  const selectedLanguageId = useLanguageStore((state) => state.selectedLanguageId);
  const setSelectedLanguageId = useLanguageStore((state) => state.setSelectedLanguageId);
  const hasHydrated = useLanguageStore((state) => state.hasHydrated);
  const posthog = usePostHog();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (hasHydrated && selectedLanguageId) {
      setSelectedId(selectedLanguageId);
    }
  }, [hasHydrated, selectedLanguageId]);
  const handleConfirm = () => {
    if (selectedId) {
      const selectedLang = languages.find((l) => l.id === selectedId);
      posthog.capture('language_selected', {
        language_id: selectedId,
        language_name: selectedLang?.name ?? null,
      });
      setSelectedLanguageId(selectedId);
      router.replace("/");
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <View className="flex-row items-center px-6 py-4 justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color="#0D132B" />
        </TouchableOpacity>
        <Text className="font-poppins-semibold text-lg text-text-primary">
          Choose Language
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View className="px-6 mt-4 mb-6">
          <Text className="font-poppins-bold text-[28px] leading-[36px] text-text-primary">
            What language would you like to learn?
          </Text>
          <Text className="font-poppins text-base text-text-secondary mt-2">
            Select one of our popular courses to get started.
          </Text>
        </View>

        <View className="px-6 gap-y-4">
          {languages.map((lang) => {
            const isSelected = selectedId === lang.id;
            return (
              <TouchableOpacity
                key={lang.id}
                onPress={() => setSelectedId(lang.id)}
                activeOpacity={0.85}
                className={`flex-row items-center p-5 rounded-2xl border ${
                  isSelected
                    ? "border-brand-blue bg-blue-50/20"
                    : "border-gray-200 bg-white"
                }`}
                style={isSelected ? styles.selectedCardShadow : styles.cardShadow}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
              >
                <View className="w-14 h-14 bg-gray-100 rounded-2xl items-center justify-center mr-4">
                  <Text className="text-3xl">{lang.flagEmoji}</Text>
                </View>

                <View className="flex-1">
                  <Text className="font-poppins-bold text-lg text-text-primary">
                    {lang.name}
                  </Text>
                  <Text className="font-poppins text-sm text-text-secondary mt-0.5">
                    {lang.nativeName}
                  </Text>
                </View>

                <View
                  className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                    isSelected ? "border-brand-blue bg-brand-blue" : "border-gray-300"
                  }`}
                >
                  {isSelected && (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View className="flex-1 items-center justify-center my-8">
          <Image
            source={images.earth}
            style={styles.earthImage}
            resizeMode="contain"
          />
        </View>
      </ScrollView>

      <View className="px-6 py-4 border-t border-gray-100 bg-white">
        <TouchableOpacity
          onPress={handleConfirm}
          disabled={!hasHydrated || !selectedId}
          activeOpacity={0.85}
          className={`w-full h-14 rounded-2xl items-center justify-center ${
            hasHydrated && selectedId ? "bg-brand-blue" : "bg-gray-200"
          }`}
          accessibilityRole="button"
          accessibilityLabel="Confirm language selection"
        >
          <Text
            className={`font-poppins-semibold text-lg ${
              hasHydrated && selectedId ? "text-white" : "text-gray-400"
            }`}
          >
            Confirm Selection
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  earthImage: {
    width: 200,
    height: 200,
  },
  cardShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  selectedCardShadow: {
    shadowColor: "#0066FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
});
