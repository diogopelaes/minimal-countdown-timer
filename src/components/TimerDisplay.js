import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

export default function TimerDisplay({ minutes, seconds, onUpdate, isEditable }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    const handlePress = () => {
        if (isEditable) {
            setIsEditing(true);
            setEditValue(`${formattedMinutes}${formattedSeconds}`);
        }
    };

    const handleSubmit = () => {
        setIsEditing(false);
        // Parse editValue (MMSS)
        if (editValue.length >= 1) {
            // Simple parser
            let m = 0;
            let s = 0;
            if (editValue.length <= 2) {
                s = parseInt(editValue, 10);
            } else {
                s = parseInt(editValue.slice(-2), 10);
                m = parseInt(editValue.slice(0, -2), 10);
            }
            if (isNaN(m)) m = 0;
            if (isNaN(s)) s = 0;

            onUpdate(m, s);
        }
    };

    return (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
            <View style={styles.container}>
                {isEditing ? (
                    <TextInput
                        style={styles.input}
                        value={editValue}
                        onChangeText={setEditValue}
                        keyboardType="number-pad"
                        maxLength={4}
                        autoFocus
                        onBlur={handleSubmit}
                        onSubmitEditing={handleSubmit}
                    />
                ) : (
                    <Animated.Text entering={FadeIn} exiting={FadeOut} style={styles.text}>
                        {formattedMinutes}:{formattedSeconds}
                    </Animated.Text>
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontSize: 80,
        fontWeight: 'bold',
        color: '#E0E0E0',
        fontVariant: ['tabular-nums'],
    },
    input: {
        fontSize: 80,
        fontWeight: 'bold',
        color: '#E0E0E0',
        minWidth: 200,
        textAlign: 'center',
    },
});
