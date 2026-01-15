import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SvgXml } from 'react-native-svg';
import { useKindeAuth } from '@kinde/expo';

import StatusBarCustom from '../components/statusbar';
import Header from '../components/Header';

/** ---------- Config from environment ---------- */
const API_BASE = process.env.EXPO_PUBLIC_API_BASE;

// --- SVGs ---
const backArrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="19" height="30" viewBox="0 0 19 30" fill="none"><path d="M15.4537 30L0.859123 15L15.4537 0L18.8591 3.5L7.66993 15L18.8591 26.5L15.4537 30Z" fill="#FBF7EB"/></svg>`;
const calendarSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#666" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 7.5h18M4.5 6.75h15A1.5 1.5 0 0 1 21 8.25v11.25a1.5 1.5 0 0 1-1.5 1.5h-15a1.5 1.5 0 0 1-1.5-1.5Z" /></svg>`;
const filterSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M2 4h16M4 10h12M7 16h6" stroke="#FBF7EB" stroke-width="2" stroke-linecap="round"/></svg>`;

/**
 * Get last Monday and last Sunday based on current date
 * Example: If today is Nov 19, 2025 (Tuesday), returns Nov 10 (Monday) and Nov 16 (Sunday)
 * 
 * Logic: Find the Monday of last week, then add 6 days to get Sunday of that week
 */
const getDefaultDateRange = () => {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // Calculate days to go back to last Monday (Monday of last week)
  // If today is Monday (1), last Monday is 7 days ago
  // If today is Tuesday (2), last Monday is 8 days ago (2 + 6)
  // If today is Wednesday (3), last Monday is 9 days ago (3 + 6)
  // If today is Sunday (0), last Monday is 13 days ago (0 + 6 + 7)
  let daysToLastMonday;
  if (currentDay === 0) {
    daysToLastMonday = 13; // Sunday: go back 13 days to last Monday (6 + 7)
  } else if (currentDay === 1) {
    daysToLastMonday = 7; // Monday: go back 7 days to last Monday
  } else {
    daysToLastMonday = currentDay + 6; // Tuesday-Saturday: currentDay + 6
  }

  const lastMonday = new Date(today);
  lastMonday.setDate(today.getDate() - daysToLastMonday);
  lastMonday.setHours(0, 0, 0, 0);

  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6);
  lastSunday.setHours(23, 59, 59, 999);

  return { startDate: lastMonday, endDate: lastSunday };
};

