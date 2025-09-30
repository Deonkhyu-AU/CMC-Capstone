import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { supabase } from "@/lib/supabase/initiliaze";
import { router } from "expo-router";

type Friend = {
  id: number;
  name: string;
  email: string;
  user_type: string;
  auth_id: string; // UUID from Supabase Auth
  status: string;
};

export default function Friends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentAuthId, setCurrentAuthId] = useState<string | null>(null);
  const [blockedByMe, setBlockedByMe] = useState<string[]>([]);
  const [blockedMe, setBlockedMe] = useState<string[]>([]);

  //  Get logged-in user's info
  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setCurrentUserEmail(user.email ?? null);
        setCurrentAuthId(user.id);
      } catch (err: any) {
        console.error("Error fetching user:", err);
        Alert.alert("Error", "Failed to fetch current user.");
        setCurrentAuthId(null);
      }
    }
    fetchCurrentUser();
  }, []);

  //  Fetch blocked users (mutual check: separate by direction)
  useEffect(() => {
    if (!currentAuthId) return;

    async function fetchBlocked() {
      try {
        const { data: blocksData, error } = await supabase
          .from("blocks")
          .select("blocker_user_id, blocked_user_id")
          .or(`blocker_user_id.eq.${currentAuthId},blocked_user_id.eq.${currentAuthId}`);

        if (error) {
          setBlockedByMe([]);
          setBlockedMe([]);
          return;
        }

        const byMe: string[] = [];
        const meBlockedBy: string[] = [];

        blocksData?.forEach((b: any) => {
          if (b.blocker_user_id === currentAuthId) byMe.push(b.blocked_user_id);
          if (b.blocked_user_id === currentAuthId) meBlockedBy.push(b.blocker_user_id);
        });

        setBlockedByMe(byMe);
        setBlockedMe(meBlockedBy);
      } catch (err: any) {
        console.error("Error fetching blocked users:", err);
        setBlockedByMe([]);
        setBlockedMe([]);
      }
    }

    fetchBlocked();
  }, [currentAuthId]);

  //  Fetch users with approved mentorship requests
  useEffect(() => {
    async function fetchFriends() {
      if (!currentUserEmail || !currentAuthId) return;

      try {
        const { data: currentUserData, error: currentUserError } = await supabase
          .from("users")
          .select("id, user_type")
          .eq("email", currentUserEmail)
          .single();

        if (currentUserError || !currentUserData) {
          throw new Error("Could not find current user");
        }

        let approvedFriends: Friend[] = [];

        if (currentUserData.user_type === "Mentor") {
          const { data: mentorData } = await supabase
            .from("mentors")
            .select("mentorid")
            .eq("user_id", currentAuthId)
            .single();

          if (!mentorData) {
            setFriends([]);
            return;
          }

          const { data: requestsData } = await supabase
            .from("mentorship_requests")
            .select("mentee_id, status")
            .eq("mentor_id", mentorData.mentorid)
            .eq("status", "Accepted");

          if (!requestsData || requestsData.length === 0) {
            setFriends([]);
            return;
          }

          const menteePromises = requestsData.map(async (req) => {
            try {
              const { data: menteeData } = await supabase
                .from("mentees")
                .select("user_id")
                .eq("menteeid", req.mentee_id)
                .single();
              if (!menteeData) return null;

              const { data: userData } = await supabase
                .from("users")
                .select("id, name, email, user_type, auth_user_id")
                .eq("auth_user_id", menteeData.user_id)
                .single();
              if (!userData) return null;

              return {
                id: userData.id,
                name: userData.name ?? "Unknown User",
                email: userData.email ?? "",
                user_type: userData.user_type ?? "Student",
                auth_id: userData.auth_user_id,
                status: req.status,
              };
            } catch {
              return null;
            }
          });

          const menteeResults = await Promise.all(menteePromises);
          approvedFriends = menteeResults.filter(Boolean) as Friend[];
        } else {
          const { data: menteeData } = await supabase
            .from("mentees")
            .select("menteeid")
            .eq("user_id", currentAuthId)
            .single();

          if (!menteeData) {
            setFriends([]);
            return;
          }

          const { data: requestsData } = await supabase
            .from("mentorship_requests")
            .select("mentor_id, status")
            .eq("mentee_id", menteeData.menteeid)
            .eq("status", "Accepted");

          if (!requestsData || requestsData.length === 0) {
            setFriends([]);
            return;
          }

          const mentorPromises = requestsData.map(async (req) => {
            try {
              const { data: mentorData } = await supabase
                .from("mentors")
                .select("user_id")
                .eq("mentorid", req.mentor_id)
                .single();
              if (!mentorData) return null;

              const { data: userData } = await supabase
                .from("users")
                .select("id, name, email, user_type, auth_user_id")
                .eq("auth_user_id", mentorData.user_id)
                .single();
              if (!userData) return null;

              return {
                id: userData.id,
                name: userData.name ?? "Unknown User",
                email: userData.email ?? "",
                user_type: userData.user_type ?? "Mentor",
                auth_id: userData.auth_user_id,
                status: req.status,
              };
            } catch {
              return null;
            }
          });

          const mentorResults = await Promise.all(mentorPromises);
          approvedFriends = mentorResults.filter(Boolean) as Friend[];
        }

        setFriends(approvedFriends);
      } catch (err: any) {
        console.error("Error fetching approved mentorship connections:", err);
        Alert.alert("Error", "Failed to fetch your mentorship connections.");
      }
    }

    fetchFriends();
  }, [currentUserEmail, currentAuthId]);

  //  Handle block/unblock (only blocker can unblock)
  async function toggleBlock(friend: Friend) {
    if (!currentAuthId) return;

    const isBlockedByMe = blockedByMe.includes(friend.auth_id);

    if (isBlockedByMe) {
      // Only allow unblock if current user is the blocker
      const { error } = await supabase
        .from("blocks")
        .delete()
        .eq("blocker_user_id", currentAuthId)
        .eq("blocked_user_id", friend.auth_id);

      if (error) {
        console.error("Unblock error:", error.message);
        Alert.alert("Error", "Failed to unblock the user.");
        return;
      }

      setBlockedByMe((prev) => prev.filter((id) => id !== friend.auth_id));
      Alert.alert("Success", `${friend.name} has been unblocked.`);
    } else {
      const { error } = await supabase.from("blocks").insert([
        {
          blocker_user_id: currentAuthId,
          blocked_user_id: friend.auth_id,
          blocked_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error("Insert block error:", error.message);
        Alert.alert("Error", "Failed to block the user.");
        return;
      }

      setBlockedByMe((prev) => [...prev, friend.auth_id]);
      Alert.alert("Success", `${friend.name} has been blocked.`);
    }
  }

  //  Show dropdown menu with Block/Unblock and Write Testimonial
  function showActionMenu(friend: Friend) {
    const isBlockedByMe = blockedByMe.includes(friend.auth_id);
    Alert.alert(
      friend.name,
      "Choose an action.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Write Testimonial",
          onPress: () => {
            router.push({
              pathname: "../../writeTestimonials",
              params: { userId: friend.id, userName: friend.name },
            });
          },
        },
        {
          text: isBlockedByMe ? "Unblock User" : "Block User",
          onPress: () => toggleBlock(friend),
          style: "destructive",
        },
      ]
    );
  }

  //  Handle chat tap with user-specific message
  function handleChat(friend: Friend) {
    if (blockedByMe.includes(friend.auth_id)) {
      Alert.alert("Chat Disabled", "You have blocked this user. Unblock to chat.");
      return;
    }

    if (blockedMe.includes(friend.auth_id)) {
      Alert.alert("Chat Disabled", "You cannot chat with this user.");
      return;
    }

    router.push({ pathname: "/chat", params: { userId: friend.id, userName: friend.name } });
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>My Connections</Text>
      {friends.length === 0 ? (
        <Text style={styles.emptyText}>No approved mentorship connections yet.</Text>
      ) : (
        friends.map((friend) => (
          <View key={`${friend.user_type}_${friend.id}`} style={styles.card}>
            <TouchableOpacity
              style={{ flex: 1, flexDirection: "row", alignItems: "center" }}
              onPress={() => handleChat(friend)}
            >
              <Text style={styles.avatar}>{friend.name[0]?.toUpperCase()}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{friend.name}</Text>
                <Text style={styles.email}>{friend.email}</Text>
                <View style={{ flexDirection: "row", alignItems: 'center', marginTop: 2 }}>
                  <Text style={styles.userType}>{friend.user_type}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>✓ {friend.status}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => showActionMenu(friend)} style={{ padding: 8 }}>
              <Text style={{ fontSize: 20 }}>⋮</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6", paddingTop: 32, paddingHorizontal: 16 },
  header: { fontSize: 26, fontWeight: "bold", marginBottom: 18, color: "#222", letterSpacing: 0.5 },
  emptyText: { textAlign: "center", color: "#888", marginTop: 40, fontSize: 16 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2563eb",
    color: "#fff",
    fontWeight: "bold",
    fontSize: 20,
    textAlign: "center",
    textAlignVertical: "center",
    marginRight: 16,
    overflow: "hidden",
    lineHeight: 44,
  },
  name: { fontSize: 17, fontWeight: "600", color: "#222" },
  email: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  userType: { fontSize: 11, color: "#9ca3af", marginTop: 1, fontWeight: "500", marginRight: 8 },
  statusBadge: {
    backgroundColor: "#dcfce7",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 10,
    color: "#166534",
    fontWeight: "600",
  },
});
