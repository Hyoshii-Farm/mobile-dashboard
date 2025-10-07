import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SvgXml } from 'react-native-svg';

const upSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 2l3 3H2l3-3z" fill="#1C1B1F"/></svg>`;
const downSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 8L2 5h6L5 8z" fill="#1C1B1F"/></svg>`;

const API_URL = process.env.EXPO_PUBLIC_API_BASE + '/hpt/ipm';

const columnMap = {
  'No.': null,
  'Tanggal & Waktu': 'datetime',
  'Lokasi': 'location',
  'Hama': 'pesticide',
  'Dosis': 'dosage',
  'Satuan': 'unit',
  'Perawatan': 'treatment',
  'Bahan Aktif': 'pest',
  'Penggunaan': 'usage',
  'Mulai': 'start',
  'Selesai': 'end',
  'Durasi': 'duration',
  'Penanggung Jawab': 'pic',
  'Tenaga Kerja': 'manpower',
  'Suhu': 'temperature',
  'Gambar': 'sensor_pic',
  'Deskripsi': 'description',
};

function coerceForSort(v) {
  if (v === null || v === undefined) return { t: 'null', v: null };
  if (typeof v === 'number') return { t: 'number', v };
  if (!isNaN(Number(v))) return { t: 'number', v: Number(v) };
  return { t: 'string', v: String(v).toLowerCase() };
}

function truncateText(text, maxLen = 30) {
  if (!text || typeof text !== 'string') return '';
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
}

const SortableTable = ({ selectedColumns }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortKey, setSortKey] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(API_URL);
        const json = await res.json();

        const data =
          json?.data || json?.items || json?.results || json?.rows || json?.content || [];

        if (!Array.isArray(data)) throw new Error('Unexpected API structure');

        setRows(data);
      } catch (e) {
        setError(e.message || 'Failed to fetch');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const visibleColumns = useMemo(() => {
    const base = selectedColumns || Object.keys(rows?.[0] || {});
    return base.includes('No.') ? base : ['No.', ...base];
  }, [rows, selectedColumns]);

  const sortedRows = useMemo(() => {
    if (!sortKey || sortKey === 'No.') return rows;
    const field = columnMap[sortKey];
    return [...rows].sort((a, b) => {
      const av = coerceForSort(a?.[field]);
      const bv = coerceForSort(b?.[field]);
      if (av.t !== bv.t) return 0;
      if (av.v < bv.v) return sortOrder === 'asc' ? -1 : 1;
      if (av.v > bv.v) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rows, sortKey, sortOrder]);

  const toggleSort = (col) => {
    if (col === 'No.') return;
    setSortKey((prev) => (prev === col ? col : col));
    setSortOrder((prev) => (sortKey === col ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'));
  };

  if (loading) {
    return (
      <View style={styles.noDataRow}>
        <ActivityIndicator size="small" color="#1D4949" />
        <Text style={styles.noDataText}>Loading data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.noDataRow}>
        <Text style={styles.noDataText}>❌ {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View style={{ minWidth: visibleColumns.length * 130 }}>
        <View style={styles.headerRow}>
          {visibleColumns.map((col) => (
            <TouchableOpacity
              key={col}
              style={styles.headerCell}
              onPress={() => toggleSort(col)}
              disabled={col === 'No.'}
            >
              <Text style={styles.headerText}>{col}</Text>
              {sortKey === col && (
                <SvgXml xml={sortOrder === 'asc' ? upSvg : downSvg} width={10} height={10} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {Array.isArray(sortedRows) && sortedRows.length > 0 ? (
          sortedRows.map((row, idx) => (
            <View key={idx} style={[styles.row, idx % 2 ? styles.rowAlt : null]}>
              {visibleColumns.map((col, colIdx) => {
                if (col === 'No.') {
                  return (
                    <View key={colIdx} style={styles.cell}>
                      <Text style={styles.cellText}>{idx + 1}</Text>
                    </View>
                  );
                }

                const key = columnMap[col];
                const value = row?.[key];

                return (
                  <View key={colIdx} style={styles.cell}>
                    {key === 'sensor_pic' && typeof value === 'string' ? (
                      <Image
                        source={{ uri: value }}
                        style={{ width: 40, height: 40, borderRadius: 6 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.cellText}>
                        {typeof value === 'object'
                          ? JSON.stringify(value)
                          : truncateText(String(value ?? ''))}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          ))
        ) : (
          <View style={styles.noDataRow}>
            <Text style={styles.noDataText}>No data available</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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
    minWidth: 130,
  },
  headerText: {
    fontWeight: 'bold',
    marginRight: 4,
    fontSize: 14,
    color: '#1D4949',
  },
  row: {
    flexDirection: 'row',
    backgroundColor: '#fff',
  },
  rowAlt: {
    backgroundColor: '#f9f9f9',
  },
  cell: {
    padding: 10,
    minWidth: 130,
    flexShrink: 0,
  },
  cellText: {
    fontSize: 13,
    color: '#333',
  },
  noDataRow: {
    padding: 20,
    alignItems: 'center',
  },
  noDataText: {
    color: '#888',
    fontStyle: 'italic',
    marginTop: 6,
    fontSize: 13,
  },
});

export default SortableTable;
