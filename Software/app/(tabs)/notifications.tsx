import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  FlatList,
  Dimensions
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from "expo-router";
import { database, ref, onValue } from "./firebase";

interface Notification {
  id: string;
  type: "critical" | "warning";
  message: string;
  parameter: string;
  value: string;
  timestamp: string;
  read: boolean;
}

// Define threshold values for different parameters
const THRESHOLDS = {
  pH: {
    critical: { min: 4.0, max: 8.0 },
    warning: { min: 5.0, max: 7.0 }
  },
  tds: {
    warning: { min: 300 },
    critical: { max: 2500 }
  },
  waterTemperature: {
    warning: { min: 18 },
    critical: { max: 30 }
  },
  airHumidity: {
    warning: { min: 40, max: 80 }
  },
  airTemperature: {
    warning: { min: 15 },
    critical: { max: 35 }
  }
};

export default function Notifications() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("critical");
  const screenWidth = Dimensions.get('window').width;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to generate a notification based on sensor data
  const generateNotification = (
    parameter: string,
    value: any,
    thresholds: any,
    timestamp: number
  ): Notification | null => {
    // Skip if value is undefined or null
    if (value === undefined || value === null) return null;

    const numValue = parseFloat(value);
    let type: "critical" | "warning" | "normal" = "normal";
    let message = "";

    // Check critical thresholds first
    if (thresholds.critical) {
      if (thresholds.critical.min !== undefined && numValue < thresholds.critical.min) {
        type = "critical";
        message = `${parameter} Too Low`;
      } else if (thresholds.critical.max !== undefined && numValue > thresholds.critical.max) {
        type = "critical";
        message = `${parameter} Too High`;
      }
    }

    // If not critical, check warning thresholds
    if (type === "normal" && thresholds.warning) {
      if (thresholds.warning.min !== undefined && numValue < thresholds.warning.min) {
        type = "warning";
        message = `${parameter} Low`;
      } else if (thresholds.warning.max !== undefined && numValue > thresholds.warning.max) {
        type = "warning";
        message = `${parameter} High`;
      }
    }

    // If within normal range, don't create a notification
    if (type === "normal") {
      return null;
    }

    // Format the timestamp
    const date = new Date(timestamp);
    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const today = new Date();

    let formattedDate;
    if (date.toDateString() === today.toDateString()) {
      formattedDate = formattedTime;
    } else {
      formattedDate = "Yesterday";
    }

    // Create and return the notification
    return {
      id: `${parameter}-${Date.now()}`,
      type,
      message,
      parameter,
      value: numValue.toFixed(parameter === "pH" ? 2 : 0),
      timestamp: formattedDate,
      read: false
    };
  };

  useEffect(() => {
    // Reference to the readings node
    const readingsRef = ref(database, "readings");

    // Set up the listener
    const unsubscribe = onValue(
      readingsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          // Get the latest reading
          let latestReading = null;
          let latestTimestamp = 0;

          snapshot.forEach((childSnapshot) => {
            const key = Number.parseInt(childSnapshot.key);
            if (key > latestTimestamp) {
              latestTimestamp = key;
              latestReading = childSnapshot.val();
            }
          });

          if (latestReading) {
            // Generate notifications based on the latest reading
            const newNotifications: Notification[] = [];

            // Check each parameter against its thresholds
            const pHNotification = generateNotification(
              "pH",
              latestReading.pH,
              THRESHOLDS.pH,
              latestTimestamp
            );
            if (pHNotification) newNotifications.push(pHNotification);

            const tdsNotification = generateNotification(
              "TDS",
              latestReading.tds,
              THRESHOLDS.tds,
              latestTimestamp
            );
            if (tdsNotification) newNotifications.push(tdsNotification);

            const waterTempNotification = generateNotification(
              "Water Temp",
              latestReading.waterTemperature,
              THRESHOLDS.waterTemperature,
              latestTimestamp
            );
            if (waterTempNotification) newNotifications.push(waterTempNotification);

            const airHumidityNotification = generateNotification(
              "Air Humidity",
              latestReading.airHumidity,
              THRESHOLDS.airHumidity,
              latestTimestamp
            );
            if (airHumidityNotification) newNotifications.push(airHumidityNotification);

            const airTempNotification = generateNotification(
              "Air Temp",
              latestReading.airTemperature,
              THRESHOLDS.airTemperature,
              latestTimestamp
            );
            if (airTempNotification) newNotifications.push(airTempNotification);

            // Merge with existing notifications, avoiding duplicates
            setNotifications(prevNotifications => {
              // Keep existing read notifications
              const existingReadNotifications = prevNotifications.filter(n => n.read);

              // Combine new notifications with existing read ones
              return [...newNotifications, ...existingReadNotifications];
            });
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error("Database error:", error);
        setLoading(false);
      }
    );

    // Clean up the listener
    return () => unsubscribe();
  }, []);

  const moveNotificationToHistory = (id: string) => {
    setNotifications(
      notifications.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const getFilteredNotifications = () => {
    if (activeTab === "critical") return notifications.filter(n => n.type === "critical" && !n.read);
    if (activeTab === "warning") return notifications.filter(n => n.type === "warning" && !n.read);
    if (activeTab === "history") return notifications.filter(n => n.read);
    return [];
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "critical":
        return "#ef4444";
      case "warning":
        return "#f59e0b";
      case "normal":
        return "#22c55e";
      default:
        return "#64748b";
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <View className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
      <View className="flex-row items-start">
        <View
          style={{ backgroundColor: getTypeColor(item.type) }}
          className="w-3 h-3 rounded-full mt-1.5 mr-4"
        />
        <View className="flex-1">
          <Text
            style={{ color: getTypeColor(item.type) }}
            className="font-semibold text-lg"
          >
            [{item.type.charAt(0).toUpperCase() + item.type.slice(1)}] {item.message}
          </Text>
          <Text className="text-gray-600 mt-1.5">
            {item.parameter}: {item.value} ({item.timestamp})
          </Text>
        </View>
        {/* Only show X button for unread critical and warning notifications */}
        {(item.type === "critical" || item.type === "warning") && !item.read ? (
          <TouchableOpacity
            className="bg-gray-100 p-2 rounded-full"
            onPress={() => moveNotificationToHistory(item.id)}
          >
            <Ionicons name="close" size={20} color="gray" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row justify-between items-center px-5 pt-4 pb-6 border-b border-gray-200 bg-gray">
        <Text className="text-2xl font-bold text-black-800">Notifications</Text>
      </View>

      {/* Tabs */}
      <View className="px-4 py-3 bg-gray border-b border-gray-200">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            className={`mr-3 py-2.5 px-5 rounded-full ${activeTab === 'critical' ? 'bg-red-500' : 'bg-gray-200'}`}
            onPress={() => setActiveTab('critical')}
          >
            <Text className={`${activeTab === 'critical' ? 'text-white font-semibold' : 'text-gray-700'}`}>Critical</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`mr-3 py-2.5 px-5 rounded-full ${activeTab === 'warning' ? 'bg-amber-500' : 'bg-gray-200'}`}
            onPress={() => setActiveTab('warning')}
          >
            <Text className={`${activeTab === 'warning' ? 'text-white font-semibold' : 'text-gray-700'}`}>Warning</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`mr-3 py-2.5 px-5 rounded-full ${activeTab === 'history' ? 'bg-gray-500' : 'bg-gray-200'}`}
            onPress={() => setActiveTab('history')}
          >
            <Text className={`${activeTab === 'history' ? 'text-white font-semibold' : 'text-gray-700'}`}>History</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main Content */}
      <ScrollView className="flex-1 px-5">
        <View className="py-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-semibold text-gray-800">
              {activeTab === 'history' ? 'Notification History' : (activeTab === 'critical' ? 'Critical Alerts' : 'Warning Alerts')}
            </Text>
            {getFilteredNotifications().length > 0 && (
              <Text className="text-sm text-gray-500 font-medium">
                {getFilteredNotifications().length} {getFilteredNotifications().length === 1 ? 'notification' : 'notifications'}
              </Text>
            )}
          </View>

          {loading ? (
            <View className="py-16 items-center bg-white rounded-xl shadow-sm">
              <Text className="text-gray-500 mt-4 text-lg">Loading notifications...</Text>
            </View>
          ) : getFilteredNotifications().length > 0 ? (
            <FlatList
              data={getFilteredNotifications()}
              renderItem={renderNotificationItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              contentContainerStyle={{ gap: 12 }}
            />
          ) : (
            <View className="py-16 items-center bg-white rounded-xl shadow-sm">
              <Ionicons name="notifications-off-outline" size={48} color="#9ca3af" />
              <Text className="text-gray-500 mt-4 text-lg">
                {activeTab === 'history' ? 'No history to display' : 'No active alerts'}
              </Text>
            </View>
          )}
        </View>

        <View className="h-16" />
      </ScrollView>
    </SafeAreaView>
  );
}