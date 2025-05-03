import React, { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, Modal, Alert } from "react-native"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { database, ref, onValue } from "./(tabs)/firebase"
import { Ionicons } from "@expo/vector-icons"

interface SystemScoreProps {
  onScoreChange?: (totalScore: number) => void
}

interface ReadingScores {
  ph: number
  tds: number
  waterTemp: number
  airTemp: number
  humidity: number
  lightIntensity: number
  total: number
}

const SystemScore = ({ onScoreChange }: SystemScoreProps) => {
  const [readings, setReadings] = useState<any>(null)
  const [scores, setScores] = useState<ReadingScores>({
    ph: 0,
    tds: 0,
    waterTemp: 0,
    airTemp: 0,
    humidity: 0,
    lightIntensity: 0,
    total: 0,
  })
  const [loading, setLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)
  const [popCode, setPopCode] = useState<string | null>(null)

  // Retrieve POP code from AsyncStorage
  useEffect(() => {
    const getPop = async () => {
      try {
        const savedPop = await AsyncStorage.getItem("popCode")
        if (savedPop) {
          console.log("Using POP code:", savedPop)
          setPopCode(savedPop)
        } else {
          console.error("No POP code found in AsyncStorage")
          Alert.alert("Error", "No POP code found. Please login or configure your device.")
          setLoading(false)
        }
      } catch (error) {
        console.error("Error retrieving POP code:", error)
        Alert.alert("Error", "Failed to retrieve POP code.")
        setLoading(false)
      }
    }
    getPop()
  }, [])

  // Listen for latest reading once popCode is available
  useEffect(() => {
    if (!popCode) return

    console.log(`Subscribing to database path: ${popCode}/current`)
    const latestReadingRef = ref(database, `${popCode}/current`)
    const unsubscribe = onValue(
      latestReadingRef,
      snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.val()
          setReadings(data)
          calculateScores(data)
        }
        setLoading(false)
      },
      error => {
        console.error("Readings error:", error)
        Alert.alert("Error", "Failed to fetch readings.")
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [popCode])

  const calculateScores = (data: any) => {
    const newScores = {
      ph: calculatePHScore(data.pH),
      tds: calculateTDSScore(data.tds),
      waterTemp: calculateWaterTempScore(data.waterTemperature),
      airTemp: calculateAirTempScore(data.airTemperature),
      humidity: calculateHumidityScore(data.airHumidity),
      lightIntensity: calculateLightScore(data.ldr),
      total: 0,
    }

    // Calculate total score
    newScores.total =
      newScores.ph +
      newScores.tds +
      newScores.waterTemp +
      newScores.airTemp +
      newScores.humidity +
      newScores.lightIntensity

    setScores(newScores)

    // Call the onScoreChange prop if it exists
    if (onScoreChange) {
      onScoreChange(newScores.total)
    }
  }

  // pH (2 points) - Optimal: 5.5 ≤ pH ≤ 6.5
  const calculatePHScore = (ph: number) => {
    if (!ph && ph !== 0) return 0
    return ph >= 5.5 && ph <= 6.5 ? 2 : 1
  }

  // TDS (2 points) - Optimal: 800 ppm ≤ TDS ≤ 1000 ppm
  const calculateTDSScore = (tds: number) => {
    if (!tds && tds !== 0) return 0
    return tds >= 800 && tds <= 1000 ? 2 : 1
  }

  // Water Temperature (1 point) - Optimal: 60°F–75°F (15.5–24°C)
  const calculateWaterTempScore = (temp: number) => {
    if (!temp && temp !== 0) return 0
    return temp >= 15.5 && temp <= 24 ? 1 : 0.5
  }

  // Air Temperature (2 points) - Optimal: 68°F–77°F (20–25°C)
  const calculateAirTempScore = (temp: number) => {
    if (!temp && temp !== 0) return 0
    return temp >= 20 && temp <= 25 ? 2 : 1
  }

  // Relative Humidity (2 points) - Optimal: 50%–60% (allow up to 70% during vegetative)
  const calculateHumidityScore = (humidity: number) => {
    if (!humidity && humidity !== 0) return 0
    return humidity >= 50 && humidity <= 70 ? 2 : 1
  }

  // Light Intensity (1 point) - Optimal: 15,000 lux–50,000 lux during vegetative growth
  const calculateLightScore = (intensity: number) => {
    if (!intensity && intensity !== 0) return 0
    return intensity >= 2500 && intensity <= 4000 ? 1 : 0.5
  }

  // Get status text based on score
  const getScoreStatus = (score: number) => {
    if (score >= 8) return "Excellent"
    if (score >= 6) return "Good"
    if (score < 6) return "Critical"
    return "Critical"
  }

  // Get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 8) return "#4ade80" // green-500
    if (score >= 6) return "#facc15" // yellow-500
    return "#ef4444" // red-500
  }

  // Get emoji based on score
  const getScoreEmoji = (score: number) => {
    if (score >= 8) return "😄" // Happy emoji for high scores
    if (score >= 5) return "😐" // Neutral emoji for medium scores
    return "😟" // Sad emoji for low scores
  }

  // Get improvement tips based on scores
  const getImprovementTips = () => {
    const tips = []

    if (scores.ph < 2) {
      tips.push(
        `Adjust pH levels to optimal range (5.5-6.5)${readings?.ph ? `, current: ${readings.ph.toFixed(1)}` : ""}`,
      )
    }

    if (scores.tds < 2) {
      tips.push(`Adjust nutrient concentration to 800-1000 ppm${readings?.tds ? `, current: ${readings.tds}` : ""}`)
    }

    if (scores.waterTemp < 1) {
      tips.push(
        `Adjust water temperature to 15.5-24°C${readings?.waterTemperature ? `, current: ${readings.waterTemperature.toFixed(1)}°C` : ""}`,
      )
    }

    if (scores.airTemp < 2) {
      tips.push(
        `Adjust air temperature to 20-25°C${readings?.temperature ? `, current: ${readings.temperature.toFixed(1)}°C` : ""}`,
      )
    }

    if (scores.humidity < 2) {
      tips.push(`Adjust humidity to 50-70%${readings?.humidity ? `, current: ${readings.humidity.toFixed(1)}%` : ""}`)
    }

    if (scores.lightIntensity < 1) {
      tips.push(
        `Adjust light intensity to 15,000-50,000 lux${readings?.lightIntensity ? `, current: ${readings.lightIntensity}` : ""}`,
      )
    }

    return tips
  }

  if (loading) {
    return (
      <View className="mx-5 mb-4 rounded-xl overflow-hidden bg-white shadow-md border border-gray-100 p-5">
        <Text className="text-center text-gray-500">Loading system score...</Text>
      </View>
    )
  }

  // Calculate percentage for visual display
  const scorePercentage = (scores.total / 10) * 100

  return (
    <>
      <View className="mx-5 mb-4 rounded-xl overflow-hidden bg-white shadow-md border border-gray-100">
        <View className="p-15 items-center">
          <Text className="text-xl font-bold text-center text-gray-800 mb-4">System Score</Text>

          {/* Emoji Card Design */}
          <View className="w-full items-center justify-center mb-6">
            {/* Emoji Card */}
            <View
              className="w-64 h-64 rounded-3xl shadow-sm items-center justify-center mb-4"
              style={{ backgroundColor: `${getScoreColor(scores.total)}15` }} // Light background based on score color
            >
              {/* Emoji */}
              <Text style={{ fontSize: 100 }}>{getScoreEmoji(scores.total)}</Text>

              {/* Score Badge */}
              <View
                className="absolute top-4 right-4 w-14 h-14 rounded-full items-center justify-center"
                style={{ backgroundColor: getScoreColor(scores.total) }}
              >
                <Text className="text-white text-xl font-bold">{scores.total.toFixed(1)}</Text>
              </View>

              {/* Status Text */}
              <Text className="text-xl font-bold mt-4" style={{ color: getScoreColor(scores.total) }}>
                {getScoreStatus(scores.total)}
              </Text>

              {/* Progress Dots */}
              <View className="flex-row mt-4">
                {[...Array(10)].map((_, i) => (
                  <View
                    key={i}
                    className="h-2 w-2 rounded-full mx-1"
                    style={{
                      backgroundColor:
                        i < Math.floor(scores.total)
                          ? getScoreColor(scores.total)
                          : i < scores.total
                            ? `${getScoreColor(scores.total)}80` // Semi-transparent for partial points
                            : "#e5e7eb", // gray-200
                    }}
                  />
                ))}
              </View>
            </View>

            <Text className="text-sm text-gray-500 text-center mb-4">
              Here are some tips on how to improve your score
            </Text>

            {/* Details Button */}
            <TouchableOpacity className="px-8 py-3 rounded-full bg-green-500" onPress={() => setShowDetails(true)}>
              <Text className="text-white font-medium">Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDetails}
        onRequestClose={() => setShowDetails(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-5 h-3/4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold">System Score Details</Text>
              <TouchableOpacity onPress={() => setShowDetails(false)}>
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
            </View>

            {/* Current Score */}
            <View className="mb-6">
              <Text className="text-lg font-semibold mb-2">Current Score: {scores.total.toFixed(1)}/10</Text>
              <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <View
                  className="h-full"
                  style={{ width: `${(scores.total / 10) * 100}%`, backgroundColor: getScoreColor(scores.total) }}
                />
              </View>
            </View>

            {/* Parameter Details */}
            <Text className="text-lg font-semibold mb-2">Parameter Details</Text>
            <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
              <Text className="text-base">pH</Text>
              <View className="flex-row items-center">
                <Text className="text-gray-500 mr-2">{readings?.pH ? readings.pH.toFixed(1) : "N/A"}</Text>
                <Text className="font-medium">
                  {scores.ph}/{2}
                </Text>
              </View>
            </View>
            <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
              <Text className="text-base">TDS</Text>
              <View className="flex-row items-center">
                <Text className="text-gray-500 mr-2">{readings?.tds ? `${readings.tds} ppm` : "N/A"}</Text>
                <Text className="font-medium">
                  {scores.tds}/{2}
                </Text>
              </View>
            </View>
            <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
              <Text className="text-base">Water Temp</Text>
              <View className="flex-row items-center">
                <Text className="text-gray-500 mr-2">
                  {readings?.waterTemperature ? `${readings.waterTemperature.toFixed(1)}°C` : "N/A"}
                </Text>
                <Text className="font-medium">
                  {scores.waterTemp}/{1}
                </Text>
              </View>
            </View>
            <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
              <Text className="text-base">Air Temp</Text>
              <View className="flex-row items-center">
                <Text className="text-gray-500 mr-2">
                  {readings?.airTemperature ? `${readings.airTemperature.toFixed(1)}°C` : "N/A"}
                </Text>
                <Text className="font-medium">
                  {scores.airTemp}/{2}
                </Text>
              </View>
            </View>
            <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
              <Text className="text-base">Humidity</Text>
              <View className="flex-row items-center">
                <Text className="text-gray-500 mr-2">
                  {readings?.airHumidity ? `${readings.airHumidity.toFixed(1)}%` : "N/A"}
                </Text>
                <Text className="font-medium">
                  {scores.humidity}/{2}
                </Text>
              </View>
            </View>
            <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
              <Text className="text-base">Light Intensity</Text>
              <View className="flex-row items-center">
                <Text className="text-gray-500 mr-2">{readings?.ldr ? `${readings.ldr} lux` : "N/A"}</Text>
                <Text className="font-medium">
                  {scores.lightIntensity}/{1}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}

export default SystemScore
