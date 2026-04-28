require('dotenv').config();

module.exports = {
  expo: {
    extra: {
      eas: {
        projectId: process.env.EAS_PROJECT_ID
      }
    },
    owner: "hyoshiifarm",
    name: "Hyoshii Grower",
    slug: "hyoshii-mobile",
    version: "1.0.3",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    scheme: "hyoshiiapp",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true
    },
    android: {
      backgroundColor: "#1e4a49",
      edgeToEdgeEnabled: true,
      package: "com.hyoshiifarm.hyoshiimobile"
    },
    web: {
      favicon: "./assets/favicon.ico"
    },
    plugins: [
      "expo-secure-store",
      "expo-web-browser"
    ],
  }
};
