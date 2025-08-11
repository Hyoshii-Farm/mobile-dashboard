import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';

export default function DropdownBox({
  items = [],
  onSelect,
  style,
  searchPlaceholder = 'Type to search...',
}) {
  const [query, setQuery] = useState('');

  // Filter items based on query
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(item => item.toLowerCase().includes(q));
  }, [query, items]);

  return (
    <View style={[styles.dropdownBox, style]}>
      {/* Search bar */}
      <TextInput
        style={styles.searchInput}
        placeholder={searchPlaceholder}
        value={query}
        onChangeText={setQuery}
      />

      {/* Options list */}
      <ScrollView
        nestedScrollEnabled
        style={{ maxHeight: 150 }}
        contentContainerStyle={styles.optionList}
        keyboardShouldPersistTaps="handled"
      >
        {filteredItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.option}
            onPress={() => onSelect(item)}
          >
            <Text style={styles.optionText}>{item}</Text>
          </TouchableOpacity>
        ))}
        {filteredItems.length === 0 && (
          <Text style={styles.noResults}>No results found</Text>
        )}
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
  searchInput: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
    fontSize: 16,
    color: '#1D1D1D',
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
  noResults: {
    padding: 12,
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
  },
});
