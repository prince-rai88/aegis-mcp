'use client';

import { useTheme, useWidgetState, useMaxHeight, useWidgetSDK } from '@nitrostack/widgets';

// Disable static generation - this is a dynamic widget
export const dynamic = 'force-dynamic';
import { CapabilityCard } from '../../components/CapabilityCard';
import { SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

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
    filters: any;
    totalShops: number;
}

export default function AegisListWidget() {
    const theme = useTheme();
    const maxHeight = useMaxHeight();
    const isDark = theme === 'dark';

    const { isReady, getToolOutput, callTool } = useWidgetSDK();
    const data = getToolOutput<WidgetData>();

    console.log('🛡️ AegisListWidget render:', { isReady, hasData: !!data, data });

    // Persistent state for bookmarks and sorting
    const [state, setState] = useWidgetState<{
        viewMode: 'grid' | 'list';
        favorites: string[];
        sortBy: 'rating' | 'name' | 'price';
    }>(() => ({
        viewMode: 'grid',
        favorites: [],
        sortBy: 'rating',
    }));

    const [showFilters, setShowFilters] = useState(false);

    if (!data) {
        return (
            <div style={{
                padding: '40px',
                textAlign: 'center',
                color: isDark ? '#fff' : '#000',
            }}>
                Loading capability inventory... {isReady ? '(SDK ready but no data)' : '(waiting for SDK)'}
            </div>
        );
    }

    if (!data.shops || !Array.isArray(data.shops)) {
        console.error('❌ Invalid data structure:', data);
        return (
            <div style={{
                padding: '40px',
                textAlign: 'center',
                color: isDark ? '#fff' : '#000',
            }}>
                Error: Invalid data structure. Expected shops array.
                <pre style={{ marginTop: '16px', fontSize: '12px', textAlign: 'left' }}>
                    {JSON.stringify(data, null, 2)}
                </pre>
            </div>
        );
    }

    const toggleFavorite = (nodeId: string) => {
        const favorites = state?.favorites || [];
        const newFavorites = favorites.includes(nodeId)
            ? favorites.filter(id => id !== nodeId)
            : [...favorites, nodeId];

        setState({ ...state, favorites: newFavorites });
    };

    const handleNodeClick = async (nodeId: string) => {
        // Call the show_capability_details tool to show detailed node info
        await callTool('show_capability_details', { shopId: nodeId });
    };

    // Sort nodes
    let sortedNodes = [...data.shops];
    switch (state?.sortBy) {
        case 'rating':
            sortedNodes.sort((a, b) => b.rating - a.rating); // Higher safety first
            break;
        case 'name':
            sortedNodes.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'price':
            sortedNodes.sort((a, b) => b.priceLevel - a.priceLevel); // Higher threat level first
            break;
    }

    return (
        <div style={{
            background: isDark ? '#0b0f19' : '#f9fafb',
            minHeight: '400px',
            maxHeight: maxHeight || '600px',
            overflow: 'auto',
        }}>
            {/* Header */}
            <div style={{
                background: isDark ? '#111827' : '#ffffff',
                borderBottom: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`,
                padding: '12px 16px',
                position: 'sticky',
                top: 0,
                zIndex: 10,
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                        <h1 style={{
                            margin: '0 0 2px 0',
                            fontSize: '18px',
                            fontWeight: '700',
                            color: isDark ? '#fff' : '#111827',
                        }}>
                            🛡️ Capability Inventory
                        </h1>
                        <p style={{
                            margin: 0,
                            fontSize: '12px',
                            color: isDark ? '#9ca3af' : '#6b7280',
                        }}>
                            {data.totalShops} registered security nodes monitored
                        </p>
                    </div>

                    {/* Sort and Filter Controls */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select
                            value={state?.sortBy || 'rating'}
                            onChange={(e) => setState({ ...state, sortBy: e.target.value as any })}
                            style={{
                                padding: '6px 10px',
                                background: isDark ? '#1f2937' : '#fff',
                                border: `1px solid ${isDark ? '#374151' : '#d1d5db'}`,
                                borderRadius: '6px',
                                color: isDark ? '#fff' : '#111827',
                                fontSize: '12px',
                                cursor: 'pointer',
                                outline: 'none',
                            }}
                        >
                            <option value="rating">🛡️ Safety Score</option>
                            <option value="name">🔤 Node Name</option>
                            <option value="price">⚠️ Threat Level</option>
                        </select>

                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            style={{
                                padding: '8px 12px',
                                background: showFilters
                                    ? (isDark ? '#374151' : '#f3f4f6')
                                    : 'transparent',
                                border: `1px solid ${isDark ? '#374151' : '#d1d5db'}`,
                                borderRadius: '8px',
                                cursor: 'pointer',
                                color: isDark ? '#fff' : '#111827',
                            }}
                        >
                            <SlidersHorizontal size={18} />
                        </button>
                    </div>
                </div>

                {/* Filter section placeholder */}
                {showFilters && (
                    <div style={{
                        padding: '16px',
                        background: isDark ? '#1f2937' : '#f9fafb',
                        borderRadius: '8px',
                        border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                        marginTop: '12px',
                    }}>
                        <p style={{
                            margin: '0 0 4px 0',
                            fontSize: '12px',
                            color: isDark ? '#9ca3af' : '#6b7280',
                        }}>
                            Security scanning filter bounds: Active verification checks compile successfully.
                        </p>
                    </div>
                )}

                {/* Monitored watchlist count */}
                {state?.favorites && state.favorites.length > 0 && (
                    <div style={{
                        marginTop: '12px',
                        padding: '8px 12px',
                        background: isDark ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff',
                        border: `1px solid ${isDark ? '#2563eb' : '#bfdbfe'}`,
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: isDark ? '#60a5fa' : '#1d4ed8',
                        fontWeight: '600',
                    }}>
                        ⭐️ Watchlist: Monitoring {state.favorites.length} vital node{state.favorites.length !== 1 ? 's' : ''} closely
                    </div>
                )}
            </div>

            {/* Horizontal Scrolling Cards */}
            <div style={{
                padding: '16px',
                overflowX: 'auto',
                overflowY: 'hidden',
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'thin',
            }}>
                <div style={{
                    display: 'flex',
                    gap: '16px',
                    paddingBottom: '8px',
                }}>
                    {sortedNodes.map(node => (
                        <div
                            key={node.id}
                            style={{
                                minWidth: '300px',
                                maxWidth: '300px',
                                scrollSnapAlign: 'start',
                                flexShrink: 0,
                            }}
                        >
                            <CapabilityCard
                                shop={node}
                                isFavorite={state?.favorites?.includes(node.id)}
                                onToggleFavorite={toggleFavorite}
                                onSelect={() => handleNodeClick(node.id)}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div style={{
                padding: '20px',
                textAlign: 'center',
                fontSize: '12px',
                color: isDark ? '#4b5563' : '#9ca3af',
                borderTop: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`,
            }}>
                Powered by Aegis Shield • Theme: {theme || 'light'} • Swipe horizontally →
            </div>
        </div>
    );
}
