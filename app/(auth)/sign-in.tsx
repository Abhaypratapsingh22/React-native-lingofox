import { VerificationModal } from "@/components/VerificationModal";
import { images } from "@/constants/images";
import { useClerk, useOAuth, useSignIn } from "@clerk/expo";
import { AntDesign, FontAwesome, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignInScreen() {
  const router = useRouter();
  const clerk = useClerk();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const { signIn, fetchStatus } = useSignIn();
  const [email, setEmail] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const [verificationError, setVerificationError] = useState<string>();
  const [isVerifying, setIsVerifying] = useState(false);
  const isFetching = fetchStatus === "fetching";

  const handleSignIn = async () => {
    if (!signIn) return;
    if (!email.trim()) return;

    try {
      const createResult = await signIn.create({ identifier: email });
      if (createResult.error) {
        throw createResult.error;
      }

      const sendCodeResult = await signIn.emailCode.sendCode({
        emailAddress: email,
      });
      if (sendCodeResult.error) {
        throw sendCodeResult.error;
      }

      setVerificationError(undefined);
      setShowVerification(true);
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Unable to send the sign-in verification code. Please try again.";

      setVerificationError(message);
      setShowVerification(false);
      console.warn(
        "Email sign-in dispatch error:",
        JSON.stringify(err, null, 2),
      );
    }
  };

  const handleVerify = async (code: string) => {
    if (!signIn) return;
    setIsVerifying(true);
    setVerificationError(undefined);

    try {
      const result = await signIn.emailCode.verifyCode({ code });
      if (result.error) {
        throw result.error;
      }

      const finalizeResult = await signIn.finalize();
      if (finalizeResult.error) {
        throw finalizeResult.error;
      }

      if (signIn.createdSessionId) {
        await clerk.setActive({ session: signIn.createdSessionId });
        router.replace("/");
      }
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Invalid verification code. Please try again.";

      setVerificationError(message);
      console.warn("Email verification error:", JSON.stringify(err, null, 2));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!signIn) return;
    setVerificationError(undefined);
    try {
      const createResult = await signIn.create({ identifier: email });
      if (createResult.error) {
        throw createResult.error;
      }

      const sendCodeResult = await signIn.emailCode.sendCode({
        emailAddress: email,
      });
      if (sendCodeResult.error) {
        throw sendCodeResult.error;
      }
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Unable to resend the verification code. Please try again.";

      setVerificationError(message);
      console.warn(
        "Resend email verification error:",
        JSON.stringify(err, null, 2),
      );
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow();

      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
        router.replace("/");
      }
    } catch (err: any) {
      if (err?.code === "SIGN_IN_CANCELLED" || err?.code === "-5") return;
      console.warn("Google OAuth error:", JSON.stringify(err, null, 2));
    }
  };

  const handleComingSoonAuth = (provider: string) => {
    Alert.alert(
      "Coming Soon",
      `Sign in with ${provider} is coming soon. Please use email or Google for now.`,
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* Back Button */}
          <View className="flex-row items-center justify-start pt-1">
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              className="w-10 h-10 items-center justify-center -ml-2"
            >
              <Ionicons name="chevron-back" size={26} color="#0D132B" />
            </TouchableOpacity>
          </View>

          {/* Header Title & Subtitle */}
          <View className="mt-2">
            <Text className="font-poppins-bold text-[30px] leading-[38px] text-text-primary">
              Welcome back
            </Text>
            <Text className="font-poppins text-[15px] leading-6 text-text-secondary mt-1">
              Continue your language journey ✨
            </Text>
          </View>

          {/* Mascot Illustration */}
          <View className="items-center justify-center my-3">
            <Image
              source={images.mascotAuth}
              style={styles.mascotImage}
              resizeMode="contain"
            />
          </View>

          {/* Input Field - Email Only (No Password as specified) */}
          <View className="w-full">
            <View className="border border-[#EFEBE4] bg-white rounded-2xl px-4 pt-2.5 pb-2">
              <Text className="font-poppins-medium text-xs text-text-secondary mb-0.5">
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="alex@gmail.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                className="font-poppins-medium text-base text-text-primary py-0.5"
              />
            </View>
          </View>

          {/* Sign In CTA Button */}
          <TouchableOpacity
            onPress={handleSignIn}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Sign In"
            disabled={isFetching}
            className={`w-full h-14 rounded-2xl items-center justify-center mt-5 ${isFetching ? "bg-brand-blue/60" : "bg-brand-blue"}`}
          >
            <Text className="text-white font-poppins-semibold text-lg">
              {isFetching ? "Signing In..." : "Sign In"}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center justify-center my-5">
            <View className="flex-1 h-[1px] bg-[#EFEFEF]" />
            <Text className="font-poppins text-xs text-text-secondary px-3">
              or continue with
            </Text>
            <View className="flex-1 h-[1px] bg-[#EFEFEF]" />
          </View>

          {/* Social Auth Buttons */}
          <View className="w-full gap-2.5">
            {/* Google */}
            <TouchableOpacity
              onPress={handleGoogleAuth}
              activeOpacity={0.85}
              className="w-full h-13 bg-white border border-[#EFEBE4] rounded-2xl flex-row items-center justify-center gap-2.5 py-3.5"
            >
              <AntDesign name="google" size={19} color="#EA4335" />
              <Text className="font-poppins-semibold text-[15px] text-text-primary">
                Continue with Google
              </Text>
            </TouchableOpacity>

            {/* Facebook */}
            <TouchableOpacity
              onPress={() => handleComingSoonAuth("Facebook")}
              activeOpacity={0.85}
              className="w-full h-13 bg-white border border-[#EFEBE4] rounded-2xl flex-row items-center justify-center gap-2.5 py-3.5"
            >
              <FontAwesome name="facebook-square" size={20} color="#1877F2" />
              <Text className="font-poppins-semibold text-[15px] text-text-primary">
                Continue with Facebook
              </Text>
            </TouchableOpacity>

            {/* Apple */}
            <TouchableOpacity
              onPress={() => handleComingSoonAuth("Apple")}
              activeOpacity={0.85}
              className="w-full h-13 bg-white border border-[#EFEBE4] rounded-2xl flex-row items-center justify-center gap-2.5 py-3.5"
            >
              <Ionicons name="logo-apple" size={20} color="#000000" />
              <Text className="font-poppins-semibold text-[15px] text-text-primary">
                Continue with Apple
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer Link */}
          <View className="flex-row items-center justify-center mt-7 mb-4">
            <Text className="font-poppins text-sm text-text-secondary">
              {"Don't have an account? "}
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/sign-up")}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Sign up"
            >
              <Text className="font-poppins-semibold text-sm text-brand-blue">
                Sign up
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Verification Code Modal */}
      <VerificationModal
        visible={showVerification}
        onClose={() => setShowVerification(false)}
        email={email}
        onVerify={handleVerify}
        onResend={handleResend}
        error={verificationError}
        isLoading={isVerifying}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  mascotImage: {
    width: 176,
    height: 176,
  },
});
