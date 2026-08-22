import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getUpdatedDailyXp = (currentDailyXp: number, currentDate: string, amount: number) => {
  const today = getLocalDateString();
  if (currentDate !== today) {
    return Math.max(0, amount);
  }
  return Math.max(0, currentDailyXp + amount);
};

interface ProgressState {
  completedLessons: string[]; // List of completed lesson IDs
  xp: number; // Lifetime XP
  dailyXp: number; // XP earned today
  dailyXpDate: string; // Associated date (YYYY-MM-DD)
  streak: number;
  hasHydrated: boolean;
  addCompletedLesson: (lessonId: string, xpReward: number) => void;
  removeCompletedLesson: (lessonId: string, xpReward: number) => void;
  toggleCompletedLesson: (lessonId: string, xpReward: number) => void;
  addXp: (amount: number) => void;
  setStreak: (streak: number) => void;
  resetProgress: () => void;
  setHasHydrated: (state: boolean) => void;
  checkDailyXpReset: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      completedLessons: [],
      xp: 15, // Default to 15 XP to match the initial mockup state "15 / 20 XP"
      dailyXp: 15, // Default daily XP as well to match the initial state
      dailyXpDate: getLocalDateString(),
      streak: 12, // Default to 12 as shown in the design
      hasHydrated: false,
      addCompletedLesson: (lessonId, xpReward) =>
        set((state) => {
          if (state.completedLessons.includes(lessonId)) return {};
          const today = getLocalDateString();
          const newDailyXp = getUpdatedDailyXp(state.dailyXp, state.dailyXpDate, xpReward);
          return {
            completedLessons: [...state.completedLessons, lessonId],
            xp: state.xp + xpReward,
            dailyXp: newDailyXp,
            dailyXpDate: today,
          };
        }),
      removeCompletedLesson: (lessonId, xpReward) =>
        set((state) => {
          if (!state.completedLessons.includes(lessonId)) return {};
          const today = getLocalDateString();
          const newDailyXp = getUpdatedDailyXp(state.dailyXp, state.dailyXpDate, -xpReward);
          return {
            completedLessons: state.completedLessons.filter((id) => id !== lessonId),
            xp: Math.max(0, state.xp - xpReward),
            dailyXp: newDailyXp,
            dailyXpDate: today,
          };
        }),
      toggleCompletedLesson: (lessonId, xpReward) =>
        set((state) => {
          const isCompleted = state.completedLessons.includes(lessonId);
          const today = getLocalDateString();
          if (isCompleted) {
            const newDailyXp = getUpdatedDailyXp(state.dailyXp, state.dailyXpDate, -xpReward);
            return {
              completedLessons: state.completedLessons.filter((id) => id !== lessonId),
              xp: Math.max(0, state.xp - xpReward),
              dailyXp: newDailyXp,
              dailyXpDate: today,
            };
          } else {
            const newDailyXp = getUpdatedDailyXp(state.dailyXp, state.dailyXpDate, xpReward);
            return {
              completedLessons: [...state.completedLessons, lessonId],
              xp: state.xp + xpReward,
              dailyXp: newDailyXp,
              dailyXpDate: today,
            };
          }
        }),
      addXp: (amount) =>
        set((state) => {
          const today = getLocalDateString();
          const newDailyXp = getUpdatedDailyXp(state.dailyXp, state.dailyXpDate, amount);
          return {
            xp: state.xp + amount,
            dailyXp: newDailyXp,
            dailyXpDate: today,
          };
        }),
      setStreak: (streak) => set({ streak }),
      resetProgress: () =>
        set({
          completedLessons: [],
          xp: 15,
          dailyXp: 15,
          dailyXpDate: getLocalDateString(),
          streak: 12,
        }),
      setHasHydrated: (state) => set({ hasHydrated: state }),
      checkDailyXpReset: () =>
        set((state) => {
          const today = getLocalDateString();
          if (state.dailyXpDate !== today) {
            return {
              dailyXp: 0,
              dailyXpDate: today,
            };
          }
          return {};
        }),
    }),
    {
      name: "lingofox-progress-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: (state) => {
        return () => {
          state?.setHasHydrated(true);
        };
      },
    }
  )
);
