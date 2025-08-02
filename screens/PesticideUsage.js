import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import StatusBarCustom from '../components/statusbar';
import Header from '../components/Header';
import AddNewButton from '../components/AddNewButton';
import DropdownInput from '../components/DropdownInput';
import DropdownBox from '../components/DropdownBox';

const backArrowSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="19" height="30" viewBox="0 0 19 30" fill="none">
  <path d="M15.4537 30L0.859123 15L15.4537 0L18.8591 3.5L7.66993 15L18.8591 26.5L15.4537 30Z" fill="#FBF7EB"/>
</svg>
`;

export default function PesticideUsagePage() {
  const navigation = useNavigation();

  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedPest, setSelectedPest] = useState('');
  const [selectedPesticide, setSelectedPesticide] = useState('');

  const [dropdownOpen, setDropdownOpen] = useState({
    lokasi: false,
    hama: false,
    pestisida: false,
  });

  const lokasiOptions = ['Green House 1', 'Green House 2', 'Green House 3', 'Green House 4', 'Green House 5', 
                        'Outdoor 1', 'Outdoor 2', 'Outdoor 2 Baru ','Outdoor 3', 'Outdoor 4','Outdoor 5', 'Outdoor 6', 'Outdoor 7'
                        ,'Nursery 1', 'Nursery 2'];
  const hamaOptions = ['Antraknosa',
                        'Aphids',
                        'Botrytis',
                        'Erwinia',
                        'Fusarium',
                        'Jamur Hijau',
                        'Lalat',
                        'Lebah',
                    ];
  const pestisidaOptions = ['A', 'B', 'C'];

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
          <AddNewButton onPress={() => console.log('Add New Data pressed')} />

          <View style={styles.formSection}>
            {/* Lokasi */}
            <DropdownInput
              label="Lokasi"
              value={selectedLocation}
              onPress={() =>
                setDropdownOpen((prev) => ({
                  lokasi: !prev.lokasi,
                  hama: false,
                  pestisida: false,
                }))
              }
            />
            {dropdownOpen.lokasi && (
              <DropdownBox
                items={lokasiOptions}
                onSelect={(option) => {
                  setSelectedLocation(option);
                  closeAllDropdowns();
                }}
              />
            )}

            {/* Hama */}
            <DropdownInput
              label="Hama"
              value={selectedPest}
              onPress={() =>
                setDropdownOpen((prev) => ({
                  lokasi: false,
                  hama: !prev.hama,
                  pestisida: false,
                }))
              }
            />
            {dropdownOpen.hama && (
              <DropdownBox
                items={hamaOptions}
                onSelect={(option) => {
                  setSelectedPest(option);
                  closeAllDropdowns();
                }}
              />
            )}

            {/* Pestisida */}
            <DropdownInput
              label="Pestisida"
              value={selectedPesticide}
              onPress={() =>
                setDropdownOpen((prev) => ({
                  lokasi: false,
                  hama: false,
                  pestisida: !prev.pestisida,
                }))
              }
            />
            {dropdownOpen.pestisida && (
              <DropdownBox
                items={pestisidaOptions}
                onSelect={(option) => {
                  setSelectedPesticide(option);
                  closeAllDropdowns();
                }}
              />
            )}
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
    gap: 6,
  },
});
