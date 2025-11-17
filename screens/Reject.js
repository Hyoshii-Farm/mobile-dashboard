import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { SvgXml } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Constants from 'expo-constants';
import { useKindeAuth } from '@kinde/expo';
import StatusBarCustom from '../components/statusbar';
import Header from '../components/Header';

const COLORS = {
  cream: '#F0E6CB',
  green: '#1D4949',
  white: '#FFFFFF',
  brown: '#7A2929',
  brickRed: '#D3A3A3',
  gray: '#EAEAEA',
  darkGray: '#4A4A4A',
};

const API_BASE = process.env.EXPO_PUBLIC_API_BASE;

const backArrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="19" height="30" viewBox="0 0 19 30" fill="none"><path d="M15.4537 30L0.859123 15L15.4537 0L18.8591 3.5L7.66993 15L18.8591 26.5L15.4537 30Z" fill="#FBF7EB"/></svg>`;

const downArrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M11.6087 1.5738L6.14086 7.04163L0.673035 1.5738L1.94886 0.297978L6.14086 4.48998L10.3329 0.297978L11.6087 1.5738Z" fill="black"/></svg>`;
const upArrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M0.391304 6.46782L5.85914 0.999992L11.327 6.46782L10.0511 7.74364L5.85914 3.55164L1.66713 7.74364L0.391304 6.46782Z" fill="black"/></svg>`;
const editIconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 3C17.2626 2.73735 17.5744 2.52901 17.9176 2.38687C18.2608 2.24473 18.628 2.17157 19 2.17157C19.372 2.17157 19.7392 2.24473 20.0824 2.38687C20.4256 2.52901 20.7374 2.73735 21 3C21.2626 3.26265 21.471 3.57444 21.6131 3.9176C21.7553 4.26077 21.8284 4.62799 21.8284 5C21.8284 5.37201 21.7553 5.73923 21.6131 6.08239C21.471 6.42556 21.2626 6.73735 21 7L7.5 20.5L2 22L3.5 16.5L17 3Z" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const deleteIconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6H5H21" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const LOCATION_TO_ID = {
  'Green House 1': 1,
  'Green House 2': 2,
  'Green House 3': 3,
  'Green House 4': 4,
  'Packing Area': 5,
  Warehouse: 6,
};
const ID_TO_LOCATION = Object.fromEntries(Object.entries(LOCATION_TO_ID).map(([k, v]) => [String(v), k]));

const REASON_TO_ID = {
  ulat: 1,
  siput: 2,
};
const ID_TO_REASON = Object.fromEntries(Object.entries(REASON_TO_ID).map(([k, v]) => [String(v), k]));

/**
 * Safe JSON parse helper
 */
const safeParseJson = (text) => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
};

