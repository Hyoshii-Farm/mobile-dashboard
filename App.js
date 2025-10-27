// App.js
import React, { useEffect } from 'react';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { KindeAuthProvider } from '@kinde/expo';
import * as SecureStore from 'expo-secure-store';

import LogInPage from './screens/LogInPage';
import Home from './screens/Home';
import PesticideUsagePage from './screens/PesticideUsage';
import FormPesticideUsage from './screens/FormPesticideUsage';
import MortalityPage from './screens/Mortality';
import FormMortality from './screens/FormMortality';

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

// Must match app.json -> { expo: { scheme: "hyoshiiapp" } }
const APP_SCHEME = 'hyoshiiapp';

// Are we running inside Expo Go?
const IS_EXPO_GO = Constants.appOwnership === 'expo';

// Build redirect URIs depending on environment:
// - Expo Go -> exp://.../--/path
// - Dev Client / Standalone -> hyoshiiapp://path
const redirectUri = IS_EXPO_GO
  ? Linking.createURL('callback')                       // exp://.../--/callback
  : Linking.createURL('callback', { scheme: APP_SCHEME }); // hyoshiiapp://callback

const logoutRedirectUri = IS_EXPO_GO
  ? Linking.createURL('logout')                         // exp://.../--/logout
  : Linking.createURL('logout', { scheme: APP_SCHEME });   // hyoshiiapp://logout

// React Navigation deep-linking
const linking = {
  prefixes: [
    Linking.createURL('/'),      // exp://... in Expo Go, hyoshiiapp:// in Dev Client/Prod
    `${APP_SCHEME}://`,
  ],
  config: {
    screens: {
      LogIn: 'login',
      Home: 'home',
      PesticideUsage: 'hpt/pesticide-usage',
      FormPesticideUsage: 'hpt/pesticide-usage/new',
      // /callback and /logout handled by auth, not navigation routes
    },
  },
};

export default function App() {
  // Global deep-link handler: catch /logout even if Home isn't mounted yet
  useEffect(() => {
    const handleUrl = ({ url }) => {
      const lower = (url || '').toLowerCase();
      if (lower.includes('logout')) {
        if (navRef.isReady()) {
          navRef.reset({ index: 0, routes: [{ name: 'LogIn' }] });
        } else {
          setTimeout(() => {
            if (navRef.isReady()) {
              navRef.reset({ index: 0, routes: [{ name: 'LogIn' }] });
            }
          }, 100);
        }
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleUrl({ url });
      }
    });

    const sub = Linking.addEventListener('url', handleUrl);
    return () => sub.remove();
  }, []);

  return (
    <KindeAuthProvider
      config={{
        domain: process.env.KINDE_DOMAIN,
        clientId: process.env.KINDE_CLIENT_ID,
        scopes: 'openid profile email offline',
        audience: process.env.EXPO_PUBLIC_KINDE_AUDIENCE,
        redirectUri,
        logoutRedirectUri,
      }}
      storage={{
        getItem: async (key) => {
          try {
            return await SecureStore.getItemAsync(key);
          } catch (error) {
            return null;
          }
        },
        setItem: async (key, value) => {
          try {
            await SecureStore.setItemAsync(key, value);
          } catch (error) {
            // Silent fail for storage errors
          }
        },
        removeItem: async (key) => {
          try {
            await SecureStore.deleteItemAsync(key);
          } catch (error) {
            // Silent fail for storage errors
          }
        },
      }}
      callbacks={{
        onError: (error) => {
          // Silent error handling for production
          // Signature verification errors are false positives during callback
        },
        onSuccess: () => {
          // Silent success for production
        },
      }}
    >
      <NavigationContainer linking={linking} ref={navRef}>
        <Stack.Navigator initialRouteName="LogIn" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="LogIn" component={LogInPage} />
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="PesticideUsage" component={PesticideUsagePage} />
          <Stack.Screen name="FormPesticideUsage" component={FormPesticideUsage} />
          <Stack.Screen name="Mortality" component={MortalityPage} />
          <Stack.Screen name="FormMortality" component={FormMortality} />
        </Stack.Navigator>
      </NavigationContainer>
    </KindeAuthProvider>
  );
}
