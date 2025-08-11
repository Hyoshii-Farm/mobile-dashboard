import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Text,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SvgXml } from 'react-native-svg';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';

import StatusBarCustom from '../components/statusbar';
import Header from '../components/Header';
import DropdownInput from '../components/DropdownInput';
import DropdownBox from '../components/DropdownBox';
import ImageUploadBox from '../components/ImageUploadBox';
import RoundedButton from '../components/RoundedButton';

/** ---------- Config from app.json ---------- */
const extra = (Constants?.expoConfig?.extra) || (Constants?.manifest?.extra) || {};
const API_BASE     = extra.EXPO_PUBLIC_API_BASE || 'https://hyoshii-staging.rinal.dev/api/v1';
const API_BASE_2_  = extra.LOCATION_API_BASE || 'https://dashboard-back-dev.vercel.app/api/v1';
const PAGE_SIZE    = Number(extra.EXPO_PUBLIC_PAGE_SIZE || 10);
const MAX_PAGES    = 200;

const CANDIDATE_ENDPOINTS = {
  lokasi:    [extra.LOCATION_API_BASE_PATH || '/location'],
  hama:      [extra.EXPO_PUBLIC_PEST_PATH || '/hama', '/pest', '/pests', '/masterdata/pest'],
  pestisida: [extra.EXPO_PUBLIC_PESTICIDE_PATH || '/pesticide', '/pesticides', '/masterdata/pesticide'],
};

const getAuthHeaders = async () => ({
  Accept: 'application/json',
  // Authorization: `Bearer <token>`, // put yours if needed
});

const buildUrl = (path, page = 1, pageSize = PAGE_SIZE) => {
  const p = new URLSearchParams();
  if (pageSize) p.set('pageSize', String(pageSize));
  if (page)     p.set('page', String(page));
  const base = path === '/location' ? API_BASE_2_ : API_BASE;
  return `${base}${path}?${p.toString()}`;
};

const backArrowSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="19" height="30" viewBox="0 0 19 30" fill="none">
  <path d="M15.4537 30L0.859123 15L15.4537 0L18.8591 3.5L7.66993 15L18.8591 26.5L15.4537 30Z" fill="#FBF7EB"/>
</svg>
`;

const calendarSvg = `
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="teal" stroke-width="1.5">
  <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 7.5h18M4.5 6.75h15A1.5 1.5 0 0 1 21 8.25v11.25a1.5 1.5 0 0 1-1.5 1.5h-15a1.5 1.5 0 0 1-1.5-1.5Z" />
</svg>
`;

const clockSvg = `
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="teal" stroke-width="1.5">
  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>
