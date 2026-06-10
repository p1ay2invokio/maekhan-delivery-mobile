import React, { useEffect, useState } from 'react';
import { StyleSheet, Pressable, View, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

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
  userPhone: string;
  createdAt: string;
  totalCash: number;
  totalPoints: number;
  status: string;
  paymentStatus: string;
  deliveryMethod: string;
  items: OrderItem[];
}

export default function AdminOrdersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/orders`);
      const result = await response.json();
      if (result.status === 'success') {
        setOrders(result.data);
      }
    } catch (error) {
      console.error('Fetch all orders failed', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

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

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });
      const result = await response.json();
      if (result.status === 'success') {
        fetchAllOrders(); // Refresh list
      }
    } catch (error) {
      console.error('Update order status failed', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'cancelled': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#64748b';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'สำเร็จ';
      case 'cancelled': return 'ยกเลิก';
      case 'pending': return 'รอดำเนินการ';
      default: return status;
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <ThemedView style={[styles.orderCard, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.orderHeader}>
        <View>
          <ThemedText style={styles.orderId}>#{item.id.slice(-6).toUpperCase()}</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.orderDate}>{formatDate(item.createdAt)}</ThemedText>
        </View>
        <View style={styles.statusGroup}>
          <View style={[styles.statusBadge, { backgroundColor: item.paymentStatus === 'paid' ? '#dcfce7' : '#fee2e2', marginRight: 4 }]}>
            <ThemedText style={[styles.statusText, { color: item.paymentStatus === 'paid' ? '#22c55e' : '#ef4444' }]}>
              {item.paymentStatus === 'paid' ? 'จ่ายแล้ว' : 'ยังไม่จ่าย'}
            </ThemedText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <ThemedText style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusText(item.status)}
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.deliveryMethodRow}>
        <ThemedText themeColor="textSecondary" style={styles.deliveryMethodText}>
          วิธีรับสินค้า: {item.deliveryMethod === 'delivery' ? 'จัดส่งถึงที่' : 'รับเองที่ร้าน'}
        </ThemedText>
      </View>

      <View style={styles.orderContent}>
        <View style={styles.customerRow}>
          <ThemedText themeColor="textSecondary">เบอร์โทร: </ThemedText>
          <ThemedText style={styles.customerName}>{item.userPhone}</ThemedText>
        </View>
        <ThemedText style={styles.itemsList} numberOfLines={1}>
          {item.items.map(i => `${i.name} x${i.quantity}`).join(', ')}
        </ThemedText>
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.footerInfo}>
          <ThemedText style={styles.totalPrice}>฿{item.totalCash.toLocaleString()}</ThemedText>
          <ThemedText style={styles.pointsEarned}>ใช้ไป {item.totalPoints} P</ThemedText>
        </View>

        {item.status === 'pending' && item.paymentStatus === 'paid' && (
          <View style={styles.actionButtons}>
            <Pressable 
              style={styles.cancelButton}
              onPress={() => updateOrderStatus(item.id, 'cancelled')}
            >
              <ThemedText style={styles.cancelButtonText}>ยกเลิก</ThemedText>
            </Pressable>
            <Pressable 
              style={styles.confirmButton}
              onPress={() => updateOrderStatus(item.id, 'completed')}
            >
              <ThemedText style={styles.confirmButtonText}>ยืนยัน</ThemedText>
            </Pressable>
          </View>
        )}
      </View>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={{ fontSize: 24 }}>←</ThemedText>
          </Pressable>
          <ThemedText type="subtitle">ประวัติการสั่งซื้อทั้งหมด</ThemedText>
          <View style={{ width: 40 }} />
        </ThemedView>

        {loading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#f97316" />
          </View>
        ) : (
          <FlatList
            data={orders}
            renderItem={renderOrderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ThemedText themeColor="textSecondary">ยังไม่มีรายการสั่งซื้อ</ThemedText>
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
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.eight,
    gap: Spacing.three,
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
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
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
  deliveryMethodRow: {
    marginTop: -Spacing.one,
    marginBottom: Spacing.one,
  },
  deliveryMethodText: {
    fontSize: 12,
  },
  orderContent: {
    gap: 4,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerName: {
    fontWeight: '600',
    fontSize: 14,
  },
  itemsList: {
    fontSize: 13,
    color: '#64748b',
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
    color: '#f59e0b',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  confirmButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#dcfce7',
  },
  confirmButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22c55e',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#fee2e2',
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  }
});
