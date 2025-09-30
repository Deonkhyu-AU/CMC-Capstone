import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../lib/supabase/initiliaze";

export default function WriteTestimonials() {
  const { userId, userName } = useLocalSearchParams<{ userId: string; userName: string }>();
  const router = useRouter();
  const [testimonial, setTestimonial] = useState("");

  const handleSubmit = async () => {
    if (!testimonial.trim()) {
      Alert.alert("Error", "Please write a testimonial before submitting.");
      return;
    }

    try {
      const { error } = await supabase.from("testimonials").insert([
        {
          target_user: userId,
          content: testimonial.trim(),
        },
      ]);

      if (error) throw error;

      Alert.alert("Success", "Your testimonial has been submitted!");
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Something went wrong.");
    }
  };

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-xl font-bold text-gray-900 mb-4">
        Write a Testimonial for {userName}
      </Text>

      <TextInput
        className="border border-gray-300 rounded-lg p-3 h-40 text-base text-gray-800"
        placeholder="Write your testimonial here..."
        placeholderTextColor="#9ca3af"
        value={testimonial}
        onChangeText={setTestimonial}
        multiline
      />

      <TouchableOpacity
        onPress={handleSubmit}
        className="bg-blue-600 rounded-xl py-3 px-4 mt-4"
      >
        <Text className="text-center text-white text-base font-semibold">Submit</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.back()}
        className="mt-2 py-2"
      >
        <Text className="text-center text-blue-600 text-sm">Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}