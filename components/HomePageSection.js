import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import IconTextButton from './IconTextButton';

const screenWidth = Dimensions.get('window').width;
const numColumns = 4;
const spacing = 12;
const horizontalPadding = 24;

const totalSpacing = spacing * (numColumns - 1);
const totalPadding = horizontalPadding * 2;
const buttonWidth = (screenWidth - totalSpacing - totalPadding) / numColumns;

export default function HomePageSection({ title, items }) {
  // Break items into rows of 4
  const rows = [];
  for (let i = 0; i < items.length; i += numColumns) {
    rows.push(items.slice(i, i + numColumns));
  }

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.card}>
        {rows.map((rowItems, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {rowItems.map((item, index) => (
              <View
                key={index}
                style={[styles.buttonWrapper, { width: buttonWidth }]}
              >
                <IconTextButton
                  iconSvg={item.iconSvg}
                  label={item.label}
                  onPress={item.onPress}
                />
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1C1B1F',
    paddingLeft: 4,
    borderLeftColor: '#9B1D20',
    borderLeftWidth: 6,
  },
  card: {
    backgroundColor: '#D6EDE5',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: horizontalPadding,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing,
  },
  buttonWrapper: {
    alignItems: 'center',
  },
});
