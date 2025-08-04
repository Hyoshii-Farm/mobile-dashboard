import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SvgXml } from 'react-native-svg';

const downArrowSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="12" height="8" viewBox="0 0 12 8" fill="none">
  <path d="M11.6087 1.5738L6.14086 7.04163L0.673035 1.5738L1.94886 0.297978L6.14086 4.48998L10.3329 0.297978L11.6087 1.5738Z" fill="black"/>
</svg>
`;

export default function CollapsibleMultiselect({ label, items, selectedItems, onToggle }) {
  const [isOpen, setIsOpen] = useState(false);

  const displayText =
    selectedItems.length > 0
      ? selectedItems.join(', ')
      : 'Select...';

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.inputBox} onPress={() => setIsOpen(!isOpen)}>
        <Text style={selectedItems.length > 0 ? styles.selectedText : styles.placeholder}>
          {displayText}
        </Text>
        <SvgXml xml={downArrowSvg} width={12} height={8} />
      </TouchableOpacity>

      {isOpen && (
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    color: '#000',
  },
  inputBox: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFF9F2',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  placeholder: {
    fontSize: 16,
    color: '#1D1D1D',
  },
  selectedText: {
    fontSize: 16,
    color: '#1D1D1D',
    flex: 1,
    marginRight: 8,
  },
  dropdownBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 12,
    backgroundColor: '#FBF7EB',
    maxHeight: 300,
    paddingVertical: 8,
    paddingHorizontal: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
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
    color: '#1D1D1D',
  },
  checkmark: {
    fontSize: 16,
    color: '#1D4949',
  },
});
