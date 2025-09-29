import { useState } from "react";
import { getPIN } from '@/lib/storage';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    ActivityIndicator // Added for loading state
} from "react-native";
// Adjust the import path if you moved loginUser.js
import loginUser from '@/lib/firebase/loginUser'; // Or your new path for the Supabase-only login function
import { useRouter } from "expo-router";

export default function LoginScreen() { // Changed component name to LoginScreen for clarity

    const [email, setEmail] = useState<string>(''); // Use string, not String
    const [pwd, setPwd] = useState<string>('');   // Use string, not String
    const [message, setMessage] = useState<string>(''); // Use string, not String
    const [isLoading, setIsLoading] = useState(false); // Loading state
    const router = useRouter();

    async function handleForm() {
        if (!email || !pwd) {
            setMessage("Please enter both email and password.");
            return;
        }
        setIsLoading(true);
        setMessage(''); // Clear previous messages

        const result = await loginUser(email, pwd);
        console.log("Login result:", result); // Log the result for debugging
        setIsLoading(false);


        if (result === true) {
            const pin = await getPIN();
            if (pin) {
                // Existing user with PIN
                router.replace("/pin");
            } else {
                // Existing user without PIN
                router.replace("/(drawer)/(tabs)/home");
            }
        } else {
            setMessage(result as string);
        }



    }

    function navigateToRegister() {
        if (isLoading) return;
        router.replace("/register");
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
            className="flex-1 bg-white"
        >
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} // Added justifyContent
                keyboardShouldPersistTaps="handled"
                className="px-4" // Added some horizontal padding
            >
                <View className="items-center">
                    <Text className="text-4xl font-bold font-Title text-black text-center pt-5 pb-8">
                        Coffee Meets Careers
                    </Text>
                    <Text className="text-3xl font-Menu text-center mb-2">Login</Text>
                    <Text className="text-lg font-Menu text-center text-gray-600 pb-10">
                        Sign in to continue
                    </Text>
                </View>

                <View className="mb-6 mx-6">
                    <Text className="text-base font-bold font-Menu text-gray-700 mb-1">Email</Text>
                    <View className="flex-row items-center bg-gray-100 border border-gray-300 px-4 rounded-lg h-14">
                        <TextInput
                            className="flex-1 text-base font-Text text-gray-800"
                            placeholder="someone@example.com"
                            onChangeText={(text) => setEmail(text)}
                            value={email}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={!isLoading}
                        />
                    </View>
                </View>

                <View className="mb-8 mx-6">
                    <Text className="text-base font-bold font-Menu text-gray-700 mb-1">Password</Text>
                    <View className="flex-row items-center bg-gray-100 border border-gray-300 px-4 rounded-lg h-14">
                        <TextInput
                            className="flex-1 text-base font-Text text-black"
                            secureTextEntry={true}
                            placeholder="Password"
                            onChangeText={(text) => setPwd(text)}
                            value={pwd}
                            editable={!isLoading}
                        />
                    </View>
                </View>

                <View className="mx-6 mb-8">
                    <TouchableOpacity
                        onPress={handleForm}
                        disabled={isLoading}
                        className={`flex-row bg-primary px-4 rounded-lg h-14 items-center justify-center ${isLoading ? "opacity-50" : ""}`}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-xl font-Menu text-white font-medium">Log In</Text>
                        )}
                    </TouchableOpacity>
                    {message && (
                        <Text className="text-center text-red-600 mt-4 text-sm px-2">
                            {message}
                        </Text>
                    )}
                </View>

                <View className="items-center pb-10">
                    <TouchableOpacity onPress={navigateToRegister} disabled={isLoading}>
                        <Text className="text-base font-Menu text-center text-gray-500">
                            Don't have an account? <Text className="text-primary font-semibold">Register</Text>
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={()=> router.replace ("/pin")} disabled={isLoading} className="mt-4">
                        <Text className="text-base font-Menu text-center text-gray-500">
                            Login with <Text className="text-primary font-semibold">PIN</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
        
    );
}