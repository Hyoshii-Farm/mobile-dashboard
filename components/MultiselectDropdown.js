import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function MultiselectDropdown({ items, selectedItems, onToggle }) {
  return (
    <View style={styles.dropdownBox}>
      <ScrollView>
        {items.map((item) => (
          <TouchableOpacity
            key={item}
            style={styles.itemRow}
            onPress={() => onToggle(item)}
          >
            <Text style={styles.itemText}>{item}</Text>
            {selectedItems.includes(item) && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  dropdownBox: {
    marginTop: 4,
    backgroundColor: '#FAFAF8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CCC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
  },
  itemText: {
    fontSize: 16,
    color: '#1D4949',
  },
  checkmark: {
    fontSize: 16,
    color: '#1D4949',
  },
});
