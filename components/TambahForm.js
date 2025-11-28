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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Constants from 'expo-constants';
import { useKindeAuth } from '@kinde/expo';

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

export default function TambahForm({ editingId = null, onSaved = () => {}, onDeleted = () => {} }) {
  const [showForm, setShowForm] = useState(false);
  const formAnimation = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(false);
  const [tanggal, setTanggal] = useState('');
  const [lokasi, setLokasi] = useState(''); 
  const [lokasiId, setLokasiId] = useState(null);
  const [daftarRejects, setDaftarRejects] = useState([]); 
  const [locations, setLocations] = useState([]);
  const [hamaOptions, setHamaOptions] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateObj, setDateObj] = useState(null);

  useEffect(() => {
    if (!editingId && !dateObj) {
      const today = new Date();
      setDateObj(today);
      setTanggal(formatDate(today));
    }
    if (editingId) {
      setShowForm(true);
      fetchRecord(editingId);
    }
  }, [editingId]);

  useEffect(() => {
    fetchLocations();
    fetchHamaOptions();
  }, []);

  const totalReject = daftarRejects.reduce((sum, item) => {
    const qty = Number(item.kuantitas) || 0;
    return sum + qty;
  }, 0);

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
      const audience = Constants.expoConfig.extra?.KINDE_AUDIENCE || process.env.EXPO_PUBLIC_KINDE_AUDIENCE;

      if (!audience) {
        return headers;
      }

      const token = await getAccessToken(audience);
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
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
      const url = `${API_BASE}/location`;
      const res = await fetch(url, { method: 'GET', headers });
      if (!res.ok) throw new Error(`GET failed: ${res.status}`);
      const data = await res.json();
      const locationList = Array.isArray(data) ? data : (data?.data || []);
      setLocations(locationList);
    } catch (e) {
      console.error('fetchLocations error', e);
    }
  }

  async function fetchHamaOptions() {
    if (!API_BASE) return;
    try {
      const headers = await makeHeaders();
      const url = `${API_BASE}/hama`;
      const res = await fetch(url, { method: 'GET', headers });
      if (!res.ok) throw new Error(`GET failed: ${res.status}`);
      const data = await res.json();
      const hamaList = Array.isArray(data) ? data : (data?.data || []);
      setHamaOptions(hamaList);
    } catch (e) {
      console.error('fetchHamaOptions error', e);
    }
  }

  function buildPayloadForApi() {
    const datetime = dateObj ? dateObj.toISOString() : null;

    const details = (daftarRejects || [])
      .filter(d => d.jenis_id && Number(d.kuantitas) > 0)
      .map(d => ({
        reason_id: d.jenis_id,
        quantity: Number(d.kuantitas) || 0,
      }));

    return {
      location_id: lokasiId,
      datetime,
      details,
    };
  }

  function populateFormFromRecord(record) {
    if (record.datetime) {
      const parsed = new Date(record.datetime);
      if (!isNaN(parsed.getTime())) {
        setDateObj(parsed);
        setTanggal(formatDate(parsed));
      } else {
        setDateObj(null);
        setTanggal(record.datetime);
      }
    } else {
      setDateObj(null);
      setTanggal('');
    }

    setLokasiId(record.location_id || null);
    const location = locations.find(loc => loc.id === record.location_id);
    setLokasi(location ? location.name : '');
    
    setDaftarRejects(
      (record.details || []).map((d) => ({
        id: d.id,
        jenis_id: d.reason_id,
        jenis: hamaOptions.find(h => h.id === d.reason_id)?.name || '',
        kuantitas: String(d.quantity ?? 0),
      }))
    );
  }

  function resetForm() {
    setTanggal('');
    setLokasi('');
    setLokasiId(null);
    setDaftarRejects([]);
    setDateObj(null);
    const today = new Date();
    setDateObj(today);
    setTanggal(formatDate(today));
  }

  function addJenis(jenisId = null, kuantitas = '') {
    if (!jenisId) return;
    setDaftarRejects(prev => [...prev, { 
      id: `temp-${Date.now()}-${Math.random()}`, 
      jenis_id: jenisId,
      jenis: hamaOptions.find(h => h.id === jenisId)?.name || '',
      kuantitas: String(kuantitas) 
    }]);
  }
  function removeJenis(id) {
    setDaftarRejects(prev => prev.filter(p => p.id !== id));
  }
  function updateJenis(id, field, value) {
    setDaftarRejects(prev => prev.map(p => (p.id === id ? { ...p, [field]: value } : p)));
  }


  async function fetchRecord(id) {
    if (!id) return;
    if (!API_BASE) {
      Alert.alert('Error', 'Gagal menghubung ke server.');
      return;
    }
    setLoading(true);
    try {
      const headers = await makeHeaders();
      const url = `${API_BASE}/ops/reject/${encodeURIComponent(id)}`;
      
      const res = await fetch(url, { method: 'GET', headers });
      if (!res.ok) throw new Error(`GET failed: ${res.status}`);
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      let record = data;
      if (Array.isArray(data)) {
        record = data.find(r => String(r.id) === String(id)) || data[0] || null;
      }

      if (record) populateFormFromRecord(record);
      else Alert.alert('Info', 'Data untuk diedit tidak ditemukan.');
    } catch (e) {
      console.error('fetchRecord error', e);
      Alert.alert('Error', 'Gagal menghubung ke server.');
    } finally {
      setLoading(false);
    }
  }

  async function createRecord() {
    if (!API_BASE) {
      Alert.alert('Error', 'Gagal menghubung ke server.');
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

      const text = await res.text();
      if (!res.ok) {
        throw new Error(`POST failed ${res.status}: ${text}`);
      }
      const data = text ? JSON.parse(text) : null;
      onSaved(data);
      resetForm();
      setShowForm(false);
      return data;
    } catch (e) {
      console.error('createRecord error', e);
      Alert.alert('Error', 'Gagal menghubung ke server.');
      throw e;
    } finally {
      setLoading(false);
    }
  }

  async function updateRecord(id) {
    if (!id) throw new Error('Missing id for update');
    if (!API_BASE) {
      Alert.alert('Error', 'Gagal menghubung ke server.');
      return;
    }
    setLoading(true);
    try {
      const payload = buildPayloadForApi();
      const url = `${API_BASE}/ops/reject/${encodeURIComponent(id)}`;
      const headers = await makeHeaders();
      const res = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });
      const text = await res.text();

      if (!res.ok) throw new Error(`PUT failed ${res.status}: ${text}`);
      const data = text ? JSON.parse(text) : null;
      onSaved(data);
      resetForm();
      setShowForm(false);
      return data;
    } catch (e) {
      console.error('updateRecord error', e);
      Alert.alert('Error', 'Gagal menghubung ke server.');
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
            const text = await res.text();
            if (!res.ok) throw new Error(`DELETE failed ${res.status}: ${text}`);
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
    const invalid = daftarRejects.some(
      d => !d.jenis_id || Number(d.kuantitas) <= 0
    );
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
        <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 9}}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Tambah Button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowForm(v => !v)}
          >
            <Text style={styles.addButtonText}>
              {showForm ? 'Tutup' : '+ Tambah'}
            </Text>
          </TouchableOpacity>

          {/* Animated Form Section */}
          {showForm && (
            <Animated.View
              style={{
                opacity: formAnimation,
                overflow: 'visible',
                marginHorizontal: 16,
                marginTop: 10,
              }}
            >
              <View style={styles.formPanel}>
                {/* Loading overlay */}
                {loading && (
                  <View
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: 0,
                      bottom: 0,
                      zIndex: 10,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: 'rgba(255,255,255,0.6)',
                    }}
                  >
                    <ActivityIndicator size="large" color={COLORS.green} />
                  </View>
                )}

                {/* Form Content */}
                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>Total Reject</Text>
                  <View style={styles.formInputWrapper}>
                    <TextInput
                      style={[styles.formInput, { backgroundColor: COLORS.gray }]}
                      value={String(totalReject)}
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
                    <TouchableOpacity
                      style={[styles.formInput, { justifyContent: 'center' }]}
                      onPress={() => setShowDatePicker(true)}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: tanggal ? '#000' : '#888' }}>
                        {tanggal || 'Pilih tanggal'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(true)}
                      style={styles.formIconTouchable}
                    >
                      <Icon name="calendar" size={22} color={COLORS.green} />
                    </TouchableOpacity>
                  </View>

                  {showDatePicker && (
                    <DateTimePicker
                      value={dateObj || new Date()}
                      mode="date"
                      display="calendar"
                      onChange={onChangeDate}
                      maximumDate={new Date(2100, 11, 31)}
                      minimumDate={new Date(2000, 0, 1)}
                    />
                  )}
                </View>

                {/* Lokasi */}
                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>Lokasi*</Text>
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: COLORS.green,
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}
                  >
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
                      {locations.map(loc => (
                        <Picker.Item key={loc.id} label={loc.name} value={loc.id} />
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

                {/* Render daftarRejects */}
                {daftarRejects.map(item => (
                  <View key={item.id} style={styles.subFormRow}>
                    <View style={styles.dropdown}>
                      <View style={{ flex: 1, borderWidth: 1, borderColor: COLORS.darkGray, borderRadius: 4, overflow: 'hidden' }}>
                        <Picker
                          selectedValue={item.jenis_id}
                          onValueChange={(itemValue) => {
                            const hama = hamaOptions.find(h => h.id === itemValue);
                            updateJenis(item.id, 'jenis_id', itemValue);
                            updateJenis(item.id, 'jenis', hama ? hama.name : '');
                          }}
                          mode="dropdown"
                          style={{ height: 40 }}
                        >
                          <Picker.Item label="Pilih jenis..." value={null} />
                          {hamaOptions.map(hama => (
                            <Picker.Item key={hama.id} label={hama.name} value={hama.id} />
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
                        onChangeText={(text) => {
                          const numericValue = text.replace(/[^0-9]/g, '');
                          updateJenis(item.id, 'kuantitas', numericValue);
                        }}
                      />
                    </View>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.addJenisButton}
                  onPress={() => {
                    if (hamaOptions.length > 0) {
                      addJenis(hamaOptions[0].id, '');
                    }
                  }}
                >
                  <Text style={styles.addJenisButtonText}>+ Jenis Lain</Text>
                </TouchableOpacity>

                {/* Action Buttons */}
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                    disabled={loading}
                  >
                    <Text style={styles.saveButtonText}>
                      {editingId ? 'Perbarui' : 'Simpan'}
                    </Text>
                  </TouchableOpacity>

                  {editingId ? (
                    <TouchableOpacity
                      style={styles.resetButton}
                      onPress={() => deleteRecord(editingId)}
                      disabled={loading}
                    >
                      <Text style={styles.resetButtonText}>Hapus</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.resetButton}
                      onPress={() => resetForm()}
                      disabled={loading}
                    >
                      <Text style={styles.resetButtonText}>Reset</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </View>
      );
    }

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