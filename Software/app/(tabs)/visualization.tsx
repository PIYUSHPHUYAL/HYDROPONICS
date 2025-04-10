import { View, Text, TouchableOpacity, SafeAreaView, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { database, ref, onValue } from './firebase';

// Constants
const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_MARGIN = 40;
const CHART_WIDTH = SCREEN_WIDTH - CHART_MARGIN;
const MAX_DATA_POINTS = 10;
const EC_SCALE_FACTOR = 500;
const NPT_OFFSET = { hours: 5, minutes: 45 };

// Types
interface Reading {
  timestamp: number;
  pH: number;
  tds: number;
  waterTemperature: number;
  airTemperature: number;
}

interface HistoricalData {
  timestamps: string[];
  pH: number[];
  ec: number[];
  waterTemp: number[];
  airTemp: number[];
}

const Visualization = () => {
  const router = useRouter();
  const [historicalData, setHistoricalData] = useState<HistoricalData>({
    timestamps: [],
    pH: [],
    ec: [],
    waterTemp: [],
    airTemp: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert TDS to EC
  const calculateEC = (tds: number): number => {
    const conversionFactor = 0.67;
    return tds ? (parseFloat(tds.toString()) / conversionFactor) : 0;
  };

  // Format timestamp to NPT
  const formatToNPT = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    let hoursUTC = date.getUTCHours();
    let minutesUTC = date.getUTCMinutes();
    const secondsUTC = date.getUTCSeconds();

    // Add NPT offset
    let hoursNPT = (hoursUTC + NPT_OFFSET.hours) % 24;
    let minutesNPT = minutesUTC + NPT_OFFSET.minutes;

    if (minutesNPT >= 60) {
      hoursNPT = (hoursNPT + 1) % 24;
      minutesNPT -= 60;
    }

    return `${hoursNPT.toString().padStart(2, '0')}:${minutesNPT.toString().padStart(2, '0')}:${secondsUTC.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const readingsRef = ref(database, "readings");

    const unsubscribe = onValue(
      readingsRef,
      (snapshot) => {
        try {
          if (!snapshot.exists()) {
            setError("No data available");
            return;
          }

          const readings: Reading[] = [];
          snapshot.forEach((childSnapshot) => {
            readings.push({
              timestamp: parseInt(childSnapshot.key || "0"),
              ...childSnapshot.val()
            });
          });

          // Process recent readings
          const recentReadings = readings
            .sort((a, b) => a.timestamp - b.timestamp)
            .slice(-MAX_DATA_POINTS);

          const processedData = recentReadings.reduce((acc, reading) => {
            const timeStr = formatToNPT(reading.timestamp);
            return {
              timestamps: [...acc.timestamps, timeStr],
              pH: [...acc.pH, reading.pH || 0],
              ec: [...acc.ec, calculateEC(reading.tds)],
              waterTemp: [...acc.waterTemp, reading.waterTemperature || 0],
              airTemp: [...acc.airTemp, reading.airTemperature || 0]
            };
          }, { timestamps: [], pH: [], ec: [], waterTemp: [], airTemp: [] } as HistoricalData);

          setHistoricalData(processedData);
          setError(null);
        } catch (err) {
          setError("Error processing data");
          console.error("Data processing error:", err);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setError("Failed to fetch data");
        console.error("Database error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Memoized chart configurations
  const chartConfig = useMemo(() => ({
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(0, 136, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { r: '4', strokeWidth: '2' },
  }), []);

  // Memoized chart data
  const { pHECData, tempData } = useMemo(() => {
    const labels = historicalData.timestamps.filter((_, i) => i % 2 === 0);
    return {
      pHECData: {
        labels,
        datasets: [
          {
            data: historicalData.pH,
            color: (opacity = 1) => `rgba(0, 136, 255, ${opacity})`,
            strokeWidth: 2,
          },
          {
            data: historicalData.ec.map(val => val / EC_SCALE_FACTOR),
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
            strokeWidth: 2,
          },
        ],
        legend: ['pH', 'EC (scaled)']
      },
      tempData: {
        labels,
        datasets: [
          {
            data: historicalData.waterTemp,
            color: (opacity = 1) => `rgba(0, 136, 255, ${opacity})`,
            strokeWidth: 2,
          },
          {
            data: historicalData.airTemp,
            color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
            strokeWidth: 2,
          },
        ],
        legend: ['Water Temp (°C)', 'Air Temp (°C)']
      }
    };
  }, [historicalData]);

  const renderChart = (title: string, subtitle: string, data: any, yAxisSuffix: string) => (
    <View className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100">
      <Text className="text-lg font-semibold mb-2">{title}</Text>
      <Text className="text-sm text-gray-500 mb-1">{subtitle}</Text>
      <LineChart
        data={data}
        width={CHART_WIDTH}
        height={250}
        chartConfig={chartConfig}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
        fromZero={false}
        yAxisSuffix={yAxisSuffix}
        yAxisInterval={1}
        verticalLabelRotation={30}
      />
      <View className="flex-row justify-between mt-2">
        {data.datasets.map((dataset: any, index: number) => (
          <View key={index} className="flex-row items-center">
            <View
              className="w-3 h-3 rounded-full mr-1"
              style={{ backgroundColor: dataset.color(1) }}
            />
            <Text className="text-xs">{data.legend[index]}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View style={{ position: 'absolute', top: 63, right: 17.5, zIndex: 10 }}>
        <TouchableOpacity onPress={() => router.push("/notifications")}>
          <Ionicons name="notifications-outline" size={24} color="black" />
          <View className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
        </TouchableOpacity>
      </View>
      <Text className="text-2xl font-bold text-center mb-6 my-4">Water Quality Trends</Text>

      <ScrollView className="flex-1 px-4 pt-4">
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
            {renderChart(
              'pH & EC Trends',
              'Optimal pH: 5.5-6.5 | Optimal EC: 1.2-2.4 mS/cm',
              pHECData,
              ''
            )}
            {renderChart(
              'Temperature Comparison',
              'Optimal water temp: 18-26°C',
              tempData,
              '°C'
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Visualization;