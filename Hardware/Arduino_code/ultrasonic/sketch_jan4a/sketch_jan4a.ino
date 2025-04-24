#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>
#include <Arduino.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include "WiFiProv.h"
#include "sdkconfig.h"
#include <time.h>

#define RESET_BUTTON_PIN 27
#define BLUE_LED_PIN 2     // Using the built-in LED on most ESP32 boards (GPIO2)

// WiFi Provisioning Configuration
const char *pop = "abcd1234";           // Proof of possession (PIN)
const char *service_name = "PROV_hydro"; // Device name
const char *service_key = NULL;         // Not used for BLE provisioning
bool reset_provisioned = false;          // Auto-delete previously provisioned data

// Firebase Configuration
#define API_KEY "AIzaSyBkr6fF1ZmZ6DtSlKcPA3UrAYSH4Ib9pIc"
#define DATABASE_URL "https://hydroponics-a6609-default-rtdb.firebaseio.com/"

// Define Firebase Data object
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// DHT11 configuration
#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// DS18B20 configuration
const int oneWireBus = 13;
OneWire oneWire(oneWireBus);
DallasTemperature waterTempSensor(&oneWire);

// Sensor pins
const int ldrPin = 34;
const int trigPin = 5;
const int echoPin = 18;
const int phSensorPin = 35;
const int tdsSensorPin = 32;
const int relayPin = 26;  // Connect to the IN pin of the relay

// TDS sensor configuration
#define VREF 3.3
#define ADC_RESOLUTION 4095

// Global variables
unsigned long sendDataPrevMillis = 0;
bool signupOK = false;
bool wifiConnected = false;
bool isResetting = false;
unsigned long resetStartTime = 0;

// Nepal timezone offset (UTC+5:45)
const int timeZoneOffset = 5 * 3600 + 45 * 60;

// Scheduled reading times (hour, minute) in Nepal time
const int readingHours[] = {6, 12, 17, 22};
const int readingMinutes[] = {0, 0, 0, 0};
const int NUM_READINGS = 4;

// Track which readings were taken today
bool readingsTaken[4] = {false, false, false, false};
int currentDay = -1;  // To detect day changes

WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", timeZoneOffset);

// WiFi provisioning event handler
void SysProvEvent(arduino_event_t *sys_event) {
    switch (sys_event->event_id) {
        case ARDUINO_EVENT_WIFI_STA_GOT_IP:
            Serial.print("\nConnected IP address : ");
            Serial.println(IPAddress(sys_event->event_info.got_ip.ip_info.ip.addr));
            wifiConnected = true;
            break;
        case ARDUINO_EVENT_WIFI_STA_DISCONNECTED:
            Serial.println("\nDisconnected. Connecting to the AP again... ");
            wifiConnected = false;
            break;
        case ARDUINO_EVENT_PROV_START:
            Serial.println("\nProvisioning started\nGive Credentials of your access point using smartphone app");
            break;
        case ARDUINO_EVENT_PROV_CRED_RECV:
            Serial.println("\nReceived Wi-Fi credentials");
            Serial.print("\tSSID : ");
            Serial.println((const char *)sys_event->event_info.prov_cred_recv.ssid);
            Serial.print("\tPassword : ");
            Serial.println((char const *)sys_event->event_info.prov_cred_recv.password);
            break;
        case ARDUINO_EVENT_PROV_CRED_FAIL:
            Serial.println("\nProvisioning failed!");
            if(sys_event->event_info.prov_fail_reason == NETWORK_PROV_WIFI_STA_AUTH_ERROR) {
                Serial.println("\nWi-Fi AP password incorrect");
            } else {
                Serial.println("\nWi-Fi AP not found");
            }
            break;
        case ARDUINO_EVENT_PROV_CRED_SUCCESS:
            Serial.println("\nProvisioning Successful");
            break;
        case ARDUINO_EVENT_PROV_END:
            Serial.println("\nProvisioning Ends");
            break;
        default:
            break;
    }
}

void initFirebase() {
    config.api_key = API_KEY;
    config.database_url = DATABASE_URL;

    if (Firebase.signUp(&config, &auth, "", "")) {
        Serial.println("Anonymous auth OK");
        signupOK = true;
    } else {
        Serial.printf("%s\n", config.signer.signupError.message.c_str());
    }

    config.token_status_callback = tokenStatusCallback;
    Firebase.begin(&config, &auth);
    Firebase.reconnectWiFi(true);
}

