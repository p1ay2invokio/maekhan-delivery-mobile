import React, { useEffect, useState } from 'react';
import { StyleSheet, Pressable, View, FlatList, ActivityIndicator, Linking } from 'react-native';
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

interface User {
  phoneNumber: string;
  name?: string;
  latitude?: number;
  longitude?: number;
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
  paymentMethod: string;
  items: OrderItem[];
  user: User;
}

export default function AdminOrdersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 1) {
      router.replace('/home');
    }
  }, [user]);

  const fetchAllOrders = async () => {
    try {
      if (!user?.token) return;

      const response = await fetch(`${API_URL}/api/admin/orders`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
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
  }, [user]);

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
      if (!user?.token) return;

      const response = await fetch(`${API_URL}/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
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

  const openGoogleMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    Linking.openURL(url).catch((err) => console.error("Couldn't load page", err));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'cancelled': return '#ef4444';
      case 'pending': return '#22c55e';
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
          <View style={[styles.statusBadge, { backgroundColor: item.paymentMethod === 'cod' ? '#fef9c3' : '#e0f2fe', marginRight: 4 }]}>
            <ThemedText style={[styles.statusText, { color: item.paymentMethod === 'cod' ? '#a16207' : '#0369a1' }]}>
              {item.paymentMethod === 'cod' ? 'ปลายทาง' : 'QR'}
            </ThemedText>
          </View>
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
        {item.deliveryMethod === 'delivery' && item.user?.latitude && item.user?.longitude && (
          <Pressable onPress={() => openGoogleMaps(item.user.latitude!, item.user.longitude!)} style={styles.mapsLink}>
            <ThemedText style={styles.mapsLinkText}>📍 ดูแผนที่</ThemedText>
          </Pressable>
        )}
      </View>

      <View style={styles.orderContent}>
        <View style={styles.customerRow}>
          <ThemedText themeColor="textSecondary">ลูกค้า: </ThemedText>
          <ThemedText style={styles.customerName}>{item.user?.name || 'ไม่ระบุชื่อ'} ({item.userPhone})</ThemedText>
        </View>
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

        {item.status === 'pending' && (item.paymentStatus === 'paid' || item.paymentMethod === 'cod') && (
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
            <ActivityIndicator size="large" color="#22c55e" />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -Spacing.one,
    marginBottom: Spacing.one,
  },
  deliveryMethodText: {
    fontSize: 12,
  },
  mapsLink: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mapsLinkText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
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
    fontSize: 14,
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
    color: '#22c55e',
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
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  }
});
