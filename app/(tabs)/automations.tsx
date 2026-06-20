// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletStore } from '@/src/store/useWalletStore';
import { useAutomationStore } from '@/src/store/useAutomationStore';
import { formatRelativeTime } from '@/src/lib/formatters';
import type { Automation, AutomationStatus } from '@/src/store/useAutomationStore';

// ─── Design tokens (M3 × Crypto) ─────────────────────────────────────────────
const T = {
  // Surfaces (M3 tonal system, ultra-dark)
  surface:        '#07090F',
  surfaceContainer:'#0C1018',
  surfaceHigh:    '#111826',
  surfaceHighest: '#172030',
  outline:        'rgba(255,255,255,0.08)',
  outlineVariant: 'rgba(255,255,255,0.05)',

  // On-surface
  onSurface:      '#E4E9F5',
  onSurfaceVar:   '#8A96B0',
  onSurfaceMuted: '#4F5A72',

  // Primary (M3 primary — purple, crypto-tuned)
  primary:        '#A78BFA',
  primaryDim:     '#7C3AED',
  primaryContainer:'rgba(124,58,237,0.15)',
  onPrimary:      '#FFFFFF',

  // Secondary (Solana green)
  secondary:      '#00FFA3',
  secondaryDim:   '#00CC82',
  secondaryContainer:'rgba(0,255,163,0.12)',

  // Error
  error:          '#F43F5E',
  errorContainer: 'rgba(244,63,94,0.12)',

  // Warning / triggered
  warning:        '#FBBF24',
  warningContainer:'rgba(251,191,36,0.12)',

  // Status map
  statusColors: {
    idle:       { text: '#8A96B0', bg: 'rgba(138,150,176,0.10)', dot: '#8A96B0' },
    monitoring: { text: '#60A5FA', bg: 'rgba(96,165,250,0.12)',  dot: '#60A5FA' },
    triggered:  { text: '#FBBF24', bg: 'rgba(251,191,36,0.12)',  dot: '#FBBF24' },
    executed:   { text: '#00FFA3', bg: 'rgba(0,255,163,0.12)',   dot: '#00FFA3' },
    failed:     { text: '#F43F5E', bg: 'rgba(244,63,94,0.12)',   dot: '#F43F5E' },
  } as Record<AutomationStatus, { text: string; bg: string; dot: string }>,
};

const INDICATOR_LABELS: Record<string, string> = {
  CPI: 'US CPI', CORE_CPI: 'Core CPI', FED_FUNDS: 'Fed Rate',
  M2: 'M2 Supply', GDP: 'GDP', UNEMPLOYMENT: 'Unemployment',
};

type FilterTab = 'all' | 'active' | 'triggered' | 'executed';
const FILTERS: { key: FilterTab; label: string; icon: string }[] = [
  { key: 'all',       label: 'All',       icon: '⚡' },
  { key: 'active',    label: 'Active',    icon: '📡' },
  { key: 'triggered', label: 'Triggered', icon: '🎯' },
  { key: 'executed',  label: 'Executed',  icon: '✅' },
];

// ─── Animated toggle switch ───────────────────────────────────────────────────
function M3Switch({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onChange(); }}
      aria-checked={value}
      role="switch"
      style={{
        position: 'relative', cursor: 'pointer', border: 'none', padding: 0,
        width: 52, height: 32, borderRadius: 16,
        background: value ? T.primaryDim : 'rgba(255,255,255,0.1)',
        transition: 'background 0.25s cubic-bezier(0.2,0,0,1)',
        flexShrink: 0,
        boxShadow: value ? `0 0 12px ${T.primaryDim}60` : 'none',
      }}
    >
      <span style={{
        position: 'absolute',
        top: value ? 4 : 4,
        left: value ? 24 : 4,
        width: 24, height: 24, borderRadius: '50%',
        background: value ? '#fff' : 'rgba(255,255,255,0.6)',
        transition: 'left 0.25s cubic-bezier(0.2,0,0,1), transform 0.1s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
      }} />
    </button>
  );
}

