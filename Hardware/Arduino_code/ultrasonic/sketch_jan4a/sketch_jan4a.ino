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


#define RESET_BUTTON_PIN 27


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

WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 19800);

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

void setup() {
    Serial.begin(115200);
    
    // Initialize sensors
    dht.begin();
    waterTempSensor.begin();

    pinMode(RESET_BUTTON_PIN, INPUT_PULLUP);

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
    timeClient.begin();
    
    // Initialize pump status in Firebase once we're connected
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

    if (digitalRead(RESET_BUTTON_PIN) == LOW) {
    Serial.println("Reset button pressed! Erasing WiFi credentials...");
    WiFi.disconnect(true, true);
    ESP.restart();
    }


    // Wait for WiFi connection
    if (!wifiConnected) {
        delay(1000);
        return;
    }

    // Initialize Firebase if not already done
    if (!signupOK && wifiConnected) {
        initFirebase();
        // Initialize pump status in Firebase once we're connected
        if (signupOK) {
            controlPump(false); // Ensure pump status is synced with the default OFF state
        }
    }

    // Process any serial commands for manual pump control (for testing)
    if (Serial.available() > 0) {
        char input = Serial.read();
        if (input == '1') {
            Serial.println("Manual command: Turning pump ON");
            controlPump(true);
        } else if (input == '0') {
            Serial.println("Manual command: Turning pump OFF");
            controlPump(false);
        }
    }

    // Check for pump control commands from Firebase
    if (Firebase.ready() && signupOK) {
        if (Firebase.RTDB.getBool(&fbdo, "/pumpCommand")) {
            if (fbdo.dataType() == "boolean") {
                bool pumpCommand = fbdo.boolData();
                Serial.print("Received pump command from Firebase: ");
                Serial.println(pumpCommand ? "ON" : "OFF");
                controlPump(pumpCommand);
                
                // // Clear the command after execution (optional)
                // Firebase.RTDB.setBool(&fbdo, "/pumpCommand", false);
            }
        }
    }

    // Regular sensor reading and data logging
    if (Firebase.ready() && signupOK && (millis() - sendDataPrevMillis > 2000 || sendDataPrevMillis == 0)) {
        sendDataPrevMillis = millis();
        
        // Read DHT11 sensor
        float airHumidity = dht.readHumidity();
        float airTemperature = dht.readTemperature();
        
        // if (isnan(airHumidity) || isnan(airTemperature)) {
        //     Serial.println("Failed to read from DHT sensor!");
        //     return;
        // }

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
        timeClient.update();
        unsigned long timestamp = timeClient.getEpochTime();

        /// Print sensor readings horizontally
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

        // Create JSON object for Firebase
        FirebaseJson jsonData;
        jsonData.set("airTemperature", airTemperature);
        jsonData.set("airHumidity", airHumidity);
        jsonData.set("waterTemperature", waterTemperature);
        jsonData.set("ldr", ldrValue);
        jsonData.set("distance", distance);
        jsonData.set("pH", pH);
        jsonData.set("tds", tds);
        // Also include current pump status
        jsonData.set("pumpStatus", digitalRead(relayPin) == HIGH);

        // Send to Firebase
        String path = "/readings/" + String(timestamp);
        if (Firebase.RTDB.setJSON(&fbdo, path.c_str(), &jsonData)) {
            Serial.println("Data logged successfully at path: " + path);
        } else {
            Serial.println("FAILED");
            Serial.println("REASON: " + fbdo.errorReason());
        }
    }
}