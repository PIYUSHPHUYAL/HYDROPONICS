import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { database, ref, onValue } from "./firebase";

export default function App() {
    const [data, setData] = useState({
        ldr: null,
        distance: null
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
                    humidity: latestReading.humidity,
                    temperature: latestReading.temperature

                });
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <View>
            <Text>LDR: {data.ldr ?? 'Loading...'}</Text>
            <Text>Distance: {data.distance ?? 'Loading...'} cm</Text>
            <Text>Humidity: {data.humidity ?? 'Loading...'} %</Text>
            <Text>Temperature: {data.temperature ?? 'Loading...'} °C</Text>
        </View>
    );
}