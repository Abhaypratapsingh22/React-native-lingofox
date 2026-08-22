import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface VerificationModalProps {
  visible: boolean;
  onClose: () => void;
  email?: string;
  /** Called with the 6-digit code — parent performs the actual Clerk verification */
  onVerify?: (code: string) => Promise<void>;
  /** Resend the verification code via Clerk */
  onResend?: () => Promise<void>;
  /** Error message to display below the code input */
  error?: string;
  /** Whether a verification request is in progress */
  isLoading?: boolean;
}

export function VerificationModal({
  visible,
  onClose,
  email = "your email",
  onVerify,
  onResend,
  error,
  isLoading = false,
}: VerificationModalProps) {
  const [code, setCode] = useState("");
  const inputRef = useRef<TextInput>(null);
  const verifyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (verifyTimerRef.current) {
        clearTimeout(verifyTimerRef.current);
      }
    };
  }, []);

  // Reset code and auto-focus when modal becomes visible
  useEffect(() => {
    if (visible) {
      setCode("");
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  // Clear code when a new error arrives
  useEffect(() => {
    if (error) {
      setCode("");
    }
  }, [error]);

  const handleCodeChange = (text: string) => {
    // Only allow numeric digits up to 6 characters
    const numericText = text.replace(/[^0-9]/g, "").slice(0, 6);
    setCode(numericText);

    // When 6th digit is entered, trigger verification
    if (numericText.length === 6 && onVerify) {
      if (verifyTimerRef.current) {
        clearTimeout(verifyTimerRef.current);
      }
      verifyTimerRef.current = setTimeout(() => {
        verifyTimerRef.current = null;
        void onVerify(numericText);
      }, 350);
    }
  };

  const handleClose = () => {
    if (verifyTimerRef.current) {
      clearTimeout(verifyTimerRef.current);
      verifyTimerRef.current = null;
    }
    onClose();
  };

  const handleResend = async () => {
    setCode("");
    if (onResend) {
      await onResend();
    }
    inputRef.current?.focus();
  };

  const handleBoxPress = () => {
    inputRef.current?.focus();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.overlay}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View className="w-full max-w-sm px-4">
          <View
            className="bg-white rounded-3xl p-6 items-center relative"
            style={styles.modalCard}
          >
            {/* Close Button */}
            <TouchableOpacity
              onPress={handleClose}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Close verification"
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-100 items-center justify-center z-10"
            >
              <Ionicons name="close" size={20} color="#687280" />
            </TouchableOpacity>

            {/* Email Icon Header */}
            <View className="w-16 h-16 rounded-full bg-blue-50 items-center justify-center mb-4 mt-2">
              <Ionicons name="mail-unread-outline" size={32} color="#0066FF" />
            </View>

            {/* Modal Title & Subtitle */}
            <Text className="font-poppins-bold text-2xl text-text-primary text-center">
              Verify your email
            </Text>
            <Text className="font-poppins text-sm text-text-secondary text-center mt-2 px-2 leading-5">
              {"We've sent a 6-digit verification code to\n"}
              <Text className="font-poppins-semibold text-text-primary">
                {email}
              </Text>
              . Please enter it below to continue.
            </Text>

            {/* 6 Digit Code Input Display */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={handleBoxPress}
              accessibilityRole="button"
              accessibilityLabel="Verification code"
              className="flex-row justify-between w-full mt-6 mb-2"
            >
              {Array.from({ length: 6 }).map((_, index) => {
                const digit = code[index];
                const isFocused = index === code.length && code.length < 6;
                const isFilled = Boolean(digit);

                return (
                  <View
                    key={index}
                    className={`w-11 h-14 rounded-xl items-center justify-center border-2 ${
                      error
                        ? "border-red-400 bg-red-50/30"
                        : isFocused
                          ? "border-brand-blue bg-blue-50/30"
                          : isFilled
                            ? "border-brand-blue bg-white"
                            : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <Text className="font-poppins-bold text-2xl text-text-primary">
                      {digit || ""}
                    </Text>
                  </View>
                );
              })}
            </TouchableOpacity>

            {/* Hidden TextInput for Keyboard interaction */}
            <TextInput
              ref={inputRef}
              value={code}
              onChangeText={handleCodeChange}
              keyboardType="number-pad"
              inputMode="numeric"
              maxLength={6}
              caretHidden
              editable={!isLoading}
              accessibilityLabel="Verification code input"
              style={styles.hiddenInput}
              autoFocus
            />

            {/* Loading Indicator */}
            {isLoading && (
              <ActivityIndicator
                size="small"
                color="#0066FF"
                style={{ marginTop: 8 }}
              />
            )}

            {/* Error Message */}
            {error && !isLoading && (
              <Text className="font-poppins text-sm text-red-500 text-center mt-2">
                {error}
              </Text>
            )}

            {/* Resend Link */}
            <View className="flex-row items-center justify-center mt-5">
              <Text className="font-poppins text-sm text-text-secondary">
                {"Didn't receive code? "}
              </Text>
              <TouchableOpacity
                onPress={handleResend}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <Text className="font-poppins-semibold text-sm text-brand-blue">
                  Resend
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
});
