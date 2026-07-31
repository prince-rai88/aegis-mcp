'use client';

export const dynamic = 'force-dynamic';

import { useWidgetSDK, useTheme } from '@nitrostack/widgets';
import { useState } from 'react';

interface GraphNode  { id: string; type: 'agent' | 'tool' | 'capability'; label: string; }
interface GraphEdge  { id: string; source: string; target: string; danger: boolean; }
interface AttackPath { ruleId: string; source: string; sink: string; viaTools: string[]; severity: 'critical' | 'high' | 'medium'; message: string; }
interface CapabilityGraphData { agentId: string; nodes: GraphNode[]; edges: GraphEdge[]; attackPaths: AttackPath[]; riskScore: number; }

const TOOL_META: Record<string, { emoji: string; color: string; bg: string }> = {
    gmail:      { emoji: '📧', color: '#ea4335', bg: 'rgba(234,67,53,0.12)'  },
    dropbox:    { emoji: '📦', color: '#0061ff', bg: 'rgba(0,97,255,0.12)'   },
    postgres:   { emoji: '🐘', color: '#336791', bg: 'rgba(51,103,145,0.12)' },
    slack:      { emoji: '💬', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
    filesystem: { emoji: '🗂️', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    calendar:   { emoji: '📅', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
};

const CAP_ICONS: Record<string, string> = {
    READ_PRIVATE_DATA: '👁️', READ_PUBLIC_DATA: '📖', WRITE_DATA: '✏️',
    WRITE_PUBLIC: '📢', SEND_EXTERNAL: '📤', DELETE_DATA: '🗑️', EXECUTE: '⚡',
};

const SEV_COLOR = { critical: '#ef4444', high: '#f97316', medium: '#eab308' };

export default function CapabilityGraphWidget() {
    const theme  = useTheme();
    const isDark = theme === 'dark';
    const { getToolOutput, callTool, isReady, sendFollowUpMessage } = useWidgetSDK();
    const data   = getToolOutput<CapabilityGraphData>();

    const [applying, setApplying] = useState<string | null>(null);
    const [fixed,    setFixed]    = useState<string[]>([]);
    const [hovPath,  setHovPath]  = useState<string | null>(null);

    const applyFix = async (e: React.MouseEvent, ruleId: string) => {
        e.stopPropagation();
        if (!data) return;
        setApplying(ruleId);
        try {
            await callTool('apply_policy_fix', { agentId: data.agentId, ruleId });
            setFixed(prev => [...prev, ruleId]);
        } finally { setApplying(null); }
    };

    const bg     = isDark ? '#060b14' : '#f0f4f8';
    const card   = isDark ? 'rgba(15,23,42,0.82)'  : 'rgba(255,255,255,0.92)';
    const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
    const text   = isDark ? '#f0f9ff' : '#0f172a';
    const sub    = isDark ? '#64748b' : '#94a3b8';
    const lane   = isDark ? 'rgba(15,23,42,0.45)' : 'rgba(248,250,252,0.9)';

    if (!isReady || !data) {
        return (
            <div style={{ background:bg, minHeight:400, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, fontFamily:'Inter, system-ui, sans-serif' }}>
                <div style={{ width:52, height:52, border:`3px solid ${isDark ? '#1e3a5f' : '#bfdbfe'}`, borderTopColor:'#3b82f6', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <p style={{ color:sub, fontSize:14, margin:0 }}>Loading capability graph…</p>
            </div>
        );
    }

    const riskPct   = Math.round(data.riskScore * 100);
    const riskColor = riskPct === 0 ? '#10b981' : riskPct < 60 ? '#f97316' : '#ef4444';
    const riskLabel = riskPct === 0 ? 'Secure' : riskPct < 40 ? 'Low Risk' : riskPct < 70 ? 'High Risk' : 'Critical';

    const toolNodes  = data.nodes.filter(n => n.type === 'tool');
    const capNodes   = data.nodes.filter(n => n.type === 'capability');
    const agentNode  = data.nodes.find(n => n.type === 'agent');

    const dangerCapIds  = new Set(data.edges.filter(e => e.danger).map(e => e.target));
    const dangerToolIds = new Set(data.edges.filter(e => e.danger).map(e => e.source));

    const activePaths   = data.attackPaths.filter(p => !fixed.includes(p.ruleId));
    const allFixed      = data.attackPaths.length > 0 && activePaths.length === 0;

    const hovPathObj = hovPath ? data.attackPaths.find(p => p.ruleId === hovPath) : null;
    const hovToolIds = new Set(hovPathObj?.viaTools.map(t => `tool:${t}`) ?? []);
    const hovCapIds  = new Set([
        ...(hovPathObj ? data.edges.filter(e => hovToolIds.has(e.source)).map(e => e.target) : [])
    ]);

    return (
        <div style={{ background:bg, fontFamily:'Inter, system-ui, sans-serif', color:text, overflow:'hidden' }}>
            <style>{`
                @keyframes spin    { to { transform: rotate(360deg); } }
                @keyframes fadeUp  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
                @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.35} }
                @keyframes danger-glow { 0%,100%{box-shadow:0 0 8px rgba(239,68,68,0.4)} 50%{box-shadow:0 0 22px rgba(239,68,68,0.8)} }
            `}</style>

            {/* ── Header ───────────────────────────────────────────────── */}
            <div style={{
                background: isDark
                    ? 'linear-gradient(135deg,rgba(9,14,28,0.98) 0%,rgba(22,18,60,0.98) 100%)'
                    : 'linear-gradient(135deg,rgba(239,246,255,0.99) 0%,rgba(240,253,244,0.99) 100%)',
                borderBottom: `1px solid ${border}`,
                backdropFilter:'blur(14px)',
                padding:'16px 20px',
                display:'flex', alignItems:'center', gap:16,
            }}>
                <div style={{
                    width:46, height:46, borderRadius:14, flexShrink:0,
                    background:'rgba(59,130,246,0.12)', border:'1.5px solid rgba(59,130,246,0.3)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:22, boxShadow:'0 0 22px rgba(59,130,246,0.22)',
                }}>🗺️</div>
                <div style={{ flex:1, minWidth:0 }}>
                    <h2 style={{ margin:'0 0 3px', fontSize:15, fontWeight:700 }}>Capability Graph</h2>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ width:6, height:6, borderRadius:'50%', background:'#3b82f6', boxShadow:'0 0 6px #3b82f6', display:'inline-block', animation:allFixed ? 'none' : 'pulse 2s ease infinite' }} />
                        <span style={{ fontSize:12, color:sub }}>{data.agentId}</span>
                        {allFixed && <span style={{ fontSize:11, color:'#10b981', fontWeight:600 }}>✓ All paths remediated</span>}
                    </div>
                </div>
                {/* Risk badge */}
                <div style={{
                    textAlign:'center', background:`${riskColor}15`,
                    border:`2px solid ${riskColor}40`, borderRadius:14,
                    padding:'8px 16px', boxShadow:`0 0 20px ${riskColor}18`,
                }}>
                    <div style={{ fontSize:24, fontWeight:900, color:riskColor, lineHeight:1, fontFamily:'monospace' }}>
                        {riskPct}%
                    </div>
                    <div style={{ fontSize:10, color:riskColor, fontWeight:700, marginTop:2, opacity:0.85, textTransform:'uppercase', letterSpacing:0.5 }}>
                        {riskLabel}
                    </div>
                </div>
            </div>

            {/* ── Risk bar ─────────────────────────────────────────────── */}
            <div style={{ height:3, background: isDark ? '#0f172a' : '#e2e8f0', overflow:'hidden' }}>
                <div style={{
                    height:'100%', width:`${riskPct}%`,
                    background:`linear-gradient(90deg, ${riskColor}70, ${riskColor})`,
                    transition:'width 1.2s cubic-bezier(0.4,0,0.2,1)',
                    boxShadow:`0 0 10px ${riskColor}80`,
                }} />
            </div>

            {/* ── 3-Lane Graph ─────────────────────────────────────────── */}
            <div style={{ padding:'20px 16px 8px', overflowX:'auto' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 28px 1.1fr 28px 1.4fr', gap:0, minWidth:480, alignItems:'start' }}>

                    {/* Lane 1 — Agent */}
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        <p style={{ margin:'0 0 10px', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:1.1, color:sub, display:'flex', alignItems:'center', gap:6 }}>
                            <span style={{ width:6, height:6, borderRadius:'50%', background:'#3b82f6', display:'inline-block', boxShadow:'0 0 5px #3b82f6' }} />
                            Agent
                        </p>
                        {agentNode ? (
                            <div style={{
                                padding:'14px', borderRadius:14,
                                background: isDark ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.06)',
                                border:'2px solid rgba(59,130,246,0.3)',
                                display:'flex', flexDirection:'column', alignItems:'center', gap:7,
                                boxShadow:'0 0 24px rgba(59,130,246,0.1)',
                                animation:'fadeUp 0.4s ease both',
                            }}>
                                <span style={{ fontSize:26 }}>🤖</span>
                                <span style={{ fontSize:11, fontWeight:700, color:'#60a5fa', textAlign:'center', wordBreak:'break-all' }}>
                                    {agentNode.label}
                                </span>
                            </div>
                        ) : (
                            <div style={{ padding:'14px', borderRadius:14, background:lane, border:`1px dashed ${border}`, textAlign:'center', fontSize:12, color:sub }}>No agent</div>
                        )}
                    </div>

                    {/* Arrow 1 */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', paddingTop:40 }}>
                        <svg width="28" height="14" viewBox="0 0 28 14">
                            <path d="M0 7 H20 M14 1 L22 7 L14 13" stroke={isDark ? '#334155' : '#cbd5e1'} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>

                    {/* Lane 2 — Tools */}
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        <p style={{ margin:'0 0 10px', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:1.1, color:sub, display:'flex', alignItems:'center', gap:6 }}>
                            <span style={{ width:6, height:6, borderRadius:'50%', background:'#8b5cf6', display:'inline-block', boxShadow:'0 0 5px #8b5cf6' }} />
                            Connected Tools
                        </p>
                        {toolNodes.length === 0 ? (
                            <div style={{ padding:'16px', borderRadius:12, background:lane, border:`1px dashed ${border}`, textAlign:'center', fontSize:12, color:sub }}>
                                No tools connected
                            </div>
                        ) : toolNodes.map((n, i) => {
                            const toolId  = n.id.replace('tool:', '');
                            const danger  = dangerToolIds.has(n.id);
                            const hovHL   = hovToolIds.has(n.id);
                            const meta    = TOOL_META[toolId] ?? { emoji:'🔌', color:'#64748b', bg:'rgba(100,116,139,0.1)' };
                            return (
                                <div key={n.id} style={{
                                    padding:'10px 12px', borderRadius:12,
                                    background: hovHL ? `${meta.color}20` : danger ? (isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.05)') : card,
                                    border:`1.5px solid ${hovHL ? `${meta.color}55` : danger ? 'rgba(239,68,68,0.42)' : border}`,
                                    display:'flex', alignItems:'center', gap:9,
                                    transition:'all 0.2s ease',
                                    boxShadow: danger ? '0 0 0 0 rgba(239,68,68,0)' : 'none',
                                    animation: danger
                                        ? `fadeUp 0.35s ease ${i*0.07}s both, danger-glow 2.5s ease ${i*0.3}s infinite`
                                        : `fadeUp 0.35s ease ${i*0.07}s both`,
                                }}>
                                    <span style={{ fontSize:18, flexShrink:0 }}>{meta.emoji}</span>
                                    <span style={{ flex:1, fontSize:12, fontWeight:600, color: danger ? '#f87171' : isDark ? '#e2e8f0' : '#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                        {n.label}
                                    </span>
                                    {danger && (
                                        <span style={{ fontSize:9, fontWeight:800, background:'#ef444420', border:'1px solid #ef444455', color:'#f87171', padding:'2px 6px', borderRadius:20, flexShrink:0, animation:'pulse 1.8s ease infinite', letterSpacing:0.5 }}>
                                            RISK
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Arrow 2 */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', paddingTop:40 }}>
                        <svg width="28" height="14" viewBox="0 0 28 14">
                            <path d="M0 7 H20 M14 1 L22 7 L14 13" stroke={isDark ? '#334155' : '#cbd5e1'} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>

                    {/* Lane 3 — Capabilities */}
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        <p style={{ margin:'0 0 10px', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:1.1, color:sub, display:'flex', alignItems:'center', gap:6 }}>
                            <span style={{ width:6, height:6, borderRadius:'50%', background:'#10b981', display:'inline-block', boxShadow:'0 0 5px #10b981' }} />
                            Effective Capabilities
                        </p>
                        {capNodes.length === 0 ? (
                            <div style={{ padding:'16px', borderRadius:12, background:lane, border:`1px dashed ${border}`, textAlign:'center', fontSize:12, color:sub }}>None granted</div>
                        ) : capNodes.map((n, i) => {
                            const danger  = dangerCapIds.has(n.id);
                            const hovHL   = hovCapIds.has(n.id);
                            return (
                                <div key={n.id} style={{
                                    padding:'9px 12px', borderRadius:10,
                                    background: hovHL
                                        ? (danger ? 'rgba(239,68,68,0.18)' : 'rgba(16,185,129,0.12)')
                                        : danger
                                            ? (isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.05)')
                                            : (isDark ? 'rgba(16,185,129,0.06)' : 'rgba(16,185,129,0.04)'),
                                    border:`1px solid ${
                                        hovHL ? (danger ? 'rgba(239,68,68,0.5)' : 'rgba(16,185,129,0.4)')
                                        : danger ? 'rgba(239,68,68,0.3)'
                                        : 'rgba(16,185,129,0.18)'
                                    }`,
                                    display:'flex', alignItems:'center', gap:8,
                                    transition:'all 0.2s ease',
                                    boxShadow: danger ? '0 0 10px rgba(239,68,68,0.1)' : 'none',
                                    animation: danger
                                        ? `fadeUp 0.35s ease ${i*0.06}s both, danger-glow 2.5s ease ${i*0.25}s infinite`
                                        : `fadeUp 0.35s ease ${i*0.06}s both`,
                                }}>
                                    <span style={{ fontSize:13, flexShrink:0 }}>{CAP_ICONS[n.label] ?? '🔑'}</span>
                                    <span style={{ flex:1, fontSize:11, fontWeight:700, color: danger ? '#f87171' : (isDark ? '#6ee7b7' : '#047857'), overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                        {n.label}
                                    </span>
                                    {danger && <span style={{ fontSize:13, flexShrink:0, animation:'pulse 1.5s ease infinite' }}>⚠️</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Attack Paths ──────────────────────────────────────────── */}
            {data.attackPaths.length > 0 && (
                <div style={{ padding:'0 16px 20px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 0', borderTop:`1px solid ${border}`, marginTop:8 }}>
                        <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color:sub }}>
                            Attack Paths
                        </span>
                        <span style={{
                            fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:20,
                            background: activePaths.length > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                            color: activePaths.length > 0 ? '#f87171' : '#34d399',
                            border:`1px solid ${activePaths.length > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                        }}>
                            {activePaths.length > 0 ? `${activePaths.length} active` : '✓ all clear'}
                        </span>
                        {allFixed && (
                            <button
                                onClick={() => sendFollowUpMessage(`Show the updated capability graph for ${data.agentId}`)}
                                style={{ marginLeft:'auto', fontSize:11, padding:'3px 10px', borderRadius:8, background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.3)', color:'#34d399', cursor:'pointer', fontWeight:600 }}
                            >
                                ↻ Refresh graph
                            </button>
                        )}
                    </div>

                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                        {data.attackPaths.map((path, i) => {
                            const isFixed  = fixed.includes(path.ruleId);
                            const color    = SEV_COLOR[path.severity] ?? '#64748b';
                            const isHov    = hovPath === path.ruleId;
                            return (
                                <div
                                    key={path.ruleId}
                                    onMouseEnter={() => setHovPath(path.ruleId)}
                                    onMouseLeave={() => setHovPath(null)}
                                    style={{
                                        borderRadius:13,
                                        border:`1.5px solid ${isFixed ? border : `${color}38`}`,
                                        background: isFixed
                                            ? (isDark ? 'rgba(15,23,42,0.4)' : 'rgba(248,250,252,0.8)')
                                            : (isDark ? `${color}0b` : `${color}07`),
                                        padding:'14px 16px',
                                        opacity: isFixed ? 0.5 : 1,
                                        transition:'all 0.25s ease',
                                        boxShadow: isHov && !isFixed ? `0 6px 24px ${color}20, 0 0 0 1px ${color}22` : 'none',
                                        animation:`fadeUp 0.32s ease ${i*0.1}s both`,
                                    }}
                                >
                                    <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                                        <div style={{ flex:1, minWidth:0 }}>
                                            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
                                                <span style={{
                                                    fontSize:10, fontWeight:800, letterSpacing:0.8, textTransform:'uppercase',
                                                    padding:'2px 8px', borderRadius:20,
                                                    background:`${color}18`, border:`1px solid ${color}42`,
                                                    color: isFixed ? sub : color,
                                                }}>
                                                    {path.severity}
                                                </span>
                                                <code style={{ fontSize:13, fontWeight:700, color: isFixed ? sub : (isDark ? '#e2e8f0' : '#1e293b') }}>
                                                    {path.ruleId}
                                                </code>
                                                {isFixed && <span style={{ fontSize:11, color:'#34d399', fontWeight:700 }}>✓ Fixed</span>}
                                            </div>
                                            <p style={{ margin:'0 0 8px', fontSize:12, color: isDark ? '#94a3b8' : '#64748b', lineHeight:1.55 }}>
                                                {path.message}
                                            </p>
                                            {/* Tool flow */}
                                            <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:4 }}>
                                                {path.viaTools.map((t, ti) => (
                                                    <span key={t} style={{ display:'inline-flex', alignItems:'center', gap:3 }}>
                                                        <span style={{
                                                            fontSize:11, padding:'3px 9px', borderRadius:20,
                                                            background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)',
                                                            border:`1px solid ${border}`,
                                                            color: isDark ? '#cbd5e1' : '#475569', fontWeight:600,
                                                            display:'inline-flex', alignItems:'center', gap:4,
                                                        }}>
                                                            {(TOOL_META[t]?.emoji ?? '🔌')} {t}
                                                        </span>
                                                        {ti < path.viaTools.length - 1 && <span style={{ color:color, fontSize:10, fontWeight:700 }}>+</span>}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {!isFixed && (
                                            <button
                                                onClick={(e) => applyFix(e, path.ruleId)}
                                                disabled={applying === path.ruleId}
                                                style={{
                                                    flexShrink:0, padding:'9px 14px',
                                                    background: applying === path.ruleId
                                                        ? (isDark ? '#1e293b' : '#f1f5f9')
                                                        : `linear-gradient(135deg, ${color}ee, ${color}aa)`,
                                                    color: applying === path.ruleId ? sub : '#fff',
                                                    border:'none', borderRadius:10, fontWeight:700, fontSize:12,
                                                    cursor: applying === path.ruleId ? 'not-allowed' : 'pointer',
                                                    boxShadow: applying === path.ruleId ? 'none' : `0 4px 14px ${color}40`,
                                                    transition:'all 0.2s ease',
                                                    display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap',
                                                }}
                                            >
                                                {applying === path.ruleId
                                                    ? <><span style={{ width:12, height:12, border:`2px solid ${sub}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }} /> Fixing…</>
                                                    : '🔧 Fix'
                                                }
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {data.attackPaths.length === 0 && (
                <div style={{ padding:'28px 20px 32px', textAlign:'center' }}>
                    <div style={{ fontSize:44, marginBottom:10 }}>✅</div>
                    <p style={{ margin:'0 0 4px', fontSize:14, fontWeight:700, color:'#10b981' }}>No attack paths detected</p>
                    <p style={{ margin:0, fontSize:12, color:sub }}>This agent's capability combination is safe.</p>
                </div>
            )}

            {/* ── Footer ───────────────────────────────────────────────── */}
            <div style={{ borderTop:`1px solid ${border}`, padding:'10px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:11, color:sub }}>🔒 Aegis · Deterministic engine</span>
                <span style={{ fontSize:11, fontWeight:600, color: activePaths.length === 0 ? '#10b981' : '#f87171' }}>
                    {toolNodes.length} tool{toolNodes.length !== 1 ? 's' : ''} · {capNodes.length} capabilit{capNodes.length !== 1 ? 'ies' : 'y'}
                </span>
            </div>
        </div>
    );
}
