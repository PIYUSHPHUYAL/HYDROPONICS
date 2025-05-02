import { Text, View, Image, TouchableOpacity, ScrollView, SafeAreaView, Dimensions } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { StatusBar } from "expo-status-bar"
import { useRouter } from "expo-router"
import { useState, useEffect, useRef } from "react"
import { database, ref, onValue } from "./firebase" // Import from your firebase.js file
import { Linking } from "react-native"
import { IconButton } from 'react-native-paper';


export default function Index() {
  const router = useRouter()
  const [sensorData, setSensorData] = useState({
    pH: "--",
    nutrient: "--",
    sunlight: "--",
    EC: "--",
    humidity: "--",
    airTemperature: "--",
    temperature: "--",
    lastUpdated: "--",
  })
  const [loading, setLoading] = useState(true)
  const [currentTipIndex, setCurrentTipIndex] = useState(0)
  const tipsScrollViewRef = useRef(null)
  const screenWidth = Dimensions.get("window").width

  // Tips data
  const tipsData = [
    {
      title: "Tips of the day",
      description: "10 Essential Tips For Keeping Your Plants Healthy",
      image:
        "https://images.unsplash.com/photo-1555037015-1498966bcd7c?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      videoUrl: "https://youtu.be/vuRC7BSD2JA?si=JlXKYvDwLuFhYSQl",
    },

    {
      title: "Watering Guide",
      description: "How to Properly Water Your Indoor Plants for Maximum Growth",
      image:
        "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTB8fHdhdGVyaW5nJTIwcGxhbnRzfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=800&q=60",
      videoUrl: "https://youtu.be/RWr566IYR10?si=dtNUx1YC-twh6Bk9",
    },
    {
      title: "Nutrient Balance",
      description: "Understanding Nutrient Requirements for Hydroponics",
      image:
        "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NXx8cGxhbnQlMjBudXRyaWVudHN8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60",
      videoUrl: "https://youtu.be/tI2K45je-Rw?si=Ym3ajVYfr3PsUDzy",
    },
  ]

  // Auto-scroll functionality
  useEffect(() => {
    const timer = setInterval(() => {
      if (tipsScrollViewRef.current) {
        const nextIndex = (currentTipIndex + 1) % tipsData.length
        tipsScrollViewRef.current.scrollTo({
          x: nextIndex * (screenWidth - 10),
          animated: true,
        })
        setCurrentTipIndex(nextIndex)
      }
    }, 3000)

    return () => clearInterval(timer)
  }, [currentTipIndex])

  // Handle manual scroll end
  const handleScrollEnd = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x
    const newIndex = Math.round(contentOffsetX / (screenWidth - 40))
    setCurrentTipIndex(newIndex)
  }

  useEffect(() => {
    // Reference to the readings node
    const readingsRef = ref(database, "readings/current")

    // **Important: Capture the unsubscribe function**
    const unsubscribe = onValue(readingsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        // conversion factor, EC calc, etc.
        const conversionFactor = 0.67
        const calculatedEC = data.tds
          ? (parseFloat(data.tds) / conversionFactor).toFixed(0)
          : "--"

        // format lastUpdated exactly how you like
        let [h, m, s] = data.time?.split(":").map(Number) || [0,0,0]
        const ampm = h >= 12 ? "PM" : "AM"
        h = h % 12 || 12
        const today = new Date(data.timestamp * 1000) // if you stored Unix secs
        const lastUpdated = `${today.getMonth()+1}/${today.getDate()}/${today.getFullYear()} ${h}:${m.toString().padStart(2,"0")} ${ampm}`

        setSensorData({
          pH:       data.pH?.toFixed(2)       || "--",
          nutrient: data.tds?.toFixed(0)      || "--",
          sunlight: data.ldr?.toFixed(0)      || "--",
          EC: calculatedEC,
          humidity: data.airHumidity?.toFixed(0)   || "--",
          airTemperature: data.airTemperature?.toFixed(1) || "--",
          temperature: data.waterTemperature?.toFixed(0)   || "--",
          lastUpdated,
        })
      }
      setLoading(false)
    }, (error) => {
      console.error("RTDB error:", error)
      setLoading(false)
    })

    // Clean up the listener
    return () => unsubscribe()
  }, [])

  const goToNotifications = () => {
    router.push("/notifications")
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row justify-between items-center px-5 pt-4 pb-2">
        <View style={{ transform: [{ translateX: 110 }] }} className="flex-row items-center">
          <Image source={require("../../assets12345/logo.png")} className="w-8 h-8 mr-3 relative -top-[3px] -left-[-6px]" />
          <Text className="text-lg font-semibold text-green-500">Hey Piyush!</Text>
        </View>
        <TouchableOpacity onPress={goToNotifications}>
          <Ionicons name="notifications-outline" size={24} color="black" />
          <View className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></View>
        </TouchableOpacity>
      </View>

      {/* Subtitle */}
      <Text className="text-center text-blue-900 font-medium px-5 mb-4">Monitor Water, Optimize Your Grow</Text>

      {/* Status indicator */}
      {loading ? <Text className="text-center text-gray-500 mb-4">Loading sensor data...</Text> : null}

      {/* Tips Carousel */}
      <View className="mb-5">
        <ScrollView
          ref={tipsScrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScrollEnd}
          className="mb-2"
        >
          {tipsData.map((tip, index) => (
            <View
              key={index}
              style={{ width: screenWidth - 40 }}
              className="mx-5 rounded-xl overflow-hidden bg-green-800"
            >
              <Image source={{ uri: tip.image }} className="absolute w-full h-full opacity-40" />
              <View className="p-5">
                <Text className="text-white text-xl font-bold mb-1">{tip.title}</Text>
                <Text className="text-white opacity-90 mb-4">{tip.description}</Text>
                <TouchableOpacity
                  className="self-end bg-white bg-opacity-30 rounded-full p-1"
                  onPress={() => {
                    Linking.openURL(tip.videoUrl).catch((err) => console.error("Failed to open YouTube:", err))
                  }}
                >
                  <Ionicons name="play" size={24} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Pagination dots */}
        <View className="flex-row justify-center"  style={{ top:5 }}>
          {tipsData.map((_, index) => (
            <View
              key={index}
              className={`h-2 w-2 rounded-full mx-1 ${currentTipIndex === index ? "bg-green-600" : "bg-gray-300"}`}
            />
          ))}
        </View>
      </View>

      <ScrollView className="flex-1" style={{ top:-5 }}>
        {/* Metrics Grid */}
        <View className="mx-5 mt-1">
          <View className="flex-row mb-5">
            {/* pH Level */}
            <View className="flex-1 mr-2 p-5 border border-gray-200 rounded-xl items-center">
              <View className="w-10 h-10 mb-3 items-center justify-center">
                <Ionicons name="water" size={28} color="#0088FF" />
              </View>
              <Text className="text-2xl font-bold">{sensorData.pH}</Text>
              <Text className="text-gray-500 text-sm">pH</Text>
            </View>

            {/* Nutrient Level */}
            <View className="flex-1 ml-2 p-5 border border-gray-200 rounded-xl items-center">
              <View className="w-10 h-10 mb-3 items-center justify-center">
                <Ionicons name="leaf-outline" size={28} color="#4CAF50" />
              </View>
              <Text className="text-2xl font-bold">{sensorData.nutrient}</Text>
              <Text className="text-gray-500 text-sm">nutrient</Text>
            </View>
          </View>

          <View className="flex-row mb-4">
            {/* Sunlight */}
            <View className="flex-1 mr-2 p-5 border border-gray-200 rounded-xl items-center">
              <View className="w-10 h-10 mb-3 items-center justify-center">
                <Ionicons name="sunny" size={28} color="#FFD700" />
              </View>
              <Text className="text-2xl font-bold">{sensorData.sunlight}</Text>
              <Text className="text-gray-500 text-sm">sunlight</Text>
            </View>

            {/* EC Level (using TDS value) */}
            <View className="flex-1 ml-2 p-5 border border-gray-200 rounded-xl items-center">
              <View className="w-10 h-10 mb-3 items-center justify-center">
                <Ionicons name="cube" size={28} color="#4CAF50" />
              </View>
              <Text className="text-2xl font-bold">{sensorData.EC}</Text>
              <Text className="text-gray-500 text-sm">EC</Text>
            </View>
          </View>

          <View className="flex-row">
            {/* Humidity */}
            <View className="flex-1 mr-2 p-5 border border-gray-200 rounded-xl items-center">
              <View className="w-10 h-10 mb-3 items-center justify-center">
                <Ionicons name="rainy-outline" size={28} color="#0088FF" />
              </View>
              <Text className="text-2xl font-bold">{sensorData.humidity}%</Text>
              <Text className="text-gray-500 text-sm">humidity</Text>
            </View>

            {/* Temperature (air) */}
            <View className="flex-1 ml-2 p-5 border border-gray-200 rounded-xl items-center">
              <View className="w-10 h-10 mb-3 items-center justify-center">
                <Ionicons name="thermometer-outline" size={28} color="#FF9800" />
              </View>
              <Text className="text-2xl font-bold">{sensorData.airTemperature}°C</Text>
              <Text className="text-gray-500 text-sm">temperature(air)</Text>
            </View>
          </View>

          <View className="flex-row mb-5"></View>
          {/* Temperature (water) */}
          <View className="flex-1 p-5 border border-gray-200 rounded-xl items-center">
            <View className="w-10 h-10 mb-3 items-center justify-center">
              <IconButton icon="coolant-temperature" size={30} />
            </View>
            <Text className="text-2xl font-bold">
              {sensorData.temperature}°C
            </Text>
            <Text className="text-gray-500 text-sm">
              temperature(H₂O)
            </Text>
          </View>

          {/* Last updated line */}
          {sensorData.lastUpdated !== "--" && (
            <Text className="text-gray-400 text-xs mt-1" style={{ textAlign: "center" }}>
              Last updated: {sensorData.lastUpdated}
            </Text>
          )}
        </View>

        {/* Add some bottom padding to account for the tab bar */}
        <View className="h-24" />
      </ScrollView>
    </SafeAreaView>
  )
}