`;

export default function FormPesticideUsage() {
  const navigation = useNavigation();

  // form states
  const [tanggal, setTanggal] = useState(null);
  const [showTanggal, setShowTanggal] = useState(false);
  const [lokasi, setLokasi] = useState('');
  const [hama, setHama] = useState('');
  const [pestisida, setPestisida] = useState('');
  const [bahanAktif, setBahanAktif] = useState('');
  const [penggunaan1, setPenggunaan1] = useState('');
  const [dosisValue, setDosisValue] = useState('');
  const [dosisUnit, setDosisUnit] = useState('ml');
  const [penggunaan2, setPenggunaan2] = useState('');
  const [suhu, setSuhu] = useState('');
  const [tenagaKerja, setTenagaKerja] = useState('');
  const [photo, setPhoto] = useState(null);

  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  // dropdown open/close
  const dropdownOpenDefault = { lokasi: false, hama: false, pestisida: false, penggunaan1: false, dosisUnit: false };
  const [dropdownOpen, setDropdownOpen] = useState(dropdownOpenDefault);

  // options + raw objects from API
  const [lokasiOptions, setLokasiOptions] = useState([]);     // labels
  const [lokasiObjects, setLokasiObjects] = useState([]);     // raw
  const [hamaOptions, setHamaOptions] = useState([]);         // labels
  const [hamaObjects, setHamaObjects] = useState([]);         // raw

  // PESTISIDA
  const [pestisidaObjects, setPestisidaObjects] = useState([]);
  const [pestisidaLabels, setPestisidaLabels] = useState([]);

  const penggunaanOptions = ['Spray', 'Fogging', 'Kocor'];

  const [loading, setLoading] = useState({ lokasi: false, hama: false, pestisida: false });
  const [error, setError] = useState(null);

  const closeAllDropdowns = () => setDropdownOpen(dropdownOpenDefault);

  const toLabel = (x) => {
    if (typeof x === 'string') return x;
    if (!x || typeof x !== 'object') return '';
    return (
      x.name ?? x.label ?? x.title ?? x.nama ?? x.nama_lokasi ?? x.location_name ??
      x.lokasi ?? x.pestisida ?? x.hama ?? ''
    );
  };

  const idFrom = (x, keys) => {
    for (const k of keys) if (x?.[k] != null) return x[k];
    return null;
  };

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

  const loadLokasi = useCallback(async () => {
    setLoading((s) => ({ ...s, lokasi: true })); setError(null);
    try {
      const all = await fetchAllPages(CANDIDATE_ENDPOINTS.lokasi[0]);
      setLokasiObjects(all);
      const labels = Array.from(new Set(all.map(toLabel).filter(Boolean))).sort((a,b)=>a.localeCompare(b));
      setLokasiOptions(labels);
    } catch (e) {
      setError((prev) => (prev ? prev + ' | ' : '') + `Lokasi: ${e?.message || e}`);
    } finally {
      setLoading((s) => ({ ...s, lokasi: false }));
    }
  }, [fetchAllPages]);

  const loadHama = useCallback(async () => {
    setLoading((s) => ({ ...s, hama: true })); setError(null);
    try {
      for (const path of CANDIDATE_ENDPOINTS.hama) {
        try {
          const all = await fetchAllPages(path);
          setHamaObjects(all);
          const labels = Array.from(new Set(all.map(toLabel).filter(Boolean))).sort((a,b)=>a.localeCompare(b));
          setHamaOptions(labels);
          return;
        } catch (e) {
          console.warn('[Form hama] fallback path failed', path, e?.message || e);
        }
      }
      throw new Error('No hama endpoint succeeded');
    } catch (e) {
      setError((prev) => (prev ? prev + ' | ' : '') + `Hama: ${e?.message || e}`);
    } finally {
      setLoading((s) => ({ ...s, hama: false }));
    }
  }, [fetchAllPages]);

  const loadPestisida = useCallback(async () => {
    setLoading((s) => ({ ...s, pestisida: true })); setError(null);
    try {
      for (const path of CANDIDATE_ENDPOINTS.pestisida) {
        try {
          const all = await fetchAllPages(path);
          const objs = all.map((x) => ({
            id: x?.id ?? x?.pesticide_id ?? null,
            name: (x?.name ?? toLabel(x)) || 'Unknown',
            type: x?.type ?? '',
            active_ingredient: x?.active_ingredient ?? x?.activeIngredient ?? '',
          }));
          setPestisidaObjects([...objs].sort((a,b)=>a.name.localeCompare(b.name)));
          setPestisidaLabels(objs.map(o=>o.name).sort((a,b)=>a.localeCompare(b)));
          return;
        } catch (e) {
          console.warn('[Form pestisida] fallback path failed', path, e?.message || e);
        }
      }
      throw new Error('No pestisida endpoint succeeded');
    } catch (e) {
      setError((prev) => (prev ? prev + ' | ' : '') + `Pestisida: ${e?.message || e}`);
    } finally {
      setLoading((s) => ({ ...s, pestisida: false }));
    }
  }, [fetchAllPages]);

  useEffect(() => {
    loadLokasi();
    loadHama();
    loadPestisida();
  }, [loadLokasi, loadHama, loadPestisida]);

  // Label -> ID maps
  const lokasiIdByLabel = useMemo(() => {
    const m = {};
    for (const x of lokasiObjects) {
      const label = toLabel(x);
      const id = idFrom(x, ['id','location_id','lokasi_id','id_lokasi']);
      if (label && id != null) m[label] = id;
    }
    return m;
  }, [lokasiObjects]);

  const hamaIdByLabel = useMemo(() => {
    const m = {};
    for (const x of hamaObjects) {
      const label = toLabel(x);
      const id = idFrom(x, ['id','pest_id','hama_id']);
      if (label && id != null) m[label] = id;
    }
    return m;
  }, [hamaObjects]);

  const pestisidaIdByLabel = useMemo(() => {
    const m = {};
    for (const x of pestisidaObjects) if (x?.name && x?.id != null) m[x.name] = x.id;
    return m;
  }, [pestisidaObjects]);

  // ---------- formatters
  const pad2 = (n) => String(n).padStart(2,'0');
  const toDateYYYYMMDD = (d) => `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
  const toHHMMSS = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}:00`;
  const formatTime = (d) => (d ? `${pad2(d.getHours())}:${pad2(d.getMinutes())}` : '');

  const calcMinutes = () => {
    if (!startTime || !endTime) return '';
    let diff = (endTime - startTime) / 60000;
    if (diff < 0) diff += 1440;
    return Math.round(diff).toString();
  };

  // image pickers
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) { alert('Permission to access gallery is required!'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 1 });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) { alert('Permission to access camera is required!'); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 1 });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const handleUpload = () => {
    Alert.alert('Upload Gambar', 'Pilih sumber gambar', [
      { text: 'Ambil Foto', onPress: takePhoto },
      { text: 'Pilih dari Galeri', onPress: pickImage },
      { text: 'Batal', style: 'cancel' },
    ]);
  };

  const resetForm = () => {
    setTanggal(null); setLokasi(''); setHama(''); setPestisida(''); setBahanAktif('');
    setPenggunaan1(''); setDosisValue(''); setDosisUnit('ml'); setPenggunaan2('');
    setSuhu(''); setTenagaKerja(''); setPhoto(null); setStartTime(null); setEndTime(null);
    setDropdownOpen(dropdownOpenDefault);
  };

  // ----- ALWAYS multipart/form-data -----
  const postToApi = async (payload) => {
    const url = `${API_BASE}/hpt/ipm`;
    const form = new FormData();
    Object.entries(payload).forEach(([k, v]) => form.append(k, String(v)));

    if (photo) {
      const filename = photo.split('/').pop() || 'sensor.jpg';
      const ext = filename.split('.').pop()?.toLowerCase();
      const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
      form.append('sensor_pic', { uri: photo, name: filename, type: mime });
    }

    const headers = await getAuthHeaders(); // DO NOT set Content-Type; fetch will add boundary
    const res = await fetch(url, { method: 'POST', headers, body: form });
    const text = await res.text();
    let json = null; try { json = JSON.parse(text); } catch {}

    return {
      ok: res.ok,
      status: res.status,
      msg: json?.message || json?.error || (Array.isArray(json?.errors) ? json.errors.join(', ') : '') || text || `${res.status}`,
      data: json ?? text
    };
  };

  // ADD: build payload with EXACT fields expected; send as multipart
  const handleAdd = async () => {
    if (!tanggal || !lokasi || !hama || !pestisida || !penggunaan1 || !dosisValue || !penggunaan2 || !suhu || !startTime || !endTime || !tenagaKerja) {
      Alert.alert('Form Incomplete', 'Please fill in all required fields (*) before submitting.');
      return;
    }

    const dateStr = toDateYYYYMMDD(tanggal); // YYYY-MM-DD
    const startStr = toHHMMSS(startTime);    // HH:mm:ss
    const endStr   = toHHMMSS(endTime);      // HH:mm:ss
    const mins = Number(calcMinutes() || 0);
    const durationHours = Math.max(0, Math.floor(mins / 60)); // integer

    const location_id  = lokasiIdByLabel[lokasi];
    const pest_id      = hamaIdByLabel[hama];
    const pesticide_id = pestisidaIdByLabel[pestisida];

    const payload = {
      date: dateStr,
      start: startStr,
      end: endStr,
      duration: durationHours,
      treatment: penggunaan1,
      dosage: parseFloat(dosisValue),
      unit: dosisUnit,
      usage: parseFloat(penggunaan2),
      temperature: parseFloat(suhu),
      manpower: parseInt(tenagaKerja, 10),
      ...(location_id != null ? { location_id } : { location_name: lokasi }),
      ...(pest_id != null ? { pest_id } : { pest_name: hama }),
      ...(pesticide_id != null ? { pesticide_id } : { pesticide_name: pestisida }),
      // sensor_pic added in FormData
    };

    // strip empties / NaN
    Object.keys(payload).forEach((k) => {
      const v = payload[k];
      if (v === '' || v == null || Number.isNaN(v)) delete payload[k];
    });

    const r = await postToApi(payload);
    if (r.ok) {
      Alert.alert('Success', 'Data berhasil disimpan.');
      resetForm();
    } else {
      console.log('POST /hpt/ipm FAILED', r.status, r.msg, payload);
      Alert.alert('Gagal menyimpan', r.msg);
    }
  };

  const onSelectPestisida = (label) => {
    setPestisida(label);
    const obj = pestisidaObjects.find((o) => o.name === label) || null;
    setBahanAktif(obj?.active_ingredient || '');
  };

  return (
    <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); closeAllDropdowns(); }}>
      <View style={styles.container}>
        <StatusBarCustom backgroundColor="#1D4949" />
        <Header title="Pesticide Usage" logoSvg={backArrowSvg} onLeftPress={() => navigation.goBack()} showHomeButton={false} />

        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.formTitle}>Form Pengendalian Hama</Text>

          {!!error && <Text style={{ color: '#8B2D2D', marginBottom: 8 }}>⚠️ {error}</Text>}

          {/* Tanggal */}
          <View style={styles.fieldSpacing}>
            <Text style={styles.label}>Tanggal <Text style={{ color: '#8B2D2D' }}>*</Text></Text>
            <TouchableOpacity style={styles.dateBox} onPress={() => setShowTanggal(true)}>
              <Text style={styles.dateText}>{tanggal ? tanggal.toLocaleDateString() : ''}</Text>
              <SvgXml xml={calendarSvg} width={20} height={20} />
            </TouchableOpacity>
            {showTanggal && (
              <DateTimePicker
                value={tanggal || new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => { setShowTanggal(false); if (selectedDate) setTanggal(selectedDate); }}
              />
            )}
          </View>

          {/* Lokasi */}
          <View style={styles.fieldSpacing}>
            <DropdownInput
              label={<Text>Lokasi <Text style={{ color: '#8B2D2D' }}>*</Text></Text>}
              value={lokasi}
              onPress={() => setDropdownOpen(prev => ({ ...dropdownOpenDefault, lokasi: !prev.lokasi }))}
            />
            {dropdownOpen.lokasi && (
              <DropdownBox
                items={lokasiOptions}
                onSelect={(option) => { setLokasi(option); closeAllDropdowns(); }}
              />
            )}
          </View>

          {/* Hama */}
          <View style={styles.fieldSpacing}>
            <DropdownInput
              label={<Text>Hama <Text style={{ color: '#8B2D2D' }}>*</Text></Text>}
              value={hama}
              onPress={() => setDropdownOpen(prev => ({ ...dropdownOpenDefault, hama: !prev.hama }))}
            />
            {dropdownOpen.hama && (
              <DropdownBox
                items={hamaOptions}
                onSelect={(option) => { setHama(option); closeAllDropdowns(); }}
              />
            )}
          </View>

          {/* Pestisida */}
          <View style={styles.fieldSpacing}>
            <DropdownInput
              label={<Text>Pestisida <Text style={{ color: '#8B2D2D' }}>*</Text></Text>}
              value={pestisida}
              onPress={() => setDropdownOpen(prev => ({ ...dropdownOpenDefault, pestisida: !prev.pestisida }))}
            />
            {dropdownOpen.pestisida && (
              <DropdownBox
                items={pestisidaLabels}
                onSelect={(option) => { onSelectPestisida(option); closeAllDropdowns(); }}
              />
            )}
          </View>

          {/* Bahan Aktif (read-only) */}
          <View style={styles.fieldSpacing}>
            <Text style={styles.label}>Bahan Aktif</Text>
            <View style={styles.readOnlyBox}>
              <Text style={styles.readOnlyText}>{bahanAktif || ''}</Text>
            </View>
          </View>

          {/* Penggunaan / Treatment */}
          <View style={styles.fieldSpacing}>
            <DropdownInput
              label={<Text>Penggunaan (Treatment) <Text style={{ color: '#8B2D2D' }}>*</Text></Text>}
              value={penggunaan1}
              onPress={() => setDropdownOpen(prev => ({ ...dropdownOpenDefault, penggunaan1: !prev.penggunaan1 }))}
            />
            {dropdownOpen.penggunaan1 && (
              <DropdownBox
                items={penggunaanOptions}
                onSelect={(option) => { setPenggunaan1(option); closeAllDropdowns(); }}
              />
            )}
          </View>

          {/* Dosis */}
          <View style={styles.fieldSpacing}>
            <Text style={styles.label}>Dosis (per Liter) <Text style={{ color: '#8B2D2D' }}>*</Text></Text>
            <View style={styles.unitBox}>
              <View style={styles.unitInputArea}>
                <TextInput
                  style={styles.inputText}
                  value={dosisValue}
                  onChangeText={(val) => setDosisValue(val.replace(/[^0-9.]/g, ''))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#999"
                />
              </View>
              <TouchableOpacity
                style={styles.unitLabel}
                onPress={() => setDropdownOpen(prev => ({ ...dropdownOpenDefault, dosisUnit: !prev.dosisUnit }))}
              >
                <Text style={styles.unitLabelText}>{dosisUnit}</Text>
                <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`} />
              </TouchableOpacity>
            </View>
            {dropdownOpen.dosisUnit && (
              <DropdownBox
                items={['ml', 'gr']}
                onSelect={(option) => { setDosisUnit(option); closeAllDropdowns(); }}
              />
            )}
          </View>

          {/* Jumlah Penggunaan */}
          <View style={styles.fieldSpacing}>
            <Text style={styles.label}>Jumlah Penggunaan <Text style={{ color: '#8B2D2D' }}>*</Text></Text>
            <TextInput
              style={styles.textInputBox}
              value={penggunaan2}
              onChangeText={(val) => setPenggunaan2(val.replace(/[^0-9.]/g, ''))}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#999"
            />
          </View>

          {/* Suhu */}
          <View style={styles.fieldSpacing}>
            <Text style={styles.label}>Suhu <Text style={{ color: '#8B2D2D' }}>*</Text></Text>
            <View style={styles.unitBox}>
              <View style={styles.unitInputArea}>
                <TextInput
                  style={styles.inputText}
                  value={suhu}
                  onChangeText={(val) => setSuhu(val.replace(/[^0-9.]/g, ''))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.unitLabel}>
                <Text style={styles.unitLabelText}>°C</Text>
              </View>
            </View>
          </View>

          {/* Tenaga Kerja */}
          <View style={styles.fieldSpacing}>
            <Text style={styles.label}>Tenaga Kerja <Text style={{ color: '#8B2D2D' }}>*</Text></Text>
            <TextInput
              style={styles.textInputBox}
              value={tenagaKerja}
              onChangeText={(v) => setTenagaKerja(v.replace(/[^\d]/g, ''))}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor="#999"
            />
          </View>

          {/* Durasi */}
          <View style={styles.fieldSpacing}>
            <Text style={styles.label}>Durasi</Text>
            <View style={styles.row}>
              <TouchableOpacity style={styles.timeBox} onPress={() => setShowStart(true)}>
                <View style={styles.timeLabel}><Text>Start</Text><SvgXml xml={clockSvg} width={18} height={18} /></View>
                <Text>{formatTime(startTime)}</Text>
              </TouchableOpacity>
              {showStart && (
                <DateTimePicker
                  value={startTime || new Date()}
                  mode="time"
                  is24Hour={true}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(e, date) => { setShowStart(false); if (date) setStartTime(date); }}
                />
              )}
              <TouchableOpacity style={styles.timeBox} onPress={() => setShowEnd(true)}>
                <View style={styles.timeLabel}><Text>End</Text><SvgXml xml={clockSvg} width={18} height={18} /></View>
                <Text>{formatTime(endTime)}</Text>
              </TouchableOpacity>
              {showEnd && (
                <DateTimePicker
                  value={endTime || new Date()}
                  mode="time"
                  is24Hour={true}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(e, date) => { setShowEnd(false); if (date) setEndTime(date); }}
                />
              )}
            </View>
            <View style={styles.unitBox}>
              <View style={styles.unitInputArea}>
                <TextInput style={styles.inputText} value={calcMinutes()} editable={false} placeholder="0" placeholderTextColor="#999" />
              </View>
              <View style={styles.unitLabel}>
                <Text style={styles.unitLabelText}>Menit</Text>
              </View>
            </View>
          </View>

          {/* Gambar */}
          <ImageUploadBox label="Gambar" photo={photo} onUpload={handleUpload} onRemove={() => setPhoto(null)} />

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <RoundedButton label="ADD" backgroundColor="#1D4949" onPress={handleAdd} />
            <RoundedButton label="RESET" backgroundColor="#8B2D2D" onPress={resetForm} />
          </View>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F2' },
  scrollContainer: { padding: 20, paddingBottom: 40 },
  formTitle: { fontSize: 16, fontWeight: '700', color: '#8B0000', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#000', marginBottom: 4 },
  dateBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#000', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#FFF9F2',
  },
  dateText: { color: '#333', fontSize: 14 },
  fieldSpacing: { marginBottom: 16 },
  readOnlyBox: {
    borderWidth: 1, borderColor: '#000', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 12,
    height: 48, backgroundColor: '#FFF9F2', justifyContent: 'center',
  },
  readOnlyText: { fontSize: 14, color: '#333' },
  textInputBox: {
    borderWidth: 1, borderColor: '#000', borderRadius: 12, height: 48, paddingHorizontal: 12, backgroundColor: '#FFF9F2',
    fontSize: 14, color: '#333',
  },
  unitBox: {
    flexDirection: 'row', borderWidth: 1, borderColor: '#000', borderRadius: 12,
    backgroundColor: '#FFF9F2', overflow: 'hidden', height: 48, marginTop: 8,
  },
  unitInputArea: { flex: 1, paddingHorizontal: 12, justifyContent: 'center' },
  unitLabel: {
    flexDirection: 'row', alignItems: 'center', paddingLeft: 12, paddingRight: 8,
    borderLeftWidth: 1, borderLeftColor: '#000', height: '100%', minWidth: 55,
  },
  unitLabelText: { fontSize: 14, fontWeight: '500', color: '#333', marginRight: 4 },
  inputText: { fontSize: 14, color: '#333', paddingVertical: 0 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  timeBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#000', borderRadius: 12, paddingHorizontal: 12, height: 48, backgroundColor: '#FFF9F2',
  },
  timeLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
});
