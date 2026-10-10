// src/pages/auth/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import BrandLogo from '../../components/common/BrandLogo';
import { login, getUser } from '../../data/mockData';
import ProductDemoPlayer from '../../components/demo/ProductDemoPlayer';
import {
  Sparkles, ArrowRight, CheckCircle2,
  KeyRound, BarChart3, AlertTriangle, Target, BrainCircuit,
  Zap, Lock, ShieldCheck
} from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const result = login(email, password);
    setLoading(false);
    if (result.success) {
      const user = getUser();
      navigate(user?.onboardingComplete ? '/dashboard' : '/onboarding');
    } else {
      setError(result.error || 'Invalid credentials.');
    }
  };

  // 1-Click instant demo login for hackathon judges & instant evaluation
  const handleQuickDemoLogin = async () => {
    setEmail('demo@finassist.in');
    setPassword('Demo@123');
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    const result = login('demo@finassist.in', 'Demo@123');
    setLoading(false);
    if (result.success) {
      const user = getUser();
      navigate(user?.onboardingComplete ? '/dashboard' : '/onboarding');
    }
  };

  const handleFillCredentials = () => {
    setEmail('demo@finassist.in');
    setPassword('Demo@123');
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F8FAFC',
      color: '#0F172A',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Plus Jakarta Sans", sans-serif',
      position: 'relative',
      overflowX: 'hidden',
    }}>
      {/* 1. SOLID CLEAN NAVIGATION HEADER */}
      <header style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '0 32px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        {/* Brand Logo with New Folded Hex Mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BrandLogo size={34} showText={true} textColor="#0F172A" accentColor="#65A30D" />
          <span style={{
            fontSize: 10,
            fontWeight: 800,
            color: '#365314',
            background: '#F7FEE7',
            padding: '3px 8px',
            borderRadius: 6,
            letterSpacing: '0.04em',
            border: '1px solid #D9F99D',
          }}>
            AI COPILOT
          </span>
        </div>

        {/* Right header actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            style={{
              background: '#F7FEE7',
              border: '1px solid #D9F99D',
              color: '#365314',
              padding: '7px 15px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'background 0.15s ease',
            }}
            title="Instant 1-click evaluation sign in"
          >
            <Zap size={13} style={{ fill: '#65A30D', color: '#65A30D' }} />
            1-Click Demo Sign-In
          </button>

          <Link
            to="/register"
            style={{
              color: '#0F172A',
              fontSize: 13,
              fontWeight: 600,
              padding: '7px 15px',
              borderRadius: 8,
              textDecoration: 'none',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            Create Account
          </Link>
        </div>
      </header>

      {/* 2. HIGH-IMPACT HERO + CONTINUOUS ANIMATED PRODUCT DEMO */}
      <main style={{
        flex: 1,
        maxWidth: 1340,
        width: '100%',
        margin: '0 auto',
        padding: '36px 32px 52px',
        display: 'flex',
        flexDirection: 'column',
        gap: 40,
        position: 'relative',
        zIndex: 1,
      }}>
        {/* 2-Column Desktop Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(340px, 1fr) minmax(460px, 1.3fr)',
          gap: 36,
          alignItems: 'start',
        }} className="hero-grid">
          {/* LEFT COLUMN: HERO HEADLINE + INTEGRATED SIGN-IN PANEL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {/* Shimmering Eyebrow Pill */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              alignSelf: 'flex-start',
              background: '#F7FEE7',
              border: '1px solid #D9F99D',
              padding: '5px 12px',
              borderRadius: 24,
              fontSize: 11,
              fontWeight: 700,
              color: '#365314',
              letterSpacing: '0.04em',
            }}>
              <Sparkles size={14} style={{ color: '#65A30D' }} />
              EXPLAINABLE AI PERSONAL FINANCE
            </div>

            {/* Dynamic Headline */}
            <div>
              <h1 style={{
                fontSize: 38,
                fontWeight: 800,
                color: '#0F172A',
                lineHeight: 1.18,
                letterSpacing: '-0.03em',
                margin: 0,
              }}>
                Take control of your money.{' '}
                <span style={{
                  color: '#4D7C0F',
                  display: 'inline-block',
                }}>
                  See your financial picture clearly.
                </span>
              </h1>
              <p style={{
                fontSize: 15,
                color: '#475569',
                lineHeight: 1.6,
                marginTop: 12,
                marginBottom: 0,
              }}>
                Understand your spending patterns, track savings targets with verified mathematical runway, and eliminate budget blindspots through one organized platform.
              </p>
            </div>

            {/* Value Proof Badges */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {[
                { bold: 'Deterministic Runway:', text: 'Calculates true burn rate without generative hallucinations' },
                { bold: 'Anomaly Spotlight:', text: 'Pinpoints emergency spikes like hardware repairs automatically' },
                { bold: 'Discretionary Trims:', text: 'Actionable savings advice preserving fixed rent & utilities' },
              ].map((item) => (
                <div key={item.bold} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13, color: '#334155' }}>
                  <CheckCircle2 size={16} style={{ color: '#4D7C0F', flexShrink: 0, marginTop: 2 }} />
                  <span>
                    <strong>{item.bold}</strong> {item.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Integrated Login Panel Card */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: 14,
              padding: '24px 24px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 10px 25px -5px rgba(15,23,42,0.06), 0 1px 3px rgba(15,23,42,0.04)',
              position: 'relative',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
                    Sign in to your account
                  </h2>
                  <p style={{ fontSize: 12, color: '#64748B', marginTop: 3, marginBottom: 0 }}>
                    Access your live financial dashboard
                  </p>
                </div>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4D7C0F'
                }}>
                  <Lock size={15} />
                </div>
              </div>

              {error && (
                <div style={{
                  padding: '9px 12px',
                  borderRadius: 6,
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#B91C1C',
                  fontSize: 12,
                  marginBottom: 14,
                  fontWeight: 600,
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Input
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />

                <Button
                  type="submit"
                  fullWidth
                  size="md"
                  loading={loading}
                  style={{
                    marginTop: 4,
                    background: '#4D7C0F',
                    border: '1px solid #3F660C',
                    height: 42,
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                  icon={<ArrowRight size={15} />}
                >
                  Sign In to Dashboard
                </Button>
              </form>

              {/* Demo Credentials Box */}
              <div style={{
                marginTop: 16,
                padding: '12px 14px',
                borderRadius: 8,
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <KeyRound size={12} style={{ color: '#4D7C0F' }} />
                    Demo Credentials:
                  </div>
                  <div style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace', marginTop: 2 }}>
                    demo@finassist.in • Demo@123
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={handleFillCredentials}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#365314',
                      background: '#F7FEE7',
                      border: '1px solid #D9F99D',
                      padding: '4px 9px',
                      borderRadius: 6,
                      cursor: 'pointer',
                    }}
                  >
                    Autofill
                  </button>

                  <button
                    type="button"
                    onClick={handleQuickDemoLogin}
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#FFFFFF',
                      background: '#4D7C0F',
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: 6,
                      cursor: 'pointer',
                    }}
                  >
                    Instant Login →
                  </button>
                </div>
              </div>

              <div style={{
                marginTop: 14,
                textAlign: 'center',
                fontSize: 12,
                color: '#64748B',
                borderTop: '1px solid #F1F5F9',
                paddingTop: 12,
              }}>
                Need a new financial profile?{' '}
                <Link to="/register" style={{ color: '#4D7C0F', fontWeight: 700, textDecoration: 'none' }}>
                  Create an account
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: CONTINUOUS PRODUCT DEMONSTRATION WINDOW WITH FLOATING BADGES */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                  Live Interactive Walkthrough
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: '#365314',
                  background: '#F7FEE7', padding: '2px 8px', borderRadius: 12,
                  border: '1px solid #D9F99D',
                }}>
                  CONTINUOUS DEMO
                </span>
              </div>
              <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>
                Interactive preview
              </span>
            </div>

            {/* The Continuous Video Player Container */}
            <div style={{ position: 'relative' }}>
              <ProductDemoPlayer />

              {/* Floating Live Badge 1: Top Right */}
              <div style={{
                position: 'absolute',
                top: -12,
                right: 20,
                background: '#FFFFFF',
                borderRadius: 20,
                padding: '6px 12px',
                border: '1px solid #FCD34D',
                boxShadow: '0 8px 16px rgba(245,158,11,0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                zIndex: 30,
                animation: 'floatSlow 4s ease-in-out infinite',
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#92400E' }}>
                  ₹28.5k Anomaly Spotted
                </span>
              </div>

              {/* Floating Live Badge 2: Bottom Left */}
              <div style={{
                position: 'absolute',
                bottom: -10,
                left: 20,
                background: '#FFFFFF',
                borderRadius: 20,
                padding: '6px 12px',
                border: '1px solid #BBF7D0',
                boxShadow: '0 8px 16px rgba(21,128,61,0.12)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                zIndex: 30,
                animation: 'floatSlow 4s ease-in-out infinite 2s',
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#15803D' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#15803D' }}>
                  +₹11,470 Surplus Verified
                </span>
              </div>
            </div>

            {/* Helper Caption */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontSize: 11, color: '#64748B', padding: '0 4px', marginTop: 4
            }}>
              <span>Built in React • No video streams</span>
              <span>100% Deterministic Financial Logic</span>
            </div>
          </div>
        </div>

        {/* 3. CORE APPLICATION CAPABILITY CARDS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16,
          marginTop: 12,
        }}>
          {[
            {
              icon: <BarChart3 size={19} style={{ color: '#4D7C0F' }} />,
              title: 'Statement Ingestion',
              desc: 'Seamless CSV parsing supporting flexible dates and debit/credit columns without manual data entry.',
            },
            {
              icon: <AlertTriangle size={19} style={{ color: '#D97706' }} />,
              title: 'Explainable Anomaly Spotlight',
              desc: 'Identifies one-off emergency expenditure spikes (+6,767% deviation) without hiding them in averages.',
            },
            {
              icon: <Target size={19} style={{ color: '#4D7C0F' }} />,
              title: 'Mathematical Savings Milestones',
              desc: 'Calculates exact required monthly surplus to hit targets, distinguishing feasible goals from unrealistic dreams.',
            },
            {
              icon: <BrainCircuit size={19} style={{ color: '#65A30D' }} />,
              title: 'Insights-Only AI Financial Coach',
              desc: 'Dedicated intelligence hub recommending 20% discretionary trims without chatbot hallucinations.',
            },
          ].map((card) => (
            <div
              key={card.title}
              style={{
                background: '#FFFFFF',
                borderRadius: 12,
                padding: '20px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 8,
                background: '#F8FAFC', border: '1px solid #E2E8F0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {card.icon}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>
                {card.title}
              </div>
              <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.55 }}>
                {card.desc}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* 4. FOOTER */}
      <footer style={{
        background: '#FFFFFF',
        borderTop: '1px solid #E2E8F0',
        padding: '18px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 12,
        color: '#64748B',
        marginTop: 'auto',
      }}>
        <div>
          © 2026 FinAssist. An explainable AI personal finance copilot.
        </div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ShieldCheck size={14} style={{ color: '#15803D' }} /> Privacy-First Architecture
          </span>
          <span>Zero External Video Dependencies</span>
        </div>
      </footer>

      {/* Global Hero Animations & Breakpoints */}
      <style>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @media (max-width: 980px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
