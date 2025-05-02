import { View, Image, Animated, Text, TouchableOpacity, StyleSheet, Dimensions, SafeAreaView } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const _Layout = () => {
  // States to control what to show
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentOnboardingScreen, setCurrentOnboardingScreen] = useState(0);

  const splashOpacity = useRef(new Animated.Value(1)).current;

  // Animation values for the third onboarding screen
  const fadeInOpacity = useRef(new Animated.Value(0)).current;
  const fadeInTranslateY = useRef(new Animated.Value(20)).current;

  // Onboarding data
  const onboardingScreens = [
    {
      id: 1,
      title: 'Power Device',
      subtitle: 'Connect The Device With Power',
      image: require("../../assets12345/power.png") // Update with your actual image path
    },
    {
      id: 2,
      title: 'Wi-Fi Provisioning',
      subtitle: 'Configure WiFi Credentials',
      image: require("../../assets12345/wifi.png") // Update with your actual image path
    },
    {
      id: 3,
      title: "Let's Grow Together",
      subtitle: 'Welcome to Your Garden',
      image: require("../../assets12345/hydro.png") // Update with your actual image path
    }
  ];

  // Handle splash screen timing
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      setShowOnboarding(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Handle animation for the third onboarding screen
  useEffect(() => {
    if (currentOnboardingScreen === 2) {
      // Reset animation values
      fadeInOpacity.setValue(0);
      fadeInTranslateY.setValue(20);

      // Start fade-in animation
      Animated.parallel([
        Animated.timing(fadeInOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeInTranslateY, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [currentOnboardingScreen]);

  // Handle continue button press
  const handleContinue = () => {
    if (currentOnboardingScreen < 2) {
      // Go to next onboarding screen
      setCurrentOnboardingScreen(currentOnboardingScreen + 1);
    } else {
      // Completed all onboarding screens, show main app
      setShowOnboarding(false);
    }
  };

  // Render splash screen
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

  // Render onboarding screens
  if (showOnboarding) {
    const currentScreen = onboardingScreens[currentOnboardingScreen];
    const isThirdScreen = currentOnboardingScreen === 2;

    return (
      <SafeAreaView style={styles.fullScreenContainer}>
        <View style={styles.contentContainer}>
          {isThirdScreen ? (
            // Animated content for the third screen
            <Animated.View
              style={[
                styles.imageContainer,
                { opacity: fadeInOpacity, transform: [{ translateY: fadeInTranslateY }] }
              ]}
            >
              <Image source={currentScreen.image} style={styles.image} />
              <Animated.Text style={[styles.title, { opacity: fadeInOpacity, transform: [{ translateY: fadeInTranslateY }] }]}>
                {currentScreen.title}
              </Animated.Text>
              <Animated.Text style={[styles.subtitle, { opacity: fadeInOpacity, transform: [{ translateY: fadeInTranslateY }] }]}>
                {currentScreen.subtitle}
              </Animated.Text>
            </Animated.View>
          ) : (
            // Regular content for other screens
            <>
              <View style={styles.imageContainer}>
                <Image source={currentScreen.image} style={styles.image} />
              </View>
              <Text style={styles.title}>{currentScreen.title}</Text>
              <Text style={styles.subtitle}>{currentScreen.subtitle}</Text>
            </>
          )}

          <View style={styles.pagination}>
            {onboardingScreens.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === currentOnboardingScreen && styles.paginationDotActive
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          {isThirdScreen ? (
            <Animated.View style={{ opacity: fadeInOpacity, transform: [{ translateY: fadeInTranslateY }] }}>
              <TouchableOpacity
                style={[styles.button, styles.getStartedButton]}
                onPress={handleContinue}
              >
                <Text style={[styles.buttonText, styles.getStartedButtonText]}>Let's Get Started</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <TouchableOpacity style={styles.button} onPress={handleContinue}>
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Render main app with tabs
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

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'space-between',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  image: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  pagination: {
    flexDirection: 'row',
    marginTop: 20,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#4CAF50',
  },
  buttonContainer: {
    alignItems: 'center',
    paddingBottom: 160,
    marginTop: -120,
  },
  button: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 40,
    width: 180,
    alignItems: 'center',
  },
  buttonText: {
    color: '#333',
    fontWeight: '500',
    fontSize: 16,
  },
  getStartedButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
    width: 220,
  },
  getStartedButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default _Layout;