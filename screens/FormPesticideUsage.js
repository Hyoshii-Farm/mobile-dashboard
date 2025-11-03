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
import * as FileSystem from 'expo-file-system';
import { useKindeAuth } from '@kinde/expo';
import * as ImageManipulator from 'expo-image-manipulator';
import jwtDecode from 'jwt-decode';


import StatusBarCustom from '../components/statusbar';
import Header from '../components/Header';
import DropdownInput from '../components/DropdownInput';
import DropdownBox from '../components/DropdownBox';
import ImageUploadBox from '../components/ImageUploadBox';
import RoundedButton from '../components/RoundedButton';

/** ---------- Config from environment ---------- */
const API_BASE = process.env.EXPO_PUBLIC_API_BASE;
const API_BASE_2_ = process.env.LOCATION_API_BASE;
const PAGE_SIZE = 10;
const MAX_PAGES = 200;

const CANDIDATE_ENDPOINTS = {
  lokasi: ['/location/dropdown'],
  hama: ['/hama', '/pest'],
  pestisida: ['/pesticide'],
};

// moved into component scope below


const buildUrl = (path, page = 1, pageSize = PAGE_SIZE) => {
  const p = new URLSearchParams();
  if (pageSize) p.set('pageSize', String(pageSize));
  if (page) p.set('page', String(page));
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
  const { getAccessToken, isAuthenticated, login } = useKindeAuth();

  const getAuthHeaders = React.useCallback(async () => {
    if (!isAuthenticated) {
      await login().catch(() => {});
    }
    const token = await getAccessToken(process.env.EXPO_PUBLIC_KINDE_AUDIENCE);
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }, [getAccessToken, isAuthenticated, login]);

  // form states
  const [tanggal, setTanggal] = useState(new Date()); // Default to today
  const [showTanggal, setShowTanggal] = useState(false);
  const [lokasi, setLokasi] = useState('');
  const [hama, setHama] = useState('');
  const [pestisida, setPestisida] = useState('');
  const [penggunaan1, setPenggunaan1] = useState('');
  const [dosisValue, setDosisValue] = useState('');
  const [dosisUnit, setDosisUnit] = useState('ml');
  const [penggunaan2, setPenggunaan2] = useState('1'); // Hidden field, default to 1
  const [suhu, setSuhu] = useState('');
  const [tenagaKerja, setTenagaKerja] = useState('');
  const [pic, setPic] = useState('');  // pic: name of the person performing the treatment (grower's names)
  const [description, setDescription] = useState(''); // description field for optional input
  const [photo, setPhoto] = useState(null);
  const [base64Image, setBase64Image] = useState('');

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
          
          // Create combined labels in format "name - active_ingredient"
          const combinedLabels = objs.map(o => {
            const activeIngredient = o.active_ingredient || 'Unknown ingredient';
            return `${o.name} - ${activeIngredient}`;
          }).sort((a,b)=>a.localeCompare(b));
          
          setPestisidaLabels(combinedLabels);
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
    for (const x of pestisidaObjects) {
      if (x?.name && x?.id != null) {
        const activeIngredient = x.active_ingredient || 'Unknown ingredient';
        const combinedLabel = `${x.name} - ${activeIngredient}`;
        m[combinedLabel] = x.id;
      }
    }
    return m;
  }, [pestisidaObjects]);

  // ---------- formatters
  const pad2 = (n) => String(n).padStart(2,'0');
  const toDateYYYYMMDD = (d) => {
    return d ? d.toISOString().split('T')[0] : '';  // Ensures "YYYY-MM-DD" format
  };
  const toHHMM = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;  // Ensure HH:MM format
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
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const base64Image = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      setPhoto(uri);  // Store the image URI
      setBase64Image(base64Image); // Store the base64 image string
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) { alert('Permission to access camera is required!'); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 1 });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const base64Image = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      setPhoto(uri);  // Store the image URI
      setBase64Image(base64Image); // Store the base64 image string
    }
  };

  const handleUpload = () => {
    Alert.alert('Upload Gambar', 'Pilih sumber gambar', [
      { text: 'Ambil Foto', onPress: takePhoto },
      { text: 'Pilih dari Galeri', onPress: pickImage },
      { text: 'Batal', style: 'cancel' },
    ]);
  };

  const resetForm = () => {
    setTanggal(new Date()); setLokasi(''); setHama(''); setPestisida('');
    setPenggunaan1(''); setDosisValue(''); setDosisUnit('ml'); setPenggunaan2('1');
    setSuhu(''); setTenagaKerja(''); setPic(''); setDescription(''); setPhoto(null); setStartTime(null); setEndTime(null);
    setDropdownOpen(dropdownOpenDefault);
  };

  // ----- ALWAYS multipart/form-data -----