// ─── Status chip ─────────────────────────────────────────────────────────────
function StatusChip({ status }: { status: AutomationStatus }) {
  const s = T.statusColors[status] ?? T.statusColors.idle;
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 100,
      background: s.bg, fontSize: 11, fontWeight: 700,
      letterSpacing: '0.06em', textTransform: 'uppercase', color: s.text,
      border: `1px solid ${s.dot}30`,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0,
        boxShadow: status === 'monitoring' ? `0 0 6px ${s.dot}` : 'none',
        animation: status === 'monitoring' ? 'auto-pulse 2s ease-in-out infinite' : 'none',
      }} />
      {label}
    </span>
  );
}

// ─── Automation card (M3 Filled Card) ────────────────────────────────────────
function AutomationCard({ automation }: { automation: Automation }) {
  const { toggleAutomation, removeAutomation } = useAutomationStore();
  const [hovered, setHovered] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const sc = T.statusColors[automation.status] ?? T.statusColors.idle;

  const isLong = automation.action.inputSymbol === 'USDC';
  const condLabel = INDICATOR_LABELS[automation.condition.indicator] ?? automation.condition.indicator;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setDeleteConfirm(false); }}
      style={{
        borderRadius: 20,
        background: hovered ? T.surfaceHighest : T.surfaceHigh,
        border: `1px solid ${hovered ? sc.dot + '30' : T.outline}`,
        padding: '20px 22px',
        transition: 'all 0.25s cubic-bezier(0.2,0,0,1)',
        boxShadow: hovered
          ? `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${sc.dot}18`
          : '0 2px 8px rgba(0,0,0,0.2)',
        transform: hovered ? 'translateY(-2px)' : 'none',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${sc.dot}00, ${sc.dot}, ${sc.dot}00)`,
        opacity: automation.enabled ? 1 : 0,
        transition: 'opacity 0.3s',
      }} />

      {/* Row 1: Name + Status + Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        {/* Icon bubble */}
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: T.primaryContainer,
          border: `1px solid ${T.primary}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>
          🤖
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 15, fontWeight: 700, color: T.onSurface,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            marginBottom: 4,
          }}>
            {automation.name}
          </div>
          <StatusChip status={automation.status} />
        </div>
        <M3Switch value={automation.enabled} onChange={() => toggleAutomation(automation.id)} />
      </div>

      {/* Row 2: Condition / Action (M3 tonal surface block) */}
      <div style={{
        borderRadius: 14, background: T.surfaceContainer,
        border: `1px solid ${T.outlineVariant}`,
        padding: '14px 16px', marginBottom: 14,
      }}>
        {/* Direction badge */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 800,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            background: isLong ? T.secondaryContainer : T.errorContainer,
            color: isLong ? T.secondary : T.error,
            border: `1px solid ${isLong ? T.secondary : T.error}30`,
          }}>
            {isLong ? '↗' : '↘'} {isLong ? 'LONG' : 'SHORT'}
          </span>
          <span style={{
            fontSize: 10, color: T.onSurfaceMuted,
            background: 'rgba(255,255,255,0.04)',
            padding: '3px 8px', borderRadius: 6,
            border: `1px solid ${T.outlineVariant}`,
          }}>
            Slippage {automation.action.slippageBps / 100}%
          </span>
        </div>

        {/* IF / THEN lines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            {
              keyword: 'IF',
              text: `${condLabel} ${automation.condition.operator} ${automation.condition.threshold}`,
              color: T.primary,
            },
            {
              keyword: 'THEN',
              text: `Swap ${automation.action.amount} ${automation.action.inputSymbol} → ${automation.action.outputSymbol}`,
              color: T.secondary,
            },
          ].map(({ keyword, text, color }) => (
            <div key={keyword} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: '0.1em',
                color, fontFamily: 'monospace', flexShrink: 0, minWidth: 32,
              }}>
                {keyword}
              </span>
              <span style={{
                fontSize: 12, fontFamily: 'monospace', color: T.onSurface,
                fontWeight: 600, letterSpacing: '0.01em',
              }}>
                {text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Row 3: Meta + Delete */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {automation.lastTriggered && (
            <span style={{ fontSize: 11, color: T.onSurfaceMuted }}>
              Last triggered {formatRelativeTime(new Date(automation.lastTriggered))}
            </span>
          )}
          <span style={{ fontSize: 10, color: T.onSurfaceMuted }}>
            Created {formatRelativeTime(new Date(automation.createdAt))}
          </span>
        </div>

        {/* Delete — two-step confirm */}
        {deleteConfirm ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setDeleteConfirm(false)} style={{
              padding: '5px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600,
              background: 'transparent', border: `1px solid ${T.outline}`, color: T.onSurfaceVar,
              cursor: 'pointer',
            }}>Cancel</button>
            <button onClick={() => removeAutomation(automation.id)} style={{
              padding: '5px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700,
              background: T.errorContainer, border: `1px solid ${T.error}40`, color: T.error,
              cursor: 'pointer',
            }}>Confirm Delete</button>
          </div>
        ) : (
          <button onClick={() => setDeleteConfirm(true)} style={{
            padding: '5px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600,
            background: 'transparent', border: `1px solid transparent`, color: T.onSurfaceMuted,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = T.errorContainer;
            (e.currentTarget as HTMLElement).style.color = T.error;
            (e.currentTarget as HTMLElement).style.borderColor = `${T.error}40`;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = T.onSurfaceMuted;
            (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
          }}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ connected }: { connected: boolean }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 20, padding: '80px 32px',
      textAlign: 'center',
    }}>
      {/* Animated icon */}
      <div style={{
        width: 96, height: 96, borderRadius: 28,
        background: T.primaryContainer,
        border: `1px solid ${T.primary}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 42,
        boxShadow: `0 0 40px ${T.primaryDim}30`,
        animation: 'auto-float 3s ease-in-out infinite',
      }}>
        {connected ? '🤖' : '🔒'}
      </div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: T.onSurface, marginBottom: 8 }}>
          {connected ? 'No Automations Yet' : 'Wallet Required'}
        </div>
        <div style={{ fontSize: 14, color: T.onSurfaceVar, maxWidth: 320, lineHeight: 1.6 }}>
          {connected
            ? 'Create IF/THEN rules that automatically execute trades when macroeconomic conditions are met.'
            : 'Connect your wallet to view and manage your automated trading rules.'}
        </div>
      </div>
    </div>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────
function StatsBar({ automations }: { automations: Automation[] }) {
  const counts = {
    total:     automations.length,
    active:    automations.filter(a => a.enabled && a.status === 'monitoring').length,
    triggered: automations.filter(a => a.status === 'triggered').length,
    executed:  automations.filter(a => a.status === 'executed').length,
  };

  const stats = [
    { label: 'Total',     value: counts.total,     color: T.primary },
    { label: 'Active',    value: counts.active,     color: '#60A5FA' },
    { label: 'Triggered', value: counts.triggered,  color: T.warning },
    { label: 'Executed',  value: counts.executed,   color: T.secondary },
  ];

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10,
      padding: '0 24px', marginBottom: 8,
    }}>
      {stats.map(({ label, value, color }) => (
        <div key={label} style={{
          borderRadius: 16, padding: '14px 16px',
          background: T.surfaceHigh,
          border: `1px solid ${T.outline}`,
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <span style={{ fontSize: 22, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>
            {value}
          </span>
          <span style={{ fontSize: 11, color: T.onSurfaceMuted, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function AutomationsScreen() {
  const navigate = useNavigate();
  const { connected, publicKey } = useWalletStore();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const { automations } = useAutomationStore();

  const userAutomations = (automations || []).filter(
    a => !publicKey || a.walletAddress === publicKey
  );

  const filtered = userAutomations.filter(a => {
    if (activeFilter === 'all')       return true;
    if (activeFilter === 'active')    return a.enabled && a.status === 'monitoring';
    if (activeFilter === 'triggered') return a.status === 'triggered';
    if (activeFilter === 'executed')  return a.status === 'executed';
    return true;
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: T.surface,
      fontFamily: '"Inter", system-ui, sans-serif',
    }}>
      {/* ── Keyframe animations ── */}
      <style>{`
        @keyframes auto-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes auto-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes auto-fade-in {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .auto-card-enter {
          animation: auto-fade-in 0.35s cubic-bezier(0.2, 0, 0, 1) both;
        }
        .auto-filter-btn:hover { opacity: 0.85; }
        .auto-cta-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 32px rgba(124,58,237,0.4) !important; }
        .auto-cta-btn:active { transform: scale(0.98); }
      `}</style>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 0 80px' }}>

        {/* ── Header ── */}
        <div style={{ padding: '0 24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <h1 style={{
                margin: 0, fontSize: 32, fontWeight: 900, letterSpacing: '-0.5px',
                color: T.onSurface, lineHeight: 1.1, marginBottom: 6,
              }}>
                Automations
              </h1>
              <p style={{ margin: 0, fontSize: 14, color: T.onSurfaceVar }}>
                Macro-triggered trading rules that execute automatically
              </p>
            </div>

            {/* CTA button */}
            <button
              className="auto-cta-btn"
              onClick={() => navigate('/create-automation')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 22px', borderRadius: 16, border: 'none',
                background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
                color: '#fff', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', flexShrink: 0,
                boxShadow: '0 4px 20px rgba(124,58,237,0.3)',
                transition: 'all 0.2s cubic-bezier(0.2,0,0,1)',
              }}
            >
              <span style={{ fontSize: 16 }}>⚡</span>
              New Rule
            </button>
          </div>
        </div>

        {/* ── Stats bar (only when connected and has automations) ── */}
        {connected && userAutomations.length > 0 && (
          <StatsBar automations={userAutomations} />
        )}

        {/* ── Filter chips (M3 Filter Chip) ── */}
        <div style={{
          display: 'flex', gap: 8, padding: '16px 24px',
          overflowX: 'auto', scrollbarWidth: 'none',
        }}>
          {FILTERS.map((f, i) => {
            const active = activeFilter === f.key;
            const count  = f.key === 'all' ? userAutomations.length
              : f.key === 'active'    ? userAutomations.filter(a => a.enabled && a.status === 'monitoring').length
              : userAutomations.filter(a => a.status === f.key as AutomationStatus).length;
            return (
              <button
                key={f.key}
                className="auto-filter-btn"
                onClick={() => setActiveFilter(f.key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 18px', borderRadius: 100, border: 'none',
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
                  background: active ? T.primaryContainer : T.surfaceHigh,
                  color: active ? T.primary : T.onSurfaceVar,
                  border: `1px solid ${active ? T.primary + '50' : T.outline}`,
                  transition: 'all 0.2s cubic-bezier(0.2,0,0,1)',
                  boxShadow: active ? `0 0 16px ${T.primaryDim}25` : 'none',
                  animation: `auto-fade-in ${0.15 + i * 0.05}s ease both`,
                }}
              >
                <span style={{ fontSize: 12 }}>{f.icon}</span>
                {f.label}
                {count > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 800, minWidth: 18, height: 18,
                    borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: active ? T.primary : 'rgba(255,255,255,0.08)',
                    color: active ? '#fff' : T.onSurfaceMuted,
                    padding: '0 5px',
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Content ── */}
        <div style={{ padding: '8px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!connected || filtered.length === 0 ? (
            <div style={{
              borderRadius: 24, background: T.surfaceHigh,
              border: `1px solid ${T.outline}`,
              overflow: 'hidden',
            }}>
              <EmptyState connected={connected} />
            </div>
          ) : (
            filtered.map((automation, i) => (
              <div
                key={automation.id}
                className="auto-card-enter"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <AutomationCard automation={automation} />
              </div>
            ))
          )}
        </div>

        {/* ── Bottom helper text ── */}
        {connected && userAutomations.length > 0 && (
          <div style={{
            padding: '20px 24px 0',
            display: 'flex', alignItems: 'center', gap: 10,
            borderTop: `1px solid ${T.outlineVariant}`,
            margin: '16px 24px 0',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#60A5FA',
              boxShadow: '0 0 8px #60A5FA',
              animation: 'auto-pulse 2s ease-in-out infinite',
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 12, color: T.onSurfaceMuted }}>
              Active automations poll macroeconomic data every 15 minutes
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
