import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from "expo-router";

export default function Notifications() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      {/* Removed the extra notifications text at the top */}
      <View className="flex-row justify-between items-center px-5 pt-12 pb-4 border-b border-gray-100">
        <Text className="text-xl font-bold">Notifications</Text>
        <View className="flex-row">
          <TouchableOpacity className="mr-4">
            <Ionicons name="settings-outline" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color="black" />
            <View className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1">
        <View className="px-5 py-4">
          <Text className="text-lg font-semibold mb-4">Active Alerts</Text>

          {/* Critical pH Alert */}
          <View className="mb-4 bg-white border border-gray-200 rounded-lg p-4">
            <View className="flex-row items-start">
              <View className="w-3 h-3 rounded-full bg-red-500 mt-1 mr-2" />
              <View className="flex-1">
                <Text className="font-semibold text-red-500">[Critical] pH Level Critical</Text>
                <Text className="text-gray-600 mb-3">pH: 7.0 (10:30 AM)</Text>
                <View className="flex-row">
                  <TouchableOpacity className="flex-row items-center mr-4">
                    <Ionicons name="time-outline" size={18} color="gray" />
                    <Text className="ml-1 text-gray-600">Snooze</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="flex-row items-center mr-4">
                    <Ionicons name="checkmark-outline" size={18} color="gray" />
                    <Text className="ml-1 text-gray-600">Dismiss</Text>
                  </TouchableOpacity>
                  <TouchableOpacity>
                    <Ionicons name="close-outline" size={18} color="gray" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Warning Water Level */}
          <View className="mb-4 bg-white border border-gray-200 rounded-lg p-4">
            <View className="flex-row items-start">
              <View className="w-3 h-3 rounded-full bg-orange-400 mt-1 mr-2" />
              <View className="flex-1">
                <Text className="font-semibold text-orange-400">[Warning] Water Level Low</Text>
                <Text className="text-gray-600 mb-3">Water Level: 8cm (9:45 AM)</Text>
                <View className="flex-row">
                  <TouchableOpacity className="flex-row items-center mr-4">
                    <Ionicons name="time-outline" size={18} color="gray" />
                    <Text className="ml-1 text-gray-600">Snooze</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="flex-row items-center mr-4">
                    <Ionicons name="checkmark-outline" size={18} color="gray" />
                    <Text className="ml-1 text-gray-600">Dismiss</Text>
                  </TouchableOpacity>
                  <TouchableOpacity>
                    <Ionicons name="close-outline" size={18} color="gray" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Warning Ammonia Level */}
          <View className="mb-4 bg-white border border-gray-200 rounded-lg p-4">
            <View className="flex-row items-start">
              <View className="w-3 h-3 rounded-full bg-orange-400 mt-1 mr-2" />
              <View className="flex-1">
                <Text className="font-semibold text-orange-400">[Warning] Ammonia Level Rising</Text>
                <Text className="text-gray-600 mb-3">Ammonia: 0.25ppm (7:15 AM)</Text>
                <View className="flex-row">
                  <TouchableOpacity className="flex-row items-center mr-4">
                    <Ionicons name="time-outline" size={18} color="gray" />
                    <Text className="ml-1 text-gray-600">Snooze</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="flex-row items-center mr-4">
                    <Ionicons name="checkmark-outline" size={18} color="gray" />
                    <Text className="ml-1 text-gray-600">Dismiss</Text>
                  </TouchableOpacity>
                  <TouchableOpacity>
                    <Ionicons name="close-outline" size={18} color="gray" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Add some bottom padding to account for the tab bar */}
        <View className="h-24" />
      </ScrollView>
    </SafeAreaView>
  );
}