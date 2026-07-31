'use client';

export const dynamic = 'force-dynamic';

import { useWidgetSDK, useTheme } from '@nitrostack/widgets';
import { useState } from 'react';
import { ShieldAlert, ShieldCheck, ChevronDown, ChevronUp, Wrench } from 'lucide-react';

/* ── Types ───────────────────────────────────────────────────────── */
interface AttackPath {
    ruleId: string;
    severity: 'critical' | 'high' | 'medium';
    viaTools: string[];
    message: string;
}
interface AttackPathData {
    agentId: string;
    paths: AttackPath[];
    riskScore: number;
}

/* ── Severity config ─────────────────────────────────────────────── */
const SEV = {
    critical: {
        label: 'CRITICAL', icon: '🔴',
        bg: 'rgba(239,68,68,0.10)', border: '#ef4444', text: '#ef4444',
        barColor: '#ef4444',
    },
    high: {
        label: 'HIGH', icon: '🟠',
        bg: 'rgba(245,158,11,0.10)', border: '#f59e0b', text: '#f59e0b',
        barColor: '#f59e0b',
    },
    medium: {
        label: 'MEDIUM', icon: '🟡',
        bg: 'rgba(234,179,8,0.10)', border: '#eab308', text: '#eab308',
        barColor: '#eab308',
    },
} as const;

const TOOL_EMOJI: Record<string, string> = {
    gmail: '📧', dropbox: '📦', postgres: '🗄️', slack: '💬', filesystem: '🗂️', calendar: '📅',
};

