import { StyleSheet, Pressable, ScrollView, Alert, View, Platform, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import * as ImagePicker from 'expo-image-picker';
import React, { useState, useCallback } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCart } from '@/hooks/use-cart';

const API_URL = 'http://192.168.1.34:3001';

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, profileImage, updateProfileImage, logout, userPoints } = useCart();
  const router = useRouter();
  const [unpaidCount, setUnpaidCount] = useState(0);

  const fetchUnpaidOrders = useCallback(async () => {
    if (!user?.token) return;
    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      const result = await response.json();
      if (result.status === 'success') {
        const count = result.data.filter((o: any) => o.paymentStatus === 'unpaid' && o.status === 'pending').length;
        setUnpaidCount(count);
      }
    } catch (error) {
      console.error('Fetch unpaid orders failed', error);
    }
  }, [user?.token]);

  useFocusEffect(
    useCallback(() => {
      fetchUnpaidOrders();
    }, [fetchUnpaidOrders])
  );

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const handleImagePress = () => {
    Alert.alert(
      'เปลี่ยนรูปโปรไฟล์',
      'กรุณาเลือกช่องทาง',
      [
        { text: 'ถ่ายรูป', onPress: takePhoto },
        { text: 'เลือกจากคลังภาพ', onPress: pickImage },
        { text: 'ยกเลิก', style: 'cancel' },
      ]
    );
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('ขออภัย', 'แอปต้องการสิทธิ์เข้าถึงกล้องเพื่อถ่ายรูป');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      updateProfileImage(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      updateProfileImage(result.assets[0].uri);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.headerTop}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <SymbolView name="chevron.left" size={24} tintColor={theme.text} />
          </Pressable>
          <ThemedText type="subtitle">โปรไฟล์</ThemedText>
          <View style={{ width: 40 }} />
        </ThemedView>
        
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <ThemedView style={[styles.header, { backgroundColor: theme.background }]}>
            {/* Centered User Info */}
            <View style={styles.userInfoCentered}>
              <View style={styles.imageWrapper}>
                <Image
                  source={profileImage}
                  style={styles.profileImage}
                  contentFit="cover"
                  transition={200}
                />
                <Pressable 
                  style={({ pressed }) => [styles.editBadge, { opacity: pressed ? 0.8 : 1 }]}
                  onPress={handleImagePress}
                >
                  <SymbolView name="camera.fill" size={16} tintColor="white" />
                </Pressable>
              </View>
              <ThemedText type="subtitle">{user?.name || 'คุณลูกค้า'}</ThemedText>
              <ThemedText themeColor="textSecondary">{user?.phoneNumber || '08X-XXX-XXXX'}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">{user?.email}</ThemedText>

              {/* ── Points Card (Same as Home) ── */}
              <View style={[styles.pointsCard, { marginTop: Spacing.two, width: '100%' }]}>
                <ThemedText style={styles.pointsCardLabel}>แต้มสะสมของคุณ</ThemedText>
                <View style={styles.pointsValueContainer}>
                  <ThemedText style={styles.pointsCardValue}>
                    {userPoints.toLocaleString()}
                  </ThemedText>
                  <ThemedText style={styles.pointsUnit}>P</ThemedText>
                </View>
              </View>
            </View>
          </ThemedView>

          <ThemedView style={styles.menuContainer}>
            <MenuButton 
              icon="list.bullet.rectangle" 
              label="ประวัติการสั่งซื้อ" 
              color="#22c55e" 
              badge={unpaidCount}
              onPress={() => router.push('/order-history')}
            />
            <MenuButton 
              icon="mappin.and.ellipse" 
              label="ที่อยู่สำหรับการจัดส่ง" 
              color="#10b981" 
              onPress={() => router.push('/shipping-address')}
            />
            <MenuButton 
              icon="headset" 
              label="ติดต่อ support" 
              color="#22c55e" 
              onPress={() => Alert.alert('ติดต่อเจ้าหน้าที่', 'กรุณาติดต่อผ่าน Line: @membergrocery')}
            />
            <MenuButton 
              icon="gearshape" 
              label="ตั้งค่าบัญชี" 
              color="#64748b" 
              onPress={() => router.push('/account-settings')}
            />
            <MenuButton 
              icon="lock.shield" 
              label="จัดการระบบ (Admin)" 
              color="#ef4444" 
              onPress={() => router.push('/admin')}
            />
          </ThemedView>

          <Pressable 
            style={({ pressed }) => [styles.logoutButton, { opacity: pressed ? 0.8 : 1 }]}
            onPress={handleLogout}
          >
            <ThemedText style={styles.logoutText}>ออกจากระบบ</ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function MenuButton({ icon, label, color, badge, onPress }: { icon: string; label: string; color: string; badge?: number; onPress?: () => void }) {
  const theme = useTheme();
  return (
    <Pressable 
      onPress={onPress}
      style={({ pressed }) => [styles.menuButton, { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={[styles.iconBox, { backgroundColor: color }]}>
        <SymbolView name={icon as any} size={20} tintColor="white" />
      </View>
      <ThemedText style={styles.menuLabel}>{label}</ThemedText>
      {badge !== undefined && badge > 0 && (
        <View style={styles.badgeContainer}>
          <ThemedText style={styles.badgeText}>{badge}</ThemedText>
        </View>
      )}
      <SymbolView name="chevron.right" size={14} tintColor={theme.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  scrollContent: {
    paddingBottom: Spacing.six,
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: 0,
    gap: Spacing.four,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfoCentered: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  imageWrapper: {
    position: 'relative',
    marginBottom: Spacing.two,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  editBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#22c55e',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  // ── Points Card (Admin StatBox Style) ──
  pointsCard: {
    alignSelf: 'stretch',
    marginHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.six,
    backgroundColor: 'rgba(34, 197, 94, 0.08)', // Tinted Amber like Admin statBox
    borderRadius: 20,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  pointsCardLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#22c55e',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  pointsValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  pointsCardValue: {
    fontSize: 38,
    fontWeight: '800',
    color: '#d97706',
    lineHeight: 44,
  },
  pointsUnit: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22c55e',
  },
  menuContainer: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    marginTop: Spacing.six,
    marginBottom: Spacing.six,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: 20,
    gap: Spacing.four,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  badgeContainer: {
    backgroundColor: '#ef4444',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginRight: Spacing.two,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logoutButton: {
    marginHorizontal: Spacing.four,
    padding: Spacing.four,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ef4444',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  logoutText: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
});