const postToApi = async (payload) => {
  const url = `${API_BASE}/hpt/ipm`;
  
  console.log('[FormPesticideUsage] ===== POST API START =====');
  console.log('[FormPesticideUsage] POST URL:', url);
  console.log('[FormPesticideUsage] Payload to send:');
  console.log(JSON.stringify(payload, null, 2));
  
  const headers = await getAuthHeaders();
  headers['Content-Type'] = 'application/json';
  
  console.log('[FormPesticideUsage] Auth headers:', {
    ...headers,
    Authorization: headers.Authorization ? 'Bearer [TOKEN_PRESENT]' : 'None'
  });

  const requestOptions = {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  };
  
  console.log('[FormPesticideUsage] Request options:', {
    method: requestOptions.method,
    headers: requestOptions.headers,
    bodyLength: requestOptions.body.length
  });

  const res = await fetch(url, requestOptions);
  
  console.log('[FormPesticideUsage] POST response status:', res.status, res.statusText);
  console.log('[FormPesticideUsage] POST response headers:', Object.fromEntries(res.headers.entries()));

  const text = await res.text();
  console.log('[FormPesticideUsage] Raw response text:', text);
  
  let json = null;
  try {
    json = JSON.parse(text);
    console.log('[FormPesticideUsage] Parsed JSON response:');
    console.log(JSON.stringify(json, null, 2));
  } catch (parseError) {
    console.warn('[FormPesticideUsage] Failed to parse JSON response:', parseError.message);
  }

  const result = {
    ok: res.ok,
    status: res.status,
    msg: json?.message || json?.error || text,
    data: json ?? text,
  };
  
  console.log('[FormPesticideUsage] ===== POST API RESULT =====');
  console.log('[FormPesticideUsage] Success:', result.ok);
  console.log('[FormPesticideUsage] Status:', result.status);
  console.log('[FormPesticideUsage] Message:', result.msg);
  
  return result;
};


