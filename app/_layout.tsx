import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import "./global.css";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { MenuProvider } from "react-native-popup-menu";

function RootLayout() {
  const [loaded, error] = useFonts({
    "OpenSans-Regular": require("../assets/fonts/OpenSans-Regular.ttf"),
    "Roboto-Regular": require("../assets/fonts/Roboto-Regular.ttf"),
    "Urbanist-Regular": require("../assets/fonts/Urbanist-Regular.ttf"),
    "OpenSans-Bold": require("../assets/fonts/OpenSans-Bold.ttf"),
    "Roboto-Bold": require("../assets/fonts/Roboto-Bold.ttf"),
    "Urbanist-Bold": require("../assets/fonts/Urbanist-Bold.ttf"),
    "OpenSans-Italic": require("../assets/fonts/OpenSans-Italic.ttf"),
    "Roboto-Italic": require("../assets/fonts/Roboto-Italic.ttf"),
    "Urbanist-Italic": require("../assets/fonts/Urbanist-Italic.ttf"),
    "OpenSans-BoldItalic": require("../assets/fonts/OpenSans-BoldItalic.ttf"),
    "Roboto-BoldItalic": require("../assets/fonts/Roboto-BoldItalic.ttf"),
    "Urbanist-BoldItalic": require("../assets/fonts/Urbanist-BoldItalic.ttf"),
  });

  const router = useRouter();

  useEffect(() => {
    if (error) console.error("Error loading fonts.", error);
  }, [loaded, error]);

  // Handle notification click anywhere in the app
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const screen = response.notification.request.content.data?.screen as
          | string
          | undefined;
        const allowedScreens = [
          "accessDenied",
          "chat",
          "cybermatch",
          "findmentors",
          "home",
          "login",
          "notifications",
          "pin",
          "profile",
          "register",
          "settings",
        ];
        if (typeof screen === "string" && allowedScreens.includes(screen)) {
          router.push(
            `/${screen}` as
              | `/accessDenied`
              | `/chat`
              | `/cybermatch`
              | `/findmentors`
              | `/home`
              | `/login`
              | `/notifications`
              | `/pin`
              | `/profile`
              | `/register`
              | `/settings`
          );
        }
      }
    );

    return () => subscription.remove();
  }, []);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <MenuProvider>
        <Stack>
          <Stack.Screen
            name="(drawer)"
            options={{
              headerBackVisible: false,
              headerShown: false,
              headerTitle: "",
            }}
          />
          <Stack.Screen name="index" options={{ headerShown: false, }} />
          <Stack.Screen name="register" options={{ title: "Register" }} />
          <Stack.Screen name="login" options={{ title: "Login" }} />
          <Stack.Screen name="pin" options={{ title: "Enter PIN" }} />
          <Stack.Screen
            name="updateProfile"
            options={{ title: "Update Profile" }}
          />
          <Stack.Screen name="chat" options={{ title: "Chat Match" }} />
          <Stack.Screen name="writeTestimonials" options={{ title: "Write Testimonials" }} />
        </Stack>
      </MenuProvider>
    </GestureHandlerRootView>
  );
}

export default RootLayout;
