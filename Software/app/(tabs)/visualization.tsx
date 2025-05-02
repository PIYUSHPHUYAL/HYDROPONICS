import { View, Text, TouchableOpacity, SafeAreaView, Dimensions, ScrollView, ActivityIndicator } from "react-native"
import { useState, useEffect, useMemo } from "react"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { Calendar, type DateData } from "react-native-calendars"
import { database, ref, onValue } from "./firebase"

// Constants
const SCREEN_WIDTH = Dimensions.get("window").width

// Types
interface DailyReading {
  pH: number
  tds: number
  airTemperature: number
  airHumidity: number
  ldr: number
  waterTemperature: number
  date: string
  time?: string
}

interface DayAverageData {
  date: string
  avgPH: number
  avgTDS: number
  avgAirTemp: number
  avgAirHumidity: number
  avgLDR: number
  avgWaterTemp: number
  readingsCount: number
}

interface MarkedDates {
  [date: string]: {
    marked: boolean
    dotColor?: string
    selected?: boolean
    selectedColor?: string
  }
}

const Visualization = () => {
  const router = useRouter()
  const [dailyAverages, setDailyAverages] = useState<DayAverageData[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const dailyReadingsRef = ref(database, "daily_readings")

    const unsubscribe = onValue(
      dailyReadingsRef,
      (snapshot) => {
        try {
          if (!snapshot.exists()) {
            setError("No data available")
            setLoading(false)
            return
          }

          const readings: Record<string, DailyReading[]> = {}

          // Group readings by date
          snapshot.forEach((childSnapshot) => {
            const date = childSnapshot.child("date").val() || "Unknown"

            const readingData = {
              pH: childSnapshot.child("pH").val() || 0,
              tds: childSnapshot.child("tds").val() || 0,
              airTemperature: childSnapshot.child("airTemperature").val() || 0,
              airHumidity: childSnapshot.child("airHumidity").val() || 0,
              ldr: childSnapshot.child("ldr").val() || 0,
              waterTemperature: childSnapshot.child("waterTemperature").val() || 0,
              date: date,
              time: childSnapshot.child("time").val() || "",
            }

            // Initialize the array for this date if it doesn't exist
            if (!readings[date]) {
              readings[date] = []
            }

            // Add the reading to the appropriate day
            readings[date].push(readingData)
          })

          if (Object.keys(readings).length === 0) {
            setError("No data available")
            setLoading(false)
            return
          }

          // Calculate averages for each day
          const averagesByDay: DayAverageData[] = Object.entries(readings).map(([date, dayReadings]) => {
            const avgPH = dayReadings.reduce((sum, reading) => sum + reading.pH, 0) / dayReadings.length
            const avgTDS = dayReadings.reduce((sum, reading) => sum + reading.tds, 0) / dayReadings.length
            const avgAirTemp =
              dayReadings.reduce((sum, reading) => sum + reading.airTemperature, 0) / dayReadings.length
            const avgAirHumidity =
              dayReadings.reduce((sum, reading) => sum + reading.airHumidity, 0) / dayReadings.length
            const avgLDR = dayReadings.reduce((sum, reading) => sum + reading.ldr, 0) / dayReadings.length
            const avgWaterTemp =
              dayReadings.reduce((sum, reading) => sum + (reading.waterTemperature || 0), 0) / dayReadings.length

            return {
              date,
              avgPH,
              avgTDS,
              avgAirTemp,
              avgAirHumidity,
              avgLDR,
              avgWaterTemp,
              readingsCount: dayReadings.length,
            }
          })

          // Sort by date (newest first)
          averagesByDay.sort((a, b) => {
            // Parse dates in format "YYYY-MM-DD"
            const dateA = new Date(a.date)
            const dateB = new Date(b.date)
            return dateB.getTime() - dateA.getTime()
          })

          // Set the selected date to the most recent date with data
          if (averagesByDay.length > 0 && !selectedDate) {
            setSelectedDate(averagesByDay[0].date)
          }

          setDailyAverages(averagesByDay)
          setError(null)
        } catch (err) {
          setError("Error processing data")
          console.error("Data processing error:", err)
        } finally {
          setLoading(false)
        }
      },
      (error) => {
        setError("Failed to fetch data")
        console.error("Database error:", error)
        setLoading(false)
      },
    )

    // Cleanup function to unsubscribe from the listener
    return () => {
      unsubscribe()
    }
  }, [])

  // Create marked dates object for calendar
  const markedDates = useMemo(() => {
    const marked: MarkedDates = {}

    // Mark all dates that have data
    dailyAverages.forEach((day) => {
      marked[day.date] = {
        marked: true,
        dotColor: "#0088ff",
      }
    })

    // Mark the selected date
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: "#0088ff",
      }
    }

    return marked
  }, [dailyAverages, selectedDate])

  // Get the selected day's data
  const selectedDayData = useMemo(() => {
    if (!selectedDate) return null
    return dailyAverages.find((day) => day.date === selectedDate)
  }, [dailyAverages, selectedDate])

  const handleDateSelect = (date: DateData) => {
    setSelectedDate(date.dateString)
  }

  const renderReadingCard = (title: string, value: number, unit: string, optimalRange: string, icon: string) => (
    <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-lg font-semibold">{title}</Text>
        <Ionicons name={icon} size={24} color="#0088ff" />
      </View>
      <Text className="text-3xl font-bold">
        {value.toFixed(2)} {unit}
      </Text>
      <Text className="text-sm text-gray-500 mt-1">Optimal: {optimalRange}</Text>
    </View>
  )

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View style={{ position: "absolute", top: 63, right: 17.5, zIndex: 10 }}>
        <TouchableOpacity onPress={() => router.push("/notifications")}>
          <Ionicons name="notifications-outline" size={24} color="black" />
          <View className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
        </TouchableOpacity>
      </View>
      <Text className="text-2xl font-bold text-center mb-6 my-4  ">Visualization</Text>

      <ScrollView className="flex-1 px-4 pt-4 mb-16">
        {loading ? (
          <View className="flex-1 justify-center items-center mt-10">
            <ActivityIndicator size="large" color="#0088ff" />
            <Text className="text-gray-500 mt-4">Loading data...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center mt-10">
            <Ionicons name="alert-circle-outline" size={48} color="#ff4444" />
            <Text className="text-red-500 mt-4">{error}</Text>
          </View>
        ) : (
          <>
            {/* Calendar View */}
            <View className="bg-white rounded-xl overflow-hidden shadow-sm mb-6 " style={{  top: -13, right: 3, zIndex: 10 }}>
              <Calendar
                markedDates={markedDates}
                onDayPress={handleDateSelect}
                theme={{
                  todayTextColor: "#0088ff",
                  arrowColor: "#0088ff",
                  dotColor: "#0088ff",
                  textDayFontFamily: "System",
                  textMonthFontFamily: "System",
                  textDayHeaderFontFamily: "System",
                  textDayFontWeight: "400",
                  textMonthFontWeight: "bold",
                  textDayHeaderFontWeight: "400",
                  textDayFontSize: 16,
                  textMonthFontSize: 16,
                  textDayHeaderFontSize: 14,
                }}
              />
            </View>

            {/* Selected Day Data */}
            {selectedDayData ? (
              <View className="mb-6">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-xl font-bold">Readings for {selectedDayData.date}</Text>
                  <View className="bg-blue-100 px-3 py-1 rounded-full">
                    <Text className="text-blue-800 font-medium">{selectedDayData.readingsCount} readings</Text>
                  </View>
                </View>

                {renderReadingCard("pH Level", selectedDayData.avgPH, "", "5.5-6.5", "water-outline")}
                {renderReadingCard("TDS", selectedDayData.avgTDS, "ppm", "800-1500 ppm", "flask-outline")}
                {renderReadingCard(
                  "Air Temperature",
                  selectedDayData.avgAirTemp,
                  "°C",
                  "18-26°C",
                  "thermometer-outline",
                )}
                {renderReadingCard("Air Humidity", selectedDayData.avgAirHumidity, "%", "60-70%", "water-outline")}
                {renderReadingCard(
                  "Light Intensity",
                  selectedDayData.avgLDR,
                  "lux",
                  "Higher = brighter",
                  "sunny-outline",
                )}
                {renderReadingCard(
                  "Water Temperature",
                  selectedDayData.avgWaterTemp,
                  "°C",
                  "18-22°C",
                  "thermometer-outline",
                )}
              </View>
            ) : (
              <View className="flex-1 justify-center items-center mt-10 bg-white p-6 rounded-xl">
                <Ionicons name="calendar-outline" size={48} color="#888" />
                <Text className="text-gray-500 mt-4 text-center">
                  {dailyAverages.length > 0 ? "Select a date to view readings" : "No data available for any dates"}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default Visualization
