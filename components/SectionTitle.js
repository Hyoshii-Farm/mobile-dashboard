import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SectionTitle({ title }) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.redBar} />
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  redBar: {
    width: 12,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#6F1D1B',
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D1D1D',
  },
});
