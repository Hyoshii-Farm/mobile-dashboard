import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SvgXml } from 'react-native-svg';
import * as Linking from 'expo-linking';
import { useKindeAuth } from '@kinde/expo';

import StatusBarCustom from '../components/statusbar';
import Header from '../components/Header';
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
  const { getUserProfile, logout, getAccessToken, isAuthenticated, login } = useKindeAuth();

  // User profile state
  const [initials, setInitials] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
  
  const [lokasiOptions, setLokasiOptions] = useState([]);
  const [varietasOptions, setVarietasOptions] = useState([]);

  const logoutRedirectUri = Linking.createURL('logout');

  // Fetch variants from API
  const fetchVariants = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const url = `${API_BASE}${ENDPOINTS.variant}?search=&page=1&pageSize=100`;
      console.log(`[FormMortality] Fetching variants from ${url}`);
      
      const response = await fetch(url, { headers });
      if (response.ok) {
        const data = await response.json();
        console.log(`[FormMortality] Variants response:`, data);
        
        // Extract variants array from response
        const variants = data?.items || data?.data || data || [];
        const variantOptions = variants.map(variant => ({
          id: variant.id,
          name: variant.name || variant.variant_name || variant.title,
        }));
        
        setVarietasOptions(variantOptions);
        console.log(`[FormMortality] Loaded ${variantOptions.length} variants`);
      } else {
        console.warn(`[FormMortality] Failed to fetch variants: ${response.status}`);
        // Fallback to hardcoded options
        setVarietasOptions([
          { id: 1, name: 'Tochiotome' },
          { id: 2, name: 'Strawberry Red' },
          { id: 3, name: 'Sweet Charlie' },
          { id: 4, name: 'Albion' }
        ]);
      }
    } catch (error) {
      console.warn(`[FormMortality] Error fetching variants:`, error);
      // Fallback to hardcoded options
      setVarietasOptions([
        { id: 1, name: 'Tochiotome' },
        { id: 2, name: 'Strawberry Red' },
        { id: 3, name: 'Sweet Charlie' },
        { id: 4, name: 'Albion' }
      ]);
    }
  }, [getAuthHeaders]);

  // Authentication helpers
  const getAuthHeaders = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('[FormMortality auth] Not authenticated, attempting login...');
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
      console.warn('[FormMortality auth] getAccessToken failed:', e?.message || e);
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
      
      console.log(`[FormMortality] POST ${url}`);
      console.log(`[FormMortality] Payload:`, JSON.stringify(payload, null, 2));
      
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

      console.log(`[FormMortality] Response Status: ${res.status}`);
      console.log(`[FormMortality] Response Data:`, json ?? text);

      if (res.ok) {
        console.log(`[FormMortality] ✅ SUCCESS - Data submitted to approval queue`);
        
        // Log any important response data
        if (json && json.id) {
          console.log(`[FormMortality] Created record ID: ${json.id}`);
        }
        if (json && json.transaction_id) {
          console.log(`[FormMortality] Transaction ID: ${json.transaction_id}`);
        }
        
        return {
          ok: true,
          status: res.status,
          msg: json?.message || 'Success - submitted for approval',
          data: json ?? text,
        };
      } else {
        const errorMsg = json?.message || json?.error || text || 'Failed to save data';
        console.warn(`[FormMortality] ❌ FAILED:`, errorMsg);
        return {
          ok: false,
          status: res.status,
          msg: errorMsg,
          data: json ?? text,
        };
      }
    } catch (e) {
      console.warn(`[FormMortality] ❌ ERROR:`, e.message);
      return {
        ok: false,
        status: 0,
        msg: e.message || 'Network error. Please try again.',
        data: null,
      };
    }
  };

  // Handle deep link after logout returns
  useEffect(() => {
    const handleUrl = ({ url }) => {
      const lower = (url || '').toLowerCase();
      const parsed = Linking.parse(url);
      const path = (parsed?.path || '').toLowerCase();
      if (lower.includes('logout') || path.includes('logout')) {
        setIsLoggingOut(false);
        setMenuVisible(false);
        navigation.reset({ index: 0, routes: [{ name: 'LogIn' }] });
      }
    };

    Linking.getInitialURL().then((url) => url && handleUrl({ url }));
    const sub = Linking.addEventListener('url', handleUrl);
    return () => sub.remove();
  }, [navigation]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getUserProfile();
        if (user?.picture) {
          setProfilePic(user.picture);
        } else if (user?.email) {
          const namePart = user.email.split('@')[0];
          const chars = namePart
            .split(/[.\-_]/)
            .map((part) => part.charAt(0).toUpperCase())
            .join('');
          setInitials(chars || namePart.charAt(0).toUpperCase());
        }
      } catch (err) {
        console.error('Failed to get user profile:', err);
      }
    };
    fetchUser();
    fetchVariants();
  }, [getUserProfile, fetchVariants]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout({ logoutRedirectUri });
    } catch (err) {
      console.error('Kinde logout failed:', err);
      setIsLoggingOut(false);
      setMenuVisible(false);
      navigation.reset({ index: 0, routes: [{ name: 'LogIn' }] });
    }
  };

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
    if (!lokasi || !varietas || !tanggal || !lokasiId || !varietasId) {
      Alert.alert('Form Tidak Lengkap', 'Harap isi semua kolom yang wajib dan pastikan lokasi/varietas telah dimuat.');
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
    
    console.log(`[FormMortality] Submitting with backend format:`, mortalityRecord);
    
    const res = await postToApi(mortalityRecord);

    if (res && res.ok) {
      Alert.alert('Berhasil', 
        'Data berhasil dikirim!\n\nCatatan: Pengajuan Anda telah dikirim ke antrian persetujuan dan akan muncul di dashboard setelah disetujui oleh administrator.', 
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
    <View style={styles.container}>
      <StatusBarCustom backgroundColor="#1D4949" />

      <Header
        title="MORTALITY"
        logoSvg={backArrowSvg}
        onLeftPress={() => navigation.navigate('Mortality')}
        showHomeButton={false}
        profileContent={
          <TouchableOpacity style={styles.avatar} onPress={() => setMenuVisible(true)}>
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </TouchableOpacity>
        }
      />

      <Modal
        visible={menuVisible}
        animationType="fade"
        transparent
        onRequestClose={() => !isLoggingOut && setMenuVisible(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => {
            if (!isLoggingOut) setMenuVisible(false);
          }}
        >
          <View style={styles.menuContainer}>
            <Pressable>
              <View style={styles.menu}>
                <TouchableOpacity
                  style={[styles.menuItem, isLoggingOut && styles.menuItemDisabled]}
                  onPress={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <View style={styles.rowCenter}>
                      <ActivityIndicator size="small" />
                      <Text style={[styles.menuItemText, { marginLeft: 8 }]}>Keluar…</Text>
                    </View>
                  ) : (
                    <Text style={styles.menuItemText}>Keluar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

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
            onPress={() => setDropdownOpen(prev => ({ ...prev, lokasi: !prev.lokasi }))} 
            placeholder="Pilih Lokasi"
          />
          {dropdownOpen.lokasi && (
            <DropdownBox 
              items={lokasiOptions.map(loc => typeof loc === 'string' ? loc : loc.name)} 
              onSelect={(opt) => { 
                // Find the selected location object to get the ID
                const selectedLocation = lokasiOptions.find(loc => 
                  (typeof loc === 'string' ? loc : loc.name) === opt
                );
                setLokasi(opt); 
                setLokasiId(selectedLocation?.id || null);
                closeAllDropdowns(); 
              }} 
            />
          )}
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
                console.log(`[FormMortality] Selected variant: ${opt} (ID: ${selectedVariant?.id})`);
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F2' },
  scrollContainer: { padding: 20, paddingBottom: 40 },

  // Header styles (copied from Mortality.js)
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FFFFF8', alignItems: 'center',
    justifyContent: 'center', overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 18 },
  avatarText: { color: '#1D4949', fontWeight: 'bold' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  menuContainer: {
    alignItems: 'flex-end',
    paddingTop: 80,
    paddingRight: 16,
  },
  menu: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 6,
    minWidth: 120,
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  menuItemDisabled: { opacity: 0.6 },
  menuItemText: { color: '#1D4949', fontWeight: '600' },
  rowCenter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },

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