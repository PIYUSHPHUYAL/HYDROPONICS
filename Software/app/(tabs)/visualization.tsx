import { View, Text, TouchableOpacity, SafeAreaView, Dimensions, ScrollView, ActivityIndicator } from "react-native"
import { useState, useEffect, useMemo } from "react"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { Calendar, type DateData } from "react-native-calendars"
import { LineChart } from "react-native-chart-kit"
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
  systemScore: number
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
  avgSystemScore: number
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
  const [chartTimeframe, setChartTimeframe] = useState<"7days" | "14days" | "30days">("7days")
  const [scatterTimeframe, setScatterTimeframe] = useState<"7days" | "14days" | "30days">("30days")

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
              systemScore: childSnapshot.child("systemScore").val() || 0,
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
            const avgSystemScore =
              dayReadings.reduce((sum, reading) => sum + (reading.systemScore || 0), 0) / dayReadings.length

            return {
              date,
              avgPH,
              avgTDS,
              avgAirTemp,
              avgAirHumidity,
              avgLDR,
              avgWaterTemp,
              avgSystemScore,
              readingsCount: dayReadings.length,
            }
          })

          // Sort by date (oldest to newest for chart data)
          averagesByDay.sort((a, b) => {
            // Parse dates in format "YYYY-MM-DD"
            const dateA = new Date(a.date)
            const dateB = new Date(b.date)
            return dateA.getTime() - dateB.getTime()
          })

          // Set the selected date to the most recent date with data
          if (averagesByDay.length > 0 && !selectedDate) {
            setSelectedDate(averagesByDay[averagesByDay.length - 1].date)
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

  // Prepare TDS chart data
  const tdsChartData = useMemo(() => {
    if (dailyAverages.length === 0) return null

    // Create a copy of the array sorted by date (oldest to newest)
    const sortedData = [...dailyAverages].sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      return dateA.getTime() - dateB.getTime()
    })

    // Filter data based on selected timeframe
    let filteredData = sortedData
    const today = new Date()
    const daysToShow = chartTimeframe === "7days" ? 7 : chartTimeframe === "14days" ? 14 : 30
    const cutoffDate = new Date(today)
    cutoffDate.setDate(today.getDate() - daysToShow)

    filteredData = sortedData.filter((item) => {
      const itemDate = new Date(item.date)
      return itemDate >= cutoffDate
    })

    // For 7-day view, limit to 7 data points if needed
    let dataToUse = filteredData
    if (chartTimeframe === "7days" && filteredData.length > 7) {
      const step = Math.ceil(filteredData.length / 7)
      dataToUse = filteredData.filter((_, index) => index % step === 0)

      // Always include the most recent data point
      if (dataToUse[dataToUse.length - 1] !== filteredData[filteredData.length - 1]) {
        dataToUse.push(filteredData[filteredData.length - 1])
      }
    }

    // Format dates for display based on timeframe
    const labels = dataToUse.map((day, index) => {
      const date = new Date(day.date)

      // For 7-day view, show specific dates
      if (chartTimeframe === "7days") {
        return date.toLocaleDateString(undefined, { day: "numeric", month: "short" })
      }
      // For 14-day and 30-day views, only show labels for first, middle and last points
      else {
        // Only show label for first, middle and last points
        if (index === 0 || index === dataToUse.length - 1 || index === Math.floor(dataToUse.length / 2)) {
          return date.toLocaleDateString(undefined, { day: "numeric", month: "short" })
        }
        return ""
      }
    })

    const tdsValues = dataToUse.map((day) => day.avgTDS)

    // Calculate trend
    let trend = "stable"
    if (tdsValues.length >= 2) {
      const firstValue = tdsValues[0]
      const lastValue = tdsValues[tdsValues.length - 1]
      const percentChange = ((lastValue - firstValue) / firstValue) * 100

      if (percentChange > 10) {
        trend = "rising"
      } else if (percentChange < -10) {
        trend = "falling"
      }
    }

    return {
      labels,
      datasets: [
        {
          data: tdsValues,
          color: () => "#0088ff",
          strokeWidth: 2,
        },
      ],
      trend,
    }
  }, [dailyAverages, chartTimeframe])

  // Prepare pH vs System Score scatter plot data
  const scatterPlotData = useMemo(() => {
    if (dailyAverages.length === 0) return null

    // Filter data based on selected timeframe
    let filteredData = [...dailyAverages]

    const today = new Date()
    const daysToShow = scatterTimeframe === "7days" ? 7 : scatterTimeframe === "14days" ? 14 : 30
    const cutoffDate = new Date(today)
    cutoffDate.setDate(today.getDate() - daysToShow)

    filteredData = filteredData.filter((item) => {
      const itemDate = new Date(item.date)
      return itemDate >= cutoffDate
    })

    // Create data points for the scatter plot
    // Now with systemScore on x-axis and pH on y-axis
    const scatterData = filteredData.map((day) => ({
      x: day.avgSystemScore,
      y: day.avgPH,
    }))

    // Calculate correlation
    let correlation = "neutral"
    if (scatterData.length >= 3) {
      // Simple correlation check based on trend direction
      const sortedByX = [...scatterData].sort((a, b) => a.x - b.x)
      const lowestX = sortedByX[0]
      const highestX = sortedByX[sortedByX.length - 1]

      if (highestX.y > lowestX.y) {
        correlation = "positive"
      } else if (highestX.y < lowestX.y) {
        correlation = "negative"
      }
    }

    // Create empty labels array (we don't want to show any labels)
    const emptyLabels = Array(scatterData.length).fill("")

    // Create datasets with a trick to hide lines:
    // We'll create individual datasets for each point with only one data point each
    // This way, there are no lines to connect points
    const datasets = scatterData.map((point) => ({
      data: [point.y],
      color: () => "#8000ff", // Purple color
      strokeWidth: 0, // No stroke for lines
    }))

    return {
      labels: emptyLabels,
      datasets: datasets,
      correlation,
      // Store the system score values separately
      systemScores: scatterData.map((point) => point.x),
    }
  }, [dailyAverages, scatterTimeframe])

  const handleDateSelect = (date: DateData) => {
    setSelectedDate(date.dateString)
  }

  const renderReadingCard = (title: string, value: number, unit: string, optimalRange: string, icon: string) => (
    <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100 ">
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

  const renderTimeframeButton = (timeframe: "7days" | "14days" | "30days", label: string) => (
    <TouchableOpacity
      onPress={() => setChartTimeframe(timeframe)}
      className={`px-3 py-1 rounded-full mr-2 ${chartTimeframe === timeframe ? "bg-blue-500" : "bg-gray-200"}`}
    >
      <Text className={`font-medium ${chartTimeframe === timeframe ? "text-white" : "text-gray-700"}`}>{label}</Text>
    </TouchableOpacity>
  )

  const renderScatterTimeframeButton = (timeframe: "7days" | "14days" | "30days", label: string) => (
    <TouchableOpacity
      onPress={() => setScatterTimeframe(timeframe)}
      className={`px-3 py-1 rounded-full mr-2 ${scatterTimeframe === timeframe ? "bg-purple-500" : "bg-gray-200"}`}
    >
      <Text className={`font-medium ${scatterTimeframe === timeframe ? "text-white" : "text-gray-700"}`}>{label}</Text>
    </TouchableOpacity>
  )

  // Custom scatter plot component using individual dots
  const renderScatterPlot = () => {
    if (!scatterPlotData) return null

    // Calculate the dimensions
    const width = SCREEN_WIDTH - 48
    const height = 220
    const padding = 40 // Padding for axes
    const plotWidth = width - padding * 2
    const plotHeight = height - padding * 2

    // Calculate scales
    const minX = 5
    const maxX = 10
    const minY = 0
    const maxY = 14

    // Function to convert data coordinates to screen coordinates
    const scaleX = (x: number) => padding + ((x - minX) / (maxX - minX)) * plotWidth
    const scaleY = (y: number) => height - padding - ((y - minY) / (maxY - minY)) * plotHeight

    // Extract data points from filtered data
    const points = scatterPlotData.datasets.map((dataset, i) => {
      const y = dataset.data[0] // pH value
      const x = scatterPlotData.systemScores[i] // System score value
      return { x, y }
    })

    return (
      <View style={{ width, height, position: "relative" }}>
        {/* Draw axes */}
        <View
          style={{
            position: "absolute",
            left: padding,
            top: 0,
            width: 1,
            height: height,
            backgroundColor: "#ccc",
          }}
        />
        <View
          style={{
            position: "absolute",
            left: 0,
            top: height - padding,
            width: width,
            height: 1,
            backgroundColor: "#ccc",
          }}
        />

        {/* Draw grid lines */}
        {[0, 2, 4, 6, 8, 10, 12, 14].map((y) => (
          <View
            key={`y-${y}`}
            style={{
              position: "absolute",
              left: 0,
              top: scaleY(y),
              width: width,
              height: 1,
              backgroundColor: "#eee",
            }}
          />
        ))}
        {[5, 6, 7, 8, 9, 10].map((x) => (
          <View
            key={`x-${x}`}
            style={{
              position: "absolute",
              left: scaleX(x),
              top: 0,
              width: 1,
              height: height,
              backgroundColor: "#eee",
            }}
          />
        ))}

        {/* Draw data points */}
        {points.map((point, i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              left: scaleX(point.x) - 6,
              top: scaleY(point.y) - 6,
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: "#8000ff",
            }}
          />
        ))}

        {/* X-axis labels */}
        {[5, 6, 7, 8, 9, 10].map((x) => (
          <Text
            key={`x-label-${x}`}
            style={{
              position: "absolute",
              left: scaleX(x) - 10,
              top: height - padding + 5,
              fontSize: 10,
              color: "#666",
              textAlign: "center",
              width: 20,
            }}
          >
            {x}
          </Text>
        ))}

        {/* Y-axis labels */}
        {[0, 2, 4, 6, 8, 10, 12, 14].map((y) => (
          <Text
            key={`y-label-${y}`}
            style={{
              position: "absolute",
              left: 5,
              top: scaleY(y) - 10,
              fontSize: 10,
              color: "#666",
              textAlign: "right",
              width: 30,
            }}
          >
            {y}
          </Text>
        ))}

        {/* Highlight optimal pH range (5.5-6.5) */}
        <View
          style={{
            position: "absolute",
            left: 0,
            top: scaleY(6.5),
            width: width,
            height: scaleY(5.5) - scaleY(6.5),
            backgroundColor: "rgba(0, 255, 0, 0.1)",
            borderWidth: 1,
            borderColor: "rgba(0, 255, 0, 0.3)",
          }}
        />
      </View>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View style={{ position: "absolute", top: 63, right: 17.5, zIndex: 10 }}>
        <TouchableOpacity onPress={() => router.push("/notifications")}>
          <Ionicons name="notifications-outline" size={24} color="black" />
          <View className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
        </TouchableOpacity>
      </View>
      <Text className="text-2xl font-bold text-center mb-3 my-4">Visualizations</Text>

 {/* Used padding here so that user can scroll to the bottom */}
      <ScrollView className="flex-1 px-4 pt-3" contentContainerStyle={{ paddingBottom: 100 }} >
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
            {/* TDS Trend Chart */}
            <View className="bg-white rounded-xl p-4 mb-6 shadow-sm">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-lg font-bold">TDS Trend Over Time</Text>
                {tdsChartData && (
                  <View className="flex-row items-center">
                    <Ionicons
                      name={
                        tdsChartData.trend === "rising"
                          ? "trending-up"
                          : tdsChartData.trend === "falling"
                            ? "trending-down"
                            : "remove"
                      }
                      size={20}
                      color={
                        tdsChartData.trend === "rising"
                          ? "#22c55e"
                          : tdsChartData.trend === "falling"
                            ? "#ef4444"
                            : "#6b7280"
                      }
                    />
                    <Text
                      className={`ml-1 font-medium ${
                        tdsChartData.trend === "rising"
                          ? "text-green-500"
                          : tdsChartData.trend === "falling"
                            ? "text-red-500"
                            : "text-gray-500"
                      }`}
                    >
                      {tdsChartData.trend === "rising"
                        ? "Rising"
                        : tdsChartData.trend === "falling"
                          ? "Falling"
                          : "Stable"}
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-row mb-4 mt-2">
                {renderTimeframeButton("7days", "7 Days")}
                {renderTimeframeButton("14days", "14 Days")}
                {renderTimeframeButton("30days", "30 Days")}
              </View>

              {tdsChartData ? (
                <View>
                  <LineChart
                    data={tdsChartData}
                    width={SCREEN_WIDTH - 48}
                    height={220}
                    chartConfig={{
                      backgroundColor: "#ffffff",
                      backgroundGradientFrom: "#ffffff",
                      backgroundGradientTo: "#ffffff",
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(0, 136, 255, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                      style: {
                        borderRadius: 16,
                      },
                      propsForDots: {
                        r: "4",
                        strokeWidth: "2",
                        stroke: "#0088ff",
                      },
                    }}
                    bezier
                    style={{
                      marginVertical: 8,
                      borderRadius: 16,
                    }}
                    yAxisSuffix=" ppm"
                    yAxisLabel=""
                  />
                  <Text className="text-center text-sm text-gray-500 mt-2">Optimal TDS range: 800-1500 ppm</Text>
                </View>
              ) : (
                <View className="h-[220] justify-center items-center">
                  <Text className="text-gray-500">Not enough data to display chart</Text>
                </View>
              )}
            </View>

            {/* pH vs System Score Scatter Plot */}
            <View className="bg-white rounded-xl p-4 mb-6 shadow-sm">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-lg font-bold">pH vs System Score</Text>
                {scatterPlotData && (
                  <View className="flex-row items-center">
                    <Ionicons
                      name={
                        scatterPlotData.correlation === "positive"
                          ? "arrow-up-outline"
                          : scatterPlotData.correlation === "negative"
                            ? "arrow-down-outline"
                            : "remove"
                      }
                      size={20}
                      color={
                        scatterPlotData.correlation === "positive"
                          ? "#22c55e"
                          : scatterPlotData.correlation === "negative"
                            ? "#ef4444"
                            : "#6b7280"
                      }
                    />
                    <Text
                      className={`ml-1 font-medium ${
                        scatterPlotData.correlation === "positive"
                          ? "text-green-500"
                          : scatterPlotData.correlation === "negative"
                            ? "text-red-500"
                            : "text-gray-500"
                      }`}
                    >
                      {scatterPlotData.correlation === "positive"
                        ? "Positive correlation"
                        : scatterPlotData.correlation === "negative"
                          ? "Negative correlation"
                          : "No clear correlation"}
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-row mb-4 mt-2">
                {renderScatterTimeframeButton("7days", "7 Days")}
                {renderScatterTimeframeButton("14days", "14 Days")}
                {renderScatterTimeframeButton("30days", "30 Days")}
              </View>

              {scatterPlotData ? (
                <View>
                  {renderScatterPlot()}

                  <View className="flex-row justify-between mt-4">
                    <View>
                      <Text className="text-sm font-medium text-purple-800">X-axis: System Score (5-10)</Text>
                    </View>
                    <View>
                      <Text className="text-sm font-medium text-purple-800">Y-axis: pH Level (0-14)</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center mt-2 justify-center">
                    <View className="w-3 h-3 bg-green-200 border border-green-300 mr-2" />
                    <Text className="text-xs text-gray-500">Optimal pH range (5.5-6.5)</Text>
                  </View>

                  <Text className="text-center text-sm text-gray-500 mt-2">
                    Each point represents a daily average reading
                  </Text>
                </View>
              ) : (
                <View className="h-[220] justify-center items-center">
                  <Text className="text-gray-500">Not enough data to display scatter plot</Text>
                </View>
              )}
            </View>

            {/* Calendar View */}
            <View className="bg-white rounded-xl overflow-hidden shadow-sm mb-6">
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


                {renderReadingCard(
                  "System Score",
                  selectedDayData.avgSystemScore,
                  "",
                  "Higher is better",
                  "stats-chart-outline",
                )}
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
