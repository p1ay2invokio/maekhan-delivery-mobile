import { StyleSheet, Pressable, ScrollView, View, TextInput, Alert } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useState, useEffect } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCart } from '@/hooks/use-cart';

export default function ManageProductsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { addProduct, user } = useCart();

  useEffect(() => {
    if (!user || user.role !== 1) {
      router.replace('/home');
    }
  }, [user]);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [points, setPoints] = useState('');
  const [image, setImage] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picking error:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถเข้าถึงคลังภาพได้');
    }
  };

  const handleAddProduct = async () => {
    if (!name || !price || !points || !image) {
      Alert.alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setLoading(true);
    try {
      await addProduct({
        name,
        price: Number(price),
        points: Number(points),
        category: 'สินค้า',
        image: image,
      });

      Alert.alert('สำเร็จ', 'เพิ่มสินค้าเรียบร้อยแล้ว', [
        { text: 'ตกลง', onPress: () => router.back() }
      ]);
    } catch (error) {
      // Error is handled in use-cart.tsx but we catch it here to stop the flow
      console.error('Add product error in screen:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={{ fontSize: 24 }}>←</ThemedText>
          </Pressable>
          <ThemedText type="subtitle">เพิ่มสินค้าใหม่</ThemedText>
          <View style={{ width: 40 }} />
        </ThemedView>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>ชื่อสินค้า</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
              value={name}
              onChangeText={setName}
              placeholder="เช่น ข้าวหอมมะลิ"
              placeholderTextColor="gray"
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>ราคา (บาท)</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              placeholder="เช่น 150"
              placeholderTextColor="gray"
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>แต้มที่จะได้รับ (P)</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
              value={points}
              onChangeText={setPoints}
              keyboardType="numeric"
              placeholder="เช่น 20"
              placeholderTextColor="gray"
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>รูปภาพสินค้า</ThemedText>
            <Pressable 
              onPress={pickImage}
              style={[styles.imagePickerButton, { backgroundColor: theme.backgroundElement }]}
            >
              {image ? (
                <Image source={{ uri: image }} style={styles.previewImage} contentFit="cover" />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <ThemedText style={{ fontSize: 40 }}>🖼️</ThemedText>
                  <ThemedText themeColor="textSecondary">แตะเพื่อเลือกรูปภาพ</ThemedText>
                </View>
              )}
            </Pressable>
          </View>

          <Pressable 
            style={({ pressed }) => [styles.submitButton, { backgroundColor: '#22c55e', opacity: (pressed || loading) ? 0.8 : 1 }]}
            onPress={handleAddProduct}
            disabled={loading}
          >
            <ThemedText style={styles.submitText}>{loading ? 'กำลังบันทึก...' : 'บันทึกสินค้า'}</ThemedText>
          </Pressable>
        </ScrollView>
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
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.eight,
    gap: Spacing.four,
  },
  formGroup: {
    gap: Spacing.two,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    fontSize: 16,
  },
  imagePickerButton: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Spacing.three,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.2)',
    borderStyle: 'dashed',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  submitButton: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  submitText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
