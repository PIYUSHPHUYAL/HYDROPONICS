import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { database, ref, onValue } from "./firebase";

export default function App() {
    const [data, setData] = useState({
        ldr: null,
        distance: null,
        airHumidity: null,
        airTemperature: null,
        waterTemperature: null,
        pH: null,
        tds: null
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
                    airHumidity: latestReading.airHumidity,
                    airTemperature: latestReading.airTemperature,
                    waterTemperature: latestReading.waterTemperature,
                    pH: latestReading.pH,
                    tds: latestReading.tds
                });
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <View>
            <Text>LDR: {data.ldr ?? 'Loading...'}</Text>
            <Text>Distance: {data.distance ?? 'Loading...'} cm</Text>
            <Text>Air Humidity: {data.airHumidity ?? 'Loading...'} %</Text>
            <Text>Air Temperature: {data.airTemperature ?? 'Loading...'} °C</Text>
            <Text>Water Temperature: {data.waterTemperature ?? 'Loading...'} °C</Text>
            <Text>pH: {data.pH ?? 'Loading...'}</Text>
            <Text>TDS: {data.tds ?? 'Loading...'} ppm</Text>
        </View>
    );
}