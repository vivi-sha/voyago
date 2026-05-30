import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export const playEcoChime = async () => {
    // expo-av has been removed due to a native fatal crash.
    // Audio features are temporarily disabled.
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
