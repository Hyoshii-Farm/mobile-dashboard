import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { KindeAuthProvider } from '@kinde/expo';

import LogInPage from './screens/LogInPage';
import Home from './screens/Home';
import PesticideUsagePage from './screens/PesticideUsage';
import FormPesticideUsage from './screens/FormPesticideUsage';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <KindeAuthProvider
      config={{
        domain: "https://auth.hyoshii.com", // your Kinde custom domain
        clientId: "c5b3dc91b83f46558e1d7da7f46fab55",
        scopes: "openid profile email offline", // typical scopes
      }}
      callbacks={{
        onError: (error) => console.error("Kinde error:", error),
      }}
    >
      <NavigationContainer>
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
