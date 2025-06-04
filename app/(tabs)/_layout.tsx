import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: 'blue', headerShown: false }}>
      <Tabs.Screen
        name="home" // This will look for a file at app/(tabs)/home.tsx or app/(tabs)/index.tsx
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications" // This will look for a file at app/(tabs)/notifications.tsx
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="bell" color={color} />,
        }}
      />
      <Tabs.Screen
        name="cybermatch" // This will look for a file at app/(tabs)/cybermatch.tsx
        options={{
          title: 'CyberMatch',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="users" color={color} />,
        }}
      />
      {/* Settings Tab */}
      <Tabs.Screen
        name="profile" // This will look for a file at app/(tabs)/settings.tsx
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name='user' color={color} />, 
        }}
      />
    </Tabs>
  );
}