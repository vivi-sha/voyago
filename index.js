import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import { Alert } from 'react-native';

// Try to catch any fatal JavaScript errors on startup and show them on screen!
if (global.ErrorUtils) {
  const originalHandler = global.ErrorUtils.getGlobalHandler();
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    Alert.alert(
      'Startup Crash Detected',
      `${error.message}\n\n${error.stack}`
    );
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
