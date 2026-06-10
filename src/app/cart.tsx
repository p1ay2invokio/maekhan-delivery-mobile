import React, { useState } from 'react';
import { FlatList, StyleSheet, Image, Pressable, Platform, Alert, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCart, CartItem } from '@/hooks/use-cart';

export default function CartScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { cart, removeFromCart, updateQuantity, totalCash, totalPoints, user, checkout } = useCart();
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    if (cart.length === 0 || isProcessing) return;
    setIsProcessing(true);
    try {
      if (deliveryMethod === 'delivery') {
        const hasAddress = user?.address && user?.subDistrict && user?.district && user?.province && user?.postalCode;
        if (!hasAddress) {
          Alert.alert(
            'ข้อมูลที่อยู่ไม่ครบถ้วน',
            'กรุณาระบุที่อยู่จัดส่งให้ครบถ้วนก่อนทำการสั่งซื้อ',
            [
              { text: 'ยกเลิก', style: 'cancel', onPress: () => setIsProcessing(false) },
              { text: 'ตั้งค่าที่อยู่', onPress: () => { setIsProcessing(false); router.push('/add-address'); } }
            ]
          );
          return;
        }
      }
      const result = await checkout(deliveryMethod);
      if (result.success && result.data) {
        router.push({
          pathname: '/payment-qr',
          params: {
            deliveryMethod,
            orderId: result.data.id,
            finalCash: result.data.totalCash,
            totalPoints: result.data.totalPoints,
            createdAt: result.data.createdAt
          }
        });
      } else {
        Alert.alert('ผิดพลาด', result.message || 'เกิดข้อผิดพลาดในการสั่งซื้อ');
      }
    } catch (error: any) {
      Alert.alert('ผิดพลาด', 'เกิดข้อผิดพลาด: ' + (error.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const fullAddress = [
    user?.address,
    user?.subDistrict ? `ต.${user.subDistrict}` : null,
    user?.district ? `อ.${user.district}` : null,
    user?.province ? `จ.${user.province}` : null,
    user?.postalCode
  ].filter(Boolean).join(' ');

  const renderItem = ({ item }: { item: CartItem }) => (
    <ThemedView style={[styles.cartItem, { backgroundColor: theme.backgroundElement }]}>
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <ThemedView style={styles.itemInfo}>
        <ThemedText style={styles.productName} numberOfLines={1}>{item.name}</ThemedText>
        <ThemedView style={styles.priceRow}>
          <ThemedText style={styles.productPrice}>฿{item.price}</ThemedText>
          <ThemedText style={styles.productPoints}>{item.points} P</ThemedText>
        </ThemedView>
        <ThemedView style={styles.quantityContainer}>
          <Pressable
            style={[styles.qtyButton, { backgroundColor: theme.backgroundSelected }]}
            onPress={() => updateQuantity(item.id, item.quantity - 1)}
          >
            <ThemedText style={styles.qtyButtonText}>−</ThemedText>
          </Pressable>
          <ThemedText style={styles.qtyText}>{item.quantity}</ThemedText>
          <Pressable
            style={[styles.qtyButton, { backgroundColor: theme.backgroundSelected }]}
            onPress={() => updateQuantity(item.id, item.quantity + 1)}
          >
            <ThemedText style={styles.qtyButtonText}>+</ThemedText>
          </Pressable>
        </ThemedView>
      </ThemedView>
      <Pressable onPress={() => removeFromCart(item.id)} style={styles.removeButton}>
        <SymbolView name="trash" size={16} tintColor="#cbd5e1" />
      </Pressable>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>

        {/* ── Header ── */}
        <ThemedView style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <SymbolView name="chevron.left" size={20} tintColor={theme.text} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>ตะกร้าสินค้า</ThemedText>
          <View style={{ width: 36 }} />
        </ThemedView>

        {cart.length > 0 ? (
          <>
            <FlatList
              data={cart}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={
                <View style={styles.deliverySection}>
                  {/* ── Divider ── */}
                  <View style={styles.divider} />

                  {/* ── Delivery method label ── */}
                  <ThemedText style={styles.sectionLabel}>วิธีรับสินค้า</ThemedText>

                  {/* ── Method pills ── */}
                  <View style={styles.methodRow}>
                    <Pressable
                      onPress={() => setDeliveryMethod('pickup')}
                      style={[
                        styles.methodPill,
                        deliveryMethod === 'pickup'
                          ? styles.methodPillActive
                          : { backgroundColor: theme.backgroundElement }
                      ]}
                    >
                      <SymbolView
                        name="hand.and.arrow.left.fill"
                        size={15}
                        tintColor={deliveryMethod === 'pickup' ? 'white' : '#94a3b8'}
                      />
                      <ThemedText style={[
                        styles.methodPillText,
                        deliveryMethod === 'pickup' && styles.methodPillTextActive
                      ]}>
                        รับเองที่ร้าน
                      </ThemedText>
                    </Pressable>

                    <Pressable
                      onPress={() => setDeliveryMethod('delivery')}
                      style={[
                        styles.methodPill,
                        deliveryMethod === 'delivery'
                          ? styles.methodPillActive
                          : { backgroundColor: theme.backgroundElement }
                      ]}
                    >
                      <SymbolView
                        name="truck.box.fill"
                        size={15}
                        tintColor={deliveryMethod === 'delivery' ? 'white' : '#94a3b8'}
                      />
                      <ThemedText style={[
                        styles.methodPillText,
                        deliveryMethod === 'delivery' && styles.methodPillTextActive
                      ]}>
                        จัดส่งถึงที่
                      </ThemedText>
                    </Pressable>
                  </View>

                  {/* ── Address / Pickup Info ── */}
                  <ThemedText style={[styles.sectionLabel, { marginTop: Spacing.two }]}>
                    {deliveryMethod === 'delivery' ? 'ที่อยู่จัดส่ง' : 'รับสินค้าที่'}
                  </ThemedText>

                  {deliveryMethod === 'delivery' ? (
                    <Pressable 
                      onPress={() => router.push('/shipping-address')}
                      style={({ pressed }) => [
                        styles.addressCard, 
                        { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.8 : 1 }
                      ]}
                    >
                      <View style={styles.addressIconContainer}>
                        <SymbolView name="mappin.circle.fill" size={24} tintColor="#22c55e" />
                      </View>
                      
                      <View style={styles.addressInfo}>
                        <ThemedText style={styles.addressCardTitle}>
                          {fullAddress ? 'ที่อยู่ปัจจุบัน' : 'เลือกที่อยู่จัดส่ง'}
                        </ThemedText>
                        <ThemedText style={styles.addressText} themeColor="textSecondary" numberOfLines={2}>
                          {fullAddress || 'กรุณาระบุที่อยู่จัดส่งให้ครบถ้วน'}
                        </ThemedText>
                      </View>

                      <SymbolView name="chevron.right" size={16} tintColor="#94a3b8" />
                    </Pressable>
                  ) : (
                    <View style={[styles.addressCard, { backgroundColor: theme.backgroundElement, borderColor: 'rgba(34,197,94,0.1)' }]}>
                      <View style={[styles.addressIconContainer, { backgroundColor: 'rgba(34,197,94,0.1)' }]}>
                        <SymbolView name="house.fill" size={22} tintColor="#22c55e" />
                      </View>
                      
                      <View style={styles.addressInfo}>
                        <ThemedText style={styles.addressCardTitle}>ร้านค้าหลัก (แม่ข่าน)</ThemedText>
                        <ThemedText style={styles.addressText} themeColor="textSecondary">
                          โครงการแม่ข่าน ต.สันทราย อ.สารภี จ.เชียงใหม่
                        </ThemedText>
                      </View>
                    </View>
                  )}
                </View>
              }
            />

            {/* ── Footer / Summary ── */}
            <ThemedView style={[styles.footer, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <ThemedText style={styles.summaryLabel}>ยอดรวม</ThemedText>
                  <ThemedText style={styles.summaryValueBlue}>฿{totalCash.toLocaleString()}</ThemedText>
                </View>
                <View style={styles.summaryDividerV} />
                <View style={styles.summaryItem}>
                  <ThemedText style={styles.summaryLabel}>แต้มที่ได้</ThemedText>
                  <ThemedText style={styles.summaryValueGold}>{totalPoints.toLocaleString()} P</ThemedText>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.checkoutButton, isProcessing && { opacity: 0.6 }]}
                onPress={handleCheckout}
                disabled={isProcessing}
                activeOpacity={0.85}
              >
                <ThemedText style={styles.checkoutText}>
                  {isProcessing ? 'กำลังดำเนินการ...' : 'ดำเนินการต่อ'}
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </>
        ) : (
          <ThemedView style={styles.emptyContainer}>
            <SymbolView name="cart" size={48} tintColor="#cbd5e1" />
            <ThemedText style={styles.emptyText}>ยังไม่มีสินค้าในตะกร้า</ThemedText>
            <Pressable onPress={() => router.back()} style={styles.emptyAction}>
              <ThemedText style={styles.emptyActionText}>กลับไปเลือกสินค้า</ThemedText>
            </Pressable>
          </ThemedView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  safeArea: { flex: 1, width: '100%', maxWidth: MaxContentWidth },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ── List ──
  listContainer: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },

  // ── Cart item ──
  cartItem: {
    flexDirection: 'row',
    padding: Spacing.three,
    borderRadius: 16,
    marginBottom: Spacing.two,
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.1)',
  },
  productImage: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  productPrice: {
    fontSize: 15,
    color: '#22c55e',
    fontWeight: '700',
  },
  productPoints: {
    fontSize: 13,
    color: '#22c55e',
    fontWeight: '600',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: 2,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  qtyText: {
    fontSize: 15,
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    padding: Spacing.two,
    alignSelf: 'flex-start',
  },

  // ── Delivery section ──
  deliverySection: {
    gap: Spacing.three,
    paddingBottom: Spacing.two,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(128,128,128,0.2)',
    marginVertical: Spacing.two,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  methodRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  methodPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    gap: 7,
  },
  methodPillActive: {
    backgroundColor: '#22c55e',
  },
  methodPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
  methodPillTextActive: {
    color: 'white',
  },

  // ── Address card ──
  addressCard: {
    borderRadius: 16,
    padding: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.one,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.1)',
  },
  addressIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(60,135,247,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressInfo: {
    flex: 1,
    gap: 2,
  },
  addressCardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  addressText: {
    fontSize: 13,
    lineHeight: 18,
  },

  // ── Footer ──
  footer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: 28,
    gap: Spacing.three,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 8 },
    }),
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  summaryDividerV: {
    width: StyleSheet.hairlineWidth,
    height: 36,
    backgroundColor: 'rgba(128,128,128,0.2)',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  summaryValueBlue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#22c55e',
  },
  summaryValueGold: {
    fontSize: 20,
    fontWeight: '800',
    color: '#22c55e',
  },
  checkoutButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  checkoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── Empty ──
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.three,
  },
  emptyText: {
    fontSize: 15,
    color: '#94a3b8',
    fontWeight: '500',
  },
  emptyAction: {
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 10,
    backgroundColor: 'rgba(60,135,247,0.08)',
  },
  emptyActionText: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
  },
});