// Function to blink the blue LED
void blinkBlueLED() {
    if (isResetting) {
        // Blink the LED (turn on/off every 250ms)
        if ((millis() - resetStartTime) % 500 < 250) {
            digitalWrite(BLUE_LED_PIN, HIGH);
        } else {
            digitalWrite(BLUE_LED_PIN, LOW);
        }
        
        // Check if 3 seconds have passed
        if (millis() - resetStartTime >= 3000) {
            isResetting = false;
            digitalWrite(BLUE_LED_PIN, LOW);
            
            // Actually perform the reset after LED blinking
            Serial.println("Erasing WiFi credentials and restarting...");
            WiFi.disconnect(true, true);
            ESP.restart();
        }
    }
}

// Function to check if it's time for scheduled reading
int checkScheduledReadingTime() {
    struct tm timeinfo;
    if (!getLocalTime(&timeinfo)) {
        Serial.println("Failed to obtain time");
        return -1;
    }
    
    int currentHour = timeinfo.tm_hour;
    int currentMinute = timeinfo.tm_min;
    
    // Check if we're within 5 minutes of any scheduled reading time
    for (int i = 0; i < NUM_READINGS; i++) {
        if (!readingsTaken[i]) {  // If this reading hasn't been taken yet today
            int scheduledHour = readingHours[i];
            int scheduledMinute = readingMinutes[i];
            
            // If we're at the exact scheduled time or up to 5 minutes after
            if ((currentHour == scheduledHour && currentMinute >= scheduledMinute && currentMinute <= scheduledMinute + 5)) {
                return i;  // Return the index of the scheduled reading
            }
        }
    }
    
    return -1;  // No scheduled reading due
}

// Function to control the pump
void controlPump(bool state) {
    digitalWrite(relayPin, state ? HIGH : LOW);
    
    // Log pump state to Firebase
    if (Firebase.ready() && signupOK) {
        if (Firebase.RTDB.setBool(&fbdo, "/pumpStatus", state)) {
            Serial.println("Pump status updated in Firebase");
        } else {
            Serial.println("Failed to update pump status: " + fbdo.errorReason());
        }
    }
    
    Serial.print("Pump is now: ");
    Serial.println(state ? "ON" : "OFF");
}

// Function to take sensor readings and return as a FirebaseJson
FirebaseJson takeSensorReadings() {
    FirebaseJson jsonData;
    
    // Read DHT11 sensor
    float airHumidity = dht.readHumidity();
    float airTemperature = dht.readTemperature();
    
    // Read other sensors
    waterTempSensor.requestTemperatures();
    float waterTemperature = waterTempSensor.getTempCByIndex(0);
    int ldrValue = analogRead(ldrPin);
    long distance = measureDistance();

    // Read pH value
    int phSensorValue = analogRead(phSensorPin);
    float phVoltage = phSensorValue * (3.3 / 4095.0);
    float pH = 3.5 * phVoltage;

    // Read TDS value
    int tdsSensorValue = analogRead(tdsSensorPin);
    float tdsVoltage = tdsSensorValue * (VREF / ADC_RESOLUTION);
    float tds = (tdsVoltage / VREF) * 1000;

    // Get timestamp
    time_t now;
    time(&now);
    unsigned long timestamp = now;
    
    // Create formatted time string
    struct tm timeinfo;
    localtime_r(&now, &timeinfo);
    char timeStr[9];
    sprintf(timeStr, "%02d:%02d:%02d", timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec);
    
    // Create formatted date (YYYY-MM-DD)
    char dateStr[11];
    sprintf(dateStr, "%04d-%02d-%02d", 
            timeinfo.tm_year + 1900, 
            timeinfo.tm_mon + 1, 
            timeinfo.tm_mday);
    
    // Print sensor readings horizontally
    Serial.print("Air Temperature: ");
    Serial.print(airTemperature);
    Serial.print(" °C, ");
    Serial.print("Air Humidity: ");
    Serial.print(airHumidity);
    Serial.print(" %, ");
    Serial.print("Water Temperature: ");
    Serial.print(waterTemperature);
    Serial.print(" °C, ");
    Serial.print("LDR Value: ");
    Serial.print(ldrValue);
    Serial.print(", ");
    Serial.print("Distance: ");
    Serial.print(distance);
    Serial.print(", ");
    Serial.print("pH Value: ");
    Serial.print(pH);
    Serial.print(", ");
    Serial.print("TDS Value: ");
    Serial.print(tds, 2);
    Serial.println(" ppm");
    
    // Set values in JSON
    jsonData.set("airTemperature", airTemperature);
    jsonData.set("airHumidity", airHumidity);
    jsonData.set("waterTemperature", waterTemperature);
    jsonData.set("ldr", ldrValue);
    jsonData.set("distance", distance);
    jsonData.set("pH", pH);
    jsonData.set("tds", tds);
    jsonData.set("pumpStatus", digitalRead(relayPin) == HIGH);
    jsonData.set("timestamp", timestamp);
    jsonData.set("time", timeStr);
    jsonData.set("date", dateStr);
    
    return jsonData;
}

