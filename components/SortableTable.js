import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SvgXml } from 'react-native-svg';

// SVG Icons
const SVG_ICONS = {
  sortUp: `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 2l3 3H2l3-3z" fill="#1C1B1F"/></svg>`,
  sortDown: `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 8L2 5h6L5 8z" fill="#1C1B1F"/></svg>`,
  delete: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,6 5,6 21,6"></polyline><path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`,
};

const API_URL = process.env.EXPO_PUBLIC_API_BASE + '/hpt/ipm';

const columnMap = {
  'No.': null,
  'Tanggal & Waktu': 'datetime',
  'Lokasi': 'location', // API returns 'location' field
  'Hama': 'pest', // API returns 'pest' field  
  'Pestisida': 'pesticide', // API returns 'pesticide' field
  'Dosis': 'dosage',
  'Satuan': 'unit',
  'Perawatan': 'treatment',
  'Penggunaan': 'usage',
  'Mulai': 'start',
  'Selesai': 'end',
  'Durasi': 'duration',
  'Penanggung Jawab': 'pic',
  'Tenaga Kerja': 'manpower',
  'Suhu': 'temperature',
  'Gambar': 'picture', // Fixed: should be picture, not sensor_pic
  'Deskripsi': 'description',
  'Actions': null, // Special column for delete button
};

/**
 * Converts a value to a sortable format with type information
 * @param {any} v - Value to convert
 * @returns {Object} Object with type and value properties
 */
function coerceForSort(v) {
  if (v === null || v === undefined) return { t: 'null', v: null };
  if (typeof v === 'number') return { t: 'number', v };
  if (!isNaN(Number(v))) return { t: 'number', v: Number(v) };
  return { t: 'string', v: String(v).toLowerCase() };
}

/**
 * Truncates text to a maximum length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLen - Maximum length (default: 30)
 * @returns {string} Truncated text
 */
function truncateText(text, maxLen = 30) {
  if (!text || typeof text !== 'string') return '';
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
}

/**
 * SortableTable Component
 * 
 * A reusable table component that displays pesticide usage data with sorting,
 * authentication, and delete functionality.
 * 
 * @param {Object} props - Component props
 * @param {Array<string>} props.selectedColumns - Array of column names to display
 * @param {Object|null} props.authHeaders - Authentication headers for API requests
 * @returns {JSX.Element} The rendered table component
 */
const SortableTable = ({ selectedColumns, authHeaders = null }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortKey, setSortKey] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      // Don't fetch if we don't have auth headers yet
      if (!authHeaders) {
        return;
      }
      
      try {
        setLoading(true);
        const fetchOptions = authHeaders ? { headers: authHeaders } : {};
        const res = await fetch(API_URL, fetchOptions);
        
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const responseText = await res.text();
        let json;
        
        try {
          json = JSON.parse(responseText);
        } catch (parseError) {
          throw new Error('Response is not valid JSON: ' + parseError.message);
        }

        // Extract data from common API response patterns
        let data = [];
        if (Array.isArray(json)) {
          data = json;
        } else if (json?.data && Array.isArray(json.data)) {
          data = json.data;
        } else if (json?.items && Array.isArray(json.items)) {
          data = json.items;
        } else if (json?.results && Array.isArray(json.results)) {
          data = json.results;
        }

        if (!Array.isArray(data)) {
          throw new Error('Unexpected API structure - data is not an array');
        }

        setRows(data);
      } catch (e) {
        console.error('SortableTable fetch error:', e);
        setError(e.message || 'Failed to fetch');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authHeaders]);

  /**
   * Handles deletion of a record with confirmation
   * @param {string|number} recordId - The ID of the record to delete
   * @param {number} index - The index of the record in the current rows array
   */
  const deleteRecord = async (recordId, index) => {
    if (!authHeaders) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    Alert.alert(
      'Delete Record',
      'Are you sure you want to delete this pesticide usage record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(index);
              
              const deleteUrl = `${API_URL}/${recordId}`;
              const deleteOptions = {
                method: 'DELETE',
                headers: authHeaders,
              };
              
              const response = await fetch(deleteUrl, deleteOptions);

              if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to delete: ${response.status} ${errorText}`);
              }

              // Remove the record from local state
              setRows(prev => prev.filter((_, idx) => idx !== index));
              Alert.alert('Success', 'Record deleted successfully');
              
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Delete Failed', error.message || 'Failed to delete record');
            } finally {
              setDeleting(null);
            }
          }
        }
      ]
    );
  };

  const visibleColumns = useMemo(() => {
    const base = selectedColumns || Object.keys(rows?.[0] || {});
    const withNo = base.includes('No.') ? base : ['No.', ...base];
    // Always add Actions column at the end if not already included
    return withNo.includes('Actions') ? withNo : [...withNo, 'Actions'];
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
    if (col === 'No.' || col === 'Actions') return;
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
              disabled={col === 'No.' || col === 'Actions'}
            >
              <Text style={styles.headerText}>{col}</Text>
              {sortKey === col && (
                <SvgXml xml={sortOrder === 'asc' ? SVG_ICONS.sortUp : SVG_ICONS.sortDown} width={10} height={10} />
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

                if (col === 'Actions') {
                  return (
                    <View key={colIdx} style={styles.cell}>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => deleteRecord(row?.id, idx)}
                        disabled={deleting === idx}
                      >
                        {deleting === idx ? (
                          <ActivityIndicator size="small" color="#dc2626" />
                        ) : (
                          <SvgXml xml={SVG_ICONS.delete} width={16} height={16} />
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                }

                const key = columnMap[col];
                const value = row?.[key];

                return (
                  <View key={colIdx} style={styles.cell}>
                    {key === 'picture' && typeof value === 'string' && value ? (
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
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateContent}>
              <Text style={styles.emptyStateTitle}>Belum Ada Data</Text>
              <Text style={styles.emptyStateMessage}>
                Belum ada data penggunaan pestisida yang tersedia.{'\n'}
                Silakan tambahkan data baru terlebih dahulu.
              </Text>
            </View>
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
