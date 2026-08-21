import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, useWindowDimensions, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";

interface TabConfig {
  route: string;
  label: string;
  iconType: "ionicons" | "material";
  activeIcon: string;
  inactiveIcon: string;
}

const TABS: TabConfig[] = [
  {
    route: "home",
    label: "Home",
    iconType: "ionicons",
    activeIcon: "home",
    inactiveIcon: "home-outline",
  },
  {
    route: "learn",
    label: "Learn",
    iconType: "ionicons",
    activeIcon: "book",
    inactiveIcon: "book-outline",
  },
  {
    route: "ai-teacher",
    label: "AI Teacher",
    iconType: "material",
    activeIcon: "robot",
    inactiveIcon: "robot-outline",
  },
  {
    route: "chat",
    label: "Chat",
    iconType: "ionicons",
    activeIcon: "chatbubble",
    inactiveIcon: "chatbubble-outline",
  },
  {
    route: "profile",
    label: "Profile",
    iconType: "ionicons",
    activeIcon: "person",
    inactiveIcon: "person-outline",
  },
];

interface TabItemProps {
  route: any;
  index: number;
  isActive: boolean;
  onPress: () => void;
}

const TabItem: React.FC<TabItemProps> = ({ route, index, isActive, onPress }) => {
  const progress = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isActive ? 1 : 0, {
      duration: 150,
      easing: Easing.linear,
    });
  }, [isActive, progress]);

  const iconStyle = useAnimatedStyle(() => {
    // Inactive: vertical offset -2px (raised slightly above text)
    // Active: vertical offset 8px (centered vertically inside the 52px circle)
    const translateY = interpolate(progress.value, [0, 1], [-2, 8]);
    return {
      transform: [{ translateY }],
    };
  });

  const labelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 1], [1, 0]);
    const scale = interpolate(progress.value, [0, 1], [1, 0.5]);
    const translateY = interpolate(progress.value, [0, 1], [0, 8]);
    return {
      opacity,
      transform: [{ scale }, { translateY }],
    };
  });

  const config = TABS.find((t) => t.route === route.name);
  if (!config) return null;

  const IconComponent = config.iconType === "material" ? MaterialCommunityIcons : Ionicons;
  const iconName = (isActive ? config.activeIcon : config.inactiveIcon) as any;
  const iconColor = isActive ? "#FFFFFF" : "#687280";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="flex-1 items-center justify-center h-[76px]"
      style={{ zIndex: 10, elevation: 5 }}
      accessibilityRole="button"
      accessibilityState={isActive ? { selected: true } : {}}
      accessibilityLabel={config.label}
    >
      <Animated.View style={[iconStyle, { zIndex: 10 }]}>
        <IconComponent name={iconName} size={24} color={iconColor} />
      </Animated.View>
      <Animated.View style={labelStyle}>
        <Text className="font-poppins-medium text-[11px] leading-[14px] text-text-secondary mt-1">
          {config.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const circleSize = 52;
  const tabWidth = width / 5;

  const translateX = useSharedValue(state.index * tabWidth + (tabWidth - circleSize) / 2);

  useEffect(() => {
    const targetX = state.index * tabWidth + (tabWidth - circleSize) / 2;
    translateX.value = withTiming(targetX, {
      duration: 150,
      easing: Easing.linear,
    });
  }, [state.index, width, tabWidth, translateX]);

  const circleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom }]}>
      <View className="flex-row items-center w-full h-[76px] relative">
        {/* Animated Background Circle */}
        <Animated.View style={[styles.activeCircle, circleStyle]} />

        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              void Haptics.selectionAsync();
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <TabItem
              key={route.key}
              route={route}
              index={index}
              isActive={isFocused}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  activeCircle: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#0066ff",
    top: 12,
    zIndex: 1,
    shadowColor: "#0066ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  tabBarContainer: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 8,
  },
});
