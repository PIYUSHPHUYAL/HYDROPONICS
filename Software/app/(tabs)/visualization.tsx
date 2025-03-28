import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const Visualization = () => {
  const router = useRouter();

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

      {/* Empty content */}
      <View className="flex-1"></View>
    </SafeAreaView>
  );
};

export default Visualization;