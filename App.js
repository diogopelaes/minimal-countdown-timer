import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, TouchableOpacity, Modal, SafeAreaView, ScrollView, Platform, LogBox } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useState, useRef } from 'react';

// Silence the Expo Go push notification warning as we only use local notifications
LogBox.ignoreLogs(['expo-notifications: Android Push notifications']);
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import useTimer, { TIMER_STATES } from './src/hooks/useTimer';
import useAudio, { AUDIO_OPTIONS } from './src/hooks/useAudio';
import TimerDisplay from './src/components/TimerDisplay';
import Controls from './src/components/Controls';
import { registerBackgroundFetchAsync } from './src/services/BackgroundTasks';
import * as Notifications from 'expo-notifications';

// Handle notifications when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Legacy support
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldVibrate: true,
  }),
});

const THEMES = [
  { id: 'default', name: 'Midnight Orange', bg: '#0F0F0F', text: '#FF8C00', btn: '#333' },
  { id: 'matrix', name: 'Matrix Green', bg: '#000000', text: '#00FF41', btn: '#1A1A1A' },
  { id: 'ocean', name: 'Deep Ocean', bg: '#001F3F', text: '#7FDBFF', btn: '#003366' },
  { id: 'clean', name: 'Clean White', bg: '#FFFFFF', text: '#222222', btn: '#EEEEEE' },
];

export default function App() {
  const { minutes, seconds, setMinutes, setSeconds, status, start, pause, reset, adjustTime } = useTimer();
  const { playSound, selectedOption, setSelectedOption } = useAudio();

  // Theme state
  const [currentTheme, setCurrentTheme] = useState(THEMES[0]);
  const [isSettingsVisible, setSettingsVisible] = useState(false);
  const notificationIdRef = useRef(null);

  // Request Notification Permissions
  useEffect(() => {
    async function requestPermissions() {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('timer-channel', {
          name: 'Timer Notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF8C00',
        });
      }
    }
    requestPermissions();
  }, []);

  // Sync Notification with Timer
  useEffect(() => {
    async function updateNotification() {
      if (status === TIMER_STATES.RUNNING) {
        const titleText = `Time Remaining: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        // 1. Atualiza a notificação "Fixa" na tela de bloqueio
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: "Minimal Timer Running",
            body: titleText,
            android: {
              channelId: 'timer-channel',
              sticky: true,
              ongoing: true,
              color: '#FF8C00',
            },
          },
          trigger: null,
        });

        if (notificationIdRef.current) {
          await Notifications.dismissNotificationAsync(notificationIdRef.current);
        }
        notificationIdRef.current = id;

        // 2. Agenda o alarme no sistema para quando o tempo acabar
        // Isso garante que o celular desperte mesmo se o JS estiver congelado
        const totalSeconds = minutes * 60 + seconds;
        if (totalSeconds > 0) {
          await Notifications.cancelAllScheduledNotificationsAsync();
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Time's Up!",
              body: "Your countdown has finished.",
              android: {
                channelId: 'timer-channel',
                priority: 'max',
                vibrate: true,
              },
            },
            trigger: { seconds: totalSeconds },
          });
        }
      } else if (status === TIMER_STATES.FINISHED) {
        // Se o app já estiver ativo, toca a sequência personalizada
        if (notificationIdRef.current) {
          await Notifications.dismissNotificationAsync(notificationIdRef.current);
          notificationIdRef.current = null;
        }

        playSound(() => {
          reset();
        });
      } else {
        // IDLE ou PAUSED: Cancela agendamentos e remove notificação fixa
        await Notifications.cancelAllScheduledNotificationsAsync();
        if (notificationIdRef.current) {
          await Notifications.dismissNotificationAsync(notificationIdRef.current);
          notificationIdRef.current = null;
        }
      }
    }

    updateNotification();
  }, [status, minutes]);


  // Background registration
  useEffect(() => {
    registerBackgroundFetchAsync();
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
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: currentTheme.bg }]}>
        <StatusBar style={currentTheme.bg === '#FFFFFF' ? 'dark-content' : 'light-content'} />

        {/* Settings Button */}
        <TouchableOpacity style={styles.settingsBtn} onPress={() => setSettingsVisible(true)}>
          <Text style={[styles.settingsText, { color: currentTheme.text }]}>⚙</Text>
        </TouchableOpacity>

        {/* Keep Awake Logic */}
        {status === TIMER_STATES.RUNNING && <KeepAwakeComponent />}

        <View style={styles.content}>
          <TimerDisplay
            minutes={minutes}
            seconds={seconds}
            onUpdate={(m, s) => { setMinutes(m); setSeconds(s); }}
            isEditable={status !== TIMER_STATES.RUNNING}
          />

          <Controls
            status={status}
            onStart={start}
            onPause={pause}
            onReset={reset}
            onAdjust={adjustTime}
          />
        </View>

        {/* Settings Modal */}
        <Modal
          visible={isSettingsVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setSettingsVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: currentTheme.btn }]}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Settings</Text>

                {/* Themes Section */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Themes</Text>
                  {THEMES.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.themeItem}
                      onPress={() => changeTheme(item)}
                    >
                      <View style={[styles.colorPreview, { backgroundColor: item.bg }]} />
                      <Text style={{ color: currentTheme.text, marginLeft: 12, flex: 1 }}>{item.name}</Text>
                      {currentTheme.id === item.id && <Text style={{ color: currentTheme.text, fontWeight: 'bold' }}>✓</Text>}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Sounds Section */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Sounds</Text>
                  <TouchableOpacity
                    style={[styles.themeItem, { opacity: selectedOption === AUDIO_OPTIONS.OPTION_1 ? 1 : 0.4 }]}
                    onPress={() => setSelectedOption(AUDIO_OPTIONS.OPTION_1)}
                  >
                    <Text style={{ color: currentTheme.text, flex: 1 }}>Option 1 (Voz Incentivo)</Text>
                    {selectedOption === AUDIO_OPTIONS.OPTION_1 && <Text style={{ color: currentTheme.text }}>●</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.themeItem, { opacity: selectedOption === AUDIO_OPTIONS.OPTION_2 ? 1 : 0.4 }]}
                    onPress={() => setSelectedOption(AUDIO_OPTIONS.OPTION_2)}
                  >
                    <Text style={{ color: currentTheme.text, flex: 1 }}>Option 2 (Voz Alerta)</Text>
                    {selectedOption === AUDIO_OPTIONS.OPTION_2 && <Text style={{ color: currentTheme.text }}>●</Text>}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => setSettingsVisible(false)}
                  style={[styles.closeBtn, { borderTopWidth: 1, borderTopColor: '#555' }]}
                >
                  <Text style={[styles.closeText, { color: currentTheme.text }]}>CLOSE</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
}

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
    zIndex: 100,
  },
  settingsText: {
    fontSize: 28,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxHeight: '75%',
    padding: 25,
    borderRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 20,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textTransform: 'uppercase',
    opacity: 0.6,
  },
  themeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  colorPreview: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  closeBtn: {
    marginTop: 10,
    paddingVertical: 20,
    alignItems: 'center',
  },
  closeText: {
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
  },
});
