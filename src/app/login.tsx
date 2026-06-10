import { useState } from 'react';
import { TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCart, storage, USER_STORAGE_KEY } from '@/hooks/use-cart';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for the API
const API_URL = 'http://192.168.1.34:3001'; 

export default function LoginScreen() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const theme = useTheme();
  const { login } = useCart();

  const handleAction = async () => {
    if (isRegister && (!name || !phone)) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อและเบอร์โทรศัพท์');
      return;
    }

    if (!isRegister && !phone) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกเบอร์โทรศัพท์');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isRegister ? '/api/register' : '/api/login';
      const body = isRegister 
        ? { name, phoneNumber: phone }
        : { phoneNumber: phone };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (response.ok) {
        // Store user data including the token
        const userData = {
          ...result.data.user,
          token: result.data.token
        };
        login(userData);
        
        if (isRegister) {
          Alert.alert('สำเร็จ', 'ลงทะเบียนและเข้าสู่ระบบเรียบร้อยแล้ว');
        }
        
        // Navigate directly to Home for both login and register
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
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="subtitle" style={styles.header}>
            {isRegister ? 'สร้างบัญชีใหม่' : 'เข้าสู่ระบบ'}
          </ThemedText>

          <ThemedView style={styles.inputGroup}>
            {!isRegister ? (
              <ThemedView style={styles.inputContainer}>
                <ThemedText type="smallBold">เบอร์โทรศัพท์</ThemedText>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.backgroundElement }]}
                  placeholder="08X-XXX-XXXX"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </ThemedView>
            ) : (
              <>
                <ThemedView style={styles.inputContainer}>
                  <ThemedText type="smallBold">ชื่อ</ThemedText>
                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.backgroundElement }]}
                    placeholder="ชื่อของคุณ"
                    placeholderTextColor={theme.textSecondary}
                    value={name}
                    onChangeText={setName}
                  />
                </ThemedView>

                <ThemedView style={styles.inputContainer}>
                  <ThemedText type="smallBold">เบอร์โทรศัพท์</ThemedText>
                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.backgroundElement }]}
                    placeholder="08X-XXX-XXXX"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </ThemedView>
              </>
            )}
          </ThemedView>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#22c55e' }]}
            onPress={handleAction}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <ThemedText style={styles.buttonText}>
                {isRegister ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
              </ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setIsRegister(!isRegister)} 
            style={styles.switchButton}
          >
            <Text style={{ color: '#22c55e', fontSize: 18, fontFamily: 'Kanit-Regular' }}>
              {isRegister ? 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ' : 'ยังไม่มีบัญชี? สมัครสมาชิกที่นี่'}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.six,
    justifyContent: 'center',
    gap: Spacing.six,
  },
  header: {
    textAlign: 'center',
    marginBottom: Spacing.four,
  },
  inputGroup: {
    gap: Spacing.four,
  },
  inputContainer: {
    gap: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.four,
    fontSize: 16,
  },
  button: {
    borderRadius: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
    height: 56,
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    lineHeight: 20
  },
  switchButton: {
    alignItems: 'center',
  },
});
