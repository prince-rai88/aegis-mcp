'use client';

import { useTheme, useWidgetState, useMaxHeight, useWidgetSDK } from '@nitrostack/widgets';

// Disable static generation - this is a dynamic widget
export const dynamic = 'force-dynamic';
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { CompactCapabilityCard } from '../../components/CompactCapabilityCard';
import { Maximize2 } from 'lucide-react';

interface AegisNode {
    id: string;
    name: string;
    description: string;
    address: string;
    coords: [number, number];
    rating: number;
    reviews: number;
    priceLevel: 1 | 2 | 3;
    cuisine: string[];
    hours: { open: string; close: string };
    phone: string;
    website?: string;
    image: string;
    specialties: string[];
    openNow: boolean;
}

interface WidgetData {
    shops: AegisNode[]; // Maps to backend 'shops' output structure
    filter: string;
    totalShops: number;
}

export default function AegisMapWidget() {
    const theme = useTheme();
    const maxHeight = useMaxHeight();
    const isDark = theme === 'dark';
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const [selectedNode, setSelectedNode] = useState<AegisNode | null>(null);

    const { isReady, getToolOutput, callTool, requestFullscreen } = useWidgetSDK();

    // Access tool output
    const data = getToolOutput<WidgetData>();

    useEffect(() => {
        if (!mapContainer.current || !data || map.current) return;

        const initMap = async () => {
            try {
                mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

                const mapInstance = new mapboxgl.Map({
                    container: mapContainer.current!,
                    style: isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/streets-v14',
                    center: data.shops[0]?.coords || [-122.4194, 37.7749],
                    zoom: 12,
                });

                // Add markers
                data.shops.forEach(node => {
                    const el = document.createElement('div');
                    el.className = 'marker';
                    el.style.backgroundImage = 'url(https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png)';
                    el.style.width = '30px';
                    el.style.height = '40px';
                    el.style.backgroundSize = '100%';
                    el.style.cursor = 'pointer';

                    el.addEventListener('click', () => {
                        setSelectedNode(node);
                    });

                    new mapboxgl.Marker(el)
                        .setLngLat(node.coords)
                        .addTo(mapInstance);
                });

                if (data.shops.length > 1) {
                    const bounds = new mapboxgl.LngLatBounds();
                    data.shops.forEach(node => bounds.extend(node.coords));
                    mapInstance.fitBounds(bounds, { padding: 50 });
                }

                map.current = mapInstance;
            } catch (error) {
                console.error('Failed to load Mapbox:', error);
            }
        };

        initMap();

        return () => {
            if (map.current) {
                map.current.remove();
            }
        };
    }, [data, isDark]);

    if (!data) {
        return (
            <div style={{
                padding: '40px',
                textAlign: 'center',
                color: isDark ? '#fff' : '#000',
            }}>
                Loading security graph... {isReady ? '(SDK ready but no data)' : '(waiting for SDK)'}
            </div>
        );
    }

    const handleNodeClick = async (nodeId: string) => {
        // Call the show_capability_details tool to show node details
        await callTool('show_capability_details', { shopId: nodeId });
    };

    return (
        <div style={{
            position: 'relative',
            height: maxHeight || '650px',
            background: isDark ? '#0b0f19' : '#f9fafb',
            overflow: 'hidden',
        }}>
            {/* Map Container - Full Screen */}
            <div
                ref={mapContainer}
                style={{
                    position: 'absolute',
                    inset: 0,
                }}
            />

            {/* Enlarge Button */}
            <button
                onClick={requestFullscreen}
                style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    padding: '10px',
                    background: isDark ? '#1f2937' : '#ffffff',
                    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Maximize2 size={18} style={{ color: isDark ? '#fff' : '#111' }} />
            </button>

            {/* Overlay Node Cards - Bottom */}
            <div style={{
                position: 'absolute',
                bottom: '12px',
                left: '16px',
                right: '16px',
                zIndex: 5,
                overflowX: 'auto',
                overflowY: 'hidden',
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
            }}>
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    paddingBottom: '8px',
                }}>
                    {data.shops.map(node => (
                        <div
                            key={node.id}
                            style={{
                                scrollSnapAlign: 'start',
                                flexShrink: 0,
                            }}
                        >
                            <CompactCapabilityCard
                                shop={node}
                                isSelected={selectedNode?.id === node.id}
                                onClick={() => {
                                    setSelectedNode(node);
                                    handleNodeClick(node.id);
                                }}
                                isDark={isDark}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
