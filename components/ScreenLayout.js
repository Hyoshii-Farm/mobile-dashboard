import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Modal,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  Alert,
} from 'react-native';
import * as Linking from 'expo-linking';
import { useKindeAuth } from '@kinde/expo';

import StatusBarCustom from './statusbar';
import Header from './Header';

// Default logo SVG for header
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="19" height="30" viewBox="0 0 19 30" fill="none"><path d="M15.4537 30L0.859123 15L15.4537 0L18.8591 3.5L7.66993 15L18.8591 26.5L15.4537 30Z" fill="#FBF7EB"/></svg>`;

/**
 * ScreenLayout - Comprehensive layout component that handles:
 * - StatusBar with proper safe area
 * - Header with profile functionality
 * - User authentication and profile management
 * - Logout functionality with loading states
 * 
 * This eliminates the need to rewrite fetchUser, handleLogout, and status bar setup in every screen.
 */
export default function ScreenLayout({ 
  children, 
  showHeader = true, 
  headerTitle = 'HYOSHII FARM',
  headerLogoSvg = logoSvg,
  onHeaderLeftPress = null,
  statusBarColor = '#1D4949',
  containerStyle = {},
}) {
  const { getUserProfile, logout, getAccessToken, isAuthenticated } = useKindeAuth();

  // Profile state management
  const [initials, setInitials] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Logout redirect configuration
  const logoutRedirectUri = Linking.createURL('/');

  // Fetch user profile data
  const fetchUser = useCallback(async () => {
    try {
      if (!isAuthenticated) return;
      
      const profile = await getUserProfile();
      
      if (profile?.given_name || profile?.family_name) {
        const firstInitial = profile.given_name?.charAt(0)?.toUpperCase() || '';
        const lastInitial = profile.family_name?.charAt(0)?.toUpperCase() || '';
        setInitials(`${firstInitial}${lastInitial}`);
      } else if (profile?.email) {
        setInitials(profile.email.charAt(0).toUpperCase());
      }

      if (profile?.picture) {
        setProfilePic(profile.picture);
      }
    } catch (error) {
      // Set fallback initials
      setInitials('U');
    }
  }, [getUserProfile, isAuthenticated]);

  // Handle logout with loading state
  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      await logout({ logoutRedirectUri });
    } catch (error) {
      Alert.alert(
        'Logout Gagal',
        'Terjadi kesalahan saat logout. Silakan coba lagi.',
        [{ text: 'Mengerti', style: 'default' }]
      );
    } finally {
      setIsLoggingOut(false);
      setMenuVisible(false);
    }
  }, [logout, logoutRedirectUri, isLoggingOut]);

  // Fetch user data on mount and auth changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchUser();
    }
  }, [isAuthenticated, fetchUser]);

  // Profile content for header
  const profileContent = showHeader ? (
    <TouchableOpacity
      style={styles.avatar}
      onPress={() => setMenuVisible(true)}
      disabled={isLoggingOut}
    >
      {profilePic ? (
        <Image source={{ uri: profilePic }} style={styles.avatarImage} />
      ) : (
        <Text style={styles.avatarText}>{initials}</Text>
      )}
    </TouchableOpacity>
  ) : null;

  return (
    <View style={[styles.container, containerStyle]}>
      <StatusBarCustom backgroundColor={statusBarColor} />
      
      {/* Profile menu modal */}
      {showHeader && (
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
          >
            <View style={styles.menuContainer}>
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
                        <Text style={[styles.menuItemText, { marginLeft: 8 }]}>Keluar…</Text>
                      </View>
                    ) : (
                      <Text style={styles.menuItemText}>Keluar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      )}

      {/* Header */}
      {showHeader && (
        <Header
          title={headerTitle}
          logoSvg={headerLogoSvg}
          onLeftPress={onHeaderLeftPress}
          profileContent={profileContent}
        />
      )}

      {/* Main content */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F2',
  },
  
  // Profile avatar styles
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFF8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  avatarText: {
    color: '#1D4949',
    fontWeight: 'bold',
  },

  // Modal and menu styles
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  menuContainer: {
    alignItems: 'flex-end',
    paddingTop: 80,
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
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  menuItemDisabled: {
    opacity: 0.6,
  },
  menuItemText: {
    color: '#1D4949',
    fontWeight: '600',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});