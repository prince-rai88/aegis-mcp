'use client';

export const dynamic = 'force-dynamic';

import { useTheme, useWidgetSDK } from '@nitrostack/widgets';

const ACTIONS = [
    {
        icon: '🔌', name: 'connect_tool', badge: 'Gateway', color: '#3b82f6',
        desc: "Attach an integration to an agent, granting its full capability set.",
        prompt: 'Connect dropbox to support-agent',
        integrations: ['gmail', 'dropbox', 'postgres', 'slack', 'filesystem', 'calendar'],
    },
    {
        icon: '🗺️', name: 'get_capability_graph', badge: 'Visualise', color: '#8b5cf6',
        desc: 'Render the full agent → tool → capability graph. Dangerous edges glow red.',
        prompt: 'Show the capability graph for support-agent',
        integrations: [],
    },
    {
        icon: '🚨', name: 'detect_attack_paths', badge: 'Detect', color: '#ef4444',
        desc: 'Run the deterministic toxic-combination detector. Zero LLM tokens spent.',
        prompt: 'Detect attack paths on support-agent',
        integrations: [],
    },
    {
        icon: '🔧', name: 'apply_policy_fix', badge: 'Remediate', color: '#10b981',
        desc: 'Disconnect the risky tool and clear the rule. Returns refreshed graph.',
        prompt: 'Fix the exfiltration path on support-agent',
        integrations: [],
    },
];

const RULES = [
    { id: 'exfiltration', src: 'READ_PRIVATE_DATA', sink: 'SEND_EXTERNAL', sev: 'critical', color: '#ef4444', icon: '📤', weight: 1.0 },
    { id: 'public-leak', src: 'READ_PRIVATE_DATA', sink: 'WRITE_PUBLIC', sev: 'high', color: '#f97316', icon: '📢', weight: 0.6 },
    { id: 'destructive', src: 'DELETE_DATA', sink: 'EXECUTE', sev: 'high', color: '#f97316', icon: '⚡', weight: 0.6 },
];

const CAP_DANGER = new Set(['READ_PRIVATE_DATA', 'SEND_EXTERNAL', 'WRITE_PUBLIC', 'DELETE_DATA', 'EXECUTE']);

const INTEGRATIONS = [
    { name: 'Gmail', emoji: '📧', color: '#ea4335', caps: ['SEND_EXTERNAL', 'READ_PRIVATE_DATA'] },
    { name: 'Dropbox', emoji: '📦', color: '#0061ff', caps: ['READ_PRIVATE_DATA', 'WRITE_DATA', 'SEND_EXTERNAL'] },
    { name: 'PostgreSQL', emoji: '🐘', color: '#336791', caps: ['READ_PRIVATE_DATA', 'WRITE_DATA', 'DELETE_DATA'] },
    { name: 'Slack', emoji: '💬', color: '#a855f7', caps: ['WRITE_PUBLIC', 'SEND_EXTERNAL'] },
    { name: 'Filesystem', emoji: '🗂️', color: '#f59e0b', caps: ['READ_PRIVATE_DATA', 'WRITE_DATA', 'EXECUTE'] },
    { name: 'Calendar', emoji: '📅', color: '#10b981', caps: ['READ_PRIVATE_DATA', 'WRITE_DATA'] },
];

const CAP_COLOR: Record<string, string> = {
    READ_PRIVATE_DATA: '#ef4444', SEND_EXTERNAL: '#f97316', WRITE_PUBLIC: '#eab308',
    DELETE_DATA: '#ef4444', EXECUTE: '#f97316', WRITE_DATA: '#3b82f6', READ_PUBLIC_DATA: '#10b981',
};

