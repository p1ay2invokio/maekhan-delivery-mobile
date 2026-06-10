import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Platform, Alert } from 'react-native';

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
  subDistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  profileImage?: string;
}

const API_URL = 'http://192.168.1.34:3001';

const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'ข้าวหอมมะลิ 100%',
    price: 185,
    points: 50,
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400',
    category: 'ข้าว',
  },
  {
    id: '2',
    name: 'น้ำมันพืชตราองุ่น',
    price: 45,
    points: 10,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400',
    category: 'เครื่องปรุง',
  },
  {
    id: '3',
    name: 'ไข่ไก่สดเบอร์ 2 (แพ็ค 10)',
    price: 52,
    points: 15,
    image: 'https://images.unsplash.com/photo-1518562180175-34a163b1a9a6?auto=format&fit=crop&q=80&w=400',
    category: 'ของสด',
  },
  {
    id: '4',
    name: 'น้ำดื่มสิงห์ 1.5 ลิตร',
    price: 14,
    points: 5,
    image: 'https://images.unsplash.com/photo-1560023907-5f339617ea30?auto=format&fit=crop&q=80&w=400',
    category: 'เครื่องดื่ม',
  },
  {
    id: '5',
    name: 'บะหมี่กึ่งสำเร็จรูป มาม่า',
    price: 7,
    points: 2,
    image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&q=80&w=400',
    category: 'อาหารแห้ง',
  },
  {
    id: '6',
    name: 'นมสดจืด Meiji',
    price: 26,
    points: 8,
    image: 'https://images.unsplash.com/photo-1550583724-125581cc255b?auto=format&fit=crop&q=80&w=400',
    category: 'ของสด',
  },
];

interface CartContextType {
  cart: CartItem[]; user: User | null; isLoading: boolean;
  products: Product[]; addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  addToCart: (product: Product) => void; removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void; clearCart: () => void;
  totalCash: number; totalPoints: number; totalItems: number; userPoints: number;
  profileImage: string; login: (userData: User) => void; logout: () => void;
  checkout: (deliveryMethod: 'pickup' | 'delivery') => Promise<{ success: boolean; message: string }>; updateProfileImage: (uri: string) => void;
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
  const defaultProfile = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200';
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
        await fetchProducts();
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
        setTimeout(() => setIsLoading(false), 300);
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

  const checkout = async (deliveryMethod: 'pickup' | 'delivery', paymentMethod: 'qr' | 'cod') => {
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
      cart, user, isLoading, products, addProduct,
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
