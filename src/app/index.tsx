import { Redirect } from 'expo-router';
import { useCart } from '@/hooks/use-cart';
import { ActivityIndicator, View } from 'react-native';
import { ThemedView } from '@/components/themed-view';

export default function Index() {
  const { user, isLoading } = useCart();

  // รอให้โหลดข้อมูล User จาก storage ให้เสร็จก่อน
  if (isLoading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#22c55e" />
      </ThemedView>
    );
  }

  // ถ้ามี user และมี token แล้ว ให้ไปหน้า home
  if (user && user.token) {
    return <Redirect href="/home" />;
  }

  // ถ้าไม่มี ให้ไปหน้า login
  return <Redirect href="/login" />;
}
