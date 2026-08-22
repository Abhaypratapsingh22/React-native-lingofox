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

interface UserProgress {
  completedLessons: string[];
  xp: number;
  dailyXp: number;
  dailyXpDate: string;
  streak: number;
}

interface ProgressState {
  completedLessons: string[]; // List of completed lesson IDs
  xp: number; // Lifetime XP
  dailyXp: number; // XP earned today
  dailyXpDate: string; // Associated date (YYYY-MM-DD)
  streak: number;
  userId: string | null; // Scoped Clerk User ID
  userProgressMap: Record<string, UserProgress>; // Multi-user local storage map
  hasHydrated: boolean;
  setUserId: (userId: string | null) => void;
  addCompletedLesson: (lessonId: string, xpReward: number) => void;
  removeCompletedLesson: (lessonId: string, xpReward: number) => void;
  toggleCompletedLesson: (lessonId: string, xpReward: number) => void;
  addXp: (amount: number) => void;
  setStreak: (streak: number) => void;
  resetProgress: () => void;
  setHasHydrated: (state: boolean) => void;
  checkDailyXpReset: () => void;
}

const syncUserMap = (state: ProgressState, updates: Partial<ProgressState>) => {
  const nextState = { ...state, ...updates };
  if (nextState.userId) {
    const userProgress: UserProgress = {
      completedLessons: nextState.completedLessons,
      xp: nextState.xp,
      dailyXp: nextState.dailyXp,
      dailyXpDate: nextState.dailyXpDate,
      streak: nextState.streak,
    };
    return {
      ...updates,
      userProgressMap: {
        ...nextState.userProgressMap,
        [nextState.userId]: userProgress,
      },
    };
  }
  return updates;
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      completedLessons: [],
      xp: 15, // Default to 15 XP to match the initial mockup state "15 / 20 XP"
      dailyXp: 15, // Default daily XP as well to match the initial state
      dailyXpDate: getLocalDateString(),
      streak: 12, // Default to 12 as shown in the design
      userId: null,
      userProgressMap: {},
      hasHydrated: false,
      setUserId: (newUserId) =>
        set((state) => {
          const oldUserId = state.userId;
          const userProgressMap = { ...state.userProgressMap };

          // Save current progress to old user's entry if oldUserId was present
          if (oldUserId) {
            userProgressMap[oldUserId] = {
              completedLessons: state.completedLessons,
              xp: state.xp,
              dailyXp: state.dailyXp,
              dailyXpDate: state.dailyXpDate,
              streak: state.streak,
            };
          }

          if (newUserId) {
            const savedProgress = userProgressMap[newUserId];
            if (savedProgress) {
              return {
                userId: newUserId,
                userProgressMap,
                completedLessons: savedProgress.completedLessons,
                xp: savedProgress.xp,
                dailyXp: savedProgress.dailyXp,
                dailyXpDate: savedProgress.dailyXpDate,
                streak: savedProgress.streak,
              };
            } else {
              // New user with no saved progress
              if (!oldUserId) {
                // Anonymous onboarding → first sign-in: carry over current progress
                const currentProgress: UserProgress = {
                  completedLessons: state.completedLessons,
                  xp: state.xp,
                  dailyXp: state.dailyXp,
                  dailyXpDate: state.dailyXpDate,
                  streak: state.streak,
                };
                userProgressMap[newUserId] = currentProgress;
                return {
                  userId: newUserId,
                  userProgressMap,
                };
              } else {
                // Switching from another real user: initialize fresh defaults
                const defaultProgress: UserProgress = {
                  completedLessons: [],
                  xp: 15,
                  dailyXp: 15,
                  dailyXpDate: getLocalDateString(),
                  streak: 12,
                };
                userProgressMap[newUserId] = defaultProgress;
                return {
                  userId: newUserId,
                  userProgressMap,
                  ...defaultProgress,
                };
              }
            }
          } else {
            // Sign out: reset current progress to defaults
            return {
              userId: null,
              userProgressMap,
              completedLessons: [],
              xp: 15,
              dailyXp: 15,
              dailyXpDate: getLocalDateString(),
              streak: 12,
            };
          }
        }),
      addCompletedLesson: (lessonId, xpReward) =>
        set((state) => {
          if (state.completedLessons.includes(lessonId)) return {};
          const today = getLocalDateString();
          const newDailyXp = getUpdatedDailyXp(state.dailyXp, state.dailyXpDate, xpReward);
          return syncUserMap(state, {
            completedLessons: [...state.completedLessons, lessonId],
            xp: Math.max(0, state.xp + xpReward),
            dailyXp: newDailyXp,
            dailyXpDate: today,
          });
        }),
      removeCompletedLesson: (lessonId, xpReward) =>
        set((state) => {
          if (!state.completedLessons.includes(lessonId)) return {};
          const today = getLocalDateString();
          const newDailyXp = getUpdatedDailyXp(state.dailyXp, state.dailyXpDate, -xpReward);
          return syncUserMap(state, {
            completedLessons: state.completedLessons.filter((id) => id !== lessonId),
            xp: Math.max(0, state.xp - xpReward),
            dailyXp: newDailyXp,
            dailyXpDate: today,
          });
        }),
      toggleCompletedLesson: (lessonId, xpReward) =>
        set((state) => {
          const isCompleted = state.completedLessons.includes(lessonId);
          const today = getLocalDateString();
          if (isCompleted) {
            const newDailyXp = getUpdatedDailyXp(state.dailyXp, state.dailyXpDate, -xpReward);
            return syncUserMap(state, {
              completedLessons: state.completedLessons.filter((id) => id !== lessonId),
              xp: Math.max(0, state.xp - xpReward),
              dailyXp: newDailyXp,
              dailyXpDate: today,
            });
          } else {
            const newDailyXp = getUpdatedDailyXp(state.dailyXp, state.dailyXpDate, xpReward);
            return syncUserMap(state, {
              completedLessons: [...state.completedLessons, lessonId],
              xp: Math.max(0, state.xp + xpReward),
              dailyXp: newDailyXp,
              dailyXpDate: today,
            });
          }
        }),
      addXp: (amount) =>
        set((state) => {
          const today = getLocalDateString();
          const newDailyXp = getUpdatedDailyXp(state.dailyXp, state.dailyXpDate, amount);
          return syncUserMap(state, {
            xp: Math.max(0, state.xp + amount),
            dailyXp: newDailyXp,
            dailyXpDate: today,
          });
        }),
      setStreak: (streak) =>
        set((state) => syncUserMap(state, { streak })),
      resetProgress: () =>
        set((state) => syncUserMap(state, {
          completedLessons: [],
          xp: 15,
          dailyXp: 15,
          dailyXpDate: getLocalDateString(),
          streak: 12,
        })),
      setHasHydrated: (state) => set({ hasHydrated: state }),
      checkDailyXpReset: () =>
        set((state) => {
          const today = getLocalDateString();
          if (state.dailyXpDate !== today) {
            return syncUserMap(state, {
              dailyXp: 0,
              dailyXpDate: today,
            });
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
