import { Text, View, Image, TouchableOpacity, ScrollView, SafeAreaView } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from "expo-router";
import { useEffect, useState } from 'react';
import { database, ref, onValue } from './firebase'; // Import from your firebase.js file

export default function Index() {
  const router = useRouter();
  const [sensorData, setSensorData] = useState({
    pH: "--",
    nutrient: "ok",
    sunlight: "45%",
    EC: "--",
    moisture: "14%",
    temperature: "--",
    airHumidity: "--",
    airTemperature: "--"
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Reference to the readings node
    const readingsRef = ref(database, 'readings');

    // Set up the listener
    const unsubscribe = onValue(readingsRef, (snapshot) => {
      if (snapshot.exists()) {
        // Get the latest reading (assuming readings are ordered by timestamp)
        let latestReading = null;
        let latestTimestamp = 0;

        snapshot.forEach((childSnapshot) => {
          const key = parseInt(childSnapshot.key);
          if (key > latestTimestamp) {
            latestTimestamp = key;
            latestReading = childSnapshot.val();
          }
        });

        if (latestReading) {
          // Update the state with the fetched data
          setSensorData({
            pH: latestReading.pH?.toFixed(2) || "--",
            nutrient: "ok", // Keeping static
            sunlight: "45%", // Keeping static
            EC: latestReading.tds?.toFixed(0) || "--", // Using TDS as EC
            moisture: "14%", // Keeping static
            temperature: latestReading.waterTemperature?.toFixed(0) || "--",
            airHumidity: latestReading.airHumidity?.toFixed(0) || "--",
            airTemperature: latestReading.airTemperature?.toFixed(1) || "--"
          });
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Database error:", error);
      setLoading(false);
    });

    // Clean up the listener
    return () => unsubscribe();
  }, []);

  const goToNotifications = () => {
    router.push("/notifications");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

        {/* Header */}
        <View className="flex-row justify-between items-center px-5 pt-4 pb-2">
        <View style={{ transform: [{ translateX: 110 }] }} className="flex-row items-center">
          <Image
            source={require('../../assets12345/logo.png')}
            className="w-8 h-8 mr-2"
          />
          <Text className="text-lg font-semibold text-green-500">Hey Piyush!</Text>
        </View>
        <TouchableOpacity onPress={goToNotifications}>
          <Ionicons name="notifications-outline" size={24} color="black" />
          <View className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></View>
        </TouchableOpacity>
      </View>


        {/* Subtitle */}
        <Text className="text-center text-blue-900 font-medium px-5 mb-4">
          Monitor Water, Optimize Your Grow
        </Text>

        {/* Status indicator */}
        {loading ? (
          <Text className="text-center text-gray-500 mb-4">Loading sensor data...</Text>
        ) : null}

        {/* Tips Card */}
        <View className="mx-5 mb-5 rounded-xl overflow-hidden bg-green-800">
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTV8fHBsYW50JTIwbGVhZnxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=800&q=60' }}
            className="absolute w-full h-full opacity-40"
          />
          <View className="p-5">
            <Text className="text-white text-xl font-bold mb-1">Tips of the day</Text>
            <Text className="text-white opacity-90 mb-4">5 ways to keep your plant healthy</Text>
            <TouchableOpacity className="self-end bg-white bg-opacity-30 rounded-full p-1">
              <Ionicons name="play" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1">
        {/* Metrics Grid */}
        <View className="mx-5 mb-5">
          <View className="flex-row mb-4">
            {/* pH Level */}
            <View className="flex-1 mr-2 p-4 border border-gray-200 rounded-xl items-center">
              <View className="w-10 h-10 mb-3 items-center justify-center">
                <Ionicons name="water" size={28} color="#0088FF" />
              </View>
              <Text className="text-2xl font-bold">{sensorData.pH}</Text>
              <Text className="text-gray-500 text-sm">pH</Text>
            </View>

            {/* Nutrient Level */}
            <View className="flex-1 ml-2 p-4 border border-gray-200 rounded-xl items-center">
              <View className="w-10 h-10 mb-3 items-center justify-center">
                <Ionicons name="leaf-outline" size={28} color="#4CAF50" />
              </View>
              <Text className="text-2xl font-bold">{sensorData.nutrient}</Text>
              <Text className="text-gray-500 text-sm">nutrient</Text>
            </View>
          </View>

          <View className="flex-row mb-4">
            {/* Sunlight */}
            <View className="flex-1 mr-2 p-4 border border-gray-200 rounded-xl items-center">
              <View className="w-10 h-10 mb-3 items-center justify-center">
                <Ionicons name="sunny" size={28} color="#FFD700" />
              </View>
              <Text className="text-2xl font-bold">{sensorData.sunlight}</Text>
              <Text className="text-gray-500 text-sm">sunlight</Text>
            </View>

            {/* EC Level (using TDS value) */}
            <View className="flex-1 ml-2 p-4 border border-gray-200 rounded-xl items-center">
              <View className="w-10 h-10 mb-3 items-center justify-center">
                <Ionicons name="cube" size={28} color="#4CAF50" />
              </View>
              <Text className="text-2xl font-bold">{sensorData.EC}</Text>
              <Text className="text-gray-500 text-sm">EC</Text>
            </View>
          </View>

          <View className="flex-row">
            {/* Moisture */}
            <View className="flex-1 mr-2 p-4 border border-gray-200 rounded-xl items-center">
              <View className="w-10 h-10 mb-3 items-center justify-center">
                <Ionicons name="water-outline" size={28} color="#0088FF" />
              </View>
              <Text className="text-2xl font-bold">{sensorData.moisture}</Text>
              <Text className="text-gray-500 text-sm">moisture</Text>
            </View>

            {/* Temperature (water) */}
            <View className="flex-1 ml-2 p-4 border border-gray-200 rounded-xl items-center">
              <View className="w-10 h-10 mb-3 items-center justify-center">
                <Ionicons name="thermometer-outline" size={28} color="#FF9800" />
              </View>
              <Text className="text-2xl font-bold">{sensorData.temperature}°</Text>
              <Text className="text-gray-500 text-sm">temperature(H)</Text>
            </View>
          </View>
        </View>



        {/* Add some bottom padding to account for the tab bar */}
        <View className="h-24" />
      </ScrollView>
    </SafeAreaView>
  );
}