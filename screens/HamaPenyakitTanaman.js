import React, { useEffect, useState, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, Text, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SvgXml } from 'react-native-svg';
import { useKindeAuth } from '@kinde/expo';

import StatusBarCustom from '../components/statusbar';
import Header from '../components/Header';
import AddNewButton from '../components/AddNewButton';

/**
 * Custom HPT Data View Component - Matches design exactly
 * Shows tabular data with dates, locations, and pest scores in expandable format
 */
function HPTDataView({ authHeaders }) {
  const [hptData, setHptData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [editModal, setEditModal] = useState({ visible: false, detail: null, pestName: '', locationName: '', dateEntry: null, value: '' });
  const [pestNames, setPestNames] = useState([]);

  const fetchHPTData = useCallback(async (page = 1, pageSize = 10) => {
    if (!authHeaders) return;

    setLoading(true);
    setError(null);

    try {
      const url = `${API_BASE}/hpt?page=${page}&pageSize=${pageSize}`;
      const response = await fetch(url, { headers: authHeaders });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      setHptData(result.data || []);
      setPagination(result.pagination || { page: 1, pageSize: 10, total: 0, totalPages: 1 });
    } catch (err) {
      console.error('[HPTDataView] Error fetching HPT data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  const fetchPestNames = useCallback(async () => {
    if (!authHeaders) return;

    try {
      const url = `${API_BASE}/hama?ops=true&pest=true`;
      const response = await fetch(url, { headers: authHeaders });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      const toLabel = (x) => {
        if (!x) return null;
        if (typeof x === 'string') return x;
        return x?.name ?? x?.pest_name ?? x?.label ?? x?.title ?? (x?.id ? String(x.id) : null);
      };

      let items = [];
      if (Array.isArray(result)) {
        items = result;
      } else if (Array.isArray(result?.data)) {
        items = result.data;
      } else if (Array.isArray(result?.items)) {
        items = result.items;
      } else if (Array.isArray(result?.results)) {
        items = result.results;
      }

      const names = Array.from(new Set(items.map(toLabel).filter(Boolean))).sort((a, b) => a.localeCompare(b));
      setPestNames(names.length > 0 ? names : []);
    } catch (err) {
      console.error('[HPTDataView] Error fetching pest names:', err);
      setPestNames([]);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (authHeaders) {
      fetchPestNames();
      fetchHPTData(pagination.page, pagination.pageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authHeaders, pagination.page]);

  const toggleExpanded = (rowKey) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowKey]: !prev[rowKey]
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const handleEdit = (detail, pestName, locationName, dateEntry) => {
    if (!detail.id) {
      Alert.alert('Error', 'Tidak dapat mengedit data tanpa ID');
      return;
    }

    setEditModal({
      visible: true,
      detail,
      pestName,
      locationName,
      dateEntry,
      value: String(detail.plant_count !== undefined ? detail.plant_count : (detail.score || 0)),
    });
  };

  const handleSaveEdit = async () => {
    const { detail, value } = editModal;
    
    if (!value || isNaN(value) || parseInt(value, 10) < 0) {
      Alert.alert('Error', 'Masukkan jumlah yang valid');
      return;
    }

    try {
      const getUrl = `${API_BASE}/hpt/${detail.id}`;
      
      let fullRecord = null;
      try {
        const getResponse = await fetch(getUrl, { headers: authHeaders });
        if (getResponse.ok) {
          fullRecord = await getResponse.json();
        }
      } catch (fetchError) {
        // Continue with partial data if fetch fails
      }

      const requestBody = {
        plant_count: parseInt(value, 10),
        pic: fullRecord?.pic || '',
        location_id: fullRecord?.location_id || 0,
        pest_id: fullRecord?.pest_id || 0,
        variant_id: fullRecord?.variant_id || 0,
        score: fullRecord?.score !== undefined ? fullRecord.score : (detail.score || 0),
        total_plant: fullRecord?.total_plant || 0,
      };
      
      const url = `${API_BASE}/hpt/${detail.id}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || errorText;
        } catch {
          errorMessage = errorText || `HTTP ${response.status}`;
        }
        
        if (response.status === 500) {
          errorMessage = `Server error: ${errorMessage}. Pastikan data yang akan diubah valid dan ID ${detail.id} ada di database.`;
        }
        
        throw new Error(errorMessage);
      }

      Alert.alert('Sukses', 'Data berhasil diperbarui');
      setEditModal({ visible: false, detail: null, pestName: '', locationName: '', dateEntry: null, value: '' });
      fetchHPTData(pagination.page, pagination.pageSize);
    } catch (err) {
      console.error('[HPTDataView] Error updating data:', err);
      Alert.alert('Error', `Gagal memperbarui data: ${err.message}`);
    }
  };

  const handleDelete = (detail, pestName, locationName) => {
    if (!detail.id) {
      Alert.alert('Error', 'Tidak dapat menghapus data tanpa ID');
      return;
    }

    Alert.alert(
      'Hapus Data',
      `Apakah Anda yakin ingin menghapus data ${pestName} - ${locationName}?`,
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              const url = `${API_BASE}/hpt/${detail.id}`;
              const response = await fetch(url, {
                method: 'DELETE',
                headers: authHeaders,
              });

              if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `HTTP ${response.status}`;
                try {
                  const errorJson = JSON.parse(errorText);
                  errorMessage = errorJson.error || errorJson.message || errorText;
                } catch {
                  errorMessage = errorText || `HTTP ${response.status}`;
                }
                
                if (response.status === 500) {
                  errorMessage = `Server error: ${errorMessage}. Pastikan data yang akan dihapus valid dan ID ${detail.id} ada di database.`;
                }
                
                throw new Error(errorMessage);
              }

              setHptData(prevData => {
                return prevData.map(dateEntry => ({
                  ...dateEntry,
                  locations: dateEntry.locations?.map(location => ({
                    ...location,
                    hpt_details: location.hpt_details?.map(pest => ({
                      ...pest,
                      details: pest.details?.filter(d => d.id !== detail.id) || []
                    })) || []
                  })) || []
                }));
              });

              Alert.alert('Sukses', 'Data berhasil dihapus');
              fetchHPTData(pagination.page, pagination.pageSize);
            } catch (err) {
              console.error('[HPTDataView] Error deleting data:', err);
              Alert.alert('Error', `Gagal menghapus data: ${err.message}`);
            }
          },
        },
      ]
    );
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  if (loading) {
    return (
      <View style={hptStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#1D4949" />
        <Text style={hptStyles.loadingText}>Loading HPT data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={hptStyles.errorContainer}>
        <Text style={hptStyles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={hptStyles.retryButton} onPress={fetchHPTData}>
          <Text style={hptStyles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getPestScore = (pests, pestName) => {
    const pest = pests.find(p => {
      const name = p.pest_name;
      return name === pestName || name === `${pestName} Insidensi` || name?.includes(pestName);
    });
    return pest ? pest.total_score : 0;
  };

  const getMainPests = (pests) => {
    if (pestNames.length === 0) {
      return [];
    }

    return pests.filter(p => {
      const name = p.pest_name;
      return pestNames.some(pestName => 
        name === pestName || 
        name === `${pestName} Insidensi` ||
        name?.includes(pestName)
      );
    }).map(p => {
      const displayName = p.pest_name?.endsWith(' Insidensi') 
        ? p.pest_name.replace(' Insidensi', '')
        : p.pest_name;
      
      return {
        ...p,
        displayName: displayName || p.pest_name
      };
    });
  };

  return (
    <>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={hptStyles.horizontalScrollContent}
      >
        <View style={hptStyles.tableContainer}>
          {/* Date Sections */}
          {hptData.map((dateEntry, dateIndex) => {
            const formattedDate = formatDate(dateEntry.datetime);
            const locations = dateEntry.locations || [];
            
            return (
              <View key={dateIndex} style={hptStyles.dateSection}>
                {/* Date Header Row */}
                <View style={hptStyles.dateHeaderRow}>
                  <View style={hptStyles.dateHeaderLeft}>
                    <Text style={hptStyles.dateHeaderText}>{formattedDate}</Text>
                  </View>
                  {pestNames.length > 0 && (
                    <View style={hptStyles.pestHeaderRow}>
                      {pestNames.map((pestName) => (
                        <Text 
                          key={pestName} 
                          style={hptStyles.pestHeaderText}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {pestName}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>

              {/* Location Rows */}
              {locations.map((location, locationIndex) => {
                const rowKey = `${dateIndex}-${locationIndex}`;
                const isExpanded = expandedRows[rowKey];
                const pests = location.hpt_details || [];
                
                return (
                  <View key={rowKey}>
                    <TouchableOpacity 
                      style={hptStyles.locationRow} 
                      onPress={() => toggleExpanded(rowKey)}
                    >
                      <View style={hptStyles.locationLeft}>
                        <View style={hptStyles.expandCell}>
                          <SvgXml 
                            xml={isExpanded ? upArrowSvg : downArrowSvg} 
                            width={12} 
                            height={8} 
                          />
                        </View>
                        <Text style={hptStyles.locationText} numberOfLines={1} ellipsizeMode="tail">
                          {location.location_name}
                        </Text>
                      </View>
                      {pestNames.length > 0 && (
                        <View style={hptStyles.pestScoreRow}>
                          {pestNames.map((pestName, idx) => (
                            <Text 
                              key={pestName}
                              style={[
                                hptStyles.pestScoreText,
                                idx === 0 && hptStyles.aphidsScore
                              ]}
                              numberOfLines={1}
                            >
                              {getPestScore(pests, pestName)}
                            </Text>
                          ))}
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Expanded Section */}
                    {isExpanded && (
                      <View style={hptStyles.expandedSection}>
                        {getMainPests(pests).map((pest) => (
                          <View key={pest.pest_name} style={hptStyles.pestSection}>
                            <Text style={[
                              hptStyles.pestTitle,
                              pestNames.length > 0 && pestNames[0] === pest.displayName && hptStyles.aphidsTitle
                            ]}>
                              {pest.displayName}
                            </Text>
                            
                            {/* Sample Details Table */}
                            {pest.details && pest.details.length > 0 && (
                              <View style={hptStyles.sampleTable}>
                                <View style={hptStyles.sampleHeader}>
                                  <Text style={hptStyles.sampleHeaderText}>Sample No</Text>
                                  <Text style={hptStyles.sampleHeaderText}>Jumlah</Text>
                                  <View style={{ width: 80 }} />
                                </View>
                                
                                {[...pest.details].sort((a, b) => (a.score || 0) - (b.score || 0)).map((detail, index) => {
                                  const skorNumber = detail.score || (index + 1);
                                  
                                  return (
                                    <View key={`detail-${detail.id || `idx-${index}`}`} style={hptStyles.sampleRow}>
                                      <Text style={hptStyles.sampleText}>Skor {skorNumber}</Text>
                                      <Text style={hptStyles.sampleText}>
                                        {detail.plant_count !== undefined ? detail.plant_count : (detail.score || 0)}
                                      </Text>
                                      <View style={hptStyles.actionButtons}>
                                        <TouchableOpacity 
                                          style={hptStyles.editButton}
                                          onPress={() => handleEdit(detail, pest.displayName, location.location_name, dateEntry)}
                                        >
                                          <SvgXml xml={editIconSvg} width={16} height={16} />
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                          style={hptStyles.deleteButton}
                                          onPress={() => handleDelete(detail, pest.displayName, location.location_name)}
                                        >
                                          <SvgXml xml={deleteIconSvg} width={16} height={16} />
                                        </TouchableOpacity>
                                      </View>
                                    </View>
                                  );
                                })}
                              </View>
                            )}
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}
        </View>
      </ScrollView>

      {/* Pagination - Separate from table container */}
      <View style={hptStyles.pagination}>
        <TouchableOpacity 
          style={hptStyles.pageButton}
          onPress={() => handlePageChange(1)}
          disabled={pagination.page === 1}
        >
          <Text style={[
            hptStyles.pageButtonText,
            pagination.page === 1 && hptStyles.pageButtonDisabled
          ]}>
            {"<<"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={hptStyles.pageButton}
          onPress={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page === 1}
        >
          <Text style={[
            hptStyles.pageButtonText,
            pagination.page === 1 && hptStyles.pageButtonDisabled
          ]}>
            {"<"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[hptStyles.pageButton, hptStyles.activePageButton]}>
          <Text style={[hptStyles.pageButtonText, hptStyles.activePageText]}>
            {pagination.page}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={hptStyles.pageButton}
          onPress={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages}
        >
          <Text style={[
            hptStyles.pageButtonText,
            pagination.page >= pagination.totalPages && hptStyles.pageButtonDisabled
          ]}>
            {">"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={hptStyles.pageButton}
          onPress={() => handlePageChange(pagination.totalPages)}
          disabled={pagination.page >= pagination.totalPages}
        >
          <Text style={[
            hptStyles.pageButtonText,
            pagination.page >= pagination.totalPages && hptStyles.pageButtonDisabled
          ]}>
            {">>"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Edit Modal */}
      <Modal
        visible={editModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditModal({ visible: false, detail: null, pestName: '', locationName: '', dateEntry: null, value: '' })}
      >
        <View style={hptStyles.modalOverlay}>
          <View style={hptStyles.modalContent}>
            <Text style={hptStyles.modalTitle}>Edit Jumlah</Text>
            <Text style={hptStyles.modalSubtitle}>
              {editModal.pestName} - {editModal.locationName}
            </Text>
            <TextInput
              style={hptStyles.modalInput}
              value={editModal.value}
              onChangeText={(text) => setEditModal(prev => ({ ...prev, value: text.replace(/[^0-9]/g, '') }))}
              keyboardType="number-pad"
              autoFocus
            />
            <View style={hptStyles.modalButtons}>
              <TouchableOpacity
                style={[hptStyles.modalButton, hptStyles.modalButtonCancel]}
                onPress={() => setEditModal({ visible: false, detail: null, pestName: '', locationName: '', dateEntry: null, value: '' })}
              >
                <Text style={hptStyles.modalButtonTextCancel}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[hptStyles.modalButton, hptStyles.modalButtonSave]}
                onPress={handleSaveEdit}
              >
                <Text style={hptStyles.modalButtonTextSave}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const hptStyles = StyleSheet.create({
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#1D4949',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#FBF7EB',
    fontWeight: '600',
  },
  // Horizontal scroll container
  horizontalScrollContent: {
    paddingBottom: 8,
  },
  // Main table container - white card with reddish-brown border
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8B5A3C', // Reddish-brown border
    overflow: 'hidden',
    marginTop: 16,
    minWidth: '100%',
  },
  // Date section
  dateSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  // Date header row
  dateHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    minWidth: 600, // Minimum width to ensure horizontal scroll
  },
  dateHeaderLeft: {
    minWidth: 150,
    marginRight: 16,
  },
  dateHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1D4949', // Dark green
  },
  pestHeaderRow: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
  },
  pestHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    minWidth: 50,
    color: '#8B5A3C', // Reddish-brown for all pest headers
  },
  // Location row
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
    minWidth: 600, // Minimum width to ensure horizontal scroll
  },
  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 150,
    marginRight: 16,
  },
  expandCell: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#1D4949', // Dark green
    flex: 1,
  },
  pestScoreRow: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
    flexShrink: 0,
  },
  pestScoreText: {
    fontSize: 14,
    color: '#1D4949', // Dark green
    textAlign: 'center',
    minWidth: 50,
    fontWeight: '500',
  },
  aphidsScore: {
    color: '#8B5A3C', // Reddish-brown for Aphids score
  },
  // Expanded section
  expandedSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pestSection: {
    marginBottom: 16,
  },
  pestTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1D4949', // Dark green (default)
    marginBottom: 8,
  },
  aphidsTitle: {
    color: '#8B5A3C', // Reddish-brown for Aphids title
  },
  // Sample table
  sampleTable: {
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 8,
  },
  sampleHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sampleHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1D4949', // Dark green
    flex: 1,
    textAlign: 'center',
  },
  sampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  sampleText: {
    fontSize: 12,
    color: '#1D4949', // Dark green
    flex: 1,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    width: 80,
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#f0fdf4',
  },
  deleteButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#fef2f2',
  },
  // Pagination - Separate from table container
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingTop: 20,
    backgroundColor: 'transparent',
    gap: 8,
    marginTop: 16,
  },
  pageButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    minWidth: 32,
    alignItems: 'center',
  },
  activePageButton: {
    backgroundColor: '#1D4949',
    borderColor: '#1D4949',
  },
  pageButtonText: {
    fontSize: 12,
    color: '#1D4949', // Dark green
    fontWeight: '500',
  },
  pageButtonDisabled: {
    color: '#9ca3af',
    opacity: 0.5,
  },
  activePageText: {
    color: '#fff',
  },
  // Edit Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D4949',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f3f4f6',
  },
  modalButtonSave: {
    backgroundColor: '#1D4949',
  },
  modalButtonTextCancel: {
    color: '#374151',
    fontWeight: '600',
  },
  modalButtonTextSave: {
    color: '#fff',
    fontWeight: '600',
  },
});

// Configuration constants
const API_BASE = process.env.EXPO_PUBLIC_API_BASE;

// SVG Icons
const SVG_ICONS = {
  backArrow: `<svg xmlns="http://www.w3.org/2000/svg" width="19" height="30" viewBox="0 0 19 30" fill="none"><path d="M15.4537 30L0.859123 15L15.4537 0L18.8591 3.5L7.66993 15L18.8591 26.5L15.4537 30Z" fill="#FBF7EB"/></svg>`,
};

// Arrow SVGs for expandable rows - dark green to match design
const downArrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M11.6087 1.5738L6.14086 7.04163L0.673035 1.5738L1.94886 0.297978L6.14086 4.48998L10.3329 0.297978L11.6087 1.5738Z" fill="#1D4949"/></svg>`;
const upArrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M0.391304 6.46782L5.85914 0.999992L11.327 6.46782L10.0511 7.74364L5.85914 3.55164L1.66713 7.74364L0.391304 6.46782Z" fill="#1D4949"/></svg>`;

// Edit and delete icons for actions - green for edit, red for delete
const editIconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 3C17.2626 2.73735 17.5744 2.52901 17.9176 2.38687C18.2608 2.24473 18.628 2.17157 19 2.17157C19.372 2.17157 19.7392 2.24473 20.0824 2.38687C20.4256 2.52901 20.7374 2.73735 21 3C21.2626 3.26265 21.471 3.57444 21.6131 3.9176C21.7553 4.26077 21.8284 4.62799 21.8284 5C21.8284 5.37201 21.7553 5.73923 21.6131 6.08239C21.471 6.42556 21.2626 6.73735 21 7L7.5 20.5L2 22L3.5 16.5L17 3Z" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const deleteIconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6H5H21" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/**
 * HamaPenyakitTanaman Page Component
 * 
 * Main page for viewing and managing pest and disease monitoring records.
 * Provides filtering, data visualization, and navigation to form entry.
 * 
 * @returns {JSX.Element} The pest and disease monitoring page
 */
export default function HamaPenyakitTanamanPage() {
  const navigation = useNavigation();
  const { getAccessToken, isAuthenticated, login } = useKindeAuth();

  const getAuthHeaders = useCallback(async () => {
    if (!isAuthenticated) {
      await login().catch((error) => {
        console.error('[HamaPenyakitTanaman] Login failed:', error);
      });
    }
    
    try {
      const audience = process.env.EXPO_PUBLIC_KINDE_AUDIENCE;
      const token = await getAccessToken(audience);
      
      return {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };
    } catch (error) {
      console.error('[HamaPenyakitTanaman] Failed to get access token:', error);
      throw error;
    }
  }, [getAccessToken, isAuthenticated, login]);

  const [authHeaders, setAuthHeaders] = useState(null);

  /**
   * Initialize authentication headers
   */
  const initializeAuth = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      setAuthHeaders(headers);
    } catch (error) {
      console.error('[HamaPenyakitTanaman] Failed to get auth headers:', error);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    initializeAuth();
  }, []); // Empty dependency array - only run once on mount

  return (
    <View style={styles.container}>
        <StatusBarCustom backgroundColor="#1D4949" />
        <Header
          title="Monitoring Hama Penyakit"
          logoSvg={SVG_ICONS.backArrow}
          onLeftPress={() => navigation.navigate('Home')}
          showHomeButton={false}
        />

        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>HAMA PENYAKIT TANAMAN</Text>
          
          <AddNewButton onPress={() => navigation.navigate('FormHamaPenyakit')} />

          <HPTDataView authHeaders={authHeaders} />
        </ScrollView>
      </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFF9F2' 
  },
  scrollContainer: { 
    padding: 20, 
    paddingBottom: 40 
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1D4949',
    textAlign: 'center',
    marginBottom: 16,
  },
});
