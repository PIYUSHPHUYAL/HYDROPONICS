import React, { useState } from "react";
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

interface Notification {
  id: string;
  type: "critical" | "warning" | "normal";
  message: string;
  parameter: string;
  value: string;
  timestamp: string;
  read: boolean;
}

export default function Notifications() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("critical");
  const screenWidth = Dimensions.get('window').width;

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "critical",
      message: "pH Level Critical",
      parameter: "pH",
      value: "7.0",
      timestamp: "10:30 AM",
      read: false,
    },
    {
      id: "2",
      type: "warning",
      message: "Water Level Low",
      parameter: "Water Level",
      value: "8cm",
      timestamp: "9:45 AM",
      read: false,
    },
    {
      id: "3",
      type: "normal",
      message: "Temperature Normal",
      parameter: "Temp",
      value: "22°C",
      timestamp: "8:30 AM",
      read: true,
    },
    {
      id: "4",
      type: "warning",
      message: "Ammonia Level Rising",
      parameter: "Ammonia",
      value: "0.25ppm",
      timestamp: "7:15 AM",
      read: false,
    },
    {
      id: "5",
      type: "critical",
      message: "Oxygen Level Low",
      parameter: "O₂",
      value: "4mg/L",
      timestamp: "Yesterday",
      read: true,
    },
  ]);

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

          {getFilteredNotifications().length > 0 ? (
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