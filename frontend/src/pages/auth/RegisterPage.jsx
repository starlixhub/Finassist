// src/pages/auth/RegisterPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
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
const strengthColors = ['', '#B42318', '#8F5200', '#F59E0B', '#07704A'];

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
    await new Promise(r => setTimeout(r, 600));
    register(form.name.trim(), form.email.trim(), form.password);
    setLoading(false);
    navigate('/onboarding');
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#F5F7FA',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '48px 40px',
        width: '100%', maxWidth: 440,
        boxShadow: '0 8px 40px rgba(15,27,45,0.12)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, background: '#0B6E6E',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 auto 12px',
          }}>F</div>
          <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0F1B2D', marginBottom: 4 }}>Create your account</h3>
          <p style={{ color: '#52607A', fontSize: 13 }}>Start managing your finances smarter</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Full Name" value={form.name} onChange={set('name')} placeholder="Kartik Sharma" required error={errors.name} />
          <Input label="Email address" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required error={errors.email} />
          <div>
            <Input label="Password" type="password" value={form.password} onChange={set('password')} placeholder="Min. 6 characters" required error={errors.password} />
            {form.password && (
              <div style={{ marginTop: 6 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 2,
                      background: i <= strength ? strengthColors[strength] : '#D9E0E9',
                      transition: 'background 0.2s',
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 11, color: strengthColors[strength], fontWeight: 600 }}>
                  {strengthLabels[strength]}
                </span>
              </div>
            )}
          </div>
          <Input label="Confirm Password" type="password" value={form.confirm} onChange={set('confirm')} placeholder="Repeat your password" required error={errors.confirm} />
          <Button type="submit" fullWidth size="lg" loading={loading} style={{ marginTop: 4 }}>
            Create Account
          </Button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#52607A', marginTop: 20 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#0B6E6E', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