export default function AttackPathAlertWidget() {
    const theme = useTheme();
    const isDark = theme === 'dark';
    const { getToolOutput, callTool, isReady } = useWidgetSDK();
    const data = getToolOutput<AttackPathData>();

    const [expanded, setExpanded] = useState<string | null>(null);
    const [applying, setApplying] = useState<string | null>(null);
    const [fixed, setFixed] = useState<string[]>([]);

    const bg      = isDark ? '#0b0f19' : '#f8fafc';
    const surface = isDark ? '#111827' : '#ffffff';
    const border  = isDark ? '#1f2937' : '#e2e8f0';
    const muted   = isDark ? '#6b7280' : '#94a3b8';
    const text    = isDark ? '#f1f5f9' : '#0f172a';
    const sub     = isDark ? '#9ca3af' : '#64748b';

    const applyFix = async (ruleId: string) => {
        if (!data) return;
        setApplying(ruleId);
        try {
            await callTool('apply_policy_fix', { agentId: data.agentId, ruleId });
            setFixed(prev => [...prev, ruleId]);
        } finally {
            setApplying(null);
        }
    };

    if (!isReady || !data) {
        return (
            <div style={{ padding: 40, textAlign: 'center', color: muted, background: bg, minHeight: 200 }}>
                <ShieldAlert size={36} style={{ marginBottom: 10, opacity: 0.4 }} />
                <p style={{ margin: 0, fontSize: 13 }}>Loading attack path analysis…</p>
            </div>
        );
    }

    const riskPct     = Math.round(data.riskScore * 100);
    const activePaths = data.paths.filter(p => !fixed.includes(p.ruleId));
    const allClear    = activePaths.length === 0;

    return (
        <div style={{ background: bg, fontFamily: 'Inter, system-ui, sans-serif', color: text, minWidth: 300 }}>

            {/* ── Header bar ──────────────────────────────────────── */}
            <div style={{
                background: allClear
                    ? (isDark ? 'rgba(16,185,129,0.10)' : 'rgba(16,185,129,0.07)')
                    : (isDark ? 'rgba(239,68,68,0.10)' : 'rgba(239,68,68,0.07)'),
                borderBottom: `1px solid ${allClear ? '#10b981' : '#ef4444'}`,
                padding: '14px 20px',
                display: 'flex', alignItems: 'center', gap: 12,
            }}>
                {allClear
                    ? <ShieldCheck size={28} style={{ color: '#10b981', flexShrink: 0 }} />
                    : <ShieldAlert  size={28} style={{ color: '#ef4444', flexShrink: 0 }} />
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: allClear ? '#10b981' : '#ef4444' }}>
                        {allClear ? 'No Active Threats' : `${activePaths.length} Attack Path${activePaths.length > 1 ? 's' : ''} Detected`}
                    </h2>
                    <p style={{ margin: '1px 0 0', fontSize: 12, color: sub }}>
                        Agent: <strong>{data.agentId}</strong>
                    </p>
                </div>

                {/* Risk score pill */}
                <div style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    background: riskPct === 0 ? 'rgba(16,185,129,0.15)' : riskPct < 60 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                    border: `1.5px solid ${riskPct === 0 ? '#10b981' : riskPct < 60 ? '#f59e0b' : '#ef4444'}`,
                    textAlign: 'center',
                    flexShrink: 0,
                }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: riskPct === 0 ? '#10b981' : riskPct < 60 ? '#f59e0b' : '#ef4444', lineHeight: 1 }}>
                        {riskPct}
                    </div>
                    <div style={{ fontSize: 9, color: muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>risk</div>
                </div>
            </div>

            {/* ── Risk progress bar ────────────────────────────────── */}
            <div style={{ height: 4, background: isDark ? '#1f2937' : '#e2e8f0' }}>
                <div style={{
                    height: '100%',
                    width: `${riskPct}%`,
                    background: riskPct === 0 ? '#10b981' : riskPct < 60 ? '#f59e0b' : '#ef4444',
                    transition: 'width 0.6s ease',
                }} />
            </div>

            {/* ── All-clear state ─────────────────────────────────── */}
            {allClear && (
                <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: 14, color: '#10b981', fontWeight: 600 }}>
                        ✅ This agent's capability set has no toxic combinations.
                    </p>
                    {fixed.length > 0 && (
                        <p style={{ margin: '8px 0 0', fontSize: 12, color: muted }}>
                            {fixed.length} path{fixed.length > 1 ? 's' : ''} remediated this session.
                        </p>
                    )}
                </div>
            )}

            {/* ── Attack path cards ───────────────────────────────── */}
            {!allClear && (
                <div style={{ padding: '16px 16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {data.paths.map(path => {
                        const isFixed = fixed.includes(path.ruleId);
                        const sev = SEV[path.severity] ?? SEV.medium;
                        const isOpen = expanded === path.ruleId;

                        return (
                            <div key={path.ruleId} style={{
                                borderRadius: 14,
                                border: `1.5px solid ${isFixed ? border : sev.border}`,
                                background: isFixed ? surface : sev.bg,
                                overflow: 'hidden',
                                opacity: isFixed ? 0.5 : 1,
                                transition: 'all 0.3s',
                            }}>
                                {/* Card header — always visible */}
                                <div
                                    onClick={() => !isFixed && setExpanded(isOpen ? null : path.ruleId)}
                                    style={{
                                        padding: '12px 16px',
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        cursor: isFixed ? 'default' : 'pointer',
                                    }}
                                >
                                    {/* Severity badge */}
                                    <span style={{
                                        fontSize: 10, fontWeight: 700, padding: '3px 8px',
                                        borderRadius: 20, flexShrink: 0,
                                        background: 'transparent',
                                        border: `1.5px solid ${sev.border}`, color: sev.text,
                                    }}>
                                        {sev.icon} {sev.label}
                                    </span>

                                    {/* Rule ID */}
                                    <code style={{ flex: 1, fontSize: 13, fontWeight: 700, color: isFixed ? muted : sev.text }}>
                                        {path.ruleId}
                                    </code>

                                    {isFixed
                                        ? <span style={{ fontSize: 12, fontWeight: 600, color: '#10b981' }}>✓ Fixed</span>
                                        : isOpen
                                            ? <ChevronUp size={16} style={{ color: muted }} />
                                            : <ChevronDown size={16} style={{ color: muted }} />
                                    }
                                </div>

                                {/* Expanded detail */}
                                {isOpen && !isFixed && (
                                    <div style={{
                                        borderTop: `1px solid ${sev.border}`,
                                        padding: '14px 16px',
                                        display: 'flex', flexDirection: 'column', gap: 12,
                                    }}>
                                        {/* Message */}
                                        <p style={{ margin: 0, fontSize: 13, color: text, lineHeight: 1.6 }}>
                                            {path.message}
                                        </p>

                                        {/* Via tools */}
                                        <div>
                                            <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: muted }}>
                                                Tools involved
                                            </p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                {path.viaTools.map(t => (
                                                    <span key={t} style={{
                                                        padding: '4px 10px', borderRadius: 20,
                                                        background: isDark ? '#1f2937' : '#f1f5f9',
                                                        border: `1px solid ${border}`,
                                                        fontSize: 12, fontWeight: 600, color: text,
                                                    }}>
                                                        {TOOL_EMOJI[t] ?? '🔌'} {t}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Apply Fix button */}
                                        <button
                                            onClick={() => applyFix(path.ruleId)}
                                            disabled={applying === path.ruleId}
                                            style={{
                                                padding: '10px 18px',
                                                background: applying === path.ruleId ? muted : sev.text,
                                                color: '#fff', border: 'none',
                                                borderRadius: 10, fontWeight: 700,
                                                fontSize: 13, cursor: applying === path.ruleId ? 'not-allowed' : 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                transition: 'background 0.2s',
                                                width: '100%',
                                            }}
                                        >
                                            <Wrench size={15} />
                                            {applying === path.ruleId ? 'Applying fix…' : 'Disconnect risky tool & fix path'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Footer ──────────────────────────────────────────── */}
            <div style={{
                borderTop: `1px solid ${border}`,
                padding: '10px 20px',
                fontSize: 11, color: muted, textAlign: 'center',
            }}>
                Detection is deterministic · 0 LLM tokens spent · Powered by Aegis
            </div>
        </div>
    );
}
