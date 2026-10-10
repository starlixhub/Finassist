// src/components/demo/ProductDemoPlayer.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle, TrendingUp, TrendingDown,
  Target, ChevronRight, LayoutDashboard, ArrowLeftRight,
  BrainCircuit, PieChart, Sparkles, CheckCircle2, Shield
} from 'lucide-react';
import { formatCurrency, formatCurrencySigned } from '../../utils/formatters';

const DURATION_SECONDS = 20;

const CHAPTERS = [
  { id: 'overview', title: '01 Overview', start: 0, end: 4, label: 'Financial Summary', nav: 'dashboard' },
  { id: 'cashflow', title: '02 Cash Flow', start: 4, end: 8, label: 'Income vs Spend', nav: 'reports' },
  { id: 'anomaly', title: '03 Anomaly', start: 8, end: 12, label: 'Anomaly Spotlight', nav: 'coach' },
  { id: 'goals', title: '04 Goals', start: 12, end: 16, label: 'Savings Milestones', nav: 'savings' },
  { id: 'coach', title: '05 AI Coach', start: 16, end: 20, label: 'Smart Suggestions', nav: 'coach' },
];

export default function ProductDemoPlayer() {
  const [currentTime, setCurrentTime] = useState(0);
  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(null);

  // Continuous infinite playback loop with 60fps delta
  useEffect(() => {
    const step = (timestamp) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      setCurrentTime((prev) => {
        const next = prev + delta;
        if (next >= DURATION_SECONDS) {
          return 0; // Infinite seamless loop
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const jumpToChapter = (chapterStart) => {
    setCurrentTime(chapterStart);
  };

  const currentChapterIndex = CHAPTERS.findIndex(
    (c) => currentTime >= c.start && currentTime < c.end
  );
  const activeChapter = CHAPTERS[currentChapterIndex] || CHAPTERS[0];
  const progressPct = (currentTime / DURATION_SECONDS) * 100;

  // Animated Virtual Cursor Positions based on timeline
  const getCursorPosition = () => {
    if (currentTime < 4) {
      // Hovering on Net Cash Flow card
      const sub = (currentTime - 0) / 4;
      return { x: 380 + Math.sin(sub * Math.PI) * 15, y: 110, visible: true, clicking: sub > 0.4 && sub < 0.8 };
    } else if (currentTime < 8) {
      // Hovering on October Spending bar
      const sub = (currentTime - 4) / 4;
      return { x: 260 + Math.sin(sub * Math.PI) * 10, y: 250, visible: true, clicking: true };
    } else if (currentTime < 12) {
      // Hovering on Anomaly Spotlight Banner
      const sub = (currentTime - 8) / 4;
      return { x: 340 + Math.sin(sub * Math.PI) * 12, y: 200, visible: true, clicking: true };
    } else if (currentTime < 16) {
      // Hovering on Savings Goals Progress
      const sub = (currentTime - 12) / 4;
      return { x: 320 + Math.sin(sub * Math.PI) * 10, y: 220, visible: true, clicking: true };
    } else {
      // Hovering on AI Discretionary Recommendation
      const sub = (currentTime - 16) / 4;
      return { x: 310 + Math.sin(sub * Math.PI) * 12, y: 240, visible: true, clicking: true };
    }
  };

  const cursor = getCursorPosition();

  return (
    <div style={{
      position: 'relative',
      borderRadius: 16,
      background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
      border: '1px solid rgba(13,119,118,0.25)',
      boxShadow: '0 28px 70px -15px rgba(16,28,46,0.22), 0 10px 24px -5px rgba(13,119,118,0.12), 0 0 0 1px rgba(220,228,236,0.8)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Subtle ambient light bar at top */}
      <div style={{
        height: 3,
        background: 'linear-gradient(90deg, #4D7C0F, #65A30D, #15803D, #4D7C0F)',
        backgroundSize: '200% 100%',
        animation: 'shimmerBorder 4s linear infinite',
      }} />

      {/* 1. Realistic Browser Window Chrome */}
      <div style={{
        background: '#101C2E',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        {/* Left: Window Controls + URL bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#15803D' }} />
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 6,
            padding: '3px 12px',
            fontSize: 11,
            color: 'rgba(255,255,255,0.85)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'monospace',
          }}>
            <span style={{ color: '#65A30D' }}>https://</span>app.finassist.in/dashboard
          </div>
        </div>

        {/* Right: Live Looping Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#15803D',
            background: 'rgba(16,185,129,0.12)',
            border: '1px solid rgba(16,185,129,0.3)',
            padding: '2px 8px',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            letterSpacing: '0.04em',
          }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#15803D',
              boxShadow: '0 0 8px #15803D',
              animation: 'pulse 1.5s infinite',
            }} />
            LIVE SIMULATION
          </div>

          <span style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#65A30D',
            background: 'rgba(15,150,144,0.15)',
            padding: '2px 8px',
            borderRadius: 4,
          }}>
            {activeChapter.label}
          </span>
        </div>
      </div>

      {/* 2. Main Application Body with Mini Sidebar + Workspace */}
      <div style={{
        display: 'flex',
        minHeight: 400,
        background: '#F4F7FA',
        position: 'relative',
        userSelect: 'none',
        overflow: 'hidden',
      }}>
        {/* A. Mini Sidebar */}
        <div style={{
          width: 54,
          background: '#101C2E',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '14px 0',
          gap: 16,
          flexShrink: 0,
        }}>
          {/* Logo badge */}
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: '#4D7C0F', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 900,
            boxShadow: '0 2px 8px rgba(13,119,118,0.4)',
          }}>
            F
          </div>

          {/* Sidebar Nav Icons with dynamic highlight */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            {[
              { icon: LayoutDashboard, nav: 'dashboard', tip: 'Dashboard' },
              { icon: ArrowLeftRight, nav: 'transactions', tip: 'Transactions' },
              { icon: BrainCircuit, nav: 'coach', tip: 'AI Coach' },
              { icon: Target, nav: 'savings', tip: 'Savings Goals' },
              { icon: PieChart, nav: 'budgets', tip: 'Budgets' },
            ].map(({ icon: Icon, nav }) => {
              const isActive = activeChapter.nav === nav;
              return (
                <div
                  key={nav}
                  style={{
                    width: 34, height: 34, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isActive ? 'rgba(13,119,118,0.35)' : 'transparent',
                    color: isActive ? '#65A30D' : 'rgba(255,255,255,0.45)',
                    borderLeft: isActive ? '2px solid #65A30D' : '2px solid transparent',
                    transition: 'all 0.25s ease',
                  }}
                >
                  <Icon size={16} />
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 'auto', width: 26, height: 26, borderRadius: '50%', background: '#4D7C0F', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
            KS
          </div>
        </div>

        {/* B. Simulated Dashboard Workspace Area */}
        <div style={{
          flex: 1,
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          position: 'relative',
        }}>
          {/* Internal Top Bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid #DCE4EC', paddingBottom: 10,
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#17243A' }}>
                Financial Overview & Intelligence
              </div>
              <div style={{ fontSize: 11, color: '#65738A' }}>
                October 2026 Statement • 25 Verified Records Loaded
              </div>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#FFFFFF', border: '1px solid #DCE4EC',
              borderRadius: 20, padding: '3px 10px', fontSize: 11, color: '#17243A', fontWeight: 600,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4D7C0F' }} />
              Statement Verified
            </div>
          </div>

          {/* 4 KPI METRIC CARDS (Always visible with animated accent border) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              { label: 'Monthly Income', val: formatCurrency(75000), sub: 'Fixed Salary', up: true, badge: '+100%', key: 'inc' },
              { label: 'Total Expenses', val: formatCurrency(63530), sub: 'Spike Month', up: false, badge: 'High', key: 'exp' },
              { label: 'Net Cash Flow', val: formatCurrencySigned(11470), sub: 'Healthy Surplus', up: true, badge: 'Surplus', key: 'net' },
              { label: 'Savings Rate', val: '15.3%', sub: 'Target: 20%', up: true, badge: 'On Track', key: 'sav' },
            ].map((m) => {
              const isCardActive = activeChapter.id === 'overview' && (m.key === 'net' || m.key === 'exp');
              return (
                <div
                  key={m.label}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 8,
                    padding: '9px 11px',
                    border: '1px solid #DCE4EC',
                    borderTop: isCardActive ? '3px solid #4D7C0F' : '3px solid #E2E8F0',
                    boxShadow: isCardActive
                      ? '0 8px 18px rgba(13,119,118,0.15)'
                      : '0 1px 3px rgba(16,28,46,0.03)',
                    transform: isCardActive ? 'scale(1.03)' : 'scale(1)',
                    transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#65738A', textTransform: 'uppercase' }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#17243A', marginTop: 2 }}>
                    {m.val}
                  </div>
                  <div style={{
                    fontSize: 9, marginTop: 3, display: 'flex', alignItems: 'center', gap: 3,
                    color: m.up ? '#07704A' : '#B42318', fontWeight: 600
                  }}>
                    {m.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {m.sub}
                  </div>
                </div>
              );
            })}
          </div>

          {/* DYNAMIC SCENE PANELS */}
          <div style={{ flex: 1, position: 'relative', minHeight: 220 }}>
            {/* 1. SCENE: OVERVIEW & CASH FLOW */}
            {(activeChapter.id === 'overview' || activeChapter.id === 'cashflow') && (
              <div style={{
                display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 10,
                height: '100%', animation: 'fadeInScale 0.35s ease'
              }}>
                {/* Visual Bar Comparison with hover tooltip */}
                <div style={{
                  background: '#FFFFFF', borderRadius: 10, padding: 12,
                  border: '1px solid #DCE4EC', display: 'flex', flexDirection: 'column',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#17243A' }}>
                      Cash Flow Comparison (3 Months)
                    </span>
                    <span style={{ fontSize: 9, fontWeight: 600, color: '#4D7C0F', background: '#F7FEE7', padding: '1px 6px', borderRadius: 4 }}>
                      Monthly Burn Model
                    </span>
                  </div>

                  {/* Simulated Chart Bars */}
                  <div style={{
                    flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around',
                    paddingTop: 10, borderBottom: '1px dashed #DCE4EC'
                  }}>
                    {[
                      { month: 'Aug', inc: 88, exp: 34, incVal: formatCurrency(75000), expVal: formatCurrency(28250) },
                      { month: 'Sep', inc: 88, exp: 35, incVal: formatCurrency(75000), expVal: formatCurrency(29050) },
                      { month: 'Oct (Spike)', inc: 88, exp: 78, incVal: formatCurrency(75000), expVal: formatCurrency(63530), isAnomaly: true },
                    ].map((b) => (
                      <div key={b.month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 115, position: 'relative' }}>
                          {/* Floating interactive tooltip on Oct */}
                          {b.isAnomaly && activeChapter.id === 'cashflow' && (
                            <div style={{
                              position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)',
                              background: '#101C2E', color: '#fff', fontSize: 9, fontWeight: 700,
                              padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap',
                              boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                            }}>
                              {formatCurrency(63530)} (+Hardware Spike)
                            </div>
                          )}

                          {/* Income Bar */}
                          <div style={{
                            width: 20, height: `${b.inc}%`,
                            background: 'linear-gradient(180deg, #65A30D 0%, #4D7C0F 100%)',
                            borderRadius: '4px 4px 0 0',
                            boxShadow: '0 2px 6px rgba(13,119,118,0.2)',
                            transition: 'height 0.6s ease',
                          }} />

                          {/* Expense Bar */}
                          <div style={{
                            width: 20, height: `${b.exp}%`,
                            background: b.isAnomaly ? 'linear-gradient(180deg, #EF4444 0%, #B42318 100%)' : '#94A3B8',
                            borderRadius: '4px 4px 0 0',
                            boxShadow: b.isAnomaly ? '0 2px 8px rgba(180,35,24,0.3)' : 'none',
                            transition: 'height 0.6s ease',
                          }} />
                        </div>
                        <span style={{ fontSize: 9, fontWeight: 700, color: b.isAnomaly ? '#B42318' : '#65738A' }}>
                          {b.month}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#65738A' }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: '#4D7C0F' }} /> Income
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#65738A' }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: '#B42318' }} /> Expenses
                    </div>
                  </div>
                </div>

                {/* Categories */}
                <div style={{
                  background: '#FFFFFF', borderRadius: 10, padding: 12,
                  border: '1px solid #DCE4EC', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#17243A' }}>
                    Category Breakdown
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      { name: 'Rent (Fixed)', amt: formatCurrency(15000), pct: 24, color: '#4D7C0F' },
                      { name: 'Shopping (Discretionary)', amt: formatCurrency(7500), pct: 12, color: '#8B5CF6' },
                      { name: 'Transport (Transit/Fuel)', amt: formatCurrency(3370), pct: 5, color: '#3B82F6' },
                      { name: 'Utilities (MSEB/Bills)', amt: formatCurrency(3068), pct: 5, color: '#6B7280' },
                      { name: 'Food & Dining (Swiggy)', amt: formatCurrency(2990), pct: 5, color: '#F59E0B' },
                    ].map((cat) => (
                      <div key={cat.name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
                          <span style={{ fontWeight: 600, color: '#17243A' }}>{cat.name}</span>
                          <span style={{ color: '#65738A' }}>{cat.amt}</span>
                        </div>
                        <div style={{ height: 4, background: '#F1F5F9', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${cat.pct * 3}%`,
                            background: cat.color, borderRadius: 2,
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. SCENE: ANOMALY SPOTLIGHT - WOW MOMENT */}
            {activeChapter.id === 'anomaly' && (
              <div style={{
                background: '#FFFFFF', borderRadius: 10, padding: 14,
                border: '2px solid #F59E0B',
                boxShadow: '0 12px 28px rgba(245,158,11,0.22)',
                height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                animation: 'pulseGlow 2s infinite',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        padding: 6, borderRadius: 6, background: '#FFFBEB', color: '#D97706',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <AlertTriangle size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#92400E' }}>
                          Single Largest Outlier Detected
                        </div>
                        <div style={{ fontSize: 10, color: '#B45309' }}>
                          Explainable AI Rule Engine • Verified Math
                        </div>
                      </div>
                    </div>
                    <div style={{
                      padding: '3px 8px', borderRadius: 12, background: '#FEF3C7',
                      border: '1px solid #FCD34D', color: '#B45309', fontSize: 11, fontWeight: 800
                    }}>
                      +6,767.5% Above Baseline
                    </div>
                  </div>

                  <div style={{
                    background: '#FFFDF5', border: '1px solid #FDE68A',
                    borderRadius: 8, padding: '10px 12px', marginBottom: 8
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#17243A' }}>
                          Emergency Laptop Motherboard Repair
                        </div>
                        <div style={{ fontSize: 10, color: '#65738A', marginTop: 1 }}>
                          2026-10-18 • Category: Uncategorized Baseline: {formatCurrency(415)}
                        </div>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: '#B42318' }}>
                        -{formatCurrency(28500)}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: 11, color: '#4B5563', lineHeight: 1.5, background: '#F8FAFC', padding: 8, borderRadius: 6 }}>
                    <strong>Explainable AI Narrative:</strong> This unexpected {formatCurrency(28500)} outlay accounts for 44.8% of October expenses. Without this one-time spike, your true savings rate is 53.3% with an adjusted surplus of +{formatCurrency(39970)}.
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: '#4D7C0F', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                    Shortage prevention algorithm engaged <ChevronRight size={12} />
                  </span>
                </div>
              </div>
            )}

            {/* 3. SCENE: SAVINGS GOALS */}
            {activeChapter.id === 'goals' && (
              <div style={{
                background: '#FFFFFF', borderRadius: 10, padding: 14,
                border: '1px solid #DCE4EC', height: '100%',
                display: 'flex', flexDirection: 'column', gap: 8,
                animation: 'fadeInScale 0.35s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Target size={16} style={{ color: '#4D7C0F' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#17243A' }}>
                      Active Financial Targets & Feasibility
                    </span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#07704A', background: '#E6F5F0', padding: '2px 8px', borderRadius: 10 }}>
                    100% Mathematically Feasible
                  </span>
                </div>

                {/* Goal 1 */}
                <div style={{ background: '#F8F7F4', borderRadius: 8, padding: 10, border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#17243A' }}>
                      Emergency Reserve (6-Month Runway)
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#4D7C0F' }}>
                      {formatCurrency(45000)} / {formatCurrency(150000)} (30%)
                    </span>
                  </div>
                  <div style={{ height: 6, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden', margin: '4px 0' }}>
                    <div style={{
                      height: '100%', width: '30%',
                      background: 'linear-gradient(90deg, #4D7C0F, #65A30D)',
                      borderRadius: 4
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#65738A' }}>
                    <span>Target Date: 31 Mar 2027</span>
                    <span>Required: {formatCurrency(2000)}/mo (Covered by Surplus)</span>
                  </div>
                </div>

                {/* Goal 2 */}
                <div style={{ background: '#F8F7F4', borderRadius: 8, padding: 10, border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#17243A' }}>
                      Work Laptop Upgrade
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#65A30D' }}>
                      {formatCurrency(20000)} / {formatCurrency(80000)} (25%)
                    </span>
                  </div>
                  <div style={{ height: 6, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden', margin: '4px 0' }}>
                    <div style={{ height: '100%', width: '25%', background: '#65A30D', borderRadius: 4 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#65738A' }}>
                    <span>Target Date: 31 Jan 2027</span>
                    <span>Surplus Allocation: Active</span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. SCENE: AI COACH RECOMMENDATIONS */}
            {activeChapter.id === 'coach' && (
              <div style={{
                background: '#FFFFFF', borderRadius: 10, padding: 14,
                border: '1px solid #DCE4EC', height: '100%',
                display: 'flex', flexDirection: 'column', gap: 8,
                animation: 'fadeInScale 0.35s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <BrainCircuit size={16} style={{ color: '#4D7C0F' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#17243A' }}>
                      Explainable Financial Insights (No Chatbot)
                    </span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#4D7C0F', background: '#F7FEE7', padding: '2px 8px', borderRadius: 10 }}>
                    High Confidence
                  </span>
                </div>

                {/* Insight 1 */}
                <div style={{
                  background: '#F0FDF4', border: '1px solid #BBF7D0',
                  borderRadius: 6, padding: '8px 10px'
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#166534' }}>
                    Discretionary Cut Suggestion: Dining & Food Delivery
                  </div>
                  <div style={{ fontSize: 10, color: '#14532D', marginTop: 2 }}>
                    Trimming Swiggy/Zomato food orders by 20% recovers {formatCurrency(598)}/month toward your Emergency Fund without affecting essential groceries or utilities.
                  </div>
                </div>

                {/* Insight 2 */}
                <div style={{
                  background: '#F8F7F4', border: '1px solid #E2E8F0',
                  borderRadius: 6, padding: '8px 10px'
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#17243A' }}>
                    Runway Forecast & Buffer
                  </div>
                  <div style={{ fontSize: 10, color: '#65738A', marginTop: 2 }}>
                    Daily burn rate normalized at {formatCurrency(1130)}/day. Net income sustains a 2.4-month reserve buffer even under elevated expense conditions.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* C. Animated Cursor Simulating Real Human Navigation */}
        <div style={{
          position: 'absolute',
          left: cursor.x,
          top: cursor.y,
          pointerEvents: 'none',
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 40,
        }}>
          {/* Custom SVG Cursor */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.3))' }}>
            <path
              d="M3 3L10.07 20.97L13.58 13.58L20.97 10.07L3 3Z"
              fill="#101C2E"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          {cursor.clicking && (
            <span style={{
              position: 'absolute', left: 14, top: 0,
              width: 14, height: 14, borderRadius: '50%',
              background: 'rgba(13,119,118,0.4)',
              animation: 'ripple 0.5s ease-out',
            }} />
          )}
        </div>
      </div>

      {/* 3. Bottom Seamless Chapter Navigation & Progress Bar */}
      <div style={{
        background: '#101C2E',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>
        {/* Continuous Smooth Progress Track */}
        <div style={{ flex: 1, marginRight: 16 }}>
          <div style={{
            height: 4,
            background: 'rgba(255,255,255,0.12)',
            borderRadius: 2,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #4D7C0F, #65A30D, #15803D)',
              borderRadius: 2,
              transition: 'width 0.1s linear',
            }} />
          </div>
        </div>

        {/* Chapter Quick Jump Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {CHAPTERS.map((ch) => {
            const isActive = activeChapter.id === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => jumpToChapter(ch.start)}
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 500,
                  padding: '3px 8px',
                  borderRadius: 4,
                  background: isActive ? 'rgba(15,150,144,0.35)' : 'transparent',
                  color: isActive ? '#65A30D' : 'rgba(255,255,255,0.5)',
                  border: isActive ? '1px solid rgba(15,150,144,0.45)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {ch.title.split(' ')[1]}
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes shimmerBorder {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 10px 25px rgba(245,158,11,0.18); }
          50% { box-shadow: 0 14px 35px rgba(245,158,11,0.32); }
        }
        @keyframes bounceSlow {
          0%, 100% { transform: translate(-50%, 0); }
          50% { transform: translate(-50%, -3px); }
        }
        @keyframes ripple {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
