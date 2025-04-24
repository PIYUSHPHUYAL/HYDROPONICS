import { View, Text, TouchableOpacity, SafeAreaView, Alert, ScrollView, TextInput } from "react-native"
import { useState, useEffect } from "react"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { database, ref, onValue, set, query, limitToLast, orderByKey } from "./firebase"
import SuggestionSection from "../suggestion-section" // Import the new component

const Control = () => {
  const router = useRouter()
  const [pumpStatus, setPumpStatus] = useState(false)
  const [pumpLoading, setPumpLoading] = useState(false)
  const [waterLevel, setWaterLevel] = useState(0)
  const [pumpMode, setPumpMode] = useState("auto") // 'auto', 'manual'
  const [pumpDuration, setPumpDuration] = useState(15) // minutes

  useEffect(() => {
    // Reference to the pump status
    const pumpStatusRef = ref(database, "pumpStatus")

    // Reference to the readings node
    const readingsRef = ref(database, "readings")

    // Create a query to get only the latest reading
    const latestReadingQuery = query(readingsRef, orderByKey(), limitToLast(1))

    // Set up the listener for pump status
    const pumpUnsubscribe = onValue(
      pumpStatusRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setPumpStatus(snapshot.val())
        } else {
          // If no status exists yet, assume it's off
          setPumpStatus(false)
        }
      },
      (error) => {
        console.error("Pump status error:", error)
      },
    )

    // Set up the listener for the latest reading
    const readingsUnsubscribe = onValue(
      latestReadingQuery,
      (snapshot) => {
        if (snapshot.exists()) {
          // Since we're using limitToLast(1), there should only be one child
          snapshot.forEach((childSnapshot) => {
            // Get the distance value from the child
            const distanceValue = childSnapshot.child("distance").val()
            if (distanceValue !== null && distanceValue !== undefined) {
              setWaterLevel(distanceValue)
            }
          })
        }
      },
      (error) => {
        console.error("Readings error:", error)
      },
    )

    // Clean up the listeners
    return () => {
      pumpUnsubscribe()
      readingsUnsubscribe()
    }
  }, [])

  const togglePump = async () => {
    try {
      setPumpLoading(true)
      await set(ref(database, "pumpCommand"), !pumpStatus)
      Alert.alert("Pump Control", `Turning pump ${!pumpStatus ? "ON" : "OFF"}...`, [{ text: "OK" }])
    } catch (error) {
      console.error("Error toggling pump:", error)
      Alert.alert("Error", "Failed to control the pump. Please try again.")
    } finally {
      setPumpLoading(false)
    }
  }

  const runPump = async () => {
    try {
      setPumpLoading(true)
      await set(ref(database, "pumpCommand"), true)
      await set(ref(database, "pumpDuration"), pumpDuration)
      Alert.alert("Pump Control", `Running pump for ${pumpDuration} minutes...`, [{ text: "OK" }])
    } catch (error) {
      console.error("Error running pump:", error)
      Alert.alert("Error", "Failed to run the pump. Please try again.")
    } finally {
      setPumpLoading(false)
    }
  }

  const goToNotifications = () => {
    router.push("/notifications")
  }

  // Determine water level status and color based on distance readings
  const getWaterLevelInfo = () => {
    if (waterLevel > 100) {
      return {
        status: "Full",
        percentage: 100,
        color: "bg-green-500",
        textColor: "text-green-500",
        icon: "water-outline",
      }
    } else if (waterLevel === 6 || waterLevel === 3) {
      return {
        status: "75% Full",
        percentage: 75,
        color: "bg-blue-500",
        textColor: "text-blue-500",
        icon: "water-outline",
      }
    } else {
      return {
        status: "Empty",
        percentage: 0,
        color: "bg-red-500",
        textColor: "text-red-500",
        icon: "water-outline",
      }
    }
  }

  const waterLevelInfo = getWaterLevelInfo()

  // Handle pump mode change
  const handlePumpModeChange = (mode) => {
    setPumpMode(mode)
  }

  // Handle duration change
  const handleDurationChange = (value) => {
    setPumpDuration(Math.max(1, Math.min(60, Number.parseInt(value) || 1)))
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View style={{ position: 'absolute', top: 63, right: 17.5, zIndex: 10 }}>
        <TouchableOpacity onPress={() => router.push("/notifications")}>
          <Ionicons name="notifications-outline" size={24} color="black" />
          <View className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
        </TouchableOpacity>
      </View>
      <Text className="text-2xl font-bold text-center mb-6 my-4">System Controls</Text>

        {/* Water Level Indicator Card */}
        <View className="mx-5 mb-4 rounded-xl overflow-hidden bg-white shadow-md border border-gray-100">
          <View className="p-5">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-gray-800 text-lg font-bold">Water Level</Text>
              <View className={`px-3 py-1 rounded-full ${waterLevelInfo.color}`}>
                <Text className="text-white font-medium text-xs">{waterLevelInfo.status}</Text>
              </View>
            </View>

            <View className="h-6 bg-gray-200 rounded-full overflow-hidden">
              <View className={`h-full ${waterLevelInfo.color}`} style={{ width: `${waterLevelInfo.percentage}%` }} />
            </View>

            <View className="flex-row justify-between mt-2">
              <View className="flex-row items-center">
                <Ionicons
                  name={waterLevelInfo.icon}
                  size={18}
                  color={waterLevelInfo.color.replace("bg-", "").replace("-500", "")}
                />
                <Text className={`ml-1 ${waterLevelInfo.textColor}`}>{waterLevelInfo.percentage}%</Text>
              </View>
              <Text className="text-gray-500 text-xs">Reading: {waterLevel}</Text>
            </View>
          </View>
        </View>

        {/* Water Pump Control Card */}
        <View className="mx-5 mb-4 rounded-xl overflow-hidden bg-white shadow-md border border-gray-100">
          <View className="p-5">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <Ionicons name="water" size={20} color="#3b82f6" />
                <Text className="text-gray-800 text-lg font-bold ml-2">Water Pump Control</Text>
              </View>
              <View className="flex-row items-center">
                <View className={`h-3 w-3 rounded-full ${pumpStatus ? "bg-green-500" : "bg-gray-400"} mr-2`}></View>
                <Text className="text-sm text-gray-600">{pumpStatus ? "Running" : "Idle"}</Text>
              </View>
            </View>

            {/* Main Pump Toggle */}
            <View className="flex-row justify-between items-center mb-4 bg-blue-50 p-3 rounded-lg">
              <View>
                <Text className="text-base font-medium">Pump Power</Text>
                <Text className="text-sm text-gray-500">Turn the water pump on or off</Text>
              </View>
              <TouchableOpacity
                onPress={togglePump}
                disabled={pumpLoading}
                className={`rounded-full p-3 ${pumpStatus ? "bg-red-500" : "bg-green-500"}`}
              >
                <Ionicons name={pumpStatus ? "power" : "power-outline"} size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Duration Control (only shown in manual mode) */}
            {pumpMode === "manual" && (
              <View className="mb-4">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm font-medium">Duration (minutes)</Text>
                  <Text className="text-sm font-medium">{pumpDuration} min</Text>
                </View>
                <View className="flex-row items-center">
                  <View className="flex-1 h-2 bg-gray-200 rounded-full mr-3">
                    <View
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${(pumpDuration / 60) * 100}%` }}
                    />
                  </View>
                  <TextInput
                    className="w-16 h-10 border border-gray-300 rounded-md text-center"
                    keyboardType="number-pad"
                    value={pumpDuration.toString()}
                    onChangeText={handleDurationChange}
                  />
                </View>

                {/* Run Pump Button */}
                <TouchableOpacity
                  className="mt-4 py-3 bg-blue-500 rounded-lg items-center"
                  onPress={runPump}
                  disabled={pumpLoading}
                >
                  <Text className="text-sm font-medium text-white">Run Pump</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        <ScrollView>
        {/* Farmer's Guide Section (replacing Parameter Thresholds) */}
        <SuggestionSection />
      </ScrollView>
    </SafeAreaView>
  )
}

export default Control