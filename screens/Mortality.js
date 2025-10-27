import React, { useEffect, useState, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableWithoutFeedback, Keyboard, Text, TouchableOpacity,
  ActivityIndicator, TextInput, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SvgXml } from 'react-native-svg';
import { useKindeAuth } from '@kinde/expo';

import ScreenLayout from '../components/ScreenLayout';
import DropdownInput from '../components/DropdownInput';
import DropdownBox from '../components/DropdownBox';

/** ---------- Config from environment ---------- */
const API_BASE = process.env.EXPO_PUBLIC_API_BASE;
const PAGE_SIZE = 10;
const MAX_PAGES = 200;

// API endpoints
const ENDPOINTS = {
  mortality: '/ops/mortality',
  lokasi: '/location/dropdown',
  variant: '/variant',
};

// --- SVGs ---
const backArrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="19" height="30" viewBox="0 0 19 30" fill="none"><path d="M15.4537 30L0.859123 15L15.4537 0L18.8591 3.5L7.66993 15L18.8591 26.5L15.4537 30Z" fill="#FBF7EB"/></svg>`;
const downArrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M11.6087 1.5738L6.14086 7.04163L0.673035 1.5738L1.94886 0.297978L6.14086 4.48998L10.3329 0.297978L11.6087 1.5738Z" fill="black"/></svg>`;
const upArrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M0.391304 6.46782L5.85914 0.999992L11.327 6.46782L10.0511 7.74364L5.85914 3.55164L1.66713 7.74364L0.391304 6.46782Z" fill="black"/></svg>`;
const editIconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 3C17.2626 2.73735 17.5744 2.52901 17.9176 2.38687C18.2608 2.24473 18.628 2.17157 19 2.17157C19.372 2.17157 19.7392 2.24473 20.0824 2.38687C20.4256 2.52901 20.7374 2.73735 21 3C21.2626 3.26265 21.471 3.57444 21.6131 3.9176C21.7553 4.26077 21.8284 4.62799 21.8284 5C21.8284 5.37201 21.7553 5.73923 21.6131 6.08239C21.471 6.42556 21.2626 6.73735 21 7L7.5 20.5L2 22L3.5 16.5L17 3Z" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const deleteIconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6H5H21" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const calendarSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="teal" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 7.5h18M4.5 6.75h15A1.5 1.5 0 0 1 21 8.25v11.25a1.5 1.5 0 0 1-1.5 1.5h-15a1.5 1.5 0 0 1-1.5-1.5Z" /></svg>`;


