import { StyleSheet, Pressable, View, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SymbolView } from 'expo-symbols';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCart } from '@/hooks/use-cart';

export default function ShippingAddressScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, refreshUser, isLoading } = useCart();

  useEffect(() => {
    refreshUser();
  }, []);

  const hasAddress = user?.address || user?.subDistrict || user?.district || user?.province || user?.postalCode;

  const fullAddress = [
    user?.address,
    user?.subDistrict ? `ต.${user.subDistrict}` : null,
    user?.district ? `อ.${user.district}` : null,
    user?.province ? `จ.${user.province}` : null,
    user?.postalCode
  ].filter(Boolean).join(' ');

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={{ fontSize: 24 }}>←</ThemedText>
          </Pressable>
          <ThemedText type="subtitle">ที่อยู่สำหรับการจัดส่ง</ThemedText>
          <View style={{ width: 40 }} />
        </ThemedView>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#22c55e" style={{ marginTop: 40 }} />
          ) : hasAddress ? (
            <Pressable 
              onPress={() => router.push('/add-address')}
              style={({ pressed }) => [
                styles.addressCard, 
                { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.9 : 1 }
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.labelRow}>
                  <ThemedText style={styles.label}>ที่อยู่ปัจจุบัน</ThemedText>
                  <View style={styles.defaultBadge}>
                    <ThemedText style={styles.defaultText}>เริ่มต้น</ThemedText>
                  </View>
                </View>
                <SymbolView name="pencil.circle.fill" size={20} tintColor="#22c55e" />
              </View>

              <View style={styles.cardContent}>
                <ThemedText style={styles.userName}>{user?.name} | {user?.phoneNumber}</ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.addressText}>
                  {fullAddress}
                </ThemedText>
              </View>
            </Pressable>
          ) : (
            <View style={styles.emptyContainer}>
              <ThemedText themeColor="textSecondary">ยังไม่มีที่อยู่สำหรับการจัดส่ง</ThemedText>
            </View>
          )}

          {!isLoading && (
            <Pressable 
              style={({ pressed }) => [styles.addButton, { opacity: pressed ? 0.8 : 1 }]}
              onPress={() => router.push('/add-address')}
            >
              <SymbolView name="plus.circle.fill" size={20} tintColor="white" />
              <ThemedText style={styles.addButtonText}>{hasAddress ? 'แก้ไขที่อยู่' : 'เพิ่มที่อยู่ใหม่'}</ThemedText>
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.eight,
    gap: Spacing.four,
  },
  addressCard: {
    padding: Spacing.four,
    borderRadius: 20,
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  defaultBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultText: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: 'bold',
  },
  cardContent: {
    gap: 4,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
  },
  addressText: {
    fontSize: 13,
    lineHeight: 18,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    padding: Spacing.four,
    borderRadius: 16,
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    paddingTop: 100,
    alignItems: 'center',
  },
});
