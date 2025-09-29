import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Alert, ScrollView } from "react-native";
import { supabase } from "@/lib/supabase/initiliaze";
import { router } from "expo-router";

export default function CyberMatchScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mentee, setMentee] = useState<any | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        // Check if user is logged in
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;

        if (!user) {
          // No session → redirect to login
          router.replace("/(auth)/login");
          return;
        }

        // Fetch user record
        const { data: userRecord, error: userError } = await supabase
          .from("users")
          .select("user_type")
          .eq("email", user.email)
          .single();

        if (userError) throw userError;

        if (!userRecord) {
          setError("User record not found");
          router.replace("/(auth)/login");
          return;
        }

        if (userRecord.user_type !== "Mentee") {
          // Not a mentee → redirect to access denied
          router.replace("/accessDenied");
          return;
        }

        // Load mentee profile
        const { data: menteeData, error: menteeError } = await supabase
          .from("mentees")
          .select("*")
          .eq("auth_user_id", user.id)
          .single();

        if (menteeError) throw menteeError;

        if (!menteeData) {
          setError("Please complete your mentee profile first.");
          return;
        }

        setMentee(menteeData);

        // Load mentors (limit 10)
        const { data: mentors, error: mentorError } = await supabase
          .from("mentors")
          .select("*")
          .eq("active", true)
          .limit(5);

        if (mentorError) throw mentorError;

        // Match calculation (your existing RPC + fallback logic here)
        const matchResults = await Promise.all(
          mentors.map(async (mentor: any) => {
            try {
              const { data: matchDetails } = await supabase.rpc("get_match_details", {
                mentee_id: menteeData.menteeid,
                mentor_id: mentor.mentorid,
              });

              return {
                ...mentor,
                compatibility_score: matchDetails?.compatibility_score ?? 0,
                compatibility_breakdown: matchDetails?.compatibility_breakdown ?? {},
              };
            } catch {
              // fallback compatibility (very simplified)
              const overlap =
                menteeData.skills?.filter((s: string) =>
                  mentor.skills?.includes(s)
                ).length ?? 0;

              return {
                ...mentor,
                compatibility_score: overlap * 10,
                compatibility_breakdown: { skills: overlap },
              };
            }
          })
        );

        // sort by score desc
        setMatches(matchResults.sort((a, b) => b.compatibility_score - a.compatibility_score));
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ marginTop: 10 }}>Loading matches...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Text style={{ color: "red", fontSize: 16, textAlign: "center" }}>{error}</Text>
      </View>
    );
  }

  if (!mentee) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>No mentee profile found.</Text>
      </View>
    );
  }

  if (matches.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>No mentors found. Please try again later.</Text>
      </View>
    );
  }

  const currentMatch = matches[currentIndex];

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 12 }}>
        Match {currentIndex + 1} of {matches.length}
      </Text>
      <View style={{ backgroundColor: "white", padding: 16, borderRadius: 12, marginBottom: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: "700" }}>{currentMatch.mentor_name}</Text>
        <Text style={{ marginTop: 6 }}>Compatibility: {currentMatch.compatibility_score}%</Text>
        {currentMatch.compatibility_breakdown && (
          <Text style={{ marginTop: 4, fontSize: 12, color: "#6B7280" }}>
            {JSON.stringify(currentMatch.compatibility_breakdown)}
          </Text>
        )}
      </View>
      <Text style={{ color: "#6B7280", textAlign: "center" }}>
        Swipe or use buttons to move between matches
      </Text>
    </ScrollView>
  );
}