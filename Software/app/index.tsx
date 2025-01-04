import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { database, ref, onValue } from "./firebase";
// import { ref, onValue } from 'firebase/database';

export default function App() {
    const [ldr, setLdr] = useState(500);

    useEffect(() => {
        const data = ref(database);

        onValue(data, (snapshot) => {
            setLdr(snapshot.val().ldr);
        });
    }, [database]);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Ultra-Sonic Readings:</Text>
            <Text style={styles.value}>{ldr !== null ? ldr : 'Loading...'}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    value: {
        fontSize: 20,
        marginTop: 10,
    },
});
