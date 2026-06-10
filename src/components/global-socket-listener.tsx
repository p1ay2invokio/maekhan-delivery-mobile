import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { io } from 'socket.io-client';
import { useCart } from '@/hooks/use-cart';

const SOCKET_URL = 'http://192.168.1.34:3002';

export function GlobalSocketListener() {
  const { user, refreshUser } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (user?.phoneNumber) {
      console.log('GlobalSocketListener: Connecting for', user.phoneNumber);
      const socket = io(SOCKET_URL);
      
      socket.on("connect", () => {
        console.log("GlobalSocketListener: Connected to WebSocket");
        socket.emit("join", user.phoneNumber);
      });

      socket.on("payment_success", (data) => {
        console.log("GlobalSocketListener: Payment success received:", data);
        Alert.alert(
          "ชำระเงินสำเร็จ!",
          `ออร์เดอร์ #${data.orderId.slice(-6).toUpperCase()} ยอด ${data.amount} บาท ได้รับการยืนยันแล้ว`,
          [{ 
            text: "ดูประวัติการสั่งซื้อ", 
            onPress: () => {
              refreshUser();
              router.replace('/order-history');
            } 
          }],
          { cancelable: false }
        );
      });

      socket.on("order_cancelled", (data) => {
        console.log("GlobalSocketListener: Order cancelled received:", data);
        Alert.alert(
          "ออเดอร์ถูกยกเลิก",
          "ออเดอร์ของคุณถูกยกเลิกเนื่องจากไม่ได้ชำระเงินภายในเวลาที่กำหนด",
          [{ 
            text: "ตกลง", 
            onPress: () => {
              refreshUser();
              // Only redirect if it makes sense, or just refresh data
            } 
          }]
        );
      });

      socket.on("disconnect", () => {
        console.log("GlobalSocketListener: Disconnected");
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [user?.phoneNumber]);

  return null;
}
