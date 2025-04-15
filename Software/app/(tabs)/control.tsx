import { View, Text, TouchableOpacity, SafeAreaView, Alert } from "react-native"
import { useState, useEffect } from "react"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { database, ref, onValue, set, query, limitToLast, orderByKey } from "./firebase"

const Control = () => {
  const router = useRouter()
  const [pumpStatus, setPumpStatus] = useState(false)
  const [pumpLoading, setPumpLoading] = useState(false)
  const [waterLevel, setWaterLevel] = useState(0)

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

      // Set the command in Firebase to toggle the pump
      await set(ref(database, "pumpCommand"), !pumpStatus)

      // Show feedback to the user
      Alert.alert("Pump Control", `Turning pump ${!pumpStatus ? "ON" : "OFF"}...`, [{ text: "OK" }])
    } catch (error) {
      console.error("Error toggling pump:", error)
      Alert.alert("Error", "Failed to control the pump. Please try again.")
    } finally {
      setPumpLoading(false)
    }
  }

  const goToNotifications = () => {
    router.push("/notifications")
  }

  // Determine water level status and color
  const getWaterLevelInfo = () => {
    if (waterLevel > 2000) {
      return {
        status: "Full",
        percentage: 100,
        color: "bg-green-500",
        textColor: "text-green-500",
        icon: "water-full",
      }
    } else if (waterLevel === 2 || waterLevel === 3) {
      return {
        status: "75% Full",
        percentage: 75,
        color: "bg-blue-500",
        textColor: "text-blue-500",
        icon: "water",
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

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View style={{ position: "absolute", top: 63, right: 17.5, zIndex: 10 }}>
        <TouchableOpacity onPress={goToNotifications}>
          <Ionicons name="notifications-outline" size={24} color="black" />
          <View className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></View>
        </TouchableOpacity>
      </View>

      {/* Water Level Indicator Card */}
      <View className="mx-5 mt-20 rounded-xl overflow-hidden bg-white shadow-lg border border-gray-100">
        <View className="p-5">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-gray-800 text-xl font-bold">Water Level</Text>
            <View className={`px-3 py-1 rounded-full ${waterLevelInfo.color}`}>
              <Text className="text-white font-medium">{waterLevelInfo.status}</Text>
            </View>
          </View>

          <View className="h-8 bg-gray-200 rounded-full overflow-hidden">
            <View className={`h-full ${waterLevelInfo.color}`} style={{ width: `${waterLevelInfo.percentage}%` }} />
          </View>

          <View className="flex-row justify-between mt-2">
            <View className="flex-row items-center">
              <Ionicons
                size={20}
                color={waterLevelInfo.color.replace("bg-", "").replace("-500", "")}
              />
              <Text className={`ml-1 ${waterLevelInfo.textColor}`}>{waterLevelInfo.percentage}%</Text>
            </View>
            <Text className="text-gray-500 text-sm">Reading: {waterLevel}</Text>
          </View>
        </View>
      </View>

      {/* Water Pump Control Card */}
      <View className="mx-5 mt-6 rounded-xl overflow-hidden bg-blue-700">
        <View className="p-5">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-white text-xl font-bold mb-1">Water Pump</Text>
              <Text className="text-white opacity-90">{pumpStatus ? "Currently: Running" : "Currently: Stopped"}</Text>
            </View>
            <TouchableOpacity
              onPress={togglePump}
              disabled={pumpLoading}
              className={`rounded-full p-3 ${pumpStatus ? "bg-red-500" : "bg-green-500"}`}
            >
              <Ionicons name={pumpStatus ? "power" : "power-outline"} size={28} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>


      <View className="flex-1"></View>
    </SafeAreaView>
  )
}

export default Control
