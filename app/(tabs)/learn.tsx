import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/expo";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

import { useLanguageStore } from "@/store/useLanguageStore";
import { useProgressStore } from "@/store/useProgressStore";
import { languages } from "@/data/languages";
import { units } from "@/data/units";
import { lessons } from "@/data/lessons";
import { images } from "@/constants/images";

type Tab = "lessons" | "practice";

export default function LearnScreen() {
  const { user } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("lessons");

  // Zustand state
  const selectedLanguageId = useLanguageStore((s) => s.selectedLanguageId);
  const languageHydrated = useLanguageStore((s) => s.hasHydrated);
  const { completedLessons, streak, hasHydrated: progressHydrated } =
    useProgressStore();

  const isHydrated = languageHydrated && progressHydrated;

  // Resolve language
  const selectedLanguage =
    languages.find((l) => l.id === selectedLanguageId) || languages[0];

  // Resolve unit for selected language
  const currentUnit =
    units.find((u) => u.languageId === selectedLanguage.id && u.number === 1) ||
    units.find((u) => u.languageId === selectedLanguage.id) ||
    units[0];

  // Get lessons for current unit, sorted by number
  const unitLessons = lessons.filter((l) => l.unitId === currentUnit.id);
  const sortedLessons = [...unitLessons].sort((a, b) => a.number - b.number);

  // Determine lesson statuses — no locking as per requirements
  const firstUncompleted = sortedLessons.find(
    (l) => !completedLessons.includes(l.id)
  );

  // Get user first name for greeting
  const greetingName = user?.firstName || user?.fullName || "Alex";

  // Greeting based on time of day
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const handleLessonPress = (lessonId: string, xpReward: number) => {
    if (!isHydrated) return;
    void Haptics.selectionAsync();
    router.push(`/lesson/${lessonId}` as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* HEADER */}
      <View className="flex-row items-center justify-between px-4 pt-2 pb-1">
        <View style={{ width: 42, height: 42 }} />

        <View className="flex-1 items-center">
          <Text className="font-poppins-bold text-[17px] text-text-primary">
            {getTimeGreeting()}, {greetingName}!
          </Text>
          <Text className="font-poppins text-xs text-text-secondary mt-0.5">
            {"Let's continue your learning journey today"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => void Haptics.selectionAsync()}
          activeOpacity={0.7}
          style={styles.headerBtn}
        >
          <Ionicons name="bookmark-outline" size={22} color="#1A1A2E" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO BANNER */}
        <View className="mx-4 mt-3 rounded-2xl overflow-hidden">
          <Image
            source={images.mascotCafe}
            style={styles.heroBanner}
            resizeMode="cover"
          />
        </View>

        {/* STREAK BADGE */}
        <View className="items-center mt-3">
          <View style={styles.streakBadge} className="flex-row items-center px-4 py-1.5 rounded-full">
            <Text className="font-poppins-semibold text-sm text-white">
              Streak: {streak} days 🔥
            </Text>
          </View>
        </View>

        {/* TAB SWITCHER */}
        <View className="mx-4 mt-5 flex-row bg-[#F1F5F9] rounded-2xl p-1">
          <TouchableOpacity
            onPress={() => {
              setActiveTab("lessons");
              void Haptics.selectionAsync();
            }}
            activeOpacity={0.8}
            style={[
              styles.tabBtn,
              activeTab === "lessons" && styles.activeTabBtn,
            ]}
            className="flex-1 items-center py-3 rounded-xl"
          >
            <Text
              className={`font-poppins-bold text-[15px] ${
                activeTab === "lessons" ? "text-brand-blue" : "text-text-secondary"
              }`}
            >
              Lessons
            </Text>
            {activeTab === "lessons" && (
              <View style={styles.activeTabUnderline} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setActiveTab("practice");
              void Haptics.selectionAsync();
            }}
            activeOpacity={0.8}
            style={[
              styles.tabBtn,
              activeTab === "practice" && styles.activeTabBtn,
            ]}
            className="flex-1 items-center py-3 rounded-xl"
          >
            <Text
              className={`font-poppins-bold text-[15px] ${
                activeTab === "practice" ? "text-brand-blue" : "text-text-secondary"
              }`}
            >
              Practice
            </Text>
            {activeTab === "practice" && (
              <View style={styles.activeTabUnderline} />
            )}
          </TouchableOpacity>
        </View>

        {/* LESSON LIST */}
        {activeTab === "lessons" ? (
          <View className="mx-4 mt-4 gap-y-3">
            {sortedLessons.map((lesson) => {
              const isCompleted = completedLessons.includes(lesson.id);
              const isActive =
                firstUncompleted !== undefined &&
                lesson.id === firstUncompleted.id;


              if (isCompleted) {
                // ---- COMPLETED CARD ----
                return (
                  <TouchableOpacity
                    key={lesson.id}
                    onPress={() => handleLessonPress(lesson.id, lesson.xp)}
                    activeOpacity={0.8}
                    style={styles.completedCard}
                  >
                    <View className="flex-1">
                      <Text className="font-poppins-semibold text-[11px] text-text-secondary uppercase tracking-widest mb-0.5">
                        Lesson {lesson.number}
                      </Text>
                      <Text className="font-poppins-bold text-[17px] text-text-primary">
                        {lesson.title}
                      </Text>
                    </View>
                    <View style={styles.completedBadge}>
                      <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                );
              }

              if (isActive) {
                // ---- IN PROGRESS (ACTIVE) CARD ----
                return (
                  <TouchableOpacity
                    key={lesson.id}
                    onPress={() => handleLessonPress(lesson.id, lesson.xp)}
                    activeOpacity={0.8}
                    style={styles.activeCard}
                  >
                    <View className="flex-1">
                      <Text
                        style={{ color: "#2563EB" }}
                        className="font-poppins-bold text-[11px] uppercase tracking-widest mb-0.5"
                      >
                        Lesson {lesson.number}
                      </Text>
                      <Text
                        style={{ color: "#1A1A2E" }}
                        className="font-poppins-bold text-[17px]"
                      >
                        {lesson.title}
                      </Text>
                      <Text
                        style={{ color: "#2563EB" }}
                        className="font-poppins-medium text-[13px] mt-0.5"
                      >
                        In progress
                      </Text>
                    </View>
                    <View style={styles.activeIconBadge}>
                      <Ionicons name="book" size={20} color="#2563EB" />
                    </View>
                  </TouchableOpacity>
                );
              }

              // ---- LOCKED / UPCOMING CARD ----
              return (
                <TouchableOpacity
                  key={lesson.id}
                  onPress={() => handleLessonPress(lesson.id, lesson.xp)}
                  activeOpacity={0.8}
                  style={styles.lockedCard}
                >
                  <View className="flex-1">
                    <Text className="font-poppins-semibold text-[11px] text-text-secondary uppercase tracking-widest mb-0.5">
                      Lesson {lesson.number}
                    </Text>
                    <Text className="font-poppins-bold text-[17px] text-text-primary">
                      {lesson.title}
                    </Text>
                    <Text className="font-poppins text-[13px] text-text-secondary mt-0.5">
                      0 / {lesson.goals.length} lessons
                    </Text>
                  </View>
                  <View style={styles.lockedBadge}>
                    <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Empty state if no lessons found */}
            {sortedLessons.length === 0 && (
              <View className="items-center py-12">
                <Text className="text-4xl mb-3">📚</Text>
                <Text className="font-poppins-bold text-lg text-text-primary text-center">
                  No lessons yet
                </Text>
                <Text className="font-poppins text-sm text-text-secondary text-center mt-1">
                  Select a language to get started
                </Text>
              </View>
            )}
          </View>
        ) : (
          /* PRACTICE TAB PLACEHOLDER */
          <View className="flex-1 items-center justify-center py-20 px-8">
            <Text className="text-5xl mb-4">🏋️</Text>
            <Text className="font-poppins-bold text-xl text-text-primary text-center">
              Practice coming soon!
            </Text>
            <Text className="font-poppins text-sm text-text-secondary text-center mt-2">
              Spaced repetition exercises and drills will live here.
            </Text>
          </View>
        )}

        {/* Bottom padding */}
        <View style={{ height: 32 }} />
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
    paddingBottom: 20,
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  heroBanner: {
    width: "100%",
    height: 210,
    borderRadius: 16,
  },
  streakBadge: {
    backgroundColor: "#2563EB",
    borderRadius: 999,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  tabBtn: {
    position: "relative",
  },
  activeTabBtn: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  activeTabUnderline: {
    position: "absolute",
    bottom: 4,
    left: "20%",
    right: "20%",
    height: 2.5,
    backgroundColor: "#2563EB",
    borderRadius: 2,
  },
  // Completed lesson card
  completedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  completedBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  // Active / in-progress card
  activeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "#2563EB",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  activeIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  // Locked / upcoming card
  lockedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 0,
  },
  lockedBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
});
