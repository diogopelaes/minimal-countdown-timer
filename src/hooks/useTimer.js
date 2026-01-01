import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

const TIMER_STORAGE_KEY = '@timer_initial_value';

export const TIMER_STATES = {
    IDLE: 'IDLE',
    RUNNING: 'RUNNING',
    PAUSED: 'PAUSED',
    FINISHED: 'FINISHED',
};

export default function useTimer() {
    const [minutes, setMinutes] = useState(0);
    const [seconds, setSeconds] = useState(30);
    const [initialMinutes, setInitialMinutes] = useState(0);
    const [initialSeconds, setInitialSeconds] = useState(30);
    const [status, setStatus] = useState(TIMER_STATES.IDLE);

    const intervalRef = useRef(null);
    const endTimeRef = useRef(null);

    // Load initial value from storage
    useEffect(() => {
        const loadInitialValue = async () => {
            try {
                const storedValue = await AsyncStorage.getItem(TIMER_STORAGE_KEY);
                if (storedValue) {
                    const parsed = JSON.parse(storedValue);
                    setMinutes(parsed.minutes);
                    setSeconds(parsed.seconds);
                    setInitialMinutes(parsed.minutes);
                    setInitialSeconds(parsed.seconds);
                }
            } catch (e) {
                console.error('Failed to load timer value', e);
            }
        };
        loadInitialValue();
    }, []);

    // Save initial value to storage whenever it changes (and we are in IDLE)
    useEffect(() => {
        if (status === TIMER_STATES.IDLE) {
            const saveValue = async () => {
                try {
                    await AsyncStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify({ minutes, seconds }));
                    setInitialMinutes(minutes);
                    setInitialSeconds(seconds);
                } catch (e) {
                    console.error('Failed to save timer value', e);
                }
            };
            // Debounce or just save? For simplicity, saving here. 
            // But careful: we don't want to save *current* time if it's running. 
            // This effect runs on minutes/seconds change. 
            // We only want to update "Initial" if we are deliberately setting it in IDLE.
            // However, start/reset logic needs to be careful.
        }
    }, [minutes, seconds, status]);

    // This logic above is slightly flawed because if we count down, minutes/seconds change.
    // We should NOT save during RUNNING. We only save when the user edits it in IDLE.
    // I will refactor persistence to be explicit in setters or effect with strict condition.

    const saveToStorage = async (m, s) => {
        try {
            await AsyncStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify({ minutes: m, seconds: s }));
        } catch (e) {
            console.error(e);
        }
    }

    const adjustTime = useCallback((amountSeconds) => {
        if (status !== TIMER_STATES.IDLE && status !== TIMER_STATES.PAUSED && status !== TIMER_STATES.RUNNING) return;

        // In spec: "+ adiciona 5 segundos", "- remove 5 segundos"
        // Valid for running state? Spec doesn't strictly forbid, usually allowed.
        // If running, we just adjust current time.

        let totalSeconds = minutes * 60 + seconds + amountSeconds;
        if (totalSeconds < 0) totalSeconds = 0;

        const newM = Math.floor(totalSeconds / 60);
        const newS = totalSeconds % 60;

        setMinutes(newM);
        setSeconds(newS);

        // Update endTime if running
        if (status === TIMER_STATES.RUNNING && endTimeRef.current) {
            endTimeRef.current += amountSeconds * 1000;
        }

        // Only update initial persistence if IDLE
        if (status === TIMER_STATES.IDLE) {
            setInitialMinutes(newM);
            setInitialSeconds(newS);
            saveToStorage(newM, newS);
        }
    }, [minutes, seconds, status]);

    const start = useCallback(() => {
        if (status === TIMER_STATES.RUNNING) return;

        // Calculate expected end time
        const totalMs = (minutes * 60 + seconds) * 1000;
        if (totalMs <= 0) return;

        endTimeRef.current = Date.now() + totalMs;
        setStatus(TIMER_STATES.RUNNING);
    }, [minutes, seconds, status]);

    const pause = useCallback(() => {
        if (status !== TIMER_STATES.RUNNING) return;
        setStatus(TIMER_STATES.PAUSED);
        // Cleanup interval is handled by effect
    }, [status]);

    const reset = useCallback(() => {
        setStatus(TIMER_STATES.IDLE);
        setMinutes(initialMinutes);
        setSeconds(initialSeconds);
    }, [initialMinutes, initialSeconds]);

    const tick = useCallback(() => {
        if (status !== TIMER_STATES.RUNNING) return;

        const now = Date.now();
        const remainingMs = endTimeRef.current - now;

        if (remainingMs <= 0) {
            setStatus(TIMER_STATES.FINISHED);
            setMinutes(0);
            setSeconds(0);
        } else {
            const remainingSec = Math.ceil(remainingMs / 1000);
            const newM = Math.floor(remainingSec / 60);
            const newS = remainingSec % 60;

            // Only update if changed to avoid renders? React does this.
            setMinutes(newM);
            setSeconds(newS);
        }
    }, [status]);

    useEffect(() => {
        if (status === TIMER_STATES.RUNNING) {
            intervalRef.current = setInterval(tick, 100); // 100ms for responsiveness
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [status, tick]);

    return {
        minutes,
        seconds,
        setMinutes, // for manual edit
        setSeconds, // for manual edit
        status,
        start,
        pause,
        reset,
        adjustTime,
        saveToStorage // exposed if direct edit needs it
    };
}