export default function AegisDashboard() {
    const theme = useTheme();
    const isDark = theme === 'dark';
    const { sendFollowUpMessage } = useWidgetSDK();

    const bg     = isDark ? '#060b14' : '#f0f4f8';
    const card   = isDark ? 'rgba(15,23,42,0.75)' : 'rgba(255,255,255,0.92)';
    const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
    const text   = isDark ? '#f0f9ff' : '#0f172a';
    const sub    = isDark ? '#64748b' : '#94a3b8';
    const hr     = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';

    return (
        <div style={{ background: bg, fontFamily: 'Inter, system-ui, sans-serif', color: text, minHeight: '100vh' }}>
            <style>{`
                @keyframes fadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
                @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.35} }
                @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
                @keyframes shimmer { 0%{box-shadow:0 0 20px rgba(59,130,246,0.25)} 50%{box-shadow:0 0 42px rgba(59,130,246,0.55)} 100%{box-shadow:0 0 20px rgba(59,130,246,0.25)} }
                .ac:hover { transform:translateY(-4px) !important; box-shadow:0 16px 40px rgba(0,0,0,0.18) !important; }
                .ac { transition:transform 0.2s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s ease !important; }
                .tb:hover { opacity:0.88; transform:scale(1.02); }
                .tb { transition:all 0.15s ease; }
            `}</style>

            {/* ── Hero ──────────────────────────────────────────────────────── */}
            <div style={{
                position: 'relative', overflow: 'hidden',
                background: isDark
                    ? 'linear-gradient(140deg, #06090f 0%, #0c1732 55%, #080e1e 100%)'
                    : 'linear-gradient(140deg, #eff6ff 0%, #f0fdf4 100%)',
                borderBottom: `1px solid ${border}`,
                padding: '48px 24px 44px',
                textAlign: 'center',
            }}>
                {isDark && <>
                    <div style={{ position:'absolute', width:380, height:380, borderRadius:'50%', background:'radial-gradient(circle, rgba(59,130,246,0.14) 0%, transparent 70%)', top:-120, left:'3%', pointerEvents:'none' }} />
                    <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(139,92,246,0.11) 0%, transparent 70%)', bottom:-80, right:'6%', pointerEvents:'none' }} />
                    <div style={{ position:'absolute', width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, rgba(239,68,68,0.07) 0%, transparent 70%)', top:'25%', right:'28%', pointerEvents:'none' }} />
                </>}

                <div style={{
                    display:'inline-flex', alignItems:'center', justifyContent:'center',
                    width:92, height:92, borderRadius:28, marginBottom:24,
                    background: isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.08)',
                    border:'2px solid rgba(59,130,246,0.32)',
                    fontSize:46,
                    animation:'float 3.2s ease-in-out infinite, shimmer 3.2s ease-in-out infinite',
                }}>
                    🛡️
                </div>

                <h1 style={{
                    margin:'0 0 8px', fontSize:40, fontWeight:900, letterSpacing:-1.5,
                    background: isDark
                        ? 'linear-gradient(135deg, #93c5fd 0%, #c4b5fd 100%)'
                        : 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
                    WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
                }}>
                    Aegis
                </h1>
                <p style={{ margin:'0 auto 6px', fontSize:17, fontWeight:600, color: isDark ? '#e2e8f0' : '#1e293b', maxWidth:500 }}>
                    Blast-radius auditor for AI agents
                </p>
                <p style={{ margin:'0 auto', fontSize:13, color:sub, maxWidth:460, lineHeight:1.7 }}>
                    Detects toxic capability combinations before they become exploits — pure TypeScript, zero LLM tokens.
                </p>

                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginTop:26, flexWrap:'wrap' }}>
                    {[
                        { dot:'#10b981', label:'Detection engine live' },
                        { dot:'#3b82f6', label:'3 policy rules active' },
                        { dot:'#8b5cf6', label:'6 tool integrations' },
                    ].map(p => (
                        <div key={p.label} style={{
                            display:'inline-flex', alignItems:'center', gap:6,
                            padding:'5px 14px', borderRadius:20,
                            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                            border:`1px solid ${border}`, fontSize:12, color:sub,
                            backdropFilter:'blur(8px)',
                        }}>
                            <span style={{ width:6, height:6, borderRadius:'50%', background:p.dot, animation:'pulse 2s ease infinite', display:'inline-block', boxShadow:`0 0 6px ${p.dot}` }} />
                            {p.label}
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ padding:'32px 20px 48px', maxWidth:740, margin:'0 auto', display:'flex', flexDirection:'column', gap:36 }}>

                {/* ── Quick Actions ────────────────────────────────────────── */}
                <section style={{ animation:'fadeUp 0.45s ease 0.05s both' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
                        <h2 style={{ margin:0, fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1.5, color:sub }}>
                            Start an Audit
                        </h2>
                        <div style={{ flex:1, height:1, background:hr }} />
                    </div>
                    <p style={{ margin:'0 0 16px', fontSize:12, color:sub, lineHeight:1.6 }}>
                        Click <strong style={{ color: isDark ? '#94a3b8' : '#64748b' }}>▶ Try in Chat</strong> to fire any tool directly into the conversation — results appear instantly as widgets.
                    </p>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(310px, 1fr))', gap:10 }}>
                        {ACTIONS.map((a, i) => (
                            <div key={a.name} className="ac" style={{
                                background:card, border:`1px solid ${border}`,
                                borderRadius:18, padding:'20px',
                                backdropFilter:'blur(12px)',
                                animation:`fadeUp 0.38s ease ${0.08 + i*0.08}s both`,
                            }}>
                                <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:12 }}>
                                    <div style={{
                                        width:46, height:46, borderRadius:14, flexShrink:0,
                                        background:`${a.color}12`, border:`1.5px solid ${a.color}30`,
                                        display:'flex', alignItems:'center', justifyContent:'center',
                                        fontSize:22, boxShadow:`0 0 18px ${a.color}18`,
                                    }}>
                                        {a.icon}
                                    </div>
                                    <div style={{ flex:1 }}>
                                        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4 }}>
                                            <code style={{ fontSize:12, fontWeight:700, color:a.color }}>{a.name}</code>
                                            <span style={{
                                                fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:20,
                                                background:`${a.color}15`, border:`1px solid ${a.color}35`,
                                                color:a.color, letterSpacing:0.5, textTransform:'uppercase',
                                            }}>
                                                {a.badge}
                                            </span>
                                        </div>
                                        <p style={{ margin:0, fontSize:12, color:sub, lineHeight:1.6 }}>{a.desc}</p>
                                    </div>
                                </div>

                                {a.integrations.length > 0 && (
                                    <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:12 }}>
                                        {a.integrations.map(t => (
                                            <span key={t} style={{
                                                fontSize:10, padding:'2px 8px', borderRadius:20,
                                                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                                                border:`1px solid ${border}`, color:sub, fontFamily:'monospace',
                                            }}>
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <button
                                    id={`action-${a.name}`}
                                    className="tb"
                                    onClick={() => sendFollowUpMessage(a.prompt)}
                                    style={{
                                        width:'100%', padding:'10px 16px', border:'none', borderRadius:11,
                                        background:`linear-gradient(135deg, ${a.color}ee, ${a.color}99)`,
                                        color:'#fff', fontWeight:700, fontSize:12, cursor:'pointer',
                                        boxShadow:`0 4px 16px ${a.color}30`,
                                        display:'flex', alignItems:'center', justifyContent:'center', gap:7,
                                        letterSpacing:0.2,
                                    }}
                                >
                                    <span>▶</span> Try in Chat
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Policy Rules ─────────────────────────────────────────── */}
                <section style={{ animation:'fadeUp 0.45s ease 0.32s both' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                        <h2 style={{ margin:0, fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1.5, color:sub }}>
                            Active Policy Rules
                        </h2>
                        <div style={{ flex:1, height:1, background:hr }} />
                        <span style={{
                            fontSize:10, fontWeight:700, padding:'2px 9px', borderRadius:20,
                            background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)',
                            color:'#f87171',
                        }}>
                            {RULES.length} rules
                        </span>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        {RULES.map((r, i) => (
                            <div key={r.id} style={{
                                background:card, border:`1px solid ${border}`,
                                borderRadius:14, padding:'14px 16px',
                                display:'flex', alignItems:'center', gap:14,
                                backdropFilter:'blur(10px)',
                                borderLeft:`3px solid ${r.color}`,
                                animation:`fadeUp 0.38s ease ${0.32 + i*0.08}s both`,
                            }}>
                                <div style={{
                                    width:42, height:42, borderRadius:12, flexShrink:0,
                                    background:`${r.color}12`, border:`1.5px solid ${r.color}30`,
                                    display:'flex', alignItems:'center', justifyContent:'center',
                                    fontSize:20, boxShadow:`0 0 18px ${r.color}18`,
                                }}>
                                    {r.icon}
                                </div>
                                <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, flexWrap:'wrap' }}>
                                        <span style={{ fontSize:13, fontWeight:700 }}>{r.id}</span>
                                        <span style={{
                                            fontSize:9, fontWeight:800, padding:'2px 8px', borderRadius:20,
                                            textTransform:'uppercase', letterSpacing:0.7,
                                            background:`${r.color}15`, border:`1px solid ${r.color}40`, color:r.color,
                                        }}>
                                            {r.sev}
                                        </span>
                                        <span style={{ fontSize:11, color:sub }}>
                                            weight {r.weight.toFixed(1)}
                                        </span>
                                    </div>
                                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                                        <code style={{
                                            fontSize:11, color: isDark ? '#94a3b8' : '#475569',
                                            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                                            padding:'2px 7px', borderRadius:5,
                                        }}>
                                            {r.src}
                                        </code>
                                        <span style={{ color:r.color, fontSize:14, fontWeight:700 }}>→</span>
                                        <code style={{
                                            fontSize:11, color: isDark ? '#94a3b8' : '#475569',
                                            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                                            padding:'2px 7px', borderRadius:5,
                                        }}>
                                            {r.sink}
                                        </code>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Tool Registry ─────────────────────────────────────────── */}
                <section style={{ animation:'fadeUp 0.45s ease 0.52s both' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                        <h2 style={{ margin:0, fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1.5, color:sub }}>
                            Tool Registry
                        </h2>
                        <div style={{ flex:1, height:1, background:hr }} />
                        <span style={{
                            fontSize:10, fontWeight:700, padding:'2px 9px', borderRadius:20,
                            background:'rgba(59,130,246,0.12)', border:'1px solid rgba(59,130,246,0.25)',
                            color:'#60a5fa',
                        }}>
                            6 integrations
                        </span>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(218px, 1fr))', gap:8 }}>
                        {INTEGRATIONS.map((int, i) => (
                            <div key={int.name} style={{
                                background:card, border:`1px solid ${border}`,
                                borderRadius:14, padding:'15px',
                                backdropFilter:'blur(10px)',
                                animation:`fadeUp 0.38s ease ${0.52 + i*0.06}s both`,
                            }}>
                                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                                    <div style={{
                                        width:36, height:36, borderRadius:10, flexShrink:0,
                                        background:`${int.color}12`, border:`1.5px solid ${int.color}30`,
                                        display:'flex', alignItems:'center', justifyContent:'center',
                                        fontSize:18,
                                    }}>
                                        {int.emoji}
                                    </div>
                                    <div>
                                        <div style={{ fontSize:13, fontWeight:700, color: isDark ? '#e2e8f0' : '#1e293b' }}>{int.name}</div>
                                        <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:2 }}>
                                            <span style={{ width:5, height:5, borderRadius:'50%', background:int.color, boxShadow:`0 0 5px ${int.color}`, display:'inline-block' }} />
                                            <span style={{ fontSize:10, color:sub }}>{int.caps.length} caps</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
                                    {int.caps.map(cap => {
                                        const c = CAP_COLOR[cap] || '#64748b';
                                        const isDanger = CAP_DANGER.has(cap);
                                        return (
                                            <span key={cap} style={{
                                                fontSize:9, padding:'2px 7px', borderRadius:20, fontWeight:600,
                                                background:`${c}${isDanger ? '16' : '10'}`,
                                                border:`1px solid ${c}${isDanger ? '45' : '28'}`,
                                                color:c,
                                            }}>
                                                {isDanger ? '⚠️ ' : ''}{cap.replace(/_/g, ' ')}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

            </div>
        </div>
    );
}
