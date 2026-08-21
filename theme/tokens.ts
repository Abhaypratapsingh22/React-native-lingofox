export const colors = {
  brandBlue: "#0066FF",
  brandBlack: "#1A1A1A",
  brandCream: "#F5F1E9",
  brandCoral: "#FF7E75",
  infoBlue: "#4F9BD3",
  textPrimary: "#0D132B",
  textSecondary: "#687280",
  border: "#F5F7BB",
  background: "#FFFFFF",
} as const;

export const typography = {
  fontFamily: {
    regular: "Poppins-Regular",
    medium: "Poppins-Medium",
    semiBold: "Poppins-SemiBold",
    bold: "Poppins-Bold",
  },
  size: {
    h1: 32,
    h2: 24,
    h3: 20,
    h4: 16,
    bodyLarge: 16,
    bodyMedium: 14,
    bodySmall: 13,
    caption: 11,
  },
  lineHeight: {
    h1: 1.2,
    h2: 1.3,
    h3: 1.3,
    h4: 1.4,
    bodyLarge: 1.6,
    bodyMedium: 1.6,
    bodySmall: 1.6,
    caption: 1.4,
  },
} as const;

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

export const radii = {
  sm: 8,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const fonts = {
  "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
  "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
  "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
  "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
} as const;

export const theme = {
  colors,
  typography,
  spacing,
  radii,
  fonts,
} as const;
