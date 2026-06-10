import { StyleSheet, Pressable, View, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { SymbolView } from 'expo-symbols';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function SystemSettingsScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoConfirmOrders, setAutoConfirmOrders] = useState(false);
  const [darkMode, setDarkMode] = useState(theme.dark);

  const handleSave = () => {
    Alert.alert('สำเร็จ', 'บันทึกการตั้งค่าระบบเรียบร้อยแล้ว');
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={{ fontSize: 24 }}>←</ThemedText>
          </Pressable>
          <ThemedText type="subtitle">ตั้งค่าระบบ</ThemedText>
          <View style={{ width: 40 }} />
        </ThemedView>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>การจัดการร้านค้า</ThemedText>
            
            <View style={[styles.settingItem, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.settingInfo}>
                <ThemedText style={styles.settingLabel}>สถานะร้านค้า (เปิด/ปิด)</ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.settingDesc}>
                  เมื่อปิดร้านค้า ลูกค้าจะไม่สามารถสั่งซื้อสินค้าได้
                </ThemedText>
              </View>
              <Switch
                value={isStoreOpen}
                onValueChange={setIsStoreOpen}
                trackColor={{ false: '#767577', true: '#10b981' }}
              />
            </View>

            <View style={[styles.settingItem, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.settingInfo}>
                <ThemedText style={styles.settingLabel}>ยืนยันออเดอร์อัตโนมัติ</ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.settingDesc}>
                  ยอมรับคำสั่งซื้อทันทีที่ลูกค้าชำระเงินสำเร็จ
                </ThemedText>
              </View>
              <Switch
                value={autoConfirmOrders}
                onValueChange={setAutoConfirmOrders}
                trackColor={{ false: '#767577', true: '#f97316' }}
              />
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>การแจ้งเตือนและการแสดงผล</ThemedText>
            
            <View style={[styles.settingItem, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.settingInfo}>
                <ThemedText style={styles.settingLabel}>เปิดการแจ้งเตือน</ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.settingDesc}>
                  รับการแจ้งเตือนเมื่อมีคำสั่งซื้อใหม่
                </ThemedText>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#767577', true: '#f59e0b' }}
              />
            </View>

            <View style={[styles.settingItem, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.settingInfo}>
                <ThemedText style={styles.settingLabel}>โหมดมืด (Dark Mode)</ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.settingDesc}>
                  ปรับเปลี่ยนโทนสีของแอปพลิเคชัน
                </ThemedText>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#767577', true: '#f97316' }}
              />
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>ข้อมูลแอปพลิเคชัน</ThemedText>
            <View style={[styles.infoCard, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.infoRow}>
                <ThemedText themeColor="textSecondary">เวอร์ชันแอป</ThemedText>
                <ThemedText style={styles.infoValue}>1.0.0 (Build 100)</ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText themeColor="textSecondary">อัปเดตล่าสุด</ThemedText>
                <ThemedText style={styles.infoValue}>8 มิ.ย. 2026</ThemedText>
              </View>
            </View>
          </View>

          <Pressable 
            style={({ pressed }) => [styles.saveButton, { opacity: pressed ? 0.8 : 1 }]}
            onPress={handleSave}
          >
            <ThemedText style={styles.saveButtonText}>บันทึกการตั้งค่า</ThemedText>
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
    gap: Spacing.six,
  },
  section: {
    gap: Spacing.three,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: Spacing.one,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.four,
    borderRadius: 16,
    gap: Spacing.four,
  },
  settingInfo: {
    flex: 1,
    gap: 2,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingDesc: {
    fontSize: 12,
  },
  infoCard: {
    padding: Spacing.four,
    borderRadius: 16,
    gap: Spacing.three,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#22c55e',
    padding: Spacing.four,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
