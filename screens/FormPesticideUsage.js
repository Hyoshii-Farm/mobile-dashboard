import React, { useState } from 'react';
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
  Image,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SvgXml } from 'react-native-svg';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';

import StatusBarCustom from '../components/statusbar';
import Header from '../components/Header';
import DropdownInput from '../components/DropdownInput';
import DropdownBox from '../components/DropdownBox';
import ImageUploadBox from '../components/ImageUploadBox';
import RoundedButton from '../components/RoundedButton';

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

  const dropdownOpenDefault = {
    lokasi: false,
    hama: false,
    pestisida: false,
    penggunaan1: false,
    dosisUnit: false,
  };

  const [dropdownOpen, setDropdownOpen] = useState(dropdownOpenDefault);

  const lokasiOptions = [
    'Green House 1', 'Green House 2', 'Green House 3', 'Green House 4', 'Green House 5',
    'Outdoor 1', 'Outdoor 2', 'Outdoor 2 Baru', 'Outdoor 3', 'Outdoor 4',
    'Outdoor 5', 'Outdoor 6', 'Outdoor 7', 'Nursery 1', 'Nursery 2'
  ];

  const hamaOptions = [
    'Antraknosa', 'Aphids', 'Botrytis', 'Erwinia',
    'Fusarium', 'Jamur Hijau', 'Lalat', 'Lebah',
    'Mildew Insidensi', 'Mildew Intensitas', 'N. Cucumeris', 'Orius SP',
    'Powdery Mildew', 'SM', 'Siput', 'Spidermites', 'Thrips', 'Ulat', 'WFT'
  ];

  const pestisidaOptions = [
    'Abacel', 'Agrimic', 'Alika', 'Amistar', 'Amistar Top', 'Atoza', 'BP60', 'Bactosin',
    'Benlox', 'Bion M', 'Biopesticide', 'Buldok', 'Cabrio', 'Cyflumetofen', 'Daconil', 'Decis',
    'Dense', 'Easy', 'Elestal Neo', 'Endure', 'Explore', 'Flazz', 'Folirfos', 'Furadan', 'Gracia',
    'Inazeb', 'Lannate', 'Luna Smart', 'Merivon', 'Metarizep', 'Miravis Duo', 'Movento', 'Nordox',
    'Orondis Opti', 'Orthene', 'P04', 'Pegasus', 'Pemulus', 'Pevicure', 'Regent', 'Revus Optio',
    'Ridomil Gold', 'Rotraz', 'Rovral', 'SagriFlaz', 'Samite', 'Score', 'Seruni', 'Seudoflor',
    'Sidametrin', 'Simodis', 'Sivanto', 'Switch', 'Tangker', 'Topsin M', 'Trivia', 'Ziflo'
  ];

  const penggunaanOptions = ['Spray', 'Fogging', 'Kocor'];

  const closeAllDropdowns = () => setDropdownOpen(dropdownOpenDefault);

  const formatTime = (date) => {
    if (!date) return '';
    const hrs = date.getHours().toString().padStart(2, '0');
    const mins = date.getMinutes().toString().padStart(2, '0');
    return `${hrs}:${mins}`;
  };

  const calcMinutes = () => {
    if (!startTime || !endTime) return '';
    let diff = (endTime - startTime) / 60000;
    if (diff < 0) diff += 1440;
    return Math.round(diff).toString();
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission to access gallery is required!');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission to access camera is required!');
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleUpload = () => {
    Alert.alert(
      'Upload Gambar',
      'Pilih sumber gambar',
      [
        { text: 'Ambil Foto', onPress: takePhoto },
        { text: 'Pilih dari Galeri', onPress: pickImage },
        { text: 'Batal', style: 'cancel' }
      ]
    );
  };

  const resetForm = () => {
    setTanggal(null);
    setLokasi('');
    setHama('');
    setPestisida('');
    setBahanAktif('');
    setPenggunaan1('');
    setDosisValue('');
    setDosisUnit('ml');
    setPenggunaan2('');
    setSuhu('');
    setTenagaKerja('');
    setPhoto(null);
    setStartTime(null);
    setEndTime(null);
    setDropdownOpen(dropdownOpenDefault);
  };

  const handleAdd = () => {
    if (
      !tanggal ||
      !lokasi ||
      !hama ||
      !pestisida ||
      !bahanAktif ||
      !penggunaan1 ||
      !dosisValue ||
      !penggunaan2 ||
      !suhu ||
      !startTime ||
      !endTime ||
      !tenagaKerja
    ) {
      Alert.alert('Form Incomplete', 'Please fill in all required fields (*) before submitting.');
      return;
    }
    console.log('Form submitted');
  };

  return (
    <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); closeAllDropdowns(); }}>
      <View style={styles.container}>
        <StatusBarCustom backgroundColor="#1D4949" />
        <Header title="Pesticide Usage" logoSvg={backArrowSvg} onLeftPress={() => navigation.goBack()} showHomeButton={false} />

        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.formTitle}>Form Pengendalian Hama</Text>

          {/* Tanggal */}
          <View style={styles.fieldSpacing}>
            <Text style={styles.label}>
              Tanggal <Text style={{ color: '#8B2D2D' }}>*</Text>
            </Text>
            <TouchableOpacity style={styles.dateBox} onPress={() => setShowTanggal(true)}>
              <Text style={styles.dateText}>{tanggal ? tanggal.toLocaleDateString() : ''}</Text>
              <SvgXml xml={calendarSvg} width={20} height={20} />
            </TouchableOpacity>
            {showTanggal && (
              <DateTimePicker
                value={tanggal || new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowTanggal(false);
                  if (selectedDate) setTanggal(selectedDate);
                }}
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
            {dropdownOpen.lokasi && <DropdownBox items={lokasiOptions} onSelect={(option) => { setLokasi(option); closeAllDropdowns(); }} />}
          </View>

          {/* Hama */}
          <View style={styles.fieldSpacing}>
            <DropdownInput
              label={<Text>Hama <Text style={{ color: '#8B2D2D' }}>*</Text></Text>}
              value={hama}
              onPress={() => setDropdownOpen(prev => ({ ...dropdownOpenDefault, hama: !prev.hama }))}
            />
            {dropdownOpen.hama && <DropdownBox items={hamaOptions} onSelect={(option) => { setHama(option); closeAllDropdowns(); }} />}
          </View>

          {/* Pestisida */}
          <View style={styles.fieldSpacing}>
            <DropdownInput
              label={<Text>Pestisida <Text style={{ color: '#8B2D2D' }}>*</Text></Text>}
              value={pestisida}
              onPress={() => setDropdownOpen(prev => ({ ...dropdownOpenDefault, pestisida: !prev.pestisida }))}
            />
            {dropdownOpen.pestisida && <DropdownBox items={pestisidaOptions} onSelect={(option) => { setPestisida(option); setBahanAktif(option); closeAllDropdowns(); }} />}
          </View>

          {/* Bahan Aktif */}
          <View style={styles.fieldSpacing}>
            <Text style={styles.label}>
              Bahan Aktif <Text style={{ color: '#8B2D2D' }}>*</Text>
            </Text>
            <View style={styles.readOnlyBox}>
              <Text style={styles.readOnlyText}>{bahanAktif || ''}</Text>
            </View>
          </View>

          {/* Penggunaan 1 */}
          <View style={styles.fieldSpacing}>
            <DropdownInput
              label={<Text>Penggunaan <Text style={{ color: '#8B2D2D' }}>*</Text></Text>}
              value={penggunaan1}
              onPress={() => setDropdownOpen(prev => ({ ...dropdownOpenDefault, penggunaan1: !prev.penggunaan1 }))}
            />
            {dropdownOpen.penggunaan1 && <DropdownBox items={penggunaanOptions} onSelect={(option) => { setPenggunaan1(option); closeAllDropdowns(); }} />}
          </View>

          {/* Dosis */}
          <View style={styles.fieldSpacing}>
            <Text style={styles.label}>
              Dosis (per Liter) <Text style={{ color: '#8B2D2D' }}>*</Text>
            </Text>
            <View style={styles.unitBox}>
              <View style={styles.unitInputArea}>
                <TextInput style={styles.inputText} value={dosisValue} onChangeText={(val) => setDosisValue(val.replace(/[^0-9.]/g, ''))} keyboardType="numeric" placeholder="0" placeholderTextColor="#999" />
              </View>
              <TouchableOpacity style={styles.unitLabel} onPress={() => setDropdownOpen(prev => ({ ...dropdownOpenDefault, dosisUnit: !prev.dosisUnit }))}>
                <Text style={styles.unitLabelText}>{dosisUnit}</Text>
                <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`} />
              </TouchableOpacity>
            </View>
            {dropdownOpen.dosisUnit && <DropdownBox items={['ml', 'gr']} onSelect={(option) => { setDosisUnit(option); closeAllDropdowns(); }} />}
          </View>

          {/* Jumlah Penggunaan */}
          <View style={styles.fieldSpacing}>
            <Text style={styles.label}>
              Jumlah Penggunaan <Text style={{ color: '#8B2D2D' }}>*</Text>
            </Text>
            <TextInput style={styles.textInputBox} value={penggunaan2} onChangeText={(val) => setPenggunaan2(val.replace(/[^0-9.]/g, ''))} keyboardType="numeric" placeholder="0" placeholderTextColor="#999" />
          </View>

          {/* Suhu */}
          <View style={styles.fieldSpacing}>
            <Text style={styles.label}>
              Suhu <Text style={{ color: '#8B2D2D' }}>*</Text>
            </Text>
            <View style={styles.unitBox}>
              <View style={styles.unitInputArea}>
                <TextInput style={styles.inputText} value={suhu} onChangeText={(val) => setSuhu(val.replace(/[^0-9.]/g, ''))} keyboardType="numeric" placeholder="0" placeholderTextColor="#999" />
              </View>
              <View style={styles.unitLabel}>
                <Text style={styles.unitLabelText}>°C</Text>
              </View>
            </View>
          </View>

          {/* Durasi */}
          <View style={styles.fieldSpacing}>
            <Text style={styles.label}>
              Durasi <Text style={{ color: '#8B2D2D' }}>*</Text>
            </Text>
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

          {/* Tenaga Kerja */}
          <View style={styles.fieldSpacing}>
            <Text style={styles.label}>
              Tenaga Kerja <Text style={{ color: '#8B2D2D' }}>*</Text>
            </Text>
            <View style={styles.unitBox}>
              <View style={styles.unitInputArea}>
                <TextInput
                  style={styles.inputText}
                  value={tenagaKerja}
                  onChangeText={(val) => setTenagaKerja(val.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.unitLabel}>
                <Text style={styles.unitLabelText}>Orang</Text>
              </View>
            </View>
          </View>

          {/* Gambar */}
          <ImageUploadBox
            label="Gambar"
            photo={photo}
            onUpload={handleUpload}
            onRemove={() => setPhoto(null)}
          />

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <RoundedButton
              label="ADD"
              backgroundColor="#1D4949"
              onPress={handleAdd}
            />
            <RoundedButton
              label="RESET"
              backgroundColor="#8B2D2D"
              onPress={resetForm}
            />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFF9F2',
  },
  dateText: { color: '#333', fontSize: 14 },
  fieldSpacing: { marginBottom: 16 },
  readOnlyBox: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: '#FFF9F2',
    justifyContent: 'center',
  },
  readOnlyText: { fontSize: 14, color: '#333' },
  textInputBox: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 12,
    backgroundColor: '#FFF9F2',
    fontSize: 14,
    color: '#333',
  },
  unitBox: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 12,
    backgroundColor: '#FFF9F2',
    overflow: 'hidden',
    height: 48,
    marginTop: 8,
  },
  unitInputArea: { flex: 1, paddingHorizontal: 12, justifyContent: 'center' },
  unitLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 8,
    borderLeftWidth: 1,
    borderLeftColor: '#000',
    height: '100%',
    minWidth: 55,
  },
  unitLabelText: { fontSize: 14, fontWeight: '500', color: '#333', marginRight: 4 },
  inputText: { fontSize: 14, color: '#333', paddingVertical: 0 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  timeBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: '#FFF9F2',
  },
  timeLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  previewImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 10 },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});
