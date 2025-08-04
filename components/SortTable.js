import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SvgXml } from 'react-native-svg';

const filterIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="5" height="5" viewBox="0 0 5 5" fill="none">
<path d="M1.48576 2.37988V0.857725L0.939485 1.404L0.637177 1.107L1.69791 0.0462646L2.75864 1.107L2.45633 1.404L1.91006 0.857725V2.37988H1.48576ZM2.97079 4.28919L1.91006 3.22846L2.21236 2.93146L2.75864 3.47773V1.95558H3.18293V3.47773L3.72921 2.93146L4.03152 3.22846L2.97079 4.28919Z" fill="#1C1B1F"/>
</svg>`;

export default function SortableTable({ columns, data }) {
  const [sortState, setSortState] = useState({});

  const handleSort = (col) => {
    const current = sortState[col];
    const next = current === 'asc' ? 'desc' : 'asc';
    setSortState({ ...sortState, [col]: next });
  };

  const sortedData = [...data].sort((a, b) => {
    for (const col of columns) {
      if (sortState[col]) {
        const direction = sortState[col] === 'asc' ? 1 : -1;
        if (a[col] < b[col]) return -1 * direction;
        if (a[col] > b[col]) return 1 * direction;
      }
    }
    return 0;
  });

  return (
    <ScrollView horizontal style={styles.container}>
      <View>
        <View style={styles.headerRow}>
          {columns.map((col) => (
            <TouchableOpacity key={col} style={styles.headerCell} onPress={() => handleSort(col)}>
              <Text style={styles.headerText}>{col}</Text>
              <SvgXml xml={filterIcon} width={12} height={12} />
            </TouchableOpacity>
          ))}
        </View>
        <ScrollView>
          {sortedData.map((row, idx) => (
            <View key={idx} style={styles.row}>
              {columns.map((col) => (
                <View key={col} style={styles.cell}>
                  <Text style={styles.cellText}>{row[col]}</Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#E2F1E9',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  headerCell: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 100,
  },
  headerText: {
    fontWeight: '600',
    marginRight: 6,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  cell: {
    minWidth: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cellText: {
    fontSize: 14,
    color: '#1D1D1D',
  },
});
