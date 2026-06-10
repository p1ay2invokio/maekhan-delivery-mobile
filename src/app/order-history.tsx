import React, { useEffect, useState } from 'react';
import { StyleSheet, Pressable, View, FlatList, ActivityIndicator, Alert } from 'react-native';
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
  paymentMethod: string;
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
      setFilteredOrders(orders.filter(o => o.paymentStatus === 'unpaid' && o.paymentMethod !== 'cod'));
    } else if (activeFilter === 'processing') {
      setFilteredOrders(orders.filter(o => (o.paymentStatus === 'paid' || o.paymentMethod === 'cod') && o.status === 'pending'));
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

  const cancelOrder = async (orderId: string) => {
    if (!user?.token) return;
    
    Alert.alert(
      'ยกเลิกรายการ',
      'คุณต้องการยกเลิกรายการสั่งซื้อนี้ใช่หรือไม่?',
      [
        { text: 'ไม่ใช่', style: 'cancel' },
        {
          text: 'ใช่, ยกเลิก',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/api/orders/${orderId}/cancel`, {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${user.token}`
                }
              });
              const result = await response.json();
              if (result.status === 'success') {
                fetchOrders(); // Refresh list
              } else {
                Alert.alert('ผิดพลาด', result.message || 'ไม่สามารถยกเลิกได้');
              }
            } catch (error) {
              console.error('Cancel order failed', error);
              Alert.alert('ผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (order: Order) => {
    if (order.status === 'cancelled') return '#64748b'; // Gray
    if (order.paymentStatus === 'unpaid' && order.paymentMethod !== 'cod') return '#ef4444'; // Red for unpaid (QR)
    switch (order.status) {
      case 'completed': return '#10b981'; // Green
      case 'pending': return '#22c55e';   // Green
      default: return '#22c55e';
    }
  };

  const getStatusText = (order: Order) => {
    if (order.status === 'cancelled') return 'ยกเลิกแล้ว';
    if (order.paymentStatus === 'unpaid' && order.paymentMethod !== 'cod') return 'ยังไม่ชำระเงิน';
    switch (order.status) {
      case 'completed': return 'สำเร็จแล้ว';
      case 'pending': return 'รอดำเนินการ';
      default: return order.status;
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <Pressable 
      disabled={item.paymentMethod === 'cod' || item.paymentStatus === 'paid' || item.status !== 'pending'}
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
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <View style={[styles.statusBadge, { backgroundColor: item.paymentMethod === 'cod' ? '#fef9c3' : '#e0f2fe' }]}>
              <ThemedText style={[styles.statusText, { color: item.paymentMethod === 'cod' ? '#a16207' : '#0369a1' }]}>
                {item.paymentMethod === 'cod' ? 'ปลายทาง' : 'QR'}
              </ThemedText>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item) + '20' }]}>
              <ThemedText style={[styles.statusText, { color: getStatusColor(item) }]}>
                {getStatusText(item)}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.paymentInfoRow}>
          <ThemedText style={[styles.paymentStatusText, { color: item.paymentStatus === 'paid' ? '#10b981' : (item.status === 'cancelled' ? '#64748b' : '#ef4444') }]}>
            ● {item.paymentStatus === 'paid' ? 'ชำระเงินแล้ว' : (item.status === 'cancelled' ? 'หมดเวลา/ยกเลิก' : (item.paymentMethod === 'cod' ? 'ชำระปลายทาง' : 'ค้างชำระ'))}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.deliveryMethodText}>
            | วิธีรับสินค้า: {item.deliveryMethod === 'delivery' ? 'จัดส่ง' : 'รับเอง'}
          </ThemedText>
        </View>

        <View style={styles.orderContent}>
          {item.items.map((i, index) => (
            <View key={`${i.id}-${index}`} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
              <ThemedText style={[styles.itemsList, { flex: 1, paddingRight: 8 }]} numberOfLines={1}>
                {i.name} x{i.quantity}
              </ThemedText>
              <ThemedText style={[styles.itemsList, { color: '#334155' }]}>
                ฿{(i.price * i.quantity).toLocaleString()}
              </ThemedText>
            </View>
          ))}
        </View>

        <View style={styles.orderFooter}>
          <View style={styles.footerInfo}>
            <ThemedText style={styles.totalPrice}>฿{item.totalCash.toLocaleString()}</ThemedText>
            <ThemedText style={styles.pointsEarned}>ใช้ไป {item.totalPoints} P</ThemedText>
          </View>
          
          <View style={{ flexDirection: 'row', gap: Spacing.two, alignItems: 'center' }}>
            {item.status === 'pending' && item.paymentMethod === 'cod' && (
              <Pressable 
                onPress={() => cancelOrder(item.id)}
                style={styles.cancelBtn}
              >
                <ThemedText style={styles.cancelBtnText}>ยกเลิก</ThemedText>
              </Pressable>
            )}

            {item.status === 'pending' && item.paymentMethod === 'qr' && item.paymentStatus === 'unpaid' && (
              <Pressable 
                onPress={() => cancelOrder(item.id)}
                style={styles.cancelBtn}
              >
                <ThemedText style={styles.cancelBtnText}>ยกเลิก</ThemedText>
              </Pressable>
            )}
            
            {item.paymentStatus === 'unpaid' && item.status === 'pending' && item.paymentMethod !== 'cod' && (
              <ThemedText style={{ color: '#22c55e', fontSize: 14, fontWeight: 'bold' }}>
                ชำระเงิน >
              </ThemedText>
            )}
          </View>
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
          <ThemedText type="subtitle" style={{ fontSize: 22 }}>ประวัติการสั่งซื้อ</ThemedText>
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
                <ThemedText themeColor="textSecondary" style={{ fontSize: 16 }}>ไม่พบประวัติการสั่งซื้อ</ThemedText>
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  filterButtonText: {
    fontSize: 14,
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  orderDate: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  paymentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: -Spacing.one,
  },
  paymentStatusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  deliveryMethodText: {
    fontSize: 14,
  },
  orderContent: {
    gap: 4,
  },
  itemsList: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 22,
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  pointsEarned: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  cancelBtnText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  }
});
