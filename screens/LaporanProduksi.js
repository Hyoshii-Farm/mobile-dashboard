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
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { useKindeAuth } from '@kinde/expo';

import StatusBarCustom from '../components/statusbar';
import Header from '../components/Header';

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
  
  // Calculate days to go back to last Monday
  // If today is Monday (1), go back 7 days
  // If today is Tuesday (2), go back 8 days
  // If today is Sunday (0), go back 6 days
  const daysToLastMonday = currentDay === 0 ? 6 : currentDay + 6;
  
  const lastMonday = new Date(today);
  lastMonday.setDate(today.getDate() - daysToLastMonday);
  lastMonday.setHours(0, 0, 0, 0);
  
  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6);
  lastSunday.setHours(23, 59, 59, 999);
  
  return { startDate: lastMonday, endDate: lastSunday };
};

export default function LaporanProduksiPage() {
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
  const [locationObjects, setLocationObjects] = useState([]); // Store full location objects
  const [locationOptions, setLocationOptions] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [loading, setLoading] = useState({ locations: false, production: false });

  // Active tab: 'Packing', 'Reject', 'Panen'
  const [activeTab, setActiveTab] = useState('Packing');

  // Production data from API
  const [productionData, setProductionData] = useState({
    packing: {
      totalPack: 0,
      totalTochio: 0,
      totalMomoka: 0,
      periodePack: 0,
      periodeTochio: 0,
      periodeMomoka: 0,
      details: [],
    },
    reject: {
      totalRatio: 0,
      periodeRatio: 0,
      details: [],
    },
    panen: {
      totalPanen: 0,
      totalReject: 0,
      efisiensi: 0,
      periodePanen: 0,
      periodeReject: 0,
      periodeEfisiensi: 0,
      details: [],
    },
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
      console.error('Failed to get auth headers:', error);
      throw error;
    }
  }, [getAccessToken, isAuthenticated]);

  // Helper to get location ID from location object
  const getLocationId = (loc) => {
    return loc?.id || loc?.location_id || loc?.lokasi_id || loc?.id_lokasi || null;
  };

  // Helper to get location name from location object
  const getLocationName = (loc) => {
    return loc?.name || loc?.location_name || loc?.title || loc?.nama || String(loc);
  };

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
      
      // Store full location objects
      const locations = result.data || result || [];
      setLocationObjects(locations);
      
      // Extract location names for display
      const locationNames = locations
        .map(getLocationName)
        .filter(name => name && name.trim().length > 0);
      
      const uniqueLocations = Array.from(new Set(locationNames)).sort();
      setLocationOptions(uniqueLocations);
      
      // Select all locations by default
      setSelectedLocations(uniqueLocations);
      
    } catch (error) {
      console.error('Failed to fetch locations:', error);
      Alert.alert(
        'Gagal Memuat Data',
        'Gagal mendapatkan daftar lokasi. Silakan coba lagi.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setLoading((prev) => ({ ...prev, locations: false }));
    }
  }, [getAuthHeaders]);

  // Format date to yyyy-mm-dd
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Calculate percentage change
  const calculatePercentageChange = (current, previous) => {
    if (!previous || previous === 0) {
      // If previous is 0 and current is > 0, it's 100% increase
      // If both are 0, return 0
      return current > 0 ? 100 : 0;
    }
    const change = ((current - previous) / previous) * 100;
    // Handle edge cases
    if (!isFinite(change)) return 0;
    return change;
  };

  // Format percentage with arrow
  const formatPercentage = (current, previous) => {
    const change = calculatePercentageChange(current, previous);
    const arrow = change >= 0 ? '▲' : '▼';
    const absChange = Math.abs(change).toFixed(1);
    return `${arrow} ${absChange}%`;
  };

  // Format percentage from API (already calculated)
  const formatPercentageFromValue = (percentageValue) => {
    if (percentageValue === null || percentageValue === undefined || !isFinite(percentageValue)) {
      return '▲ 0.0%';
    }
    const arrow = percentageValue >= 0 ? '▲' : '▼';
    const absValue = Math.abs(percentageValue).toFixed(1);
    return `${arrow} ${absValue}%`;
  };

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

  // Fetch production data from API
  const fetchProductionData = useCallback(async () => {
    if (selectedLocations.length === 0) {
      return; // Don't fetch if no locations selected
    }

    try {
      setLoading((prev) => ({ ...prev, production: true }));
      
      const headers = await getAuthHeaders();
      const locationIds = getLocationIds();
      const startDateStr = formatDate(startDate);
      const endDateStr = formatDate(endDate);
      
      const url = `${API_BASE}/report/ops/production?start_date=${startDateStr}&end_date=${endDateStr}&period=daily&location_id=${locationIds}`;
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      
      // Transform API response to match UI structure
      const packingKpi = result.packing?.kpi || {};
      const tochioVariant = packingKpi.total_by_variant?.find(v => v.name === 'Tochiotome') || {};
      const momokaVariant = packingKpi.total_by_variant?.find(v => v.name === 'Momoka') || {};
      
      const rejectKpi = result.reject?.kpi || {};
      const rejectRatio = result.reject?.ratio || {};
      
      const harvestKpi = result.harvest?.kpi || {};
      const harvestEfficiency = result.harvest?.efficiency || {};
      const harvestDetail = result.harvest?.detail?.detail || [];
      
      const FLOAT32_MAX = 3.4028235e+38;
      const FLOAT32_MIN = -3.4028235e+38;
      const isPlaceholderValue = (val) => {
        return val === FLOAT32_MAX || val === FLOAT32_MIN;
      };
      
      const packingDetails = [];
      
      if (packingKpi.detail && Array.isArray(packingKpi.detail) && packingKpi.detail.length > 0) {
        packingKpi.detail.forEach(d => {
          const location = d.location || d.name || '';
          if (!location || location.trim().length === 0) return;
          
          const hasLowest = d.lowest !== undefined && d.lowest !== null && !isPlaceholderValue(d.lowest);
          const hasHighest = d.highest !== undefined && d.highest !== null && !isPlaceholderValue(d.highest);
          const hasActual = d.actual !== undefined && d.actual !== null && !isPlaceholderValue(d.actual);
          
          if (!hasLowest && !hasHighest && (!hasActual || d.actual === 0)) return;
          
          packingDetails.push({
            location: location,
            lowest: hasLowest ? d.lowest : (hasActual && !hasHighest ? d.actual : 0),
            highest: hasHighest ? d.highest : (hasActual && !hasLowest ? d.actual : 0),
            percentage: d.diff_actual || d.diff || 0,
          });
        });
      } else {
        const lowestLocation = packingKpi.lowest_location || '';
        const lowestValue = packingKpi.lowest;
        const highestLocation = packingKpi.highest_location || '';
        const highestValue = packingKpi.highest;
        
        if (lowestValue !== undefined && 
            lowestValue !== null && 
            !isPlaceholderValue(lowestValue) && 
            lowestValue !== 0 &&
            lowestLocation && 
            lowestLocation.trim().length > 0) {
          packingDetails.push({
            location: lowestLocation,
            lowest: lowestValue,
            highest: 0,
            percentage: packingKpi.diff_lowest || 0,
          });
        }
        
        if (highestValue !== undefined && 
            highestValue !== null && 
            !isPlaceholderValue(highestValue) && 
            highestValue !== 0 &&
            highestLocation && 
            highestLocation.trim().length > 0) {
          packingDetails.push({
            location: highestLocation,
            lowest: 0,
            highest: highestValue,
            percentage: packingKpi.diff_highest || 0,
          });
        }
      }
      
      const transformed = {
        packing: {
          totalPack: packingKpi.actual || 0,
          totalTochio: tochioVariant.actual || 0,
          totalMomoka: momokaVariant.actual || 0,
          periodePack: packingKpi.last_actual || 0,
          periodeTochio: tochioVariant.last_actual || 0,
          periodeMomoka: momokaVariant.last_actual || 0,
          details: packingDetails,
        },
        reject: {
          totalRatio: rejectRatio.actual || 0,
          periodeRatio: rejectRatio.last_actual || 0,
          details: rejectKpi.detail?.map(d => {
            const harvestLocationData = harvestDetail.find(h => h.location === d.name);
            const rejectAmount = d.actual || 0;
            const harvestAmount = harvestLocationData?.harvest || 0;
            const totalAmount = harvestAmount + rejectAmount;
            
            let calculatedRatio = 0;
            
            if (rejectAmount > 0 && rejectAmount <= 1) {
              calculatedRatio = rejectAmount * 100;
            } else if (rejectAmount > 0 && rejectAmount <= 100 && harvestAmount === 0) {
              calculatedRatio = rejectAmount;
            } else if (totalAmount > 0) {
              calculatedRatio = (rejectAmount / totalAmount) * 100;
              if (!isFinite(calculatedRatio)) calculatedRatio = 0;
            } else if (rejectAmount > 0) {
              calculatedRatio = 0;
            }
            
            return {
              location: d.name || '',
              ratio: calculatedRatio,
              percentage: d.diff_actual || 0,
            };
          }).filter(d => d.location && d.location.trim().length > 0) || [],
        },
        panen: {
          totalPanen: harvestKpi.actual || 0,
          totalReject: rejectKpi.actual || 0,
          efisiensi: harvestEfficiency.actual || 0,
          periodePanen: harvestKpi.last_actual || 0,
          periodeReject: rejectKpi.last_actual || 0,
          periodeEfisiensi: harvestEfficiency.last_actual || 0,
          details: harvestDetail.map(d => {
            let percentage = 0;
            if (d.diff !== undefined && d.diff !== null) {
              percentage = d.diff;
            } else if (d.diff_actual !== undefined && d.diff_actual !== null) {
              percentage = d.diff_actual;
            } else if (d.efficiency !== undefined && d.efficiency !== null) {
              percentage = d.efficiency - (harvestEfficiency.last_actual || 0);
            }
            
            return {
              location: d.location || '',
              kg: d.harvest || 0,
              reject: d.reject || 0,
              efficiency: d.efficiency || 0,
              percentage: percentage,
            };
          }),
        },
      };
      
      setProductionData(transformed);
      
    } catch (error) {
      console.error('Failed to fetch production data:', error);
      Alert.alert(
        'Gagal Memuat Data',
        'Gagal mendapatkan data produksi. Silakan coba lagi.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setLoading((prev) => ({ ...prev, production: false }));
    }
  }, [getAuthHeaders, startDate, endDate, selectedLocations, getLocationIds]);

  useEffect(() => {
    fetchLocationOptions();
  }, [fetchLocationOptions]);

  // Fetch production data when filters change
  useEffect(() => {
    if (locationObjects.length > 0 && selectedLocations.length > 0) {
      fetchProductionData();
    }
  }, [startDate, endDate, selectedLocations, locationObjects.length, fetchProductionData]);

  const toggleLocation = (location) => {
    setSelectedLocations((prev) => {
      if (prev.includes(location)) {
        return prev.filter((loc) => loc !== location);
      } else {
        return [...prev, location];
      }
    });
  };

  const toggleAllLocations = () => {
    if (selectedLocations.length === locationOptions.length) {
      setSelectedLocations([]);
    } else {
      setSelectedLocations([...locationOptions]);
    }
  };

  const renderFilterBox = () => {
    if (!showFilters) return null;

    return (
      <View style={styles.filterContainer}>
        {/* Date Range */}
        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>Dari</Text>
            <TouchableOpacity 
              style={styles.dateInput} 
              onPress={() => setShowStartPicker(true)}
            >
              <Text style={styles.dateText}>
                {startDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>Hingga</Text>
            <TouchableOpacity 
              style={styles.dateInput} 
              onPress={() => setShowEndPicker(true)}
            >
              <Text style={styles.dateText}>
                {endDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowStartPicker(false);
              if (selectedDate) setStartDate(selectedDate);
            }}
          />
        )}

        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowEndPicker(false);
              if (selectedDate) setEndDate(selectedDate);
            }}
          />
        )}

        {/* Location Checkboxes */}
        <View style={styles.locationSection}>
          <View style={styles.locationHeader}>
            <Text style={styles.locationLabel}>Lokasi</Text>
            <TouchableOpacity onPress={toggleAllLocations}>
              <Text style={styles.toggleAllText}>
                {selectedLocations.length === locationOptions.length ? 'Uncheck All' : 'Check All'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.checkboxContainer}>
            {locationOptions.map((location) => (
              <TouchableOpacity
                key={location}
                style={styles.checkboxRow}
                onPress={() => toggleLocation(location)}
              >
                <View style={styles.checkbox}>
                  {selectedLocations.includes(location) && (
                    <View style={styles.checkboxChecked} />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>{location}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  // Bar Chart Component Helper
  const renderBarChart = (data, getValue, getLabel, maxValue, color = '#8B2D2D', formatValue = null) => {
    if (!data || data.length === 0) return null;

    const chartWidth = Dimensions.get('window').width - 80;
    const chartHeight = Math.max(200, data.length * 50);
    const barHeight = 32;
    const spacing = 10;
    const labelWidth = 100;
    const barWidth = chartWidth - labelWidth - 50;

    const formatNumber = (val) => {
      if (formatValue) return formatValue(val);
      if (val % 1 === 0) return val.toLocaleString();
      return val.toFixed(1);
    };

    return (
      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight}>
          {data.map((item, index) => {
            const value = getValue(item);
            const label = getLabel(item);
            const barLength = maxValue > 0 ? (value / maxValue) * barWidth : 0;
            const y = index * (barHeight + spacing) + 5;

            return (
              <React.Fragment key={index}>
                {/* Location Label */}
                <SvgText
                  x={0}
                  y={y + barHeight / 2 + 5}
                  fontSize={11}
                  fill="#333"
                  fontWeight="600"
                >
                  {label.length > 14 ? label.substring(0, 14) + '...' : label}
                </SvgText>

                {/* Bar Background */}
                <Rect
                  x={labelWidth}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill="#f0f0f0"
                  rx={4}
                />

                {/* Bar Fill */}
                {barLength > 0 && (
                  <Rect
                    x={labelWidth}
                    y={y}
                    width={barLength}
                    height={barHeight}
                    fill={color}
                    rx={4}
                  />
                )}

                {/* Value Label */}
                <SvgText
                  x={labelWidth + Math.max(barLength, 0) + 8}
                  y={y + barHeight / 2 + 5}
                  fontSize={10}
                  fill="#333"
                  fontWeight="600"
                >
                  {value > 0 ? formatNumber(value) : '-'}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </View>
    );
  };

  const renderTabButtons = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'Packing' && styles.tabButtonActive]}
        onPress={() => setActiveTab('Packing')}
      >
        <Text style={[styles.tabText, activeTab === 'Packing' && styles.tabTextActive]}>
          Packing
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'Reject' && styles.tabButtonActive]}
        onPress={() => setActiveTab('Reject')}
      >
        <Text style={[styles.tabText, activeTab === 'Reject' && styles.tabTextActive]}>
          Reject
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'Panen' && styles.tabButtonActive]}
        onPress={() => setActiveTab('Panen')}
      >
        <Text style={[styles.tabText, activeTab === 'Panen' && styles.tabTextActive]}>
          Panen
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderPackingTab = () => {
    const packing = productionData.packing || {};
    const details = packing.details || [];
    const lowestDetail = details[0] || {};
    const highestDetail = details[1] || {};
    
    const totalPack = packing.totalPack || 0;
    const periodePack = packing.periodePack || 0;
    const totalTochio = packing.totalTochio || 0;
    const periodeTochio = packing.periodeTochio || 0;
    const totalMomoka = packing.totalMomoka || 0;
    const periodeMomoka = packing.periodeMomoka || 0;
    const lowest = lowestDetail.lowest || 0;
    const highest = highestDetail.highest || 0;
    const lowestPercentage = lowestDetail.percentage || 0;
    const highestPercentage = highestDetail.percentage || 0;
    
    return (
      <View>
        {/* Total Cards */}
        <View style={styles.totalCard}>
          <Text style={styles.cardTitle}>TOTAL PACK</Text>
          <Text style={styles.cardValue}>
            {totalPack.toLocaleString()} <Text style={styles.cardUnit}>pack ({formatPercentage(totalPack, periodePack)})</Text>
          </Text>
          <Text style={styles.cardPeriode}>periode lalu : {periodePack.toLocaleString()} pack</Text>
          
          <View style={styles.cardDetailRow}>
            <View style={styles.cardDetailItem}>
              <Text style={styles.cardDetailLabel}>Terendah</Text>
              <Text style={styles.cardDetailLocation}>{lowestDetail.location || '-'}</Text>
              <Text style={styles.cardDetailValue}>
                {lowest.toLocaleString()} pack <Text style={styles.cardDetailPercent}>({formatPercentageFromValue(lowestPercentage)})</Text>
              </Text>
            </View>
            
            <View style={styles.cardDetailItem}>
              <Text style={styles.cardDetailLabel}>Tertinggi</Text>
              <Text style={styles.cardDetailLocation}>{highestDetail.location || '-'}</Text>
              <Text style={styles.cardDetailValue}>
                {highest.toLocaleString()} pack <Text style={styles.cardDetailPercent}>({formatPercentageFromValue(highestPercentage)})</Text>
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.totalCard}>
          <Text style={styles.cardTitle}>TOTAL TOCHIO</Text>
          <Text style={styles.cardValue}>
            {totalTochio.toLocaleString()} <Text style={styles.cardUnit}>pack ({formatPercentage(totalTochio, periodeTochio)})</Text>
          </Text>
          <Text style={styles.cardPeriode}>periode lalu : {periodeTochio.toLocaleString()} pack</Text>
          
          <View style={styles.cardDetailRow}>
            <View style={styles.cardDetailItem}>
              <Text style={styles.cardDetailLabel}>Terendah</Text>
              <Text style={styles.cardDetailLocation}>{lowestDetail.location || '-'}</Text>
              <Text style={styles.cardDetailValue}>
                {lowest.toLocaleString()} pack <Text style={styles.cardDetailPercent}>({formatPercentageFromValue(lowestPercentage)})</Text>
              </Text>
            </View>
            
            <View style={styles.cardDetailItem}>
              <Text style={styles.cardDetailLabel}>Tertinggi</Text>
              <Text style={styles.cardDetailLocation}>{highestDetail.location || '-'}</Text>
              <Text style={styles.cardDetailValue}>
                {highest.toLocaleString()} pack <Text style={styles.cardDetailPercent}>({formatPercentageFromValue(highestPercentage)})</Text>
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.totalCard}>
          <Text style={styles.cardTitle}>TOTAL MOMOKA</Text>
          <Text style={styles.cardValue}>
            {totalMomoka.toLocaleString()} <Text style={styles.cardUnit}>pack ({formatPercentage(totalMomoka, periodeMomoka)})</Text>
          </Text>
          <Text style={styles.cardPeriode}>periode lalu : {periodeMomoka.toLocaleString()} pack</Text>
          
          <View style={styles.cardDetailRow}>
            <View style={styles.cardDetailItem}>
              <Text style={styles.cardDetailLabel}>Terendah</Text>
              <Text style={styles.cardDetailLocation}>{lowestDetail.location || '-'}</Text>
              <Text style={styles.cardDetailValue}>
                {lowest.toLocaleString()} pack <Text style={styles.cardDetailPercent}>({formatPercentageFromValue(lowestPercentage)})</Text>
              </Text>
            </View>
            
            <View style={styles.cardDetailItem}>
              <Text style={styles.cardDetailLabel}>Tertinggi</Text>
              <Text style={styles.cardDetailLocation}>{highestDetail.location || '-'}</Text>
              <Text style={styles.cardDetailValue}>
                {highest.toLocaleString()} pack <Text style={styles.cardDetailPercent}>({formatPercentageFromValue(highestPercentage)})</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Kontribusi Lokasi Section */}
        <View style={styles.contributionCard}>
          <Text style={styles.contributionTitle}>KONTRIBUSI LOKASI</Text>
          {(() => {
            if (!details || details.length === 0) {
              return (
                <View style={styles.emptyDataContainer}>
                  <Text style={styles.emptyDataText}>Tidak ada data</Text>
                </View>
              );
            }
            
            const validDetails = details.filter(d => d && d.location && d.location.trim().length > 0);
            
            if (validDetails.length === 0) {
              return (
                <View style={styles.emptyDataContainer}>
                  <Text style={styles.emptyDataText}>Tidak ada data</Text>
                </View>
              );
            }
            
            const sortedDetails = [...validDetails].sort((a, b) => {
              const aVal = (a.highest || a.lowest || 0);
              const bVal = (b.highest || b.lowest || 0);
              return bVal - aVal;
            });
            const maxValue = Math.max(...sortedDetails.map(d => (d.highest || d.lowest || 0)), 1);
            
            return renderBarChart(
              sortedDetails,
              (item) => item.highest || item.lowest || 0,
              (item) => item.location || '-',
              maxValue,
              '#8B2D2D'
            );
          })()}
        </View>
      </View>
    );
  };

  const renderRejectTab = () => {
    const reject = productionData.reject || {};
    const details = reject.details || [];
    
    let lowestDetail = {};
    let highestDetail = {};
    
    if (details.length > 0) {
      const ratios = details.map(d => d.ratio || 0);
      const minRatio = Math.min(...ratios);
      const maxRatio = Math.max(...ratios);
      lowestDetail = details.find(d => (d.ratio || 0) === minRatio) || details[0] || {};
      highestDetail = details.find(d => (d.ratio || 0) === maxRatio) || details[0] || {};
    }
    
    const totalRatio = reject.totalRatio || 0;
    const periodeRatio = reject.periodeRatio || 0;
    const lowestRatio = lowestDetail.ratio || 0;
    const highestRatio = highestDetail.ratio || 0;
    const lowestPercentage = lowestDetail.percentage || 0;
    const highestPercentage = highestDetail.percentage || 0;
    
    return (
      <View>
        <View style={styles.totalCard}>
          <Text style={styles.cardTitle}>TOTAL RASIO REJECT</Text>
          <Text style={styles.cardValue}>
            {totalRatio.toFixed(1)}<Text style={styles.cardUnit}>% ({formatPercentage(totalRatio, periodeRatio)})</Text>
          </Text>
          <Text style={styles.cardPeriode}>periode lalu : {periodeRatio.toFixed(1)}%</Text>
          
          <View style={styles.cardDetailRow}>
            <View style={styles.cardDetailItem}>
              <Text style={styles.cardDetailLabel}>Terendah</Text>
              <Text style={styles.cardDetailLocation}>{lowestDetail.location || '-'}</Text>
              <Text style={styles.cardDetailValue}>
                {lowestRatio.toFixed(1)}% <Text style={styles.cardDetailPercent}>({formatPercentageFromValue(lowestPercentage)})</Text>
              </Text>
            </View>
            
            <View style={styles.cardDetailItem}>
              <Text style={styles.cardDetailLabel}>Tertinggi</Text>
              <Text style={styles.cardDetailLocation}>{highestDetail.location || '-'}</Text>
              <Text style={styles.cardDetailValue}>
                {highestRatio.toFixed(1)}% <Text style={styles.cardDetailPercent}>({formatPercentageFromValue(highestPercentage)})</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Kontribusi Lokasi Section */}
        <View style={styles.contributionCard}>
          <Text style={styles.contributionTitle}>KONTRIBUSI LOKASI</Text>
          {details.length > 0 ? (() => {
            const sortedDetails = [...details].sort((a, b) => (b.ratio || 0) - (a.ratio || 0));
            const maxValue = Math.max(...sortedDetails.map(d => d.ratio || 0), 1);
            
            return renderBarChart(
              sortedDetails,
              (item) => item.ratio || 0,
              (item) => item.location || '-',
              maxValue,
              '#8B2D2D'
            );
          })() : (
            <View style={styles.emptyDataContainer}>
              <Text style={styles.emptyDataText}>Tidak ada data</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderPanenTab = () => {
    const panen = productionData.panen || {};
    const details = panen.details || [];
    
    let lowestPanen = {};
    let highestPanen = {};
    let lowestReject = {};
    let highestReject = {};
    let lowestEfficiency = {};
    let highestEfficiency = {};
    
    if (details.length > 0) {
      lowestPanen = details.reduce((min, d) => (d.kg || 0) < (min.kg || 0) ? d : min, details[0]);
      highestPanen = details.reduce((max, d) => (d.kg || 0) > (max.kg || 0) ? d : max, details[0]);
      lowestReject = details.reduce((min, d) => (d.reject || 0) < (min.reject || 0) ? d : min, details[0]);
      highestReject = details.reduce((max, d) => (d.reject || 0) > (max.reject || 0) ? d : max, details[0]);
      lowestEfficiency = details.reduce((min, d) => (d.efficiency || 0) < (min.efficiency || 0) ? d : min, details[0]);
      highestEfficiency = details.reduce((max, d) => (d.efficiency || 0) > (max.efficiency || 0) ? d : max, details[0]);
    }
    
    const totalPanen = panen.totalPanen || 0;
    const periodePanen = panen.periodePanen || 0;
    const totalReject = panen.totalReject || 0;
    const periodeReject = panen.periodeReject || 0;
    const efisiensi = panen.efisiensi || 0;
    const periodeEfisiensi = panen.periodeEfisiensi || 0;
    
    return (
      <View>
        <View style={styles.totalCard}>
          <Text style={styles.cardTitle}>TOTAL PANEN</Text>
          <Text style={styles.cardValue}>
            {(totalPanen / 1000).toFixed(1)} <Text style={styles.cardUnit}>Kg ({formatPercentage(totalPanen, periodePanen)})</Text>
          </Text>
          <Text style={styles.cardPeriode}>periode lalu : {(periodePanen / 1000).toFixed(1)} Kg</Text>
          
          <View style={styles.cardDetailRow}>
            <View style={styles.cardDetailItem}>
              <Text style={styles.cardDetailLabel}>Terendah</Text>
              <Text style={styles.cardDetailLocation}>{lowestPanen.location || '-'}</Text>
              <Text style={styles.cardDetailValue}>
                {((lowestPanen.kg || 0) / 1000).toFixed(1)} Kg <Text style={styles.cardDetailPercent}>({formatPercentageFromValue(lowestPanen.percentage || 0)})</Text>
              </Text>
            </View>
            
            <View style={styles.cardDetailItem}>
              <Text style={styles.cardDetailLabel}>Tertinggi</Text>
              <Text style={styles.cardDetailLocation}>{highestPanen.location || '-'}</Text>
              <Text style={styles.cardDetailValue}>
                {((highestPanen.kg || 0) / 1000).toFixed(1)} Kg <Text style={styles.cardDetailPercent}>({formatPercentageFromValue(highestPanen.percentage || 0)})</Text>
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.totalCard}>
          <Text style={styles.cardTitle}>TOTAL REJECT</Text>
          <Text style={styles.cardValue}>
            {(totalReject / 1000).toFixed(1)} <Text style={styles.cardUnit}>Kg ({formatPercentage(totalReject, periodeReject)})</Text>
          </Text>
          <Text style={styles.cardPeriode}>periode lalu : {(periodeReject / 1000).toFixed(1)} Kg</Text>
          
          <View style={styles.cardDetailRow}>
            <View style={styles.cardDetailItem}>
              <Text style={styles.cardDetailLabel}>Terendah</Text>
              <Text style={styles.cardDetailLocation}>{lowestReject.location || '-'}</Text>
              <Text style={styles.cardDetailValue}>
                {((lowestReject.reject || 0) / 1000).toFixed(1)} Kg <Text style={styles.cardDetailPercent}>({formatPercentageFromValue(lowestReject.percentage || 0)})</Text>
              </Text>
            </View>
            
            <View style={styles.cardDetailItem}>
              <Text style={styles.cardDetailLabel}>Tertinggi</Text>
              <Text style={styles.cardDetailLocation}>{highestReject.location || '-'}</Text>
              <Text style={styles.cardDetailValue}>
                {((highestReject.reject || 0) / 1000).toFixed(1)} Kg <Text style={styles.cardDetailPercent}>({formatPercentageFromValue(highestReject.percentage || 0)})</Text>
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.totalCard}>
          <Text style={styles.cardTitle}>EFISIENSI</Text>
          <Text style={styles.cardValue}>
            {efisiensi.toFixed(1)}<Text style={styles.cardUnit}>% ({formatPercentage(efisiensi, periodeEfisiensi)})</Text>
          </Text>
          <Text style={styles.cardPeriode}>periode lalu : {periodeEfisiensi.toFixed(1)}%</Text>
          
          <View style={styles.cardDetailRow}>
            <View style={styles.cardDetailItem}>
              <Text style={styles.cardDetailLabel}>Terendah</Text>
              <Text style={styles.cardDetailLocation}>{lowestEfficiency.location || '-'}</Text>
              <Text style={styles.cardDetailValue}>
                {(lowestEfficiency.efficiency || 0).toFixed(1)}% <Text style={styles.cardDetailPercent}>({formatPercentageFromValue(lowestEfficiency.percentage || 0)})</Text>
              </Text>
            </View>
            
            <View style={styles.cardDetailItem}>
              <Text style={styles.cardDetailLabel}>Tertinggi</Text>
              <Text style={styles.cardDetailLocation}>{highestEfficiency.location || '-'}</Text>
              <Text style={styles.cardDetailValue}>
                {(highestEfficiency.efficiency || 0).toFixed(1)}% <Text style={styles.cardDetailPercent}>({formatPercentageFromValue(highestEfficiency.percentage || 0)})</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Kontribusi Lokasi Section - Panen Chart */}
        <View style={styles.contributionCard}>
          <Text style={styles.contributionTitle}>KONTRIBUSI LOKASI - PANEN</Text>
          {details.length > 0 ? (() => {
            const sortedDetails = [...details].sort((a, b) => (b.kg || 0) - (a.kg || 0));
            const maxValue = Math.max(...sortedDetails.map(d => d.kg || 0), 1);
            
            return renderBarChart(
              sortedDetails,
              (item) => (item.kg || 0) / 1000,
              (item) => item.location || '-',
              maxValue / 1000,
              '#8B2D2D',
              (val) => val > 0 ? `${val.toFixed(1)} Kg` : '-'
            );
          })() : (
            <View style={styles.emptyDataContainer}>
              <Text style={styles.emptyDataText}>Tidak ada data</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Packing':
        return renderPackingTab();
      case 'Reject':
        return renderRejectTab();
      case 'Panen':
        return renderPanenTab();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBarCustom backgroundColor="#1D4949" />
      <Header
        title="Laporan Produksi"
        logoSvg={backArrowSvg}
        onLeftPress={() => navigation.navigate('Home')}
        showHomeButton={false}
      />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>LAPORAN PRODUKSI</Text>

        {/* Filter Button */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <SvgXml xml={filterSvg} width={20} height={20} />
          <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>

        {/* Filter Box (Collapsible) */}
        {renderFilterBox()}

        {/* Loading Indicator */}
        {(loading.locations || loading.production) && (
          <ActivityIndicator size="large" color="#1D4949" style={{ marginTop: 20 }} />
        )}

        {/* Tab Buttons */}
        {renderTabButtons()}

        {/* Tab Content */}
        {renderTabContent()}
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
    backgroundColor: '#1D4949',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  filterButtonText: {
    color: '#FBF7EB',
    fontSize: 16,
    fontWeight: 'bold',
  },
  filterContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 16,
    marginBottom: 20,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateField: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFF9F2',
  },
  dateText: {
    fontSize: 14,
    color: '#333',
  },
  locationSection: {
    marginTop: 8,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  toggleAllText: {
    fontSize: 12,
    color: '#1D4949',
    fontWeight: '600',
  },
  checkboxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#1D4949',
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    width: 12,
    height: 12,
    backgroundColor: '#1D4949',
    borderRadius: 2,
  },
  checkboxLabel: {
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tabButtonActive: {
    backgroundColor: '#8B2D2D',
    borderColor: '#8B2D2D',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  tabTextActive: {
    color: '#fff',
  },
  totalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#9B1D20',
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
  },
  cardValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#8B2D2D',
    textAlign: 'center',
  },
  cardUnit: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#666',
  },
  cardPeriode: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  cardDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  cardDetailItem: {
    flex: 1,
  },
  cardDetailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  cardDetailLocation: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B2D2D',
    marginBottom: 4,
  },
  cardDetailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  cardDetailPercent: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#666',
  },
  contributionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#9B1D20',
    padding: 20,
    marginBottom: 16,
  },
  contributionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 16,
  },
  contributionTable: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  contributionHeader: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  contributionHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  contributionRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  contributionCell: {
    fontSize: 12,
    color: '#333',
  },
  contributionCol1: {
    flex: 2.5,
  },
  contributionCol2: {
    flex: 1.5,
    textAlign: 'center',
  },
  contributionCol3: {
    flex: 1.2,
    textAlign: 'center',
  },
  chartContainer: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 10,
  },
  emptyDataContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDataText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});
