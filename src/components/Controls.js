import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';

export default function Controls({ status, onStart, onPause, onReset, onAdjust }) {
    const isRunning = status === 'RUNNING';

    return (
        <View style={styles.container}>
            <View style={styles.adjustRow}>
                <TouchableOpacity onPress={() => onAdjust(-5)} style={styles.adjustBtn}>
                    <Text style={styles.adjustText}>- 5s</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onAdjust(5)} style={styles.adjustBtn}>
                    <Text style={styles.adjustText}>+ 5s</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.mainControls}>
                {isRunning ? (
                    <TouchableOpacity onPress={onPause} style={styles.mainBtn}>
                        <Text style={styles.mainBtnText}>PAUSE</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={onStart} style={[styles.mainBtn, styles.startBtn]}>
                        <Text style={styles.mainBtnText}>START</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity onPress={onReset} style={styles.resetBtn}>
                    <Text style={styles.resetText}>RESET</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
        gap: 20,
    },
    adjustRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '60%',
        marginBottom: 20,
    },
    adjustBtn: {
        padding: 10,
    },
    adjustText: {
        color: '#888',
        fontSize: 18,
        fontWeight: '600',
    },
    mainControls: {
        flexDirection: 'column',
        alignItems: 'center',
        gap: 15,
    },
    mainBtn: {
        backgroundColor: '#333',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 30,
        minWidth: 150,
        alignItems: 'center',
    },
    startBtn: {
        backgroundColor: '#C25E00', // Orange-ish
    },
    mainBtnText: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    resetBtn: {
        padding: 10,
    },
    resetText: {
        color: '#666',
        fontSize: 14,
    },
});
