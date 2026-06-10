import React, { useState } from 'react';
import { FlatList, StyleSheet, Image, Pressable, Platform, Alert, TouchableOpacity, View, Text } from 'react-native';
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
  const { cart, removeFromCart, updateQuantity, totalCash, totalPoints, user, checkout, clearCart } = useCart();
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'cod'>('qr');
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
      const result = await checkout(deliveryMethod, paymentMethod);
      if (result.success && result.data) {
        if (paymentMethod === 'qr') {
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
          Alert.alert('สั่งซื้อสำเร็จ', 'รายการสั่งซื้อของคุณถูกส่งเรียบร้อยแล้ว (ชำระเงินปลายทาง)');
          router.replace('/order-history');
        }
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
    <View className="flex-row h-[110px] items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-900 border rounded-2xl shadow shadow-xs border-zinc-100 dark:border-zinc-800">

      {/* Image */}
      <Image
        source={{ uri: item.image }}
        className="w-24 h-full rounded-xl bg-zinc-100"
        resizeMode="cover"
      />

      <View className='flex justify-between flex-1 flex-row'>
        <View className='flex justify-between h-full'>
          <View className='flex justify-between flex-row w-full'>
            <Text className='font-[Kanit-Medium] text-gray-600 text-lg'>{item.name}</Text>
            <Pressable
              onPress={() => removeFromCart(item.id)}
              className="p-1.5 active:opacity-50"
            >
              <SymbolView name="trash" size={15} tintColor="#ef4444" />
            </Pressable>
          </View>
          <View className='flex flex-row justify-between items-center'>

            <View>
              <Text className='font-[Kanit-Regular] text-green-600 text-2xl'>{(item.price).toFixed(2)} <Text className='text-sm text-gray-600'>บาท</Text></Text>
              <Text className='font-[Kanit-Regular] text-[#f59e0b] text-2xl'>{item.points} P</Text>
            </View>


            <View>
              {/* Qty stepper */}
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 rounded-full border border-gray-100 bg-white shadow shadow-xl dark:bg-zinc-800 items-center justify-center active:opacity-60"
                >
                  <Text className="text-2xl leading-none text-green-600 dark:text-zinc-300 ">
                    −
                  </Text>
                </Pressable>

                <Text className="text-xl font-[Kanit-Medium] w-5 text-center text-gray-500 dark:text-zinc-100">
                  {item.quantity}
                </Text>

                <Pressable
                  onPress={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 rounded-full bg-white shadow shadow-xl border border-gray-100 dark:bg-zinc-800 items-center justify-center active:opacity-60"
                >
                  <Text className="text-2xl leading-none text-green-600 dark:text-zinc-300">
                    +
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

      </View>

      {/* Delete */}
      {/* <Pressable
        onPress={() => removeFromCart(item.id)}
        className="p-1.5 active:opacity-50"
      >
        <SymbolView name="trash" size={15} tintColor="#ef4444" />
      </Pressable> */}

    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>

        {/* ── Header ── */}
        <ThemedView style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <SymbolView name="chevron.left" size={20} tintColor={theme.text} />
          </Pressable>
          <Text className='font-[Kanit-Medium] text-gray-500 text-xl'>ตะกร้าของฉัน</Text>
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
                        name="hand.raised.fill"
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

                  {/* ── Payment Method Section ── */}
                  <ThemedText style={[styles.sectionLabel, { marginTop: Spacing.four }]}>วิธีชำระเงิน</ThemedText>

                  <View style={styles.paymentMethodContainer}>
                    <Pressable
                      onPress={() => setPaymentMethod('qr')}
                      style={[
                        styles.paymentOption,
                        { backgroundColor: theme.backgroundElement },
                        paymentMethod === 'qr' && { borderColor: '#22c55e', borderWidth: 2 }
                      ]}
                    >
                      <View style={styles.paymentOptionIcon}>
                        <SymbolView name="qrcode" size={24} tintColor={paymentMethod === 'qr' ? '#22c55e' : '#94a3b8'} />
                      </View>
                      <ThemedText style={[styles.paymentOptionText, paymentMethod === 'qr' && { color: '#22c55e', fontWeight: '700' }]}>
                        QR Payment
                      </ThemedText>
                      {paymentMethod === 'qr' && (
                        <View style={styles.checkIcon}>
                          <SymbolView name="checkmark.circle.fill" size={18} tintColor="#22c55e" />
                        </View>
                      )}
                    </Pressable>

                    <Pressable
                      onPress={() => setPaymentMethod('cod')}
                      style={[
                        styles.paymentOption,
                        { backgroundColor: theme.backgroundElement },
                        paymentMethod === 'cod' && { borderColor: '#22c55e', borderWidth: 2 }
                      ]}
                    >
                      <View style={styles.paymentOptionIcon}>
                        <SymbolView name="banknote.fill" size={24} tintColor={paymentMethod === 'cod' ? '#22c55e' : '#94a3b8'} />
                      </View>
                      <ThemedText style={[styles.paymentOptionText, paymentMethod === 'cod' && { color: '#22c55e', fontWeight: '700' }]}>
                        ชำระปลายทาง
                      </ThemedText>
                      {paymentMethod === 'cod' && (
                        <View style={styles.checkIcon}>
                          <SymbolView name="checkmark.circle.fill" size={18} tintColor="#22c55e" />
                        </View>
                      )}
                    </Pressable>
                  </View>

                  {/* ── Footer / Summary (Now part of the scrollable list) ── */}
                  <ThemedView style={[styles.footer, { backgroundColor: theme.backgroundElement, marginTop: Spacing.four, borderRadius: 16 }]}>
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryItem}>
                        <ThemedText style={styles.summaryLabel}>ยอดรวม</ThemedText>
                        <ThemedText style={styles.summaryValueBlue}>{totalCash.toLocaleString()} บาท</ThemedText>
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
                </View>
              }
            />
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
    gap: 10
  },

  // ── Cart item ──
  cartItem: {
    flexDirection: 'row',
    padding: 10,
    marginBottom: Spacing.two,
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.1)',
    borderRadius: 16
  },
  productImage: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  itemInfo: {
    flex: 1,
    gap: 0,
  },
  productName: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.1,
    color: '#4b5563'
  },
  priceRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    // gap: Spacing.two,

  },
  productPrice: {
    fontSize: 15,
    color: '#22c55e',
    fontWeight: '700',
  },
  productPoints: {
    fontSize: 16,
    color: '#fbbf24',
    fontWeight: '600',
    marginTop: -5
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

  // ── Payment selection ──
  paymentMethodContainer: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  paymentOption: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.1)',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  paymentOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(34,197,94,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentOptionText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },

  // ── Footer ──
  footer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.1)',
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
    color: '#f59e0b',
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