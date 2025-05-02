import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Switch, Alert, Linking } from "react-native"
import { useState } from "react"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import SystemScore from "../suggestion-section"


const Settings = () => {
  const router = useRouter()

  // Notification preferences state
  const [notificationSettings, setNotificationSettings] = useState({
    sound: true,
    vibration: true,
    schedule: "always", // 'always', 'day', 'night'
  })

  // Units state
  const [units, setUnits] = useState({
    system: "metric", // 'metric' or 'imperial'
  })

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    shareData: true,
  })

  // Theme settings
  const [themeSettings, setThemeSettings] = useState({
    fontSize: 1, // 0.8 to 1.2
  })

  // Section expansion state
  const [expandedSections, setExpandedSections] = useState({
    notifications: false,
    units: false,
    account: false,
    additional: false,
    about: false,
  })

  const goToNotifications = () => {
    router.push("/notifications")
  }

  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    })
  }

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Log Out",
        onPress: () => console.log("User logged out"),
      },
    ])
  }

  // Function to show contact email alert
  const showContactAlert = () => {
    Alert.alert(
      "Contact Information",
      "Kindly put your concern to mail address piyushphuyal77@gmail.com",
      [
        { text: "OK", onPress: () => console.log("OK Pressed") }
      ]
    )
  }

  // Function to show contact email alert
  const showComingSoonAlert = () => {
    Alert.alert(
      "Coming Soon",
      "This feature is coming soon! Stay tuned for updates.",
      [
        { text: "OK", onPress: () => console.log("OK Pressed") }
      ]
    )
  }

  // Function to open YouTube tutorial
  const openTutorial = async () => {
    // YouTube URL for a hydroponics tutorial
    const youtubeUrl = "https://youtu.be/eEw9iv2K3Pc?si=4PadWVq8-Hh_Ttaa";

    // Check if the URL can be opened
    const canOpen = await Linking.canOpenURL(youtubeUrl);

    if (canOpen) {
      await Linking.openURL(youtubeUrl);
    } else {
      Alert.alert(
        "Cannot Open Link",
        "Unable to open YouTube. Please make sure you have YouTube installed or a web browser that can access YouTube.",
        [{ text: "OK" }]
      );
    }
  }

  const renderSectionHeader = (icon, title, section) => (
    <TouchableOpacity
      className="flex-row items-center py-3 border-b border-gray-200"
      onPress={() => toggleSection(section)}
    >
      <Ionicons name={icon} size={20} color="#3b82f6" style={{ marginRight: 8 }} />
      <Text className="text-base font-medium flex-1">{title}</Text>
      <Ionicons name={expandedSections[section] ? "chevron-up" : "chevron-down"} size={20} color="#6b7280" />
    </TouchableOpacity>
  )

  const renderSwitchItem = (icon, label, value, onValueChange, description = null) => (
    <View className="flex-row items-center justify-between py-2">
      <View className="flex-row items-center flex-1">
        <Ionicons name={icon} size={16} color="#6b7280" style={{ marginRight: 8 }} />
        <View>
          <Text className="text-sm font-medium">{label}</Text>
          {description && <Text className="text-xs text-gray-500">{description}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#d1d5db", true: "#bfdbfe" }}
        thumbColor={value ? "#3b82f6" : "#f4f4f5"}
      />
    </View>
  )

  const renderSelectItem = (label, value, options) => (
    <View className="py-2">
      <Text className="text-sm font-medium mb-2">{label}</Text>
      <View className="bg-gray-100 rounded-md overflow-hidden">
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            className={`p-3 ${value === option.value ? "bg-blue-100" : ""}`}
            onPress={() => {
              if (label === "Notification Schedule") {
                setNotificationSettings({ ...notificationSettings, schedule: option.value })
              } else if (label === "Language") {
                // Handle language change
              }
            }}
          >
            <Text className={`${value === option.value ? "font-medium text-blue-700" : ""}`}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )

  return (
        <SafeAreaView className="flex-1 bg-white">
          <View style={{ position: 'absolute', top: 63, right: 17.5, zIndex: 10 }}>
            <TouchableOpacity onPress={() => router.push("/notifications")}>
              <Ionicons name="notifications-outline" size={24} color="black" />
              <View className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
            </TouchableOpacity>
          </View>
          <Text className="text-2xl font-bold text-center mb-6 my-4">Settings</Text>

      <ScrollView className="flex-1 px-4">
        {/* Notification Preferences */}
        <View className="py-2">
          {renderSectionHeader("notifications-outline", "Notification ", "notifications")}
          {expandedSections.notifications && (
            <View className="py-2">
              {renderSwitchItem("volume-medium-outline", "Sound", notificationSettings.sound, (value) =>
                setNotificationSettings({ ...notificationSettings, sound: value }),
              )}

              {renderSwitchItem("notifications-outline", "Vibration", notificationSettings.vibration, (value) =>
                setNotificationSettings({ ...notificationSettings, vibration: value }),
              )}

            </View>
          )}
        </View>

        {/* Units & Language */}
        <View className="py-2">
          {renderSectionHeader("globe-outline", "Units & Language", "units")}
          {expandedSections.units && (
            <View className="py-2 space-y-4">
              <View>
                <Text className="text-sm font-medium mb-2">Measurement System</Text>
                <View className="flex-row">
                  <TouchableOpacity
                    className={`flex-1 p-2 border ${units.system === "metric" ? "bg-blue-100 border-blue-300" : "border-gray-200"} rounded-l-md`}
                    onPress={() => setUnits({ ...units, system: "metric" })}
                  >
                    <Text className={`text-center ${units.system === "metric" ? "font-medium text-blue-700" : ""}`}>
                      Metric (°C, cm)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`flex-1 p-2 border ${units.system === "imperial" ? "bg-blue-100 border-blue-300" : "border-gray-200"} rounded-r-md`}
                    onPress={showComingSoonAlert}
                  >
                    <Text className={`text-center ${units.system === "imperial" ? "font-medium text-blue-700" : ""}`}>
                      Imperial (°F, in)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {renderSelectItem("Language", "en", [
                { label: "English", value: "en" },
                { label: "Nepali", value: "np" },
              ])}
            </View>
          )}
        </View>

        {/* Account & Security */}
        <View className="py-2">
          {renderSectionHeader("shield-outline", "Account & Security", "account")}
          {expandedSections.account && (
            <View className="py-2 space-y-4">
              <TouchableOpacity
                className="flex-row items-center p-3 bg-blue-50 rounded-md"
                onPress={showContactAlert}
              >
                <Ionicons name="wifi-outline" size={18} color="#3b82f6" style={{ marginRight: 8 }} />
                <Text className="text-blue-700 font-medium">Request POP Change</Text>
              </TouchableOpacity>

              {/* "Share Data" section removed as requested */}
            </View>
          )}
        </View>

        {/* Additional Features */}
        <View className="py-2">
          {renderSectionHeader("options-outline", "Additional Features", "additional")}
          {expandedSections.additional && (
            <View className="py-2 space-y-4">
              {/* "Dark Mode" section removed as requested */}

              <TouchableOpacity
                className="flex-row items-center p-3 border border-gray-200 rounded-md"
                onPress={openTutorial}
              >
                <Ionicons name="book-outline" size={18} color="#6b7280" style={{ marginRight: 8 }} />
                <Text>View Tutorial</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center p-3 border border-gray-200 rounded-md"
                onPress={showContactAlert}
              >
                <Ionicons name="chatbox-outline" size={18} color="#6b7280" style={{ marginRight: 8 }} />
                <Text>Send Feedback</Text>
              </TouchableOpacity>

              {/* "Check for Updates" section removed as requested */}
            </View>
          )}
        </View>

        {/* About */}
        <View className="py-2">
          {renderSectionHeader("information-circle-outline", "About", "about")}
          {expandedSections.about && (
            <View className="py-2 space-y-4">
              <View className="flex-row justify-between items-center">
                <Text className="text-sm">Version</Text>
                <Text className="text-sm font-medium">1.0.0</Text>
              </View>

              <TouchableOpacity
                className="flex-row items-center p-3 border border-gray-200 rounded-md"
                onPress={showContactAlert}
              >
                <Ionicons name="mail-outline" size={18} color="#6b7280" style={{ marginRight: 8 }} />
                <Text>Contact Support</Text>
              </TouchableOpacity>

              <View className="p-3 bg-gray-50 rounded-md">
                <Text className="text-sm text-gray-500 text-center">Developed by Piyush Phuyal</Text>
                {/* <Text className="text-xs text-gray-400 text-center mt-1">Special thanks to all contributors</Text> */}
              </View>
            </View>
          )}
        </View>

        {/* Log Out Button */}
        <TouchableOpacity className="my-6 p-3 bg-red-50 rounded-md" onPress={handleLogout}>
          <Text className="text-red-600 font-medium text-center">Log Out</Text>
        </TouchableOpacity>
              {/* System Score Component - Added at the top */}
      <SystemScore />

        {/* Add some bottom padding */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  )
}

export default Settings