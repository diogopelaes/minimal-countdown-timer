import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AUDIO_OPTIONS = {
    OPTION_1: 'OPTION_1', // so-proud + break-over
    OPTION_2: 'OPTION_2', // so-proud + times-up
};

export default function useAudio() {
    const [selectedOption, setSelectedOption] = useState(AUDIO_OPTIONS.OPTION_1);

    const beepSoundRef = useRef(new Audio.Sound());
    const voice1Ref = useRef(new Audio.Sound());
    const voice2Ref = useRef(new Audio.Sound());
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem('@audio_option').then((val) => {
            if (val) setSelectedOption(val);
        });
    }, []);

    useEffect(() => {
        AsyncStorage.setItem('@audio_option', selectedOption);
    }, [selectedOption]);

    useEffect(() => {
        async function loadSounds() {
            try {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    staysActiveInBackground: true,
                    interruptionModeIOS: 2,
                    playsInSilentModeIOS: true,
                    shouldDuckAndroid: false, // Initial state: ducking is off
                    interruptionModeAndroid: 2,
                    playThroughEarpieceAndroid: false,
                });

                await beepSoundRef.current.loadAsync(require('../../assets/so-proud.mp3'));
                await voice1Ref.current.loadAsync(require('../../assets/break-over.mp3'));
                await voice2Ref.current.loadAsync(require('../../assets/times-up.mp3'));

                setIsLoaded(true);
            } catch (error) {
                console.error("Failed to preload sounds", error);
            }
        }

        loadSounds();

        return () => {
            // Cleanup
            if (beepSoundRef.current) beepSoundRef.current.unloadAsync();
            if (voice1Ref.current) voice1Ref.current.unloadAsync();
            if (voice2Ref.current) voice2Ref.current.unloadAsync();
        };
    }, []);

    const resetAudioMode = async () => {
        try {
            // Pequeno delay para garantir que o áudio terminou de fato no hardware
            await new Promise(resolve => setTimeout(resolve, 500));

            // ESTRATÉGIA AGRESSIVA: Desativar e reativar o motor de áudio.
            // Isso força o Android a perceber que este app não quer mais o controle do som.
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
            console.log("Audio focus released and ducking reset.");
        } catch (e) {
            console.log('Error resetting audio mode', e);
        }
    };

    const playSound = async (onComplete) => {
        if (!isLoaded) return;

        try {
            // Activate ducking before playing
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                staysActiveInBackground: true,
                interruptionModeIOS: 2,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true, // Enable ducking
                interruptionModeAndroid: 2,
                playThroughEarpieceAndroid: false,
            });

            await beepSoundRef.current.replayAsync();

            beepSoundRef.current.setOnPlaybackStatusUpdate(async (status) => {
                // Se faltar menos de 800ms para acabar o beep, já inicia a voz para evitar o silêncio
                if (status.isPlaying && status.durationMillis && (status.durationMillis - status.positionMillis < 800)) {
                    beepSoundRef.current.setOnPlaybackStatusUpdate(null);

                    const voiceSound = selectedOption === AUDIO_OPTIONS.OPTION_1 ? voice1Ref.current : voice2Ref.current;
                    await voiceSound.replayAsync();

                    // Quando a voz terminar, chama o reset do timer
                    voiceSound.setOnPlaybackStatusUpdate(async (vStatus) => {
                        if (vStatus.didJustFinish) {
                            voiceSound.setOnPlaybackStatusUpdate(null);
                            await resetAudioMode(); // Restore Spotify volume
                            if (onComplete) onComplete();
                        }
                    });
                }
            });

        } catch (error) {
            console.error("Playback error", error);
        }
    };

    const stopSound = async () => {
        try {
            if (isLoaded) {
                await beepSoundRef.current.stopAsync();
                await voice1Ref.current.stopAsync();
                await voice2Ref.current.stopAsync();
            }
        } catch (e) { }
    };

    return {
        playSound,
        stopSound,
        selectedOption,
        setSelectedOption
    };
}
