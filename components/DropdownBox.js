import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';

export default function DropdownBox({
  items,
  onSelect,
  style,
}) {
  return (
    <View style={[styles.dropdownBox, style]}>
      <ScrollView
        nestedScrollEnabled
        style={{ maxHeight: 150 }}
        contentContainerStyle={styles.optionList}
      >
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.option}
            onPress={() => onSelect(item)}
          >
            <Text style={styles.optionText}>{item}</Text>
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
  optionList: {
    paddingVertical: 4,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  optionText: {
    fontSize: 16,
    color: '#1D1D1D',
  },
});
