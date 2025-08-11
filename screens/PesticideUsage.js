import React, { useEffect, useState, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableWithoutFeedback, Keyboard, Text, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SvgXml } from 'react-native-svg';
import Constants from 'expo-constants';

import StatusBarCustom from '../components/statusbar';
import Header from '../components/Header';
import AddNewButton from '../components/AddNewButton';
import DropdownInput from '../components/DropdownInput';
import DropdownBox from '../components/DropdownBox';
import NumericRangeInput from '../components/NumericRangeInput';
import CollapsibleMultiselect from '../components/CollapseMulti';

/** ---------- Config from app.json ---------- */
const extra = (Constants?.expoConfig?.extra) || (Constants?.manifest?.extra) || {};
const API_BASE     = extra.EXPO_PUBLIC_API_BASE || 'https://hyoshii-staging.rinal.dev/api/v1';
const API_BASE_2_  = extra.LOCATION_API_BASE || 'https://dashboard-back-dev.vercel.app/api/v1';
const PAGE_SIZE    = Number(extra.EXPO_PUBLIC_PAGE_SIZE || 10);
const MAX_PAGES    = 200;

/** Prefer exact paths from config; keep sensible fallbacks just in case */
const CANDIDATE_ENDPOINTS = {
  lokasi:    [extra.LOCATION_API_BASE_PATH || '/location'],
  hama:      [extra.EXPO_PUBLIC_PEST_PATH || '/hama', '/pest', '/pests', '/masterdata/pest'],
  pestisida: [extra.EXPO_PUBLIC_PESTICIDE_PATH || '/pesticide', '/pesticides', '/masterdata/pesticide'],
};

// Add Authorization etc. here if your Postman request has them
const getAuthHeaders = async () => ({
  Accept: 'application/json',
  'Content-Type': 'application/json',
  // Authorization: `Bearer <token>`,
});

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

