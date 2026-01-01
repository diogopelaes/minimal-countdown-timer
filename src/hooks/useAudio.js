import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

export default function useAudio() {
    const [sound, setSound] = useState(null);

    useEffect(() => {
        // Configure audio mode for background playback
        Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            staysActiveInBackground: true,
            interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
            playThroughEarpieceAndroid: false,
        });

        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);

    const playSound = async () => {
        try {
            // Unload previous sound if any
            if (sound) {
                await sound.unloadAsync();
            }

            // Load and play a default sound
            // Ideally we have a file asset. For now, we can use a standard beep or require a local file.
            // Since I don't have a file yet, I will try to use a default expo asset or just placeholder.
            // NOTE: User spec implies "Som ao finalizar". I should create a simple sound or use something available.
            // I'll assume we'll add an asset later or use a standard one.
            // For now, let's assume we have 'assets/alarm.mp3' or similar. 
            // I'll create a placeholder for the asset require.

            // Using a simple notification sound from a public CDN
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: 'https://notificationsounds.com/storage/sounds/file-sounds-1150-pristine.mp3' }
            );

            setSound(newSound);
            await newSound.playAsync();
        } catch (e) {
            console.log('Error playing sound', e);
        }
    };

    const stopSound = async () => {
        if (sound) {
            await sound.stopAsync();
        }
    };

    return {
        playSound,
        stopSound,
    };
}
