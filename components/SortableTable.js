import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SvgXml } from 'react-native-svg';

// simple up/down arrows
const upSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 2l3 3H2l3-3z" fill="#1C1B1F"/></svg>`;
const downSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 8L2 5h6L5 8z" fill="#1C1B1F"/></svg>`;

function coerceForSort(v) {
  if (v === null || v === undefined) return { t: 'null', v: null };
  if (typeof v === 'number') return { t: 'num', v };
  // try number string
  const num = Number(v);
  if (!Number.isNaN(num) && v !== '' && typeof v !== 'boolean') return { t: 'num', v: num };
  // try date
  const d = new Date(v);
  if (!isNaN(d.getTime())) return { t: 'date', v: d.getTime() };
  // fallback string
  return { t: 'str', v: String(v).toLowerCase() };
}

export default function SortableTable({
  columns,             // array of keys/labels; e.g. ['Name','Age','Joined']
  data,                // array of objects
  selectedColumns,     // array of keys to show; e.g. ['Name','Age']
  headerHeight = 44,
  bodyHeight = 360,
}) {
  const [sortState, setSortState] = useState({}); // { [col]: 'asc'|'desc' }

  // decide which columns to render
  const visibleColumns = useMemo(() => {
    if (Array.isArray(selectedColumns) && selectedColumns.length > 0) {
      // keep original order from `columns`, but filter to selected
      const set = new Set(selectedColumns);
      return columns.filter(c => set.has(c));
    }
    return columns;
  }, [columns, selectedColumns]);

  const handleSort = (col) => {
    const current = sortState[col];
    const next = current === 'asc' ? 'desc' : 'asc';
    setSortState({ [col]: next }); // single-column sort; change to keep multi if you prefer
  };

  const sortedData = useMemo(() => {
    if (!visibleColumns.length) return data;
    const [col] = Object.keys(sortState);
    if (!col) return data;

    const direction = sortState[col] === 'asc' ? 1 : -1;
    return [...data].sort((a, b) => {
      const A = coerceForSort(a[col]);
      const B = coerceForSort(b[col]);

      // nulls last
      if (A.t === 'null' && B.t !== 'null') return 1;
      if (B.t === 'null' && A.t !== 'null') return -1;

      // if types differ, order by type name just to make sort stable
      if (A.t !== B.t) return A.t < B.t ? -1 * direction : 1 * direction;

      if (A.v < B.v) return -1 * direction;
      if (A.v > B.v) return 1 * direction;
      return 0;
    });
  }, [data, visibleColumns, sortState]);

  const [sortedCol, sortedDir] = (() => {
    const k = Object.keys(sortState)[0];
    return [k, k ? sortState[k] : null];
  })();

  return (
    <ScrollView horizontal style={styles.container}>
      <View>
        <View style={[styles.headerRow, { height: headerHeight }]}>
          {visibleColumns.map((col) => {
            const isActive = sortedCol === col;
            return (
              <TouchableOpacity key={col} style={styles.headerCell} onPress={() => handleSort(col)}>
                <Text style={[styles.headerText, isActive && styles.headerTextActive]}>
                  {col}
                </Text>
                {isActive && (
                  <View style={{ marginLeft: 6 }}>
                    <SvgXml xml={sortedDir === 'asc' ? upSvg : downSvg} width={12} height={12} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView style={{ maxHeight: bodyHeight }}>
          {sortedData.map((row, idx) => (
            <View key={idx} style={[styles.row, idx % 2 ? styles.rowAlt : null]}>
              {visibleColumns.map((col) => (
                <View key={col} style={styles.cell}>
                  <Text style={styles.cellText}>
                    {row[col] ?? ''}
                  </Text>
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
  container: { marginTop: 10 },
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
    minWidth: 120,
  },
  headerText: { fontWeight: '600', marginRight: 6, fontSize: 14 },
  headerTextActive: { textDecorationLine: 'underline' },
  row: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  rowAlt: { backgroundColor: '#fafafa' },
  cell: { minWidth: 120, paddingHorizontal: 12, paddingVertical: 8 },
  cellText: { fontSize: 14, color: '#1D1D1D' },
});
