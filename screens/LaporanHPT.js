import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SvgXml } from 'react-native-svg';
import Svg, { Line, Circle, Polyline, Text as SvgText } from 'react-native-svg';
import { useKindeAuth } from '@kinde/expo';

import StatusBarCustom from '../components/statusbar';
import Header from '../components/Header';
import DropdownInput from '../components/DropdownInput';
import DropdownBox from '../components/DropdownBox';

/** ---------- Config from environment ---------- */
const API_BASE = process.env.EXPO_PUBLIC_API_BASE;

// --- SVGs ---
const backArrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="19" height="30" viewBox="0 0 19 30" fill="none"><path d="M15.4537 30L0.859123 15L15.4537 0L18.8591 3.5L7.66993 15L18.8591 26.5L15.4537 30Z" fill="#FBF7EB"/></svg>`;
const calendarSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="teal" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 7.5h18M4.5 6.75h15A1.5 1.5 0 0 1 21 8.25v11.25a1.5 1.5 0 0 1-1.5 1.5h-15a1.5 1.5 0 0 1-1.5-1.5Z" /></svg>`;
const filterSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M2 4h16M4 10h12M7 16h6" stroke="#FBF7EB" stroke-width="2" stroke-linecap="round"/></svg>`;

/**
 * Get last Monday and last Sunday based on current date
 * Example: If today is Nov 19, 2025 (Tuesday), returns Nov 10 (Monday) and Nov 16 (Sunday)
 */
const getDefaultDateRange = () => {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // Calculate days to go back to last Monday (Monday of last week)
  // If today is Monday (1), last Monday is 7 days ago
  // If today is Tuesday-Saturday (2-6), last Monday is (currentDay + 7) days ago
  // If today is Sunday (0), last Monday is 13 days ago (6 + 7)
  let daysToLastMonday;
  if (currentDay === 0) {
    daysToLastMonday = 13; // Sunday: go back to Monday of last week
  } else if (currentDay === 1) {
    daysToLastMonday = 7; // Monday: go back 7 days
  } else {
    daysToLastMonday = currentDay + 7; // Tuesday-Saturday: currentDay + 7
  }
  
  const lastMonday = new Date(today);
  lastMonday.setDate(today.getDate() - daysToLastMonday);
  lastMonday.setHours(0, 0, 0, 0);
  
  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6);
  lastSunday.setHours(23, 59, 59, 999);
  
  return { startDate: lastMonday, endDate: lastSunday };
};

