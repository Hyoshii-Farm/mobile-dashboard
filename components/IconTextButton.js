import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';

export default function IconTextButton({ iconSvg, label, onPress }) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <SvgXml xml={iconSvg} width={22} height={22} />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 56,    
    height: 64,     
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
});
