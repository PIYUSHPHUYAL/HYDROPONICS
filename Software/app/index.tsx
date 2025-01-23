import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { database, ref, onValue } from "./firebase";

export default function App() {
    const [data, setData] = useState({
        ldr: null,
        distance: null,
        airHumidity: null,
        airTemperature: null,
        waterTemperature: null
    });

    useEffect(() => {
        const readingsRef = ref(database, 'readings');
        
        const unsubscribe = onValue(readingsRef, (snapshot) => {
            if (snapshot.exists()) {
                const allData = snapshot.val();
                const timestamps = Object.keys(allData);
                const latestReading = allData[timestamps[timestamps.length - 1]];
                
                setData({
                    ldr: latestReading.ldr,
                    distance: latestReading.distance,
                    humidity: latestReading.airHumidity,
                    temperature: latestReading.airTemperature,
                    waterTemperature: latestReading.waterTemperature
                });
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <View>
            <Text>LDR: {data.ldr ?? 'Loading...'}</Text>
            <Text>Distance: {data.distance ?? 'Loading...'} cm</Text>
            <Text>Air Humidity: {data.humidity ?? 'Loading...'} %</Text>
            <Text>Air Temperature: {data.temperature ?? 'Loading...'} °C</Text>
            <Text>Water Temperature: {data.waterTemperature ?? 'Loading...'} °C</Text>
        </View>
    );
}