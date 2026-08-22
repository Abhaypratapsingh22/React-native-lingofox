import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useUser } from "@clerk/expo";
import { usePostHog } from "posthog-react-native";

import { useProgressStore } from "@/store/useProgressStore";
import { lessons, phrases, vocabulary } from "@/data/lessons";
import { languages } from "@/data/languages";
import { images } from "@/constants/images";

interface DialogueTurn {
  teacherText: string;
  teacherTranslation: string;
  userPromptText: string;
  userResponseText: string;
}

export default function AudioLessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useUser();
  const posthog = usePostHog();

  // Stores
  const { streak, addCompletedLesson } = useProgressStore();

  // Find lesson details
  const lesson = lessons.find((l) => l.id === id);

  // States
  const [screenState, setScreenState] = useState<"lobby" | "connecting" | "active" | "completed">("lobby");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [userSpokenText, setUserSpokenText] = useState<string | null>(null);
  const [isTeacherSpeaking, setIsTeacherSpeaking] = useState(false);
  const [speakingFeedback, setSpeakingFeedback] = useState({
    speaking: "Excellent",
    pronunciation: "Great",
    grammar: "Good",
  });

  // Timeouts Tracking
  const timeoutsRef = useRef<any[]>([]);

  const registerTimeout = (fn: () => void, ms: number) => {
    const timer = setTimeout(fn, ms);
    timeoutsRef.current.push(timer);
    return timer;
  };

  useEffect(() => {
    const activeTimeouts = timeoutsRef.current;
    return () => {
      activeTimeouts.forEach((tId) => clearTimeout(tId));
    };
  }, []);

  // Load language details
  const languageId = lesson?.id.split("-")[0] || "es";
  const selectedLanguage = languages.find((l) => l.id === languageId) || languages[0];

  // Resolve phrases & vocabularies
  const lessonPhrases = lesson ? phrases.filter((p) => lesson.phraseIds.includes(p.id)) : [];
  const lessonVocab = lesson ? vocabulary.filter((v) => lesson.vocabularyIds.includes(v.id)) : [];

  // Generate dialogue turns dynamically based on target phrases
  const dialogueTurns: DialogueTurn[] = [];
  if (lesson) {
    if (lessonPhrases.length > 0) {
      lessonPhrases.forEach((phrase, idx) => {
        if (idx === 0) {
          dialogueTurns.push({
            teacherText: `Welcome to our lesson. Can you say: "${phrase.phrase}"?`,
            teacherTranslation: `Welcome to our lesson. Can you say: "${phrase.translation}"?`,
            userPromptText: `Say "${phrase.phrase}"`,
            userResponseText: phrase.phrase,
          });
        } else {
          dialogueTurns.push({
            teacherText: `Next, try this phrase: "${phrase.phrase}".`,
            teacherTranslation: `Next, try this phrase: "${phrase.translation}".`,
            userPromptText: `Say "${phrase.phrase}"`,
            userResponseText: phrase.phrase,
          });
        }
      });
    } else if (lessonVocab.length > 0) {
      lessonVocab.forEach((vocab) => {
        dialogueTurns.push({
          teacherText: `Let's practice the word: "${vocab.word}", which means "${vocab.translation}". Try saying it.`,
          teacherTranslation: `Let's practice the word: "${vocab.word}", which means "${vocab.translation}". Try saying it.`,
          userPromptText: `Say "${vocab.word}"`,
          userResponseText: vocab.word,
        });
      });
    } else {
      dialogueTurns.push({
        teacherText: "Welcome to your AI Teacher lesson! Let's start speaking.",
        teacherTranslation: "Welcome to your AI Teacher lesson! Let's start speaking.",
        userPromptText: "Say 'Hola'",
        userResponseText: "Hola",
      });
    }

    // Add generic final turn
    dialogueTurns.push({
      teacherText: "You did an outstanding job today. Let's finish the call.",
      teacherTranslation: "You did an outstanding job today. Let's finish the call.",
      userPromptText: "Tap End Call to finish the lesson",
      userResponseText: "",
    });
  }

  // Handle start lesson from lobby
  const handleStartLesson = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setScreenState("connecting");

    // Capture starting analytics
    posthog.capture("lesson_started", {
      lesson_id: id,
      lesson_type: lesson?.type ?? null,
      language_id: languageId,
      xp_reward: lesson?.xp ?? 20,
    });

    // Simulate connection delay
    registerTimeout(() => {
      setScreenState("active");
      setIsTeacherSpeaking(true);
      // Brief speak simulation
      registerTimeout(() => setIsTeacherSpeaking(false), 2000);
    }, 1500);
  };

  // Simulate speaking to AI Teacher
  const handleSpeak = () => {
    if (isListening || isTeacherSpeaking) return;
    const currentTurn = dialogueTurns[currentTurnIndex];
    if (!currentTurn || !currentTurn.userResponseText) return;

    void Haptics.selectionAsync();
    setIsListening(true);
    setUserSpokenText(null);

    // Dynamic metrics simulation
    const feedbackOptions = [
      { speaking: "Excellent", pronunciation: "Excellent", grammar: "Excellent" },
      { speaking: "Excellent", pronunciation: "Great", grammar: "Good" },
      { speaking: "Great", pronunciation: "Great", grammar: "Great" },
    ];
    const selectedFeedback = feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)];

    // Simulate listening for 2 seconds
    registerTimeout(() => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsListening(false);
      setUserSpokenText(currentTurn.userResponseText);
      setSpeakingFeedback(selectedFeedback);

      // Advance turn after user is done speaking
      registerTimeout(() => {
        if (currentTurnIndex < dialogueTurns.length - 1) {
          setCurrentTurnIndex((prev) => prev + 1);
          setUserSpokenText(null);
          setIsTeacherSpeaking(true);
          // Teacher speak simulation
          registerTimeout(() => setIsTeacherSpeaking(false), 2000);
        } else {
          // Last turn, show success modal
          handleEndCall();
        }
      }, 2000);
    }, 2000);
  };

  // Trigger text-to-speech speaker button simulation
  const handleTTS = () => {
    if (isTeacherSpeaking) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsTeacherSpeaking(true);
    registerTimeout(() => setIsTeacherSpeaking(false), 2000);
  };

  // End Call or complete lesson
  const handleEndCall = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setScreenState("completed");

    // Capture completion analytics
    posthog.capture("lesson_completed", {
      lesson_id: id,
      lesson_type: lesson?.type ?? null,
      language_id: languageId,
      xp_earned: lesson?.xp ?? 20,
      streak: streak,
    });
  };

  // Save progress in Zustand and go back
  const handleContinueCompleted = () => {
    void Haptics.selectionAsync();
    if (lesson) {
      addCompletedLesson(lesson.id, lesson.xp);
    }
    router.back();
  };

  // If lesson doesn't exist, show error
  if (!lesson) {
    return (
      <SafeAreaView style={styles.safeAreaError}>
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text className="font-poppins-bold text-xl text-text-primary text-center mt-4">
            Lesson Not Found
          </Text>
          <Text className="font-poppins text-sm text-text-secondary text-center mt-2">
            The selected lesson could not be loaded. Please return and try again.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-6 px-6 py-3 bg-brand-blue rounded-xl"
            activeOpacity={0.8}
          >
            <Text className="font-poppins-bold text-sm text-white">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- 1. LOBBY VIEW ---
  if (screenState === "lobby") {
    return (
      <SafeAreaView style={styles.safeAreaLobby}>
        <View className="flex-1 px-5 pt-3 justify-between pb-6">
          {/* HEADER */}
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => {
                void Haptics.selectionAsync();
                router.back();
              }}
              className="w-10 h-10 border border-slate-200 rounded-full items-center justify-center"
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={20} color="#1A1A2E" />
            </TouchableOpacity>

            <View className="flex-row items-center px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full">
              <Text className="font-poppins-semibold text-xs text-orange-600">
                Streak: {streak} days 🔥
              </Text>
            </View>
          </View>

          {/* MAIN PREVIEW */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            className="flex-1 my-4"
          >
            <View className="items-center py-4">
              <View className="w-28 h-28 bg-[#8B5CF6]/10 rounded-full items-center justify-center mb-4">
                <Ionicons name="headset" size={56} color="#8B5CF6" />
              </View>

              <Text className="font-poppins-semibold text-xs text-brand-blue uppercase tracking-widest">
                {selectedLanguage.flagEmoji} {selectedLanguage.name} Audio Lesson
              </Text>

              <Text className="font-poppins-bold text-2xl text-text-primary text-center mt-2 px-4">
                {lesson.title}
              </Text>

              <Text className="font-poppins text-sm text-text-secondary text-center mt-2 px-6">
                {lesson.description}
              </Text>
            </View>

            {/* DETAILS CONTAINER */}
            <View className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 mb-5">
              {/* GOALS */}
              <Text className="font-poppins-bold text-sm text-text-primary mb-2">
                Lesson Goals
              </Text>
              {lesson.goals.map((goal, idx) => {
                const isLast = idx === lesson.goals.length - 1;
                return (
                  <View key={idx} className="flex-row items-start" style={{ marginBottom: isLast ? 0 : 8 }}>
                    <Text className="text-brand-blue mt-0.5" style={{ marginRight: 8 }}>•</Text>
                    <Text className="font-poppins text-[13px] text-text-secondary flex-1 leading-5">
                      {goal}
                    </Text>
                  </View>
                );
              })}

              <View className="h-px bg-slate-200/60 my-4" />

              {/* PRACTICE PHRASES */}
              <Text className="font-poppins-bold text-sm text-text-primary mb-2">
                Target Phrases to Practice
              </Text>
              {lessonPhrases.map((phrase) => (
                <View key={phrase.id} className="mb-2.5">
                  <Text className="font-poppins-medium text-[13.5px] text-brand-blue">
                    {phrase.phrase}
                  </Text>
                  <Text className="font-poppins text-[12px] text-text-secondary">
                    {phrase.translation}
                  </Text>
                </View>
              ))}

              {/* IF NO PHRASES, SHOW VOCABULARY */}
              {lessonPhrases.length === 0 && lessonVocab.map((vocab) => (
                <View key={vocab.id} className="mb-2.5">
                  <Text className="font-poppins-medium text-[13.5px] text-brand-blue">
                    {vocab.word}
                  </Text>
                  <Text className="font-poppins text-[12px] text-text-secondary">
                    {vocab.translation} ({vocab.partOfSpeech})
                  </Text>
                </View>
              ))}
            </View>

            {/* TEACHER INSTRUCTIONS */}
            {lesson.aiTeacherPrompt && (
              <View className="border border-purple-100 bg-purple-50/30 rounded-2xl p-5 mb-6">
                <Text className="font-poppins-bold text-sm text-[#8B5CF6] mb-1.5">
                  AI Teacher Prompt Context
                </Text>
                <Text className="font-poppins text-[12.5px] text-text-secondary leading-5">
                  {lesson.aiTeacherPrompt}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* ACTION BUTTON */}
          <TouchableOpacity
            onPress={handleStartLesson}
            className="w-full bg-[#10B981] py-4 rounded-2xl items-center justify-center shadow-sm"
            activeOpacity={0.85}
          >
            <View className="flex-row items-center">
              <Ionicons name="call" size={18} color="#FFFFFF" className="mr-2" />
              <Text className="font-poppins-bold text-[15px] text-white">
                Start Audio Lesson (+{lesson.xp} XP)
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- 2. CONNECTING STATE ---
  if (screenState === "connecting") {
    return (
      <SafeAreaView style={styles.safeAreaConnecting}>
        <View className="flex-1 items-center justify-center p-6">
          <View className="relative items-center justify-center mb-6">
            {/* Pulsing visual circles */}
            <View className="absolute w-44 h-44 bg-brand-blue/5 rounded-full" />
            <View className="absolute w-36 h-36 bg-brand-blue/10 rounded-full" />
            <View className="w-24 h-24 bg-brand-blue rounded-full items-center justify-center">
              <Image
                source={images.mascotWelcome}
                className="w-16 h-16"
                resizeMode="contain"
              />
            </View>
          </View>
          <Text className="font-poppins-bold text-xl text-text-primary text-center">
            Connecting to AI Teacher...
          </Text>
          <Text className="font-poppins text-sm text-text-secondary text-center mt-2 px-6">
            Preparing your language speaking environment
          </Text>
          <ActivityIndicator size="small" color="#0066FF" className="mt-8" />
        </View>
      </SafeAreaView>
    );
  }

  // --- 3. ACTIVE AUDIO CALL VIEW ---
  const currentTurn = dialogueTurns[currentTurnIndex] || dialogueTurns[dialogueTurns.length - 1];

  return (
    <SafeAreaView style={styles.safeAreaActive}>
      {/* HEADER */}
      <View className="flex-row items-center justify-between px-4 pt-2 pb-4 bg-white border-b border-slate-100">
        <TouchableOpacity
          onPress={() => {
            void Haptics.selectionAsync();
            router.back();
          }}
          className="w-10 h-10 border border-slate-200 rounded-full items-center justify-center"
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color="#1A1A2E" />
        </TouchableOpacity>

        <View className="flex-1 items-center">
          <Text className="font-poppins-bold text-lg text-text-primary">AI Teacher</Text>
          <View className="flex-row items-center mt-0.5">
            <View className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
            <Text className="font-poppins text-xs text-text-secondary">Online</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-x-2">
          <View className="flex-row items-center px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full">
            <Text className="font-poppins-semibold text-xs text-orange-600">
              {streak} 🔥
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => void Haptics.selectionAsync()}
            className="w-10 h-10 border border-slate-200 rounded-full items-center justify-center"
            activeOpacity={0.7}
          >
            <Ionicons name="person-outline" size={18} color="#1A1A2E" />
          </TouchableOpacity>
        </View>
      </View>

      {/* MAIN CONTENT AREA */}
      <View className="flex-1 px-4 justify-between pb-6 mt-4">
        {/* MASCOT CALL SCREEN CONTAINER CARD */}
        <View className="flex-1 rounded-3xl overflow-hidden relative justify-center bg-[#E5E0D8] border border-[#d5d0c8]">
          {/* Background mascot image */}
          <View className="items-center justify-center flex-1 pt-12 pb-24">
            <Image
              source={images.mascotWelcome}
              className="w-56 h-56"
              resizeMode="contain"
            />
          </View>

          {/* Camera float overlay (top right) */}
          <View style={styles.cameraBox} className="absolute top-4 right-4 w-28 h-36 bg-slate-800 rounded-2xl border-2 border-white overflow-hidden shadow-md">
            {isCameraOn ? (
              user?.imageUrl ? (
                <Image
                  source={{ uri: user.imageUrl }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full items-center justify-center bg-slate-700">
                  <Ionicons name="person" size={28} color="#94A3B8" />
                </View>
              )
            ) : (
              <View className="w-full h-full items-center justify-center bg-slate-900">
                <Ionicons name="videocam-off" size={24} color="#64748B" />
                <Text className="font-poppins text-[10px] text-slate-500 mt-1 text-center">
                  Camera Off
                </Text>
              </View>
            )}
          </View>

          {/* Camera overlay state toggle indicator */}
          <TouchableOpacity
            onPress={() => {
              void Haptics.selectionAsync();
              setIsCameraOn((prev) => !prev);
            }}
            className="absolute top-4 left-4 w-10 h-10 bg-black/45 rounded-full items-center justify-center"
            activeOpacity={0.8}
          >
            <Ionicons name={isCameraOn ? "videocam" : "videocam-off"} size={16} color="#FFFFFF" />
          </TouchableOpacity>

          {/* AI TEACHER SPEECH BUBBLE */}
          <View className="absolute bottom-24 left-4 right-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="font-poppins-bold text-text-primary text-[15px] leading-5">
                {currentTurn.teacherText}
              </Text>
              {showSubtitles && (
                <Text className="font-poppins text-text-secondary text-xs mt-1 leading-4">
                  {currentTurn.teacherTranslation}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={handleTTS}
              disabled={isTeacherSpeaking}
              className="w-10 h-10 bg-brand-blue/10 rounded-full items-center justify-center"
              activeOpacity={0.7}
            >
              {isTeacherSpeaking ? (
                <ActivityIndicator size="small" color="#0066FF" />
              ) : (
                <Ionicons name="volume-high" size={20} color="#0066FF" />
              )}
            </TouchableOpacity>
          </View>

          {/* CALL ACTION CONTROLS */}
          <View className="absolute bottom-4 left-0 right-0 flex-row justify-evenly items-center">
            {/* Camera Mute Button */}
            <View className="items-center">
              <TouchableOpacity
                onPress={() => {
                  void Haptics.selectionAsync();
                  setIsCameraOn((prev) => !prev);
                }}
                className={`w-12 h-12 rounded-full items-center justify-center ${
                  isCameraOn ? "bg-white" : "bg-slate-800"
                }`}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isCameraOn ? "videocam" : "videocam-off"}
                  size={18}
                  color={isCameraOn ? "#1A1A2E" : "#FFFFFF"}
                />
              </TouchableOpacity>
              <Text className="font-poppins text-[10px] text-slate-500 mt-1">Camera</Text>
            </View>

            {/* Mic Mute Button */}
            <View className="items-center">
              <TouchableOpacity
                onPress={() => {
                  void Haptics.selectionAsync();
                  setIsMuted((prev) => !prev);
                }}
                className={`w-12 h-12 rounded-full items-center justify-center ${
                  !isMuted ? "bg-white" : "bg-slate-800"
                }`}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={!isMuted ? "mic" : "mic-off"}
                  size={18}
                  color={!isMuted ? "#1A1A2E" : "#FFFFFF"}
                />
              </TouchableOpacity>
              <Text className="font-poppins text-[10px] text-slate-500 mt-1">Mic</Text>
            </View>

            {/* Subtitles Button */}
            <View className="items-center">
              <TouchableOpacity
                onPress={() => {
                  void Haptics.selectionAsync();
                  setShowSubtitles((prev) => !prev);
                }}
                className={`w-12 h-12 rounded-full items-center justify-center ${
                  showSubtitles ? "bg-white" : "bg-slate-800"
                }`}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="text"
                  size={18}
                  color={showSubtitles ? "#1A1A2E" : "#94A3B8"}
                />
              </TouchableOpacity>
              <Text className="font-poppins text-[10px] text-slate-500 mt-1">Subtitles</Text>
            </View>

            {/* End Call Button */}
            <View className="items-center">
              <TouchableOpacity
                onPress={handleEndCall}
                style={styles.endCallBtn}
                className="w-12 h-12 bg-red-500 rounded-full items-center justify-center"
                activeOpacity={0.8}
              >
                <Ionicons name="call" size={18} color="#FFFFFF" />
              </TouchableOpacity>
              <Text className="font-poppins text-[10px] text-slate-500 mt-1">End Call</Text>
            </View>
          </View>
        </View>

        {/* FEEDBACK STATUS BOARD */}
        <View className="bg-white border border-slate-100 rounded-2xl p-4 mt-4 shadow-sm flex-row justify-evenly">
          <View className="items-center flex-1">
            <Text className="font-poppins text-[11px] text-text-secondary mb-1">Speaking</Text>
            <Text className="font-poppins-bold text-sm text-[#10B981]">{speakingFeedback.speaking}</Text>
          </View>
          <View className="w-px bg-slate-100 h-8 self-center" />
          <View className="items-center flex-1">
            <Text className="font-poppins text-[11px] text-text-secondary mb-1">Pronunciation</Text>
            <Text className="font-poppins-bold text-sm text-brand-blue">{speakingFeedback.pronunciation}</Text>
          </View>
          <View className="w-px bg-slate-100 h-8 self-center" />
          <View className="items-center flex-1">
            <Text className="font-poppins text-[11px] text-text-secondary mb-1">Grammar</Text>
            <Text className="font-poppins-bold text-sm text-purple-600">{speakingFeedback.grammar}</Text>
          </View>
        </View>

        {/* INTERACTIVE SPEAKING ACTIONS */}
        <View className="items-center mt-5">
          {/* User spoken text preview bubble */}
          {userSpokenText && (
            <View className="bg-[#8B5CF6]/10 px-4 py-2.5 rounded-2xl mb-3 border border-[#8B5CF6]/15 max-w-[90%]">
              <Text className="font-poppins-semibold text-xs text-[#8B5CF6] text-center">
                You: {"\"" + userSpokenText + "\""}
              </Text>
            </View>
          )}

          {/* Micro interaction speak trigger button */}
          <TouchableOpacity
            onPress={currentTurnIndex === dialogueTurns.length - 1 ? handleEndCall : handleSpeak}
            disabled={isListening || isMuted || isTeacherSpeaking}
            className={`w-full py-4 rounded-2xl flex-row items-center justify-center ${
              isMuted
                ? "bg-slate-100 border border-slate-200"
                : isListening
                ? "bg-[#8B5CF6]"
                : "bg-brand-blue"
            }`}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isListening ? "pulse-outline" : isMuted ? "mic-off-outline" : "mic-outline"}
              size={20}
              color={isMuted ? "#94A3B8" : "#FFFFFF"}
              style={{ marginRight: 8 }}
            />
            <Text
              className={`font-poppins-bold text-sm ${
                isMuted ? "text-[#94A3B8]" : "text-white"
              }`}
            >
              {isMuted
                ? "Unmute Mic to Respond"
                : isListening
                ? "Listening... Speak Now 🎙"
                : isTeacherSpeaking
                ? "Teacher is speaking..."
                : currentTurnIndex < dialogueTurns.length - 1
                ? currentTurn.userPromptText
                : "Tap to Finish Lesson"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* --- 4. SUCCESS / CELEBRATION MODAL --- */}
      <Modal
        visible={screenState === "completed"}
        transparent={true}
        animationType="fade"
        onRequestClose={handleContinueCompleted}
      >
        <View style={styles.modalOverlay} className="flex-1 justify-center items-center px-5 bg-black/60">
          <View className="w-full bg-white rounded-3xl p-6 items-center shadow-lg max-w-sm">
            <Text className="text-5xl mb-4">🏆</Text>
            <Text className="font-poppins-bold text-2xl text-text-primary text-center">
              Lesson Completed!
            </Text>
            <Text className="font-poppins text-sm text-text-secondary text-center mt-1 px-4 leading-5">
              Outstanding work! You completed your audio conversation lesson.
            </Text>

            {/* Reward badges */}
            <View className="flex-row mt-6 gap-x-3">
              <View className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl items-center flex-1">
                <Text className="font-poppins text-[10px] text-emerald-600 uppercase tracking-wider">
                  XP Gained
                </Text>
                <Text className="font-poppins-bold text-lg text-emerald-700 mt-0.5">
                  +{lesson.xp} XP
                </Text>
              </View>

              <View className="bg-orange-50 border border-orange-200 px-4 py-2 rounded-2xl items-center flex-1">
                <Text className="font-poppins text-[10px] text-orange-600 uppercase tracking-wider">
                  Streak
                </Text>
                <Text className="font-poppins-bold text-lg text-orange-700 mt-0.5">
                  {streak} days 🔥
                </Text>
              </View>
            </View>

            {/* Continue button */}
            <TouchableOpacity
              onPress={handleContinueCompleted}
              className="w-full bg-brand-blue py-3.5 rounded-2xl items-center justify-center mt-6 shadow-sm"
              activeOpacity={0.8}
            >
              <Text className="font-poppins-bold text-[15px] text-white">
                Continue
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// StyleSheet exceptions as per AGENTS.md constraints
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  safeAreaError: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  safeAreaLobby: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  safeAreaConnecting: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  safeAreaActive: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    paddingBottom: 24,
  },
  cameraBox: {
    // Custom drop-shadow for floating camera preview on iOS
    shadowColor: "#0D132B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  endCallBtn: {
    transform: [{ rotate: "135deg" }],
  },
  modalOverlay: {
    justifyContent: "center",
    alignItems: "center",
  },
});
