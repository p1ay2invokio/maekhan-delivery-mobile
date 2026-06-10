import { StyleSheet, Pressable, ScrollView, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const API_URL = 'http://192.168.1.34:3001';

const ADMIN_ACTIONS = [
  { id: '1', title: 'จัดการสินค้า', icon: 'cart.badge.plus', color: '#f97316', route: '/admin-products' },
  { id: '2', title: 'ประวัติการสั่งซื้อทั้งหมด', icon: 'doc.text.magnifyingglass', color: '#10b981', route: '/admin-orders' },
  { id: '3', title: 'จัดการสมาชิก', icon: 'person.2.fill', color: '#f59e0b', route: '/admin-users' },
  { id: '4', title: 'ตั้งค่าระบบ', icon: 'gearshape.2.fill', color: '#64748b', route: '/system-settings' },
];

interface AdminStats {
  dailySales: number;
  dailyOrders: number;
  totalUsers: number;
}

export default function AdminScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/stats`);
      const result = await response.json();
      if (result.status === 'success') {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Fetch stats failed', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = (action: any) => {
    if (action.route) {
      router.push(action.route);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.headerTop}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <SymbolView name="chevron.left" size={24} tintColor={theme.text} />
          </Pressable>
          <ThemedText type="subtitle">แอดมิน</ThemedText>
          <View style={{ width: 40 }} />
        </ThemedView>

        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">ระบบจัดการแอดมิน</ThemedText>
          <ThemedText themeColor="textSecondary">จัดการข้อมูลร้านค้าและสมาชิก</ThemedText>
        </ThemedView>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* ── Stats Summary ── */}
          {loading ? (
            <ActivityIndicator size="small" color="#f97316" />
          ) : (
            <View style={styles.statsRow}>
              <View style={[styles.statBox, { backgroundColor: 'rgba(60, 135, 247, 0.1)' }]}>
                <ThemedText style={{ color: '#f97316', fontWeight: 'bold' }}>ยอดขายวันนี้</ThemedText>
                <ThemedText type="subtitle">฿{(stats?.dailySales || 0).toLocaleString()}</ThemedText>
              </View>
              <View style={[styles.statBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <ThemedText style={{ color: '#10b981', fontWeight: 'bold' }}>คำสั่งซื้อวันนี้</ThemedText>
                <ThemedText type="subtitle">{(stats?.dailyOrders || 0)} รายการ</ThemedText>
              </View>
            </View>
          )}

          {/* ── Admin Menu ── */}
          <View style={styles.menuGrid}>
            {ADMIN_ACTIONS.map((action) => (
              <Pressable
                key={action.id}
                onPress={() => handleAction(action)}
                style={({ pressed }) => [
                  styles.actionCard,
                  { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.8 : 1 }
                ]}
              >
                <View style={[styles.iconBox, { backgroundColor: action.color }]}>
                  <SymbolView name={action.icon as any} size={24} tintColor="white" />
                </View>
                <ThemedText style={styles.actionTitle}>{action.title}</ThemedText>
                <SymbolView name="chevron.right" size={14} tintColor={theme.textSecondary} />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  safeArea: { flex: 1, width: '100%', maxWidth: MaxContentWidth },
  header: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    gap: Spacing.one,
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
  scrollContent: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.six,
    paddingBottom: Spacing.six,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  statBox: {
    flex: 1,
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  menuGrid: {
    gap: Spacing.three,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.four,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
});
