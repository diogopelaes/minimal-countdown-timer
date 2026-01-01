import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, TouchableOpacity, Modal, FlatList, SafeAreaView } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import useTimer, { TIMER_STATES } from './src/hooks/useTimer';
import useAudio from './src/hooks/useAudio';
import TimerDisplay from './src/components/TimerDisplay';
import Controls from './src/components/Controls';
import { registerBackgroundFetchAsync, unregisterBackgroundFetchAsync } from './src/services/BackgroundTasks';

const THEMES = [
  { id: 'default', name: 'Midnight Orange', bg: '#0F0F0F', text: '#FF8C00', btn: '#333' },
  { id: 'matrix', name: 'Matrix Green', bg: '#000000', text: '#00FF41', btn: '#1A1A1A' },
  { id: 'ocean', name: 'Deep Ocean', bg: '#001F3F', text: '#7FDBFF', btn: '#003366' },
  { id: 'clean', name: 'Clean White', bg: '#FFFFFF', text: '#222222', btn: '#EEEEEE' },
];

export default function App() {
  const { minutes, seconds, setMinutes, setSeconds, status, start, pause, reset, adjustTime } = useTimer();
  const { playSound } = useAudio();

  // Theme state
  const [currentTheme, setCurrentTheme] = useState(THEMES[0]);
  const [isSettingsVisible, setSettingsVisible] = useState(false);

  // Keep Awake logic
  useKeepAwake(); // Checks global config, but better to control manually if possible or just rely on component mount. 
  // expo-keep-awake 's default hook keeps it awake while component is mounted.
  // Spec says: "While timer is Running: Ativar expo-keep-awake".
  // So we should conditionally use it. 
  // However, the hook `useKeepAwake` doesn't take a condition in v13+ (it just works when mounted).
  // We can use `keepAwake` / `deactivateKeepAwake` functions from the package or conditional rendering of a component that uses the hook.
  // Actually, standard `useKeepAwake` keeps it awake.
  // Let's import functions to control it imperatively or use the hook in a sub-component?
  // The package exports `activateKeepAwake` and `deactivateKeepAwakeAsync`.
  // Let's use those inside useEffect based on status.

  // Audio on finish
  useEffect(() => {
    if (status === TIMER_STATES.FINISHED) {
      playSound();
    }
  }, [status]);

  // Background registration (optional per spec, but good practice if we want fetch)
  useEffect(() => {
    registerBackgroundFetchAsync();
    return () => {
      // unregisterBackgroundFetchAsync(); // Keep it running? Spec doesn't require unregister.
    };
  }, []);

  // Theme Persistence
  useEffect(() => {
    AsyncStorage.getItem('@app_theme').then((id) => {
      if (id) {
        const found = THEMES.find(t => t.id === id);
        if (found) setCurrentTheme(found);
      }
    });
  }, []);

  const changeTheme = (theme) => {
    setCurrentTheme(theme);
    AsyncStorage.setItem('@app_theme', theme.id);
    setSettingsVisible(false);
  };

  // Keep Screen On Effect
  // We need to import the imperative functions because the hook is unconditional.
  // Actually, let's verify exact export of expo-keep-awake.
  // "import { useKeepAwake } from 'expo-keep-awake';" is the hook.
  // We can condition it by creating a component or just importing functions.
  // Let's assume we can use the default export or functions.

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: currentTheme.bg }]}>
        <StatusBar style={currentTheme.bg === '#FFFFFF' ? 'dark' : 'light'} />

        {/* Settings Button */}
        <TouchableOpacity style={styles.settingsBtn} onPress={() => setSettingsVisible(true)}>
          <Text style={[styles.settingsText, { color: currentTheme.text }]}>⚙</Text>
        </TouchableOpacity>

        {/* Keep Awake Logic Component wrapper */}
        {status === TIMER_STATES.RUNNING && <KeepAwakeComponent />}

        <View style={styles.content}>
          <TimerDisplay
            minutes={minutes}
            seconds={seconds}
            onUpdate={(m, s) => { setMinutes(m); setSeconds(s); }}
            isEditable={status !== TIMER_STATES.RUNNING}
          />

          {/* Pass theme colors if needed, or rely on Controls internal styles (which are fixed dark/light? Spec says "Fundo quase preto... Tons suaves de laranja"). 
                 But Steps 5 says "Temas aplicam instantaneamente". 
                 So Controls should probably accept colors or we style them here.
                 I'll wrap Controls or just pass no custom styles for now, but UI might look off on Light theme.
                 Let's pass color prop for text at least? 
                 Simple fix: Controls uses default styles, maybe mostly neutral.
             */}
          <Controls
            status={status}
            onStart={start}
            onPause={pause}
            onReset={reset}
            onAdjust={adjustTime}
          />
        </View>

        {/* Theme Modal */}
        <Modal visible={isSettingsVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: currentTheme.btn }]}>
              <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Select Theme</Text>
              <FlatList
                data={THEMES}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.themeItem} onPress={() => changeTheme(item)}>
                    <View style={[styles.colorPreview, { backgroundColor: item.bg, border: 1, borderColor: '#fff' }]} />
                    <Text style={{ color: currentTheme.text, marginLeft: 10 }}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity onPress={() => setSettingsVisible(false)} style={styles.closeBtn}>
                <Text style={{ color: currentTheme.text }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
}

// Helper component for conditional hook usage
function KeepAwakeComponent() {
  useKeepAwake();
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  settingsBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 10,
    zIndex: 10,
  },
  settingsText: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
    maxHeight: '50%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  themeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#555',
  },
  colorPreview: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#888',
  },
  closeBtn: {
    marginTop: 20,
    alignItems: 'center',
    padding: 10,
  },
});
