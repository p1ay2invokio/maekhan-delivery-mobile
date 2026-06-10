import React, { useEffect, useState } from 'react';
import { StyleSheet, Pressable, View, FlatList, TextInput, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCart } from '@/hooks/use-cart';

const API_URL = 'http://192.168.1.34:3001';
// ... (interfaces)
export default function AdminUsersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useCart();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user || user.role !== 1) {
      router.replace('/home');
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      if (!user?.token) return;

      const response = await fetch(`${API_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      const result = await response.json();
      if (result.status === 'success') {
        setUsers(result.data);
      }
    } catch (error) {
      console.error('Fetch users failed', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user]);

  const filteredUsers = users.filter(user => 
    (user.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
    user.phoneNumber.includes(searchQuery)
  );

  const renderUserItem = ({ item }: { item: User }) => (
    <ThemedView style={[styles.userCard, { backgroundColor: theme.backgroundElement }]}>
      {item.profileImage ? (
        <Image 
          source={{ uri: `${API_URL}/public/profiles/${item.profileImage}` }} 
          style={styles.userIcon} 
        />
      ) : (
        <View style={styles.userIcon}>
          <ThemedText style={styles.userInitial}>{(item.name || 'U')[0]}</ThemedText>
        </View>
      )}
      <View style={styles.userInfo}>
        <ThemedText style={styles.userName}>{item.name || 'ไม่มีชื่อ'}</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.userPhone}>{item.phoneNumber}</ThemedText>
      </View>
      <View style={styles.pointsInfo}>
        <ThemedText style={styles.pointsText}>{(item.totalPoint || 0).toLocaleString()}</ThemedText>
        <ThemedText style={styles.pointsLabel}>แต้ม</ThemedText>
      </View>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={{ fontSize: 24 }}>←</ThemedText>
          </Pressable>
          <ThemedText type="subtitle">จัดการสมาชิก</ThemedText>
          <View style={{ width: 40 }} />
        </ThemedView>

        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: theme.backgroundElement, color: theme.text }]}
            placeholder="ค้นหาชื่อ หรือ เบอร์โทร..."
            placeholderTextColor="gray"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#22c55e" />
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            renderItem={renderUserItem}
            keyExtractor={item => item.phoneNumber}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ThemedText themeColor="textSecondary">ไม่พบข้อมูลสมาชิก</ThemedText>
              </View>
            }
          />
        )}
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
  searchContainer: {
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.two,
  },
  searchInput: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.eight,
    gap: Spacing.two,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.three,
  },
  userIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInitial: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userPhone: {
    fontSize: 13,
  },
  pointsInfo: {
    alignItems: 'flex-end',
  },
  pointsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  pointsLabel: {
    fontSize: 10,
    color: '#4ade80',
    fontWeight: '600',
  },
  emptyContainer: {
    paddingTop: 100,
    alignItems: 'center',
  },
});
