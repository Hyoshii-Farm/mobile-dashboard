import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SvgXml } from 'react-native-svg';

const clockSvg = `
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="teal" stroke-width="1.5">
  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>
`;

export default function TimeRangePicker({ startTime, setStartTime, endTime, setEndTime }) {
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  const formatTime = (date) => {
    if (!date) return '';
    const hrs = date.getHours().toString().padStart(2, '0');
    const mins = date.getMinutes().toString().padStart(2, '0');
    return `${hrs}:${mins}`;
  };

  return (
    <View style={styles.row}>
      {/* Start Time */}
      <TouchableOpacity style={styles.timeBox} onPress={() => setShowStart(true)}>
        <View style={styles.labelIcon}>
          <Text style={styles.label}>Start</Text>
          <SvgXml xml={clockSvg} width={20} height={20} />
        </View>
        <Text style={styles.timeText}>{formatTime(startTime)}</Text>
      </TouchableOpacity>
      {showStart && (
        <DateTimePicker
          value={startTime || new Date()}
          mode="time"
          is24Hour={true}
          display="spinner"
          onChange={(event, selectedDate) => {
            setShowStart(false);
            if (selectedDate) setStartTime(selectedDate);
          }}
        />
      )}

      {/* End Time */}
      <TouchableOpacity style={styles.timeBox} onPress={() => setShowEnd(true)}>
        <View style={styles.labelIcon}>
          <Text style={styles.label}>End</Text>
          <SvgXml xml={clockSvg} width={20} height={20} />
        </View>
        <Text style={styles.timeText}>{formatTime(endTime)}</Text>
      </TouchableOpacity>
      {showEnd && (
        <DateTimePicker
          value={endTime || new Date()}
          mode="time"
          is24Hour={true}
          display="spinner"
          onChange={(event, selectedDate) => {
            setShowEnd(false);
            if (selectedDate) setEndTime(selectedDate);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  timeBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: '#FFF9F2',
  },
  labelIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  timeText: {
    fontSize: 14,
    color: '#333',
  },
});