export default function PesticideUsagePage() {
  const navigation = useNavigation();

  const [selectedLocation, setSelectedLocation]   = useState('');
  const [selectedPest, setSelectedPest]           = useState('');
  const [selectedPesticide, setSelectedPesticide] = useState('');

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate]     = useState(null);
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd]     = useState(false);
  const [doseFrom, setDoseFrom]   = useState('');
  const [doseTo, setDoseTo]       = useState('');
  const [tempFrom, setTempFrom]   = useState('');
  const [tempTo, setTempTo]       = useState('');
  const [selectedColumns, setSelectedColumns] = useState([]);

  const [dropdownOpen, setDropdownOpen] = useState({ lokasi: false, hama: false, pestisida: false });

  // API-driven options
  const [lokasiOptions, setLokasiOptions]       = useState([]);
  const [hamaOptions, setHamaOptions]           = useState([]);
  const [pestisidaOptions, setPestisidaOptions] = useState([]); // keep ALL rows

  const [loading, setLoading] = useState({ lokasi: false, hama: false, pestisida: false });
  const [error, setError]     = useState(null);

  const tableColumnOptions = [
    'No.', 'Tanggal & Waktu', 'Lokasi', 'Hama', 'Pestisida', 'Dosis', 'Penggunaan', 'Mulai', 'Selesai', 'Durasi',
    'Perawatan', 'Penanggung Jawab', 'Tenaga Kerja', 'Suhu', 'Gambar', 'Deskripsi'
  ];

  const closeAllDropdowns = () => setDropdownOpen({ lokasi: false, hama: false, pestisida: false });

  const toLabel = (x) => {
    if (typeof x === 'string') return x;
    if (!x || typeof x !== 'object') return '';
    return (
      x.name ?? x.label ?? x.title ?? x.nama ?? x.nama_lokasi ?? x.location_name ??
      x.lokasi ?? x.pestisida ?? x.hama ?? ''
    );
  };

  const buildUrl = (path, page = 1, pageSize = PAGE_SIZE) => {
    const p = new URLSearchParams();
    if (pageSize) p.set('pageSize', String(pageSize));
    if (page)     p.set('page', String(page));
    const base = path === '/location' ? API_BASE_2_ : API_BASE;
    return `${base}${path}?${p.toString()}`;
  };

  // EXACTLY like in Form: loop through pages until totalPages/last page
  const fetchAllPages = useCallback(async (path, pageSize = PAGE_SIZE) => {
    const headers = await getAuthHeaders();
    const all = [];
    let page = 1;
    let totalPagesKnown = null;

    while (page <= MAX_PAGES) {
      const url = buildUrl(path, page, pageSize);
      console.log(`[Usage fetch] GET ${url}`);
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

  const fetchOptions = useCallback(async (key) => {
    let lastErr = null;

    for (const path of CANDIDATE_ENDPOINTS[key]) {
      try {
        setLoading((s) => ({ ...s, [key]: true }));
        setError(null);

        const all = await fetchAllPages(path, PAGE_SIZE);

        if (key === 'pestisida') {
          // Normalize names and KEEP ALL rows (no filtering, no dedupe)
          const labels = all.map((x) => {
            const name = (x?.name ?? toLabel(x)) || 'Unknown';
            return String(name);
          }).sort((a, b) => a.localeCompare(b));

          setPestisidaOptions(labels);
          console.log(`[pestisida] rows=${all.length} labels=${labels.length} (normalized, no dedupe)`);
        } else {
          // lokasi / hama: unique list
          let labels = all.map(toLabel).filter((s) => typeof s === 'string' && s.trim().length > 0);
          if (labels.length === 0 && all.length > 0) {
            labels = all.map((x) => { try { return JSON.stringify(x); } catch { return String(x); } });
          }
          const uniqueSorted = Array.from(new Set(labels)).sort((a, b) => a.localeCompare(b));

          if (key === 'lokasi') setLokasiOptions(uniqueSorted);
          if (key === 'hama')   setHamaOptions(uniqueSorted);

          console.log(`[${key}] rows=${all.length} unique=${uniqueSorted.length}`);
        }

        return;
      } catch (e) {
        console.warn(`[${key}] failed on ${path}:`, e?.message || e);
        lastErr = e;
      } finally {
        setLoading((s) => ({ ...s, [key]: false }));
      }
    }

    const msg = (lastErr && (lastErr.message || String(lastErr))) || 'Unknown error';
    setError((prev) => (prev ? prev + ' | ' : '') + `Cannot load ${key}: ${msg}`);
  }, [fetchAllPages]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchOptions('lokasi'),
      fetchOptions('hama'),
      fetchOptions('pestisida'),
    ]);
  }, [fetchOptions]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return (
    <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); closeAllDropdowns(); }}>
      <View style={styles.container}>
        <StatusBarCustom backgroundColor="#1D4949" />
        <Header
          title="Pesticide Usage"
          logoSvg={backArrowSvg}
          onLeftPress={() => navigation.navigate('Home')}
          showHomeButton={false}
        />

        <View style={styles.statusRow}>
          {error ? <Text style={styles.statusError}>⚠️ {error}</Text> : null}
          {!error && (loading.lokasi || loading.hama || loading.pestisida)
            ? <Text style={styles.statusInfo}>Loading data…</Text>
            : <Text style={styles.statusOK}>API: {API_BASE} • pageSize={PAGE_SIZE}</Text>}
          <TouchableOpacity style={styles.refreshBtn} onPress={refreshAll}>
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <AddNewButton onPress={() => navigation.navigate('FormPesticideUsage')} />

          <View style={styles.formSection}>
            <DropdownInput
              label={`Lokasi${lokasiOptions.length ? ` (${lokasiOptions.length})` : ''}`}
              value={selectedLocation}
              onPress={() =>
                lokasiOptions.length &&
                setDropdownOpen((p) => ({ lokasi: !p.lokasi, hama: false, pestisida: false }))
              }
            />
            {dropdownOpen.lokasi && (
              <DropdownBox
                items={lokasiOptions}
                onSelect={(option) => { setSelectedLocation(option); closeAllDropdowns(); }}
              />
            )}

            <DropdownInput
              label={`Hama${hamaOptions.length ? ` (${hamaOptions.length})` : ''}`}
              value={selectedPest}
              onPress={() =>
                hamaOptions.length &&
                setDropdownOpen((p) => ({ lokasi: false, hama: !p.hama, pestisida: false }))
              }
            />
            {dropdownOpen.hama && (
              <DropdownBox
                items={hamaOptions}
                onSelect={(option) => { setSelectedPest(option); closeAllDropdowns(); }}
              />
            )}

            <DropdownInput
              label={`Pestisida${pestisidaOptions.length ? ` (${pestisidaOptions.length})` : ''}`}
              value={selectedPesticide}
              onPress={() =>
                setDropdownOpen((p) => ({ lokasi: false, hama: false, pestisida: !p.pestisida }))
              }
            />
            {dropdownOpen.pestisida && (
              <DropdownBox
                items={pestisidaOptions} // includes ALL (no dedupe)
                onSelect={(option) => { setSelectedPesticide(option); closeAllDropdowns(); }}
              />
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
                onChange={(event, selectedDate) => { setShowStart(false); if (selectedDate) setStartDate(selectedDate); }}
              />
            )}
            {showEnd && (
              <DateTimePicker
                value={endDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => { setShowEnd(false); if (selectedDate) setEndDate(selectedDate); }}
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
              onToggle={(item) =>
                setSelectedColumns((prev) =>
                  prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
                )
              }
            />
          </View>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F2' },
  statusRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 10 },
  statusInfo: { fontSize: 12, color: '#6b7280' },
  statusOK: { fontSize: 12, color: '#16a34a' },
  statusError: { fontSize: 12, color: '#dc2626', flex: 1 },
  refreshBtn: { marginLeft: 'auto', borderWidth: 1, borderColor: '#1D4949', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  refreshText: { fontSize: 12, color: '#1D4949', fontWeight: '600' },
  scrollContainer: { padding: 20, paddingBottom: 40 },
  formSection: { marginTop: 18, gap: 12 },
  dateLabel: { fontSize: 16, fontWeight: '600', color: '#000', marginTop: 10, marginBottom: 6 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  dateBox: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#000', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#FFF9F2' },
  dateText: { color: '#333', fontSize: 14 },
});
