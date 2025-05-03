import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native"
import { useState } from "react"
import { Ionicons } from "@expo/vector-icons"

const SuggestionSection = () => {
  const [activeTab, setActiveTab] = useState("ph") // 'ph', 'tds', 'maintenance'

  return (
    <View className=" mb-4 rounded-xl overflow-hidden bg-white shadow-md border border-gray-100">
      <View className="p-5">
        <View className="flex-row items-center mb-4">
          <Ionicons name="bulb" size={20} color="#3b82f6" />
          <Text className="text-gray-800 text-lg font-bold ml-2">Farmer's Guide</Text>
        </View>

        {/* Tabs for different suggestion categories */}
        <View className="flex-row justify-between mb-4">
          <TouchableOpacity
            className={`flex-1 py-2 items-center ${activeTab === "ph" ? "bg-blue-500" : "bg-gray-200"} rounded-l-lg`}
            onPress={() => setActiveTab("ph")}
          >
            <Text className={`text-sm ${activeTab === "ph" ? "text-white" : "text-gray-700"}`}>pH Balance</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-2 items-center ${activeTab === "tds" ? "bg-blue-500" : "bg-gray-200"}`}
            onPress={() => setActiveTab("tds")}
          >
            <Text className={`text-sm ${activeTab === "tds" ? "text-white" : "text-gray-700"}`}>Nutrients</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-2 items-center ${activeTab === "maintenance" ? "bg-blue-500" : "bg-gray-200"} rounded-r-lg`}
            onPress={() => setActiveTab("maintenance")}
          >
            <Text className={`text-sm ${activeTab === "maintenance" ? "text-white" : "text-gray-700"}`}>Maintenance</Text>
          </TouchableOpacity>
        </View>

        {/* pH Suggestions */}
        {activeTab === "ph" && (
          <ScrollView className="max-h-80">
            {/* Low pH */}
            <View className="mb-4 bg-blue-50 p-4 rounded-lg">
              <View className="flex-row items-center mb-2">
                <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-3">
                  <Ionicons name="arrow-down" size={20} color="#ef4444" />
                </View>
                <Text className="text-base font-bold">Low pH (Below 5.5)</Text>
              </View>

              <Text className="text-sm text-gray-700 mb-3">
                When pH is too low (acidic), plants may struggle to absorb nutrients like calcium and magnesium.
              </Text>

              <View className="bg-white p-3 rounded-lg mb-2">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="checkmark-circle" size={18} color="#3b82f6" />
                  <Text className="text-sm font-medium ml-2">Add pH Up solution gradually</Text>
                </View>
                <Text className="text-xs text-gray-600 ml-6">
                  Add small amounts (1ml per gallon) and retest after 30 minutes
                </Text>
              </View>

              <View className="bg-white p-3 rounded-lg mb-2">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="checkmark-circle" size={18} color="#3b82f6" />
                  <Text className="text-sm font-medium ml-2">Use potassium bicarbonate</Text>
                </View>
                <Text className="text-xs text-gray-600 ml-6">
                  A natural alternative to commercial pH Up products
                </Text>
              </View>

              <View className="bg-white p-3 rounded-lg">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="alert-circle" size={18} color="#f59e0b" />
                  <Text className="text-sm font-medium ml-2">Avoid quick changes</Text>
                </View>
                <Text className="text-xs text-gray-600 ml-6">
                  Adjust pH gradually to prevent shocking plants
                </Text>
              </View>
            </View>

            {/* High pH */}
            <View className="mb-4 bg-blue-50 p-4 rounded-lg">
              <View className="flex-row items-center mb-2">
                <View className="w-10 h-10 rounded-full bg-yellow-100 items-center justify-center mr-3">
                  <Ionicons name="arrow-up" size={20} color="#f59e0b" />
                </View>
                <Text className="text-base font-bold">High pH (Above 6.5)</Text>
              </View>

              <Text className="text-sm text-gray-700 mb-3">
                When pH is too high (alkaline), plants may struggle to absorb iron, manganese, and phosphorus.
              </Text>

              <View className="bg-white p-3 rounded-lg mb-2">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="checkmark-circle" size={18} color="#3b82f6" />
                  <Text className="text-sm font-medium ml-2">Add pH Down solution</Text>
                </View>
                <Text className="text-xs text-gray-600 ml-6">
                  Add small amounts (1ml per gallon) and retest after 30 minutes
                </Text>
              </View>

              <View className="bg-white p-3 rounded-lg mb-2">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="checkmark-circle" size={18} color="#3b82f6" />
                  <Text className="text-sm font-medium ml-2">Use citric acid or vinegar</Text>
                </View>
                <Text className="text-xs text-gray-600 ml-6">
                  Natural alternatives: 1ml vinegar per gallon can lower pH
                </Text>
              </View>

              <View className="bg-white p-3 rounded-lg">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="alert-circle" size={18} color="#f59e0b" />
                  <Text className="text-sm font-medium ml-2">Check water source</Text>
                </View>
                <Text className="text-xs text-gray-600 ml-6">
                  Hard water can cause persistent high pH issues
                </Text>
              </View>
            </View>

            {/* Optimal pH */}
            <View className="mb-2 bg-green-50 p-4 rounded-lg">
              <View className="flex-row items-center mb-2">
                <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3">
                  <Ionicons name="checkmark" size={20} color="#10b981" />
                </View>
                <Text className="text-base font-bold">Optimal pH (5.5-6.5)</Text>
              </View>

              <Text className="text-sm text-gray-700 mb-3">
                Most hydroponic plants thrive when pH is between 5.5-6.5, allowing optimal nutrient absorption.
              </Text>

              <View className="bg-white p-3 rounded-lg mb-2">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="information-circle" size={18} color="#3b82f6" />
                  <Text className="text-sm font-medium ml-2">Monitor daily</Text>
                </View>
                <Text className="text-xs text-gray-600 ml-6">
                  Check pH at the same time each day for consistency
                </Text>
              </View>

              <View className="bg-white p-3 rounded-lg">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="information-circle" size={18} color="#3b82f6" />
                  <Text className="text-sm font-medium ml-2">Calibrate pH meter regularly</Text>
                </View>
                <Text className="text-xs text-gray-600 ml-6">
                  Ensure accurate readings by calibrating monthly
                </Text>
              </View>
            </View>
          </ScrollView>
        )}

        {/* TDS/Nutrient Suggestions */}
        {activeTab === "tds" && (
          <ScrollView className="max-h-80">
            {/* Low TDS */}
            <View className="mb-4 bg-blue-50 p-4 rounded-lg">
              <View className="flex-row items-center mb-2">
                <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-3">
                  <Ionicons name="arrow-down" size={20} color="#ef4444" />
                </View>
                <Text className="text-base font-bold">Low Nutrients (Below 100 ppm)</Text>
              </View>

              <Text className="text-sm text-gray-700 mb-3">
                Low nutrient levels can lead to stunted growth, yellowing leaves, and poor yields.
              </Text>

              <View className="bg-white p-3 rounded-lg mb-2">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="checkmark-circle" size={18} color="#3b82f6" />
                  <Text className="text-sm font-medium ml-2">Add balanced nutrient solution</Text>
                </View>
                <Text className="text-xs text-gray-600 ml-6">
                  Follow manufacturer's instructions for your growth stage
                </Text>
              </View>

              <View className="bg-white p-3 rounded-lg mb-2">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="checkmark-circle" size={18} color="#3b82f6" />
                  <Text className="text-sm font-medium ml-2">Check for nutrient lockout</Text>
                </View>
                <Text className="text-xs text-gray-600 ml-6">
                  Ensure pH is in range to allow proper nutrient absorption
                </Text>
              </View>

              <View className="bg-white p-3 rounded-lg">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="alert-circle" size={18} color="#f59e0b" />
                  <Text className="text-sm font-medium ml-2">Increase gradually</Text>
                </View>
                <Text className="text-xs text-gray-600 ml-6">
                  Aim to increase by 50-100 ppm per day until target is reached
                </Text>
              </View>
            </View>

            {/* High TDS */}
            <View className="mb-4 bg-blue-50 p-4 rounded-lg">
              <View className="flex-row items-center mb-2">
                <View className="w-10 h-10 rounded-full bg-yellow-100 items-center justify-center mr-3">
                  <Ionicons name="arrow-up" size={20} color="#f59e0b" />
                </View>
                <Text className="text-base font-bold">High Nutrients (Above 250 ppm)</Text>
              </View>

              <Text className="text-sm text-gray-700 mb-3">
                Excess nutrients can cause nutrient burn, wilting, and toxicity symptoms in plants.
              </Text>

              <View className="bg-white p-3 rounded-lg mb-2">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="checkmark-circle" size={18} color="#3b82f6" />
                  <Text className="text-sm font-medium ml-2">Dilute with fresh water</Text>
                </View>
                <Text className="text-xs text-gray-600 ml-6">
                  Replace portion of solution with fresh water to reduce concentration
                </Text>
              </View>

              <View className="bg-white p-3 rounded-lg mb-2">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="checkmark-circle" size={18} color="#3b82f6" />
                  <Text className="text-sm font-medium ml-2">Complete solution change</Text>
                </View>
                <Text className="text-xs text-gray-600 ml-6">
                  If levels are very high, replace entire nutrient solution
                </Text>
              </View>

              <View className="bg-white p-3 rounded-lg">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="alert-circle" size={18} color="#f59e0b" />
                  <Text className="text-sm font-medium ml-2">Check for evaporation</Text>
                </View>
                <Text className="text-xs text-gray-600 ml-6">
                  Water evaporation can concentrate nutrients over time
                </Text>
              </View>
            </View>

            {/* Optimal TDS */}
            <View className="mb-2 bg-green-50 p-4 rounded-lg">
              <View className="flex-row items-center mb-2">
                <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3">
                  <Ionicons name="checkmark" size={20} color="#10b981" />
                </View>
                <Text className="text-base font-bold">Optimal Nutrients (100-250 ppm)</Text>
              </View>

              <Text className="text-sm text-gray-700 mb-3">
                Different plants and growth stages require different nutrient levels.
              </Text>

              <View className="bg-white p-3 rounded-lg mb-2">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="information-circle" size={18} color="#3b82f6" />
                  <Text className="text-sm font-medium ml-2">Seedlings: 100-150 ppm</Text>
                </View>
                <Text className="text-xs text-gray-600 ml-6">
                  Young plants need lower nutrient concentrations
                </Text>
              </View>

              <View className="bg-white p-3 rounded-lg mb-2">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="information-circle" size={18} color="#3b82f6" />
                  <Text className="text-sm font-medium ml-2">Vegetative: 150-200 ppm</Text>
                </View>
                <Text className="text-xs text-gray-600 ml-6">
                  Growing plants need moderate nutrient levels
                </Text>
              </View>

              <View className="bg-white p-3 rounded-lg">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="information-circle" size={18} color="#3b82f6" />
                  <Text className="text-sm font-medium ml-2">Flowering: 200-250 ppm</Text>
                </View>
                <Text className="text-xs text-gray-600 ml-6">
                  Fruiting/flowering plants need higher nutrient levels
                </Text>
              </View>
            </View>
          </ScrollView>
        )}

        {/* Maintenance Suggestions */}
        {activeTab === "maintenance" && (
          <ScrollView className="max-h-80">
            {/* Regular Maintenance */}
            <View className="mb-4 bg-blue-50 p-4 rounded-lg">
              <View className="flex-row items-center mb-2">
                <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                  <Ionicons name="calendar" size={20} color="#3b82f6" />
                </View>
                <Text className="text-base font-bold">Regular Maintenance</Text>
              </View>

              <View className="bg-white p-3 rounded-lg mb-2">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="time" size={18} color="#3b82f6" />
                  <Text className="text-sm font-medium ml-2">Daily Tasks</Text>
                </View>
                <Text className="text-xs text-gray-600 ml-6">
                  • Check water level and top off if needed{"\n"}
                  • Monitor pH and TDS levels{"\n"}
                  • Inspect plants for signs of stress
                </Text>
              </View>

              <View className="bg-white p-3 rounded-lg mb-2">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="calendar-outline" size={18} color="#3b82f6" />
                  <Text className="text-sm font-medium ml-2">Weekly Tasks</Text>
                </View>
                <Text className="text-xs text-gray-600 ml-6">
                  • Clean any algae buildup{"\n"}
                  • Check and clean filters{"\n"}
                  • Inspect pumps and air stones
                </Text>
              </View>

              <View className="bg-white p-3 rounded-lg">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="calendar-number" size={18} color="#3b82f6" />
                  <Text className="text-sm font-medium ml-2">Monthly Tasks</Text>
                </View>
                <Text className="text-xs text-gray-600 ml-6">
                  • Complete water change{"\n"}
                  • Deep clean all components{"\n"}
                  • Calibrate pH and TDS meters
                </Text>
              </View>
            </View>

            {/* Water Quality */}
            <View className="mb-4 bg-blue-50 p-4 rounded-lg">
              <View className="flex-row items-center mb-2">
                <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                  <Ionicons name="water" size={20} color="#3b82f6" />
                </View>
                <Text className="text-base font-bold">Water Quality Management</Text>
              </View>

              <Text className="text-sm text-gray-700 mb-3">
                Maintaining water quality is essential for healthy plant growth.
              </Text>

              <View className="bg-white p-3 rounded-lg mb-2">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="checkmark-circle" size={18} color="#3b82f6" />
                  <Text className="text-sm font-medium ml-2">Water temperature</Text>
                </View>
                <Text className="text-xs text-gray-600 ml-6">
                  Keep between 65-75°F (18-24°C) for optimal oxygen levels
                </Text>
              </View>

              <View className="bg-white p-3 rounded-lg mb-2">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="checkmark-circle" size={18} color="#3b82f6" />
                  <Text className="text-sm font-medium ml-2">Prevent algae growth</Text>
                </View>
                <Text className="text-xs text-gray-600 ml-6">
                  Cover reservoirs to block light and prevent algae formation
                </Text>
              </View>

              <View className="bg-white p-3 rounded-lg">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="checkmark-circle" size={18} color="#3b82f6" />
                  <Text className="text-sm font-medium ml-2">Oxygenation</Text>
                </View>
                <Text className="text-xs text-gray-600 ml-6">
                  Use air stones to maintain adequate dissolved oxygen
                </Text>
              </View>
            </View>

            {/* Troubleshooting */}
            <View className="mb-2 bg-blue-50 p-4 rounded-lg">
              <View className="flex-row items-center mb-2">
                <View className="w-10 h-10 rounded-full bg-yellow-100 items-center justify-center mr-3">
                  <Ionicons name="construct" size={20} color="#f59e0b" />
                </View>
                <Text className="text-base font-bold">Troubleshooting</Text>
              </View>

              <View className="bg-white p-3 rounded-lg mb-2">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="alert-circle" size={18} color="#f59e0b" />
                  <Text className="text-sm font-medium ml-2">Root rot</Text>
                </View>
                <Text className="text-xs text-gray-600 ml-6">
                  • Add hydrogen peroxide (3ml of 3% per gallon){"\n"}
                  • Increase oxygenation{"\n"}
                  • Consider beneficial bacteria additives
                </Text>
              </View>

              <View className="bg-white p-3 rounded-lg mb-2">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="alert-circle" size={18} color="#f59e0b" />
                  <Text className="text-sm font-medium ml-2">Nutrient lockout</Text>
                </View>
                <Text className="text-xs text-gray-600 ml-6">
                  • Flush system with clean water{"\n"}
                  • Reset with fresh nutrient solution{"\n"}
                  • Ensure pH is in optimal range
                </Text>
              </View>

              <View className="bg-white p-3 rounded-lg">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="alert-circle" size={18} color="#f59e0b" />
                  <Text className="text-sm font-medium ml-2">Pump failure</Text>
                </View>
                <Text className="text-xs text-gray-600 ml-6">
                  • Check for clogs or debris{"\n"}
                  • Ensure proper voltage{"\n"}
                  • Clean impeller and housing
                </Text>
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  )
}

export default SuggestionSection