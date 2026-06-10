import React, { useEffect, useState } from 'react';
import { StyleSheet, Pressable, View, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCart } from '@/hooks/use-cart';

const API_URL = 'http://192.168.1.34:3001';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  points: number;
  quantity: number;
}

interface Order {
  id: string;
  createdAt: string;
  totalCash: number;
  totalPoints: number;
  status: string;
  paymentStatus: string;
  deliveryMethod: string;
  items: OrderItem[];
}

export default function OrderHistoryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchOrders = async () => {
    if (!user?.token) return;
    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      const result = await response.json();
      if (result.status === 'success') {
        setOrders(result.data);
        setFilteredOrders(result.data);
      }
    } catch (error) {
      console.error('Fetch orders failed', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredOrders(orders);
    } else if (activeFilter === 'unpaid') {
      setFilteredOrders(orders.filter(o => o.paymentStatus === 'unpaid'));
    } else if (activeFilter === 'processing') {
      setFilteredOrders(orders.filter(o => o.paymentStatus === 'paid' && o.status === 'pending'));
    } else if (activeFilter === 'completed') {
      setFilteredOrders(orders.filter(o => o.status === 'completed'));
    }
  }, [activeFilter, orders]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string, paymentStatus: string) => {
    if (status === 'cancelled') return '#64748b'; // Gray
    if (paymentStatus === 'unpaid') return '#ef4444'; // Red for unpaid
    switch (status) {
      case 'completed': return '#10b981'; // Green
      case 'pending': return '#22c55e';   // Green (formerly orange #22c55e)
      default: return '#22c55e';          // Orange
    }
  };

  const getStatusText = (status: string, paymentStatus: string) => {
    if (status === 'cancelled') return 'ยกเลิกแล้ว';
    if (paymentStatus === 'unpaid') return 'ยังไม่ชำระเงิน';
    switch (status) {
      case 'completed': return 'สำเร็จแล้ว';
      case 'pending': return 'รอดำเนินการรับของ';
      default: return status;
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <Pressable 
      disabled={item.paymentStatus !== 'unpaid' || item.status !== 'pending'}
      onPress={() => {
        router.push({
          pathname: '/payment-qr',
          params: {
            orderId: item.id,
            finalCash: item.totalCash.toString(),
            totalPoints: item.totalPoints.toString(),
            deliveryMethod: item.deliveryMethod,
            createdAt: item.createdAt
          }
        });
      }}
    >
      <ThemedView style={[styles.orderCard, { backgroundColor: theme.backgroundElement }]}>
        <View style={styles.orderHeader}>
          <View>
            <ThemedText style={styles.orderId}>#{item.id.slice(-6).toUpperCase()}</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.orderDate}>{formatDate(item.createdAt)}</ThemedText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status, item.paymentStatus) + '20' }]}>
            <ThemedText style={[styles.statusText, { color: getStatusColor(item.status, item.paymentStatus) }]}>
              {getStatusText(item.status, item.paymentStatus)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.paymentInfoRow}>
          <ThemedText style={[styles.paymentStatusText, { color: item.paymentStatus === 'paid' ? '#10b981' : (item.status === 'cancelled' ? '#64748b' : '#ef4444') }]}>
            ● {item.paymentStatus === 'paid' ? 'ชำระเงินแล้ว' : (item.status === 'cancelled' ? 'หมดเวลา/ยกเลิก' : 'ค้างชำระ')}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.deliveryMethodText}>
            | วิธีรับสินค้า: {item.deliveryMethod === 'delivery' ? 'จัดส่ง' : 'รับเอง'}
          </ThemedText>
        </View>

        <View style={styles.orderContent}>
          <ThemedText style={styles.itemsList} numberOfLines={2}>
            {item.items.map(i => `${i.name} x${i.quantity}`).join(', ')}
          </ThemedText>
        </View>

        <View style={styles.orderFooter}>
          <View style={styles.footerInfo}>
            <ThemedText style={styles.totalPrice}>฿{item.totalCash.toLocaleString()}</ThemedText>
            <ThemedText style={styles.pointsEarned}>ใช้ไป {item.totalPoints} P</ThemedText>
          </View>
          {item.paymentStatus === 'unpaid' && item.status === 'pending' && (
            <ThemedText style={{ color: '#22c55e', fontSize: 12, fontWeight: 'bold' }}>
              แตะเพื่อชำระเงิน >
            </ThemedText>
          )}
        </View>
      </ThemedView>
    </Pressable>
  );

  const FilterButton = ({ label, value }: { label: string, value: string }) => (
    <Pressable 
      onPress={() => setActiveFilter(value)}
      style={[
        styles.filterButton, 
        activeFilter === value && { backgroundColor: '#22c55e' }
      ]}
    >
      <ThemedText style={[
        styles.filterButtonText, 
        activeFilter === value && { color: 'white' }
      ]}>
        {label}
      </ThemedText>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={{ fontSize: 24 }}>←</ThemedText>
          </Pressable>
          <ThemedText type="subtitle">ประวัติการสั่งซื้อ</ThemedText>
          <View style={{ width: 40 }} />
        </ThemedView>

        <View style={styles.filterContainer}>
          <FilterButton label="ทั้งหมด" value="all" />
          <FilterButton label="ยังไม่จ่าย" value="unpaid" />
          <FilterButton label="รอรับของ" value="processing" />
          <FilterButton label="สำเร็จ" value="completed" />
        </View>

        {loading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#22c55e" />
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            renderItem={renderOrderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ThemedText themeColor="textSecondary">ไม่พบประวัติการสั่งซื้อ</ThemedText>
              </View>
            }
          />
        )}
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.two,
    gap: Spacing.two,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.eight,
    gap: Spacing.three,
    flexGrow: 1,
  },
  orderCard: {
    padding: Spacing.four,
    borderRadius: 20,
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderDate: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  paymentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: -Spacing.one,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  deliveryMethodText: {
    fontSize: 12,
  },
  orderContent: {
    gap: 4,
  },
  itemsList: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  pointsEarned: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  }
});
