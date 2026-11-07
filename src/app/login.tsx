import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  useColorScheme,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCart } from '@/hooks/use-cart';
import { API_URL } from '@/constants/config';

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { login } = useCart();

  const [isRegister, setIsRegister] = useState(params.mode === 'register');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [mooban, setMooban] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params.mode === 'register') {
      setIsRegister(true);
    } else if (params.mode === 'login') {
      setIsRegister(false);
    }
  }, [params.mode]);

  const handleAction = async () => {
    const cleanPhone = phone.trim().replace(/-/g, '');
    const cleanName = name.trim();
    const cleanMooban = mooban.trim();

    if (isRegister) {
      if (!cleanName || !cleanPhone || !cleanMooban) {
        Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
      }
    } else {
      if (!cleanPhone) {
        Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกเบอร์โทรศัพท์');
        return;
      }
    }

    setLoading(true);
    try {
      const endpoint = isRegister ? '/api/register' : '/api/login';
      const body = isRegister
        ? { name: cleanName, phoneNumber: cleanPhone, mooban: cleanMooban }
        : { phoneNumber: cleanPhone };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (response.ok) {
        const userData = {
          ...result.data.user,
          token: result.data.token,
        };
        login(userData);

        if (isRegister) {
          Alert.alert('สำเร็จ', 'ลงทะเบียนเรียบร้อยแล้ว');
        }

        router.replace('/home');
      } else {
        Alert.alert('ผิดพลาด', result.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('ผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Logo ── */}
            <View style={styles.logoSection}>
              <View
                style={[
                  styles.logoWrapper,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                  },
                ]}
              >
                <Image
                  source={require('../../assets/images/playstore.png')}
                  style={styles.logo}
                  resizeMode="cover"
                />
              </View>
              <ThemedText style={styles.title}>
                {isRegister ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
              </ThemedText>
            </View>

            {/* ── Inputs ── */}
            <View style={styles.form}>
              {isRegister && (
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                      borderColor: isDark ? '#334155' : '#E2E8F0',
                      color: theme.text,
                    },
                  ]}
                  placeholder="ชื่อ - นามสกุล"
                  placeholderTextColor={theme.textSecondary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              )}

              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                    color: theme.text,
                  },
                ]}
                placeholder="เบอร์โทรศัพท์"
                placeholderTextColor={theme.textSecondary}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={10}
              />

              {isRegister && (
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                      borderColor: isDark ? '#334155' : '#E2E8F0',
                      color: theme.text,
                    },
                  ]}
                  placeholder="หมู่บ้าน / ที่อยู่"
                  placeholderTextColor={theme.textSecondary}
                  value={mooban}
                  onChangeText={setMooban}
                />
              )}

              {/* ── Action Button ── */}
              <TouchableOpacity
                style={styles.button}
                onPress={handleAction}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>
                    {isRegister ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* ── Clean Switch Link ── */}
              <TouchableOpacity
                onPress={() => setIsRegister(!isRegister)}
                style={styles.switchButton}
                activeOpacity={0.7}
              >
                <Text style={styles.switchText}>
                  {isRegister ? 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ' : 'ยังไม่มีบัญชี? สมัครสมาชิก'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoWrapper: {
    width: 96,
    height: 96,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  logo: {
    width: 96,
    height: 96,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Kanit-SemiBold',
  },
  form: {
    gap: 14,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Kanit-Regular',
  },
  button: {
    height: 52,
    backgroundColor: '#22c55e',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: 'Kanit-Medium',
    fontSize: 17,
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchText: {
    color: '#22c55e',
    fontSize: 15,
    fontFamily: 'Kanit-Regular',
  },
});
