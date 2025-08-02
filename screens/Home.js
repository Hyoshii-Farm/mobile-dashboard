import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import StatusBarCustom from '../components/statusbar';
import Header from '../components/Header';
import HomePageSection from '../components/HomePageSection';

// Placeholder icon button, update to each icon
const placeholderSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
    <circle cx="12" cy="12" r="10" fill="#1C1B1F"/>
  </svg>
`;

export default function Home() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <StatusBarCustom backgroundColor="#1D4949" />
      <Header title="HYOSHII FARM" />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <HomePageSection
          title="REPORTS"
          items={[
            { iconSvg: placeholderSvg, label: 'Packing', onPress: () => {} },
            { iconSvg: placeholderSvg, label: 'Reject Packing', onPress: () => {} },
            { iconSvg: placeholderSvg, label: 'Harvest', onPress: () => {} },
            { iconSvg: placeholderSvg, label: 'Seedling Stock', onPress: () => {} },
            { iconSvg: placeholderSvg, label: 'HPT IPM', onPress: () => {} },
            { iconSvg: placeholderSvg, label: 'Weather', onPress: () => {} },
            { iconSvg: placeholderSvg, label: 'Greenhouse', onPress: () => {} },
            { iconSvg: placeholderSvg, label: 'Reject GH', onPress: () => {} },
            { iconSvg: placeholderSvg, label: 'Productivity', onPress: () => {} },
            { iconSvg: placeholderSvg, label: 'Brix', onPress: () => {} },
            { iconSvg: placeholderSvg, label: 'HPT Nursery', onPress: () => {} },
            { iconSvg: placeholderSvg, label: 'Irrigation', onPress: () => {} },
          ]}
        />

        <HomePageSection
          title="HPT"
          items={[
            {
              iconSvg: placeholderSvg,
              label: 'Pesticide Usage',
              onPress: () => navigation.navigate('PesticideUsage'),
            },
            { iconSvg: placeholderSvg, label: 'HPT GH', onPress: () => {} },
            { iconSvg: placeholderSvg, label: 'HPT Nursery', onPress: () => {} },
          ]}
        />

        <HomePageSection
          title="IRRIGATION"
          items={[{ iconSvg: placeholderSvg, label: 'Drip In', onPress: () => {} }]}
        />

        <HomePageSection
          title="R & D"
          items={[
            { iconSvg: placeholderSvg, label: 'Tissue Culture', onPress: () => {} },
            { iconSvg: placeholderSvg, label: 'Predator Management', onPress: () => {} },
            { iconSvg: placeholderSvg, label: 'Seedling Stocks', onPress: () => {} },
          ]}
        />

        <HomePageSection
          title="OPERATIONAL"
          items={[
            { iconSvg: placeholderSvg, label: 'Brix', onPress: () => {} },
            { iconSvg: placeholderSvg, label: 'Harvest', onPress: () => {} },
            { iconSvg: placeholderSvg, label: 'Reject GH', onPress: () => {} },
            { iconSvg: placeholderSvg, label: 'Forecast', onPress: () => {} },
            { iconSvg: placeholderSvg, label: 'Mortality', onPress: () => {} },
          ]}
        />

        <HomePageSection
          title="DATA"
          items={[
            { iconSvg: placeholderSvg, label: 'Fruits', onPress: () => {} },
            { iconSvg: placeholderSvg, label: 'Product', onPress: () => {} },
            { iconSvg: placeholderSvg, label: 'Predator', onPress: () => {} },
            { iconSvg: placeholderSvg, label: 'Pesticide', onPress: () => {} },
            { iconSvg: placeholderSvg, label: 'PIC', onPress: () => {} },
            { iconSvg: placeholderSvg, label: 'Location', onPress: () => {} },
            { iconSvg: placeholderSvg, label: 'Hama', onPress: () => {} },
          ]}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F2',
  },
  scrollContainer: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
});
