import { View, Image, Animated } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const _Layout = () => {
  const [showSplash, setShowSplash] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // // Set up the animation
    // Animated.timing(splashOpacity, {
    //   toValue: 0,
    //   duration: 500,
    //   useNativeDriver: true,
    // }).start();

    // Hide splash screen after 2 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}>
        <Animated.Image
          source={require("../../assets12345/Welcome_screen.png")}
          style={{ width: 300, height: 300, opacity: splashOpacity, top: -25 }}
        />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          position: 'absolute',
          bottom: 25,
          elevation: 0,
          backgroundColor: '#ffffff',
          borderRadius: 60,
          height: 80,
          width: 350,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 3.5,
          transform: [{ translateX: 18 }],
        },
        tabBarShowLabel: false,
        tabBarItemStyle: {
          marginTop: 22.5,
          height: 60,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="home-outline"
              color={focused ? '#4CAF50' : '#888'}
              size={26}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="control"
        options={{
          title: 'Control',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="options-outline"
              color={focused ? '#4CAF50' : '#888'}
              size={26}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="visualization"
        options={{
          title: 'Visualization',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="bar-chart-outline"
              color={focused ? '#4CAF50' : '#888'}
              size={26}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="settings-outline"
              color={focused ? '#4CAF50' : '#888'}
              size={26}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          headerShown: false,
          href: null,
        }}
      />
    </Tabs>
  );
};

export default _Layout;