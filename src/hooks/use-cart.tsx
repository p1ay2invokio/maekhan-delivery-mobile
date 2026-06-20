import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import { API_URL } from '@/constants/config';

/**
 * AsyncStorage Exclusively for Native App
 */
let AsyncStorage: any;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  console.error('AsyncStorage module not found. Make sure it is installed and the app is rebuilt.');
}

export const USER_STORAGE_KEY = '@user_data';
export const CART_STORAGE_KEY = '@cart_data';

// Helper for safe storage operations
export const storage = {
  getItem: async (key: string) => {
    if (!AsyncStorage) return null;
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.error('AsyncStorage getItem error:', e);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    if (!AsyncStorage) return;
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.error('AsyncStorage setItem error:', e);
    }
  },
  removeItem: async (key: string) => {
    if (!AsyncStorage) return;
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error('AsyncStorage removeItem error:', e);
    }
  }
};

// --- Interfaces ---
export interface Product { id: string; name: string; price: number; points: number; image: string; category: string; }
export interface CartItem extends Product { quantity: number; }
export interface User {
  email?: string;
  name: string;
  phoneNumber: string; 
  pointMk: number; 
  pointSpt: number; 
  pointDl: number; 
  usePoint: number; 
  totalPoint?: number;
  role?: number;
  token?: string; 
  address?: string;
  mooban?: string;
  subDistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  profileImage?: string;
}

const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'ข้าวหอมมะลิ 100%',
    price: 185,
    points: 50,
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="%23f0fdf4"/><circle cx="50" cy="50" r="30" fill="%23bbf7d0"/><path d="M30,50 Q50,70 70,50" stroke="%2322c55e" stroke-width="4" fill="none"/></svg>',
    category: 'ข้าว',
  },
  {
    id: '2',
    name: 'น้ำมันพืชตราองุ่น',
    price: 45,
    points: 10,
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="%23fef9c3"/><rect x="40" y="30" width="20" height="50" rx="5" fill="%23fde047"/><rect x="45" y="20" width="10" height="10" fill="%23ca8a04"/></svg>',
    category: 'เครื่องปรุง',
  },
  {
    id: '3',
    name: 'ไข่ไก่สดเบอร์ 2 (แพ็ค 10)',
    price: 52,
    points: 15,
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="%23fff7ed"/><ellipse cx="50" cy="50" rx="20" ry="25" fill="%23fed7aa"/></svg>',
    category: 'ของสด',
  },
  {
    id: '4',
    name: 'น้ำดื่มสิงห์ 1.5 ลิตร',
    price: 14,
    points: 5,
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="%23f0f9ff"/><rect x="40" y="30" width="20" height="50" rx="3" fill="%23bae6fd"/><path d="M40,40 L60,40" stroke="%230284c7" stroke-width="4"/></svg>',
    category: 'เครื่องดื่ม',
  },
  {
    id: '5',
    name: 'บะหมี่กึ่งสำเร็จรูป มาม่า',
    price: 7,
    points: 2,
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="%23fef2f2"/><rect x="30" y="30" width="40" height="40" rx="5" fill="%23fecaca"/><path d="M35,45 Q45,55 55,45 T65,45" stroke="%23ef4444" stroke-width="3" fill="none"/></svg>',
    category: 'อาหารแห้ง',
  },
  {
    id: '6',
    name: 'นมสดจืด Meiji',
    price: 26,
    points: 8,
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="%23faf5ff"/><rect x="35" y="25" width="30" height="55" rx="2" fill="%23e9d5ff"/><polygon points="35,25 50,15 65,25" fill="%23c084fc"/></svg>',
    category: 'ของสด',
  },
];

interface CartContextType {
  cart: CartItem[]; user: User | null; isLoading: boolean;
  products: Product[]; addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  addToCart: (product: Product) => void; removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void; clearCart: () => void;
  totalCash: number; totalPoints: number; totalItems: number; userPoints: number;
  profileImage: string; login: (userData: User) => void; logout: () => void;
  checkout: (deliveryMethod: 'pickup' | 'delivery', paymentMethod: 'qr' | 'cod', pickupDetails?: string) => Promise<{ success: boolean; message: string; data?: any }>; updateProfileImage: (uri: string) => void;
  refreshUser: () => Promise<void>;
  fetchProducts: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const defaultProfile = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="%23e2e8f0"/><circle cx="50" cy="38" r="18" fill="%2394a3b8"/><path d="M20,80 C20,60 40,60 50,60 C60,60 80,60 80,80" fill="%2394a3b8"/></svg>';
  const [profileImage, setProfileImage] = useState(defaultProfile);

