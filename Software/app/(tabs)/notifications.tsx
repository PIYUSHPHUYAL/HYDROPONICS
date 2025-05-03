import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  FlatList,
  Modal,
  Dimensions,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
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

interface GuideItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  content?: string[];
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
    warning: { min: 40 }
  },
  airTemperature: {
    warning: { min: 15 },
    critical: { max: 35 }
  }
};

// Sample guide data with content
const GUIDES: GuideItem[] = [
  {
    id: '1',
    title: 'pH Management',
    description: 'Learn how to maintain optimal pH levels for your hydroponic system',
    icon: 'water-outline',
    content: [
      "pH is critical in hydroponics as it directly affects nutrient availability to plants.",
      "Most hydroponic crops thrive in a pH range of 5.5 to 6.5, slightly more acidic than soil.",
      "In hydroponics, pH can fluctuate rapidly - check levels daily, especially in smaller systems.",
      "To lower pH: Add pH down solution (phosphoric acid) in small increments.",
      "To raise pH: Add pH up solution (potassium hydroxide) carefully.",
      "Different hydroponic crops have different pH preferences - leafy greens prefer 6.0-6.5, while fruiting plants prefer 5.5-6.0.",
      "In recirculating systems, pH tends to rise as plants take up nutrients - be prepared to adjust regularly.",
      "Always calibrate your pH meter monthly for accurate readings in your hydroponic solution."
    ]
  },
  {
    id: '2',
    title: 'Temperature Control',
    description: 'Managing solution and ambient temperatures in hydroponics',
    icon: 'thermometer-outline',
    content: [
      "Nutrient solution temperature is critical in hydroponics - aim for 65-70°F (18-21°C).",
      "Warm nutrient solutions (>75°F/24°C) hold less dissolved oxygen, causing root problems.",
      "In DWC and NFT systems, solution temperature is especially critical for root health.",
      "Use water chillers in warm climates to maintain optimal solution temperatures.",
      "Insulate reservoir tanks to prevent temperature fluctuations in your nutrient solution.",
      "For grow room air, maintain 65-80°F (18-27°C) during day, 60-70°F (15-21°C) at night.",
      "Install circulation fans to prevent hot spots and maintain even temperatures around plants.",
      "Temperature affects transpiration rate - higher temperatures may require more frequent reservoir top-offs."
    ]
  },
  {
    id: '3',
    title: 'Nutrient Solutions',
    description: 'Mixing and maintaining hydroponic nutrient solutions',
    icon: 'flask-outline',
    content: [
      "Start with reverse osmosis or filtered water for precise control of your nutrient profile.",
      "Use hydroponic-specific nutrients with complete micro and macronutrient profiles.",
      "Measure EC (Electrical Conductivity) daily - it indicates the concentration of nutrients.",
      "For leafy greens, maintain EC between 0.8-1.2; for fruiting plants, use 1.2-3.0.",
      "Change nutrient solution completely every 7-10 days in recirculating systems.",
      "Top up with plain water between changes as plants consume water faster than nutrients.",
      "In hydroponic systems, nutrient lockout occurs when pH is outside optimal range.",
      "For NFT and DWC systems, maintain higher dissolved oxygen levels in your nutrient solution."
    ]
  },
  {
    id: '4',
    title: 'Pest Management',
    description: 'Controlling pests in hydroponic systems',
    icon: 'bug-outline',
    content: [
      "Hydroponics can reduce soil-borne pests but still requires vigilant monitoring.",
      "Quarantine new plants before adding them to your hydroponic system.",
      "Use physical barriers like insect netting around your growing area.",
      "Beneficial insects like ladybugs can control aphids in indoor hydroponic setups.",
      "Neem oil can be used as a foliar spray, but avoid getting it in your nutrient solution.",
      "Yellow sticky traps help monitor and reduce flying insects in your grow room.",
      "Maintain proper spacing between plants for airflow to reduce humidity-loving pests.",
      "In hydroponic systems, root diseases like pythium can spread rapidly - maintain clean reservoirs and equipment."
    ]
  },
  {
    id: '5',
    title: 'Harvesting Hydroponic Crops',
    description: 'Maximizing yield from your hydroponic system',
    icon: 'leaf-outline',
    content: [
      "Hydroponic crops often grow 30-50% faster than soil-grown plants - adjust harvest schedules accordingly.",
      "For leafy greens like lettuce, harvest the entire plant in most hydroponic systems.",
      "Herbs like basil can be harvested continuously - take outer stems and leaves first.",
      "In NFT systems, stagger plantings every 1-2 weeks for continuous harvests.",
      "Hydroponic fruiting crops like tomatoes and peppers produce higher yields than soil - support plants properly.",
      "Use clean, sanitized tools when harvesting to prevent introducing pathogens to your system.",
      "After harvesting, clean and sanitize growing channels or containers before replanting.",
      "For commercial hydroponic systems, track days-to-harvest data to optimize production schedules."
    ]
  }
];