export default function LaporanProduktifitasPage() {
  const navigation = useNavigation();
  const { getAccessToken } = useKindeAuth();

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
  const [loading, setLoading] = useState({ locations: false, productivity: false });

  // Productivity data
  const [productivityData, setProductivityData] = useState({
    average: 0,
    highest: 0,
    highestLocation: '',
    weeklyData: [], // Array of { location, days, weeks: [{ week, value }] }
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

  // Get location IDs from selected location names (comma-separated string)
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

  // Fetch productivity data
  const fetchProductivityData = useCallback(async () => {
    if (selectedLocations.length === 0) {
      return; // Don't fetch if no locations selected
    }

    // Ensure dates are valid
    if (!startDate || !endDate || !(startDate instanceof Date) || !(endDate instanceof Date)) {
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, productivity: true }));

      const headers = await getAuthHeaders();
      const locationIds = getLocationIds();
      const startDateStr = formatDate(startDate);
      const endDateStr = formatDate(endDate);

      const url = `${API_BASE}/report/ops/productivity/heatmap?startDate=${startDateStr}&endDate=${endDateStr}&location_id=${locationIds}`;

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      // Extract KPI data
      const kpi = result.kpi || {};
      const average = kpi.avg_productivity || 0;
      const highest = kpi.best_productivity || 0;
      const highestLocation = kpi.best_location || '';

      // Transform trends data to weekly grid format
      const weeklyData = transformWeeklyData(result.trends || []);

      setProductivityData({
        average: average,
        highest: highest,
        highestLocation: highestLocation,
        weeklyData: weeklyData,
      });

    } catch (error) {
      console.error('Failed to fetch productivity data:', error);
      Alert.alert(
        'Gagal Memuat Data',
        'Gagal mendapatkan data produktifitas. Silakan coba lagi.',
        [{ text: 'OK', style: 'default' }]
      );
      // Set empty data on error
      setProductivityData({
        average: 0,
        highest: 0,
        highestLocation: '',
        weeklyData: [],
      });
    } finally {
      setLoading((prev) => ({ ...prev, productivity: false }));
    }
  }, [getAuthHeaders, startDate, endDate, selectedLocations, getLocationIds]);

  useEffect(() => {
    fetchLocationOptions();
  }, [fetchLocationOptions]);

  // Fetch productivity data when filters change
  useEffect(() => {
    if (locationObjects.length > 0 && selectedLocations.length > 0) {
      fetchProductivityData();
    }
  }, [startDate, endDate, selectedLocations, locationObjects.length, fetchProductivityData]);

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

  // Format number with Indonesian locale (comma as decimal separator)
  const formatNumber = (value, decimals = 2) => {
    if (value === null || value === undefined || !isFinite(value)) {
      return '0,00';
    }
    const fixed = Number(value).toFixed(decimals);
    const parts = fixed.split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const decimalPart = parts[1] || '';
    return decimalPart ? `${integerPart},${decimalPart}` : `${integerPart}`;
  };

  // Get cell background color based on value
  // Red for values < 7, green for values >= 7, white for zero
  const getCellBackgroundColor = (value) => {
    if (value === 0 || value === null || value === undefined) {
      return '#FFFFFF';
    }
    return value < 7 ? '#FFCDD2' : '#C8E6C9';
  };

  // Extract week number from period_key
  const extractWeekNumber = (periodKey) => {
    if (!periodKey) {
      return null;
    }

    // Convert to string if it's not already
    const keyStr = String(periodKey).trim();

    // Check if it's "week X" format (case insensitive, with or without space)
    const weekMatch = keyStr.match(/week\s*(\d+)/i);
    if (weekMatch && weekMatch[1]) {
      const weekNum = parseInt(weekMatch[1], 10);
      if (!isNaN(weekNum) && weekNum > 0) {
        return weekNum;
      }
    }

    // Check for "W17" format (ISO week format)
    const isoWeekMatch = keyStr.match(/[wW](\d+)/);
    if (isoWeekMatch && isoWeekMatch[1]) {
      const weekNum = parseInt(isoWeekMatch[1], 10);
      if (!isNaN(weekNum) && weekNum > 0) {
        return weekNum;
      }
    }

    // If it's a date format, calculate week number
    const dateMatch = keyStr.match(/(\d{4})\/(\d{2})\/(\d{2})/);
    if (dateMatch) {
      const year = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10) - 1;
      const day = parseInt(dateMatch[3], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          return getWeekNumber(date);
        }
      }
    }

    return null;
  };

  // Get ISO week number from date
  // ISO weeks start on Monday, and week 1 is the week containing Jan 4
  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7; // Convert Sunday (0) to 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum); // Get Thursday of the week
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return Math.max(1, weekNum); // Ensure week number is at least 1
  };


  const transformWeeklyData = (trends) => {
    if (!Array.isArray(trends) || trends.length === 0) {
      return [];
    }

    // Build weeks for a trend, preserving the original period_key labels from API
    // isOverall: if true, use date format; if false, use "week X" format from period_key
    const buildWeeks = (trend, isOverall = false) => {
      if (!Array.isArray(trend.details)) return [];

      // Group values by period_key, preserving order and original labels
      const weekBuckets = {};
      const periodKeyOrder = []; // Track order of appearance

      trend.details.forEach(detail => {
        const periodKey = detail.period_key;
        const periodLabel = detail.period_label || periodKey; // Use period_label if available
        const week = extractWeekNumber(periodKey);
        if (!week) return;

        const value = Number(detail.productivity);
        if (isNaN(value)) return;

        if (!weekBuckets[week]) {
          weekBuckets[week] = {
            values: [],
            periodKey: periodKey,
            periodLabel: periodLabel,
          };
          periodKeyOrder.push(week);
        }
        weekBuckets[week].values.push(value);
      });

      // Calculate average per week and sort by week number
      return periodKeyOrder.map((week) => {
        const bucket = weekBuckets[week];

        let displayLabel;
        if (isOverall) {
          displayLabel = formatPeriodLabel(bucket.periodLabel, bucket.periodKey);
        } else {
          displayLabel = `week ${week}`;
        }

        return {
          week,
          value: bucket.values.reduce((a, b) => a + b, 0) / bucket.values.length,
          displayLabel,
        };
      });
    };

    // Helper to format period label for Overall row
    const formatPeriodLabel = (periodLabel, periodKey) => {
      // Try to extract a date from period_label (format: "2024/12/31 to 2025/01/06")
      if (periodLabel && typeof periodLabel === 'string') {
        // Check if it's in "YYYY/MM/DD to YYYY/MM/DD" format
        const toMatch = periodLabel.match(/(\d{4}\/\d{2}\/\d{2})\s*to\s*(\d{4}\/\d{2}\/\d{2})/);
        if (toMatch && toMatch[2]) {
          // Return the end date in a shorter format (e.g., "2025/01/06")
          return toMatch[2];
        }

        // Check if it's just a date format already
        const dateMatch = periodLabel.match(/\d{4}\/\d{2}\/\d{2}/);
        if (dateMatch) {
          return dateMatch[0];
        }
      }

      // Fallback to period_key if it's a date
      if (periodKey && typeof periodKey === 'string') {
        const dateMatch = periodKey.match(/\d{4}\/\d{2}\/\d{2}/);
        if (dateMatch) {
          return dateMatch[0];
        }
      }

      // If no date found, just return the period_key as-is
      return periodKey || periodLabel || '';
    };

    const result = [];

    // Prefer to show the aggregate row ("Overall" / "All Location") first if present
    const isOverallTrend = (t) =>
      t.location_code === 'Overall' ||
      t.location_name === 'All Location' ||
      t.location_name?.toLowerCase().includes('all');

    const overallIndex = trends.findIndex(isOverallTrend);
    if (overallIndex !== -1) {
      const overallTrend = trends[overallIndex];
      result.push({
        location: overallTrend.location_code || overallTrend.location_name || 'Overall',
        days: overallTrend.age || 0,
        weeks: buildWeeks(overallTrend, true), // isOverall = true
        isOverall: true,
      });
    }

    // Add remaining locations in the order returned by the API
    trends.forEach((trend, idx) => {
      if (idx === overallIndex) return;
      result.push({
        location: trend.location_code || trend.location_name || `Location ${idx + 1}`,
        days: trend.age || 0,
        weeks: buildWeeks(trend, false), // isOverall = false
        isOverall: false,
      });
    });

    return result;
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

  // Render filter box
  const renderFilterBox = () => {
    if (!showFilters) return null;

    return (
      <View style={styles.filterBox}>
        {/* Date Range */}
        <View style={styles.filterSection}>
          <View style={styles.dateRow}>
            <View style={styles.dateInput}>
              <Text style={styles.dateLabel}>Dari</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartPicker(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.dateText} numberOfLines={1}>
                  {formatDateIndonesian(startDate)}
                </Text>
                <View style={styles.dateIconContainer}>
                  <SvgXml xml={calendarSvg} width={18} height={18} />
                </View>
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
                activeOpacity={0.7}
              >
                <Text style={styles.dateText} numberOfLines={1}>
                  {formatDateIndonesian(endDate)}
                </Text>
                <View style={styles.dateIconContainer}>
                  <SvgXml xml={calendarSvg} width={18} height={18} />
                </View>
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
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBarCustom backgroundColor="#1D4949" />
      <Header
        title="PRODUKTIVITAS"
        logoSvg={backArrowSvg}
        onLeftPress={() => navigation.navigate('Home')}
      />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>PRODUKTIFITAS</Text>

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
        {(loading.locations || loading.productivity) && (
          <ActivityIndicator size="large" color="#1D4949" style={{ marginTop: 20 }} />
        )}

        {/* Average Productivity Card */}
        <View style={styles.dataCard}>
          <Text style={styles.cardTitle}>Produktifitas Rata-Rata</Text>
          <View style={styles.valueContainer}>
            <Text style={styles.cardValue}>{formatNumber(productivityData.average)}</Text>
            <Text style={styles.cardUnit}>gr/tanaman</Text>
          </View>
        </View>

        {/* Highest Productivity Card */}
        <View style={styles.dataCard}>
          <Text style={styles.cardTitle}>Produktifitas Tertinggi</Text>
          <View style={styles.valueContainer}>
            <Text style={styles.cardValue}>{formatNumber(productivityData.highest)}</Text>
            <Text style={styles.cardUnit}>gr/tanaman</Text>
          </View>
          {productivityData.highestLocation && (
            <Text style={styles.cardLocation}>{productivityData.highestLocation}</Text>
          )}
        </View>

        {/* Weekly Productivity Grid */}
        {productivityData.weeklyData && productivityData.weeklyData.length > 0 && (
          <View style={styles.gridContainer}>
            {/* Fixed Left Column */}
            <View style={styles.gridLeftColumn}>
              <View style={styles.gridHeaderLeft}>
                <Text style={styles.gridHeaderText}>Lokasi</Text>
              </View>
              {productivityData.weeklyData.map((row, rowIdx) => (
                <View key={rowIdx} style={styles.gridRowLeft}>
                  <Text style={styles.gridRowLocation}>{row.location}</Text>
                  <Text style={styles.gridRowDays}>{row.days} days</Text>
                </View>
              ))}
            </View>

            {/* Scrollable Right Section */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              style={styles.gridScrollView}
              contentContainerStyle={styles.gridScrollContent}
            >
              <View style={styles.gridRightSection}>
                {/* Header - Use displayLabel from first row (Overall) */}
                <View style={styles.gridHeaderWeeks}>
                  {productivityData.weeklyData[0]?.weeks?.map((weekData, idx) => (
                    <View key={idx} style={styles.gridHeaderWeek}>
                      <Text style={styles.gridHeaderWeekText}>{weekData.displayLabel}</Text>
                    </View>
                  ))}
                </View>

                {/* Rows - Each row uses its own displayLabel */}
                {productivityData.weeklyData.map((row, rowIdx) => (
                  <View key={rowIdx} style={styles.gridRowWeeks}>
                    {row.weeks.map((weekData, weekIdx) => (
                      <View
                        key={weekIdx}
                        style={[
                          styles.gridCell,
                          { backgroundColor: getCellBackgroundColor(weekData.value) }
                        ]}
                      >
                        <Text style={styles.gridCellWeek}>{weekData.displayLabel}</Text>
                        <Text style={styles.gridCellValue}>
                          {formatNumber(weekData.value, weekData.value % 1 === 0 ? 0 : 2)}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F5ED',
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
    borderColor: '#E8D5D5',
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
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#F9F9F9',
    minHeight: 48,
  },
  dateText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  dateIconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
  dataCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8D5D5',
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D4949',
    textAlign: 'center',
    marginBottom: 12,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 8,
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
    color: '#1D4949',
    marginLeft: 8,
    marginTop: 8,
  },
  cardLocation: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#1D4949',
    textAlign: 'center',
    marginTop: 4,
  },
  gridContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8D5D5',
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    flexDirection: 'row',
  },
  gridLeftColumn: {
    width: 120,
    borderRightWidth: 1,
    borderRightColor: '#E8D5D5',
    paddingRight: 8,
  },
  gridHeaderLeft: {
    height: 48,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E8D5D5',
    marginBottom: 8,
  },
  gridHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1D4949',
  },
  gridRowLeft: {
    height: 80,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingVertical: 8,
  },
  gridRowLocation: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D4949',
    marginBottom: 4,
  },
  gridRowDays: {
    fontSize: 12,
    color: '#666',
  },
  gridScrollView: {
    flex: 1,
  },
  gridScrollContent: {
    paddingLeft: 8,
  },
  gridRightSection: {
    flexDirection: 'column',
  },
  gridHeaderWeeks: {
    flexDirection: 'row',
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#E8D5D5',
    marginBottom: 8,
    alignItems: 'center',
  },
  gridHeaderWeek: {
    width: 100,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridHeaderWeekText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4949',
  },
  gridRowWeeks: {
    flexDirection: 'row',
    height: 80,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingVertical: 8,
    alignItems: 'center',
  },
  gridCell: {
    width: 100,
    padding: 8,
    marginHorizontal: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E8D5D5',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  gridCellWeek: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  gridCellValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1D4949',
  },
});

