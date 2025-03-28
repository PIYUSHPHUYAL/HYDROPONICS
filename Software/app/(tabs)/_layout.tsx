import { View, Text } from 'react-native';
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const _Layout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          position: 'absolute',
          bottom: 25,
          // left: 60,  // Keep left as it is
          // right: 10,
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
          // Center icons vertically
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
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name="home"
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
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name="options"
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
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name="bar-chart"
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
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name="settings"
              color={focused ? '#4CAF50' : '#888'}
              size={26}
            />
          ),
        }}
      />
      {/* Removed any extra tab screens */}

      {/* Add notifications as a hidden screen that won't appear in the tab bar */}
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          headerShown: false,
          href: null, // This prevents it from showing in the tab bar
        }}
      />
    </Tabs>
  );
};

export default _Layout;