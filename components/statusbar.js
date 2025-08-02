import React from 'react';
import { View, StatusBar, Platform, StyleSheet, SafeAreaView } from 'react-native';

export default function StatusBarCustom({ backgroundColor = '#1D4949', barStyle = 'light-content' }) {
  return (
    <View style={[styles.statusBarWrapper, { backgroundColor }]}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          translucent={Platform.OS === 'android'}
          backgroundColor="#1D4949"
          barStyle={barStyle}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  statusBarWrapper: {
    width: '100%',
    zIndex: 999,
  },
  safeArea: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
});
