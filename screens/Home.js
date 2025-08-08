import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Image,
  Alert,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { useKindeAuth } from '@kinde/expo';
import StatusBarCustom from '../components/statusbar';
import HomeHeader from '../components/Header';
import HomePageSection from '../components/HomePageSection';

const placeholderSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
    <circle cx="12" cy="12" r="10" fill="#1C1B1F"/>
  </svg>
`;

export default function Home() {
  const navigation = useNavigation();
  const { getUserProfile, logout } = useKindeAuth();

  const [initials, setInitials] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);

  // Same logoutRedirectUri you whitelisted and passed in KindeAuthProvider
  const logoutRedirectUri = Linking.createURL('logout'); // exp://.../--/logout (dev) or hyoshiiapp://logout (prod)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getUserProfile();
        if (user?.picture) {
          setProfilePic(user.picture);
        } else if (user?.email) {
          const namePart = user.email.split('@')[0];
          const chars = namePart
            .split(/[.\-_]/)
            .map((part) => part.charAt(0).toUpperCase())
            .join('');
          setInitials(chars || namePart.charAt(0).toUpperCase());
        }
      } catch (err) {
        console.error('Failed to get user profile:', err);
      }
    };
    fetchUser();
  }, [getUserProfile]);

  const confirmLogout = () => {
    setMenuVisible(false);
    Alert.alert(
      'Log out?',
      'Are you sure you want to log out of Hyoshii?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: handleLogout },
      ]
    );
  };

  const handleLogout = async () => {
    try {
      await logout({ logoutRedirectUri });
    } catch (err) {
      console.error('Kinde logout failed:', err);
    } finally {
      setInitials('');
      setProfilePic(null);
      setMenuVisible(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'LogIn' }],
      });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBarCustom backgroundColor="#1D4949" />

      {/* Full-screen overlay to close the menu when tapping outside */}
      <Pressable
        pointerEvents={menuVisible ? 'auto' : 'none'}
        style={styles.overlay}
        onPress={() => setMenuVisible(false)}
      />

      <HomeHeader
        title="HYOSHII FARM"
        showHomeButton={false}
        onLeftPress={() => {}}
        profileContent={
          <View style={{ position: 'relative', zIndex: 2000 }} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.avatar}
              onPress={() => setMenuVisible((v) => !v)}
            >
              {profilePic ? (
                <Image source={{ uri: profilePic }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
            </TouchableOpacity>

            {menuVisible && (
              <View style={styles.menu}>
                <TouchableOpacity style={styles.menuItem} onPress={confirmLogout}>
                  <Text style={styles.menuItemText}>Logout</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
      />

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
            { iconSvg: placeholderSvg, label: 'Pesticide Usage', onPress: () => navigation.navigate('PesticideUsage') },
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
  container: { flex: 1, backgroundColor: '#FFF9F2' },

  // Full-screen overlay to dismiss the menu when visible
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1500, // below the dropdown menu (zIndex 2000), above everything else
    backgroundColor: 'transparent',
  },

  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FFFFF8', alignItems: 'center',
    justifyContent: 'center', overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 18 },
  avatarText: { color: '#1D4949', fontWeight: 'bold' },

  menu: {
    position: 'absolute',
    top: 45,
    left: '10%',
    transform: [{ translateX: -40 }],
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingVertical: 5,
    minWidth: 80,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    zIndex: 2000,
  },

  menuItem: { paddingHorizontal: 16, paddingVertical: 8 },
  menuItemText: { color: '#1D4949', fontWeight: '500' },
  scrollContainer: { padding: 20, gap: 16, paddingBottom: 40 },
});
