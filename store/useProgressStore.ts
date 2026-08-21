import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ProgressState {
  completedLessons: string[]; // List of completed lesson IDs
  xp: number;
  streak: number;
  hasHydrated: boolean;
  addCompletedLesson: (lessonId: string, xpReward: number) => void;
  removeCompletedLesson: (lessonId: string, xpReward: number) => void;
  toggleCompletedLesson: (lessonId: string, xpReward: number) => void;
  addXp: (amount: number) => void;
  setStreak: (streak: number) => void;
  resetProgress: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      completedLessons: [],
      xp: 15, // Default to 15 XP to match the initial mockup state "15 / 20 XP"
      streak: 12, // Default to 12 as shown in the design
      hasHydrated: false,
      addCompletedLesson: (lessonId, xpReward) =>
        set((state) => {
          if (state.completedLessons.includes(lessonId)) return {};
          return {
            completedLessons: [...state.completedLessons, lessonId],
            xp: state.xp + xpReward,
          };
        }),
      removeCompletedLesson: (lessonId, xpReward) =>
        set((state) => ({
          completedLessons: state.completedLessons.filter((id) => id !== lessonId),
          xp: Math.max(0, state.xp - xpReward),
        })),
      toggleCompletedLesson: (lessonId, xpReward) =>
        set((state) => {
          const isCompleted = state.completedLessons.includes(lessonId);
          if (isCompleted) {
            return {
              completedLessons: state.completedLessons.filter((id) => id !== lessonId),
              xp: Math.max(0, state.xp - xpReward),
            };
          } else {
            return {
              completedLessons: [...state.completedLessons, lessonId],
              xp: state.xp + xpReward,
            };
          }
        }),
      addXp: (amount) => set((state) => ({ xp: state.xp + amount })),
      setStreak: (streak) => set({ streak }),
      resetProgress: () => set({ completedLessons: [], xp: 15, streak: 12 }),
      setHasHydrated: (state) => set({ hasHydrated: state }),
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
