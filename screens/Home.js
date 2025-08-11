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
        showHomeButton={false}
        onLeftPress={() => {}}
        profileContent={
          <View pointerEvents="box-none">
            <TouchableOpacity style={styles.avatar} onPress={() => setMenuVisible(true)}>
              {profilePic ? (
                <Image source={{ uri: profilePic }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
            </TouchableOpacity>
          </View>
        }
      />

      <Modal
        visible={menuVisible}
        animationType="fade"
        transparent
        onRequestClose={() => !isLoggingOut && setMenuVisible(false)}
      >
       
        <Pressable
          style={styles.backdrop}
          onPress={() => {
            if (!isLoggingOut) setMenuVisible(false);
          }}
        />
        {/* Floating menu near the top-right (under the avatar) */}
        <View style={styles.menuContainer} pointerEvents="box-none">
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
        </View>
      </Modal>

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

  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FFFFF8', alignItems: 'center',
    justifyContent: 'center', overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 18 },
  avatarText: { color: '#1D4949', fontWeight: 'bold' },


  backdrop: {
    flex: 1,
    backgroundColor: 'transparent', 
  },

  // Container that positions the popover menu at top-right-ish
  menuContainer: {
    position: 'absolute',
    top: 70,     
    right: 16,
    left: undefined,
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
});