  // Update profileImage state whenever user changes
  useEffect(() => {
    if (user?.profileImage) {
      setProfileImage(`${API_URL}/public/profiles/${user.profileImage}`);
    } else {
      setProfileImage(defaultProfile);
    }
  }, [user]);

  // Save cart whenever it changes
  useEffect(() => {
    if (isCartLoaded) {
      storage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }
  }, [cart, isCartLoaded]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products`);
      const result = await response.json();
      if (result.status === 'success') {
        const productsWithFullUrls = result.data.map((p: Product) => ({
          ...p,
          // If image doesn't start with http, it's a local file served via staticPlugin
          image: p.image && !p.image.startsWith('http')
            ? `${API_URL}/public/products/${p.image}`
            : p.image
        }));
        setProducts(productsWithFullUrls);
      }
    } catch (error) {
      console.error('Fetch products failed', error);
      if (products.length === 0) setProducts(INITIAL_PRODUCTS);
    }
  };

  const refreshUser = async (currentUser?: User) => {
    const targetUser = currentUser || user;
    if (!targetUser?.token) return;
    try {
      const response = await fetch(`${API_URL}/api/user/me`, {
        headers: {
          'Authorization': `Bearer ${targetUser.token}`
        }
      });
      const result = await response.json();
      if (result.status === 'success') {
        const updatedUser = { ...targetUser, ...result.data };
        setUser(updatedUser);
        await storage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Refresh user failed', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        fetchProducts();
        const savedUser = await storage.getItem(USER_STORAGE_KEY);
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          if (parsedUser?.token) {
            setUser(parsedUser);
            refreshUser(parsedUser);
          }
        }
        
        const savedCart = await storage.getItem(CART_STORAGE_KEY);
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
        setIsCartLoaded(true);
      } catch (error) {
        console.warn('Persistence load failed', error);
        setIsCartLoaded(true);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const login = async (userData: User) => {
    try {
      setUser(userData);
      await storage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      refreshUser(userData);
    } catch (e) { console.error('Save failed', e); }
  };

  const logout = async () => {
    try {
      setUser(null);
      setCart([]);
      await storage.removeItem(USER_STORAGE_KEY);
      await storage.removeItem(CART_STORAGE_KEY);
    } catch (e) { console.error('Logout failed', e); }
  };

  const addProduct = async (newProduct: Omit<Product, 'id'>) => {
    return new Promise<void>((resolve, reject) => {
      try {
        const formData = new FormData();
        formData.append('name', newProduct.name);
        formData.append('price', newProduct.price.toString());
        formData.append('points', newProduct.points.toString());
        formData.append('category', newProduct.category);

        if (newProduct.image) {
          const uri = newProduct.image;
          const filename = uri.split('/').pop() || 'image.jpg';
          
          const extension = filename.split('.').pop()?.toLowerCase();
          let type = 'image/jpeg';
          if (extension === 'png') type = 'image/png';
          else if (extension === 'gif') type = 'image/gif';
          else if (extension === 'webp') type = 'image/webp';

          formData.append('image', {
            uri: uri,
            name: filename,
            type: type,
          } as any);
        }

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_URL}/api/products`);
        if (user?.token) {
          xhr.setRequestHeader('Authorization', `Bearer ${user.token}`);
        }
        xhr.setRequestHeader('Accept', 'application/json');
        
        xhr.onload = () => {
          try {
            const result = JSON.parse(xhr.responseText);
            if (result.status === 'success') {
              fetchProducts().then(resolve).catch(reject);
            } else {
              console.error('Server error adding product:', result.message);
              Alert.alert('ผิดพลาด', result.message || 'ไม่สามารถเพิ่มสินค้าได้');
              resolve();
            }
          } catch (e) {
            console.error('Parse error', e);
            reject(e);
          }
        };

