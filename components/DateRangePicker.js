import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SvgXml } from 'react-native-svg';
import { useFonts } from 'expo-font';

const calendarSvg = `
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#1D1D1D" stroke-width="1.5">
  <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 7.5h18M4.5 6.75h15A1.5 1.5 0 0 1 21 8.25v11.25a1.5 1.5 0 0 1-1.5 1.5h-15a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5Z" />
</svg>
`;

export default function DateRangePicker() {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  const [fontsLoaded] = useFonts({
    'DMSans-Regular': require('../assets/fonts/DM_Sans/static/DMSans-Regular.ttf'),
    'DMSans-Bold': require('../assets/fonts/DM_Sans/static/DMSans-Bold.ttf'),
  });

  if (!fontsLoaded) return null;

  const renderBox = (value, placeholder, onPress) => (
    <TouchableOpacity style={styles.inputBox} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.textValue}>
        {value ? value.toLocaleDateString() : placeholder}
      </Text>
      <SvgXml xml={calendarSvg} width={16} height={16} style={styles.icon} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Tanggal</Text>
      <View style={styles.row}>
        {renderBox(startDate, 'Start', () => setShowStart(true))}
        {renderBox(endDate, 'End', () => setShowEnd(true))}
      </View>

      {showStart && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStart(false);
            if (selectedDate) setStartDate(selectedDate);
          }}
        />
      )}

      {showEnd && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEnd(false);
            if (selectedDate) setEndDate(selectedDate);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontFamily: 'DMSans-Bold',
    color: '#000000',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputBox: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFF9F2',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textValue: {
    fontSize: 14,
    fontFamily: 'DMSans-Regular',
    color: '#1D1D1D',
    flex: 1,
  },
  icon: {
    marginLeft: 8,
    marginTop: 1,
  },
});
