import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Lazy-load expo-av to prevent crash when native module isn't available (Expo Go)
let Audio = null;
try {
    Audio = require('expo-av').Audio;
} catch (e) {
    console.log('expo-av not available, audio features disabled:', e.message);
}

let soundObject = null;

// Initialize sound object to avoid loading it every time
const initAudio = async () => {
    if (Platform.OS === 'web' || !Audio) return;
    try {
        if (!soundObject) {
            const { sound } = await Audio.Sound.createAsync(
                require('../../assets/sounds/eco-chime.mp3')
            );
            soundObject = sound;
        }
    } catch (e) {
        console.log('Audio init failed:', e.message);
    }
};

// Start initialization silently (only if Audio module loaded)
if (Audio) {
    initAudio();
}

export const playEcoChime = async () => {
    if (Platform.OS === 'web' || !Audio) return;
    try {
        if (!soundObject) {
            await initAudio();
        }
        if (soundObject) {
            await soundObject.replayAsync();
        }
    } catch (e) {
        console.log('Failed to play eco chime:', e.message);
    }
};

export const triggerLight = () => {
    if (Platform.OS === 'web') return;
    try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
        console.log('Haptics not available:', e.message);
    }
};

export const triggerSuccess = () => {
    if (Platform.OS === 'web') return;
    try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
        console.log('Haptics not available:', e.message);
    }
};

export const triggerCelebration = () => {
    if (Platform.OS === 'web') return;
    try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
        console.log('Haptics not available:', e.message);
    }
};
