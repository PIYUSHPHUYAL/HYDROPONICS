#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>
#include <Arduino.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <DHT.h>  // Add DHT library

// WiFi credentials
const char* ssid = "###################";
const char* password = "#################";

// Firebase credentials
#define API_KEY "#######################"
#define DATABASE_URL "###########3"

// Define Firebase Data object
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// DHT11 configuration
#define DHTPIN 4      // DHT11 data pin (you can change this to any available digital pin)
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// LDR sensor pin
const int ldrPin = 34;  // ADC1 channel on ESP32

// Ultrasonic sensor pins
const int trigPin = 5;
const int echoPin = 18;

unsigned long sendDataPrevMillis = 0;
bool signupOK = false;

WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 19800);

void setup() {
  Serial.begin(115200);
  
  // Initialize DHT11
  dht.begin();
  
  pinMode(ldrPin, INPUT);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);

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
    float humidity = dht.readHumidity();
    float temperature = dht.readTemperature();
    
    // Check if DHT11 reading failed
    if (isnan(humidity) || isnan(temperature)) {
      Serial.println("Failed to read from DHT sensor!");
      return;
    }

    // Read LDR value
    int ldrValue = analogRead(ldrPin);

    // Measure distance
    long distance = measureDistance();

    // Get current timestamp
    timeClient.update();
    unsigned long timestamp = timeClient.getEpochTime();

    // Print to Serial Monitor
    Serial.print("Temperature: ");
    Serial.print(temperature);
    Serial.println(" °C");
    Serial.print("Humidity: ");
    Serial.print(humidity);
    Serial.println(" %");
    Serial.print("LDR Value: ");
    Serial.println(ldrValue);
    Serial.print("Distance: ");
    Serial.println(distance);
    Serial.print("Timestamp: ");
    Serial.println(timestamp);

    // Create a JSON object to send to Firebase
    FirebaseJson jsonData;
    jsonData.set("temperature", temperature);
    jsonData.set("humidity", humidity);
    jsonData.set("ldr", ldrValue);
    jsonData.set("distance", distance);

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