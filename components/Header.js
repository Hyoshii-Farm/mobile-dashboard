import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useFonts } from 'expo-font';

const hamburgerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <path d="M3 12H21M3 6H21M3 18H21" stroke="#2D5B50" stroke-width="2" stroke-linecap="round"/>
</svg>`;

export default function HomeHeader({
  title = 'HYOSHII FARM',
  logoSvg,
  onLeftPress,
  profileContent,
  showHamburger = false,
  centerLogo = false,
}) {
  const [fontsLoaded] = useFonts({
    'DMSans-Regular': require('../assets/fonts/DM_Sans/static/DMSans-Regular.ttf'),
    'DMSans-Bold': require('../assets/fonts/DM_Sans/static/DMSans-Bold.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <View style={styles.headerContainer}>
      {/* Left side: hamburger menu */}
      <View style={styles.leftContainer}>
        {showHamburger && (
          <TouchableOpacity onPress={onLeftPress || (() => {})} style={styles.leftIconTouchable}>
            <SvgXml xml={hamburgerSvg} width={24} height={24} />
          </TouchableOpacity>
        )}
      </View>

      {/* Center: logo */}
      {centerLogo && logoSvg && (
        <View style={styles.centerContainer}>
          <SvgXml xml={logoSvg} width={30} height={30} />
          <Text style={styles.logoText}>HYOSHII</Text>
        </View>
      )}

      {/* Right side: profile avatar */}
      <View style={styles.rightContainer}>
        {profileContent}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    width: Dimensions.get('window').width,
    height: 97,
    backgroundColor: '#1D4949',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftIconTouchable: {
    padding: 8,
  },
  brand: {
    fontSize: 24,
    fontFamily: 'DMSans-Bold',
    color: '#FFFFF8',
    marginLeft: 10,
    letterSpacing: 1.2,
  },
  centerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 8,
  },
  logoText: {
    fontSize: 16,
    fontFamily: 'DMSans-Bold',
    color: '#7A2929',
    letterSpacing: 0.5,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
