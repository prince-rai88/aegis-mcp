'use client';

import React from 'react';
import { useTheme } from '@nitrostack/widgets';
import { Shield, Map, List, Cpu, ShieldCheck, Activity } from 'lucide-react';

export default function AegisDashboard() {
    const theme = useTheme();
    const isDark = theme === 'dark';

    const navigateTo = (path: string) => {
        window.location.href = path;
    };

    return (
        <div style={{
            background: isDark ? '#0b0f19' : '#f9fafb',
            color: isDark ? '#f3f4f6' : '#1f2937',
            fontFamily: 'Inter, system-ui, sans-serif',
            minHeight: '100vh',
            padding: '40px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <div style={{
                maxWidth: '600px',
                width: '100%',
                background: isDark ? '#111827' : '#ffffff',
                border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`,
                borderRadius: '24px',
                padding: '40px 32px',
                boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.05)',
                textAlign: 'center',
            }}>
                {/* Logo / Shield */}
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '64px',
                    height: '64px',
                    background: isDark ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff',
                    border: `1px solid ${isDark ? '#2563eb' : '#bfdbfe'}`,
                    borderRadius: '20px',
                    color: '#3b82f6',
                    marginBottom: '24px',
                }}>
                    <Shield size={36} />
                </div>

                {/* Heading */}
                <h1 style={{
                    fontSize: '28px',
                    fontWeight: '800',
                    margin: '0 0 8px 0',
                    color: isDark ? '#fff' : '#111827',
                }}>
                    🛡️ Aegis Security Center
                </h1>
                <p style={{
                    fontSize: '15px',
                    color: isDark ? '#9ca3af' : '#6b7280',
                    margin: '0 0 32px 0',
                    lineHeight: '1.5',
                }}>
                    AI Agent Security Platform & MCP Capability Guardrails. Monitor capability escalation paths, assess threat vectors, and apply policies.
                </p>

                {/* Subsystem Health Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px',
                    marginBottom: '32px',
                    textAlign: 'left',
                }}>
                    {[
                        { name: 'Capability Engine', desc: 'Active' },
                        { name: 'Graph Engine', desc: 'Active' },
                        { name: 'Risk Assessment', desc: 'Secure' },
                        { name: 'Policy Guards', desc: 'Enforced' },
                    ].map((engine) => (
                        <div
                            key={engine.name}
                            style={{
                                padding: '12px 14px',
                                background: isDark ? '#1f2937' : '#f3f4f6',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                            }}
                        >
                            <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: '#10b981',
                                boxShadow: '0 0 8px #10b981',
                            }} />
                            <div>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: isDark ? '#e5e7eb' : '#374151' }}>
                                    {engine.name}
                                </div>
                                <div style={{ fontSize: '11px', color: isDark ? '#9ca3af' : '#6b7280' }}>
                                    {engine.desc}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Actions / Navigation */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                }}>
                    <button
                        onClick={() => navigateTo('/aegis-map')}
                        style={{
                            padding: '14px 20px',
                            background: '#3b82f6',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: '600',
                            fontSize: '14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#2563eb';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#3b82f6';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                        }}
                    >
                        <Map size={18} />
                        Open Security Graph Map
                    </button>

                    <button
                        onClick={() => navigateTo('/aegis-list')}
                        style={{
                            padding: '14px 20px',
                            background: isDark ? '#1f2937' : '#ffffff',
                            color: isDark ? '#ffffff' : '#111827',
                            border: `1px solid ${isDark ? '#374151' : '#d1d5db'}`,
                            borderRadius: '12px',
                            fontWeight: '600',
                            fontSize: '14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = isDark ? '#374151' : '#f9fafb';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = isDark ? '#1f2937' : '#ffffff';
                        }}
                    >
                        <List size={18} />
                        Browse Capability Inventory
                    </button>
                </div>
            </div>
        </div>
    );
}