// Function to submit zero readings for missed schedule
void submitZeroReadings(int readingIndex, const char* dateStr) {
    String readingName;
    switch (readingIndex) {
        case 0: readingName = "morning"; break;
        case 1: readingName = "noon"; break;
        case 2: readingName = "evening"; break;
        case 3: readingName = "night"; break;
        default: readingName = "unknown"; break;
    }
    
    FirebaseJson jsonData;
    jsonData.set("airTemperature", 0);
    jsonData.set("airHumidity", 0);
    jsonData.set("waterTemperature", 0);
    jsonData.set("ldr", 0);
    jsonData.set("distance", 0);
    jsonData.set("pH", 0);
    jsonData.set("tds", 0);
    jsonData.set("pumpStatus", false);
    jsonData.set("timestamp", 0);
    jsonData.set("time", String(readingHours[readingIndex]) + ":00:00");
    jsonData.set("date", dateStr);
    jsonData.set("missed", true);
    
    // Create path for this reading
    String path = "/daily_readings/" + String(dateStr) + "/" + readingName;
    
    if (Firebase.RTDB.setJSON(&fbdo, path.c_str(), &jsonData)) {
        Serial.println("Zero data set for missed " + readingName + " reading");
    } else {
        Serial.println("FAILED to set zero data for " + readingName);
        Serial.println("REASON: " + fbdo.errorReason());
    }
}

void setup() {
    Serial.begin(115200);
    
    // Initialize sensors
    dht.begin();
    waterTempSensor.begin();

    pinMode(RESET_BUTTON_PIN, INPUT_PULLUP);
    pinMode(BLUE_LED_PIN, OUTPUT);
    digitalWrite(BLUE_LED_PIN, LOW);  // Ensure the LED is OFF initially

    pinMode(ldrPin, INPUT);
    pinMode(trigPin, OUTPUT);
    pinMode(echoPin, INPUT);
    pinMode(phSensorPin, INPUT);
    pinMode(tdsSensorPin, INPUT);
    pinMode(relayPin, OUTPUT);
    digitalWrite(relayPin, LOW);  // Ensure the pump is OFF initially

    // Start WiFi provisioning
    WiFi.onEvent(SysProvEvent);
    
    // UUID for BLE provisioning
    uint8_t uuid[16] = {0xb4, 0xdf, 0x5a, 0x1c, 0x3f, 0x6b, 0xf4, 0xbf,
                        0xea, 0x4a, 0x82, 0x03, 0x04, 0x90, 0x1a, 0x02};
    
    WiFiProv.beginProvision(
        NETWORK_PROV_SCHEME_BLE,
        NETWORK_PROV_SCHEME_HANDLER_FREE_BLE,
        NETWORK_PROV_SECURITY_1,
        pop,
        service_name,
        service_key,
        uuid,
        reset_provisioned
    );
    
    WiFiProv.printQR(service_name, pop, "ble");
    
    // Initial NTP time sync
    timeClient.begin();
    
    Serial.println("Initializing... Pump is OFF by default");
}

long measureDistance() {
    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);
    
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);
    
    long duration = pulseIn(echoPin, HIGH);
    return duration * 0.034 / 2;
}

