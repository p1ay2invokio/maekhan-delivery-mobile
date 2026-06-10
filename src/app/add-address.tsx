import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Pressable, View, TextInput, ScrollView, Alert, ActivityIndicator, Modal, Dimensions, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { SymbolView } from 'expo-symbols';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCart } from '@/hooks/use-cart';

const API_URL = 'http://192.168.1.34:3001';
const SHOP_CENTER = {
  latitude: 18.528506,
  longitude: 98.859416,
};
const MAX_DISTANCE_METERS = 5000; // 5km

export default function AddAddressScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, refreshUser } = useCart();

  const [address, setAddress] = useState(user?.address || '');
  const [subDistrict, setSubDistrict] = useState(user?.subDistrict || '');
  const [district, setDistrict] = useState(user?.district || '');
  const [province, setProvince] = useState(user?.province || '');
  const [postalCode, setPostalCode] = useState(user?.postalCode || '');
  const [isSaving, setIsSaving] = useState(false);

  // Map States
  const [showMap, setShowMap] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 13.7563,
    longitude: 100.5018,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [currentAddress, setCurrentAddress] = useState<string>('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isWithinRange, setIsWithinRange] = useState(true);
  const mapRef = useRef<MapView>(null);
  const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c;
  };

  useEffect(() => {
    if (user) {
      setAddress(user.address || '');
      setSubDistrict(user.subDistrict || '');
      setDistrict(user.district || '');
      setProvince(user.province || '');
      setPostalCode(user.postalCode || '');
    }
  }, [user]);

  const handleOpenMap = async () => {
    setIsLoadingLocation(true);
    try {
      console.log('Requesting location permissions...');
      let { status } = await Location.requestForegroundPermissionsAsync();
      console.log('Permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert('คำเตือน', 'กรุณาอนุญาตให้แอปเข้าถึงตำแหน่งของคุณเพื่อใช้งานแผนที่');
        setIsLoadingLocation(false);
        return;
      }

      console.log('Getting current position...');
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      console.log('Current position:', location.coords);

      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      setMapRegion(newRegion);
      setSelectedLocation(location.coords);
      setShowMap(true);
      
      // Fetch initial address
      fetchAddressFromCoords(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.error('Get location failed:', error);
      setShowMap(true);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const fetchAddressFromCoords = async (latitude: number, longitude: number) => {
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocode.length > 0) {
        const place = reverseGeocode[0];
        const formatted = [
          place.name,
          place.street,
          place.subregion,
          place.city,
          place.region,
          place.postalCode
        ].filter(Boolean).join(' ');
        setCurrentAddress(formatted);
        
        // Update form fields
        setSubDistrict(place.subregion || place.district || '');
        setDistrict(place.city || place.subregion || '');
        setProvince(place.region || '');
        setPostalCode(place.postalCode || '');
        
        const street = place.street || '';
        const name = place.name || '';
        if (name && name !== street) {
          setAddress(`${name} ${street}`.trim());
        } else {
          setAddress(street);
        }
      }
    } catch (error) {
      console.error('Reverse geocode failed:', error);
    }
  };

  const onRegionChangeComplete = (region: any) => {
    setMapRegion(region);
    setSelectedLocation({
      latitude: region.latitude,
      longitude: region.longitude,
    });
    
    const distance = getDistance(
      region.latitude, 
      region.longitude, 
      SHOP_CENTER.latitude, 
      SHOP_CENTER.longitude
    );
    setIsWithinRange(distance <= MAX_DISTANCE_METERS);
    
    // Debounce geocoding request to avoid rate limit errors
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }

    if (distance <= MAX_DISTANCE_METERS) {
      setCurrentAddress('กำลังค้นหาที่อยู่...');
      geocodeTimeoutRef.current = setTimeout(() => {
        fetchAddressFromCoords(region.latitude, region.longitude);
      }, 800); // 800ms delay
    } else {
      setCurrentAddress('');
    }
  };

  const handleSelectLocation = () => {
    setShowMap(false);
  };

  const handleSave = async () => {
    if (!address || !subDistrict || !district || !province || !postalCode) {
      Alert.alert('ผิดพลาด', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (!user?.token) {
      Alert.alert('ผิดพลาด', 'กรุณาเข้าสู่ระบบใหม่');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/user/address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          address,
          subDistrict,
          district,
          province,
          postalCode,
          latitude: selectedLocation?.latitude,
          longitude: selectedLocation?.longitude
        })
      });

      const result = await response.json();

      if (result.status === 'success') {
        await refreshUser();
        Alert.alert('สำเร็จ', 'บันทึกข้อมูลที่อยู่เรียบร้อยแล้ว');
        router.back();
      } else {
        Alert.alert('ผิดพลาด', result.message || 'ไม่สามารถบันทึกที่อยู่ได้');
      }
    } catch (error) {
      console.error('Save address failed', error);
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
          <ThemedText type="subtitle">ข้อมูลที่อยู่</ThemedText>
          <View style={{ width: 40 }} />
        </ThemedView>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Pressable 
              style={({ pressed }) => [styles.mapPickerButton, { opacity: pressed ? 0.8 : 1 }]}
              onPress={handleOpenMap}
            >
              <SymbolView name="map.fill" size={20} tintColor="#f97316" />
              <ThemedText style={styles.mapPickerText}>เลือกตำแหน่งจากแผนที่ Google Maps</ThemedText>
              {isLoadingLocation && <ActivityIndicator size="small" color="#f97316" />}
            </Pressable>

            <View style={styles.inputGroup}>
              <ThemedText themeColor="textSecondary" style={styles.label}>รายละเอียดที่อยู่ (เลขที่บ้าน, หมู่, ซอย, ถนน)</ThemedText>
              <TextInput
                style={[styles.textArea, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: 'rgba(0,0,0,0.05)' }]}
                value={address}
                onChangeText={setAddress}
                placeholder="กรอกเลขที่บ้าน, ซอย, ถนน..."
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText themeColor="textSecondary" style={styles.label}>ตำบล / แขวง</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: 'rgba(0,0,0,0.05)' }]}
                value={subDistrict}
                onChangeText={setSubDistrict}
                placeholder="กรอกตำบล / แขวง"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText themeColor="textSecondary" style={styles.label}>อำเภอ / เขต</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: 'rgba(0,0,0,0.05)' }]}
                value={district}
                onChangeText={setDistrict}
                placeholder="กรอกอำเภอ / เขต"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText themeColor="textSecondary" style={styles.label}>จังหวัด</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: 'rgba(0,0,0,0.05)' }]}
                value={province}
                onChangeText={setProvince}
                placeholder="กรอกจังหวัด"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText themeColor="textSecondary" style={styles.label}>รหัสไปรษณีย์</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: 'rgba(0,0,0,0.05)' }]}
                value={postalCode}
                onChangeText={setPostalCode}
                keyboardType="number-pad"
                placeholder="กรอกรหัสไปรษณีย์"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
          </View>

          <Pressable 
            style={({ pressed }) => [styles.saveButton, { opacity: (pressed || isSaving) ? 0.8 : 1 }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <ThemedText style={styles.saveButtonText}>บันทึกข้อมูลที่อยู่</ThemedText>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>

      {/* Map Modal */}
      <Modal visible={showMap} animationType="slide" statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={{ flex: 1, width: '100%', height: '100%' }}
            initialRegion={mapRegion}
            onRegionChangeComplete={onRegionChangeComplete}
            showsUserLocation
            showsMyLocationButton
          >
            <Circle 
              center={SHOP_CENTER}
              radius={MAX_DISTANCE_METERS}
              strokeWidth={2}
              strokeColor="rgba(60, 135, 247, 0.5)"
              fillColor="rgba(60, 135, 247, 0.1)"
            />
          </MapView>
          
          {/* Fixed Center Marker Overlay */}
          <View style={styles.markerFixed} pointerEvents="none">
            <View style={[styles.addressLabelContainer, !isWithinRange && { borderColor: '#ef4444', borderWidth: 1 }]}>
              <ThemedText style={[styles.addressLabelText, !isWithinRange && { color: '#ef4444' }]} numberOfLines={2}>
                {isWithinRange ? (currentAddress || 'กำลังค้นหาที่อยู่...') : 'อยู่นอกพื้นที่ให้บริการจัดส่ง (5 กม.)'}
              </ThemedText>
              <View style={styles.addressLabelArrow} />
            </View>
            <Image 
              source={require('../../assets/images/location-pin.png')} 
              style={[{ width: 40, height: 40 }, !isWithinRange && { tintColor: '#ef4444' }]}
              resizeMode="contain"
            />
          </View>

          {/* Top Back Button Overlay */}
          <SafeAreaView style={styles.mapTopOverlay}>
            <Pressable 
              onPress={() => setShowMap(false)} 
              style={styles.mapCircleButton}
            >
              <ThemedText style={{ fontSize: 20 }}>✕</ThemedText>
            </Pressable>
          </SafeAreaView>
          
          {/* Bottom Floating Info Card */}
          <View style={styles.mapFloatingCard}>
            <View style={styles.cardInfoRow}>
              <SymbolView 
                name={isWithinRange ? "location.fill" : "exclamationmark.triangle.fill"} 
                size={18} 
                tintColor={isWithinRange ? "#f97316" : "#ef4444"} 
              />
              <ThemedText style={[styles.cardAddressText, !isWithinRange && { color: '#ef4444' }]} numberOfLines={2}>
                {isWithinRange ? (currentAddress || 'กำลังค้นหาตำแหน่ง...') : 'ขออภัย ตำแหน่งนี้ไม่อยู่ในพื้นที่จัดส่ง'}
              </ThemedText>
            </View>
            
            <Pressable 
              style={({ pressed }) => [
                styles.mapConfirmButton, 
                { backgroundColor: isWithinRange ? '#f97316' : '#94a3b8', opacity: (pressed || !isWithinRange) ? 0.9 : 1 }
              ]}
              onPress={handleSelectLocation}
              disabled={!isWithinRange}
            >
              <ThemedText style={styles.mapConfirmButtonText}>
                {isWithinRange ? 'ยืนยันตำแหน่งนี้' : 'อยู่นอกพื้นที่จัดส่ง'}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    gap: Spacing.four,
  },
  mapPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    backgroundColor: 'rgba(60, 135, 247, 0.1)',
    borderRadius: 16,
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(60, 135, 247, 0.2)',
  },
  mapPickerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#f97316',
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
  textArea: {
    height: 80,
    borderRadius: 12,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    fontSize: 16,
    borderWidth: 1,
  },
  saveButton: {
    backgroundColor: '#f97316',
    padding: Spacing.four,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: Spacing.two,
    height: 56,
    justifyContent: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  markerFixed: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 40,
    height: 40,
    marginLeft: -20,
    marginTop: -40, // Adjust half of marker size + label offset
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressLabelContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 8,
    width: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    position: 'absolute',
    bottom: 40, // Position above the marker icon
  },
  addressLabelText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1e293b',
  },
  addressLabelArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'white',
    position: 'absolute',
    bottom: -8,
  },
  mapTopOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: Spacing.four,
  },
  mapCircleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  mapFloatingCard: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: Spacing.five,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    gap: Spacing.four,
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  cardAddressText: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
    lineHeight: 20,
  },
  mapConfirmButton: {
    backgroundColor: '#f97316',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapConfirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
