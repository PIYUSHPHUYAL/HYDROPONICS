import { View, Text, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { database, ref, onValue, set } from './firebase';

const Control = () => {
  const router = useRouter();
  const [pumpStatus, setPumpStatus] = useState(false);
  const [pumpLoading, setPumpLoading] = useState(false);

  useEffect(() => {
    // Reference to the pump status
    const pumpStatusRef = ref(database, 'pumpStatus');

    // Set up the listener for pump status
    const pumpUnsubscribe = onValue(pumpStatusRef, (snapshot) => {
      if (snapshot.exists()) {
        setPumpStatus(snapshot.val());
      } else {
        // If no status exists yet, assume it's off
        setPumpStatus(false);
      }
    }, (error) => {
      console.error("Pump status error:", error);
    });

    // Clean up the listeners
    return () => {
      pumpUnsubscribe();
    };
  }, []);

  const togglePump = async () => {
    try {
      setPumpLoading(true);

      // Set the command in Firebase to toggle the pump
      await set(ref(database, 'pumpCommand'), !pumpStatus);

      // Show feedback to the user
      Alert.alert(
        "Pump Control",
        `Turning pump ${!pumpStatus ? "ON" : "OFF"}...`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error toggling pump:", error);
      Alert.alert("Error", "Failed to control the pump. Please try again.");
    } finally {
      setPumpLoading(false);
    }
  };

  const goToNotifications = () => {
    router.push("/notifications");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View style={{ position: 'absolute', top: 63, right: 17.5,  zIndex: 10 }}>
        <TouchableOpacity onPress={goToNotifications}>
          <Ionicons name="notifications-outline" size={24} color="black" />
          <View className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></View>
        </TouchableOpacity>
      </View>


      {/* Water Pump Control Card */}
      <View className="mx-5 mt-20 rounded-xl overflow-hidden bg-blue-700">
        <View className="p-5">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-white text-xl font-bold mb-1">Water Pump</Text>
              <Text className="text-white opacity-90">
                {pumpStatus ? "Currently: Running" : "Currently: Stopped"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={togglePump}
              disabled={pumpLoading}
              className={`rounded-full p-3 ${pumpStatus ? 'bg-red-500' : 'bg-green-500'}`}
            >
              <Ionicons
                name={pumpStatus ? "power" : "power-outline"}
                size={28}
                color="white"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* You can add more controls here if needed */}
      <View className="flex-1"></View>
    </SafeAreaView>
  );
};

export default Control;