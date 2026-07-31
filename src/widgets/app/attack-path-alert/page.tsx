'use client';

export const dynamic = 'force-dynamic';

import { useWidgetSDK, useTheme } from '@nitrostack/widgets';
import { useState } from 'react';

interface AttackPath { ruleId: string; severity: 'critical' | 'high' | 'medium'; viaTools: string[]; message: string; }
interface AttackPathData { agentId: string; paths: AttackPath[]; riskScore: number; }

const TOOL_META: Record<string, { emoji: string; color: string }> = {
    gmail:      { emoji: '📧', color: '#ea4335' },
    dropbox:    { emoji: '📦', color: '#0061ff' },
    postgres:   { emoji: '🐘', color: '#336791' },
    slack:      { emoji: '💬', color: '#a855f7' },
    filesystem: { emoji: '🗂️', color: '#f59e0b' },
    calendar:   { emoji: '📅', color: '#10b981' },
};

const SEV: Record<string, { label: string; color: string; glow: string; gradient: string; border: string; lightGrad: string; lightBorder: string }> = {
    critical: { label:'Critical', color:'#ef4444', glow:'rgba(239,68,68,0.3)',  gradient:'linear-gradient(135deg,#450a0a,#1c0a0a)', border:'#7f1d1d', lightGrad:'linear-gradient(135deg,#fef2f2,#fff5f5)', lightBorder:'#fecaca' },
    high:     { label:'High',     color:'#f97316', glow:'rgba(249,115,22,0.3)', gradient:'linear-gradient(135deg,#431407,#1c0a03)', border:'#7c2d12', lightGrad:'linear-gradient(135deg,#fff7ed,#fffbf5)', lightBorder:'#fed7aa' },
    medium:   { label:'Medium',   color:'#eab308', glow:'rgba(234,179,8,0.25)', gradient:'linear-gradient(135deg,#422006,#1c1003)', border:'#78350f', lightGrad:'linear-gradient(135deg,#fefce8,#fffff5)', lightBorder:'#fde68a' },
};

function RiskGauge({ score, isDark }: { score: number; isDark: boolean }) {
    const pct   = Math.round(score * 100);
    const color = pct === 0 ? '#10b981' : pct < 60 ? '#f97316' : '#ef4444';
    const label = pct === 0 ? 'Secure' : pct < 40 ? 'Low' : pct < 70 ? 'High' : 'Critical';
    const C     = 2 * Math.PI * 28;
    const dash  = C * (1 - score);
    return (
        <div style={{ position:'relative', width:80, height:80, flexShrink:0 }}>
            <svg width="80" height="80" style={{ transform:'rotate(-90deg)' }}>
                <circle cx="40" cy="40" r="28" fill="none" stroke={isDark ? '#1f2937' : '#e5e7eb'} strokeWidth="6" />
                <circle cx="40" cy="40" r="28" fill="none" stroke={color} strokeWidth="6"
                    strokeDasharray={C} strokeDashoffset={dash} strokeLinecap="round"
                    style={{ transition:'stroke-dashoffset 1s ease, stroke 0.5s ease', filter:`drop-shadow(0 0 7px ${color})` }} />
            </svg>
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:19, fontWeight:900, color, lineHeight:1, fontFamily:'monospace' }}>{pct}</span>
                <span style={{ fontSize:9, color: isDark ? '#6b7280' : '#9ca3af', fontWeight:700, letterSpacing:0.5, textTransform:'uppercase' }}>{label}</span>
            </div>
        </div>
    );
}

