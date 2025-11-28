import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import IconTextButton from './IconTextButton';

export default function HomePageSection({ title, items }) {
  return (
    <View style={styles.section}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.buttonsContainer}>
        {items.map((item, index) => (
          <IconTextButton
            key={index}
            iconSvg={item.iconSvg}
            label={item.label}
            onPress={item.onPress}
          />
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
    color: '#2D5B50',
    textAlign: 'center',
  },
  buttonsContainer: {
    gap: 12,
  },
});
