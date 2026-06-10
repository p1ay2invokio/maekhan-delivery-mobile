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
    <Pressable 
      style={({ pressed }) => [
        styles.card, 
        { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.9 : 1 }
      ]}
      onPress={() => router.push(`/product/${item.id}`)}
    >
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <ThemedView style={styles.cardContent}>
        <ThemedText type="default" style={styles.productName} numberOfLines={2}>
          {item.name}
        </ThemedText>

        <ThemedView style={styles.priceRow}>
          <ThemedText style={styles.productPrice}>{item.price} บาท</ThemedText>
          <View style={styles.pointsPill}>
            <ThemedText style={styles.productPoints}>{item.points} P</ThemedText>
          </View>
        </ThemedView>
      </ThemedView>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* ── Header ── */}
        <ThemedView style={[styles.header, { backgroundColor: theme.background }]}>
          <ThemedView style={styles.headerTop}>
            <ThemedView style={styles.logoContainer}>
              <Image 
                source={require('../../assets/images/playstore.png')} 
                style={styles.logo} 
                resizeMode="contain"
              />
              <ThemedView style={styles.headerTextContainer}>
                <ThemedText style={styles.greetingText}>สวัสดี {user?.name || 'ลูกค้า'}​ !</ThemedText>
                <ThemedText style={styles.appNameText}>สะสมแต้ม 20</ThemedText>
              </ThemedView>
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
              {/* Left: icon + badge */}
              <View style={styles.floatingCartIcon}>
                <SymbolView name="cart.fill" size={24} tintColor="white" />
                <View style={styles.floatingBadge}>
                  <ThemedText style={{color: 'white'}}>{totalItems}</ThemedText>
                </View>
              </View>

              {/* Center: label */}
              <ThemedText style={[styles.floatingCartText, { flex: 1, textAlign: 'center', marginLeft: -20, fontSize: 16 }]}>
                ดูตะกร้าสินค้า
              </ThemedText>

              {/* Right: total */}
              <ThemedText style={styles.floatingCartTotal}>
                {totalCash.toLocaleString()} บาท
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
  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerTextContainer: {
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 17,
    color: '#4b5563',
    fontWeight: '500',
    lineHeight: 26,
  },
  appNameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22c55e',
    lineHeight: 20,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  profileImage: {
    width: 45,
    height: 45,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#4ade80',
  },

  // ── Points pill (header) ──
  pointsPillHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#fefce8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#facc15',
  },
  pointsPillValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f59e0b',
  },
  pointsPillUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f59e0b',
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
      ios: { shadowColor: '#000', shadowOffset: { width: 1, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
      android: { elevation: 3 },
    }),
    borderWidth: 1,
    borderColor: '#f3f4f6'
  },
  productImage: { width: '100%', aspectRatio: 1, backgroundColor: '#f0f0f0' },
  cardContent: { paddingHorizontal: 8, paddingTop: 4, paddingBottom: 8, gap: 0 },
  productName: { fontSize: 18, lineHeight: 30, height: 28, marginBottom: 0, fontWeight: 'regular' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  productPrice: { fontSize: 16, color: '#22c55e', fontWeight: 'bold' },
  pointsPill: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fcd34d',
    paddingHorizontal: 6,
    paddingVertical: 0,
    borderRadius: 6,
  },
  productPoints: { fontSize: 16, color: '#f59e0b', fontWeight: 'bold' },

  // ── Floating Cart ──
  floatingCart: {
    position: 'absolute',
    bottom: 0,          // ชิดขอบล่างสุด
    left: 0,
    right: 0,
    backgroundColor: '#22c55e',
    borderRadius: 26,    // ไม่โค้ง
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    paddingBottom: 28,  // เผื่อ home indicator
    elevation: 8,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  floatingCartContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: 10
  },
  floatingCartIcon: {
    position: 'relative',
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 5,
    paddingBottom: 5,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5
  },
  floatingCartText: {
    flex: 1,
    color: 'white',
    fontSize: 14,       // เล็กลง
    fontWeight: 'medium',
  },
  floatingCartTotal: {
    color: 'white',
    fontSize: 16,       // เล็กลง
    fontWeight: '400',
  },
});