import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Pressable,
  View,
  FlatList,
  ActivityIndicator,
  Linking,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCart } from '@/hooks/use-cart';
import { API_URL } from '@/constants/config';

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
  pickupDetails?: string;
  items: OrderItem[];
  user: User;
}

type FilterKey = 'all' | 'pending' | 'completed' | 'cancelled';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'pending', label: 'รอดำเนินการ' },
  { key: 'completed', label: 'สำเร็จ' },
  { key: 'cancelled', label: 'ยกเลิก' },
];

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'รอดำเนินการ', color: '#d97706', bg: '#f59e0b1f' },
  completed: { label: 'สำเร็จ', color: '#16a34a', bg: '#22c55e1f' },
  cancelled: { label: 'ยกเลิก', color: '#dc2626', bg: '#ef44441f' },
};

export default function AdminOrdersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllOrders();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      if (!user?.token) return;
      setUpdatingId(orderId);

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
        await fetchAllOrders(); // Refresh list
      }
    } catch (error) {
      console.error('Update order status failed', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const openGoogleMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    Linking.openURL(url).catch((err) => console.error("Couldn't load page", err));
  };

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { all: orders.length, pending: 0, completed: 0, cancelled: 0 };
    orders.forEach((o) => {
      if (o.status in c) c[o.status as FilterKey] += 1;
    });
    return c;
  }, [orders]);

  const filteredOrders = useMemo(
    () => (filter === 'all' ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter]
  );

  const divider = { backgroundColor: theme.backgroundSelected };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const status = STATUS_STYLE[item.status] ?? { label: item.status, color: '#64748b', bg: '#64748b1f' };
    const isPaid = item.paymentStatus === 'paid';
    const isCod = item.paymentMethod === 'cod';
    const isDelivery = item.deliveryMethod === 'delivery';
    const hasLocation = isDelivery && !!item.user?.latitude && !!item.user?.longitude;
    const canAction = item.status === 'pending' && (isPaid || isCod);
    const isUpdating = updatingId === item.id;

    return (
      <View style={[styles.orderCard, { backgroundColor: theme.background, borderColor: theme.backgroundSelected }]}>
        {/* Header: ID / date / status */}
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.orderId}>#{item.id.slice(-6).toUpperCase()}</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.caption}>
              {formatDate(item.createdAt)}
            </ThemedText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            <ThemedText style={[styles.statusText, { color: status.color }]}>{status.label}</ThemedText>
          </View>
        </View>

        {/* Customer */}
        <View style={[styles.customerBox, { backgroundColor: theme.backgroundElement }]}>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.customerName} numberOfLines={1}>
              {item.user?.name || 'ไม่ระบุชื่อ'}
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.caption}>
              {item.userPhone}
            </ThemedText>
          </View>
          {hasLocation && (
            <Pressable
              onPress={() => openGoogleMaps(item.user.latitude!, item.user.longitude!)}
              style={({ pressed }) => [styles.mapsLink, pressed && { opacity: 0.6 }]}
            >
              <ThemedText style={styles.mapsLinkText}>ดูแผนที่</ThemedText>
            </Pressable>
          )}
        </View>

        {/* Meta chips */}
        <View style={styles.chipRow}>
          <View style={[styles.chip, { borderColor: theme.backgroundSelected }]}>
            <ThemedText themeColor="textSecondary" style={styles.chipText}>
              {isDelivery ? 'จัดส่งถึงที่' : 'รับที่ร้าน'}
            </ThemedText>
          </View>
          <View style={[styles.chip, { borderColor: theme.backgroundSelected }]}>
            <ThemedText themeColor="textSecondary" style={styles.chipText}>
              {isCod ? 'เก็บเงินปลายทาง' : 'QR พร้อมเพย์'}
            </ThemedText>
          </View>
          <View style={[styles.chip, { borderColor: isPaid ? '#22c55e55' : '#ef444455' }]}>
            <ThemedText style={[styles.chipText, { color: isPaid ? '#16a34a' : '#dc2626' }]}>
              {isPaid ? 'ชำระแล้ว' : 'ยังไม่ชำระ'}
            </ThemedText>
          </View>
        </View>

        {/* Items */}
        <View style={styles.itemsBlock}>
          {item.items.map((i, index) => (
            <View key={`${i.id}-${index}`} style={styles.itemRow}>
              <ThemedText themeColor="textSecondary" style={styles.itemQty}>
                {i.quantity}×
              </ThemedText>
              <ThemedText style={styles.itemName} numberOfLines={1}>
                {i.name}
              </ThemedText>
              <ThemedText style={styles.itemPrice}>
                ฿{(i.price * i.quantity).toLocaleString()}
              </ThemedText>
            </View>
          ))}
        </View>

        {item.pickupDetails ? (
          <View style={[styles.noteBox, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText themeColor="textSecondary" style={styles.noteLabel}>หมายเหตุ</ThemedText>
            <ThemedText style={styles.noteText}>{item.pickupDetails}</ThemedText>
          </View>
        ) : null}

        <View style={[styles.divider, divider]} />

        {/* Total */}
        <View style={styles.rowBetween}>
          <ThemedText themeColor="textSecondary" style={styles.totalLabel}>ยอดรวม</ThemedText>
          <View style={styles.totalRight}>
            {item.totalPoints > 0 && (
              <ThemedText themeColor="textSecondary" style={styles.caption}>
                ใช้ {item.totalPoints.toLocaleString()} P
              </ThemedText>
            )}
            <ThemedText style={styles.totalPrice}>฿{item.totalCash.toLocaleString()}</ThemedText>
          </View>
        </View>

        {/* Actions */}
        {canAction && (
          <View style={styles.actionButtons}>
            <Pressable
              disabled={isUpdating}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.cancelButton,
                (pressed || isUpdating) && { opacity: 0.6 },
              ]}
              onPress={() => updateOrderStatus(item.id, 'cancelled')}
            >
              <ThemedText style={styles.cancelButtonText}>ยกเลิกออเดอร์</ThemedText>
            </Pressable>
            <Pressable
              disabled={isUpdating}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.confirmButton,
                (pressed || isUpdating) && { opacity: 0.6 },
              ]}
              onPress={() => updateOrderStatus(item.id, 'completed')}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <ThemedText style={styles.confirmButtonText}>ยืนยันสำเร็จ</ThemedText>
              )}
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              { backgroundColor: theme.backgroundElement },
              pressed && { opacity: 0.6 },
            ]}
          >
            <ThemedText style={styles.backIcon}>←</ThemedText>
          </Pressable>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.headerTitle}>ประวัติการสั่งซื้อ</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.caption}>
              ทั้งหมด {orders.length} รายการ
            </ThemedText>
          </View>
        </View>

        {/* Filters */}
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {FILTERS.map((f) => {
              const active = filter === f.key;
              return (
                <Pressable
                  key={f.key}
                  onPress={() => setFilter(f.key)}
                  style={[
                    styles.filterChip,
                    active
                      ? { backgroundColor: theme.text, borderColor: theme.text }
                      : { borderColor: theme.backgroundSelected },
                  ]}
                >
                  <ThemedText
                    style={[styles.filterText, { color: active ? theme.background : theme.textSecondary }]}
                  >
                    {f.label} {counts[f.key]}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
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
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ThemedText themeColor="textSecondary">ไม่มีรายการสั่งซื้อ</ThemedText>
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
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    lineHeight: 24,
  },
  headerTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
  },
  filterRow: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  orderCard: {
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  caption: {
    fontSize: 12,
    lineHeight: 18,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  customerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: Spacing.two,
  },
  customerName: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  mapsLink: {
    backgroundColor: '#3b82f61f',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  mapsLinkText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    lineHeight: 16,
  },
  itemsBlock: {
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  itemQty: {
    fontSize: 14,
    lineHeight: 20,
    minWidth: 28,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  itemPrice: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  noteBox: {
    padding: 10,
    borderRadius: 10,
    gap: 2,
  },
  noteLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
  },
  noteText: {
    fontSize: 13,
    lineHeight: 18,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  totalLabel: {
    fontSize: 14,
    lineHeight: 20,
  },
  totalRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  totalPrice: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: '#16a34a',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  actionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    backgroundColor: '#22c55e',
  },
  confirmButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelButton: {
    backgroundColor: '#ef44441a',
  },
  cancelButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#dc2626',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
});
