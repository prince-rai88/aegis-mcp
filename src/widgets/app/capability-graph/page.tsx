'use client';

export const dynamic = 'force-dynamic';

import { useWidgetSDK, useTheme } from '@nitrostack/widgets';
import { useState } from 'react';
import { ShieldAlert, ShieldCheck, Zap, Database, Globe, Cpu } from 'lucide-react';

/* ── Types matching governance.tools.ts output ─────────────────── */
interface GraphNode {
    id: string;
    type: 'agent' | 'tool' | 'capability';
    label: string;
}
interface GraphEdge {
    id: string;
    source: string;
    target: string;
    danger: boolean;
}
interface AttackPath {
    ruleId: string;
    source: string;
    sink: string;
    viaTools: string[];
    severity: 'critical' | 'high' | 'medium';
    message: string;
}
interface CapabilityGraphData {
    agentId: string;
    nodes: GraphNode[];
    edges: GraphEdge[];
    attackPaths: AttackPath[];
    riskScore: number;
}

/* ── Severity colours ────────────────────────────────────────────── */
const SEV: Record<string, { bg: string; text: string; border: string; label: string }> = {
    critical: { bg: 'rgba(239,68,68,0.12)', text: '#ef4444', border: '#ef4444', label: 'CRITICAL' },
    high:     { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b', border: '#f59e0b', label: 'HIGH' },
    medium:   { bg: 'rgba(234,179,8,0.12)',  text: '#eab308', border: '#eab308', label: 'MEDIUM' },
};

/* ── Tool icon helper ────────────────────────────────────────────── */
const TOOL_EMOJI: Record<string, string> = {
    gmail: '📧', dropbox: '📦', postgres: '🗄️', slack: '💬', filesystem: '🗂️', calendar: '📅',
};

/* ── Capability icon ─────────────────────────────────────────────── */
function CapIcon({ cap }: { cap: string }) {
    if (cap.includes('SEND'))    return <Globe size={13} />;
    if (cap.includes('EXECUTE')) return <Zap size={13} />;
    if (cap.includes('DELETE'))  return <ShieldAlert size={13} />;
    if (cap.includes('READ'))    return <Database size={13} />;
    return <Cpu size={13} />;
}

export default function CapabilityGraphWidget() {
    const theme = useTheme();
    const isDark = theme === 'dark';
    const { getToolOutput, callTool, isReady } = useWidgetSDK();
    const data = getToolOutput<CapabilityGraphData>();

    const [applying, setApplying] = useState<string | null>(null);
    const [fixed, setFixed] = useState<string[]>([]);

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

    /* ── colours ─────────────────────────────────────────────────── */
    const bg      = isDark ? '#0b0f19' : '#f8fafc';
    const surface = isDark ? '#111827' : '#ffffff';
    const border  = isDark ? '#1f2937' : '#e2e8f0';
    const muted   = isDark ? '#6b7280' : '#94a3b8';
    const text    = isDark ? '#f1f5f9' : '#0f172a';
    const sub     = isDark ? '#9ca3af' : '#64748b';

    if (!isReady || !data) {
        return (
            <div style={{ padding: 40, textAlign: 'center', color: muted, background: bg, minHeight: 300 }}>
                <ShieldCheck size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                <p style={{ margin: 0 }}>Waiting for capability graph data…</p>
            </div>
        );
    }

    /* ── partition nodes by type ─────────────────────────────────── */
    const agentNodes  = data.nodes.filter(n => n.type === 'agent');
    const toolNodes   = data.nodes.filter(n => n.type === 'tool');
    const capNodes    = data.nodes.filter(n => n.type === 'capability');

    /* ── which capability nodes are dangerous? ───────────────────── */
    const dangerCapIds = new Set(
        data.edges.filter(e => e.danger).map(e => e.target)
    );
    /* ── which tool nodes touch a dangerous edge? ────────────────── */
    const dangerToolIds = new Set(
        data.edges.filter(e => e.danger).map(e => e.source)
    );

    const riskPct = Math.round(data.riskScore * 100);
    const riskColour = riskPct >= 80 ? '#ef4444' : riskPct >= 40 ? '#f59e0b' : '#10b981';

    const activeAttackPaths = data.attackPaths.filter(p => !fixed.includes(p.ruleId));

    return (
        <div style={{ background: bg, fontFamily: 'Inter, system-ui, sans-serif', color: text }}>

            {/* ── Header ─────────────────────────────────────────── */}
            <div style={{
                background: surface, borderBottom: `1px solid ${border}`,
                padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                        🛡️ Capability Graph
                    </h2>
                    <p style={{ margin: '2px 0 0', fontSize: 13, color: sub }}>
                        Agent: <code style={{ background: isDark ? '#1f2937' : '#f1f5f9', padding: '1px 6px', borderRadius: 4 }}>{data.agentId}</code>
                    </p>
                </div>

                {/* Risk Score Gauge */}
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: '50%',
                        border: `4px solid ${riskColour}`,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        background: isDark ? '#0b0f19' : '#f8fafc',
                        boxShadow: `0 0 16px ${riskColour}44`,
                    }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: riskColour }}>{riskPct}</span>
                        <span style={{ fontSize: 9, color: muted, marginTop: -2 }}>RISK</span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 10, color: muted, textAlign: 'center' }}>
                        {riskPct === 0 ? 'Clean' : riskPct < 40 ? 'Low' : riskPct < 80 ? 'High' : 'Critical'}
                    </p>
                </div>
            </div>

            {/* ── Visual Graph (3-column lane layout) ────────────── */}
            <div style={{ padding: '20px 20px 8px', overflowX: 'auto' }}>
                <div style={{ display: 'flex', gap: 0, minWidth: 480, alignItems: 'flex-start' }}>

                    {/* Lane 1 — Agent */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: muted }}>Agent</p>
                        {agentNodes.map(n => (
                            <div key={n.id} style={{
                                padding: '10px 16px', borderRadius: 12,
                                background: isDark ? '#1e3a5f' : '#dbeafe',
                                border: '2px solid #3b82f6',
                                fontSize: 13, fontWeight: 700, color: '#3b82f6',
                                textAlign: 'center', width: '100%', boxSizing: 'border-box',
                            }}>
                                🤖 {n.label}
                            </div>
                        ))}
                    </div>

                    {/* Arrow */}
                    <div style={{ display: 'flex', alignItems: 'center', padding: '28px 4px 0', color: muted, fontSize: 20 }}>→</div>

                    {/* Lane 2 — Tools */}
                    <div style={{ flex: 1.4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: muted }}>Connected Tools</p>
                        {toolNodes.length === 0
                            ? <p style={{ fontSize: 12, color: muted, margin: 0 }}>No tools connected</p>
                            : toolNodes.map(n => {
                                const toolId = n.id.replace('tool:', '');
                                const isDanger = dangerToolIds.has(n.id);
                                return (
                                    <div key={n.id} style={{
                                        padding: '8px 14px', borderRadius: 10, width: '100%', boxSizing: 'border-box',
                                        background: isDanger ? (isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.07)') : surface,
                                        border: `2px solid ${isDanger ? '#ef4444' : border}`,
                                        fontSize: 13, fontWeight: 600,
                                        color: isDanger ? '#ef4444' : text,
                                        display: 'flex', alignItems: 'center', gap: 8,
                                    }}>
                                        <span>{TOOL_EMOJI[toolId] ?? '🔌'}</span>
                                        {n.label}
                                        {isDanger && <span style={{ marginLeft: 'auto', fontSize: 10, background: '#ef4444', color: '#fff', padding: '1px 6px', borderRadius: 20 }}>risk</span>}
                                    </div>
                                );
                            })
                        }
                    </div>

                    {/* Arrow */}
                    <div style={{ display: 'flex', alignItems: 'center', padding: '28px 4px 0', color: muted, fontSize: 20 }}>→</div>

                    {/* Lane 3 — Capabilities */}
                    <div style={{ flex: 1.6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: muted }}>Effective Capabilities</p>
                        {capNodes.length === 0
                            ? <p style={{ fontSize: 12, color: muted, margin: 0 }}>None granted</p>
                            : capNodes.map(n => {
                                const isDanger = dangerCapIds.has(n.id);
                                return (
                                    <div key={n.id} style={{
                                        padding: '6px 12px', borderRadius: 8, width: '100%', boxSizing: 'border-box',
                                        background: isDanger ? (isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.07)') : (isDark ? '#1f2937' : '#f1f5f9'),
                                        border: `1.5px solid ${isDanger ? '#ef4444' : border}`,
                                        fontSize: 12, fontWeight: 600,
                                        color: isDanger ? '#ef4444' : sub,
                                        display: 'flex', alignItems: 'center', gap: 6,
                                    }}>
                                        <CapIcon cap={n.label} />
                                        {n.label}
                                        {isDanger && <ShieldAlert size={12} style={{ marginLeft: 'auto', color: '#ef4444' }} />}
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>
            </div>

            {/* ── Attack Paths ────────────────────────────────────── */}
            {data.attackPaths.length > 0 && (
                <div style={{ padding: '8px 20px 20px' }}>
                    <p style={{ margin: '12px 0 8px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: muted }}>
                        Detected Attack Paths ({activeAttackPaths.length} active)
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {data.attackPaths.map(path => {
                            const isFixed = fixed.includes(path.ruleId);
                            const sev = SEV[path.severity] ?? SEV.medium;
                            return (
                                <div key={path.ruleId} style={{
                                    border: `1.5px solid ${isFixed ? border : sev.border}`,
                                    borderRadius: 12,
                                    background: isFixed ? surface : sev.bg,
                                    padding: '12px 16px',
                                    opacity: isFixed ? 0.55 : 1,
                                    transition: 'all 0.3s',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                <span style={{
                                                    fontSize: 10, fontWeight: 700, padding: '2px 8px',
                                                    borderRadius: 20, background: sev.bg,
                                                    border: `1px solid ${sev.border}`, color: sev.text,
                                                }}>
                                                    {sev.label}
                                                </span>
                                                <code style={{ fontSize: 12, color: isFixed ? muted : sev.text, fontWeight: 600 }}>
                                                    {path.ruleId}
                                                </code>
                                                {isFixed && <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>✓ Fixed</span>}
                                            </div>
                                            <p style={{ margin: '0 0 6px', fontSize: 13, color: isFixed ? muted : text, lineHeight: 1.5 }}>
                                                {path.message}
                                            </p>
                                            <p style={{ margin: 0, fontSize: 11, color: muted }}>
                                                Via: {path.viaTools.map(t => `${TOOL_EMOJI[t] ?? '🔌'} ${t}`).join(', ')}
                                            </p>
                                        </div>
                                        {!isFixed && (
                                            <button
                                                onClick={() => applyFix(path.ruleId)}
                                                disabled={applying === path.ruleId}
                                                style={{
                                                    flexShrink: 0,
                                                    padding: '7px 14px',
                                                    background: applying === path.ruleId ? muted : sev.text,
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: 8,
                                                    fontWeight: 700,
                                                    fontSize: 12,
                                                    cursor: applying === path.ruleId ? 'not-allowed' : 'pointer',
                                                    transition: 'background 0.2s',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {applying === path.ruleId ? 'Fixing…' : 'Apply Fix'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Clean state ─────────────────────────────────────── */}
            {data.attackPaths.length === 0 && (
                <div style={{ padding: '16px 20px 24px', textAlign: 'center' }}>
                    <ShieldCheck size={36} style={{ color: '#10b981', marginBottom: 8 }} />
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#10b981' }}>No attack paths detected</p>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: muted }}>This agent's capability combination is safe.</p>
                </div>
            )}
        </div>
    );
}
