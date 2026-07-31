'use client';

import { useTheme, useMaxHeight, useWidgetSDK } from '@nitrostack/widgets';

// Disable static generation - this is a dynamic widget
export const dynamic = 'force-dynamic';
import { Star, MapPin, Globe, Clock, ShieldAlert, Cpu, Heart, ExternalLink } from 'lucide-react';

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
    shop: AegisNode; // Maps to backend 'shop' output structure
    relatedShops: AegisNode[]; // Maps to backend 'relatedShops' output structure
}

export default function AegisDetailWidget() {
    const theme = useTheme();
    const maxHeight = useMaxHeight();
    const isDark = theme === 'dark';
    const { isReady, getToolOutput, openExternal } = useWidgetSDK();

    const data = getToolOutput<WidgetData>();

    if (!data) {
        return (
            <div style={{
                padding: '40px',
                textAlign: 'center',
                color: isDark ? '#fff' : '#000',
            }}>
                Loading node details... {isReady ? '(SDK ready but no data)' : '(waiting for SDK)'}
            </div>
        );
    }

    const { shop, relatedShops } = data;

    // Threat Level definitions
    const threatConfig = {
        1: { label: 'Low Threat Level', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
        2: { label: 'Medium Threat Level', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
        3: { label: 'High Threat Level', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
    }[shop.priceLevel] || { label: 'Assessment Pending', color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.15)' };

    const openSandboxSimulator = () => {
        const url = `https://aegis.security/sandbox/simulate?node=${encodeURIComponent(shop.id)}`;
        openExternal(url);
    };

    const triggerAlertEndpoint = () => {
        openExternal(`https://aegis.security/alerts/channels/${shop.phone}`);
    };

    const visitDocumentation = () => {
        if (shop.website) {
            openExternal(shop.website);
        }
    };

    return (
        <div style={{
            background: isDark ? '#0b0f19' : '#f9fafb',
            minHeight: '500px',
            maxHeight: maxHeight || '800px',
            overflow: 'auto',
        }}>
            {/* Hero Image */}
            <div style={{ position: 'relative', height: '240px', overflow: 'hidden' }}>
                <img
                    src={shop.image}
                    alt={shop.name}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                    }}
                />
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(11, 15, 25, 0.9) 0%, rgba(11, 15, 25, 0.3) 60%, transparent 100%)',
                }} />

                {/* Overlay Text */}
                <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '20px',
                    right: '20px',
                }}>
                    <h1 style={{
                        margin: '0 0 6px 0',
                        fontSize: '26px',
                        fontWeight: '800',
                        color: '#fff',
                        textShadow: '0 2px 4px rgba(0,0,0,0.6)',
                    }}>
                        {shop.name}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Star size={18} fill="#fbbf24" stroke="#fbbf24" />
                            <span style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>
                                {shop.rating}
                            </span>
                            <span style={{ fontSize: '13px', color: '#cbd5e1' }}>
                                ({shop.reviews} verified audits)
                            </span>
                        </div>
                        <span style={{
                            backgroundColor: threatConfig.bg,
                            border: `1px solid ${threatConfig.color}`,
                            color: threatConfig.color,
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                        }}>
                            {threatConfig.label}
                        </span>
                        {shop.openNow ? (
                            <span style={{
                                background: '#10b981',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontSize: '11px',
                                fontWeight: '705',
                            }}>
                                Connected
                            </span>
                        ) : (
                            <span style={{
                                background: '#6b7280',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontSize: '11px',
                                fontWeight: '705',
                            }}>
                                Offline
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Body */}
            <div style={{ padding: '20px' }}>
                {/* Description */}
                <p style={{
                    margin: '0 0 20px 0',
                    fontSize: '15px',
                    lineHeight: '1.6',
                    color: isDark ? '#d1d5db' : '#4b5563',
                }}>
                    {shop.description}
                </p>

                {/* Category Tags */}
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{
                        margin: '0 0 10px 0',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: isDark ? '#9ca3af' : '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.8px',
                    }}>
                        Infrastructure Tags
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {shop.cuisine.map(c => (
                            <span
                                key={c}
                                style={{
                                    background: isDark ? '#1f2937' : '#f3f4f6',
                                    color: isDark ? '#f3f4f6' : '#1f2937',
                                    padding: '6px 12px',
                                    borderRadius: '16px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                                }}
                            >
                                {c}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Security Measures / Specialties */}
                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{
                        margin: '0 0 10px 0',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: isDark ? '#9ca3af' : '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.8px',
                    }}>
                        Security Assertions & Controls
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {shop.specialties.map(s => (
                            <span
                                key={s}
                                style={{
                                    background: isDark ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff',
                                    color: isDark ? '#93c5fd' : '#2563eb',
                                    padding: '6px 12px',
                                    borderRadius: '16px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    border: `1px solid ${isDark ? '#2563eb' : '#bfdbfe'}`,
                                }}
                            >
                                🛡️ {s}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Security Metrics info card */}
                <div style={{
                    background: isDark ? '#111827' : '#fff',
                    border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`,
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '24px',
                }}>
                    <h3 style={{
                        margin: '0 0 14px 0',
                        fontSize: '16px',
                        fontWeight: '700',
                        color: isDark ? '#fff' : '#111827',
                    }}>
                        Node Credentials & Environment
                    </h3>

                    {/* Address endpoint */}
                    <div style={{ display: 'flex', alignItems: 'start', gap: '10px', marginBottom: '12px' }}>
                        <Cpu size={18} style={{ color: isDark ? '#9ca3af' : '#6b7280', marginTop: '2px', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                            <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: isDark ? '#e5e7eb' : '#374151', fontFamily: 'monospace' }}>
                                {shop.address}
                            </p>
                            <button
                                onClick={openSandboxSimulator}
                                style={{
                                    padding: '5px 10px',
                                    background: isDark ? '#1f2937' : '#f3f4f6',
                                    border: `1px solid ${isDark ? '#374151' : '#d1d5db'}`,
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    color: isDark ? '#fff' : '#111827',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                }}
                            >
                                <ExternalLink size={12} />
                                Simulate Sandbox Node
                            </button>
                        </div>
                    </div>

                    {/* Alert Webhook Routing */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <ShieldAlert size={18} style={{ color: isDark ? '#9ca3af' : '#6b7280', flexShrink: 0 }} />
                        <button
                            onClick={triggerAlertEndpoint}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '13px',
                                color: isDark ? '#60a5fa' : '#2563eb',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                textAlign: 'left',
                                fontFamily: 'monospace',
                            }}
                        >
                            {shop.phone}
                        </button>
                    </div>

                    {/* Documentation website */}
                    {shop.website && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <Globe size={18} style={{ color: isDark ? '#9ca3af' : '#6b7280', flexShrink: 0 }} />
                            <button
                                onClick={visitDocumentation}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '13px',
                                    color: isDark ? '#60a5fa' : '#2563eb',
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    textAlign: 'left',
                                }}
                            >
                                Docs & Security Specification
                            </button>
                        </div>
                    )}

                    {/* Active Scan Hours */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: isDark ? '#cbd5e1' : '#4b5563' }}>
                        <Clock size={18} style={{ color: isDark ? '#9ca3af' : '#6b7280', flexShrink: 0 }} />
                        <span>
                            Inspection Window Window: {shop.hours.open} - {shop.hours.close}
                        </span>
                    </div>
                </div>

                {/* Related Nodes Section */}
                {relatedShops.length > 0 && (
                    <div>
                        <h3 style={{
                            margin: '0 0 12px 0',
                            fontSize: '16px',
                            fontWeight: '700',
                            color: isDark ? '#fff' : '#111827',
                        }}>
                            Alternative / Similar Security Containers
                        </h3>
                        <div style={{ display: 'grid', gap: '10px' }}>
                            {relatedShops.map(related => (
                                <div
                                    key={related.id}
                                    style={{
                                        background: isDark ? '#111827' : '#fff',
                                        border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`,
                                        borderRadius: '12px',
                                        padding: '12px',
                                        display: 'flex',
                                        gap: '12px',
                                    }}
                                >
                                    <img
                                        src={related.image}
                                        alt={related.name}
                                        style={{
                                            width: '60px',
                                            height: '60px',
                                            borderRadius: '8px',
                                            objectFit: 'cover',
                                        }}
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h4 style={{
                                            margin: '0 0 2px 0',
                                            fontSize: '14px',
                                            fontWeight: '700',
                                            color: isDark ? '#fff' : '#111827',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {related.name}
                                        </h4>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                            <Star size={12} fill="#fbbf24" stroke="#fbbf24" />
                                            <span style={{ fontSize: '12px', color: isDark ? '#cbd5e1' : '#4b5563' }}>
                                                {related.rating} (Safety)
                                            </span>
                                        </div>
                                        <p style={{
                                            margin: 0,
                                            fontSize: '12px',
                                            color: isDark ? '#9ca3af' : '#6b7280',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {related.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
