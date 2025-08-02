import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LogInPage from './screens/LogInPage';
import Home from './screens/Home';
import PesticideUsagePage from './screens/PesticideUsage';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="LogIn"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="LogIn" component={LogInPage} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="PesticideUsage" component={PesticideUsagePage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
