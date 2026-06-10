import { FlatList, StyleSheet, Image, Pressable, Dimensions, Platform, View, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCart, Product } from '@/hooks/use-cart';
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://192.168.1.34:3002';

const CATEGORIES = ['ทั้งหมด', 'ข้าว', 'ของสด', 'เครื่องปรุง', 'เครื่องดื่ม', 'อาหารแห้ง'];

const { width } = Dimensions.get('window');
const COLUMN_SPACING = Spacing.three;
const CARD_WIDTH = (Math.min(width, MaxContentWidth) - COLUMN_SPACING * 3) / 2;

export default function HomeScreen() {
  const theme = useTheme();
  const { products, addToCart, userPoints, totalItems, profileImage, user, refreshUser, totalCash } = useCart();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('ทั้งหมด');

  const filteredProducts =
    activeCategory === 'ทั้งหมด'
      ? products
      : products.filter((p) => p.category === activeCategory);

  const renderItem = ({ item }: { item: Product }) => (
    <ThemedView style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <ThemedView style={styles.cardContent}>
        <ThemedText type="default" style={styles.productName} numberOfLines={2}>
          {item.name}
        </ThemedText>

        <ThemedView style={styles.priceRow}>
          <ThemedText style={styles.productPrice}>฿{item.price}</ThemedText>
          <View style={styles.pointsPill}>
            <ThemedText style={styles.productPoints}>{item.points} P</ThemedText>
          </View>
        </ThemedView>

        <Pressable
          style={({ pressed }) => [
            styles.addToCartButton,
            { backgroundColor: '#f97316', opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={() => addToCart(item)}
        >
          <ThemedText style={styles.addToCartText}>+ เพิ่มลงตะกร้า</ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* ── Header ── */}
        <ThemedView style={[styles.header, { backgroundColor: theme.background }]}>
          <ThemedView style={styles.headerTop}>
            <ThemedView>
              <ThemedText type="subtitle">สวัสดีคุณ {user?.name || 'ลูกค้า'}</ThemedText>
              <ThemedText themeColor="textSecondary">ยินดีต้อนรับสู่ร้านค้าของเรา</ThemedText>
            </ThemedView>

            <ThemedView style={styles.headerActions}>
              {/* Points pill */}
              <View style={styles.pointsPillHeader}>
                <ThemedText style={styles.pointsPillValue}>{userPoints.toLocaleString()}</ThemedText>
                <ThemedText style={styles.pointsPillUnit}> P</ThemedText>
              </View>

              {/* Avatar */}
              <Pressable
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                onPress={() => router.push('/profile')}
              >
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              </Pressable>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* ── Product list ── */}
        <FlatList
          data={filteredProducts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
        />

        {/* ── Floating Cart Button ── */}
        {totalItems > 0 && (
          <Pressable
            style={({ pressed }) => [
              styles.floatingCart,
              { opacity: pressed ? 0.9 : 1 }
            ]}
            onPress={() => router.push('/cart')}
          >
            <View style={styles.floatingCartContent}>
              <View style={styles.floatingCartIcon}>
                <SymbolView name="cart.fill" size={24} tintColor="white" />
                <View style={styles.floatingBadge}>
                  <ThemedText style={styles.floatingBadgeText}>{totalItems}</ThemedText>
                </View>
              </View>
              <ThemedText style={styles.floatingCartText}>ดูตะกร้าสินค้า</ThemedText>
              <ThemedText style={styles.floatingCartTotal}>
                ฿{totalCash.toLocaleString()}
              </ThemedText>
            </View>
          </Pressable>
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
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.four,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  profileImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: 'rgba(128,128,128,0.2)',
  },

  // ── Points pill (header) ──
  pointsPillHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(245,158,11,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
  },
  pointsPillValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f59e0b',
  },
  pointsPillUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fbbf24',
  },

  // ── Categories ──
  categoriesSection: { paddingTop: Spacing.four },
  sectionLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.two,
  },
  categoriesScroll: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
    flexDirection: 'row',
    paddingBottom: Spacing.two,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: 'rgba(128,128,128,0.3)',
  },
  categoryPillActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  categoryPillText: { fontSize: 12, color: 'gray' },
  categoryPillTextActive: { color: 'white', fontWeight: 'bold' },

  // ── Product list ──
  listContainer: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.six },
  columnWrapper: { justifyContent: 'space-between', marginBottom: Spacing.three },

  // ── Card ──
  card: {
    width: CARD_WIDTH,
    borderRadius: Spacing.three,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
      android: { elevation: 3 },
    }),
  },
  productImage: { width: '100%', aspectRatio: 1, backgroundColor: '#f0f0f0' },
  cardContent: { padding: Spacing.two, gap: Spacing.one },
  productName: { fontSize: 13, lineHeight: 18, height: 36 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice: { fontSize: 18, color: '#22c55e', fontWeight: 'bold' },
  pointsPill: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  productPoints: { fontSize: 18, color: '#f59e0b', fontWeight: 'bold' },
  addToCartButton: {
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  addToCartText: { color: 'white', fontSize: 12, fontWeight: 'bold' },

  // ── Floating Cart ──
  floatingCart: {
    position: 'absolute',
    bottom: 0,          // ชิดขอบล่างสุด
    left: 0,
    right: 0,
    backgroundColor: '#f97316',
    borderRadius: 26,    // ไม่โค้ง
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    paddingBottom: 28,  // เผื่อ home indicator
    elevation: 8,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  floatingCartContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  floatingCartIcon: {
    position: 'relative',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingCartText: {
    flex: 1,
    color: 'white',
    fontSize: 14,       // เล็กลง
    fontWeight: 'bold',
  },
  floatingCartTotal: {
    color: 'white',
    fontSize: 16,       // เล็กลง
    fontWeight: '800',
  },
});