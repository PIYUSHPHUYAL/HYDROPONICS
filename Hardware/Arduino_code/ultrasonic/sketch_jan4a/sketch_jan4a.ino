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

// WiFi credentials
const char* ssid = "Tanka";
const char* password = "Tanka#@123";

// Firebase credentials
#define API_KEY "AIzaSyBkr6fF1ZmZ6DtSlKcPA3UrAYSH4Ib9pIc"
#define DATABASE_URL "https://hydroponics-a6609-default-rtdb.firebaseio.com/"

// Define Firebase Data object
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// DHT11 configuration
#define DHTPIN 4      // DHT11 data pin 
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// DS18B20 configuration
const int oneWireBus = 13; 
OneWire oneWire(oneWireBus);
DallasTemperature waterTempSensor(&oneWire);

// LDR sensor pin
const int ldrPin = 34;  // ADC1 channel on ESP32

// Ultrasonic sensor pins
const int trigPin = 5;
const int echoPin = 18;

// pH sensor pin
const int phSensorPin = 35;  // Analog pin for pH sensor

// TDS sensor configuration
const int tdsSensorPin = 32;  // Analog pin for TDS sensor
#define VREF 3.3           // ESP32 ADC reference voltage
#define ADC_RESOLUTION 4095 // 12-bit ADC resolution for ESP32

unsigned long sendDataPrevMillis = 0;
bool signupOK = false;

WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 19800);

void setup() {
  Serial.begin(115200);
  
  // Initialize sensors
  dht.begin();
  waterTempSensor.begin();
  
  pinMode(ldrPin, INPUT);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(phSensorPin, INPUT);
  pinMode(tdsSensorPin, INPUT);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());

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

  timeClient.begin();
}

void loop() {
  if (Firebase.ready() && signupOK && (millis() - sendDataPrevMillis > 2000 || sendDataPrevMillis == 0)) {
    sendDataPrevMillis = millis();
    
    // Read DHT11 sensor
    float airHumidity = dht.readHumidity();
    float airTemperature = dht.readTemperature();
    
    // Check if DHT11 reading failed
    if (isnan(airHumidity) || isnan(airTemperature)) {
      Serial.println("Failed to read from DHT sensor!");
      return;
    }

    // Read DS18B20 water temperature
    waterTempSensor.requestTemperatures();
    float waterTemperature = waterTempSensor.getTempCByIndex(0);

    // Read LDR value
    int ldrValue = analogRead(ldrPin);

    // Measure distance
    long distance = measureDistance();

    // Read pH value
    int phSensorValue = analogRead(phSensorPin);
    float phVoltage = phSensorValue * (3.3 / 4095.0);
    float pH = 3.5 * phVoltage;  // Note: Calibrate this formula for accuracy

    // Read TDS value
    int tdsSensorValue = analogRead(tdsSensorPin);
    float tdsVoltage = tdsSensorValue * (VREF / ADC_RESOLUTION);
    float tds = (tdsVoltage / VREF) * 1000;  // TDS value in ppm (simplified)

    // Get current timestamp
    timeClient.update();
    unsigned long timestamp = timeClient.getEpochTime();

    // Print to Serial Monitor
    Serial.print("Air Temperature: ");
    Serial.print(airTemperature);
    Serial.println(" °C");
    Serial.print("Air Humidity: ");
    Serial.print(airHumidity);
    Serial.println(" %");
    Serial.print("Water Temperature: ");
    Serial.print(waterTemperature);
    Serial.println(" °C");
    Serial.print("LDR Value: ");
    Serial.println(ldrValue);
    Serial.print("Distance: ");
    Serial.println(distance);
    Serial.print("pH Value: ");
    Serial.println(pH);
    Serial.print("TDS Value: ");
    Serial.print(tds, 2);
    Serial.println(" ppm");
    Serial.print("Timestamp: ");
    Serial.println(timestamp);

    // Create a JSON object to send to Firebase
    FirebaseJson jsonData;
    jsonData.set("airTemperature", airTemperature);
    jsonData.set("airHumidity", airHumidity);
    jsonData.set("waterTemperature", waterTemperature);
    jsonData.set("ldr", ldrValue);
    jsonData.set("distance", distance);
    jsonData.set("pH", pH);
    jsonData.set("tds", tds);

    // Use a unique path for each reading
    String path = "/readings/" + String(timestamp);

    if (Firebase.RTDB.setJSON(&fbdo, path.c_str(), &jsonData)) {
      Serial.println("Data logged successfully at path: " + path);
    } else {
      Serial.println("FAILED");
      Serial.println("REASON: " + fbdo.errorReason());
    }
  }
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