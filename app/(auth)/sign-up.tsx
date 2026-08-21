import { VerificationModal } from "@/components/VerificationModal";
import { images } from "@/constants/images";
import { useSignUp, useSSO } from "@clerk/expo";
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

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, errors, fetchStatus } = useSignUp();
  const { startSSOFlow } = useSSO();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationError, setVerificationError] = useState<string>();
  const [isVerifying, setIsVerifying] = useState(false);
  const [generalError, setGeneralError] = useState<string>();

  const handleSignUp = async () => {
    if (!signUp) return;
    if (!email || !password) return;
    setGeneralError(undefined);
    setVerificationError(undefined);

    try {
      const createResult = await signUp.create({
        emailAddress: email,
        password,
      });
      if (createResult.error) {
        throw createResult.error;
      }

      const codeResult = await signUp.verifications.sendEmailCode();
      if (codeResult.error) {
        throw codeResult.error;
      }

      setShowVerification(true);
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Unable to send verification code. Please try again.";

      setGeneralError(message);
      setShowVerification(false);
      console.warn(
        "Sign up verification dispatch error:",
        JSON.stringify(err, null, 2),
      );
    }
  };

  const handleVerify = async (code: string) => {
    if (!signUp) return;
    setIsVerifying(true);
    setVerificationError(undefined);

    try {
      const verificationResult = await signUp.verifications.verifyEmailCode({
        code,
      });
      if (verificationResult.error) {
        throw verificationResult.error;
      }

      if (signUp.status === "complete") {
        await signUp.finalize({
          navigate: ({ session }) => {
            if (session?.currentTask) return;
            router.replace("/");
          },
        });
      } else {
        setVerificationError(`Sign-up status is incomplete: ${signUp.status}`);
      }
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Invalid verification code. Please try again.";
      setVerificationError(message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!signUp) return;
    setVerificationError(undefined);
    try {
      const result = await signUp.verifications.sendEmailCode();
      if (result.error) {
        throw result.error;
      }
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Unable to resend the verification code. Please try again.";

      setVerificationError(message);
      console.warn("Resend verification error:", JSON.stringify(err, null, 2));
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
      });

      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
        router.replace("/");
      }
    } catch (err: any) {
      // User cancelled — do nothing
      if (err?.code === "SIGN_IN_CANCELLED" || err?.code === "-5") return;
      console.warn("Google sign-in error:", JSON.stringify(err, null, 2));
    }
  };

  const handleComingSoonAuth = (provider: string) => {
    Alert.alert(
      "Coming Soon",
      `Sign in with ${provider} is coming soon. Please use email or Google for now.`,
    );
  };

  // Build field-level error messages from Clerk
  const emailError = errors?.fields?.emailAddress;
  const passwordError = errors?.fields?.password;
  const emailErrorMessage =
    typeof emailError === "string"
      ? emailError
      : emailError && "message" in emailError
        ? String(emailError.message)
        : undefined;
  const passwordErrorMessage =
    typeof passwordError === "string"
      ? passwordError
      : passwordError && "message" in passwordError
        ? String(passwordError.message)
        : undefined;
  const isFetching = fetchStatus === "fetching";

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
              Create your account
            </Text>
            <Text className="font-poppins text-[15px] leading-6 text-text-secondary mt-1">
              Start your language journey today ✨
            </Text>
          </View>

          {/* Mascot Illustration */}
          <View className="items-center justify-center my-2">
            <Image
              source={images.mascotAuth}
              style={styles.mascotImage}
              resizeMode="contain"
            />
          </View>

          {/* Input Fields */}
          <View className="w-full gap-3">
            {/* Email Field */}
            <View>
              <View
                className={`border bg-white rounded-2xl px-4 pt-2.5 pb-2 ${emailError ? "border-red-400" : "border-[#EFEBE4]"}`}
              >
                <Text className="font-poppins-medium text-xs text-text-secondary mb-0.5">
                  Email
                </Text>
                <TextInput
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setGeneralError(undefined);
                  }}
                  placeholder="alex@gmail.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="font-poppins-medium text-base text-text-primary py-0.5"
                />
              </View>
              {emailErrorMessage && (
                <Text className="font-poppins text-xs text-red-500 mt-1 ml-1">
                  {emailErrorMessage}
                </Text>
              )}
            </View>

            {/* Password Field */}
            <View>
              <View
                className={`border bg-white rounded-2xl px-4 pt-2.5 pb-2 ${passwordError ? "border-red-400" : "border-[#EFEBE4]"}`}
              >
                <Text className="font-poppins-medium text-xs text-text-secondary mb-0.5">
                  Password
                </Text>
                <View className="flex-row items-center justify-between">
                  <TextInput
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setGeneralError(undefined);
                    }}
                    secureTextEntry={!showPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                    className="flex-1 font-poppins-medium text-base text-text-primary py-0.5"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="p-1 -mr-1"
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={22}
                      color="#687280"
                    />
                  </TouchableOpacity>
                </View>
              </View>
              {passwordErrorMessage && (
                <Text className="font-poppins text-xs text-red-500 mt-1 ml-1">
                  {passwordErrorMessage}
                </Text>
              )}
            </View>
          </View>

          {generalError && (
            <Text className="font-poppins text-xs text-red-500 mt-2 ml-1 text-center">
              {generalError}
            </Text>
          )}

          {/* Sign Up CTA Button */}
          <TouchableOpacity
            onPress={handleSignUp}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Sign Up"
            disabled={isFetching}
            className={`w-full h-14 rounded-2xl items-center justify-center mt-5 ${isFetching ? "bg-brand-blue/60" : "bg-brand-blue"}`}
          >
            <Text className="text-white font-poppins-semibold text-lg">
              {isFetching ? "Signing Up..." : "Sign Up"}
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
              Already have an account?{" "}
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/sign-in")}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Log in"
            >
              <Text className="font-poppins-semibold text-sm text-brand-blue">
                Log in
              </Text>
            </TouchableOpacity>
          </View>

          {/* Clerk bot protection captcha mount point */}
          <View nativeID="clerk-captcha" />
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