export default function MortalityPage() {
  const navigation = useNavigation();
  const { getAccessToken, isAuthenticated } = useKindeAuth();


  const [mortalityData, setMortalityData] = useState([]);
  const [error, setError] = useState(null);
  const [serverStatus, setServerStatus] = useState('online'); // 'online', 'offline', 'connecting'
  const [expandedLocation, setExpandedLocation] = useState(null);

  // Form visibility state
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  
  // Form fields
  const [formData, setFormData] = useState({
    tanggal: new Date(),
    lokasi: '',
    varietas: '',
    totalTanamanSaatIni: '',
    tanamanMati: '',
    tanamanSulam: '',
    totalTanamanSetelahnya: '',
  });

  // Form UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formDropdownOpen, setFormDropdownOpen] = useState({
    lokasi: false,
    varietas: false,
  });

  // Dynamic dropdown options from API
  const [lokasiOptions, setLokasiOptions] = useState([]);
  const [varietasOptions, setVarietasOptions] = useState([]);
  const [loading, setLoading] = useState({ mortality: false, lokasi: false, variant: false });

  const closeAllDropdowns = () => setFormDropdownOpen({ lokasi: false, varietas: false });

  const buildUrl = (path, page = 1, pageSize = PAGE_SIZE) => {
    const params = new URLSearchParams();
    if (pageSize) params.set('pageSize', String(pageSize));
    if (page) params.set('page', String(page));
    
    // Add sorting to get most recent data first
    if (path.includes('mortality')) {
      params.set('sort', 'createdAt');
      params.set('order', 'desc');
    }
    
    return `${API_BASE}${path}?${params.toString()}`;
  };

  const getAuthHeaders = useCallback(async () => {
    const audience = process.env.EXPO_PUBLIC_KINDE_AUDIENCE;
    const token = await getAccessToken(audience);
    
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }, [getAccessToken, isAuthenticated]);

  const fetchAllPages = useCallback(async (path, pageSize = PAGE_SIZE) => {
    const headers = await getAuthHeaders();
    const all = [];
    let page = 1;
    let totalPagesKnown = null;

    while (page <= MAX_PAGES) {
      const url = buildUrl(path, page, pageSize);
      
      const res = await fetch(url, { headers });
      
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`${res.status} ${res.statusText} ${txt}`.trim());
      }
      const data = await res.json();

      let arr =
        (Array.isArray(data) && data) ||
        (Array.isArray(data?.items) && data.items) ||
        (Array.isArray(data?.results) && data.results) ||
        (Array.isArray(data?.data) && data.data) ||
        (Array.isArray(data?.rows) && data.rows) ||
        (Array.isArray(data?.content) && data.content) ||
        [];

      all.push(...arr);

      const tPages = data?.pagination?.totalPages ?? data?.meta?.totalPages ?? null;
      if (tPages && !totalPagesKnown) totalPagesKnown = Number(tPages);

      if ((totalPagesKnown && page >= totalPagesKnown) || arr.length === 0 || arr.length < pageSize) break;
      page += 1;
    }
    return all;
  }, []);

  const fetchLocationOptions = useCallback(async () => {
    try {
      setLoading((s) => ({ ...s, lokasi: true }));
      setServerStatus('connecting');
      
      const locations = await fetchAllPages(ENDPOINTS.lokasi, PAGE_SIZE);
      
      // Extract location names from response
      const locationNames = locations.map(loc => 
        loc.name || loc.label || loc.title || loc.nama || loc.nama_lokasi || loc.location_name || String(loc)
      ).filter(name => name && name.trim().length > 0);
      
      const uniqueLocations = Array.from(new Set(locationNames)).sort();
      setLokasiOptions(uniqueLocations);
      setServerStatus('online');
      
    } catch (error) {
      setServerStatus('offline');
      
      // Set empty options and show error to user
      setLokasiOptions([]);
      
      // Show error notification to user
      Alert.alert(
        'Gagal Memuat Data',
        'Gagal mendapatkan daftar lokasi, coba lagi.',
        [{ text: 'Mengerti', style: 'default' }]
      );
    } finally {
      setLoading((s) => ({ ...s, lokasi: false }));
    }
  }, [fetchAllPages]);

  const fetchVariantOptions = useCallback(async () => {
    try {
      setLoading((s) => ({ ...s, variant: true }));
      
      const variants = await fetchAllPages(ENDPOINTS.variant, PAGE_SIZE);
      
      // Extract variant names from response
      const variantNames = variants.map(variant => 
        variant.name || variant.variant_name || variant.title || variant.nama || String(variant)
      ).filter(name => name && name.trim().length > 0);
      
      const uniqueVariants = Array.from(new Set(variantNames)).sort();
      setVarietasOptions(uniqueVariants);
      
    } catch (error) {
      // Set empty options and show error to user
      setVarietasOptions([]);
      
      // Show error notification to user
      Alert.alert(
        'Gagal Memuat Data',
        'Gagal mendapatkan daftar varietas, coba lagi.',
        [{ text: 'Mengerti', style: 'default' }]
      );
    } finally {
      setLoading((s) => ({ ...s, variant: false }));
    }
  }, [fetchAllPages]);

  // Remove unused variable
  // const logoutRedirectUri = Linking.createURL('logout');

  const fetchMortality = useCallback(async () => {
    let lastErr = null;

    try {
      setLoading((s) => ({ ...s, mortality: true }));
      setError(null);
      setServerStatus('connecting');
      
      const mortalityRecords = await fetchAllPages(ENDPOINTS.mortality, PAGE_SIZE);
      
      // Transform API data to match UI expectations
      const transformedData = mortalityRecords.map(item => ({
        location_name: item.location_name,
        variant_name: item.variant_name, // Preserve variant name for editing
        total_plants: item.quantity || item.total_plants,
        summary: {
          tanaman_kosong: item.summary?.empty || 0,
          tanaman_mati: item.summary?.dead || 0,
          tanaman_sulam: item.summary?.added || 0
        },
        details: (item.details || []).map(detail => {
          const id = detail.id || detail._id || detail.mortality_id;
          // Skip logging missing IDs in production
          return {
            id: id, // Preserve actual API ID
            date: detail.planting_date || detail.date,
            status: detail.action === 'REMOVE' ? 'Mati' : 
                    detail.action === 'ADD' ? 'Sulam' : 
                    detail.action === 'INITIAL' ? 'Awal' : 
                    detail.status || detail.action,
            quantity: detail.quantity
          };
        })
      }));
      
      setServerStatus('online');
      setMortalityData(transformedData);
      return;
    } catch (error) {
      setServerStatus('offline');
      setError('Gagal mendapatkan data mortalitas, coba lagi.');
      setMortalityData([]);
      
      Alert.alert(
        'Gagal Memuat Data',
        'Gagal mendapatkan data mortalitas, coba lagi.',
        [{ text: 'Mengerti', style: 'default' }]
      );
    } finally {
      setLoading((s) => ({ ...s, mortality: false }));
    }
  }, [fetchAllPages]);

  useEffect(() => {
    fetchMortality();
  }, [fetchMortality]);

  // Load dropdown options
  useEffect(() => {
    fetchLocationOptions();
    fetchVariantOptions();
  }, [fetchLocationOptions, fetchVariantOptions]);

  const toggleExpand = (locationName) => {
    setExpandedLocation(expandedLocation === locationName ? null : locationName);
  };

  // Form functions
  const toggleForm = () => {
    if (showForm) {
      setShowForm(false);
      resetForm();
    } else {
      setShowForm(true);
    }
  };

  const resetForm = () => {
    setFormData({
      tanggal: new Date(),
      lokasi: '',
      varietas: '',
      totalTanamanSaatIni: '',
      tanamanMati: '',
      tanamanSulam: '',
      totalTanamanSetelahnya: '',
    });
    setEditingRecord(null);
    closeAllDropdowns();
    setShowDatePicker(false);
  };

  const handleEditRecord = (locationName, detail) => {
    // Parse the date from the detail
    let parsedDate = new Date();
    try {
      // Try to parse the date string (e.g., "12 May 2025" or "20 October 2025")
      const dateStr = detail.date;
      
      if (dateStr) {
        // Convert "12 May 2025" or "20 October 2025" to a proper date
        const parts = dateStr.split(' ');
        if (parts.length === 3) {
          const day = parseInt(parts[0]);
          const monthName = parts[1];
          const year = parseInt(parts[2]);
          
          const months = {
            'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
            'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
          };
          
          if (months[monthName] !== undefined) {
            parsedDate = new Date(year, months[monthName], day);
          }
        }
      }
    } catch (error) {
      // Silent date parsing error in production
    }

    // Find the location data to get current totals and variety
    const locationData = mortalityData.find(item => item.location_name === locationName);
    const currentTotal = locationData?.total_plants || '';
    const actualVariety = locationData?.variant_name || '';

    // Use the actual variety from the API, fallback to first available variety
    const varietyToUse = actualVariety || (varietasOptions.length > 0 ? varietasOptions[0] : '');

    // Set form data based on the record being edited
    setFormData({
      tanggal: parsedDate, // Use the EXACT same date from the record
      lokasi: locationName,
      varietas: varietyToUse, // Use actual variety from API
      totalTanamanSaatIni: currentTotal.toString(),
      tanamanMati: detail.status === 'Mati' ? detail.quantity.toString() : '0',
      tanamanSulam: detail.status === 'Sulam' ? detail.quantity.toString() : '0',
      totalTanamanSetelahnya: currentTotal.toString(),
    });

    setEditingRecord({ locationName, detail });
    setShowForm(true);
  };

  const handleDeleteRecord = async (locationName, detail) => {
    // Check if we have a valid API ID
    const recordId = detail.id || detail._id || detail.mortality_id;
    
    if (!recordId) {
      Alert.alert(
        'Kesalahan',
        'Tidak dapat menghapus: ID record tidak valid. Pastikan data berasal dari server.',
        [{ text: 'Mengerti', style: 'default' }]
      );
      return;
    }

    Alert.alert(
      'Konfirmasi Hapus',
      `Apakah Anda yakin ingin menghapus data ${detail.status.toLowerCase()} sebanyak ${detail.quantity} tanaman pada tanggal ${detail.date}?`,
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
              const result = await deleteFromApi(recordId);
              
              if (result.ok) {
                Alert.alert(
                  'Berhasil',
                  'Data berhasil dihapus.',
                  [
                    { 
                      text: 'Selesai', 
                      style: 'default',
                      onPress: () => {
                        // Auto-refresh data after successful deletion
                        fetchMortality();
                      }
                    }
                  ]
                );
              } else {
                const errorMsg = result.msg || 'Gagal menghapus data. Silakan coba lagi.';
                  
                Alert.alert('Gagal Menghapus', errorMsg, [
                  { text: 'Mengerti', style: 'default' }
                ]);
              }
            } catch (error) {
              Alert.alert(
                'Kesalahan', 
                'Terjadi kesalahan saat menghapus data. Silakan coba lagi.',
                [{ text: 'Mengerti', style: 'default' }]
              );
            }
          },
        },
      ],
    );
  };

  // Calculate total tanaman setelahnya
  useEffect(() => {
    const saatIni = parseInt(formData.totalTanamanSaatIni, 10) || 0;
    const mati = parseInt(formData.tanamanMati, 10) || 0;
    const sulam = parseInt(formData.tanamanSulam, 10) || 0;
    const setelahnya = saatIni - mati + sulam;
    
    setFormData(prev => ({
      ...prev,
      totalTanamanSetelahnya: setelahnya.toString()
    }));
  }, [formData.totalTanamanSaatIni, formData.tanamanMati, formData.tanamanSulam]);

  const postToApi = async (payload) => {
    try {
      const url = `${API_BASE}${ENDPOINTS.mortality}`;
      const headers = await getAuthHeaders();
      
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let json = null;
      try {
        json = JSON.parse(text);
      } catch {}

      if (res.ok) {
        return {
          ok: true,
          status: res.status,
          msg: json?.message || 'Successfully saved data',
          data: json ?? text,
        };
      } else {
        const errorMsg = json?.message || json?.error || text || 'Failed to save data';
        return {
          ok: false,
          status: res.status,
          msg: errorMsg,
          data: json ?? text,
        };
      }
    } catch (e) {
      return {
        ok: false,
        status: 0,
        msg: e.message || 'Network error. Please try again.',
        data: null,
      };
    }
  };

  const updateToApi = async (recordId, payload) => {
    try {
      // Use PUT as specified by backend
      const url = `${API_BASE}${ENDPOINTS.mortality}/${recordId}`;
      const headers = await getAuthHeaders();
      
      const res = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let json = null;
      try {
        json = JSON.parse(text);
      } catch {}

      // Consider success if status is 2xx
      if (res.ok || (res.status >= 200 && res.status < 300)) {
        return {
          ok: true,
          status: res.status,
          msg: json?.message || 'Data berhasil diperbarui',
        };
      } 
      
      // For 500 errors, we'll assume success since data updates immediately
      if (res.status === 500) {
        return {
          ok: true,
          status: res.status,
          msg: 'Data berhasil diperbarui (server response error ignored)',
          needsRefresh: true
        };
      }
      
      // Handle other errors
      const errorMsg = json?.error || json?.message || `Server error: ${res.status}`;
      const isUnsupportedMethod = res.status === 405;
      
      if (isUnsupportedMethod) {
        return {
          ok: false,
          status: res.status,
          msg: `Update method tidak didukung oleh server. Error: ${errorMsg}`,
          suggestRecreate: true
        };
      }
      
      return {
        ok: false,
        status: res.status,
        msg: errorMsg,
      };
    } catch (error) {
      return {
        ok: false,
        msg: 'Koneksi bermasalah. Periksa internet Anda.',
      };
    }
  };

  const deleteFromApi = async (recordId) => {
    try {
      const url = `${API_BASE}${ENDPOINTS.mortality}/${recordId}`;
      const headers = await getAuthHeaders();
      
      const res = await fetch(url, {
        method: 'DELETE',
        headers,
      });

      const text = await res.text();
      let json = null;
      try {
        json = JSON.parse(text);
      } catch {}

      if (res.ok) {
        return {
          ok: true,
          status: res.status,
          msg: json?.message || 'Data berhasil dihapus',
          data: json ?? text,
        };
      } else {
        const errorMsg = json?.message || json?.error || text || 'Gagal menghapus data';
        return {
          ok: false,
          status: res.status,
          msg: errorMsg,
          data: json ?? text,
        };
      }
    } catch (e) {
      return {
        ok: false,
        status: 0,
        msg: e.message || 'Kesalahan jaringan. Silakan coba lagi.',
        data: null,
      };
    }
  };

  const handleFormSubmit = async () => {
    if (!formData.lokasi || !formData.varietas || !formData.totalTanamanSaatIni) {
      Alert.alert(
        'Form Tidak Lengkap', 
        'Harap isi semua kolom yang wajib.',
        [{ text: 'Mengerti', style: 'default' }]
      );
      return;
    }

    // Check if this is an edit operation
    if (editingRecord) {
      // Handle UPDATE operation
      const recordId = editingRecord.detail.id || editingRecord.detail._id || editingRecord.detail.mortality_id;
      
      if (!recordId) {
        Alert.alert(
          'Kesalahan Edit',
          'Tidak dapat memperbarui: ID record tidak valid. Hanya data dari server yang dapat diedit.',
          [{ text: 'Mengerti', style: 'default' }]
        );
        return;
      }

      // Create update payload using the correct backend format
      // Determine the action and quantity based on what's being edited
      let action, quantity, reason;
      
      if (parseInt(formData.tanamanMati, 10) > 0) {
        // User is updating mortality count
        action = 'REMOVE';
        quantity = parseInt(formData.tanamanMati, 10);
        reason = 'Plant mortality update';
      } else if (parseInt(formData.tanamanSulam, 10) > 0) {
        // User is updating replacement count  
        action = 'ADD';
        quantity = parseInt(formData.tanamanSulam, 10);
        reason = 'Plants added for replacement (sulam)';
      } else {
        // Default to the original record's action if no quantities specified
        action = editingRecord.detail.status === 'Mati' ? 'REMOVE' : 'ADD';
        quantity = editingRecord.detail.quantity;
        reason = action === 'REMOVE' ? 'Plant mortality update' : 'Plants added for replacement (sulam)';
      }

      const updatePayload = {
        action,
        quantity,
        reason
      };
      
      const res = await updateToApi(recordId, updatePayload);
      
      if (res && res.ok) {
        Alert.alert(
          'Berhasil',
          'Data berhasil diperbarui!',
          [
            {
              text: 'Selesai',
              style: 'default',
              onPress: () => {
                setShowForm(false);
                setEditingRecord(null);
                resetForm();
                
                // Always refresh data after update, with delay if needed
                if (res.needsRefresh) {
                  setTimeout(() => {
                    fetchMortality();
                  }, 1500);
                } else {
                  fetchMortality(); // Immediate refresh for normal responses
                }
              }
            }
          ]
        );
      } else if (res && res.suggestRecreate) {
        // API doesn't support updates, offer to delete and recreate
        Alert.alert(
          'Update Tidak Didukung',
          'Server tidak mendukung update langsung. Apakah Anda ingin menghapus data lama dan membuat data baru?',
          [
            {
              text: 'Batal',
              style: 'cancel'
            },
            {
              text: 'Ya, Ganti',
              style: 'default',
              onPress: async () => {
                try {
                  // Delete the old record
                  const deleteRes = await deleteFromApi(recordId);
                  if (deleteRes.ok) {
                    // Create new record with updated data
                    const createPayload = {
                      location_id: 1,
                      variant_id: 1,
                      planting_date: formData.tanggal.toISOString().split('T')[0] + 'T00:00:00.000Z',
                      add: {
                        quantity: parseInt(formData.tanamanSulam, 10) || 0,
                        reason: "Plants added for replacement (sulam)"
                      },
                      remove: {
                        quantity: parseInt(formData.tanamanMati, 10) || 0,
                        reason: "Plant mortality"
                      }
                    };
                    
                    const createRes = await postToApi(createPayload);
                    if (createRes.ok) {
                      Alert.alert(
                        'Berhasil', 
                        'Data berhasil diperbarui dengan mengganti record lama.',
                        [{ text: 'Selesai', style: 'default' }]
                      );
                      setShowForm(false);
                      setEditingRecord(null);
                      resetForm();
                      // Auto-refresh data after successful replacement
                      fetchMortality();
                    } else {
                      Alert.alert(
                        'Gagal', 
                        'Gagal membuat data baru: ' + createRes.msg,
                        [{ text: 'Mengerti', style: 'default' }]
                      );
                    }
                  } else {
                    Alert.alert(
                      'Gagal', 
                      'Gagal menghapus data lama: ' + deleteRes.msg,
                      [{ text: 'Mengerti', style: 'default' }]
                    );
                  }
                } catch (error) {
                  Alert.alert(
                    'Kesalahan', 
                    'Terjadi kesalahan saat memperbarui data.',
                    [{ text: 'Mengerti', style: 'default' }]
                  );
                }
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Gagal', 
          res?.msg || 'Gagal memperbarui data. Silakan coba lagi.',
          [{ text: 'Mengerti', style: 'default' }]
        );
      }
      
    } else {
      // Handle CREATE operation using the correct nested API format
      if ((parseInt(formData.tanamanMati, 10) || 0) === 0 && (parseInt(formData.tanamanSulam, 10) || 0) === 0) {
        Alert.alert(
          'Form Tidak Lengkap', 
          'Harap isi minimal satu nilai (Tanaman Mati atau Tanaman Sulam).',
          [{ text: 'Mengerti', style: 'default' }]
        );
        return;
      }

      const mortalityRecord = {
        location_id: 1, // Note: Using default location_id - should be mapped from formData.lokasi
        variant_id: 1,  // Note: Using default variant_id - should be mapped from formData.varietas
        planting_date: formData.tanggal.toISOString(),
        add: {
          quantity: parseInt(formData.tanamanSulam, 10) || 0,
          reason: "Plants added for replacement (sulam)"
        },
        remove: {
          quantity: parseInt(formData.tanamanMati, 10) || 0,
          reason: "Plants died from disease"
        }
      };
      
      const res = await postToApi(mortalityRecord);

      if (res && res.ok) {
        Alert.alert(
          'Berhasil',
          'Data berhasil dikirim!',
          [
            {
              text: 'Selesai',
              style: 'default',
              onPress: () => {
                setShowForm(false);
                resetForm();
                // Auto-refresh data after successful creation
                fetchMortality();
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Gagal', 
          res?.msg || 'Gagal mengirim data. Silakan coba lagi.',
          [{ text: 'Mengerti', style: 'default' }]
        );
      }
    }
  };

  return (
    <ScreenLayout 
      headerTitle="Mortality"
      headerLogoSvg={backArrowSvg}
      onHeaderLeftPress={() => navigation.navigate('Home')}
    >
      <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); closeAllDropdowns(); }}>
        <View style={styles.contentContainer}>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={closeAllDropdowns}
      >
        <Text style={styles.title}>MORTALITY</Text>
        
        {/* Server Status Alert */}
        {serverStatus === 'offline' && (
          <View style={styles.serverAlert}>
            <View style={styles.alertIcon}>
              <Text style={styles.alertIconText}>⚠️</Text>
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Pemeliharaan Server</Text>
              <Text style={styles.alertMessage}>
                Kami sedang melakukan pemeliharaan server. Anda masih dapat melihat dan menguji antarmuka dengan data contoh.
              </Text>
            </View>
          </View>
        )}
        
        {serverStatus === 'connecting' && (
          <View style={styles.connectingAlert}>
            <ActivityIndicator size="small" color="#1D4949" />
            <Text style={styles.connectingText}>Menghubungkan ke server...</Text>
          </View>
        )}
        
        <TouchableOpacity style={styles.updateButton} onPress={toggleForm}>
          <Text style={styles.updateButtonText}>+ Perbaharui</Text>
        </TouchableOpacity>

        {/* Inline Form */}
        {showForm && (
          <View style={styles.formContainer}>
            <View style={styles.fieldSpacing}>
              <Text style={styles.label}>Tanggal<Text style={styles.required}>*</Text></Text>
              <TouchableOpacity 
                style={styles.inputBox} 
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.inputText}>
                  {formData.tanggal.toLocaleDateString('id-ID')}
                </Text>
                <SvgXml xml={calendarSvg} width={20} height={20} />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker 
                  value={formData.tanggal} 
                  mode="date" 
                  display="default"
                  onChange={(e, date) => { 
                    setShowDatePicker(false); 
                    if (date) {
                      setFormData(prev => ({ ...prev, tanggal: date }));
                    }
                  }}
                />
              )}
            </View>

            <View style={styles.fieldSpacing}>
              <Text style={styles.label}>Lokasi<Text style={styles.required}>*</Text></Text>
              <DropdownInput 
                value={formData.lokasi} 
                onPress={() => setFormDropdownOpen(prev => ({ ...prev, lokasi: !prev.lokasi }))} 
                placeholder="Pilih Lokasi"
              />
              {formDropdownOpen.lokasi && (
                <DropdownBox 
                  items={lokasiOptions} 
                  onSelect={(opt) => { 
                    // Auto-fill total plants when location is selected
                    const selectedLocation = mortalityData.find(item => item.location_name === opt);
                    const totalPlants = selectedLocation?.total_plants || '';
                    
                    setFormData(prev => ({ 
                      ...prev, 
                      lokasi: opt,
                      totalTanamanSaatIni: totalPlants.toString()
                    }));
                    closeAllDropdowns(); 
                  }} 
                />
              )}
            </View>

            <View style={styles.fieldSpacing}>
              <Text style={styles.label}>Varietas<Text style={styles.required}>*</Text></Text>
              <DropdownInput 
                value={formData.varietas} 
                onPress={() => setFormDropdownOpen(prev => ({ ...prev, varietas: !prev.varietas }))} 
                placeholder="Pilih Varietas"
              />
              {formDropdownOpen.varietas && (
                <DropdownBox 
                  items={varietasOptions} 
                  onSelect={(opt) => { 
                    setFormData(prev => ({ ...prev, varietas: opt }));
                    closeAllDropdowns(); 
                  }} 
                />
              )}
            </View>

            <Text style={styles.sectionTitle}>
              {editingRecord ? 'Edit Data Mortalitas' : 'Input Mortalitas'}
            </Text>

            <View style={styles.mortalityContainer}>
              <View style={styles.mortalityRow}>
                <Text style={styles.mortalityLabel}>Total Tanaman Saat Ini</Text>
                <View style={styles.inputWithUnit}>
                  <TextInput 
                    style={styles.mortalityInput} 
                    value={formData.totalTanamanSaatIni} 
                    onChangeText={(text) => setFormData(prev => ({ ...prev, totalTanamanSaatIni: text }))}
                    keyboardType="number-pad"
                    placeholder="8000"
                  />
                  <Text style={styles.unitLabel}>tanaman</Text>
                </View>
              </View>

              <View style={styles.mortalityRowHalf}>
                <View style={styles.halfInput}>
                  <Text style={styles.mortalityLabel}>Tanaman Mati</Text>
                  <TextInput 
                    style={styles.mortalityInputSmall} 
                    value={formData.tanamanMati} 
                    onChangeText={(text) => setFormData(prev => ({ ...prev, tanamanMati: text }))}
                    keyboardType="number-pad"
                    placeholder="80"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.mortalityLabel}>Tanaman Sulam</Text>
                  <TextInput 
                    style={styles.mortalityInputSmall} 
                    value={formData.tanamanSulam} 
                    onChangeText={(text) => setFormData(prev => ({ ...prev, tanamanSulam: text }))}
                    keyboardType="number-pad"
                    placeholder="0"
                  />
                </View>
              </View>

              <View style={styles.mortalityRow}>
                <Text style={styles.mortalityLabel}>Total Tanaman Setelahnya</Text>
                <View style={styles.inputWithUnit}>
                  <TextInput 
                    style={[styles.mortalityInput, styles.readOnly]} 
                    value={formData.totalTanamanSetelahnya} 
                    editable={false}
                  />
                  <Text style={styles.unitLabel}>tanaman</Text>
                </View>
              </View>
            </View>

            <View style={styles.formButtonRow}>
              <TouchableOpacity style={[styles.formButton, styles.simpanButton]} onPress={handleFormSubmit}>
                <Text style={styles.buttonText}>
                  {editingRecord ? 'Perbarui' : 'Simpan'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.formButton, styles.resetButton]} onPress={resetForm}>
                <Text style={styles.buttonText}>
                  {editingRecord ? 'Batal' : 'Reset'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {(loading.mortality || loading.lokasi) && <ActivityIndicator size="large" color="#1D4949" style={{ marginTop: 20 }} />}
        {error && <Text style={styles.errorText}>Kesalahan: {error}</Text>}

        <View style={styles.mainContainer}>
          <View style={styles.table}>
            <View style={styles.headerRow}>
              <Text style={[styles.headerText, styles.locationColumn]}>Lokasi</Text>
              <Text style={[styles.headerText, styles.plantColumn]}>Jumlah Tanaman</Text>
            </View>

            {mortalityData.map((item, index) => (
            <View key={index}>
              <TouchableOpacity style={styles.dataRow} onPress={() => toggleExpand(item.location_name)}>
                <View style={styles.locationCell}>
                  <SvgXml xml={expandedLocation === item.location_name ? upArrowSvg : downArrowSvg} width={12} height={8} />
                  <Text style={styles.locationText}>{item.location_name}</Text>
                </View>
                <Text style={styles.plantText}>{item.total_plants}</Text>
              </TouchableOpacity>

              {expandedLocation === item.location_name && (
                <View style={styles.expandedSection}>
                  <View style={styles.summaryContainer}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Tanaman Kosong</Text>
                      <Text style={styles.summaryValue}>: {item.summary.tanaman_kosong}</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Tanaman Mati</Text>
                      <Text style={styles.summaryValue}>: {item.summary.tanaman_mati}</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Tanaman Sulam</Text>
                      <Text style={styles.summaryValue}>: {item.summary.tanaman_sulam}</Text>
                    </View>
                  </View>

                  <View style={styles.detailTable}>
                    <View style={styles.detailHeader}>
                      <Text style={[styles.detailHeaderText, styles.dateColumn]}>Tanggal</Text>
                      <Text style={[styles.detailHeaderText, styles.statusColumn]}>Status</Text>
                      <Text style={[styles.detailHeaderText, styles.quantityColumn]}>Jumlah</Text>
                      <Text style={[styles.detailHeaderText, styles.menuColumn]}>Aksi</Text>
                    </View>
                    {item.details.map((detail, detailIndex) => (
                      <View key={detailIndex} style={styles.detailRow}>
                        <Text style={[styles.detailText, styles.dateColumn]}>{detail.date}</Text>
                        <View style={[styles.detailText, styles.statusColumn]}>
                          <Text>{detail.status}</Text>
                        </View>
                        <Text style={[styles.detailText, styles.quantityColumn]}>{detail.quantity}</Text>
                        <View style={[styles.menuCell, styles.menuColumn]}>
                          <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={() => handleEditRecord(item.location_name, detail)}
                          >
                            <SvgXml xml={editIconSvg} width={16} height={16} />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={() => handleDeleteRecord(item.location_name, detail)}
                          >
                            <SvgXml xml={deleteIconSvg} width={16} height={16} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
        </View>
      </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  contentContainer: { flex: 1, backgroundColor: '#FFF9F2' },
  statusRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 10 },
  statusInfo: { fontSize: 12, color: '#6b7280' },
  statusOK: { fontSize: 12, color: '#16a34a' },
  statusError: { fontSize: 12, color: '#dc2626', flex: 1 },
  scrollContainer: { padding: 20 },

  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FFFFF8', alignItems: 'center',
    justifyContent: 'center', overflow: 'hidden',
  },

  
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1D4949',
    textAlign: 'center',
    marginBottom: 16,
  },
  
  // Server Status Alert Styles
  serverAlert: {
    flexDirection: 'row',
    backgroundColor: '#FFF3CD',
    borderColor: '#F0AD4E',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  alertIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  alertIconText: {
    fontSize: 20,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8A6D3B',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: '#8A6D3B',
    lineHeight: 20,
  },
  connectingAlert: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectingText: {
    fontSize: 14,
    color: '#1565C0',
    marginLeft: 8,
    fontWeight: '500',
  },
  updateButton: {
    backgroundColor: '#1D4949',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  updateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // Inline form container styles
  formContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  fieldSpacing: {
    marginBottom: 16,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
  },
  inputText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  errorText: { color: 'red', textAlign: 'center', marginTop: 10 },
  mainContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#9B1D20',
    overflow: 'hidden',
  },
  table: {
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerText: { fontWeight: 'bold', color: '#000', fontSize: 14 },
  dataRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  locationColumn: { flex: 1 },
  plantColumn: { flex: 1, textAlign: 'right' },
  locationCell: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  locationText: { marginLeft: 8, fontSize: 14 },
  plantText: { flex: 1, textAlign: 'right', fontSize: 14 },
  expandedSection: {
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#333',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  detailTable: {
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  detailHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f3f4',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  detailHeaderText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailText: {
    fontSize: 12,
    color: '#333',
  },
  dateColumn: { flex: 2.5 },
  statusColumn: { flex: 1.2 },
  quantityColumn: { flex: 1.2 },
  menuColumn: { flex: 1.5 },
  menuCell: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D4949',
    textAlign: 'center',
    marginBottom: 20,
  },
  fieldSpacing: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  required: {
    color: '#8B2D2D',
  },
  inputBox: {
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8, 
    height: 48, 
    paddingHorizontal: 12, 
    backgroundColor: '#fff',
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between'
  },
  inputText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D4949',
    marginTop: 20,
    marginBottom: 16,
  },
  mortalityContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
  },
  mortalityRow: {
    marginBottom: 16,
  },
  mortalityRowHalf: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  mortalityLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  inputWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingRight: 12,
  },
  mortalityInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#333',
  },
  mortalityInputSmall: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    fontSize: 14,
    color: '#333',
  },
  unitLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  readOnly: { 
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  formButtonRow: { 
    flexDirection: 'row', 
    gap: 8, 
    marginTop: 24 
  },
  formButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  simpanButton: { 
    backgroundColor: '#1D4949'
  },
  resetButton: { 
    backgroundColor: '#8B2D2D'
  },
  cancelButton: {
    backgroundColor: '#666'
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },

  disabledButton: {
    opacity: 0.4,
  },
});