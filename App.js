// App.js
import React from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { KindeAuthProvider } from '@kinde/expo';

import LogInPage from './screens/LogInPage';
import Home from './screens/Home';
import PesticideUsagePage from './screens/PesticideUsage';
import FormPesticideUsage from './screens/FormPesticideUsage';

const Stack = createNativeStackNavigator();

// app.json already has: "scheme": "hyoshiiapp"
const APP_SCHEME = 'hyoshiiapp';

// Redirects used by Kinde (must be whitelisted in Kinde dashboard)
const redirectUri = Platform.select({
  web: 'http://localhost:19006',
  default: Linking.createURL('callback'), // exp://.../--/callback (dev) → hyoshiiapp://callback (prod)
});
const logoutRedirectUri = Platform.select({
  web: 'http://localhost:19006',
  default: Linking.createURL('logout'), // exp://.../--/logout (dev) → hyoshiiapp://logout (prod)
});

// React Navigation deep-linking (optional but handy)
const linking = {
  prefixes: [Linking.createURL('/'), `${APP_SCHEME}://`],
  config: {
    screens: {
      LogIn: 'login',
      Home: 'home',
      PesticideUsage: 'hpt/pesticide-usage',
      FormPesticideUsage: 'hpt/pesticide-usage/new',
      // Note: /callback and /logout are for Kinde; no routes needed here.
    },
  },
};

export default function App() {
  return (
    <KindeAuthProvider
      config={{
        domain: 'https://auth.hyoshii.com',
        clientId: 'c5b3dc91b83f46558e1d7da7f46fab55',
        scopes: 'openid profile email offline',
        redirectUri,
        logoutRedirectUri,
      }}
      callbacks={{
        onError: (error) => console.error('Kinde error:', error),
      }}
    >
      <NavigationContainer linking={linking}>
        <Stack.Navigator initialRouteName="LogIn" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="LogIn" component={LogInPage} />
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="PesticideUsage" component={PesticideUsagePage} />
          <Stack.Screen name="FormPesticideUsage" component={FormPesticideUsage} />
        </Stack.Navigator>
      </NavigationContainer>
    </KindeAuthProvider>
  );
}
