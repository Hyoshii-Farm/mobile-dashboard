import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SvgXml } from 'react-native-svg';
import { useKindeAuth } from '@kinde/expo';

import ScreenLayout from '../components/ScreenLayout';
import DropdownInput from '../components/DropdownInput';
import DropdownBox from '../components/DropdownBox';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE;

// API endpoints
const ENDPOINTS = {
  mortality: '/ops/mortality',
  variant: '/variant',
};

// --- SVGs ---
const backArrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="19" height="30" viewBox="0 0 19 30" fill="none"><path d="M15.4537 30L0.859123 15L15.4537 0L18.8591 3.5L7.66993 15L18.8591 26.5L15.4537 30Z" fill="#FBF7EB"/></svg>`;
const calendarSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="teal" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 7.5h18M4.5 6.75h15A1.5 1.5 0 0 1 21 8.25v11.25a1.5 1.5 0 0 1-1.5 1.5h-15a1.5 1.5 0 0 1-1.5-1.5Z" /></svg>`;

export default function FormMortality() {
  const navigation = useNavigation();
  const { getAccessToken, isAuthenticated, login } = useKindeAuth();

  // Form State
  const [tanggal, setTanggal] = useState(new Date());
  const [lokasi, setLokasi] = useState('');
  const [lokasiId, setLokasiId] = useState(null);
  const [varietas, setVarietas] = useState('');
  const [varietasId, setVarietasId] = useState(null);
  const [totalTanamanSaatIni, setTotalTanamanSaatIni] = useState('');
  const [tanamanMati, setTanamanMati] = useState('');
  const [tanamanSulam, setTanamanSulam] = useState('');
  const [totalTanamanSetelahnya, setTotalTanamanSetelahnya] = useState('');

  // UI State
  const [showTanggal, setShowTanggal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState({
    lokasi: false,
    varietas: false,
  });
  
  const [varietasOptions, setVarietasOptions] = useState([]);

  // Fetch variants from API
  const fetchVariants = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const url = `${API_BASE}${ENDPOINTS.variant}?search=&page=1&pageSize=100`;
      
      const response = await fetch(url, { headers });
      if (response.ok) {
        const data = await response.json();
        
        // Extract variants array from response
        const variants = data?.items || data?.data || data || [];
        const variantOptions = variants.map(variant => ({
          id: variant.id,
          name: variant.name || variant.variant_name || variant.title,
        }));
        
        setVarietasOptions(variantOptions);
      } else {
        // Set empty options and show error to user
        setVarietasOptions([]);
        
        Alert.alert(
          'Gagal Memuat Data',
          'Gagal mendapatkan daftar varietas, coba lagi.',
          [{ text: 'Mengerti', style: 'default' }]
        );
      }
    } catch (error) {
      // Set empty options and show error to user
      setVarietasOptions([]);
      
      Alert.alert(
        'Gagal Memuat Data',
        'Gagal mendapatkan daftar varietas, coba lagi.',
        [{ text: 'Mengerti', style: 'default' }]
      );
    }
  }, [getAuthHeaders]);

  // Authentication helpers
  const getAuthHeaders = useCallback(async () => {
    if (!isAuthenticated) {
      await login();
      return {};
    }

    try {
      const token = await getAccessToken();
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };
    } catch (e) {
      return {
        'Content-Type': 'application/json',
      };
    }
  }, [isAuthenticated, getAccessToken, login]);

  // API submission function - uses only the backend specified format
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
          msg: json?.message || 'Success - submitted for approval',
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

  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);

  // Calculate total tanaman setelahnya
  useEffect(() => {
    const saatIni = parseInt(totalTanamanSaatIni, 10) || 0;
    const mati = parseInt(tanamanMati, 10) || 0;
    const sulam = parseInt(tanamanSulam, 10) || 0;
    const setelahnya = saatIni - mati + sulam;
    setTotalTanamanSetelahnya(setelahnya.toString());
  }, [totalTanamanSaatIni, tanamanMati, tanamanSulam]);

  const closeAllDropdowns = () => {
    setDropdownOpen({
      lokasi: false,
      varietas: false,
    });
  };

  const resetForm = () => {
    setLokasi('');
    setLokasiId(null);
    setVarietas('');
    setVarietasId(null);
    setTanggal(new Date());
    setTotalTanamanSaatIni('');
    setTanamanMati('');
    setTanamanSulam('');
    setTotalTanamanSetelahnya('');
    closeAllDropdowns();
  };

  const handleSimpan = async () => {
    if (!varietas || !tanggal || !varietasId) {
      Alert.alert('Form Tidak Lengkap', 'Harap isi semua kolom yang wajib dan pastikan varietas telah dimuat.');
      return;
    }
    
    // Temporary validation for lokasi since it's not implemented yet
    if (!lokasi) {
      Alert.alert(
        'Lokasi Diperlukan',
        'Fitur pemilihan lokasi belum tersedia. Silakan gunakan form di halaman Mortality untuk sementara.',
        [{ text: 'Mengerti', style: 'default' }]
      );
      return;
    }
    
    // Use the exact format specified by backend
    const mortalityRecord = {
      location_id: lokasiId,
      variant_id: varietasId,
      planting_date: tanggal.toISOString(), // Use full ISO string as backend expects
      add: {
        quantity: parseInt(tanamanSulam, 10) || 0,
        reason: "Plants added for replacement (sulam)"
      },
      remove: {
        quantity: parseInt(tanamanMati, 10) || 0,
        reason: "Plant mortality"
      }
    };
    
    const res = await postToApi(mortalityRecord);

    if (res && res.ok) {
      Alert.alert('Berhasil', 
        'Data berhasil dikirim!', 
        [
          { text: 'OK', onPress: () => {
              resetForm();
              navigation.navigate('Mortality');
          }}
        ]
      );
    } else {
      Alert.alert('Pengiriman Gagal', res.msg || 'Gagal mengirim data mortalitas. Silakan coba lagi.');
    }
  };

  return (
    <ScreenLayout
      headerTitle="Form Mortalitas"
      headerLogoSvg={backArrowSvg}
      onHeaderLeftPress={() => navigation.goBack()}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={closeAllDropdowns}
      >
        <View style={styles.fieldSpacing}>
          <Text style={styles.label}>Tanggal<Text style={styles.required}>*</Text></Text>
          <TouchableOpacity style={styles.inputBox} onPress={() => setShowTanggal(true)}>
            <Text style={styles.inputText}>{tanggal.toLocaleDateString('id-ID')}</Text>
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

        <View style={styles.fieldSpacing}>
          <Text style={styles.label}>Lokasi<Text style={styles.required}>*</Text></Text>
          <DropdownInput 
            value={lokasi} 
            onPress={() => {
              Alert.alert(
                'Fitur Belum Tersedia',
                'Pilihan lokasi akan ditambahkan pada versi selanjutnya.',
                [{ text: 'Mengerti', style: 'default' }]
              );
            }} 
            placeholder="Pilih Lokasi"
          />
        </View>

        <View style={styles.fieldSpacing}>
          <Text style={styles.label}>Varietas<Text style={styles.required}>*</Text></Text>
          <DropdownInput 
            value={varietas} 
            onPress={() => setDropdownOpen(prev => ({ ...prev, varietas: !prev.varietas }))} 
            placeholder="Pilih Varietas"
          />
          {dropdownOpen.varietas && (
            <DropdownBox 
              items={varietasOptions.map(variant => variant.name)} 
              onSelect={(opt) => { 
                // Find the selected variant object to get the ID
                const selectedVariant = varietasOptions.find(variant => variant.name === opt);
                setVarietas(opt); 
                setVarietasId(selectedVariant?.id || null);
                closeAllDropdowns(); 
              }} 
            />
          )}
        </View>
        
        <Text style={styles.sectionTitle}>Input Mortalitas</Text>

        <View style={styles.mortalityContainer}>
          <View style={styles.mortalityRow}>
            <Text style={styles.mortalityLabel}>Total Tanaman Saat Ini</Text>
            <View style={styles.inputWithUnit}>
              <TextInput 
                style={styles.mortalityInput} 
                value={totalTanamanSaatIni} 
                onChangeText={setTotalTanamanSaatIni} 
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
                value={tanamanMati} 
                onChangeText={setTanamanMati} 
                keyboardType="number-pad"
                placeholder="80"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.mortalityLabel}>Tanaman Sulam</Text>
              <TextInput 
                style={styles.mortalityInputSmall} 
                value={tanamanSulam} 
                onChangeText={setTanamanSulam} 
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
                value={totalTanamanSetelahnya} 
                editable={false}
              />
              <Text style={styles.unitLabel}>tanaman</Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.button, styles.simpanButton]} onPress={handleSimpan}>
            <Text style={styles.buttonText}>Simpan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={resetForm}>
            <Text style={styles.buttonText}>Batal</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { padding: 20, paddingBottom: 40 },

  // Form styles
  fieldSpacing: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#000', marginBottom: 6 },
  required: { color: '#8B2D2D' },
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

  buttonRow: { 
    flexDirection: 'row', 
    gap: 12, 
    marginTop: 24 
  },

  button: {
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

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});