export default function Notifications() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("critical");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [popCode, setPopCode] = useState<string | null>(null);
  const [selectedGuide, setSelectedGuide] = useState<GuideItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Retrieve POP code from AsyncStorage
  useEffect(() => {
    const getPop = async () => {
      try {
        const savedPop = await AsyncStorage.getItem("popCode");
        if (savedPop) {
          console.log("Using POP code from storage:", savedPop);
          setPopCode(savedPop);
        } else {
          console.error("No POP code found in AsyncStorage");
          // Optionally redirect or handle missing code
        }
      } catch (error) {
        console.error("Error retrieving POP code:", error);
      }
    };
    getPop();
  }, []);

  // Listen for sensor readings once popCode is available
  useEffect(() => {
    if (!popCode) return;

    console.log(`Subscribing to database path: ${popCode}/current`);
    const readingsRef = ref(database, `${popCode}/current`);

    const unsubscribe = onValue(
      readingsRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setLoading(false);
          return;
        }

        const latestReading = snapshot.val() as {
          pH?: number;
          tds?: number;
          waterTemperature?: number;
          airHumidity?: number;
          airTemperature?: number;
          time?: string;
        };
        const timeString = latestReading.time || '';

        const newNotifications: Notification[] = [];
        const generateNotification = (
          parameter: string,
          value: any,
          thresholds: any,
          timeStr: string
        ): Notification | null => {
          if (value === undefined || value === null) return null;
          const numValue = parseFloat(value);
          let type: "critical" | "warning" | "normal" = "normal";
          let message = "";

          if (thresholds.critical) {
            if (thresholds.critical.min !== undefined && numValue < thresholds.critical.min) {
              type = "critical";
              message = `${parameter} Too Low`;
            } else if (thresholds.critical.max !== undefined && numValue > thresholds.critical.max) {
              type = "critical";
              message = `${parameter} Too High`;
            }
          }
          if (type === "normal" && thresholds.warning) {
            if (thresholds.warning.min !== undefined && numValue < thresholds.warning.min) {
              type = "warning";
              message = `${parameter} Low`;
            } else if (thresholds.warning.max !== undefined && numValue > thresholds.warning.max) {
              type = "warning";
              message = `${parameter} High`;
            }
          }
          if (type === "normal") return null;

          const formatTime = (time24: string): string => {
            const [hourStr, minuteStr] = time24.split(":");
            let hour = parseInt(hourStr, 10);
            const period = hour >= 12 ? "pm" : "am";
            hour = hour % 12 || 12;
            return `${hour}:${minuteStr} ${period}`;
          };
          const formatted = formatTime(timeStr);

          return {
            id: `${parameter}-${Date.now()}`,
            type,
            message,
            parameter,
            value: numValue.toFixed(parameter === "pH" ? 2 : 0),
            timestamp: formatted,
            read: false
          };
        };

        [
          ["pH", latestReading.pH, THRESHOLDS.pH],
          ["TDS", latestReading.tds, THRESHOLDS.tds],
          ["Water Temp", latestReading.waterTemperature, THRESHOLDS.waterTemperature],
          ["Air Humidity", latestReading.airHumidity, THRESHOLDS.airHumidity],
          ["Air Temp", latestReading.airTemperature, THRESHOLDS.airTemperature]
        ].forEach(([param, val, thresh]) => {
          const note = generateNotification(param as string, val, thresh, timeString);
          if (note) newNotifications.push(note);
        });

        setNotifications(prev => [
          ...newNotifications,
          ...prev.filter(n => n.read)
        ]);
        setLoading(false);
      },
      (error) => {
        console.error("Database error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [popCode]);

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
      case "critical": return "#ef4444";
      case "warning": return "#f59e0b";
      default: return "#64748b";
    }
  };

  const handleGuidePress = (guide: GuideItem) => {
    setSelectedGuide(guide);
    setModalVisible(true);
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <View className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
      <View className="flex-row items-start">
        <View style={{ backgroundColor: getTypeColor(item.type) }} className="w-3 h-3 rounded-full mt-1.5 mr-4" />
        <View className="flex-1">
          <Text style={{ color: getTypeColor(item.type) }} className="font-semibold text-lg">
            [{item.type.charAt(0).toUpperCase() + item.type.slice(1)}] {item.message}
          </Text>
          <Text className="text-gray-600 mt-1.5">
            {item.parameter}: {item.value} ({item.timestamp})
          </Text>
        </View>
        {(item.type === "critical" || item.type === "warning") && !item.read && (
          <TouchableOpacity className="bg-gray-100 p-2 rounded-full" onPress={() => moveNotificationToHistory(item.id)}>
            <Ionicons name="close" size={20} color="gray" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderGuideItem = ({ item }: { item: GuideItem }) => (
    <TouchableOpacity
      className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm mb-4"
      onPress={() => handleGuidePress(item)}
    >
      <View className="flex-row items-start">
        <View className="bg-green-50 p-3 rounded-full mr-4">
          <Ionicons name={item.icon} size={24} color="#22c55e" />
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-lg text-gray-800">{item.title}</Text>
          <Text className="text-gray-600 mt-1">{item.description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (activeTab === "guide") {
      return (
        <View className="py-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-semibold text-gray-800">Farmer's Guide</Text>
          </View>
          <FlatList
            data={GUIDES}
            renderItem={renderGuideItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </View>
      );
    }

    return (
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
          <FlatList data={getFilteredNotifications()} renderItem={renderNotificationItem} keyExtractor={item => item.id} scrollEnabled={false} contentContainerStyle={{ gap: 12 }} />
        ) : (
          <View className="py-16 items-center bg-white rounded-xl shadow-sm">
            <Ionicons name="notifications-off-outline" size={48} color="#9ca3af" />
            <Text className="text-gray-500 mt-4 text-lg">
              {activeTab === 'history' ? 'No history to display' : 'No active alerts'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <View className="flex-row justify-between items-center px-5 pt-4 pb-6 border-b border-gray-200 bg-gray" >
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text className="text-2xl font-bold text-black-800 ">Notifications</Text>
        </View>
      </View>
      <View className="px-4 py-3 bg-gray border-b border-gray-200">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity className={`mr-3 py-2.5 px-5 rounded-full ${activeTab === 'critical' ? 'bg-red-500' : 'bg-gray-200'}`} onPress={() => setActiveTab('critical')}>
            <Text className={`${activeTab === 'critical' ? 'text-white font-semibold' : 'text-gray-700'}`}>Critical</Text>
          </TouchableOpacity>
          <TouchableOpacity className={`mr-3 py-2.5 px-5 rounded-full ${activeTab === 'warning' ? 'bg-amber-500' : 'bg-gray-200'}`} onPress={() => setActiveTab('warning')}>
            <Text className={`${activeTab === 'warning' ? 'text-white font-semibold' : 'text-gray-700'}`}>Warning</Text>
          </TouchableOpacity>
          <TouchableOpacity className={`mr-3 py-2.5 px-5 rounded-full ${activeTab === 'history' ? 'bg-gray-500' : 'bg-gray-200'}`} onPress={() => setActiveTab('history')}>
            <Text className={`${activeTab === 'history' ? 'text-white font-semibold' : 'text-gray-700'}`}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity className={`mr-3 py-2.5 px-5 rounded-full ${activeTab === 'guide' ? 'bg-green-500' : 'bg-gray-200'}`} onPress={() => setActiveTab('guide')}>
            <Text className={`${activeTab === 'guide' ? 'text-white font-semibold' : 'text-gray-700'}`}>Guide</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      <ScrollView className="flex-1 px-5">
        {renderContent()}
        <View className="h-16" />
      </ScrollView>

      {/* Guide Content Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-xl w-11/12 max-h-4/5 p-6">
            {selectedGuide && (
              <>
                <View className="flex-row items-center mb-4">
                  <View className="bg-green-50 p-3 rounded-full mr-4">
                    <Ionicons name={selectedGuide.icon} size={28} color="#22c55e" />
                  </View>
                  <Text className="text-2xl font-bold text-gray-800 flex-1">{selectedGuide.title}</Text>
                </View>

                <ScrollView className="max-h-96">
                  <Text className="text-gray-600 mb-4 italic">{selectedGuide.description}</Text>

                  {selectedGuide.content?.map((tip, index) => (
                    <View key={index} className="flex-row mb-4">
                      <View className="bg-green-50 rounded-full h-6 w-6 items-center justify-center mr-3 mt-0.5">
                        <Text className="text-green-600 font-bold">{index + 1}</Text>
                      </View>
                      <Text className="text-gray-800 flex-1">{tip}</Text>
                    </View>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  className="bg-green-500 py-3 px-6 rounded-lg mt-4 items-center"
                  onPress={() => setModalVisible(false)}
                >
                  <Text className="text-white font-semibold">Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}