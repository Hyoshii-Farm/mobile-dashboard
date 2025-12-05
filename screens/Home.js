import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Image,
  ActivityIndicator,
  Modal,
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
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logoutRedirectUri = Linking.createURL('logout'); // must be allowed in Kinde + set in Provider

  // Handle deep link after logout returns
  useEffect(() => {
    const handleUrl = ({ url }) => {
      const lower = (url || '').toLowerCase();
      const parsed = Linking.parse(url);
      const path = (parsed?.path || '').toLowerCase();
      if (lower.includes('logout') || path.includes('logout')) {
        setIsLoggingOut(false);
        setMenuVisible(false);
        navigation.reset({ index: 0, routes: [{ name: 'LogIn' }] });
      }
    };

    Linking.getInitialURL().then((url) => url && handleUrl({ url }));
    const sub = Linking.addEventListener('url', handleUrl);
    return () => sub.remove();
  }, [navigation]);

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

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout({ logoutRedirectUri }); // opens browser, returns to /logout
      // deep link listener above will handle close + navigation
    } catch (err) {
      console.error('Kinde logout failed:', err);
      setIsLoggingOut(false);
      setMenuVisible(false);
      navigation.reset({ index: 0, routes: [{ name: 'LogIn' }] });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBarCustom backgroundColor="#1D4949" />

      <HomeHeader
        title="HYOSHII FARM"
        onLeftPress={() => {}}
        profileContent={
          <TouchableOpacity style={styles.avatar} onPress={() => setMenuVisible(true)}>
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </TouchableOpacity>
        }
      />

      <Modal
        visible={menuVisible}
        animationType="fade"
        transparent
        onRequestClose={() => !isLoggingOut && setMenuVisible(false)}
      >
        {/* The Pressable now acts as the full-screen backdrop */}
        <Pressable
          style={styles.backdrop}
          onPress={() => {
            if (!isLoggingOut) setMenuVisible(false);
          }}
        >
          {/* This container positions the menu correctly */}
          <View style={styles.menuContainer}>
            {/* This inner Pressable stops touches on the menu from
              propagating to the backdrop, so tapping the menu won't close it.
            */}
            <Pressable>
              <View style={styles.menu}>
                <TouchableOpacity
                  style={[styles.menuItem, isLoggingOut && styles.menuItemDisabled]}
                  onPress={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <View style={styles.rowCenter}>
                      <ActivityIndicator size="small" />
                      <Text style={[styles.menuItemText, { marginLeft: 8 }]}>Logging out…</Text>
                    </View>
                  ) : (
                    <Text style={styles.menuItemText}>Logout</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.mainTitle}>HYOSHII MOBILE DASHBOARD</Text>

        <HomePageSection
          items={[
            { iconSvg: placeholderSvg, label: 'Reject GH', onPress: () => navigation.navigate('Reject') },
            { iconSvg: placeholderSvg, label: 'Monitoring Hama', onPress: () => navigation.navigate('HamaPenyakitTanaman') },
            { iconSvg: placeholderSvg, label: 'Mortalitas', onPress: () => navigation.navigate('Mortality') },
            { iconSvg: placeholderSvg, label: 'Penggunaan Pestisida', onPress: () => navigation.navigate('PesticideUsage') },
          ]}
        />

        <HomePageSection
          title="Laporan"
          items={[
            { iconSvg: placeholderSvg, label: 'Produksi', onPress: () => navigation.navigate('LaporanProduksi') },
            { iconSvg: placeholderSvg, label: 'Produktifitas', onPress: () => {} },
            { iconSvg: placeholderSvg, label: 'Hama dan Penyakit', onPress: () => navigation.navigate('LaporanHPT') },
            { iconSvg: placeholderSvg, label: 'Lokasi', onPress: () => {} },
          ]}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F5ED' },

  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FFFFF8', alignItems: 'center',
    justifyContent: 'center', overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 18 },
  avatarText: { color: '#1D4949', fontWeight: 'bold' },

  // Updated styles for the modal
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)', // Optional: a slight tint helps see the backdrop
  },
  menuContainer: {
    // This now just aligns the menu to the top right of the backdrop
    alignItems: 'flex-end',
    paddingTop: 80, // Adjust to position menu vertically
    paddingRight: 16,
  },
  menu: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 6,
    minWidth: 120,
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  // End of updated styles

  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  menuItemDisabled: { opacity: 0.6 },
  menuItemText: { color: '#1D4949', fontWeight: '600' },

  rowCenter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },

  scrollContainer: { padding: 20, gap: 16, paddingBottom: 40 },
  mainTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5B50',
    textAlign: 'center',
    marginBottom: 24,
  },
});