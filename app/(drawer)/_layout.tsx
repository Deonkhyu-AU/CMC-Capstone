import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import Feather from '@expo/vector-icons/Feather';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/initiliaze';
import { router } from 'expo-router';

export default function DrawerLayout() {
    const [userType, setUserType] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUserType() {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) {
                    router.replace("/(auth)/login");
                    return;
                }
                if (session?.user?.email) {
                    const { data: userData } = await supabase
                        .from("users")
                        .select("user_type")
                        .eq("email", session.user.email)
                        .single();
                    
                    if (userData?.user_type) {
                        console.log("Drawer Layout - User Type detected:", userData.user_type);
                        setUserType(userData.user_type);
                    }
                }
            } catch (error) {
                console.log("Error fetching user type:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchUserType();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            fetchUserType();
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);
    return (

            <Drawer
                screenOptions={{
                    headerShown: true,
                    drawerStyle: {
                        backgroundColor: "#f9fafb",
                        borderTopRightRadius: 24,
                        borderBottomRightRadius: 24,
                        width: 260,
                        shadowColor: "#000",
                        shadowOpacity: 0.08,
                        shadowRadius: 8,
                        elevation: 4,
                    },
                    overlayColor: "rgba(211, 211, 211, 0.35)",
                    drawerActiveTintColor: "#f07e74",
                    drawerInactiveTintColor: "#222",
                    drawerActiveBackgroundColor: "#fbeaea",
                    drawerLabelStyle: {
                        fontSize: 18,
                        fontWeight: "600",
                        marginLeft: -8,
                    },
                    drawerItemStyle: {
                        borderRadius: 12,
                        marginVertical: 4,
                    },
                }}
            >
                <Drawer.Screen 
                    name="(tabs)" 
                    options={{
                        drawerLabel: "Home Page",
                        title: "Home",
                        drawerIcon: ({ color, size }) => (
                            <Feather name="home" size={size} color={color} />
                        ),
                    }}
                />
                <Drawer.Screen 
                    name="findmentors" 
                    options={{
                        drawerLabel: "Explore",
                        title: "Find Mentors",
                        drawerIcon: ({ color, size }) => (
                            <Feather name="search" size={24} color={color} />
                        ),
                    }}
                />
                <Drawer.Screen 
                    name="cybermatch" 
                    options={{
                        drawerLabel: "Cyber Match",
                        title: "Cyber Match",
                        drawerIcon: ({ color, size }) => (
                            <Feather name="shield" size={24} color={color} />
                        ),
                        // Hide from drawer if user is a mentor
                        drawerItemStyle: (!loading && userType?.toLowerCase() === "mentor") 
                            ? { height: 0, overflow: 'hidden', marginVertical: 0 } 
                            : { borderRadius: 12, marginVertical: 4 },
                    }}
                />
            </Drawer>
    );
}