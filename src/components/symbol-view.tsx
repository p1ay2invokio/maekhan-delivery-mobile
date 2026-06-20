import { SymbolView as ExpoSymbolView } from 'expo-symbols';
import React from 'react';

// Maps Apple's SF Symbols to Google's Material Symbols for Android & Web
const ICON_MAPPING: Record<string, string> = {
  'chevron.left': 'chevron_left',
  'chevron.right': 'chevron_right',
  'map.fill': 'map',
  'trash': 'delete',
  'cart.fill': 'shopping_cart',
  'cart': 'shopping_cart',
  'cart.badge.plus': 'add_shopping_cart',
  'doc.text.magnifyingglass': 'manage_search',
  'person.2.fill': 'group',
  'mappin.circle.fill': 'location_on',
  'house.fill': 'home',
  'qrcode': 'qr_code',
  'checkmark.circle.fill': 'check_circle',
  'banknote.fill': 'payments',
  'square.and.arrow.down': 'download',
  'camera.fill': 'photo_camera',
  'pencil.circle.fill': 'edit',
  'plus.circle.fill': 'add_circle',
  'hand.raised.fill': 'back_hand',
  'truck.box.fill': 'local_shipping',
  'location.fill': 'my_location',
  'exclamationmark.triangle.fill': 'warning',
  'list.bullet.rectangle': 'view_list',
  'mappin.and.ellipse': 'place',
  'headset': 'headset_mic',
  'gearshape': 'settings',
  'lock.shield': 'security',
  'clock.fill': 'schedule',
  'exclamationmark.circle.fill': 'error',
};

type SymbolViewProps = React.ComponentProps<typeof ExpoSymbolView>;

export function SymbolView({ name, ...props }: Omit<SymbolViewProps, 'name'> & { name: string | SymbolViewProps['name'] }) {
  let mappedName: any = name;

  if (typeof name === 'string') {
    // Attempt mapping, fallback to converting dots to underscores and stripping .fill suffix
    const androidName = ICON_MAPPING[name] || name.replace(/\./g, '_').replace(/\.fill/g, '').replace(/_fill/g, '');
    mappedName = {
      ios: name,
      android: androidName,
      web: androidName,
    };
  }

  return <ExpoSymbolView name={mappedName} {...props} />;
}
