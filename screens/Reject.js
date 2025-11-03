import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { SvgXml } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import TambahForm from "../components/TambahForm";


const hyoshiiLogo = `
<svg viewBox="0 0 58 90" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 90C1.79 90 0 88.21 0 86V4C0 1.79 1.79 0 4 0H14C16.21 0 18 1.79 18 4V50L40 4C40.69 2.62 42.25 2 43.79 2C45.33 2 46.89 2.62 47.58 4L58 26.33C58.62 27.67 57.91 29.25 56.58 29.87C55.25 30.49 53.67 29.79 53.05 28.45L44 10.65L22 56V86C22 88.21 20.21 90 18 90H4Z" fill="#7A2929"/>
</svg>
`;

const COLORS = {
  cream: '#F0E6CB',
  green: '#4A6C62',
  white: '#FFFFFF',
  brown: '#7A2929',
  brickRed: '#D3A3A3',
  gray: '#EAEAEA',
  darkGray: '#4A4A4A',
};

const sampleData = {
  pagination: { page: 1, pageSize: 10, total: 7784, totalPages: 779 },
  data: [
    {
      datetime: "2025-09-19",
      locations: [
        {
          location_name: "Green House 1",
          quantity: 90,
          reasons: [
            { reason: "Ulat", quantity: 22 },
            { reason: "Siput", quantity: 7 },
            { reason: "Thrips", quantity: 5 }
          ]
        },
        {
          location_name: "Outdoor 1",
          quantity: 31,
          reasons: [
            { reason: "Ulat", quantity: 10 },
            { reason: "Siput", quantity: 2 }
          ]
        },
        {
          location_name: "Green House 2",
          quantity: 12,
          reasons: []
        }
      ]
    },
    // NEW DATE GROUP BELOW EXISTING DATA
    {
      datetime: "2025-09-18",
      locations: [
        {
          location_name: "Green House 3",
          quantity: 20,
          reasons: [
            { reason: "Siput", quantity: 5 },
            { reason: "Thrips", quantity: 2 }
          ]
        },
        {
          location_name: "Outdoor 2",
          quantity: 15,
          reasons: [
            { reason: "Ulat", quantity: 7 }
          ]
        }
      ]
    }
  ]
};

