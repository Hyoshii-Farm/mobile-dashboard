import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

export default function NumericRangeInput({ fromValue, toValue, setFromValue, setToValue }) {
  return (
    <View style={styles.row}>
      <TextInput
        style={styles.input}
        placeholder="From"
        keyboardType="numeric"
        value={fromValue}
        onChangeText={setFromValue}
      />
      <TextInput
        style={styles.input}
        placeholder="To"
        keyboardType="numeric"
        value={toValue}
        onChangeText={setToValue}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  input: {
    flex: 1,                      // <-- ensure it expands
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFF9F2',
    fontSize: 14,
    color: '#333',
  },
});
