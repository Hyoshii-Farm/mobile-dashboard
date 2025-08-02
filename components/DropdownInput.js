import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useFonts } from 'expo-font';

const downArrowSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="12" height="8" viewBox="0 0 12 8" fill="none">
  <path d="M11.6087 1.5738L6.14086 7.04163L0.673035 1.5738L1.94886 0.297978L6.14086 4.48998L10.3329 0.297978L11.6087 1.5738Z" fill="black"/>
</svg>
`;

export default function DropdownInput({ label, value, onPress }) {
  const [fontsLoaded] = useFonts({
    'DMSans-Regular': require('../assets/fonts/DM_Sans/static/DMSans-Regular.ttf'),
    'DMSans-Bold': require('../assets/fonts/DM_Sans/static/DMSans-Bold.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity style={styles.inputBox} onPress={onPress} activeOpacity={0.8}>
        <Text style={styles.selectedText}>
          {value ? value : 'Select...'}
        </Text>
        <View style={styles.dropdownIcon}>
          <SvgXml xml={downArrowSvg} width={16} height={16} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontFamily: 'DMSans-Bold',
    color: '#000000',
    marginBottom: 6,
  },
  inputBox: {
    borderWidth: 1,
    borderColor: '#000000',
    backgroundColor: '#FFF9F2',
    borderRadius: 16,
    height: 48,
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedText: {
    fontSize: 16,
    fontFamily: 'DMSans-Regular',
    color: '#1D1D1D',
    flex: 1,
  },
  dropdownIcon: {
    marginLeft: 8,
  },
});
