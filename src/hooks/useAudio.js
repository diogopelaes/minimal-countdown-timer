import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

export default function useAudio() {
    const soundRef = useRef(new Audio.Sound());
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        async function loadSounds() {
            try {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    staysActiveInBackground: true,
                    interruptionModeIOS: 2,
                    playsInSilentModeIOS: true,
                    shouldDuckAndroid: false, // Inicia sem baixar volume alheio
                    interruptionModeAndroid: 2,
                    playThroughEarpieceAndroid: false,
                });

                await soundRef.current.loadAsync(require('../../assets/so-proud.mp3'));
                setIsLoaded(true);
            } catch (error) {
                console.error("Failed to preload sound", error);
            }
        }

        loadSounds();

        return () => {
            if (soundRef.current) soundRef.current.unloadAsync();
        };
    }, []);

    const resetAudioMode = async () => {
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            await Audio.setIsEnabledAsync(false);
            await Audio.setIsEnabledAsync(true);

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                staysActiveInBackground: true,
                interruptionModeIOS: 2,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: false,
                interruptionModeAndroid: 2,
                playThroughEarpieceAndroid: false,
            });
        } catch (e) {
            console.log('Error resetting audio mode', e);
        }
    };

    const playSound = async (onComplete) => {
        if (!isLoaded) return;

        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                staysActiveInBackground: true,
                interruptionModeIOS: 2,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true, // Baixa o volume alheio para o som do timer
                interruptionModeAndroid: 2,
                playThroughEarpieceAndroid: false,
            });

            await soundRef.current.replayAsync();

            soundRef.current.setOnPlaybackStatusUpdate(async (status) => {
                if (status.didJustFinish) {
                    soundRef.current.setOnPlaybackStatusUpdate(null);
                    await resetAudioMode();
                    if (onComplete) onComplete();
                }
            });

        } catch (error) {
            console.error("Playback error", error);
        }
    };

    const stopSound = async () => {
        try {
            if (isLoaded) {
                await soundRef.current.stopAsync();
            }
        } catch (e) { }
    };

    return {
        playSound,
        stopSound
    };
}
