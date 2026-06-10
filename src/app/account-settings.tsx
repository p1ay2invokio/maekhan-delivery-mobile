import React, { useState } from 'react';
import { StyleSheet, Pressable, View, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCart } from '@/hooks/use-cart';

const API_URL = 'http://192.168.1.34:3001';

export default function AccountSettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, refreshUser } = useCart();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name) {
      Alert.alert('ผิดพลาด', 'กรุณากรอกชื่อ');
      return;
    }

    if (!user?.token) return;

    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/user/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ name, phoneNumber: phone, email })
      });

      const result = await response.json();
      if (result.status === 'success') {
        await refreshUser();
        Alert.alert('สำเร็จ', 'บันทึกข้อมูลการตั้งค่าเรียบร้อยแล้ว');
        router.back();
      } else {
        Alert.alert('ผิดพลาด', result.message || 'ไม่สามารถบันทึกข้อมูลได้');
      }
    } catch (error) {
      console.error('Update profile failed', error);
      Alert.alert('ผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={{ fontSize: 24 }}>←</ThemedText>
          </Pressable>
          <ThemedText type="subtitle">ตั้งค่าบัญชี</ThemedText>
          <View style={{ width: 40 }} />
        </ThemedView>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>ข้อมูลส่วนตัว</ThemedText>
            
            <View style={styles.inputGroup}>
              <ThemedText themeColor="textSecondary" style={styles.label}>ชื่อ-นามสกุล</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: 'rgba(0,0,0,0.05)' }]}
                value={name}
                onChangeText={setName}
                placeholder="กรอกชื่อของคุณ"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText themeColor="textSecondary" style={styles.label}>เบอร์โทรศัพท์</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: 'rgba(0,0,0,0.05)' }]}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="08X-XXX-XXXX"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText themeColor="textSecondary" style={styles.label}>อีเมล</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: 'rgba(0,0,0,0.05)' }]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="example@mail.com"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>ความปลอดภัย</ThemedText>
            <Pressable style={[styles.menuItem, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText style={styles.menuItemText}>เปลี่ยนรหัสผ่าน</ThemedText>
              <ThemedText style={{ fontSize: 18, color: theme.textSecondary }}>›</ThemedText>
            </Pressable>
            <Pressable style={[styles.menuItem, { backgroundColor: theme.backgroundElement, marginTop: Spacing.two }]}>
              <ThemedText style={[styles.menuItemText, { color: '#ef4444' }]}>ลบบัญชีผู้ใช้งาน</ThemedText>
            </Pressable>
          </View>

          <Pressable 
            style={({ pressed }) => [styles.saveButton, { opacity: pressed ? 0.8 : 1 }]}
            onPress={handleSave}
          >
            <ThemedText style={styles.saveButtonText}>บันทึกข้อมูล</ThemedText>
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
    backgroundColor: '#f97316',
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