export default function AttackPathAlertWidget() {
    const theme  = useTheme();
    const isDark = theme === 'dark';
    const { getToolOutput, callTool, isReady, sendFollowUpMessage } = useWidgetSDK();
    const data   = getToolOutput<AttackPathData>();

    const [expanded, setExpanded] = useState<string | null>(null);
    const [applying, setApplying] = useState<string | null>(null);
    const [fixed,    setFixed]    = useState<string[]>([]);
    const [hovered,  setHovered]  = useState<string | null>(null);

    const applyFix = async (e: React.MouseEvent, ruleId: string) => {
        e.stopPropagation();
        if (!data) return;
        setApplying(ruleId);
        try {
            await callTool('apply_policy_fix', { agentId: data.agentId, ruleId });
            setFixed(prev => [...prev, ruleId]);
            setExpanded(null);
        } finally { setApplying(null); }
    };

    const bg      = isDark ? '#060b14' : '#f0f4f8';
    const card    = isDark ? 'rgba(15,23,42,0.82)' : 'rgba(255,255,255,0.92)';
    const border  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
    const text    = isDark ? '#f0f9ff' : '#0f172a';
    const sub     = isDark ? '#64748b' : '#94a3b8';
    const surface = isDark ? 'rgba(30,41,59,0.55)' : 'rgba(241,245,249,0.85)';

    if (!isReady || !data) {
        return (
            <div style={{ background:bg, minHeight:300, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, fontFamily:'Inter, system-ui, sans-serif' }}>
                <div style={{ width:48, height:48, border:`3px solid ${isDark ? '#1e3a5f' : '#bfdbfe'}`, borderTopColor:'#3b82f6', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <p style={{ color:sub, fontSize:13, margin:0 }}>Analysing attack surface…</p>
            </div>
        );
    }

    const riskPct     = Math.round(data.riskScore * 100);
    const activeCount = data.paths.filter(p => !fixed.includes(p.ruleId)).length;
    const allClear    = activeCount === 0;

    return (
        <div style={{ background:bg, fontFamily:'Inter, system-ui, sans-serif', color:text, minWidth:320 }}>
            <style>{`
                @keyframes spin        { to { transform:rotate(360deg); } }
                @keyframes fadeSlideIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
                @keyframes pulse       { 0%,100%{opacity:1} 50%{opacity:0.4} }
                @keyframes bounce-in   { 0%{transform:scale(0.7);opacity:0} 70%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
            `}</style>

            {/* ── Header ───────────────────────────────────────────────── */}
            <div style={{
                background: isDark
                    ? 'linear-gradient(135deg,rgba(9,14,28,0.97) 0%,rgba(22,18,60,0.97) 100%)'
                    : 'linear-gradient(135deg,rgba(239,246,255,0.99) 0%,rgba(240,253,244,0.99) 100%)',
                borderBottom:`1px solid ${border}`, backdropFilter:'blur(14px)',
                padding:'20px 24px', display:'flex', alignItems:'center', gap:20,
            }}>
                <div style={{
                    width:54, height:54, borderRadius:17, flexShrink:0,
                    background: allClear ? (isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)') : (isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)'),
                    border:`1.5px solid ${allClear ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:26,
                    boxShadow:`0 0 24px ${allClear ? 'rgba(16,185,129,0.22)' : 'rgba(239,68,68,0.22)'}`,
                    animation: allClear ? 'bounce-in 0.5s ease' : 'none',
                }}>
                    {allClear ? '🛡️' : '⚠️'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                    <h2 style={{ margin:'0 0 4px', fontSize:16, fontWeight:800, color: allClear ? '#10b981' : (isDark ? '#f87171' : '#dc2626') }}>
                        {allClear
                            ? 'No Threats Detected'
                            : `${activeCount} Attack Path${activeCount > 1 ? 's' : ''} Active`}
                    </h2>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{
                            width:6, height:6, borderRadius:'50%',
                            background: allClear ? '#10b981' : '#ef4444',
                            ...(!allClear ? { animation:'pulse 1.5s ease infinite' } : {}),
                        }} />
                        <span style={{ fontSize:12, color:sub }}>
                            Agent: <span style={{ color: isDark ? '#94a3b8' : '#475569', fontWeight:600 }}>{data.agentId}</span>
                        </span>
                    </div>
                </div>
                <RiskGauge score={data.riskScore} isDark={isDark} />
            </div>

            {/* ── Risk bar ─────────────────────────────────────────────── */}
            <div style={{ height:3, background: isDark ? '#0f172a' : '#e2e8f0', overflow:'hidden' }}>
                <div style={{
                    height:'100%', width:`${riskPct}%`,
                    background: riskPct === 0 ? '#10b981' : riskPct < 60 ? '#f97316' : '#ef4444',
                    transition:'width 1.2s cubic-bezier(0.4,0,0.2,1)',
                    boxShadow:`0 0 10px ${riskPct === 0 ? '#10b981' : riskPct < 60 ? '#f97316' : '#ef4444'}`,
                }} />
            </div>

            {/* ── Content ──────────────────────────────────────────────── */}
            <div style={{ padding:'12px 14px 20px' }}>

                {/* All clear */}
                {allClear && (
                    <div style={{ padding:'36px 24px', textAlign:'center', animation:'fadeSlideIn 0.4s ease' }}>
                        <div style={{ fontSize:52, marginBottom:14, animation:'bounce-in 0.5s ease 0.1s both' }}>✅</div>
                        <p style={{ margin:'0 0 6px', fontSize:16, fontWeight:800, color:'#10b981' }}>
                            All capability combinations are safe
                        </p>
                        <p style={{ margin:'0 0 16px', fontSize:12, color:sub }}>
                            {fixed.length > 0
                                ? `${fixed.length} path${fixed.length > 1 ? 's' : ''} remediated this session`
                                : 'No toxic capability combinations detected'}
                        </p>
                        {fixed.length > 0 && (
                            <button
                                onClick={() => sendFollowUpMessage(`Show the updated capability graph for ${data.agentId}`)}
                                style={{
                                    padding:'10px 20px', borderRadius:12, border:'1.5px solid rgba(16,185,129,0.4)',
                                    background:'rgba(16,185,129,0.12)', color:'#10b981', fontWeight:700, fontSize:13,
                                    cursor:'pointer', display:'inline-flex', alignItems:'center', gap:7,
                                }}
                            >
                                🗺️ View updated capability graph
                            </button>
                        )}
                    </div>
                )}

                {/* Attack path cards */}
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {data.paths.map((path, i) => {
                        const isFixed = fixed.includes(path.ruleId);
                        const isExp   = expanded === path.ruleId;
                        const isHov   = hovered === path.ruleId;
                        const s       = SEV[path.severity] ?? SEV.medium;

                        return (
                            <div
                                key={path.ruleId}
                                onClick={() => !isFixed && setExpanded(isExp ? null : path.ruleId)}
                                onMouseEnter={() => setHovered(path.ruleId)}
                                onMouseLeave={() => setHovered(null)}
                                style={{
                                    borderRadius:15, overflow:'hidden',
                                    border:`1.5px solid ${isFixed ? border : s.border}`,
                                    background: isFixed
                                        ? surface
                                        : isExp
                                            ? (isDark ? s.gradient : s.lightGrad)
                                            : isHov ? (isDark ? 'rgba(30,41,59,0.92)' : 'rgba(248,250,252,0.95)') : card,
                                    cursor: isFixed ? 'default' : 'pointer',
                                    opacity: isFixed ? 0.52 : 1,
                                    transition:'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                                    boxShadow: isExp && !isFixed
                                        ? `0 10px 40px ${s.glow}, 0 0 0 1px ${s.border}`
                                        : isHov && !isFixed
                                            ? `0 4px 18px ${isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)'}`
                                            : 'none',
                                    animation:`fadeSlideIn 0.3s ease ${i*0.09}s both`,
                                }}
                            >
                                {/* Card header */}
                                <div style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
                                    <div style={{
                                        width:8, height:8, borderRadius:'50%', flexShrink:0,
                                        background: isFixed ? sub : s.color,
                                        boxShadow: isFixed ? 'none' : `0 0 8px ${s.color}`,
                                        ...(isFixed || !isExp ? {} : { animation:'pulse 1.5s ease infinite' }),
                                    }} />
                                    <span style={{
                                        fontSize:10, fontWeight:800, padding:'3px 10px', borderRadius:20,
                                        letterSpacing:0.8, textTransform:'uppercase',
                                        background: isFixed ? 'transparent' : `${s.color}18`,
                                        border:`1px solid ${isFixed ? border : `${s.color}60`}`,
                                        color: isFixed ? sub : s.color, flexShrink:0,
                                    }}>
                                        {s.label}
                                    </span>
                                    <code style={{ flex:1, fontSize:13, fontWeight:700, color: isFixed ? sub : text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                        {path.ruleId}
                                    </code>
                                    {isFixed
                                        ? <span style={{ fontSize:12, fontWeight:700, color:'#10b981', flexShrink:0 }}>✓ Remediated</span>
                                        : <span style={{ fontSize:20, color:sub, transform: isExp ? 'rotate(180deg)' : 'rotate(0)', transition:'transform 0.2s ease', display:'block', flexShrink:0 }}>⌄</span>
                                    }
                                </div>

                                {/* Expanded body */}
                                {isExp && !isFixed && (
                                    <div style={{ borderTop:`1px solid ${s.border}40`, padding:'16px 16px 18px', animation:'fadeSlideIn 0.2s ease' }}>
                                        <p style={{
                                            margin:'0 0 16px', fontSize:13, color: isDark ? '#cbd5e1' : '#334155',
                                            lineHeight:1.7, padding:'10px 14px',
                                            background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.65)',
                                            borderRadius:10, border:`1px solid ${border}`,
                                        }}>
                                            {path.message}
                                        </p>

                                        {/* Tool chain flow diagram */}
                                        <div style={{ marginBottom:16 }}>
                                            <p style={{ margin:'0 0 10px', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color:sub }}>
                                                Tools creating this path
                                            </p>
                                            <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:6 }}>
                                                {path.viaTools.map((t, ti) => {
                                                    const meta = TOOL_META[t] ?? { emoji:'🔌', color:'#64748b' };
                                                    return (
                                                        <span key={t} style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
                                                            <span style={{
                                                                padding:'6px 12px', borderRadius:20,
                                                                background: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.85)',
                                                                border:`1.5px solid ${meta.color}55`,
                                                                fontSize:12, fontWeight:700,
                                                                color: isDark ? '#e2e8f0' : '#1e293b',
                                                                display:'inline-flex', alignItems:'center', gap:6,
                                                                boxShadow:`0 0 10px ${meta.color}18`,
                                                            }}>
                                                                <span style={{ fontSize:15 }}>{meta.emoji}</span>
                                                                {t}
                                                            </span>
                                                            {ti < path.viaTools.length - 1 && (
                                                                <span style={{ color:s.color, fontSize:16, fontWeight:700 }}>→</span>
                                                            )}
                                                        </span>
                                                    );
                                                })}
                                                <span style={{ display:'inline-flex', alignItems:'center', gap:4, marginLeft:4 }}>
                                                    <span style={{ color:s.color, fontSize:16, fontWeight:700 }}>→</span>
                                                    <span style={{
                                                        padding:'6px 12px', borderRadius:20, fontSize:12, fontWeight:700,
                                                        background:`${s.color}18`, border:`1.5px solid ${s.color}55`,
                                                        color:s.color, animation:'pulse 2s ease infinite',
                                                    }}>
                                                        ⚠️ Attack Path
                                                    </span>
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={(e) => applyFix(e, path.ruleId)}
                                            disabled={applying === path.ruleId}
                                            style={{
                                                width:'100%', padding:'13px 20px',
                                                background: applying === path.ruleId
                                                    ? (isDark ? '#1e293b' : '#f1f5f9')
                                                    : `linear-gradient(135deg, ${s.color}, ${s.color}cc)`,
                                                color: applying === path.ruleId ? sub : '#fff',
                                                border:'none', borderRadius:12, fontWeight:700, fontSize:13,
                                                cursor: applying === path.ruleId ? 'not-allowed' : 'pointer',
                                                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                                                boxShadow: applying === path.ruleId ? 'none' : `0 5px 18px ${s.glow}`,
                                                transition:'all 0.2s ease', letterSpacing:0.3,
                                            }}
                                        >
                                            {applying === path.ruleId
                                                ? <><span style={{ width:14, height:14, border:`2px solid ${sub}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }} /> Disconnecting tool…</>
                                                : '🔧 Disconnect risky tool & fix path'
                                            }
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Footer ───────────────────────────────────────────────── */}
            <div style={{ borderTop:`1px solid ${border}`, padding:'10px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:11, color:sub }}>🔒 Deterministic detection · 0 LLM tokens</span>
                <span style={{ fontSize:11, fontWeight:600, color: allClear ? '#10b981' : (isDark ? '#f87171' : '#dc2626') }}>
                    {fixed.length > 0 ? `${fixed.length} fixed` : `${data.paths.length} rule${data.paths.length !== 1 ? 's' : ''} monitored`}
                </span>
            </div>
        </div>
    );
}
