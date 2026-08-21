import React from "react";
import {
  DimensionValue,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useLanguageStore } from "@/store/useLanguageStore";
import { useProgressStore } from "@/store/useProgressStore";
import { languages } from "@/data/languages";
import { units } from "@/data/units";
import { lessons } from "@/data/lessons";
import { images } from "@/constants/images";

const GREETINGS: Record<string, string> = {
  es: "Hola",
  fr: "Bonjour",
  de: "Hallo",
  ja: "こんにちは",
  ko: "안녕하세요",
  zh: "你好",
  hi: "नमस्ते",
};

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useUser();

  // Zustand State
  const selectedLanguageId = useLanguageStore((state) => state.selectedLanguageId);
  const {
    completedLessons,
    xp,
    streak,
    toggleCompletedLesson,
    resetProgress,
    addXp,
  } = useProgressStore();

  // Find selected language
  const selectedLanguage =
    languages.find((lang) => lang.id === selectedLanguageId) || languages[0];

  // Find current unit for selected language
  const currentUnit =
    units.find((u) => u.languageId === selectedLanguage.id && u.number === 1) ||
    units.find((u) => u.languageId === selectedLanguage.id) ||
    units[0];

  // Get lessons for this unit
  const unitLessons = lessons.filter((l) => l.unitId === currentUnit.id);
  const sortedLessons = [...unitLessons].sort((a, b) => a.number - b.number);

  // Compute lesson states
  const firstUncompleted = sortedLessons.find((l) => !completedLessons.includes(l.id));

  // Daily Goal Specs (XP Target: 20)
  const dailyGoalXp = 20;
  const progressRatio = Math.min(1, xp / dailyGoalXp);
  const progressPercentage = `${progressRatio * 100}%` as DimensionValue;

  // Get clerk user name greeting
  const greetingName = user?.firstName || user?.fullName || "Alex";

  // Get greeting text in target language
  const selectedGreeting = GREETINGS[selectedLanguage.id] || "Hello";

  // Dynamic illustration for language hero card
  const getLanguageIllustration = () => {
    switch (selectedLanguage.id) {
      case "fr":
        return images.palace;
      case "es":
      default:
        return images.earth;
    }
  };

  // Helper to resolve icon by lesson type
  const getLessonIcon = (type: string) => {
    switch (type) {
      case "vocabulary-review":
        return { name: "book" as const, color: "#FFFFFF", bgColor: "bg-coral-red bg-[#FF7E75]" };
      case "audio-lesson":
        return { name: "headset" as const, color: "#FFFFFF", bgColor: "bg-purple-accent bg-[#8B5CF6]" };
      case "chat-tutor":
        return { name: "chatbubble-ellipses" as const, color: "#FFFFFF", bgColor: "bg-brand-blue bg-[#0066FF]" };
      case "video-lesson":
      default:
        return { name: "videocam" as const, color: "#FFFFFF", bgColor: "bg-emerald-500 bg-[#10B981]" };
    }
  };

  const handleLessonClick = (lessonId: string, xpReward: number, isLocked: boolean) => {
    if (isLocked) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    void Haptics.selectionAsync();
    // Toggle completion on click for interactive learning UI demo
    toggleCompletedLesson(lessonId, xpReward);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER SECTION */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
          <View className="flex-row items-center">
            {/* Language Flag Selector */}
            <TouchableOpacity
              onPress={() => {
                void Haptics.selectionAsync();
                router.push("/language-selection");
              }}
              activeOpacity={0.7}
              className="w-10 h-10 rounded-full border border-gray-200 bg-gray-50 items-center justify-center shadow-sm overflow-hidden"
            >
              <Text className="text-xl">{selectedLanguage.flagEmoji}</Text>
            </TouchableOpacity>

            {/* Greeting */}
            <Text className="font-poppins-bold text-xl text-text-primary ml-3">
              {selectedGreeting}, {greetingName}! 👋
            </Text>
          </View>

          {/* Stats & Actions */}
          <View className="flex-row items-center gap-x-4">
            {/* Streak */}
            <TouchableOpacity
              onPress={() => {
                void Haptics.selectionAsync();
              }}
              activeOpacity={0.75}
              className="flex-row items-center bg-orange-50 px-3 py-1.5 rounded-full"
            >
              <Image
                source={images.streakFire}
                style={styles.streakIcon}
                resizeMode="contain"
              />
              <Text className="font-poppins-bold text-base text-[#F97316] ml-1">
                {streak}
              </Text>
            </TouchableOpacity>

            {/* Notifications */}
            <TouchableOpacity
              onPress={() => void Haptics.selectionAsync()}
              activeOpacity={0.7}
              className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center border border-gray-100"
            >
              <Ionicons name="notifications-outline" size={22} color="#475569" />
            </TouchableOpacity>
          </View>
        </View>

        {/* DAILY GOAL CARD */}
        <View className="px-5 mt-4">
          <View style={styles.goalCard} className="bg-[#FDFBF7] p-5 rounded-[24px]">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="font-poppins-medium text-sm text-[#64748B]">
                  Daily goal
                </Text>
                <View className="flex-row items-baseline mt-1">
                  <Text className="font-poppins-bold text-[28px] text-text-primary">
                    {xp}
                  </Text>
                  <Text className="font-poppins text-base text-[#64748B] ml-1">
                    / {dailyGoalXp} XP
                  </Text>
                </View>
              </View>

              <Image
                source={images.treasure}
                style={styles.treasureImage}
                resizeMode="contain"
              />
            </View>

            {/* Progress Bar */}
            <View className="w-full h-2 bg-[#E2E8F0] rounded-full mt-3 overflow-hidden">
              <View
                style={{ width: progressPercentage }}
                className="h-full bg-[#F97316] rounded-full"
              />
            </View>
          </View>
        </View>

        {/* CONTINUE LEARNING GRADIENT CARD */}
        <View className="px-5 mt-5">
          <View style={styles.gradientCard} className="bg-[#4F46E5] rounded-[24px] overflow-hidden relative">
            <View className="p-6 pr-[120px] z-10">
              <Text className="font-poppins-medium text-sm text-white/80">
                Continue learning
              </Text>
              <Text className="font-poppins-bold text-[32px] leading-10 text-white mt-1">
                {selectedLanguage.name}
              </Text>
              <Text className="font-poppins-semibold text-sm text-white/90 mt-1">
                A1 • Unit {currentUnit.number}: {currentUnit.title}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  if (firstUncompleted) {
                    if (__DEV__) {
                      void Haptics.selectionAsync();
                      handleLessonClick(firstUncompleted.id, firstUncompleted.xp, false);
                    }
                  }
                }}
                disabled={!__DEV__}
                activeOpacity={0.85}
                className={`px-7 py-3 rounded-full mt-5 self-start shadow-sm ${
                  __DEV__ ? "bg-white" : "bg-white/20"
                }`}
              >
                <Text
                  className={`font-poppins-bold text-sm ${
                    __DEV__ ? "text-[#4F46E5]" : "text-white/60"
                  }`}
                >
                  {__DEV__ ? "Complete Lesson (Dev)" : "Locked"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Card Illustration */}
            <Image
              source={getLanguageIllustration()}
              style={styles.cardIllustration}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* TODAY'S PLAN SECTION */}
        <View className="px-5 mt-7">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="font-poppins-bold text-[22px] text-text-primary">
              {"Today's plan"}
            </Text>
            <TouchableOpacity
              onPress={() => void Haptics.selectionAsync()}
              activeOpacity={0.7}
            >
              <Text className="font-poppins-bold text-base text-[#2563EB]">
                View all
              </Text>
            </TouchableOpacity>
          </View>

          {/* Lesson List */}
          <View className="gap-y-3">
            {sortedLessons.map((lesson) => {
              const isCompleted = completedLessons.includes(lesson.id);
              const isActive = firstUncompleted ? lesson.id === firstUncompleted.id : false;
              const isLocked = firstUncompleted ? lesson.number > firstUncompleted.number : false;

              const iconConfig = getLessonIcon(lesson.type);

              return (
                <TouchableOpacity
                  key={lesson.id}
                  onPress={() => handleLessonClick(lesson.id, lesson.xp, isLocked)}
                  activeOpacity={isLocked ? 1 : 0.8}
                  style={[styles.itemCard, isLocked && styles.lockedCard]}
                  className="flex-row items-center p-4 bg-white border border-[#F1F5F9] rounded-2xl"
                >
                  {/* Left Icon */}
                  <View
                    className={`w-12 h-12 rounded-xl items-center justify-center ${iconConfig.bgColor} ${
                      isLocked ? "opacity-50" : ""
                    }`}
                  >
                    <Ionicons name={iconConfig.name} size={22} color={iconConfig.color} />
                  </View>

                  {/* Center Text */}
                  <View className="flex-1 ml-4 pr-2">
                    <Text
                      className={`font-poppins-bold text-base text-text-primary ${
                        isLocked ? "text-text-primary/40" : ""
                      }`}
                    >
                      {lesson.title}
                    </Text>
                    <Text
                      className={`font-poppins text-sm text-[#64748B] mt-0.5 ${
                        isLocked ? "text-[#64748B]/40" : ""
                      }`}
                      numberOfLines={1}
                    >
                      {lesson.description}
                    </Text>
                  </View>

                  {/* Right Status */}
                  <View className="items-center justify-center">
                    {isCompleted ? (
                      <View className="w-6 h-6 rounded-full bg-[#8B5CF6] items-center justify-center shadow-sm">
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      </View>
                    ) : isActive ? (
                      <View className="w-6 h-6 rounded-full border-2 border-[#8B5CF6] bg-transparent" />
                    ) : (
                      <View className="w-6 h-6 rounded-full border-2 border-gray-200 bg-transparent items-center justify-center">
                        {isLocked && (
                          <Ionicons name="lock-closed" size={10} color="#94A3B8" />
                        )}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* DEVELOPER PANEL FOR TESTING */}
        {__DEV__ && (
          <View className="mx-5 my-8 p-5 bg-gray-50 border border-gray-200 rounded-[20px]">
            <Text className="font-poppins-semibold text-xs text-gray-400 uppercase tracking-wider mb-3">
              Developer Settings (Interactive Testing)
            </Text>
            <View className="flex-row flex-wrap gap-2">
              <TouchableOpacity
                onPress={() => {
                  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  addXp(5);
                }}
                className="px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl"
              >
                <Text className="font-poppins-semibold text-xs text-[#0066FF]">
                  +5 XP
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  if (firstUncompleted) {
                    toggleCompletedLesson(firstUncompleted.id, firstUncompleted.xp);
                  }
                }}
                className="px-3 py-2 bg-[#F5F3FF] border border-[#EEF2F6] rounded-xl"
              >
                <Text className="font-poppins-semibold text-xs text-[#8B5CF6]">
                  Complete Next Lesson
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  resetProgress();
                }}
                className="px-3 py-2 bg-red-50 border border-red-100 rounded-xl"
              >
                <Text className="font-poppins-semibold text-xs text-red-600">
                  Reset Progress
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  streakIcon: {
    width: 20,
    height: 20,
  },
  treasureImage: {
    width: 56,
    height: 56,
  },
  cardIllustration: {
    position: "absolute",
    right: -10,
    bottom: -15,
    width: 130,
    height: 130,
    opacity: 0.9,
  },
  goalCard: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  gradientCard: {
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  itemCard: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  lockedCard: {
    opacity: 0.65,
    backgroundColor: "#FAF9F6",
  },
});