const uploadToCloudinary = async (uri) => {
console.log('[FormPesticideUsage] ===== IMAGE UPLOAD START =====');
console.log('[FormPesticideUsage] Original image URI:', uri);

const compressed = await ImageManipulator.manipulateAsync(
uri,
[{ resize: { width: 1280 } }],
{ compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
);

console.log('[FormPesticideUsage] Compressed image URI:', compressed.uri);

const fileName = compressed.uri.split('/').pop();
console.log('[FormPesticideUsage] Generated filename:', fileName);

const formData = new FormData();
formData.append('file', {
uri: compressed.uri,
name: fileName,
type: 'image/jpeg',
});
formData.append('upload_preset', 'ml_default');
formData.append('cloud_name', 'dsja6uts0');

console.log('[FormPesticideUsage] FormData prepared for Cloudinary upload');
console.log('[FormPesticideUsage] Upload preset: ml_default');
console.log('[FormPesticideUsage] Cloud name: dsja6uts0');

const cloudinaryUrl = 'https://api.cloudinary.com/v1_1/dsja6uts0/image/upload';
console.log('[FormPesticideUsage] Cloudinary URL:', cloudinaryUrl);

const res = await fetch(cloudinaryUrl, {
method: 'POST',
body: formData,
});

console.log('[FormPesticideUsage] Cloudinary response status:', res.status, res.statusText);

const data = await res.json();
console.log('[FormPesticideUsage] Cloudinary response data:');
console.log(JSON.stringify(data, null, 2));

if (data.secure_url) {
  console.log('[FormPesticideUsage] ===== IMAGE UPLOAD SUCCESS =====');
  console.log('[FormPesticideUsage] Uploaded image URL:', data.secure_url);
  return data.secure_url;
} else {
  console.error('[FormPesticideUsage] ===== IMAGE UPLOAD FAILED =====');
  console.error('[FormPesticideUsage] Error data:', JSON.stringify(data, null, 2));
  throw new Error('Upload failed: ' + JSON.stringify(data));
}
};

const handleAdd = async () => {
console.log('[FormPesticideUsage] ===== FORM SUBMISSION START =====');
console.log('[FormPesticideUsage] Form validation check...');

const requiredFields = {
  tanggal, lokasi, hama, pestisida, penggunaan1, dosisValue, suhu, startTime, endTime, tenagaKerja
};
console.log('[FormPesticideUsage] Required fields status:', {
  tanggal: !!tanggal,
  lokasi: !!lokasi,
  hama: !!hama,
  pestisida: !!pestisida,
  penggunaan1: !!penggunaan1,
  dosisValue: !!dosisValue,
  suhu: !!suhu,
  startTime: !!startTime,
  endTime: !!endTime,
  tenagaKerja: !!tenagaKerja
});

if (!tanggal || !lokasi || !hama || !pestisida || !penggunaan1 || !dosisValue || !suhu || !startTime || !endTime || !tenagaKerja) {
Alert.alert('Form Incomplete', 'Please fill in all required fields (*) before submitting.');
console.log('[FormPesticideUsage] Form validation failed - missing required fields');
return;
}

console.log('[FormPesticideUsage] Form validation passed');

// Extract pesticide name from combined label for API payload
const pestisidaName = pestisida ? pestisida.split(' - ')[0] : '';
console.log('[FormPesticideUsage] Extracted pesticide name:', pestisidaName);

console.log('[FormPesticideUsage] Building payload...');
const payload = {
datetime: toDateYYYYMMDD(tanggal),
start: toHHMM(startTime),
end: toHHMM(endTime),
duration: Math.floor((endTime - startTime) / 60000),
treatment: penggunaan1,
dosage: parseFloat(dosisValue),
unit: dosisUnit,
usage: parseFloat(penggunaan2),
temperature: parseFloat(suhu),
manpower: parseInt(tenagaKerja, 10),
...(lokasiIdByLabel[lokasi] ? { location_id: lokasiIdByLabel[lokasi] } : { location_name: lokasi }),
...(hamaIdByLabel[hama] ? { pest_id: hamaIdByLabel[hama] } : { pest_name: hama }),
...(pestisidaIdByLabel[pestisida] ? { pesticide_id: pestisidaIdByLabel[pestisida] } : { pesticide_name: pestisidaName }),
pic: pic || 'System', // Default value since field is removed
description,
};

if (photo) {
console.log('[FormPesticideUsage] Photo detected, uploading to Cloudinary...');
try {
const imageUrl = await uploadToCloudinary(photo);
payload.picture = imageUrl;
console.log('[FormPesticideUsage] Photo upload successful, added to payload');
} catch (e) {
console.error('[FormPesticideUsage] Photo upload failed:', e.message);
Alert.alert('Upload Failed', 'Gagal mengunggah gambar ke Cloudinary.');
return;
}
} else {
console.log('[FormPesticideUsage] No photo to upload');
}

console.log('[FormPesticideUsage] Final payload ready for API:');
console.log(JSON.stringify(payload, null, 2));

const res = await postToApi(payload);

console.log('[FormPesticideUsage] ===== FORM SUBMISSION RESULT =====');
if (res.ok) {
console.log('[FormPesticideUsage] Form submission SUCCESS!');
console.log('[FormPesticideUsage] Response data:', res.data);
Alert.alert(
'Success',
'Data berhasil disimpan.',
[
{
text: 'OK',
onPress: () => {
console.log('[FormPesticideUsage] Resetting form and navigating to PesticideUsage');
resetForm();
navigation.navigate('PesticideUsage');
}
}
],
{ cancelable: false }
);
} else {
console.error('[FormPesticideUsage] Form submission FAILED!');
console.error('[FormPesticideUsage] Error status:', res.status);
console.error('[FormPesticideUsage] Error message:', res.msg);
console.error('[FormPesticideUsage] Full error response:', res);
Alert.alert('Gagal menyimpan', res.msg);
}
};


  const onSelectPestisida = (combinedLabel) => {
    setPestisida(combinedLabel);
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
              <Text style={styles.dateText}>{tanggal ? toDateYYYYMMDD(tanggal) : ''}</Text>
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

          {/* Jumlah Penggunaan - Hidden field, automatically set to 1 */}

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
            <Text style={styles.label}>Durasi <Text style={{ color: '#8B2D2D' }}>*</Text></Text>
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

          {/* Description */}
          <View style={styles.fieldSpacing}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.textInputBox}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter description (optional)"
              placeholderTextColor="#999"
            />
          </View>


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
