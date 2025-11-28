import { useEffect } from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useFonts } from 'expo-font';
import { useKindeAuth } from '@kinde/expo';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

export default function LogInPage() {
  const { login, isAuthenticated, getUserProfile } = useKindeAuth();
  const navigation = useNavigation();

  const [fontsLoaded] = useFonts({
    'DMSans-Regular': require('../assets/fonts/DM_Sans/static/DMSans-Regular.ttf'),
  });

  // Navigate to Home if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated) {
        const user = await getUserProfile();
        console.log('Authenticated user:', user);
        navigation.replace('Home');
      }
    };
    checkAuth();
  }, [isAuthenticated]);

  if (!fontsLoaded) return <Text>Loading...</Text>;

  const handleKindeLogin = async () => {
    try {
      await login();
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFF8" />
      <Text style={styles.logoText}>HYOSHII</Text>

      <TouchableOpacity style={styles.loginButton} onPress={handleKindeLogin}>
        <Text style={styles.loginButtonText}>Login to Hyoshii</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFF8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: width * 0.06,
  },
  logoText: {
    fontFamily: 'DMSans-Regular',
    fontSize: width * 0.045,
    color: '#7A2929',
    textAlign: 'center',
    marginBottom: height * 0.04,
    letterSpacing: 3,
  },
  loginButton: {
    width: '85%',
    height: height * 0.06,
    backgroundColor: '#1D4949',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    fontFamily: 'DMSans-Regular',
    color: 'white',
    fontSize: width * 0.04,
  },
});