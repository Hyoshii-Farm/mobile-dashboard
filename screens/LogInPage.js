import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  Dimensions,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useFonts } from 'expo-font';
import { SvgXml } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const hyoshiiLogo = `
<svg viewBox="0 0 58 90" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
  <path d="M4 90C1.79 90 0 88.21 0 86V4C0 1.79 1.79 0 4 0H14C16.21 0 18 1.79 18 4V50L40 4C40.69 2.62 42.25 2 43.79 2C45.33 2 46.89 2.62 47.58 4L58 26.33C58.62 27.67 57.91 29.25 56.58 29.87C55.25 30.49 53.67 29.79 53.05 28.45L44 10.65L22 56V86C22 88.21 20.21 90 18 90H4Z" fill="#7A2929"/>
</svg>
`;

export default function LogInPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();

  const [fontsLoaded] = useFonts({
    'DMSans-Regular': require('../assets/fonts/DM_Sans/static/DMSans-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return <Text>Loading...</Text>;
  }

  const handleLogin = () => {
    // You can add credential validation here
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFF8" />

          <SvgXml xml={hyoshiiLogo} width={80} height={120} style={styles.logo} />
          <Text style={styles.logoText}>HYŌSHII</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Username or Email Address</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFF8',
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: width * 0.06,
    paddingTop: height * 0.1,
    paddingBottom: height * 0.06,
  },
  logo: {
    marginBottom: height * 0.015,
  },
  logoText: {
    fontFamily: 'DMSans-Regular',
    fontSize: width * 0.045,
    color: '#7A2929',
    textAlign: 'center',
    marginBottom: height * 0.04,
    letterSpacing: 3,
  },
  formGroup: {
    width: '100%',
    marginBottom: height * 0.025,
  },
  label: {
    fontFamily: 'DMSans-Regular',
    fontSize: width * 0.035,
    color: '#1D4949',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    height: height * 0.06,
    borderWidth: 1,
    borderColor: '#1D4949',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: width * 0.04,
    fontFamily: 'DMSans-Regular',
    color: '#1D4949',
    backgroundColor: '#FFFFF8',
    textAlignVertical: 'center',
  },
  loginButton: {
    width: '100%',
    height: height * 0.06,
    backgroundColor: '#1D4949',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: height * 0.01,
  },
  loginButtonText: {
    fontFamily: 'DMSans-Regular',
    color: 'white',
    fontSize: width * 0.04,
  },
});