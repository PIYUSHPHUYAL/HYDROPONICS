import {
  View,
  Image,
  Animated,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Alert,
} from "react-native"
import { useState, useEffect, useRef } from "react"
import { Tabs } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { database, ref, get, auth, signInAnonymously } from "./firebase"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator } from 'react-native';

const { width, height } = Dimensions.get("window")

const _Layout = () => {
  // States to control what to show
  const [showSplash, setShowSplash] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [currentOnboardingScreen, setCurrentOnboardingScreen] = useState(0)
  const [popCode, setPopCode] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  const splashOpacity = useRef(new Animated.Value(1)).current

  // Animation values for the third onboarding screen
  const fadeInOpacity = useRef(new Animated.Value(0)).current
  const fadeInTranslateY = useRef(new Animated.Value(20)).current

  // Onboarding data
  const onboardingScreens = [
    {
      id: 1,
      title: "Power Device",
      subtitle: "Connect The Device With Power",
      image: require("../../assets12345/power.png"),
    },
    {
      id: 2,
      title: "Wi-Fi Provisioning",
      subtitle: "Configure WiFi Credentials",
      image: require("../../assets12345/wifi.png"),
    },
    {
      id: 3,
      title: "Let's Grow Together",
      subtitle: "Welcome to Your Garden",
      image: require("../../assets12345/hydro.png"),
    },
  ]

  // Check for existing authentication on startup
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        // Check if user is already authenticated
        const savedAuth = await AsyncStorage.getItem("isAuthenticated")
        const savedPop = await AsyncStorage.getItem("popCode")
        const shouldShowOnboarding = await AsyncStorage.getItem("showOnboarding")

        if (savedAuth === "true" && savedPop) {
          // User is already authenticated
          console.log("Found saved authentication state, skipping to main app")
          setPopCode(savedPop)
          setIsAuthenticated(true)
          setShowSplash(false)
          setShowOnboarding(false)
          setShowAuth(false)
        } else if (shouldShowOnboarding === "false") {
          // Skip onboarding, go to auth
          console.log("Skipping onboarding, showing auth screen")
          setTimeout(() => {
            setShowSplash(false)
            setShowAuth(true)
          }, 2000)
        } else {
          // Show onboarding after splash
          console.log("Showing onboarding screens")
          setTimeout(() => {
            setShowSplash(false)
            setShowOnboarding(true)
          }, 2000)
        }
      } catch (error) {
        console.error("Error checking auth state:", error)
        // Default to showing onboarding
        setTimeout(() => {
          setShowSplash(false)
          setShowOnboarding(true)
        }, 2000)
      } finally {
        setIsInitializing(false)
      }
    }

    // Start the auth check process
    checkAuthState()

    // Optional: Add a fade-out animation for the splash screen
    setTimeout(() => {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start()
    }, 1500)
  }, [])

  // Handle animation for the third onboarding screen
  useEffect(() => {
    if (currentOnboardingScreen === 2) {
      // Reset animation values
      fadeInOpacity.setValue(0)
      fadeInTranslateY.setValue(20)

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
        }),
      ]).start()
    }
  }, [currentOnboardingScreen])

  // Function to check if POP code exists in Firebase
  const authenticateUser = async () => {
    if (!popCode.trim()) {
      Alert.alert("Error", "Please enter a valid POP code")
      return
    }

    setIsLoading(true)
    try {
      // Check if user is authenticated
      if (!auth.currentUser) {
        // Wait for authentication to complete
        await signInAnonymously(auth)
      }

      // Get a reference to the root of  database
      const dbRef = ref(database)

      // Fetch the data once
      const snapshot = await get(dbRef)

      if (snapshot.exists()) {
        const data = snapshot.val()
        // Check if the entered POP code matches any node name
        const nodeNames = Object.keys(data)

        if (nodeNames.includes(popCode.trim())) {
          // Save authentication state and POP code
          await AsyncStorage.setItem("isAuthenticated", "true")
          await AsyncStorage.setItem("popCode", popCode.trim())
          await AsyncStorage.setItem("showOnboarding", "false")

          console.log("Authentication successful, saved to AsyncStorage")
          setIsAuthenticated(true)
          setShowAuth(false)
        } else {
          Alert.alert("Authentication Failed", "The POP code does not match any device.")
        }
      } else {
        Alert.alert("Error", "No data available in the database.")
      }
    } catch (error) {
      console.error("Authentication error:", error)
      Alert.alert("Error", "Failed to authenticate. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle continue button press
  const handleContinue = () => {
    if (currentOnboardingScreen < 2) {
      // Go to next onboarding screen
      setCurrentOnboardingScreen(currentOnboardingScreen + 1)
    } else {
      // Completed all onboarding screens, show auth screen
      setShowOnboarding(false)
      setShowAuth(true)
      // Save that we've shown onboarding
      AsyncStorage.setItem("showOnboarding", "false")
    }
  }

  // Handle user sign out
  const signOut = async () => {
    try {
      // Clear authentication data
      await AsyncStorage.removeItem("isAuthenticated")
      // Keep the POP code saved to make re-login easier
      // await AsyncStorage.removeItem("popCode")

      // Reset state
      setIsAuthenticated(false)
      setShowAuth(true)
    } catch (error) {
      console.error("Error signing out:", error)
      Alert.alert("Error", "Failed to sign out. Please try again.")
    }
  }

  // Render splash screen
  if (showSplash) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}>
        <Animated.Image
          source={require("../../assets12345/Welcome_screen.png")}
          style={{ width: 300, height: 300, opacity: splashOpacity, top: -25 }}
        />
      </View>
    )
  }

  // Render onboarding screens
  if (showOnboarding) {
    const currentScreen = onboardingScreens[currentOnboardingScreen]
    const isThirdScreen = currentOnboardingScreen === 2

    return (
      <SafeAreaView style={styles.fullScreenContainer}>
        <View style={styles.contentContainer}>
          {isThirdScreen ? (
            // Animated content for the third screen
            <Animated.View
              style={[styles.imageContainer, { opacity: fadeInOpacity, transform: [{ translateY: fadeInTranslateY }] }]}
            >
              <Image source={currentScreen.image} style={styles.image} />
              <Animated.Text
                style={[styles.title, { opacity: fadeInOpacity, transform: [{ translateY: fadeInTranslateY }] }]}
              >
                {currentScreen.title}
              </Animated.Text>
              <Animated.Text
                style={[styles.subtitle, { opacity: fadeInOpacity, transform: [{ translateY: fadeInTranslateY }] }]}
              >
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
                style={[styles.paginationDot, index === currentOnboardingScreen && styles.paginationDotActive]}
              />
            ))}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          {isThirdScreen ? (
            <Animated.View style={{ opacity: fadeInOpacity, transform: [{ translateY: fadeInTranslateY }] }}>
              <TouchableOpacity style={[styles.button, styles.getStartedButton]} onPress={handleContinue}>
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
    )
  }

  // Render authentication screen
  if (showAuth) {
    return (
      <SafeAreaView style={styles.fullScreenContainer}>
        {/* Background gradient - only for auth screen */}
        <LinearGradient
          colors={['#e8f5e9', '#ffffff']}
          style={styles.authGradientBackground}
        />

        {/* Decorative elements - only for auth screen */}
        <View style={styles.authDecorativeCircle1} />
        <View style={styles.authDecorativeCircle2} />

        <View style={styles.contentContainer}>
          <View style={styles.authImageContainer}>
            <Image
              source={require("../../assets12345/logo_clean.png")}
              style={styles.authImage}
            />
          </View>

          <Text style={styles.authTitle}>Proof of Possession</Text>
          <Text style={styles.subtitle}>Enter your device POP code to continue</Text>

          <View style={styles.authInputContainer}>
            <View style={styles.authInputWrapper}>
              <Ionicons name="key-outline" size={20} color="#4CAF50" style={styles.authInputIcon} />
              <TextInput
                style={styles.authInput}
                placeholder="Enter POP Code"
                placeholderTextColor="#aaa"
                value={popCode}
                onChangeText={setPopCode}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>
        </View>

        <View style={styles.authButtonContainer}>
          <TouchableOpacity
            style={[styles.authButton, isLoading && styles.disabledButton]}
            onPress={authenticateUser}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <View style={styles.authButtonContent}>
                <Text style={styles.authButtonText}>
                  Authenticate
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.authButtonIcon} />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.authHelpButton}
            onPress={() => {
              Alert.alert(
                "",
                "Please contact piyushphuyal77@gmail.com for your concerns regarding POP.",
                [{ text: "OK", style: "default" }]
              );
            }}
          >
            <Text style={styles.authHelpButtonText}>Need Help?</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // If authenticated, render main app with tabs
  if (isAuthenticated) {
    return (
      <Tabs
        screenOptions={{
          tabBarStyle: {
            position: "absolute",
            bottom: 25,
            elevation: 0,
            backgroundColor: "#ffffff",
            borderRadius: 60,
            height: 80,
            width: 350,
            shadowColor: "#000",
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
            title: "Home",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <Ionicons name="home-outline" color={focused ? "#4CAF50" : "#888"} size={26} />
            ),
          }}
        />
        <Tabs.Screen
          name="control"
          options={{
            title: "Control",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <Ionicons name="options-outline" color={focused ? "#4CAF50" : "#888"} size={26} />
            ),
          }}
        />
        <Tabs.Screen
          name="visualization"
          options={{
            title: "Visualization",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <Ionicons name="bar-chart-outline" color={focused ? "#4CAF50" : "#888"} size={26} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <Ionicons name="settings-outline" color={focused ? "#4CAF50" : "#888"} size={26} />
            ),
            // You can add a sign-out button in the settings screen
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: "Notifications",
            headerShown: false,
            href: null,
          }}
        />
      </Tabs>
    )
  }

  // This should not be reached if the flow is correct
  return null
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "space-between",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  imageContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  image: {
    width: 250,
    height: 250,
    resizeMode: "contain",
    marginTop: -40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  pagination: {
    flexDirection: "row",
    marginTop: 20,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ddd",
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: "#4CAF50",
  },
  buttonContainer: {
    alignItems: "center",
    paddingBottom: 160,
    marginTop: -120,
  },
  button: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 40,
    width: 180,
    alignItems: "center",
  },
  buttonText: {
    color: "#333",
    fontWeight: "500",
    fontSize: 16,
  },
  getStartedButton: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
    width: 220,
  },
  getStartedButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#a5d6a7",
    borderColor: "#a5d6a7",
  },
  inputContainer: {
    width: "100%",
    marginVertical: 20,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  authGradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  authDecorativeCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    top: -50,
    right: -50,
  },
  authDecorativeCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    bottom: 50,
    left: -50,
  },
  authImageContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  authImage: {
    width: 180,
    height: 180,
    resizeMode: "contain",
  },
  authTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#2E7D32",
  },
  authInputContainer: {
    width: "100%",
    marginVertical: 20,
  },
  authInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  authInputIcon: {
    marginRight: 10,
  },
  authInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: "#333",
  },
  authButtonContainer: {
    alignItems: "center",
    paddingBottom: 60,
    width: '100%',
    paddingHorizontal: 30,
  },
  authButton: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 40,
    width: '100%',
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  authButtonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  authButtonIcon: {
    marginLeft: 8,
  },
  authHelpButton: {
    paddingVertical: 10,
  },
  authHelpButtonText: {
    color: "#666",
    fontSize: 14,
  },
});

export default _Layout