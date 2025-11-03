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
import AsyncStorage from '@react-native-async-storage/async-storage';
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

const API_BASE =
  Constants.expoConfig?.extra?.API_BASE ||
  process.env.EXPO_PUBLIC_API_BASE ||
  'https://staging.rinal.dev/api/v1';
const API_TOKEN =
 process.env.EXPO_PUBLIC_API_TOKEN ;

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
  Siput: 2,

};
const ID_TO_REASON = Object.fromEntries(Object.entries(REASON_TO_ID).map(([k, v]) => [String(v), k]));

export default function TambahForm({ editingId = null, onSaved = () => {}, onDeleted = () => {} }) {
  const [showForm, setShowForm] = useState(false);
  const formAnimation = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(false);
  const [totalReject, setTotalReject] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [lokasi, setLokasi] = useState(''); 
  const [daftarRejects, setDaftarRejects] = useState([]); 
  const LOCATION_OPTIONS = Object.keys(LOCATION_TO_ID);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateObj, setDateObj] = useState(null);

  useEffect(() => {
    if (editingId) {
      setShowForm(true);
      fetchRecord(editingId);
    }
  }, [editingId]);

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

  const formHeight = formAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 450],
  });

  const { getAccessToken } = useKindeAuth();
  const makeHeaders = async () => {
  const headers = { 'Content-Type': 'application/json' };
  try {
    const audience = Constants.expoConfig.extra?.KINDE_AUDIENCE || process.env.EXPO_PUBLIC_KINDE_AUDIENCE;

    if (!audience) {
      console.warn('makeHeaders: KINDE audience is not defined');
      return headers;
    }

    const token = await getAccessToken(audience);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (e) {
    console.warn('makeHeaders: failed to get token from Kinde', e);
  }

  return headers;
};

  function buildPayloadForApi() {
  const location_id = LOCATION_TO_ID[lokasi] ?? null;
  const datetime = dateObj ? dateObj.toISOString() : null;
  const normalizedReasons = Object.fromEntries(
    Object.entries(REASON_TO_ID).map(([key, value]) => [key.toLowerCase(), value])
  );

  const details = (daftarRejects || [])
    .filter(d => d.jenis && d.jenis.trim() !== '' && REASON_TO_ID[d.jenis.trim().toLowerCase()])
    .map(d => ({
      reason_id: REASON_TO_ID[d.jenis.trim().toLowerCase()],
      quantity: Number(d.kuantitas) || 0,
    }));

  const payload = {
    location_id,
    datetime,
    details,
  };

  console.log("Payload being sent to API:", JSON.stringify(payload, null, 2));
  return payload;
}

  function populateFormFromRecord(record) {
       setTotalReject(''); 
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

    const locName = record.location_id ? ID_TO_LOCATION[String(record.location_id)] : null;
    setLokasi(locName ?? '');
    setDaftarRejects(
      (record.details || []).map((d, i) => ({
        id: d.id ?? `${Date.now()}-${i}`,
        jenis: ID_TO_REASON[String(d.reason_id)] ?? '',
        kuantitas: String(d.quantity ?? 0),
      }))
    );
  }

  function resetForm() {
    setTotalReject('');
    setTanggal('');
    setLokasi('');
    setDaftarRejects([]);
    setDateObj(null);
  }

  function addJenis(jenis = '', kuantitas = '') {
    setDaftarRejects(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, jenis, kuantitas: String(kuantitas) }]);
  }
  function removeJenis(id) {
    setDaftarRejects(prev => prev.filter(p => p.id !== id));
  }
  function updateJenis(id, field, value) {
    setDaftarRejects(prev => prev.map(p => (p.id === id ? { ...p, [field]: value } : p)));
  }


  async function fetchRecord(id) {
    if (!id) return;
    setLoading(true);
    try {
      const headers = await makeHeaders();
        const url = `${API_BASE}/ops/reject?org_code=org_b56b8313086&page=1&sortBy=Datetime:desc&id=${encodeURIComponent(
        id
      )}`;
      
      const res = await fetch(url, { method: 'GET', headers });
      if (!res.ok) throw new Error(`GET failed: ${res.status}`);
      const data = await res.json();

      let record = data;
      if (Array.isArray(data)) {
        record = data.find(r => String(r.id) === String(id)) || data[0] || null;
      }

      if (record) populateFormFromRecord(record);
      else Alert.alert('Info', 'Data untuk diedit tidak ditemukan.');
    } catch (e) {
      console.error('fetchRecord error', e);
      Alert.alert('Error', 'Gagal memuat data dari server.');
    } finally {
      setLoading(false);
    }
  }

  async function createRecord() {
    setLoading(true);
    try {
      const payload = buildPayloadForApi();
      console.log('Payload being sent:', JSON.stringify(payload, null, 2));
      const url = `${API_BASE}/ops/reject`;
      const headers = await makeHeaders();
      console.log('createRecord -> POST', url, 'headers=', headers, 'payload=', payload);
      console.log('Payload to POST:', payload);
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      console.log('createRecord response', res.status, text);
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
      Alert.alert('Error', 'Gagal menyimpan data ke server.');
      throw e;
    } finally {
      setLoading(false);
    }
  }

  async function updateRecord(id) {
    if (!id) throw new Error('Missing id for update');
    setLoading(true);
    try {
      const payload = buildPayloadForApi();
      const url = `$${API_BASE}/ops/reject/${id}`;
      const headers = await makeHeaders();
      console.log('updateRecord -> PUT', url, 'headers=', headers, 'payload=', payload);
      const res = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      console.log('updateRecord response', res.status, text);

      if (!res.ok) throw new Error(`PUT failed ${res.status}: ${text}`);
      const data = text ? JSON.parse(text) : null;
      onSaved(data);
      resetForm();
      setShowForm(false);
      return data;
    } catch (e) {
      console.error('updateRecord error', e);
      Alert.alert('Error', 'Gagal memperbarui data di server.');
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
            Alert.alert('Error', 'Gagal menghapus data di server.');
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
      d => !d.jenis || Number(d.kuantitas) <= 0
    );
    if (invalid) {
      Alert.alert('Error', 'Pastikan semua jenis terisi dan kuantitas lebih dari  0 gram');
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
                      style={styles.formInput}
                      value={totalReject}
                      keyboardType="numeric"
                      onChangeText={setTotalReject}
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
                      selectedValue={lokasi}
                      onValueChange={(itemValue) => setLokasi(itemValue)}
                      mode="dropdown"
                      style={{ height: 48 }}
                    >
                      <Picker.Item label="Pilih lokasi..." value="" />
                      {LOCATION_OPTIONS.map(loc => (
                        <Picker.Item key={loc} label={loc} value={loc} />
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

                {/* If no reject items yet */}
                {daftarRejects.length === 0 && (
                  <View style={styles.subFormRow}>
                    <View style={styles.dropdown}>
                      <TextInput
                        placeholder="Jenis (contoh: Ulat)"
                        style={styles.dropdownText}
                        value=""
                        onChangeText={text => addJenis(text, '')}
                      />
                    </View>
                    <View style={styles.quantityInputRow}>
                      <TextInput
                        placeholder="Kuantitas (gram)"
                        style={styles.quantityInput}
                        keyboardType="numeric"
                        value=""
                        onChangeText={text => addJenis('', text)}
                      />
                    </View>
                  </View>
                )}

                {/* Render daftarRejects */}
                {daftarRejects.map(item => (
                  <View key={item.id} style={styles.subFormRow}>
                    <View style={styles.dropdown}>
                      <TextInput
                        placeholder="Jenis (contoh: Ulat)"
                        style={styles.dropdownText}
                        value={item.jenis}
                        onChangeText={text => updateJenis(item.id, 'jenis', text)}
                      />
                      <TouchableOpacity onPress={() => removeJenis(item.id)}>
                        <Icon name="close" size={16} color={COLORS.green} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.quantityInputRow}>
                      <TextInput
                        placeholder="Kuantitas (gram)"
                        style={styles.quantityInput}
                        keyboardType="numeric"
                        value={String(item.kuantitas)}
                        onChangeText={text => updateJenis(item.id, 'kuantitas', text)}
                      />
                    </View>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.addJenisButton}
                  onPress={() => addJenis('', '')}
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
                      onPress={() => {
                        resetForm();
                        setShowForm(false);
                      }}
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