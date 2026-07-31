'use client';

export const dynamic = 'force-dynamic';

import { useTheme } from '@nitrostack/widgets';
import { Shield, GitBranch, AlertTriangle, ShieldCheck, Zap, BookOpen } from 'lucide-react';

const TOOLS = [
    {
        icon: '🔌',
        name: 'connect_tool',
        description: 'Attach gmail, dropbox, postgres, slack, filesystem, or calendar to an agent.',
        example: 'connect_tool support-agent dropbox',
    },
    {
        icon: '🗺️',
        name: 'get_capability_graph',
        description: 'Visualise the full agent → tool → capability graph. Dangerous edges highlighted.',
        example: 'get capability graph for support-agent',
    },
    {
        icon: '🚨',
        name: 'detect_attack_paths',
        description: 'Run the deterministic toxic-combination detector. Zero LLM tokens spent.',
        example: 'detect attack paths for support-agent',
    },
    {
        icon: '🔧',
        name: 'apply_policy_fix',
        description: 'Disconnect the tool supplying the risky sink capability and clear the rule.',
        example: 'apply policy fix for exfiltration on support-agent',
    },
];

const POLICIES = [
    { id: 'exfiltration', src: 'READ_PRIVATE_DATA', sink: 'SEND_EXTERNAL',  sev: 'critical', color: '#ef4444' },
    { id: 'public-leak',  src: 'READ_PRIVATE_DATA', sink: 'WRITE_PUBLIC',   sev: 'high',     color: '#f59e0b' },
    { id: 'destructive',  src: 'DELETE_DATA',        sink: 'EXECUTE',        sev: 'high',     color: '#f59e0b' },
];

export default function AegisDashboard() {
    const theme = useTheme();
    const isDark = theme === 'dark';

    const bg      = isDark ? '#0b0f19' : '#f8fafc';
    const surface = isDark ? '#111827' : '#ffffff';
    const border  = isDark ? '#1f2937' : '#e2e8f0';
    const muted   = isDark ? '#6b7280' : '#94a3b8';
    const text    = isDark ? '#f1f5f9' : '#0f172a';
    const sub     = isDark ? '#9ca3af' : '#64748b';

    return (
        <div style={{ background: bg, fontFamily: 'Inter, system-ui, sans-serif', color: text, minHeight: '100vh' }}>

            {/* ── Hero ────────────────────────────────────────────── */}
            <div style={{
                background: isDark
                    ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
                    : 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
                borderBottom: `1px solid ${border}`,
                padding: '36px 24px 32px',
                textAlign: 'center',
            }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 72, height: 72, borderRadius: 20,
                    background: 'rgba(59,130,246,0.12)', border: '1.5px solid #3b82f6',
                    marginBottom: 18,
                }}>
                    <Shield size={40} style={{ color: '#3b82f6' }} />
                </div>
                <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800 }}>Aegis</h1>
                <p style={{ fontSize: 15, color: sub, maxWidth: 480, margin: '0 auto' }}>
                    Blast-radius auditor for AI agents. Connects tools, detects toxic capability combinations,
                    and remediates attack paths — all in pure TypeScript, zero LLM tokens.
                </p>
            </div>

            <div style={{ padding: '24px 20px', maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>

                {/* ── Engines status ───────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                    {[
                        { label: 'Capability Registry', detail: '6 tools registered', icon: <Zap size={14} /> },
                        { label: 'Attack Detector',     detail: 'Pure TS · 0 tokens',  icon: <AlertTriangle size={14} /> },
                        { label: 'Policy Engine',       detail: '3 toxic rules active', icon: <ShieldCheck size={14} /> },
                        { label: 'Groq Explainer',      detail: 'On-demand cache',      icon: <BookOpen size={14} /> },
                    ].map(e => (
                        <div key={e.label} style={{
                            background: surface, border: `1px solid ${border}`,
                            borderRadius: 12, padding: '12px 14px',
                            display: 'flex', alignItems: 'center', gap: 10,
                        }}>
                            <div style={{
                                width: 8, height: 8, borderRadius: '50%',
                                background: '#10b981', boxShadow: '0 0 8px #10b98180', flexShrink: 0,
                            }} />
                            <div style={{ color: e.label === 'Groq Explainer' ? '#3b82f6' : '#e.icon' }}>
                                {e.icon}
                            </div>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: text }}>{e.label}</div>
                                <div style={{ fontSize: 11, color: muted }}>{e.detail}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Policy Rules ─────────────────────────────────── */}
                <div>
                    <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: muted }}>
                        Active Policy Rules
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {POLICIES.map(p => (
                            <div key={p.id} style={{
                                background: surface, border: `1px solid ${border}`,
                                borderRadius: 10, padding: '10px 14px',
                                display: 'flex', alignItems: 'center', gap: 12,
                            }}>
                                <GitBranch size={15} style={{ color: p.color, flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: text }}>{p.id}</span>
                                    <span style={{ fontSize: 12, color: sub, marginLeft: 8 }}>
                                        {p.src} → {p.sink}
                                    </span>
                                </div>
                                <span style={{
                                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                                    border: `1px solid ${p.color}`, color: p.color,
                                    textTransform: 'uppercase',
                                }}>
                                    {p.sev}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Available Tools ───────────────────────────────── */}
                <div>
                    <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: muted }}>
                        MCP Tools
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {TOOLS.map(t => (
                            <div key={t.name} style={{
                                background: surface, border: `1px solid ${border}`,
                                borderRadius: 10, padding: '12px 14px',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <span style={{ fontSize: 16 }}>{t.icon}</span>
                                    <code style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6' }}>{t.name}</code>
                                </div>
                                <p style={{ margin: '0 0 6px', fontSize: 13, color: sub, lineHeight: 1.5 }}>{t.description}</p>
                                <p style={{ margin: 0, fontSize: 11, color: muted }}>
                                    Try: <em>"{t.example}"</em>
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