export default function RejectPage() {
  const navigation = useNavigation();
  const { getAccessToken } = useKindeAuth();
  const [authHeaders, setAuthHeaders] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const audience = Constants?.expoConfig?.extra?.KINDE_AUDIENCE || process.env.EXPO_PUBLIC_KINDE_AUDIENCE;
        if (audience) {
          const token = await getAccessToken(audience);
          if (token) {
            setAuthHeaders({
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            });
          }
        }
      } catch (e) {
        // Silent fail - auth headers will remain null
      }
    };
    initAuth();
  }, [getAccessToken]);

  const handleEdit = (id) => {
    setEditingId(id);
  };

  const handleDelete = async (id) => {
    if (!id) return;
    Alert.alert('Hapus', 'Yakin ingin menghapus entri ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          if (!API_BASE || !authHeaders) {
            Alert.alert('Error', 'Gagal menghubung ke server.');
            return;
          }
          try {
            const url = `${API_BASE}/ops/reject/${encodeURIComponent(id)}`;
            const res = await fetch(url, { method: 'DELETE', headers: authHeaders });
            const text = await res.text().catch(() => '');
            if (!res.ok) throw new Error(`DELETE failed ${res.status}: ${text}`);
            Alert.alert('Sukses', 'Data berhasil dihapus.');
            setRefreshKey(prev => prev + 1);
          } catch (e) {
            console.error('handleDelete error', e);
            Alert.alert('Error', 'Gagal menghubung ke server.');
          }
        },
      },
    ]);
  };

  const handleSaved = () => {
    setEditingId(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleDeleted = () => {
    setEditingId(null);
    setRefreshKey(prev => prev + 1);
  };
  
  return (
    <View style={{ flex: 1 }}>
      <StatusBarCustom backgroundColor="#1D4949" />
      <Header
        title="REJECT BUDIDAYA"
        logoSvg={backArrowSvg}
        onLeftPress={() => navigation.goBack()}
      />
      <View style={{ flex: 1, backgroundColor: COLORS.cream }}>
        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <TambahForm 
            editingId={editingId} 
            onSaved={handleSaved}
            onDeleted={handleDeleted}
          />
          <RejectDataView 
            key={refreshKey}
            authHeaders={authHeaders} 
            onEdit={handleEdit} 
            onDelete={handleDelete}
            refreshTrigger={refreshKey}
          />
        </ScrollView>
      </View>
    </View>
  );
}

function RejectDataView({ authHeaders, onEdit, onDelete, refreshTrigger }) {
  const [rejectData, setRejectData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [locations, setLocations] = useState([]);
  const [hamaOptions, setHamaOptions] = useState([]);

  const fetchRejectData = useCallback(async (page = 1, pageSize = 10) => {
    if (!authHeaders || !API_BASE) return;

    setLoading(true);
    setError(null);

    try {
      const url = `${API_BASE}/ops/reject?page=${page}&pageSize=${pageSize}&sortBy=Datetime:desc`;
      const response = await fetch(url, { headers: authHeaders });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      let data = [];
      if (Array.isArray(result)) {
        data = result;
      } else if (Array.isArray(result?.data)) {
        data = result.data;
      } else if (Array.isArray(result?.items)) {
        data = result.items;
      } else if (Array.isArray(result?.results)) {
        data = result.results;
      }
      
      const groupedArray = data.map(item => ({
        id: item.id || null,
        date: item.datetime || 'Unknown',
        datetime: item.datetime || '',
        items: item.locations || []
      }));

      setRejectData(groupedArray);
      setPagination(result.pagination || result.meta || { page, pageSize, total: data.length, totalPages: 1 });
    } catch (err) {
      console.error('[RejectDataView] Error fetching reject data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  const fetchLocations = useCallback(async () => {
    if (!authHeaders || !API_BASE) return;
    try {
      const url = `${API_BASE}/location`;
      const res = await fetch(url, { headers: authHeaders });
      if (!res.ok) return;
      const data = await res.json();
      const locationList = Array.isArray(data) ? data : (data?.data || []);
      setLocations(locationList);
    } catch (e) {
      console.error('fetchLocations error', e);
    }
  }, [authHeaders]);

  const fetchHamaOptions = useCallback(async () => {
    if (!authHeaders || !API_BASE) return;
    try {
      const url = `${API_BASE}/hama`;
      const res = await fetch(url, { headers: authHeaders });
      if (!res.ok) return;
      const data = await res.json();
      const hamaList = Array.isArray(data) ? data : (data?.data || []);
      setHamaOptions(hamaList);
    } catch (e) {
      console.error('fetchHamaOptions error', e);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (authHeaders) {
      fetchLocations();
      fetchHamaOptions();
      fetchRejectData(pagination.page, pagination.pageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authHeaders, pagination.page, refreshTrigger]);

  const toggleExpanded = (rowKey) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowKey]: !prev[rowKey]
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    // Parse ISO date format like "2025-09-19"
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getLocationName = (locationId) => {
    const location = locations.find(loc => loc.id === locationId);
    return location ? location.name : `Location ${locationId}`;
  };

  const getReasonName = (reasonId) => {
    if (!reasonId) return null;
    const hama = hamaOptions.find(h => h.id === reasonId);
    return hama ? hama.name : null;
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  if (!authHeaders) {
    return (
      <View style={rejectStyles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.green} />
        <Text style={rejectStyles.loadingText}>Memuat...</Text>
      </View>
    );
  }

  if (loading && rejectData.length === 0) {
    return (
      <View style={rejectStyles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.green} />
        <Text style={rejectStyles.loadingText}>Memuat data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={rejectStyles.errorContainer}>
        <Text style={rejectStyles.errorText}>Gagal mendapatkan data: {error}</Text>
        <TouchableOpacity style={rejectStyles.retryButton} onPress={() => fetchRejectData(pagination.page, pagination.pageSize)}>
          <Text style={rejectStyles.retryText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (rejectData.length === 0 && !loading) {
    return (
      <View style={rejectStyles.emptyContainer}>
        <Text style={rejectStyles.emptyText}>Tidak ada data reject</Text>
      </View>
    );
  }

  return (
    <View>
      <View style={rejectStyles.tableContainer}>
        {rejectData.map((dateGroup, dateIndex) => {
            const formattedDate = formatDate(dateGroup.datetime);
            const locationList = (dateGroup.items || []).map(location => {
              const reasons = location.reasons || [];
              
              const mappedDetails = reasons.map(r => ({
                id: r.id || null,
                reject_id: dateGroup.id || r.id || null,
                reason_id: r.reason_id || null,
                reason: r.reason_name || r.reason || null,
                quantity: Number(r.quantity) || 0
              }));
              
              return {
                location_id: location.location_id || null,
                location_name: location.location_name || 'Unknown Location',
                details: mappedDetails,
                totalQuantity: Number(location.quantity) || 0
              };
            });

            return (
              <View key={dateIndex} style={rejectStyles.dateSection}>
                <View style={rejectStyles.dateHeaderContainer}>
                  <Text style={rejectStyles.dateHeader}>{formattedDate}</Text>
                </View>
                
                <View style={rejectStyles.tableHeader}>
                  <Text style={rejectStyles.headerText}>Lokasi</Text>
                  <Text style={rejectStyles.headerText}>Kuantitas</Text>
                </View>

                {locationList.map((location, locIndex) => {
                  const rowKey = `${dateIndex}-${locIndex}`;
                  const isExpanded = expandedRows[rowKey];

                  return (
                    <View key={rowKey}>
                      <TouchableOpacity 
                        style={rejectStyles.locationRow} 
                        onPress={() => toggleExpanded(rowKey)}
                      >
                        <View style={rejectStyles.locationLeft}>
                          <SvgXml 
                            xml={isExpanded ? upArrowSvg : downArrowSvg} 
                            width={12} 
                            height={8} 
                          />
                          <Text style={rejectStyles.locationText}>{location.location_name}</Text>
                        </View>
                        <Text style={rejectStyles.quantityText}>{location.totalQuantity} gr</Text>
                      </TouchableOpacity>

                      {isExpanded && location.details.length > 0 && (
                        <View style={rejectStyles.expandedSection}>
                          <View style={rejectStyles.detailsHeader}>
                            <Text style={rejectStyles.detailsHeaderText}>Alasan</Text>
                            <Text style={rejectStyles.detailsHeaderText}>Kuantitas</Text>
                            <Text style={rejectStyles.detailsHeaderText}>Menu</Text>
                          </View>
                          {location.details.map((detail, detailIndex) => (
                            <View key={detail.id || detailIndex} style={rejectStyles.detailRow}>
                              <Text style={rejectStyles.detailText}>
                                {(detail.reason && detail.reason !== 'null') 
                                  ? detail.reason 
                                  : (getReasonName(detail.reason_id) || 'Unknown')}
                              </Text>
                              <Text style={rejectStyles.detailText}>{detail.quantity || 0} gr</Text>
                              <View style={rejectStyles.actionButtons}>
                                <TouchableOpacity 
                                  style={rejectStyles.actionButton}
                                  onPress={() => {
                                    const recordId = detail.reject_id || dateGroup.id || detail.id;
                                    if (onEdit && recordId) {
                                      onEdit(recordId);
                                    }
                                  }}
                                >
                                  <SvgXml xml={editIconSvg} width={16} height={16} />
                                </TouchableOpacity>
                                <TouchableOpacity 
                                  style={rejectStyles.actionButton}
                                  onPress={() => {
                                    const recordId = detail.reject_id || dateGroup.id || detail.id;
                                    if (onDelete && recordId) {
                                      onDelete(recordId);
                                    }
                                  }}
                                >
                                  <SvgXml xml={deleteIconSvg} width={16} height={16} />
                                </TouchableOpacity>
                              </View>
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
      <RejectPagination pagination={pagination} onPageChange={handlePageChange} />
    </View>
  );
}

function RejectPagination({ pagination, onPageChange }) {
  if (pagination.totalPages <= 1) return null;

  return (
    <View style={rejectStyles.pagination}>
      <TouchableOpacity 
        style={rejectStyles.pageButton}
        onPress={() => onPageChange(1)}
        disabled={pagination.page === 1}
      >
        <Text style={[rejectStyles.pageButtonText, pagination.page === 1 && rejectStyles.pageButtonDisabled]}>
          {"<<"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={rejectStyles.pageButton}
        onPress={() => onPageChange(pagination.page - 1)}
        disabled={pagination.page === 1}
      >
        <Text style={[rejectStyles.pageButtonText, pagination.page === 1 && rejectStyles.pageButtonDisabled]}>
          {"<"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={[rejectStyles.pageButton, rejectStyles.activePageButton]}>
        <Text style={[rejectStyles.pageButtonText, rejectStyles.activePageText]}>
          {pagination.page}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={rejectStyles.pageButton}
        onPress={() => onPageChange(pagination.page + 1)}
        disabled={pagination.page >= pagination.totalPages}
      >
        <Text style={[rejectStyles.pageButtonText, pagination.page >= pagination.totalPages && rejectStyles.pageButtonDisabled]}>
          {">"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={rejectStyles.pageButton}
        onPress={() => onPageChange(pagination.totalPages)}
        disabled={pagination.page >= pagination.totalPages}
      >
        <Text style={[rejectStyles.pageButtonText, pagination.page >= pagination.totalPages && rejectStyles.pageButtonDisabled]}>
          {">>"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function TambahForm({ editingId = null, onSaved = () => {}, onDeleted = () => {} }) {
  const [showForm, setShowForm] = useState(false);
  const formAnimation = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(false);
  const [totalReject, setTotalReject] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [lokasi, setLokasi] = useState('');
  const [lokasiId, setLokasiId] = useState(null);
  const [daftarRejects, setDaftarRejects] = useState([]);
  const [locations, setLocations] = useState([]);
  const [rejectReasons, setRejectReasons] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateObj, setDateObj] = useState(null);
  const [editingRecordType, setEditingRecordType] = useState(null);
  const [needsRepopulate, setNeedsRepopulate] = useState(false);

  useEffect(() => {
    const total = daftarRejects.reduce((sum, item) => sum + (Number(item.kuantitas) || 0), 0);
    setTotalReject(String(total));
  }, [daftarRejects]);

  useEffect(() => {
    fetchLocations();
    fetchRejectReasons();
  }, []);

  // Initialize with one empty jenis field when form opens and rejectReasons are loaded (only for new forms, not editing)
  useEffect(() => {
    if (!editingId && rejectReasons.length > 0 && daftarRejects.length === 0 && showForm) {
      // Add one initial jenis field
      const reason = rejectReasons[0];
      if (reason) {
        setDaftarRejects([{ 
          id: `initial-${Date.now()}`, 
          reason_id: reason.id,
          jenis: reason.name || reason.label || '',
          kuantitas: '' 
        }]);
      }
    }
  }, [rejectReasons.length, editingId, showForm]);

  useEffect(() => {
    if (editingId) {
      setShowForm(true);
      setNeedsRepopulate(false);
      fetchRecord(editingId);
    } else if (!editingId && showForm && !dateObj) {
      // Default to today when opening form for new entry
      const today = new Date();
      setDateObj(today);
      setTanggal(formatDate(today));
      setNeedsRepopulate(false);
    }
  }, [editingId, showForm]);

  // Repopulate form when locations or rejectReasons are loaded during edit
  useEffect(() => {
    if (editingId && needsRepopulate && locations.length > 0 && rejectReasons.length > 0) {
      // Re-fetch record to populate with proper location and reason names
      fetchRecord(editingId);
      setNeedsRepopulate(false);
    }
  }, [editingId, needsRepopulate, locations.length, rejectReasons.length]);

  useEffect(() => {
    Animated.timing(formAnimation, {
      toValue: showForm ? 1 : 0,
      duration: 330,
      useNativeDriver: false,
    }).start();
  }, [showForm, formAnimation]);

  useEffect(() => {
    if (dateObj) setTanggal(formatDate(dateObj));
  }, [dateObj]);

  function formatDate(d) {
    if (!d) return '';
    const months = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  const { getAccessToken } = useKindeAuth();

  const makeHeaders = async () => {
    const headers = { 'Content-Type': 'application/json' };
    try {
      const audience =
        Constants?.expoConfig?.extra?.KINDE_AUDIENCE || process.env.EXPO_PUBLIC_KINDE_AUDIENCE;
      if (!audience) {
        return headers;
      }
      let token = null;
      try {
        if (typeof getAccessToken === 'function') {
          token = await getAccessToken(audience);
        }
      } catch (e) {
        // Silent fail - continue without token
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // Silent fail - return headers without auth
    }
    return headers;
  };

  async function fetchLocations() {
    if (!API_BASE) return;
    try {
      const headers = await makeHeaders();
      const url = `${API_BASE}/location/dropdown?search&concise=true&nursery=false`;
      const res = await fetch(url, { method: 'GET', headers });
      if (!res.ok) throw new Error(`GET failed: ${res.status}`);
      const data = await res.json();
      const locationList = Array.isArray(data) ? data : (data?.data || data?.items || []);
      setLocations(locationList);
    } catch (e) {
      console.error('fetchLocations error', e);
    }
  }

  async function fetchRejectReasons() {
    if (!API_BASE) return;
    try {
      const headers = await makeHeaders();
      const url = `${API_BASE}/reject-reason`;
      const res = await fetch(url, { method: 'GET', headers });
      if (!res.ok) throw new Error(`GET failed: ${res.status}`);
      const data = await res.json();
      const reasonList = Array.isArray(data) ? data : (data?.data || data?.items || []);
      setRejectReasons(reasonList);
    } catch (e) {
      console.error('fetchRejectReasons error', e);
    }
  }

  function buildPayloadForApi(isUpdate = false) {
    const datetime = dateObj ? dateObj.toISOString() : null;

    const details = (daftarRejects || [])
      .filter((d) => d.reason_id && Number(d.kuantitas) > 0)
      .map((d) => ({
        reason_id: d.reason_id,
        quantity: Number(d.kuantitas) || 0,
      }));

    if (isUpdate && editingRecordType === 'single' && details.length === 1) {
      const reason = rejectReasons.find(r => r.id === details[0].reason_id);
      return {
        reason_name: reason?.name || '',
        quantity: details[0].quantity,
      };
    }

    return {
      location_id: lokasiId,
      datetime,
      details,
    };
  }

  function populateFormFromRecord(record) {
    const details = record.details || [];
    const total = details.reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);
    setTotalReject(String(total));
    
    if (record.datetime) {
      const parsed = new Date(record.datetime);
      if (!isNaN(parsed.getTime())) {
        setDateObj(parsed);
        setTanggal(formatDate(parsed));
      } else {
        setDateObj(null);
        setTanggal(String(record.datetime));
      }
    } else {
      setDateObj(null);
      setTanggal('');
    }

    setLokasiId(record.location_id || null);
    const location = locations.find(loc => loc.id === record.location_id);
    setLokasi(location ? location.name : '');
    
    // Check if we need to repopulate when locations/rejectReasons load
    if (record.location_id && !location) {
      setNeedsRepopulate(true);
    }
    
    const mappedRejects = details.map((d, i) => {
      const reason = rejectReasons.find(r => r.id === d.reason_id);
      if (d.reason_id && !reason) {
        setNeedsRepopulate(true);
      }
      return {
        id: d.id ?? `${Date.now()}-${i}`,
        reason_id: d.reason_id || null,
        jenis: reason ? reason.name : (d.reason || ''),
        kuantitas: String(d.quantity ?? 0),
      };
    });
    setDaftarRejects(mappedRejects);
  }

  function resetForm() {
    setTotalReject('');
    setTanggal('');
    setLokasi('');
    setLokasiId(null);
    setDaftarRejects([]);
    setDateObj(null);
    setEditingRecordType(null);
    setNeedsRepopulate(false);
    const today = new Date();
    setDateObj(today);
    setTanggal(formatDate(today));
    
    // Add one initial jenis field after reset if rejectReasons are available
    if (rejectReasons.length > 0 && !editingId) {
      const reason = rejectReasons[0];
      setDaftarRejects([{ 
        id: `initial-${Date.now()}`, 
        reason_id: reason.id,
        jenis: reason.name || reason.label || '',
        kuantitas: '' 
      }]);
    }
  }

  function addJenis(reasonId = null, kuantitas = '') {
    if (!reasonId && rejectReasons.length > 0) {
      reasonId = rejectReasons[0].id;
    }
    if (reasonId) {
      const reason = rejectReasons.find(r => r.id === reasonId);
      setDaftarRejects((prev) => [...prev, { 
        id: `${Date.now()}-${Math.random()}`, 
        reason_id: reasonId,
        jenis: reason ? reason.name : '',
        kuantitas: String(kuantitas) 
      }]);
    }
  }
  function removeJenis(id) {
    setDaftarRejects((prev) => prev.filter((p) => p.id !== id));
  }
  function updateJenis(id, field, value) {
    setDaftarRejects((prev) => {
      const updated = prev.map((p) => {
        if (p.id === id) {
          const newItem = { ...p, [field]: value };
          // If reason_id changed, update jenis name
          if (field === 'reason_id') {
            const reason = rejectReasons.find(r => r.id === value);
            newItem.jenis = reason ? reason.name : '';
          }
          return newItem;
        }
        return p;
      });
      return updated;
    });
  }

  // --- network operations ---
  async function fetchRecord(id) {
    if (!id) return;
    if (!API_BASE) {
      Alert.alert('Error', 'Gagal mendapatkan data.');
      return;
    }
    setLoading(true);
    try {
      const headers = await makeHeaders();
      const url = `${API_BASE}/ops/reject/${encodeURIComponent(id)}`;
      const res = await fetch(url, { method: 'GET', headers });
      const text = await res.text().catch(() => '');
      if (!res.ok) {
        throw new Error(`GET failed: ${res.status} ${text}`);
      }
      const data = safeParseJson(text) ?? null;
      
      let record = data;
      
      if (data && data.locations && Array.isArray(data.locations) && data.locations.length > 0) {
        const firstLocation = data.locations[0];
        record = {
          id: data.id,
          datetime: data.datetime,
          location_id: firstLocation.location_id || null,
          location_name: firstLocation.location_name || null,
          details: (firstLocation.reasons || []).map(r => ({
            id: r.id || null,
            reason_id: r.reason_id || null,
            reason: r.reason_name || r.reason || null,
            quantity: Number(r.quantity) || 0
          }))
        };
      } else if (Array.isArray(data)) {
        record = data.find((r) => String(r.id) === String(id)) || data[0] || null;
      } else if (data && data.id && data.reason_id !== undefined) {
        setEditingRecordType('single');
        record = {
          id: data.id,
          datetime: data.datetime,
          location_id: data.location_id || null,
          details: [{
            id: data.id,
            reason_id: data.reason_id || null,
            reason: data.reason?.name || null,
            quantity: Number(data.quantity) || 0
          }]
        };
      } else if (data && data.locations) {
        setEditingRecordType('grouped');
      }
      
      if (record) {
        populateFormFromRecord(record);
      } else {
        Alert.alert('Info', 'Data untuk diedit tidak ditemukan.');
      }
    } catch (e) {
      console.error('fetchRecord error', e);
      Alert.alert('Error', 'Gagal mendapatkan data.');
    } finally {
      setLoading(false);
    }
  }

  async function createRecord() {
    if (!API_BASE) {
      Alert.alert('Error', 'Gagal mendapatkan data.');
      return;
    }
    setLoading(true);
    try {
      const payload = buildPayloadForApi();
      const url = `${API_BASE}/ops/reject`;
      const headers = await makeHeaders();
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const text = await res.text().catch(() => '');
      if (!res.ok) {
        throw new Error(`POST failed ${res.status}: ${text}`);
      }
      const data = safeParseJson(text) ?? null;
      onSaved(data);
      resetForm();
      setShowForm(false);
      return data;
    } catch (e) {
      console.error('createRecord error', e);
      Alert.alert('Error', 'Gagal mendapatkan data.');
      throw e;
    } finally {
      setLoading(false);
    }
  }

  async function updateRecord(id) {
    if (!id) throw new Error('Missing id for update');
    if (!API_BASE) {
      Alert.alert('Error', 'Gagal mendapatkan data.');
      return;
    }
    setLoading(true);
    try {
      const payload = buildPayloadForApi(true);
      const url = `${API_BASE}/ops/reject/${encodeURIComponent(id)}`;
      const headers = await makeHeaders();
      const res = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });
      const text = await res.text().catch(() => '');

      if (!res.ok) throw new Error(`PUT failed ${res.status}: ${text}`);
      const data = safeParseJson(text) ?? null;
      Alert.alert('Sukses', 'Data berhasil diperbarui.');
      onSaved(data);
      resetForm();
      setShowForm(false);
      setEditingRecordType(null);
      return data;
    } catch (e) {
      console.error('updateRecord error', e);
      Alert.alert('Error', 'Gagal mendapatkan data.');
      throw e;
    } finally {
      setLoading(false);
    }
  }

  async function deleteRecord(id) {
    if (!id) return;
    Alert.alert('Hapus', 'Yakin ingin menghapus entri ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          if (!API_BASE) {
            Alert.alert('Error', 'Gagal menghubung ke server.');
            return;
          }
          setLoading(true);
          try {
            const url = `${API_BASE}/ops/reject/${encodeURIComponent(id)}`;
            const headers = await makeHeaders();
            const res = await fetch(url, { method: 'DELETE', headers });
            const text = await res.text().catch(() => '');
            if (!res.ok) throw new Error(`DELETE failed ${res.status}: ${text}`);
            Alert.alert('Sukses', 'Data berhasil dihapus.');
            onDeleted(id);
            resetForm();
            setShowForm(false);
          } catch (e) {
            console.error('deleteRecord error', e);
            Alert.alert('Error', 'Gagal menghubung ke server.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  }

  function onChangeDate(event, selectedDate) {
    if (Platform.OS === 'android') setShowDatePicker(false);
    const eventType = event && event.type ? event.type : null;
    if (eventType === 'dismissed') return;

    let chosenDate = selectedDate;
    if (!chosenDate && event && event.nativeEvent && event.nativeEvent.timestamp) {
      chosenDate = new Date(event.nativeEvent.timestamp);
    }
    if (!chosenDate) return;
    setDateObj(chosenDate);
    setTanggal(formatDate(chosenDate));
  }

  async function handleSave() {
    const invalid = daftarRejects.some((d) => !d.reason_id || Number(d.kuantitas) <= 0);
    if (invalid) {
      Alert.alert('Error', 'Pastikan semua jenis terisi dan kuantitas lebih dari 0 gram');
      return;
    }
    const payload = buildPayloadForApi();
    if (!payload.location_id) {
      Alert.alert('Validasi', 'Pilih lokasi yang valid.');
      return;
    }
    if (!payload.datetime) {
      Alert.alert('Validasi', 'Tanggal wajib dipilih.');
      return;
    }
    if (!payload.details || payload.details.length === 0) {
      Alert.alert('Validasi', 'Tambahkan minimal satu alasan dan kuantitas.');
      return;
    }

    try {
      if (editingId) {
        await updateRecord(editingId);
      } else {
        await createRecord();
      }
    } catch (e) {
      // Error handling is done in createRecord/updateRecord
    }
  }


  return (
    <View>
        {/* Tambah Button */}
        <TouchableOpacity style={styles.addButton} onPress={() => {
          const newShowForm = !showForm;
          setShowForm(newShowForm);
          // When opening form for new entry (not editing), ensure date defaults to today
          if (newShowForm && !editingId) {
            const today = new Date();
            setDateObj(today);
            setTanggal(formatDate(today));
          }
        }}>
          <Text style={styles.addButtonText}>{showForm ? 'Tutup' : '+ Tambah'}</Text>
        </TouchableOpacity>

        {/* Animated Form Section */}
        {showForm && (
          <Animated.View style={{ opacity: formAnimation, overflow: 'visible', marginHorizontal: 16, marginTop: 10 }}>
            <View style={styles.formPanel}>
              {/* Loading overlay */}
              {loading && (
                <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.6)' }}>
                  <ActivityIndicator size="large" color={COLORS.green} />
                </View>
              )}

              {/* Form Content */}
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Total Reject</Text>
                <View style={styles.formInputWrapper}>
                  <TextInput 
                    style={[styles.formInput, { backgroundColor: COLORS.gray }]} 
                    value={totalReject} 
                    editable={false}
                    placeholder="0" 
                  />
                  <Text style={styles.formUnit}>gram</Text>
                </View>
              </View>

              {/* Tanggal */}
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Tanggal*</Text>
                <View style={styles.formInputRow}>
                  <TouchableOpacity style={[styles.formInput, { justifyContent: 'center' }]} onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
                    <Text style={{ color: tanggal ? '#000' : '#888' }}>{tanggal || 'Pilih tanggal'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.formIconTouchable}>
                    <Icon name="calendar" size={22} color={COLORS.green} />
                  </TouchableOpacity>
                </View>

                {showDatePicker && (
                  <DateTimePicker value={dateObj || new Date()} mode="date" display="calendar" onChange={onChangeDate} maximumDate={new Date(2100, 11, 31)} minimumDate={new Date(2000, 0, 1)} />
                )}
              </View>

              {/* Lokasi */}
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Lokasi*</Text>
                <View style={{ borderWidth: 1, borderColor: COLORS.green, borderRadius: 4, overflow: 'hidden' }}>
                  <Picker
                    selectedValue={lokasiId}
                    onValueChange={(itemValue) => {
                      const location = locations.find(loc => loc.id === itemValue);
                      setLokasiId(itemValue);
                      setLokasi(location ? location.name : '');
                    }}
                    mode="dropdown"
                    style={{ height: 48 }}
                  >
                    <Picker.Item label="Pilih lokasi..." value={null} />
                    {locations.map((loc) => (
                      <Picker.Item key={loc.id} label={loc.name || loc.label || String(loc)} value={loc.id} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.separator} />

              {/* Daftar Reject Section */}
              <Text style={styles.subFormTitle}>DAFTAR REJECT</Text>
              <View style={styles.subFormHeader}>
                <Text style={[styles.subFormLabel, { marginLeft: 1 }]}>Jenis</Text>
                <Text style={styles.subFormLabel}>Kuantitas (gram)</Text>
              </View>

              {daftarRejects.map((item) => (
                <View key={item.id} style={styles.subFormRow}>
                  <View style={styles.dropdown}>
                    <View style={{ flex: 1, borderWidth: 1, borderColor: COLORS.darkGray, borderRadius: 4, overflow: 'hidden' }}>
                      <Picker
                        selectedValue={item.reason_id}
                        onValueChange={(itemValue) => {
                          updateJenis(item.id, 'reason_id', itemValue);
                        }}
                        mode="dropdown"
                        style={{ height: 40 }}
                      >
                        <Picker.Item label="Pilih jenis..." value={null} />
                        {rejectReasons.map((reason) => (
                          <Picker.Item key={reason.id} label={reason.name || reason.label || String(reason)} value={reason.id} />
                        ))}
                      </Picker>
                    </View>
                    <TouchableOpacity onPress={() => removeJenis(item.id)} style={{ marginLeft: 8 }}>
                      <Icon name="close" size={16} color={COLORS.green} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.quantityInputRow}>
                    <TextInput 
                      placeholder="Kuantitas (gram)" 
                      style={styles.quantityInput} 
                      keyboardType="numeric" 
                      value={String(item.kuantitas)} 
                      onChangeText={(text) => updateJenis(item.id, 'kuantitas', text.replace(/[^0-9]/g, ''))} 
                    />
                  </View>
                </View>
              ))}

              <TouchableOpacity 
                style={styles.addJenisButton} 
                onPress={() => {
                  if (rejectReasons.length > 0) {
                    addJenis(rejectReasons[0].id, '');
                  }
                }}
              >
                <Text style={styles.addJenisButtonText}>+ Jenis Lain</Text>
              </TouchableOpacity>

              {/* Action Buttons */}
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
                  <Text style={styles.saveButtonText}>{editingId ? 'Perbarui' : 'Simpan'}</Text>
                </TouchableOpacity>

                {editingId ? (
                  <TouchableOpacity style={styles.resetButton} onPress={() => deleteRecord(editingId)} disabled={loading}>
                    <Text style={styles.resetButtonText}>Hapus</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.resetButton} onPress={() => resetForm()} disabled={loading}>
                    <Text style={styles.resetButtonText}>Reset</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Animated.View>
        )}
    </View>
  );
}

const rejectStyles = StyleSheet.create({
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
    backgroundColor: COLORS.green,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  tableContainer: {
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.brickRed,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  dateSection: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.brickRed,
  },
  dateHeaderContainer: {
    backgroundColor: COLORS.gray,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.green,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
    backgroundColor: COLORS.white,
    minHeight: 44,
  },
  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.green,
    flex: 1,
  },
  quantityText: {
    fontSize: 14,
    color: COLORS.darkGray,
    fontWeight: '500',
  },
  expandedSection: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
    marginBottom: 8,
  },
  detailsHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    flex: 1,
    textAlign: 'left',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
    minHeight: 40,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.darkGray,
    flex: 1,
    textAlign: 'left',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 60,
  },
  actionButton: {
    padding: 4,
  },
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
    backgroundColor: COLORS.white,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageButtonText: {
    fontSize: 12,
    color: COLORS.green,
    fontWeight: '500',
  },
  pageButtonDisabled: {
    color: '#9ca3af',
    opacity: 0.5,
  },
  activePageButton: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  activePageText: {
    color: COLORS.white,
  },
});

const styles = StyleSheet.create({
  addButton: {
    backgroundColor: COLORS.green,
    alignSelf: 'center',
    width: 100,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginBottom: 8,
    marginTop: 8,
  },
  addButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
  },
  formPanel: {
    padding: 16,
  },
  formTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.green,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  formRow: {
    marginBottom: 12,
  },
  formLabel: {
    fontWeight: 'bold',
    color: COLORS.green,
    marginBottom: 4,
  },
  formInputWrapper: {
    position: 'relative',
  },
  formInputRow: {
    position: 'relative',
  },
  formInput: {
    borderWidth: 1,
    borderColor: COLORS.green,
    padding: 8,
    fontSize: 15,
    paddingRight: 40,
  },
  formUnit: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -7 }],
    color: COLORS.darkGray,
  },
  formIcon: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -11 }],
  },
  subFormTitle: {
    fontWeight: 'bold',
    color: COLORS.green,
    marginTop: 2,
    marginBottom: 8,
    fontSize: 20,
    textTransform: 'uppercase',
  },
  formIconTouchable: {
    position: 'absolute',
    right: 5,
    top: '30%',
    transform: [{ translateY: -11 }],
    padding: 6,
  },
  separator: {
    height: 2,
    backgroundColor: COLORS.green,
    marginVertical: 12,
  },
  subFormHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, marginRight: -28 },
  subFormLabel: { fontWeight: 'bold', color: COLORS.darkGray, fontSize: 14, flex: 9 },
  subFormRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.darkGray,
    padding: 8,
    marginRight: 8,
  },
  dropdownText: { flex: 1, color: COLORS.darkGray, fontSize: 15, padding: 0 },
  quantityInputRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  quantityInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.darkGray,
    padding: 8,
    fontSize: 15,
    textAlign: 'left',
  },
  stepper: {
    position: 'absolute',
    right: 8,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addJenisButton: {
    backgroundColor: COLORS.green,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 12,
  },
  addJenisButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },
  actionButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.green,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  saveButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
  resetButton: {
    flex: 1,
    backgroundColor: COLORS.brown,
    paddingVertical: 12,
    alignItems: 'center',
  },
  resetButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
});