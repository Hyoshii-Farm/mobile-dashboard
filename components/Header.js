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
import { useNavigation } from '@react-navigation/native';
import { useFonts } from 'expo-font';

export default function HomeHeader({
  title = 'HYOSHII FARM',
  logoSvg,
  onLeftPress,
  showHomeButton = true,
  profileImage,
}) {
  const navigation = useNavigation();

  const [fontsLoaded] = useFonts({
    'DMSans-Regular': require('../assets/fonts/DM_Sans/static/DMSans-Regular.ttf'),
    'DMSans-Bold': require('../assets/fonts/DM_Sans/static/DMSans-Bold.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftContainer}>
        {logoSvg && (
          onLeftPress ? (
            <TouchableOpacity onPress={onLeftPress} style={styles.leftIconTouchable}>
              <SvgXml xml={logoSvg} width={24} height={36} />
            </TouchableOpacity>
          ) : (
            <SvgXml xml={logoSvg} width={24} height={36} />
          )
        )}
        <Text style={styles.brand}>{title}</Text>
      </View>

      {showHomeButton && (
        <TouchableOpacity
          style={styles.rightContainer}
          onPress={() => navigation.navigate('Home')}
        >
          <Image
            source={
              profileImage
                ? { uri: profileImage }
                : require('../assets/icon.png')
            }
            style={styles.avatar}
          />
        </TouchableOpacity>
      )}
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
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFF8',
  },
});
