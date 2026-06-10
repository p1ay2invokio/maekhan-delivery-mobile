import React from 'react';
import { StyleSheet, Pressable, View, TextInput, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCart } from '@/hooks/use-cart';

export default function AccountSettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useCart();

  const name = user?.name || '';
  const phone = user?.phoneNumber || '';
  const email = user?.email || '';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={{ fontSize: 24 }}>←</ThemedText>
          </Pressable>
          <ThemedText type="subtitle">ข้อมูลบัญชี</ThemedText>
          <View style={{ width: 40 }} />
        </ThemedView>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>ข้อมูลส่วนตัว</ThemedText>
            
            <View style={styles.inputGroup}>
              <ThemedText themeColor="textSecondary" style={styles.label}>ชื่อ-นามสกุล</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.textSecondary, borderColor: 'rgba(0,0,0,0.05)' }]}
                value={name}
                editable={false}
                placeholder="ไม่มีข้อมูลชื่อ"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText themeColor="textSecondary" style={styles.label}>เบอร์โทรศัพท์</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.textSecondary, borderColor: 'rgba(0,0,0,0.05)' }]}
                value={phone}
                editable={false}
                placeholder="ไม่มีข้อมูลเบอร์โทร"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText themeColor="textSecondary" style={styles.label}>อีเมล</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.textSecondary, borderColor: 'rgba(0,0,0,0.05)' }]}
                value={email}
                editable={false}
                placeholder="ไม่มีข้อมูลอีเมล"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>ความปลอดภัย</ThemedText>
            <Pressable 
              style={[styles.menuItem, { backgroundColor: theme.backgroundElement }]}
              onPress={() => Alert.alert('ฟีเจอร์กำลังพัฒนา', 'ระบบเปลี่ยนรหัสผ่านจะพร้อมใช้งานเร็วๆ นี้')}
            >
              <ThemedText style={styles.menuItemText}>เปลี่ยนรหัสผ่าน</ThemedText>
              <ThemedText style={{ fontSize: 18, color: theme.textSecondary }}>›</ThemedText>
            </Pressable>
            <Pressable 
              style={[styles.menuItem, { backgroundColor: theme.backgroundElement, marginTop: Spacing.two }]}
              onPress={() => Alert.alert('ฟีเจอร์กำลังพัฒนา', 'ระบบลบบัญชีผู้ใช้งานจะพร้อมใช้งานเร็วๆ นี้')}
            >
              <ThemedText style={[styles.menuItemText, { color: '#ef4444' }]}>ลบบัญชีผู้ใช้งาน</ThemedText>
            </Pressable>
          </View>
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
    marginBottom: Spacing.one,
  },
  inputGroup: {
    gap: Spacing.two,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: Spacing.four,
    fontSize: 16,
    borderWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#22c55e',
    padding: Spacing.four,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
