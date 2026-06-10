import React, { useState, useEffect } from 'react';
import { StyleSheet, Pressable, Alert, View, ScrollView, Platform, Text } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCart } from '@/hooks/use-cart';
import {createKshopQRCode} from 'kbankshop-promtpay-generator'
import * as MediaLibrary from 'expo-media-library/legacy';
import * as FileSystem from 'expo-file-system/legacy';

export default function PaymentQrScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useCart();
  const [isSaving, setIsSaving] = useState(false);

  const orderId = params.orderId as string;
  const createdAt = params.createdAt as string;
  const finalCash = parseFloat(params.finalCash as string || '0');
  const totalPoints = parseInt(params.totalPoints as string || '0');
  const deliveryMethod = (params.deliveryMethod as 'pickup' | 'delivery') || 'pickup';

  // Format amount for QR code (e.g. 10.00)
  const qrAmount = finalCash.toFixed(2);

  const raw = `0002010102110216478772000426938104155303920004269641531343007640052044640122208300000130810016A00000067701011201150107536000315010214KB0000020913060320KPS004KB00000209130631690016A00000067701011301030040214KB0000020913060420KPS004KB00000209130651430014A0000000041010010641697102111234567890152045499530376454051${qrAmount}5802TH5910PLAY2STORE6004CITY62250509461179141070842208300630477E4`

  const qr = createKshopQRCode(raw, parseFloat(qrAmount));

  console.log("Unique QR Amount:", qrAmount);
  
  // Placeholder QR code URL
  const qrPlaceholder = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qr}`;

  const API_URL = 'http://192.168.1.34:3001';

  // Countdown timer logic
  const [timeLeft, setTimeLeft] = useState(() => {
    if (createdAt) {
      const createdTime = new Date(createdAt).getTime();
      const now = new Date().getTime();
      const elapsed = Math.floor((now - createdTime) / 1000);
      const remaining = 300 - elapsed;
      return remaining > 0 ? remaining : 0;
    }
    return 300;
  });

  useEffect(() => {
    if (timeLeft <= 0) {
      Alert.alert(
        'หมดเวลาชำระเงิน',
        'เซสชันการชำระเงินของคุณหมดเวลาแล้ว กรุณาทำรายการใหม่อีกครั้ง',
        [{ text: 'ตกลง', onPress: () => router.replace('/home') }]
      );
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Poll for order status updates
  useEffect(() => {
    if (!orderId || !user?.token) return;

    const checkStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/api/orders`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        const result = await response.json();
        if (result.status === 'success') {
          const currentOrder = result.data.find((o: any) => o.id === orderId);
          if (currentOrder) {
            if (currentOrder.status === 'cancelled') {
              Alert.alert('ออเดอร์ถูกยกเลิก', 'ออเดอร์นี้ถูกยกเลิกแล้วเนื่องจากเกินเวลาชำระเงิน', [
                { text: 'ตกลง', onPress: () => router.replace('/home') }
              ]);
              return true; // Stop polling
            }
            if (currentOrder.paymentStatus === 'paid') {
              // Usually handled by socket, but as a fallback:
              router.replace('/order-history');
              return true;
            }
          }
        }
      } catch (error) {
        console.error('Check status failed', error);
      }
      return false;
    };

    const interval = setInterval(async () => {
      const shouldStop = await checkStatus();
      if (shouldStop) clearInterval(interval);
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [orderId, user?.token]);

  const handleConfirmPayment = () => {
    Alert.alert(
      'ยืนยันการชำระเงิน',
      `วิธีรับสินค้า: ${deliveryMethod === 'pickup' ? 'รับเองที่ร้าน' : 'จัดส่งถึงที่'}\n\nระบบกำลังรอการยืนยันยอดเงิน ${finalCash.toFixed(2)} บาท จากธนาคาร หากคุณชำระเงินแล้ว ระบบจะแจ้งเตือนคุณทันที`,
      [
        { text: 'กลับไปหน้าหลัก', onPress: () => router.replace('/home') },
        { text: 'ตกลง', style: 'cancel' }
      ]
    );
  };

  const handleSaveToGallery = async () => {
    try {
      setIsSaving(true);
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('ต้องการการอนุญาต', 'กรุณาอนุญาตการเข้าถึงคลังรูปภาพเพื่อบันทึกรูปภาพ');
        return;
      }

      const fileUri = FileSystem.cacheDirectory + `qr-${orderId}.png`;
      const downloadResult = await FileSystem.downloadAsync(qrPlaceholder, fileUri);

      if (downloadResult.status === 200) {
        const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
        const album = await MediaLibrary.getAlbumAsync('MemberGrocery');
        if (album === null) {
          await MediaLibrary.createAlbumAsync('MemberGrocery', asset, false);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }
        Alert.alert('สำเร็จ', 'บันทึกรูปลงแกลลอรี่เรียบร้อยแล้ว');
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Save to gallery failed', error);
      Alert.alert('ผิดพลาด', 'ไม่สามารถบันทึกรูปภาพได้');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <SymbolView name="chevron.left" size={24} tintColor={theme.text} />
          </Pressable>
          <Text className='font-[Kanit-Medium] text-gray-500 text-2xl'>สแกนจ่ายเงิน</Text>
          <ThemedView style={{ width: 40 }} />
        </ThemedView>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedView type="backgroundElement" style={styles.qrContainer}>
            <ThemedText type="smallBold" style={styles.paymentTitle}>PromptPay / QR Payment</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.orderIdText}>
              ID: #{orderId?.slice(-6).toUpperCase()}
            </ThemedText>
            
            {/* Timer Card - Highly Visible inside Container */}
            <View style={[
              styles.timerCard, 
              { backgroundColor: timeLeft < 60 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(128, 128, 128, 0.05)' },
              { borderColor: timeLeft < 60 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(128, 128, 128, 0.1)' }
            ]}>
              <SymbolView 
                name={timeLeft < 60 ? "exclamationmark.circle.fill" : "clock.fill"} 
                size={24} 
                tintColor={timeLeft < 60 ? '#ef4444' : '#22c55e'} 
              />
              <View style={styles.timerContent}>
                <ThemedText style={[styles.timerLabel, timeLeft < 60 && { color: '#ef4444' }]}>
                  กรุณาชำระเงินภายใน
                </ThemedText>
                <ThemedText style={[styles.timerValue, timeLeft < 60 && { color: '#ef4444' }]}>
                  {formatTime(timeLeft)}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.qrWrapper}>
              <Image
                source={qrPlaceholder}
                style={styles.qrImage}
                contentFit="contain"
              />
            </View>

            <Pressable 
              style={({ pressed }) => [
                styles.saveButton, 
                { opacity: (pressed || isSaving) ? 0.8 : 1, backgroundColor: '#22c55e' }
              ]}
              onPress={handleSaveToGallery}
              disabled={isSaving}
            >
              <SymbolView name="square.and.arrow.down" size={20} tintColor="white" />
              <ThemedText style={styles.saveButtonText}>
                {isSaving ? 'กำลังบันทึก...' : 'บันทึกรูป QR ลงแกลลอรี่'}
              </ThemedText>
            </Pressable>

            <View style={styles.amountBox}>
              <ThemedText themeColor="textSecondary">ยอดเงินที่ต้องชำระ (รวมเศษสตางค์)</ThemedText>
              <ThemedText style={styles.amountText}>฿{finalCash.toFixed(2)}</ThemedText>
            </View>
          </ThemedView>

          <ThemedView style={styles.instructionBox}>
            <ThemedText type="small" style={styles.instructionText}>
              <ThemedText type="smallBold" style={{ color: '#ef4444' }}>สำคัญ: </ThemedText>
              กรุณาโอนเงินให้ตรงตามยอด <ThemedText type="smallBold">{finalCash.toFixed(2)}</ThemedText> บาท เท่านั้น เพื่อให้ระบบตรวจสอบยอดเงินโดยอัตโนมัติ
            </ThemedText>
          </ThemedView>

          {/* <Pressable 
            style={({ pressed }) => [styles.confirmButton, { backgroundColor: '#22c55e', opacity: pressed ? 0.8 : 1 }]}
            onPress={handleConfirmPayment}
          >
            <ThemedText style={styles.confirmText}>ฉันชำระเงินเรียบร้อยแล้ว</ThemedText>
          </Pressable> */}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  backButton: {
    padding: Spacing.two,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  qrContainer: {
    width: '100%',
    borderRadius: 24,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 6 },
    }),
  },
  paymentTitle: {
    fontSize: 18,
    color: '#1a365d',
  },
  orderIdText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: -Spacing.one,
  },
  qrWrapper: {
    backgroundColor: 'white',
    padding: Spacing.two,
    borderRadius: 16,
  },
  qrImage: {
    width: 180,
    height: 180,
  },
  timerCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 16,
    gap: Spacing.three,
    borderWidth: 1.5,
    marginVertical: Spacing.one,
  },
  timerContent: {
    flex: 1,
  },
  timerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22c55e',
  },
  timerValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#22c55e',
    fontVariant: ['tabular-nums'],
    marginTop: -2,
  },
  amountBox: {
    alignItems: 'center',
    gap: 0,
  },
  amountText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#22c55e',
    lineHeight: 34
  },
  pointsText: {
    fontSize: 15,
    color: '#22c55e',
    fontWeight: 'bold',
  },
  instructionBox: {
    width: '100%',
    padding: Spacing.two,
  },
  instructionText: {
    lineHeight: 20,
    textAlign: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    width: '100%',
    paddingVertical: Spacing.three,
    borderRadius: 16,
    marginTop: Spacing.one,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  confirmButton: {
    width: '100%',
    paddingVertical: Spacing.three,
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
