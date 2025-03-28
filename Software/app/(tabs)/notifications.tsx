import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  Switch,
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
  snoozed: boolean;
}

export default function Notifications() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [snoozeModalVisible, setSnoozeModalVisible] = useState(false);
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);
  const screenWidth = Dimensions.get('window').width;

  const [notificationSettings, setNotificationSettings] = useState({
    sound: true,
    vibration: true,
    criticalOnly: false,
  });

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "critical",
      message: "pH Level Critical",
      parameter: "pH",
      value: "7.0",
      timestamp: "10:30 AM",
      read: false,
      snoozed: false,
    },
    {
      id: "2",
      type: "warning",
      message: "Water Level Low",
      parameter: "Water Level",
      value: "8cm",
      timestamp: "9:45 AM",
      read: false,
      snoozed: false,
    },
    {
      id: "3",
      type: "normal",
      message: "Temperature Normal",
      parameter: "Temp",
      value: "22°C",
      timestamp: "8:30 AM",
      read: true,
      snoozed: false,
    },
    {
      id: "4",
      type: "warning",
      message: "Ammonia Level Rising",
      parameter: "Ammonia",
      value: "0.25ppm",
      timestamp: "7:15 AM",
      read: false,
      snoozed: false,
    },
    {
      id: "5",
      type: "critical",
      message: "Oxygen Level Low",
      parameter: "O₂",
      value: "4mg/L",
      timestamp: "Yesterday",
      read: true,
      snoozed: false,
    },
  ]);

  const markAllAsRead = () => {
    setNotifications(
      notifications.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  };

  const dismissNotification = (id: string) => {
    setNotifications(notifications.filter((notification) => notification.id !== id));
  };

  const dismissAll = () => {
    setNotifications([]);
  };

  const snoozeNotification = (id: string, hours: number) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id ? { ...notification, snoozed: true } : notification
      )
    );
    setSnoozeModalVisible(false);
  };

  const getFilteredNotifications = () => {
    if (activeTab === "all") return notifications.filter(n => !n.read);
    if (activeTab === "critical") return notifications.filter(n => n.type === "critical" && !n.read);
    if (activeTab === "warning") return notifications.filter(n => n.type === "warning" && !n.read);
    if (activeTab === "history") return notifications.filter(n => n.read);
    return notifications.filter(n => !n.read);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "critical":
        return "#ef4444"; // red-500
      case "warning":
        return "#f59e0b"; // amber-500
      case "normal":
        return "#22c55e"; // green-500
      default:
        return "#64748b"; // slate-500
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <View className="mb-4 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <View className="flex-row items-start">
        <View
          style={{ backgroundColor: getTypeColor(item.type) }}
          className="w-3 h-3 rounded-full mt-1.5 mr-3"
        />
        <View className="flex-1">
          <Text
            style={{ color: getTypeColor(item.type) }}
            className="font-semibold text-base"
          >
            [{item.type.charAt(0).toUpperCase() + item.type.slice(1)}] {item.message}
          </Text>
          <Text className="text-gray-600 mb-4 mt-1">
            {item.parameter}: {item.value} ({item.timestamp})
          </Text>
          <View className="flex-row justify-between">
            <TouchableOpacity
              className="flex-row items-center bg-gray-100 px-3 py-1.5 rounded-full"
              onPress={() => {
                setSelectedNotificationId(item.id);
                setSnoozeModalVisible(true);
              }}
            >
              <Ionicons name="time-outline" size={16} color="gray" />
              <Text className="ml-1 text-gray-600 font-medium">Snooze</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center bg-gray-100 px-3 py-1.5 rounded-full"
              onPress={() => dismissNotification(item.id)}
            >
              <Ionicons name="checkmark-outline" size={16} color="gray" />
              <Text className="ml-1 text-gray-600 font-medium">Dismiss</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center bg-gray-100 w-8 h-8 justify-center rounded-full"
              onPress={() => dismissNotification(item.id)}
            >
              <Ionicons name="close-outline" size={18} color="gray" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row justify-between items-center px-5 pt-17 pb-4 border-b border-gray-200 bg-white">
        <Text className="text-2xl font-bold">Notifications</Text>
      </View>

      {/* Tabs */}
      <View className="px-2 py-3 bg-white border-b border-gray-200">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-2">
          <TouchableOpacity
            className={`mr-3 py-2 px-4 rounded-full ${activeTab === 'all' ? 'bg-blue-500' : 'bg-gray-100'}`}
            onPress={() => setActiveTab('all')}
          >
            <Text className={`${activeTab === 'all' ? 'text-white font-semibold' : 'text-gray-700'}`}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`mr-3 py-2 px-4 rounded-full ${activeTab === 'critical' ? 'bg-red-500' : 'bg-gray-100'}`}
            onPress={() => setActiveTab('critical')}
          >
            <Text className={`${activeTab === 'critical' ? 'text-white font-semibold' : 'text-gray-700'}`}>Critical</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`mr-3 py-2 px-4 rounded-full ${activeTab === 'warning' ? 'bg-amber-500' : 'bg-gray-100'}`}
            onPress={() => setActiveTab('warning')}
          >
            <Text className={`${activeTab === 'warning' ? 'text-white font-semibold' : 'text-gray-700'}`}>Warning</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`mr-3 py-2 px-4 rounded-full ${activeTab === 'history' ? 'bg-gray-500' : 'bg-gray-100'}`}
            onPress={() => setActiveTab('history')}
          >
            <Text className={`${activeTab === 'history' ? 'text-white font-semibold' : 'text-gray-700'}`}>History</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main Content */}
      <ScrollView className="flex-1 px-4">
        <View className="py-5">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-semibold text-gray-800">
              {activeTab === 'history' ? 'Notification History' : 'Active Alerts'}
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
            />
          ) : (
            <View className="py-12 items-center bg-white rounded-xl shadow-sm">
              <Ionicons name="notifications-off-outline" size={48} color="#9ca3af" />
              <Text className="text-gray-500 mt-4 text-base">No notifications to display</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        {getFilteredNotifications().length > 0 && (
          <View className="flex-row justify-between mb-8">
            <TouchableOpacity
              className="py-3 px-5 bg-white rounded-lg shadow-sm border border-gray-200 flex-1 mr-2 items-center"
              onPress={markAllAsRead}
            >
              <Text className="font-medium text-gray-700">Mark All as Read</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="py-3 px-5 bg-red-50 rounded-lg shadow-sm border border-red-100 flex-1 ml-2 items-center"
              onPress={dismissAll}
            >
              <Text className="font-medium text-red-500">Dismiss All</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Add some bottom padding to account for the tab bar */}
        <View className="h-24" />
      </ScrollView>


      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black bg-opacity-50">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold">Filter Notifications</Text>
              <TouchableOpacity
                className="bg-gray-100 p-2 rounded-full"
                onPress={() => setFilterModalVisible(false)}
              >
                <Ionicons name="close" size={20} color="black" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              className="flex-row items-center py-4 border-b border-gray-100"
              onPress={() => {
                setActiveTab('all');
                setFilterModalVisible(false);
              }}
            >
              <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3">
                <Ionicons name="apps" size={18} color="#3b82f6" />
              </View>
              <Text className="text-base font-medium">All Notifications</Text>
              {activeTab === 'all' && (
                <Ionicons name="checkmark" size={20} color="#3b82f6" style={{ marginLeft: 'auto' }} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center py-4 border-b border-gray-100"
              onPress={() => {
                setActiveTab('critical');
                setFilterModalVisible(false);
              }}
            >
              <View className="w-8 h-8 bg-red-100 rounded-full items-center justify-center mr-3">
                <Ionicons name="alert-circle" size={18} color="#ef4444" />
              </View>
              <Text className="text-base font-medium">Critical Only</Text>
              {activeTab === 'critical' && (
                <Ionicons name="checkmark" size={20} color="#3b82f6" style={{ marginLeft: 'auto' }} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center py-4 border-b border-gray-100"
              onPress={() => {
                setActiveTab('warning');
                setFilterModalVisible(false);
              }}
            >
              <View className="w-8 h-8 bg-amber-100 rounded-full items-center justify-center mr-3">
                <Ionicons name="warning" size={18} color="#f59e0b" />
              </View>
              <Text className="text-base font-medium">Warnings Only</Text>
              {activeTab === 'warning' && (
                <Ionicons name="checkmark" size={20} color="#3b82f6" style={{ marginLeft: 'auto' }} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center py-4"
              onPress={() => {
                setActiveTab('history');
                setFilterModalVisible(false);
              }}
            >
              <View className="w-8 h-8 bg-gray-200 rounded-full items-center justify-center mr-3">
                <Ionicons name="time" size={18} color="#4b5563" />
              </View>
              <Text className="text-base font-medium">History</Text>
              {activeTab === 'history' && (
                <Ionicons name="checkmark" size={20} color="#3b82f6" style={{ marginLeft: 'auto' }} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Snooze Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={snoozeModalVisible}
        onRequestClose={() => setSnoozeModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black bg-opacity-50">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold">Snooze Notification</Text>
              <TouchableOpacity
                className="bg-gray-100 p-2 rounded-full"
                onPress={() => setSnoozeModalVisible(false)}
              >
                <Ionicons name="close" size={20} color="black" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              className="flex-row items-center py-4 border-b border-gray-100"
              onPress={() => selectedNotificationId && snoozeNotification(selectedNotificationId, 1)}
            >
              <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3">
                <Text className="font-bold text-blue-500">1</Text>
              </View>
              <Text className="text-base font-medium">Snooze for 1 hour</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center py-4 border-b border-gray-100"
              onPress={() => selectedNotificationId && snoozeNotification(selectedNotificationId, 4)}
            >
              <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3">
                <Text className="font-bold text-blue-500">4</Text>
              </View>
              <Text className="text-base font-medium">Snooze for 4 hours</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center py-4"
              onPress={() => selectedNotificationId && snoozeNotification(selectedNotificationId, 8)}
            >
              <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3">
                <Text className="font-bold text-blue-500">8</Text>
              </View>
              <Text className="text-base font-medium">Snooze for 8 hours</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}