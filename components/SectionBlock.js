import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import IconTextButton from './IconTextButton';

const screenWidth = Dimensions.get('window').width;
const numColumns = 4;
const spacing = 12;
const horizontalPadding = 24;

const totalSpacing = spacing * (numColumns - 1);
const totalPadding = horizontalPadding * 2;
const buttonWidth = (screenWidth - totalSpacing - totalPadding) / numColumns;

export default function SectionBlock({ items }) {
  return (
    <View style={styles.card}>
      {items.map((item, index) => (
        <View key={index} style={[styles.buttonWrapper, { width: buttonWidth }]}>
          <IconTextButton
            iconSvg={item.iconSvg}
            label={item.label}
            onPress={item.onPress}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#D6EDE5',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: spacing,
  },
  buttonWrapper: {
    alignItems: 'center',
    marginBottom: 8,
  },
});