const Reject = () => {
  const [data, setData] = useState([]);
  const [expanded, setExpanded] = useState([]);// Track expanded location
  const [page, setPage] = useState(1);

  useEffect(() => {
    setData(sampleData.data);
  }, []);

const toggleExpand = (dateIdx, locIdx) => {
  const key = `${dateIdx}-${locIdx}`;
  setExpanded(prev =>
    prev.includes(key)
      ? prev.filter(k => k !== key) // collapse
      : [...prev, key] // expand new one
  );
};;

  const AnimatedReasonDetail = ({ show, children }) => {
  const [contentHeight, setContentHeight] = useState(0);
  const animation = useRef(new Animated.Value(0)).current;
        useEffect(() => {
          Animated.timing(animation, {
            toValue: show ? 1 : 0,
            duration: 250,
            useNativeDriver: false,
          }).start();
        }, [show]);

        const height = animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, contentHeight],
        });

        return (
          <>
            {/* Offscreen measurement */}
            {contentHeight === 0 && (
              <View
                style={{ position: 'absolute', opacity: 0, left: -1000 }}
                onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}
              >
                {children}
              </View>
            )}
            
            
            {/* Animated container */}
            <Animated.View
              style={{
                height,
                opacity: animation,
                overflow: 'hidden',
              }}
            >
              
              {contentHeight > 0 && children}
            </Animated.View>
          </>
        );
      };



  const renderReason = (reasons) => (
    <View style={styles.reasonDetail}>
      <View style={styles.reasonHeader}>
        <Text style={styles.reasonHeaderText}>Reason</Text>
        <Text style={styles.reasonHeaderText}>Quantity</Text>
        <Text style={styles.reasonHeaderText}>Menu</Text>
      </View>
      {reasons.length === 0 ? (
        <Text style={styles.emptyReason}>No reasons</Text>
      ) : (
        reasons.map((r, idx) => (
          <View key={idx} style={styles.reasonRow}>
            <Text style={styles.reasonText}>{r.reason}</Text>
            <Text style={styles.reasonQty}>{r.quantity}</Text>
            <View style={styles.menuIcons}>
              <Icon name="pencil" size={20} color={COLORS.green} style={{ marginRight: 12 }} />
              <Icon name="trash-can-outline" size={20} color={COLORS.brickRed} />
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderLocation = (locations, dateIdx) => (
    locations.map((loc, locIdx) => {
      const isOpen = expanded.includes(`${dateIdx}-${locIdx}`);
      return (
        <View key={locIdx} style={styles.locationContainer}>
          <TouchableOpacity
            style={styles.locationRow}
            onPress={() => toggleExpand(dateIdx, locIdx)}
            activeOpacity={0.7}
          >
            <Icon
              name={isOpen ? "chevron-up" : "chevron-down"}
              size={22}
              color={COLORS.green}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.locationName}>{loc.location_name}</Text>
            <Text style={styles.locationQty}>{loc.quantity} gr</Text>
          </TouchableOpacity>
          <AnimatedReasonDetail show={isOpen}>
            {renderReason(loc.reasons)}
          </AnimatedReasonDetail>
        </View>
      );
    })
  );

  const renderPagination = () => {
    const totalPages = 3;
    return (
    <View style={styles.paginationContainer}>
      {/* Left arrows */}
      <TouchableOpacity
        onPress={() => setPage(1)}
        style={[styles.arrowButton, page === 1 && styles.arrowDisabled]}
      >
        <Icon name="chevron-double-left" size={24} color={page === 1 ? COLORS.gray : COLORS.green} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setPage(page - 1)}
        disabled={page === 1}
        style={[styles.arrowButton, page === 1 && styles.arrowDisabled]}
      >
        <Icon name="chevron-left" size={24} color={page === 1 ? COLORS.gray : COLORS.green} />
      </TouchableOpacity>


      <View style={styles.squarePageButton}>
        <Text style={styles.squarePageText}>{page}</Text>
      </View>

      {/* Right arrows */}
      <TouchableOpacity
        onPress={() => setPage(page + 1)}
        disabled={page === totalPages}
        style={[styles.arrowButton, page === totalPages && styles.arrowDisabled]}
      >
        <Icon name="chevron-right" size={24} color={page === totalPages ? COLORS.gray : COLORS.green} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setPage(totalPages)}
        disabled={page === totalPages}
        style={[styles.arrowButton, page === totalPages && styles.arrowDisabled]}
      >
        <Icon name="chevron-double-right" size={24} color={page === totalPages ? COLORS.gray : COLORS.green} />
      </TouchableOpacity>
    </View>
  );
};

  return (
    <View style={styles.screen}>
      {/* Header */}
      
      <View style={styles.header}>
        <Icon name="menu" size={28} color={COLORS.green} />
        <SvgXml xml={hyoshiiLogo} width={80} height={40} />
        <View style={styles.profileCircle}>
          <Icon name="account" size={24} color={COLORS.green} />
        </View>
      </View>
      <Text style={styles.title}>REJECT BUDIDAYA</Text>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <TambahForm />
   <View />

    <View style={styles.contentBox}>
      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderText}>Location</Text>
        <Text style={styles.tableHeaderText}>Quantity</Text>
      </View>

      {data.map((item, dateIdx) => (
        <View key={dateIdx} style={styles.dateGroup}>
          <View style={styles.dateHeaderBox}>
            <Text style={styles.dateText}>
              {new Date(item.datetime).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
          {renderLocation(item.locations, dateIdx)}
        </View>
      ))}
    </View>
  </ScrollView>

  {renderPagination()}
</View>
  );
};

const styles = StyleSheet.create({
  MainTable: {
    backgroundColor: COLORS.gray,
  },
  screen: {
    flex: 1,
    backgroundColor: COLORS.cream,
    paddingTop: 32,
  },
  header: {
    marginTop: 10,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: COLORS.cream,
    justifyContent: 'space-between',
  },
  logo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1D4949',
    fontFamily: 'sans-serif-medium',
    letterSpacing: 1,
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 8,
  },
  title: {
    fontSize: 28,
    paddingTop: 12,
    fontWeight: 'bold',
    alignSelf: 'center',
    color: COLORS.darkGray,
    letterSpacing: 1,
  },
  contentBox: {
    backgroundColor: COLORS.white,
    padding: 12,
    borderEndColor: COLORS.brown,
    borderWidth: 1.5,
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
 
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 10,
  },
  tableHeaderText: {
    fontWeight: 'bold',
    color: COLORS.darkGray,
    fontSize: 15,
  },
  listContainer: {
    marginHorizontal: 8,
    marginBottom: 10,
    maxHeight:390,
  },
  arrowButton: {
  width: 36,
  height: 36,
  alignItems: 'center',
  justifyContent: 'center',
  marginHorizontal: 2,
  backgroundColor: COLORS.white,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: COLORS.gray,
},
arrowDisabled: {
  opacity: 0.5,
},
squarePageButton: {
  width: 40,
  height: 40,
  backgroundColor: COLORS.green,
  borderRadius: 8,
  alignItems: 'center',
  justifyContent: 'center',
  marginHorizontal: 8,
},
squarePageText: {
  color: COLORS.white,
  fontWeight: 'bold',
  fontSize: 18,
},
  dateGroup: {
    marginBottom: 18,
  },
  dateHeaderBox: {
    backgroundColor: COLORS.gray,
    paddingVertical: 7,
    width: 330,
    paddingHorizontal: 12,
    marginBottom: 6,
    marginHorizontal: 0,
  },
  dateText: {
    color: COLORS.green,
    fontWeight: 'bold',
    fontSize: 15,
  },
  locationContainer: {
    marginBottom: 8,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
    marginHorizontal: 0,
    elevation: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  locationName: {
    flex: 1,
    fontSize: 15,
    color: COLORS.darkGray,
  },
  locationQty: {
    fontWeight: 'bold',
    fontSize: 15,
    color: COLORS.darkGray,
    marginLeft: 8,
  },
  expandIcon: {
    fontSize: 16,
    color: COLORS.green,
    marginLeft: 8,
  },
  reasonDetail: {
    borderWidth: 1,
    borderColor: COLORS.brickRed,
    borderRadius: 8,
    marginHorizontal: 8,
    marginBottom: 8,
    backgroundColor: COLORS.white,
    padding: 8,
    marginTop: 4,
  },
  reasonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: COLORS.brickRed,
    paddingBottom: 4,
    marginBottom: 6,
  },
  reasonHeaderText: {
    flex: 1,
    fontWeight: 'bold',
    color: COLORS.brickRed,
    fontSize: 14,
    textAlign: 'left',
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  reasonText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.darkGray,
  },
  reasonQty: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    textAlign: 'left',
  },
  menuIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  emptyReason: {
    color: COLORS.darkGray,
    fontStyle: 'italic',
    fontSize: 13,
    paddingVertical: 8,
    textAlign: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: COLORS.cream,
  },
  pageButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.green,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  pageButtonActive: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  pageButtonText: {
    color: COLORS.green,
    fontWeight: 'bold',
    fontSize: 15,
  },
  pageButtonTextActive: {
    color: COLORS.white,
  },
});

export default Reject;