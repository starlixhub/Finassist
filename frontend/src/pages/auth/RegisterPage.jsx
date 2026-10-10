// src/pages/auth/RegisterPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import BrandLogo from '../../components/common/BrandLogo';
import { register } from '../../data/mockData';

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColors = ['', '#B91C1C', '#B45309', '#D97706', '#15803D'];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(form.password);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required.';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters.';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    register(form.name.trim(), form.email.trim(), form.password);
    setLoading(false);
    navigate('/onboarding');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F8FAFC',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", sans-serif',
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        padding: '44px 38px',
        width: '100%',
        maxWidth: 440,
        boxShadow: '0 10px 25px -5px rgba(15,23,42,0.08), 0 1px 3px rgba(15,23,42,0.05)',
        border: '1px solid #E2E8F0',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: 12 }}>
            <BrandLogo size={42} showText={false} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.025em', marginBottom: 4 }}>
            Create your account
          </h2>
          <p style={{ color: '#64748B', fontSize: 13 }}>
            Start managing your finances with explainable AI
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input
            label="Full Name"
            value={form.name}
            onChange={set('name')}
            placeholder="Kartik Unhale"
            error={errors.name}
            required
          />
          <Input
            label="Email Address"
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="kartik@example.com"
            error={errors.email}
            required
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={set('password')}
            placeholder="At least 6 characters"
            error={errors.password}
            required
          />

          {/* Password strength meter */}
          {form.password && (
            <div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 2,
                      background: i <= strength ? strengthColors[strength] : '#E2E8F0',
                      transition: 'background 0.2s',
                    }}
                  />
                ))}
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: strengthColors[strength] }}>
                {strengthLabels[strength]}
              </span>
            </div>
          )}

          <Input
            label="Confirm Password"
            type="password"
            value={form.confirm}
            onChange={set('confirm')}
            placeholder="Repeat your password"
            error={errors.confirm}
            required
          />

          <Button
            type="submit"
            fullWidth
            size="md"
            loading={loading}
            style={{ marginTop: 8 }}
          >
            Create Account
          </Button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#64748B', marginTop: 20 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#4D7C0F', fontWeight: 700, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
