import { StyleSheet, Image, Pressable, ScrollView, View, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCart } from '@/hooks/use-cart';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const { products, addToCart } = useCart();
  const theme = useTheme();
  const router = useRouter();

  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>ไม่พบสินค้า</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <ThemedView style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <SymbolView name="chevron.left" size={24} tintColor={theme.text} />
          </Pressable>
          <ThemedText style={styles.headerTitle} numberOfLines={1}>
            รายละเอียดสินค้า
          </ThemedText>
          <View style={{ width: 40 }} />
        </ThemedView>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Image source={{ uri: product.image }} style={styles.mainImage} />
          
          <ThemedView style={styles.content}>
            <ThemedView style={styles.titleRow}>
              <ThemedText style={styles.productName}>{product.name}</ThemedText>
              <ThemedView style={styles.categoryBadge}>
                <ThemedText style={styles.categoryText}>{product.category}</ThemedText>
              </ThemedView>
            </ThemedView>

            <View style={styles.priceSection}>
              <View style={styles.priceItem}>
                <ThemedText style={styles.label}>ราคา</ThemedText>
                <ThemedText style={styles.priceValue}>{product.price} บาท</ThemedText>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.priceItem}>
                <ThemedText style={styles.label}>แต้ม</ThemedText>
                <ThemedText style={styles.pointsValue}>{product.points} P</ThemedText>
              </View>
            </View>

            <ThemedView style={styles.descriptionSection}>
              <ThemedText style={styles.sectionTitle}>รายละเอียด</ThemedText>
              <ThemedText style={styles.descriptionText}>
                {product.name} คุณภาพดี คัดสรรมาเพื่อคุณโดยเฉพาะ 
                รับประกันความสดใหม่และคุณภาพมาตรฐานที่ทางเราคัดสรรมาอย่างดี
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ScrollView>

        {/* Bottom Action */}
        <ThemedView style={[styles.bottomBar, { borderTopColor: theme.backgroundElement }]}>
          <Pressable
            style={({ pressed }) => [
              styles.addToCartButton,
              { backgroundColor: '#22c55e', opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={() => {
              addToCart(product);
              router.back();
            }}
          >
            <SymbolView name="cart.badge.plus" size={20} tintColor="white" />
            <ThemedText style={styles.addToCartText}>เพิ่มลงตะกร้าสินค้า</ThemedText>
          </Pressable>
        </ThemedView>
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
    paddingVertical: Spacing.three,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(128,128,128,0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  mainImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f0f0f0',
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  categoryText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '600',
  },
  priceSection: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    padding: Spacing.four,
    alignItems: 'center',
  },
  priceItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#d1d5db',
  },
  label: {
    fontSize: 14,
    color: '#6b7280',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  pointsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  descriptionSection: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4b5563',
  },
  bottomBar: {
    padding: Spacing.four,
    // paddingBottom: Spacing.six,
    borderTopWidth: 1,
  },
  addToCartButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  addToCartText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});