void loop() {
    // Check if reset button is pressed
    if (digitalRead(RESET_BUTTON_PIN) == LOW && !isResetting) {
        Serial.println("Reset button pressed! Blinking blue LED before reset...");
        isResetting = true;
        resetStartTime = millis();
    }
    
    // Handle the blue LED blinking if we're in reset mode
    if (isResetting) {
        blinkBlueLED();
        return;  // Skip the rest of the loop while we're resetting
    }

    // Wait for WiFi connection
    if (!wifiConnected) {
        delay(1000);
        return;
    }

    // Initialize Firebase if not already done
    if (!signupOK && wifiConnected) {
        initFirebase();
        // Set NTP server for the ESP32
        configTime(timeZoneOffset, 0, "pool.ntp.org", "time.nist.gov");
        
        // Initialize pump status in Firebase once we're connected
        if (signupOK) {
            controlPump(false); // Ensure pump status is synced with the default OFF state
        }
    }

    if (Firebase.ready() && signupOK) {
        // Get current date and time
        struct tm timeinfo;
        if (!getLocalTime(&timeinfo)) {
            Serial.println("Failed to obtain time");
            delay(1000);
            return;
        }
        
        // Create formatted date (YYYY-MM-DD)
        char dateStr[11];
        sprintf(dateStr, "%04d-%02d-%02d", 
                timeinfo.tm_year + 1900, 
                timeinfo.tm_mon + 1, 
                timeinfo.tm_mday);
        
        // Check if it's a new day
        if (timeinfo.tm_mday != currentDay) {
            // It's a new day - update the day and reset readings taken flags
            currentDay = timeinfo.tm_mday;
            
            // Check if any readings were missed yesterday
            if (currentDay > 0) {  // Not first boot
                // Calculate yesterday's date
                struct tm yesterday = timeinfo;
                yesterday.tm_mday -= 1;
                mktime(&yesterday);  // Normalize the time
                
                char yesterdayStr[11];
                sprintf(yesterdayStr, "%04d-%02d-%02d", 
                        yesterday.tm_year + 1900, 
                        yesterday.tm_mon + 1, 
                        yesterday.tm_mday);
                
                // Check for any missed readings from yesterday and submit zeros
                for (int i = 0; i < NUM_READINGS; i++) {
                    if (!readingsTaken[i]) {
                        submitZeroReadings(i, yesterdayStr);
                    }
                }
            }
            
            // Reset tracking for the new day
            for (int i = 0; i < NUM_READINGS; i++) {
                readingsTaken[i] = false;
            }
            
            Serial.println("New day detected: " + String(dateStr));
        }
        
        // Check if it's time for any scheduled reading
        int readingIndex = checkScheduledReadingTime();
        if (readingIndex >= 0) {
            // It's time for a scheduled reading
            String readingName;
            switch (readingIndex) {
                case 0: readingName = "morning"; break;
                case 1: readingName = "noon"; break;
                case 2: readingName = "evening"; break;
                case 3: readingName = "night"; break;
                default: readingName = "unknown"; break;
            }
            
            // Take readings
            FirebaseJson jsonData = takeSensorReadings();
            
            // Create path for this reading
            String path = "/daily_readings/" + String(dateStr) + "/" + readingName;
            
            // Send to Firebase
            if (Firebase.RTDB.setJSON(&fbdo, path.c_str(), &jsonData)) {
                Serial.println(readingName + " reading logged successfully");
                readingsTaken[readingIndex] = true;
            } else {
                Serial.println("Failed to log " + readingName + " reading: " + fbdo.errorReason());
            }
        }
        
        // Check for any missed readings that are now in the past
        int currentHour = timeinfo.tm_hour;
        int currentMinute = timeinfo.tm_min;
        
        for (int i = 0; i < NUM_READINGS; i++) {
            if (!readingsTaken[i]) {
                // If the scheduled time is in the past by more than 5 minutes
                if ((currentHour > readingHours[i]) || 
                    (currentHour == readingHours[i] && currentMinute > readingMinutes[i] + 5)) {
                    // Submit zero readings for the missed schedule
                    submitZeroReadings(i, dateStr);
                    readingsTaken[i] = true;
                    Serial.println("Missed reading time detected, zero values submitted");
                }
            }
        }
        
        // Check for pump control commands from Firebase
        if (Firebase.RTDB.getBool(&fbdo, "/pumpCommand")) {
            if (fbdo.dataType() == "boolean") {
                bool pumpCommand = fbdo.boolData();
                Serial.print("Received pump command from Firebase: ");
                Serial.println(pumpCommand ? "ON" : "OFF");
                controlPump(pumpCommand);
            }
        }

        // Update current values every 10 seconds
        if (millis() - sendDataPrevMillis > 3000 || sendDataPrevMillis == 0) {
            sendDataPrevMillis = millis();
            
            // Take readings
            FirebaseJson jsonData = takeSensorReadings();
            jsonData.set("lastUpdated", millis());
            
            // Update the current readings node
            String path = "/readings/current";
            
            if (Firebase.RTDB.updateNode(&fbdo, path.c_str(), &jsonData)) {
                Serial.println("Current data updated successfully");
            } else {
                Serial.println("FAILED to update current data");
                Serial.println("REASON: " + fbdo.errorReason());
                
                // If update fails, try to set it
                if (Firebase.RTDB.setJSON(&fbdo, path.c_str(), &jsonData)) {
                    Serial.println("Current data set successfully");
                } else {
                    Serial.println("FAILED to set current data");
                    Serial.println("REASON: " + fbdo.errorReason());
                }
            }
        }
    }
    
    // Small delay to prevent CPU hogging
    delay(500);
}