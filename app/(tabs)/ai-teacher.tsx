import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AiTeacherScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <View className="flex-1 items-center justify-center p-6">
        <Text className="font-poppins-bold text-2xl text-text-primary">AI Teacher Screen</Text>
        <Text className="font-poppins text-base text-text-secondary mt-2 text-center">
          This is a placeholder for the AI teacher tab.
        </Text>
      </View>
    </SafeAreaView>
  );
}
