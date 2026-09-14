const IS_DEV = process.env.APP_VARIANT === "development";

export default {
  expo: {
    name: IS_DEV ? "Know-Better (Dev)" : "Know-Better",
    slug: "Know-Better",
    version: "1.1.0",
    orientation: "portrait",
    scheme: IS_DEV ? "knowbetter-dev" : "knowbetter",
    icon: "./assets/splash-icon.png",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#FAFAF9",
    },
    userInterfaceStyle: "light",
    ios: {
      supportsTablet: true,
      bundleIdentifier: IS_DEV
        ? "com.sarikasonawane.KnowBetter.dev"
        : "com.sarikasonawane.KnowBetter",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#FAFAF9",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
      },
      package: IS_DEV
        ? "com.sarikasonawane.KnowBetter.dev"
        : "com.sarikasonawane.KnowBetter",
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    extra: {
      eas: {
        projectId: "0db99893-6c06-42a1-b9f4-150d3607f411",
      },
    },
    owner: "sarikasonawane",
    plugins: [
      [
        "@sentry/react-native/expo",
        {
          organization: "sarika-sonawane",
          project: "react-native",
        },
      ],
    ],
  },
};
