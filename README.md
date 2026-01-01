# <img src="./assets/icon.png" width="40" height="38" /> Minimal Countdown Timer

A beautiful, distraction-free countdown timer built with React Native and Expo. Designed for deep focus and ease of use.

## ✨ Features

- **Minimalist Design**: A clean, high-contrast interface.
- **Dynamic Themes**: Choose from multiple styles (Midnight Orange, Matrix Green, Deep Ocean, Clean White).
- **Manual Editing**: Touch the timer digits to set your duration directly.
- **Audio Notifications**: A notification sound plays automatically when the timer reaches zero.
- **Background Support**: The timer continues to work even when the app is minimized.
- **Screen Always On**: Prevents the screen from dimming while the timer is running.
- **Persistent Settings**: Remembers your last used duration and selected theme.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [Expo Go](https://expo.dev/expo-go) app on your Android/iOS device.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/diogopelaes/minimal-countdown-timer.git
   cd minimal-countdown-timer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the project:
   ```bash
   npx expo start
   ```

4. Scan the QR code with the **Expo Go** app to run the project.

## 🛠️ Build & Deployment

This project uses **EAS Build** to generate production-ready files.

### Generate APK (Installable on Android)
To generate an APK file for direct installation:
```bash
npx eas-cli build -p android --profile preview
```

### Generate AAB (Google Play Store)
To generate the format required for the Play Store:
```bash
npx eas-cli build -p android --profile production
```

## 📂 Project Structure

- `src/hooks/useTimer.js`: Core countdown logic and state management.
- `src/hooks/useAudio.js`: Audio playback handling.
- `src/components/`: Reusable UI components (TimerDisplay, Controls).
- `src/services/BackgroundTasks.js`: Configuration for background execution.
- `App.js`: Main application entry point and theme management.

## 📝 License

This project is open-source and available under the MIT License.