        xhr.onerror = (e) => {
          console.error('XHR Error', e);
          Alert.alert('ผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
          reject(e);
        };

        xhr.send(formData);
      } catch (error) {
        console.error('Add product failed', error);
        Alert.alert('ผิดพลาด', 'เกิดข้อผิดพลาดในการเตรียมข้อมูล');
        reject(error);
      }
    });
  };

  const deleteProduct = async (productId: string) => {
    try {
      if (!user?.token) {
        Alert.alert('ผิดพลาด', 'คุณไม่มีสิทธิ์ลบสินค้า');
        return;
      }

      const response = await fetch(`${API_URL}/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Accept': 'application/json'
        }
      });

      const result = await response.json();
      if (result.status === 'success') {
        await fetchProducts();
      } else {
        console.error('Server error deleting product:', result.message);
        Alert.alert('ผิดพลาด', result.message || 'ไม่สามารถลบสินค้าได้');
        throw new Error(result.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Delete product failed', error);
      Alert.alert('ผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
      throw error;
    }
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => setCart((prev) => prev.filter((i) => i.id !== id));
  const updateQuantity = (id: string, q: number) => {
    if (q <= 0) return removeFromCart(id);
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, quantity: q } : i));
  };

  const clearCart = () => {
    setCart([]);
    storage.removeItem(CART_STORAGE_KEY);
  };
  const totalCash = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalPoints = cart.reduce((s, i) => s + i.points * i.quantity, 0);
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const userPoints = user?.totalPoint || 0;

  const checkout = async (deliveryMethod: 'pickup' | 'delivery', paymentMethod: 'qr' | 'cod', pickupDetails?: string) => {
    if (!user || !user.token) {
      console.log('Checkout aborted: No user or token');
      return { success: false, message: 'กรุณาเข้าสู่ระบบ' };
    }
    
    try {
      const requestBody = {
        totalCash,
        totalPoints,
        deliveryMethod,
        paymentMethod,
        pickupDetails,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          points: item.points,
          quantity: item.quantity
        }))
      };

      console.log('--- CHECKOUT REQUEST START ---');
      console.log('URL:', `${API_URL}/api/orders`);
      console.log('Body:', JSON.stringify(requestBody, null, 2));
      console.log('--- CHECKOUT REQUEST END ---');

      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Checkout response status:', response.status);
      const result = await response.json();
      console.log('Checkout response body:', JSON.stringify(result, null, 2));

      if (result.status === 'success') {
        await refreshUser();
        clearCart();
        return { success: true, message: 'สั่งซื้อสำเร็จ!', data: result.data };
      } else {
        return { success: false, message: result.message || 'เกิดข้อผิดพลาดในการสั่งซื้อ' };
      }
    } catch (error) {
      console.error('--- CHECKOUT FETCH ERROR ---');
      console.error(error);
      return { success: false, message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้' };
    }
  };

  const updateProfileImage = async (uri: string) => {
    if (!user || !user.token) return;

    return new Promise<void>((resolve, reject) => {
      try {
        const formData = new FormData();
        const filename = uri.split('/').pop() || 'profile.jpg';
        const extension = filename.split('.').pop()?.toLowerCase();
        let type = 'image/jpeg';
        if (extension === 'png') type = 'image/png';

        formData.append('image', {
          uri: uri,
          name: filename,
          type: type,
        } as any);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_URL}/api/user/profile-image`);
        xhr.setRequestHeader('Authorization', `Bearer ${user.token}`);
        xhr.setRequestHeader('Accept', 'application/json');

        xhr.onload = () => {
          try {
            const result = JSON.parse(xhr.responseText);
            if (result.status === 'success') {
              refreshUser().then(resolve).catch(reject);
            } else {
              Alert.alert('ผิดพลาด', result.message || 'ไม่สามารถอัปโหลดรูปโปรไฟล์ได้');
              resolve();
            }
          } catch (e) {
            console.error('Parse error', e);
            reject(e);
          }
        };

        xhr.onerror = (e) => {
          console.error('XHR Error', e);
          Alert.alert('ผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
          reject(e);
        };

        xhr.send(formData);
      } catch (error) {
        console.error('Upload profile failed', error);
        Alert.alert('ผิดพลาด', 'เกิดข้อผิดพลาดในการเตรียมข้อมูล');
        reject(error);
      }
    });
  };

  return (
    <CartContext.Provider value={{
      cart, user, isLoading, products, addProduct, deleteProduct,
      addToCart, removeFromCart, updateQuantity,
      clearCart, totalCash, totalPoints, totalItems, userPoints,
      profileImage, login, logout, checkout, updateProfileImage,
      refreshUser, fetchProducts
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