export default function LaporanHPTPage() {
  const navigation = useNavigation();
  const { getAccessToken, isAuthenticated } = useKindeAuth();

  // Date range with default to last Monday-Sunday
  const defaultDates = getDefaultDateRange();
  const [startDate, setStartDate] = useState(defaultDates.startDate);
  const [endDate, setEndDate] = useState(defaultDates.endDate);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Filter visibility
  const [showFilters, setShowFilters] = useState(false);

  // Location options and selection
  const [locationObjects, setLocationObjects] = useState([]);
  const [locationOptions, setLocationOptions] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [loading, setLoading] = useState({ locations: false, hpt: false });

  // Pest/Disease selection
  const [activeType, setActiveType] = useState('Hama'); // 'Hama' or 'Penyakit'
  const [selectedPest, setSelectedPest] = useState(null);
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [pestOptions, setPestOptions] = useState([]);
  const [diseaseOptions, setDiseaseOptions] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState({ pest: false, disease: false });

  // HPT report data
  const [hptData, setHptData] = useState({
    average: 0,
    previousAverage: 0,
    locations: [],
  });

  const getAuthHeaders = useCallback(async () => {
    try {
      const audience = process.env.EXPO_PUBLIC_KINDE_AUDIENCE;
      const token = await getAccessToken(audience);
      return {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };
    } catch (error) {
      throw error;
    }
  }, [getAccessToken]);

  // Helper functions for location
  const getLocationName = (loc) => {
    return loc?.name || loc?.label || loc?.title || loc?.nama || loc?.nama_lokasi || loc?.location_name || String(loc);
  };

  const getLocationId = (loc) => {
    return loc?.id || loc?.location_id || loc?.lokasi_id || loc?.id_lokasi || null;
  };

  // Fetch location options
  const fetchLocationOptions = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, locations: true }));
      
      const headers = await getAuthHeaders();
      const url = `${API_BASE}/location/dropdown?search&concise=true&nursery=false&pageSize=100`;
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      const locations = result.data || result || [];
      setLocationObjects(locations);
      
      const locationNames = locations
        .map(getLocationName)
        .filter(name => name && name.trim().length > 0);
      
      const uniqueLocations = Array.from(new Set(locationNames)).sort();
      setLocationOptions(uniqueLocations);
      
      // Select all by default
      setSelectedLocations(uniqueLocations);
      
    } catch (error) {
      Alert.alert(
        'Gagal Memuat Data',
        'Gagal mendapatkan daftar lokasi. Silakan coba lagi.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setLoading((prev) => ({ ...prev, locations: false }));
    }
  }, [getAuthHeaders]);

  // Fetch pest options (Hama)
  const fetchPestOptions = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const url = `${API_BASE}/hama?ops=true&pest=true`;
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      const pests = result.data || result || [];
      const pestNames = pests
        .map(item => item?.name || item?.nama || item?.label || String(item))
        .filter(name => name && name.trim().length > 0);
      
      setPestOptions(pestNames);
      
      // Set first pest as default if none selected
      if (!selectedPest && pestNames.length > 0) {
        setSelectedPest(pestNames[0]);
      }
      
    } catch (error) {
      console.error('Failed to fetch pest options:', error);
    }
  }, [getAuthHeaders, selectedPest]);

  // Fetch disease options (Penyakit)
  const fetchDiseaseOptions = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const url = `${API_BASE}/hama?ops=true&pest=false`;
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      const diseases = result.data || result || [];
      const diseaseNames = diseases
        .map(item => item?.name || item?.nama || item?.label || String(item))
        .filter(name => name && name.trim().length > 0);
      
      setDiseaseOptions(diseaseNames);
      
      // Set first disease as default if none selected
      if (!selectedDisease && diseaseNames.length > 0) {
        setSelectedDisease(diseaseNames[0]);
      }
      
    } catch (error) {
      console.error('Failed to fetch disease options:', error);
    }
  }, [getAuthHeaders, selectedDisease]);

  // Get location IDs from selected location names
  const getLocationIds = useCallback(() => {
    const locationIdMap = {};
    locationObjects.forEach(loc => {
      const name = getLocationName(loc);
      const id = getLocationId(loc);
      if (name && id != null) {
        locationIdMap[name] = id;
      }
    });

    return selectedLocations
      .map(name => locationIdMap[name])
      .filter(id => id != null)
      .join(',');
  }, [locationObjects, selectedLocations]);

  // Fetch HPT report data
  const fetchHPTData = useCallback(async () => {
    if (selectedLocations.length === 0) {
      return; // Don't fetch if no locations selected
    }

    const selectedItem = activeType === 'Hama' ? selectedPest : selectedDisease;
    if (!selectedItem) {
      return; // Don't fetch if no pest/disease selected
    }

    try {
      setLoading((prev) => ({ ...prev, hpt: true }));
      
      const headers = await getAuthHeaders();
      const locationIds = getLocationIds();
      const startDateStr = formatDate(startDate);
      const endDateStr = formatDate(endDate);
      
      const url = `${API_BASE}/report/ops/hpt?location_id=${locationIds}&startDate=${startDateStr}&endDate=${endDateStr}&period=daily`;
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      
      // Get the appropriate section (pest or disease)
      const section = activeType === 'Hama' ? result.pest : result.disease;
      if (!section || !section.trend) {
        setHptData({ average: 0, previousAverage: 0, locations: [] });
        return;
      }
      
      // Find the selected pest/disease in the trend array
      const trendItem = section.trend.find(item => item.name === selectedItem);
      
      if (!trendItem) {
        setHptData({ average: 0, previousAverage: 0, locations: [] });
        return;
      }
      
      // Get KPI data for average calculation
      const kpi = section.kpi || {};
      const itemNameLower = selectedItem.toLowerCase().replace(/\s+/g, '_');
      const totalKey = `total_${itemNameLower}`;
      const lastWeekKey = `last_week_total_${itemNameLower}`;
      
      const average = kpi[totalKey] || 0;
      const previousAverage = kpi[lastWeekKey] || 0;
      
      // Transform locations data
      // Filter to only show locations that are:
      // 1. Not hidden
      // 2. In the selectedLocations list
      const locations = trendItem.locations
        .filter(loc => !loc.hidden && selectedLocations.includes(loc.location_name))
        .map(loc => {
          // Transform dates array
          // Skip entries with undefined/null values, but keep zero values
          const data = (loc.dates || [])
            .map(d => {
              // Handle both 'date' (ISO string) and 'datetime' (formatted string) formats
              const dateStr = d.date || d.datetime || '';
              // Parse date string to extract date part
              let dateValue = dateStr;
              if (dateStr.includes('T')) {
                // ISO format: "2025-09-17T00:00:00Z" -> "2025-09-17"
                dateValue = dateStr.split('T')[0];
              } else if (dateStr.includes(' ')) {
                // Datetime format: "2025-09-17 00:00:00" -> "2025-09-17"
                dateValue = dateStr.split(' ')[0];
              }
              
              // Check if score exists (not undefined/null), but allow 0
              const score = d.score;
              if (score === undefined || score === null) {
                return null; // Will be filtered out
              }
              
              return {
                date: dateValue,
                value: score,
              };
            })
            .filter(d => d !== null); // Remove entries with undefined/null values
          
          return {
            name: loc.location_name || '',
            data: data,
          };
        });
      
      const transformed = {
        average: average,
        previousAverage: previousAverage,
        locations: locations,
      };
      
      setHptData(transformed);
      
    } catch (error) {
      console.error('Failed to fetch HPT data:', error);
      Alert.alert(
        'Gagal Memuat Data',
        'Gagal mendapatkan data HPT. Silakan coba lagi.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setLoading((prev) => ({ ...prev, hpt: false }));
    }
  }, [getAuthHeaders, startDate, endDate, selectedLocations, activeType, selectedPest, selectedDisease, getLocationIds]);

  useEffect(() => {
    fetchLocationOptions();
    fetchPestOptions();
    fetchDiseaseOptions();
  }, [fetchLocationOptions, fetchPestOptions, fetchDiseaseOptions]);

  // Fetch HPT data when filters change
  useEffect(() => {
    if (locationObjects.length > 0 && selectedLocations.length > 0) {
      const selectedItem = activeType === 'Hama' ? selectedPest : selectedDisease;
      if (selectedItem) {
        fetchHPTData();
      }
    }
  }, [startDate, endDate, selectedLocations, locationObjects.length, activeType, selectedPest, selectedDisease, fetchHPTData]);

  // Format date to Indonesian format
  const formatDateIndonesian = (date) => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Format date to yyyy-mm-dd
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Format percentage (convert decimal to percentage)
  const formatPercentage = (value, decimals = 2) => {
    if (value === null || value === undefined || !isFinite(value)) {
      return '0,00%';
    }
    // Convert decimal to percentage (0.012 -> 1.2%)
    const numValue = Number(value) * 100;
    const fixed = numValue.toFixed(decimals);
    const parts = fixed.split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const decimalPart = parts[1] || '';
    return decimalPart ? `${integerPart},${decimalPart}%` : `${integerPart}%`;
  };

  // Calculate percentage change
  const calculatePercentageChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Toggle location selection
  const toggleLocation = (locationName) => {
    setSelectedLocations(prev => {
      if (prev.includes(locationName)) {
        return prev.filter(loc => loc !== locationName);
      } else {
        return [...prev, locationName].sort();
      }
    });
  };

  // Close all dropdowns
  const closeAllDropdowns = () => {
    setDropdownOpen({ pest: false, disease: false });
  };

  // Render filter box
  const renderFilterBox = () => {
    if (!showFilters) return null;

    return (
      <View style={styles.filterBox}>
        {/* Date Range */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Rentang Tanggal</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateInput}>
              <Text style={styles.dateLabel}>Dari</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartPicker(true)}
              >
                <Text style={styles.dateText}>{formatDateIndonesian(startDate)}</Text>
                <SvgXml xml={calendarSvg} width={20} height={20} />
              </TouchableOpacity>
              {showStartPicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="default"
                  onChange={(e, date) => {
                    setShowStartPicker(false);
                    if (date) setStartDate(date);
                  }}
                />
              )}
            </View>
            <View style={styles.dateInput}>
              <Text style={styles.dateLabel}>Hingga</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndPicker(true)}
              >
                <Text style={styles.dateText}>{formatDateIndonesian(endDate)}</Text>
                <SvgXml xml={calendarSvg} width={20} height={20} />
              </TouchableOpacity>
              {showEndPicker && (
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display="default"
                  onChange={(e, date) => {
                    setShowEndPicker(false);
                    if (date) setEndDate(date);
                  }}
                />
              )}
            </View>
          </View>
        </View>

        {/* Location Selection */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Lokasi</Text>
          <View style={styles.locationGrid}>
            {locationOptions.map((location) => (
              <TouchableOpacity
                key={location}
                style={[
                  styles.locationCheckbox,
                  selectedLocations.includes(location) && styles.locationCheckboxSelected
                ]}
                onPress={() => toggleLocation(location)}
              >
                <Text style={[
                  styles.locationCheckboxText,
                  selectedLocations.includes(location) && styles.locationCheckboxTextSelected
                ]}>
                  {location}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Pest/Disease Tabs */}
        <View style={styles.filterSection}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeType === 'Hama' && styles.tabActive]}
              onPress={() => {
                setActiveType('Hama');
                closeAllDropdowns();
                // Reset to first pest if available
                if (pestOptions.length > 0 && !selectedPest) {
                  setSelectedPest(pestOptions[0]);
                }
              }}
            >
              <Text style={[styles.tabText, activeType === 'Hama' && styles.tabTextActive]}>
                Hama
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeType === 'Penyakit' && styles.tabActive]}
              onPress={() => {
                setActiveType('Penyakit');
                closeAllDropdowns();
                // Reset to first disease if available
                if (diseaseOptions.length > 0 && !selectedDisease) {
                  setSelectedDisease(diseaseOptions[0]);
                }
              }}
            >
              <Text style={[styles.tabText, activeType === 'Penyakit' && styles.tabTextActive]}>
                Penyakit
              </Text>
            </TouchableOpacity>
          </View>

          {/* Dropdown for Pest/Disease */}
          <View style={styles.dropdownContainer}>
            <DropdownInput
              label={`${activeType}*`}
              value={activeType === 'Hama' ? (selectedPest || 'Pilih Hama') : (selectedDisease || 'Pilih Penyakit')}
              onPress={() => {
                if (activeType === 'Hama') {
                  setDropdownOpen({ pest: !dropdownOpen.pest, disease: false });
                } else {
                  setDropdownOpen({ pest: false, disease: !dropdownOpen.disease });
                }
              }}
            />
            {activeType === 'Hama' && dropdownOpen.pest && (
              <DropdownBox
                items={pestOptions}
                onSelect={(option) => {
                  setSelectedPest(option);
                  closeAllDropdowns();
                }}
              />
            )}
            {activeType === 'Penyakit' && dropdownOpen.disease && (
              <DropdownBox
                items={diseaseOptions}
                onSelect={(option) => {
                  setSelectedDisease(option);
                  closeAllDropdowns();
                }}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  // Render line graph
  const renderLineGraph = (data, locationName) => {
    // Clean data: skip undefined/null but keep zero values
    const cleanedData = (data || []).filter(d => d.value !== undefined && d.value !== null);
    
    if (!cleanedData || cleanedData.length === 0) {
      return (
        <View style={styles.emptyGraph}>
          <Text style={styles.emptyGraphText}>Tidak ada data</Text>
        </View>
      );
    }

    const baseGraphWidth = Dimensions.get('window').width - 80;
    const graphHeight = 240;
    const padding = 40;
    const minDataPointWidth = 40; // Minimum width per data point
    
    // Calculate dynamic width: ensure minimum width per data point for readability
    const minWidth = Math.max(baseGraphWidth, cleanedData.length * minDataPointWidth);
    const chartWidth = minWidth - padding * 2;
    const chartHeight = graphHeight - padding * 2 - 30; // Extra space for rotated labels

    // Calculate min/max values
    const values = cleanedData.map(d => d.value);
    const maxValue = Math.max(...values, 10);
    const minValue = 0;

    // Y-axis range (0 to max, with some padding)
    const yRange = maxValue - minValue;
    const yScale = chartHeight / (yRange || 1); // Avoid division by zero

    // X-axis points
    const xStep = cleanedData.length > 1 ? chartWidth / (cleanedData.length - 1) : 0;

    // Generate points for the line
    const points = cleanedData.map((d, index) => {
      const x = padding + index * xStep;
      const y = padding + chartHeight - (d.value - minValue) * yScale;
      return `${x},${y}`;
    }).join(' ');

    // Reference lines
    const warningLineY = padding + chartHeight - (5 - minValue) * yScale;
    const dangerLineY = padding + chartHeight - (10 - minValue) * yScale;

    // Limit X-axis labels to max 6 per chart
    const maxLabels = 6;
    const labelInterval = Math.ceil(cleanedData.length / maxLabels);

    // Use smaller dots when dataset is large
    const pointRadius = cleanedData.length > 40 ? 2 : 4;

    return (
      <View style={styles.graphContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ minWidth: minWidth }}
        >
          <Svg width={minWidth} height={graphHeight}>
          {/* Grid lines */}
          <Line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={padding + chartHeight}
            stroke="#E0E0E0"
            strokeWidth="1"
          />
          <Line
            x1={padding}
            y1={padding + chartHeight}
            x2={padding + chartWidth}
            y2={padding + chartHeight}
            stroke="#E0E0E0"
            strokeWidth="1"
          />

          {/* Reference lines */}
          <Line
            x1={padding}
            y1={warningLineY}
            x2={padding + chartWidth}
            y2={warningLineY}
            stroke="#FF9800"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
          <Line
            x1={padding}
            y1={dangerLineY}
            x2={padding + chartWidth}
            y2={dangerLineY}
            stroke="#F44336"
            strokeWidth="1"
            strokeDasharray="4,4"
          />

          {/* Data line */}
          <Polyline
            points={points}
            fill="none"
            stroke="#64B5F6"
            strokeWidth="2"
          />

          {/* Data points */}
          {cleanedData.map((d, index) => {
            const x = padding + index * xStep;
            const y = padding + chartHeight - (d.value - minValue) * yScale;
            return (
              <Circle
                key={index}
                cx={x}
                cy={y}
                r={pointRadius}
                fill="#64B5F6"
              />
            );
          })}

          {/* Y-axis labels */}
          {[0, 5, 10].map((value) => {
            const y = padding + chartHeight - (value - minValue) * yScale;
            return (
              <SvgText
                key={value}
                x={padding - 10}
                y={y + 4}
                fontSize="10"
                fill="#666"
                textAnchor="end"
              >
                {value}
              </SvgText>
            );
          })}

          {/* X-axis labels (dates) - limited to max 6 labels */}
          {cleanedData.map((d, index) => {
            // Only show label if it matches the interval
            const showLabel = index % labelInterval === 0;
            if (!showLabel) return null;
            
            const x = padding + index * xStep;
            const labelY = padding + chartHeight + 25;
            return (
              <SvgText
                key={index}
                x={x}
                y={labelY}
                fontSize="9"
                fill="#666"
                textAnchor="middle"
                transform={`rotate(-45 ${x} ${labelY})`}
              >
                {d.date.split('-').slice(1).join('/')}
              </SvgText>
            );
          })}
        </Svg>
        </ScrollView>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#64B5F6' }]} />
            <Text style={styles.legendText}>{activeType === 'Hama' ? selectedPest : selectedDisease}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBarCustom backgroundColor="#1D4949" />
      <Header
        title="Laporan HPT"
        logoSvg={backArrowSvg}
        onLeftPress={() => navigation.navigate('Home')}
        showHomeButton={false}
      />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>LAPORAN HPT</Text>

        {/* Filter Button */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <SvgXml xml={filterSvg} width={20} height={20} />
          <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>

        {/* Filter Box */}
        {renderFilterBox()}

        {/* Loading Indicator */}
        {(loading.locations || loading.hpt) && (
          <ActivityIndicator size="large" color="#1D4949" style={{ marginTop: 20 }} />
        )}

        {/* Summary Statistics */}
        {(loading.hpt || hptData.locations.length > 0 || hptData.average > 0) && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
              Rata Rata {activeType === 'Hama' ? (selectedPest || 'Hama') : (selectedDisease || 'Penyakit')}
          </Text>
            <Text style={styles.summaryValue}>
              {formatPercentage(hptData.average)} <Text style={styles.summaryUnit}>({formatPercentage(Math.abs(calculatePercentageChange(hptData.average, hptData.previousAverage)))})</Text>
            </Text>
          <Text style={styles.summaryPrevious}>
            periode lalu : {formatPercentage(hptData.previousAverage)}
          </Text>
        </View>
        )}

        {/* Location Sections */}
        {hptData.locations.map((location, index) => (
          <View key={index} style={styles.locationSection}>
            <Text style={styles.locationTitle}>{location.name}</Text>
            {renderLineGraph(location.data, location.name)}
          </View>
        ))}
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
    paddingBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1D4949',
    textAlign: 'center',
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1D4949',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  filterButtonText: {
    color: '#FBF7EB',
    fontWeight: 'bold',
    fontSize: 14,
  },
  filterBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFF',
  },
  dateText: {
    fontSize: 14,
    color: '#333',
  },
  locationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locationCheckbox: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
  },
  locationCheckboxSelected: {
    backgroundColor: '#1D4949',
    borderColor: '#1D4949',
  },
  locationCheckboxText: {
    fontSize: 12,
    color: '#333',
  },
  locationCheckboxTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#D7CCC8',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#5D4037',
    fontWeight: '600',
  },
  dropdownContainer: {
    marginTop: 8,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#9B1D20',
    padding: 20,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
  },
  summaryValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#8B2D2D',
    textAlign: 'center',
  },
  summaryUnit: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#666',
  },
  summaryPrevious: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  locationSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D4949',
    marginBottom: 16,
  },
  graphContainer: {
    alignItems: 'center',
  },
  legend: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 16,
    height: 3,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  emptyGraph: {
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyGraphText: {
    fontSize: 14,
    color: '#999',
  },
});

