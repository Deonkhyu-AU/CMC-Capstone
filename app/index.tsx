import { useEffect, useState } from "react";
import { View, Text, Image } from "react-native";
import { firebaseConfig } from "@/lib/firebase/firebase_initialize";
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { router, usePathname } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

export default function HomeScreen() {
  console.log("🚀 Index.tsx mounted");

  const [ipAddress, setIpAddress] = useState(null);
  const [isInAustralia, setInAustralia] = useState(null);

  useEffect(() => {
    const fetchNetworkInfo = async () => {
      try {
        //Get public IP
        const ipResponse = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipResponse.json();
        setIpAddress(ipData.ip);
        //const testAddress = "8.8.8.8" //THIS IS A TESTING IP

        //Get location from ip-api.com
        //If you want to use the testing IP use change "ipData.ip" to "testAddress"
        const locationResponse = await fetch(`http://ip-api.com/json/${ipData.ip}`);
        const locationData = await locationResponse.json();

        if (locationData.country === "Australia") {
          setInAustralia(true);
          initializeFirebaseUser();
        } else {
          setInAustralia(false);
          router.replace("/accessDenied");
        }

      } catch (error) {
        console.error("Error getting network information:", error);
        router.replace("/accessDenied"); //navigate to access denied page if unable to get netwrok info
      }
    };

    fetchNetworkInfo();
  }, []);

  // Firebase + user initialization
  const initializeFirebaseUser = async () => {
    const app = initializeApp(firebaseConfig);
    getDatabase(app);
    console.log("Firebase initialized");

    const auth = getAuth();
    try {
      const userCredentials = await fetchUser();

      if (!userCredentials) {
        router.replace("/(auth)/login");
        return;
      }

      const { email, pwd } = userCredentials;

      if (email && pwd) {
        const user = await signInWithEmailAndPassword(auth, email, pwd);
        if (user.user) {
          console.log("User signed in:", user.user.email);
          router.replace("/(drawer)");
        } else {
          router.replace("/(auth)/login");
        }
      }
    } catch (error) {
      console.error("Error during user initialization:", error.message);
      router.replace("/(auth)/login");
    }
  };

  // Function to fetch user credentials from AsyncStorage
  async function fetchUser() {
    try {
      const userCredentials = await AsyncStorage.getItem("USERCREDENTIALS");

      if (userCredentials) {
        const parsedCredentials = JSON.parse(userCredentials);

        // Ensure parsedCredentials is an object with email and pwd
        if (parsedCredentials.email && parsedCredentials.pwd) {
          return parsedCredentials;
        }
      }
    } catch (error) {
      console.error("Error fetching user credentials:", error.message);
    }
    return null; // Return null if no valid credentials are found
  }

  return (
    <View
      style={{
        backgroundColor: "#16519f",
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Image
        source={require("../assets/images/icon.png")}
        style={{ width: 300, height: 300 }}
      />
      <Text style={{ color: "#fff", fontSize: 30 }}>Coffee Meets Careers</Text>
    </View>
  );
}
