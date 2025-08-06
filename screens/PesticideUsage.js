import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SvgXml } from 'react-native-svg';
import StatusBarCustom from '../components/statusbar';
import Header from '../components/Header';
import AddNewButton from '../components/AddNewButton';
import DropdownInput from '../components/DropdownInput';
import DropdownBox from '../components/DropdownBox';
import NumericRangeInput from '../components/NumericRangeInput';
import CollapsibleMultiselect from '../components/CollapseMulti';

const backArrowSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="19" height="30" viewBox="0 0 19 30" fill="none">
  <path d="M15.4537 30L0.859123 15L15.4537 0L18.8591 3.5L7.66993 15L18.8591 26.5L15.4537 30Z" fill="#FBF7EB"/>
</svg>
`;

const calendarSvg = `
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="teal" stroke-width="1.5">
  <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 7.5h18M4.5 6.75h15A1.5 1.5 0 0 1 21 8.25v11.25a1.5 1.5 0 0 1-1.5 1.5h-15a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5Z" />
</svg>
`;

export default function PesticideUsagePage() {
  const navigation = useNavigation();

  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedPest, setSelectedPest] = useState('');
  const [selectedPesticide, setSelectedPesticide] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [doseFrom, setDoseFrom] = useState('');
  const [doseTo, setDoseTo] = useState('');
  const [tempFrom, setTempFrom] = useState('');
  const [tempTo, setTempTo] = useState('');
  const [selectedColumns, setSelectedColumns] = useState([]);

  const [dropdownOpen, setDropdownOpen] = useState({ lokasi: false, hama: false, pestisida: false });

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

  const tableColumnOptions = [
    'No.', 'Tanggal & Waktu', 'Lokasi', 'Hama', 'Pestisida', 'Dosis', 'Penggunaan', 'Mulai', 'Selesai', 'Durasi',
    'Perawatan', 'Penanggung Jawab', 'Tenaga Kerja', 'Suhu', 'Gambar', 'Deskripsi'
  ];

  const closeAllDropdowns = () => {
    setDropdownOpen({ lokasi: false, hama: false, pestisida: false });
  };

  return (
    <TouchableWithoutFeedback onPress={() => {
      Keyboard.dismiss();
      closeAllDropdowns();
    }}>
      <View style={styles.container}>
        <StatusBarCustom backgroundColor="#1D4949" />
        <Header
          title="Pesticide Usage"
          logoSvg={backArrowSvg}
          onLeftPress={() => navigation.navigate('Home')}
          showHomeButton={false}
        />

        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          {/* Updated Add New Button to navigate */}
          <AddNewButton onPress={() => navigation.navigate('FormPesticideUsage')} />

          <View style={styles.formSection}>
            <DropdownInput
              label="Lokasi"
              value={selectedLocation}
              onPress={() => setDropdownOpen((prev) => ({ lokasi: !prev.lokasi, hama: false, pestisida: false }))}
            />
            {dropdownOpen.lokasi && (
              <DropdownBox items={lokasiOptions} onSelect={(option) => { setSelectedLocation(option); closeAllDropdowns(); }} />
            )}

            <DropdownInput
              label="Hama"
              value={selectedPest}
              onPress={() => setDropdownOpen((prev) => ({ lokasi: false, hama: !prev.hama, pestisida: false }))}
            />
            {dropdownOpen.hama && (
              <DropdownBox items={hamaOptions} onSelect={(option) => { setSelectedPest(option); closeAllDropdowns(); }} />
            )}

            <DropdownInput
              label="Pestisida"
              value={selectedPesticide}
              onPress={() => setDropdownOpen((prev) => ({ lokasi: false, hama: false, pestisida: !prev.pestisida }))}
            />
            {dropdownOpen.pestisida && (
              <DropdownBox items={pestisidaOptions} onSelect={(option) => { setSelectedPesticide(option); closeAllDropdowns(); }} />
            )}

            <Text style={styles.dateLabel}>Tanggal</Text>
            <View style={styles.dateRow}>
              <TouchableOpacity style={styles.dateBox} onPress={() => setShowStart(true)}>
                <Text style={styles.dateText}>{startDate ? startDate.toLocaleDateString() : 'Start'}</Text>
                <SvgXml xml={calendarSvg} width={20} height={20} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.dateBox} onPress={() => setShowEnd(true)}>
                <Text style={styles.dateText}>{endDate ? endDate.toLocaleDateString() : 'End'}</Text>
                <SvgXml xml={calendarSvg} width={20} height={20} />
              </TouchableOpacity>
            </View>

            {showStart && (
              <DateTimePicker
                value={startDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowStart(false);
                  if (selectedDate) setStartDate(selectedDate);
                }}
              />
            )}

            {showEnd && (
              <DateTimePicker
                value={endDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowEnd(false);
                  if (selectedDate) setEndDate(selectedDate);
                }}
              />
            )}

            <Text style={styles.dateLabel}>Dosis</Text>
            <NumericRangeInput
              fromValue={doseFrom}
              toValue={doseTo}
              setFromValue={(val) => setDoseFrom(val.replace(/[^0-9]/g, ''))}
              setToValue={(val) => setDoseTo(val.replace(/[^0-9]/g, ''))}
            />

            <Text style={styles.dateLabel}>Suhu (°C)</Text>
            <NumericRangeInput
              fromValue={tempFrom}
              toValue={tempTo}
              setFromValue={(val) => setTempFrom(val.replace(/[^0-9]/g, ''))}
              setToValue={(val) => setTempTo(val.replace(/[^0-9]/g, ''))}
            />
            
            <CollapsibleMultiselect
              label="Kolom"
              items={tableColumnOptions}
              selectedItems={selectedColumns}
              onToggle={(item) => {
                setSelectedColumns((prev) =>
                  prev.includes(item)
                    ? prev.filter((i) => i !== item)
                    : [...prev, item]
                );
              }}
            />
          </View>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F2',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  formSection: {
    marginTop: 18,
    gap: 12,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginTop: 10,
    marginBottom: 6,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  dateBox: {
    flex: 1,
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
  dateText: {
    color: '#333',
    fontSize: 14,
  },
});
