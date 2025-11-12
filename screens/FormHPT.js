import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SvgXml } from 'react-native-svg';
import { useKindeAuth } from '@kinde/expo';

import StatusBarCustom from '../components/statusbar';
import Header from '../components/Header';
import DropdownBox from '../components/DropdownBox';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE;
const PAGE_SIZE = 100;
const MAX_PAGES = 50;

// --- SVG Icons ---
const backArrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="19" height="30" viewBox="0 0 19 30" fill="none"><path d="M15.4537 30L0.859123 15L15.4537 0L18.8591 3.5L7.66993 15L18.8591 26.5L15.4537 30Z" fill="#FBF7EB"/></svg>`;
const calendarSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="teal" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 7.5h18M4.5 6.75h15A1.5 1.5 0 0 1 21 8.25v11.25a1.5 1.5 0 0 1-1.5 1.5h-15a1.5 1.5 0 0 1-1.5-1.5Z" /></svg>`;

export default function FormHPT() {
  const navigation = useNavigation();
  const { getAccessToken, isAuthenticated, login } = useKindeAuth();

  // Form State
  const [tanggal, setTanggal] = useState(new Date());
  const [lokasi, setLokasi] = useState('');
  const [lokasiId, setLokasiId] = useState(null);
  
  // Pest configuration with score levels based on Figma
  const pestConfig = {
    'Ulat': { levels: 1, pest_id: null },
    'Siput': { levels: 1, pest_id: null },
    'Aphids': { levels: 3, pest_id: null },
    'Thrips': { levels: 7, pest_id: null },
    'Spidermites': { levels: 5, pest_id: null },
    'Mildew': { levels: 4, pest_id: null },
  };

  // Score entries organized by pest
  const [pestScores, setPestScores] = useState({
    'Ulat': { 1: '' },
    'Siput': { 1: '' },
    'Aphids': { 1: '', 2: '', 3: '' },
    'Thrips': { 1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 7: '' },
    'Spidermites': { 1: '', 2: '', 3: '', 4: '', 5: '' },
    'Mildew': { 1: '', 2: '', 3: '', 4: '' },
  });

  // UI State
  const [showTanggal, setShowTanggal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState({
    lokasi: false,
  });
  
  // Options
  const [lokasiOptions, setLokasiOptions] = useState([]);
  const [lokasiObjects, setLokasiObjects] = useState([]);
  const [hamaObjects, setHamaObjects] = useState([]);

  const [loading, setLoading] = useState({ lokasi: false });
  const [error, setError] = useState(null);

  // Authentication helpers
  const getAuthHeaders = useCallback(async () => {
    if (!isAuthenticated) {
      await login();
      return {};
    }

    try {
      const audience = process.env.EXPO_PUBLIC_KINDE_AUDIENCE;
      const token = await getAccessToken(audience);
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };
    } catch (e) {
      console.error('[FormHPT] Failed to get auth headers:', e);
      return {
        'Content-Type': 'application/json',
      };
    }
  }, [isAuthenticated, getAccessToken, login]);

  // Helper functions
  const toLabel = (x) => {
    if (typeof x === 'string') return x;
    if (!x || typeof x !== 'object') return '';
    return (
      x.name ?? x.label ?? x.title ?? x.nama ?? x.nama_lokasi ?? x.location_name ??
      x.pest_name ?? x.variant_name ?? ''
    );
  };

  const idFrom = (x, keys) => {
    for (const k of keys) if (x?.[k] != null) return x[k];
    return null;
  };

  // Fetch all pages helper
  const fetchAllPages = useCallback(async (path, pageSize = PAGE_SIZE) => {
    const headers = await getAuthHeaders();
    const all = [];
    let page = 1;
    let totalPagesKnown = null;

    while (page <= MAX_PAGES) {
      const url = `${API_BASE}${path}?page=${page}&pageSize=${pageSize}`;
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
        [];

      all.push(...arr);

      const tPages = data?.pagination?.totalPages ?? data?.meta?.totalPages ?? null;
      if (tPages && !totalPagesKnown) totalPagesKnown = Number(tPages);

      if ((totalPagesKnown && page >= totalPagesKnown) || arr.length === 0 || arr.length < pageSize) break;
      page += 1;
    }
    return all;
  }, [getAuthHeaders]);

  // Load options
  const loadLokasi = useCallback(async () => {
    setLoading((s) => ({ ...s, lokasi: true }));
    setError(null);
    try {
      const all = await fetchAllPages('/location/dropdown');
      setLokasiObjects(all);
      const labels = Array.from(new Set(all.map(toLabel).filter(Boolean))).sort((a, b) => a.localeCompare(b));
      setLokasiOptions(labels);
    } catch (e) {
      console.error('[FormHPT] Failed to load locations:', e);
      setError((prev) => (prev ? prev + ' | ' : '') + `Lokasi: ${e?.message || e}`);
    } finally {
      setLoading((s) => ({ ...s, lokasi: false }));
    }
  }, [fetchAllPages]);

  const loadHama = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      
      const baseUrl = `${API_BASE}/hama`;
      const params = new URLSearchParams({
        ops: 'true',
        pest: 'true'
      });
      const url = `${baseUrl}?${params.toString()}`;
      
      const response = await fetch(url, { headers });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      // Extract data using the same logic as monitoring page
      let all = [];
      if (Array.isArray(result)) {
        all = result;
      } else if (Array.isArray(result?.data)) {
        all = result.data;
      } else if (Array.isArray(result?.items)) {
        all = result.items;
      } else if (Array.isArray(result?.results)) {
        all = result.results;
      }
      
      setHamaObjects(all);
      
      // Map pest names to IDs from API
      const configCopy = { ...pestConfig };
      
      const apiToConfigMapping = {
        'Ulat': 'Ulat',
        'Siput': 'Siput',
        'Aphids': 'Aphids',
        'Thrips': 'Thrips',
        'Spidermites': 'Spidermites',
        'Mildew Insidensi': 'Mildew'
      };
      
      // Map API pests to our config
      all.forEach(pest => {
        const pestName = toLabel(pest);
        const pestId = idFrom(pest, ['id', 'pest_id', 'hama_id']);
        
        if (pestName && pestId) {
          Object.keys(apiToConfigMapping).forEach(apiName => {
            if (pestName === apiName) {
              const configName = apiToConfigMapping[apiName];
              if (configCopy[configName]) {
                configCopy[configName].pest_id = pestId;
              }
            }
          });
        }
      });
      
      // Update the global pestConfig with found IDs
      Object.keys(configCopy).forEach(key => {
        pestConfig[key].pest_id = configCopy[key].pest_id;
      });
      
    } catch (e) {
      console.error('[FormHPT] Failed to load pests:', e);
    }
  }, [getAuthHeaders]);

  const loadVarietas = useCallback(async () => {
    // Varietas not needed for this form
    return;
  }, []);

  useEffect(() => {
    loadLokasi();
    loadHama();
    loadVarietas();
  }, [loadLokasi, loadHama, loadVarietas]);

  // Label -> ID maps
  const lokasiIdByLabel = useMemo(() => {
    const m = {};
    for (const x of lokasiObjects) {
      const label = toLabel(x);
      const id = idFrom(x, ['id', 'location_id', 'lokasi_id', 'id_lokasi']);
      if (label && id != null) m[label] = id;
    }
    return m;
  }, [lokasiObjects]);

  const closeAllDropdowns = () => {
    setDropdownOpen({
      lokasi: false,
    });
  };

  const resetForm = () => {
    setTanggal(new Date());
    setLokasi('');
    setLokasiId(null);
    setPestScores({
      'Ulat': { 1: '' },
      'Siput': { 1: '' },
      'Aphids': { 1: '', 2: '', 3: '' },
      'Thrips': { 1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 7: '' },
      'Spidermites': { 1: '', 2: '', 3: '', 4: '', 5: '' },
      'Mildew': { 1: '', 2: '', 3: '', 4: '' },
    });
    closeAllDropdowns();
  };

  // Image upload helpers - REMOVED (not needed based on requirements)

  // Submit form
  const handleSimpan = async () => {
    // Validate required fields
    if (!tanggal || !lokasi) {
      Alert.alert('Form Tidak Lengkap', 'Harap isi tanggal dan lokasi.');
      return;
    }

    // Check if at least one score entry is filled (has a value > 0)
    let hasScoreEntries = false;
    Object.values(pestScores).forEach(scores => {
      Object.values(scores).forEach(value => {
        if (value !== '' && parseInt(value, 10) > 0) hasScoreEntries = true;
      });
    });
    
    if (!hasScoreEntries) {
      Alert.alert('Data Tidak Lengkap', 'Harap isi setidaknya satu data skor.');
      return;
    }

    try {
      const headers = await getAuthHeaders();
      
      // Build the payload according to API specification
      const pests = [];
      
      Object.keys(pestScores).forEach(pestName => {
        const pestScoreData = pestScores[pestName];
        const scores = [];
        
        // Get the number of levels for this pest from pestConfig
        const pestLevels = pestConfig[pestName]?.levels || 1;
        
        // Include ALL score levels (1 to pestLevels), whether filled or not
        for (let level = 1; level <= pestLevels; level++) {
          const plantCount = pestScoreData[level];
          const actualPlantCount = (plantCount && plantCount !== '') ? parseInt(plantCount, 10) || 0 : 0;
          
          scores.push({
            score: level,
            plant_count: actualPlantCount,
          });
        }
        
        // Get pest_id from pestConfig first, then fall back to hamaObjects
        let pestId = pestConfig[pestName]?.pest_id || null;
        
        if (!pestId) {
          // Try to find pest_id from hamaObjects with better matching
          const pestObj = hamaObjects.find(h => {
            const label = toLabel(h);
            if (!label) return false;
            
            // Exact match first
            if (label.toLowerCase() === pestName.toLowerCase()) return true;
            
            // Partial match
            return label.toLowerCase().includes(pestName.toLowerCase()) ||
                   pestName.toLowerCase().includes(label.toLowerCase());
          });
          
          if (pestObj) {
            pestId = idFrom(pestObj, ['id', 'pest_id', 'hama_id']);
          }
        }
        
        // Always add the pest with ALL its score levels
        const pestData = {
          pest_id: pestId,
          name: pestName,
          scores: scores,
        };
        
        pests.push(pestData);
      });

      // Validate that all pests have pest_id (server requirement)
      const pestsWithoutId = pests.filter(p => !p.pest_id);
      if (pestsWithoutId.length > 0) {
        const pestNames = pestsWithoutId.map(p => p.name).join(', ');
        Alert.alert(
          'Pest ID Tidak Ditemukan', 
          `Pest berikut tidak memiliki ID yang valid: ${pestNames}. Server memerlukan pest_id untuk semua entri. Silakan coba lagi atau hubungi admin.`,
          [{ text: 'OK' }]
        );
        return;
      }

      const payload = {
        date: tanggal.toISOString(),
        location_id: lokasiIdByLabel[lokasi] || null,
        total_plant: 0,
        pests: pests,
      };

      // Ensure we have location_id
      if (!payload.location_id) {
        Alert.alert('Error', 'Location ID tidak ditemukan. Pastikan lokasi dipilih dengan benar.');
        return;
      }

      await submitData(payload, headers);
    } catch (error) {
      console.error('[FormHPT] Error during submission:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat mengirim data: ' + error.message);
    }
  };

  const submitData = async (payload, headers) => {
    try {
      const url = `${API_BASE}/hpt`;
      
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const responseText = await res.text();
      let responseData = null;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = responseText;
      }

      if (res.ok) {
        Alert.alert(
          'Berhasil',
          'Data berhasil disimpan!',
          [
            {
              text: 'OK',
              onPress: () => {
                resetForm();
                navigation.navigate('HamaPenyakitTanaman');
              },
            },
          ]
        );
      } else {
        const errorMsg = responseData?.message || responseData?.error || responseText || 'Gagal menyimpan data';
        Alert.alert('Gagal', `Error ${res.status}: ${errorMsg}`);
      }
    } catch (error) {
      console.error('[FormHPT] Error in submitData:', error);
      Alert.alert('Error', 'Terjadi kesalahan: ' + error.message);
    }
  };

  // Helper to delete created records by id with proper headers
  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleScoreChange = (pestName, scoreLevel, value) => {
    setPestScores(prev => ({
      ...prev,
      [pestName]: {
        ...prev[pestName],
        [scoreLevel]: value.replace(/[^0-9]/g, ''),
      },
    }));
  };

  return (
    <View style={styles.container}>
      <StatusBarCustom backgroundColor="#1D4949" />
      <Header
        title="Form Hama Penyakit Tanaman"
        logoSvg={backArrowSvg}
        onLeftPress={() => navigation.goBack()}
        showHomeButton={false}
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={closeAllDropdowns}
        showsVerticalScrollIndicator={true}
        bounces={true}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
          <Text style={styles.formTitle}>HAMA PENYAKIT TANAMAN</Text>

          {!!error && <Text style={styles.errorText}>⚠️ {error}</Text>}

          {/* Tanggal */}
          <View style={styles.fieldSpacing}>
            <Text style={styles.label}>Tanggal<Text style={styles.required}>*</Text></Text>
            <TouchableOpacity style={styles.inputBox} onPress={() => setShowTanggal(true)}>
              <Text style={styles.inputText}>{formatDate(tanggal)}</Text>
              <SvgXml xml={calendarSvg} width={20} height={20} />
            </TouchableOpacity>
            {showTanggal && (
              <DateTimePicker 
                value={tanggal} 
                mode="date" 
                display="default"
                onChange={(e, date) => { 
                  setShowTanggal(false); 
                  if (date) setTanggal(date); 
                }}
              />
            )}
          </View>

          {/* Lokasi */}
          <View style={styles.fieldSpacing}>
            <Text style={styles.label}>Lokasi<Text style={styles.required}>*</Text></Text>
            <TouchableOpacity 
              style={styles.inputBox} 
              onPress={() => setDropdownOpen(prev => ({ ...prev, lokasi: !prev.lokasi }))}
            >
              <Text style={[styles.inputText, !lokasi && { color: '#999' }]}>
                {lokasi || 'Select Location'}
              </Text>
              <SvgXml 
                xml={`<svg xmlns="http://www.w3.org/2000/svg" width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M11.6087 1.5738L6.14086 7.04163L0.673035 1.5738L1.94886 0.297978L6.14086 4.48998L10.3329 0.297978L11.6087 1.5738Z" fill="#8B4513"/></svg>`}
                width={12} 
                height={8} 
              />
            </TouchableOpacity>
            {dropdownOpen.lokasi && (
              <DropdownBox
                items={lokasiOptions}
                onSelect={(option) => {
                  setLokasi(option);
                  setLokasiId(lokasiIdByLabel[option] || null);
                  closeAllDropdowns();
                }}
              />
            )}
          </View>

          {/* Ulat Section */}
          <Text style={styles.pestTitle}>ULAT</Text>
          <View style={styles.pestContainer}>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Tanaman yang terinfeksi</Text>
              <TextInput
                style={styles.scoreInput}
                value={pestScores['Ulat'][1]}
                onChangeText={(value) => handleScoreChange('Ulat', 1, value)}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Siput Section */}
          <Text style={styles.pestTitle}>SIPUT</Text>
          <View style={styles.pestContainer}>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Tanaman yang terinfeksi</Text>
              <TextInput
                style={styles.scoreInput}
                value={pestScores['Siput'][1]}
                onChangeText={(value) => handleScoreChange('Siput', 1, value)}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Aphids Section */}
          <Text style={styles.pestTitle}>APHIDS</Text>
          <View style={styles.pestContainer}>
            {[1, 2, 3].map((level) => (
              <View key={level} style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Tingkat : {level}</Text>
                <TextInput
                  style={styles.scoreInput}
                  value={pestScores['Aphids'][level]}
                  onChangeText={(value) => handleScoreChange('Aphids', level, value)}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#999"
                />
              </View>
            ))}
          </View>

          {/* Thrips Section */}
          <Text style={styles.pestTitle}>THRIPS</Text>
          <View style={styles.pestContainer}>
            {[1, 2, 3, 4, 5, 6, 7].map((level) => (
              <View key={level} style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Tingkat : {level}</Text>
                <TextInput
                  style={styles.scoreInput}
                  value={pestScores['Thrips'][level]}
                  onChangeText={(value) => handleScoreChange('Thrips', level, value)}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#999"
                />
              </View>
            ))}
          </View>

          {/* Spidermites Section */}
          <Text style={styles.pestTitle}>SPIDERMITES</Text>
          <View style={styles.pestContainer}>
            {[1, 2, 3, 4, 5].map((level) => (
              <View key={level} style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Tingkat : {level}</Text>
                <TextInput
                  style={styles.scoreInput}
                  value={pestScores['Spidermites'][level]}
                  onChangeText={(value) => handleScoreChange('Spidermites', level, value)}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#999"
                />
              </View>
            ))}
          </View>

          {/* Mildew Section */}
          <Text style={styles.pestTitle}>MILDEW</Text>
          <View style={styles.pestContainer}>
            {[1, 2, 3, 4].map((level) => (
              <View key={level} style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Tingkat : {level}</Text>
                <TextInput
                  style={styles.scoreInput}
                  value={pestScores['Mildew'][level]}
                  onChangeText={(value) => handleScoreChange('Mildew', level, value)}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#999"
                />
              </View>
            ))}
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.simpanButton]}
              onPress={handleSimpan}
            >
              <Text style={styles.buttonText}>Simpan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.resetButton]}
              onPress={resetForm}
            >
              <Text style={styles.buttonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5E6D3', // Beige background like Figma
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D4949',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 1,
  },
  errorText: {
    color: '#8B2D2D',
    marginBottom: 12,
    fontSize: 14,
  },
  fieldSpacing: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  required: {
    color: '#8B2D2D',
  },
  inputBox: {
    borderWidth: 1,
    borderColor: '#8B4513',
    borderRadius: 4,
    height: 48,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  textInputBox: {
    borderWidth: 1,
    borderColor: '#8B4513',
    borderRadius: 4,
    height: 48,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    color: '#333',
  },
  pestTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
    marginTop: 30,
    marginBottom: 15,
    textAlign: 'center',
    letterSpacing: 2,
  },
  pestContainer: {
    marginBottom: 20,
  },
  scoreRow: {
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  scoreInput: {
    borderWidth: 1,
    borderColor: '#8B4513',
    borderRadius: 4,
    height: 48,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    color: '#333',
    textAlign: 'left',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 40,
    justifyContent: 'center',
  },
  button: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 4,
    minWidth: 100,
    alignItems: 'center',
  },
  simpanButton: {
    backgroundColor: '#2E8B57', // Green like in Figma
  },
  resetButton: {
    backgroundColor: '#DC143C', // Red like in Figma
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
