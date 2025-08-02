import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Dimensions,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useFonts } from 'expo-font';

const plusIcon = `
<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none">
  <mask id="mask0_88_2815" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="17" height="17">
    <rect x="0.0588837" y="0.394897" width="16.1848" height="16.1848" fill="#D9D9D9"/>
  </mask>
  <g mask="url(#mask0_88_2815)">
    <path d="M7.47705 14.5565V9.16162H2.08213V7.81289H7.47705V2.41797H8.82578V7.81289H14.2207V9.16162H8.82578V14.5565H7.47705Z" fill="#FFFAEE"/>
  </g>
</svg>
`;

export default function AddNewButton({ onPress }) {
  const [fontsLoaded] = useFonts({
    'DMSans-Regular': require('../assets/fonts/DM_Sans/static/DMSans-Regular.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.content}>
        <SvgXml xml={plusIcon} width={17} height={17} />
        <Text style={styles.text}>Add New Data</Text>
      </View>
    </TouchableOpacity>
  );
}

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#7B2929',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    width: '100%', // ✅ fill parent width
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontSize: 13,
    fontFamily: 'DMSans-Regular',
    color: '#FFFAEE',
  },
});
