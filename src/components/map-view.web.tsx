/**
 * Web implementation of the `react-native-maps` API subset used by the app,
 * backed by Leaflet + OpenStreetMap tiles (no API key required).
 *
 * Metro redirects `react-native-maps` imports to this file on web
 * (see metro.config.js). Leaflet touches `window` on import, so it is
 * loaded lazily inside an effect to stay compatible with static rendering.
 */
import React, { useEffect, useImperativeHandle, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import 'leaflet/dist/leaflet.css';

type LatLng = { latitude: number; longitude: number };
type Region = LatLng & { latitudeDelta: number; longitudeDelta: number };

type CircleProps = {
  center: LatLng;
  radius: number;
  strokeWidth?: number;
  strokeColor?: string;
  fillColor?: string;
};

type MapViewProps = {
  style?: any;
  initialRegion?: Region;
  region?: Region;
  onRegionChangeComplete?: (region: Region) => void;
  children?: React.ReactNode;
  [key: string]: any;
};

// Convert a latitudeDelta to an approximate Leaflet zoom level.
const deltaToZoom = (latitudeDelta: number) =>
  Math.max(1, Math.min(19, Math.round(Math.log2(360 / Math.max(latitudeDelta, 0.0001)))));

export function Circle(_props: CircleProps) {
  // Rendered imperatively by MapView.
  return null;
}
export const Marker = (_props: any) => null;
export const Polygon = (_props: any) => null;
export const Polyline = (_props: any) => null;
export const Callout = (_props: any) => null;
export const PROVIDER_DEFAULT = undefined;
export const PROVIDER_GOOGLE = 'google';

const MapView = React.forwardRef<any, MapViewProps>(
  ({ style, initialRegion, region, onRegionChangeComplete, children }, ref) => {
    const containerRef = useRef<any>(null);
    const mapRef = useRef<any>(null);
    const circleLayerRef = useRef<any>(null);
    const onChangeRef = useRef(onRegionChangeComplete);
    onChangeRef.current = onRegionChangeComplete;

    const circles: CircleProps[] = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === Circle) {
        circles.push(child.props as CircleProps);
      }
    });
    const circlesKey = JSON.stringify(circles);

    const getRegion = (): Region | null => {
      const map = mapRef.current;
      if (!map) return null;
      const center = map.getCenter();
      const bounds = map.getBounds();
      return {
        latitude: center.lat,
        longitude: center.lng,
        latitudeDelta: Math.abs(bounds.getNorth() - bounds.getSouth()),
        longitudeDelta: Math.abs(bounds.getEast() - bounds.getWest()),
      };
    };

    useImperativeHandle(ref, () => ({
      animateToRegion: (r: Region) => {
        mapRef.current?.flyTo([r.latitude, r.longitude], deltaToZoom(r.latitudeDelta));
      },
      animateCamera: ({ center, zoom }: { center?: LatLng; zoom?: number }) => {
        const map = mapRef.current;
        if (!map || !center) return;
        map.flyTo([center.latitude, center.longitude], zoom ?? map.getZoom());
      },
    }));

    // Create the map once.
    useEffect(() => {
      let cancelled = false;
      (async () => {
        const L = (await import('leaflet')).default;
        if (cancelled || !containerRef.current || mapRef.current) return;

        const start = region ?? initialRegion ?? {
          latitude: 13.7563,
          longitude: 100.5018,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };

        const map = L.map(containerRef.current as HTMLElement, {
          zoomControl: true,
          attributionControl: true,
        }).setView([start.latitude, start.longitude], deltaToZoom(start.latitudeDelta));

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        circleLayerRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;

        map.on('moveend', () => {
          const r = getRegion();
          if (r) onChangeRef.current?.(r);
        });

        // Ensure correct sizing when rendered inside an animated Modal.
        setTimeout(() => map.invalidateSize(), 300);

        // Fire once so the parent gets the initial center (same as native behaviour).
        const r = getRegion();
        if (r) onChangeRef.current?.(r);

        drawCircles(L);
      })();

      return () => {
        cancelled = true;
        mapRef.current?.remove();
        mapRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const drawCircles = (L: any) => {
      const layer = circleLayerRef.current;
      if (!layer) return;
      layer.clearLayers();
      circles.forEach((c) => {
        L.circle([c.center.latitude, c.center.longitude], {
          radius: c.radius,
          weight: c.strokeWidth ?? 2,
          color: c.strokeColor ?? '#3C87F7',
          fillColor: c.fillColor ?? 'rgba(60,135,247,0.1)',
          fillOpacity: 1,
          interactive: false,
        }).addTo(layer);
      });
    };

    // Redraw circles when they change.
    useEffect(() => {
      if (!mapRef.current) return;
      import('leaflet').then((m) => drawCircles(m.default));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [circlesKey]);

    // Follow a controlled `region` prop if provided.
    useEffect(() => {
      if (!region || !mapRef.current) return;
      mapRef.current.setView([region.latitude, region.longitude], deltaToZoom(region.latitudeDelta));
    }, [region?.latitude, region?.longitude, region?.latitudeDelta]);

    return (
      <View style={[styles.container, style]}>
        <View ref={containerRef} style={StyleSheet.absoluteFill} />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
});

export default MapView;
