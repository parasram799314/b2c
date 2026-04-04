// ============================================================
//  LoginPage.jsx
// ============================================================
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Y = 'rgb(247,190,57)';

export default function LoginPage() {
  const { login, register, error, setError } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [tab, setTab]           = useState('login');
  const [name, setName]         = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    if (tab === 'login') {
      await login(email, password);
    } else {
      await register(email, password, name);
    }
    setLoading(false);
  };

  const inp = (extra = {}) => ({
    width: '100%', padding: '10px 13px', fontSize: '14px',
    border: '1.5px solid #e5e7eb', borderRadius: '10px',
    outline: 'none', boxSizing: 'border-box',
    background: '#fafafa', color: '#111827',
    ...extra,
  });

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)',
      fontFamily: "'Segoe UI', sans-serif",
    }}>
      <div style={{
        background: '#fff', borderRadius: '22px',
        padding: '40px 36px', width: '370px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.32)',
      }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: Y, margin: '0 auto 10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24,
          }}>✈️</div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#111827' }}>
            Travel Portal
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
            Sign in to continue
          </p>
        </div>

        {/* Tab switcher — Error se UPAR */}
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 4, marginBottom: 22 }}>
          {['login', 'register'].map(t => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setError(''); }}
              style={{
                flex: 1, padding: '8px', border: 'none', borderRadius: 8,
                fontSize: 13, fontWeight: 800, cursor: 'pointer',
                background: tab === t ? '#fff' : 'transparent',
                color: tab === t ? '#111827' : '#6b7280',
                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {t === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 10, padding: '10px 14px',
            fontSize: 13, color: '#dc2626', marginBottom: 16,
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>

          {/* Name field — sirf register tab mein, email se UPAR */}
          {tab === 'register' && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#374151',
                textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 5 }}>
                Full Name
              </label>
              <input
                type="text" required value={name}
                onChange={e => { setName(e.target.value); setError(''); }}
                placeholder="Rahul Mehta"
                style={inp()}
                onFocus={e => e.target.style.borderColor = Y}
                onBlur={e  => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#374151',
              textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 5 }}>
              Email
            </label>
            <input
              type="email" required value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              placeholder="you@travel.com"
              style={inp()}
              onFocus={e => e.target.style.borderColor = Y}
              onBlur={e  => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={{ marginBottom: 22 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#374151',
              textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 5 }}>
              Password
            </label>
            <input
              type="password" required value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="••••••••"
              style={inp()}
              onFocus={e => e.target.style.borderColor = Y}
              onBlur={e  => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '11px',
              background: loading ? '#fde68a' : Y,
              color: '#1a1a1a', border: 'none', borderRadius: 12,
              fontSize: 14, fontWeight: 800, cursor: 'pointer',
              transition: 'background .2s',
            }}
            onMouseEnter={e => { if (!loading) e.target.style.background = '#e6ad2a'; }}
            onMouseLeave={e => { if (!loading) e.target.style.background = Y; }}
          >
            {/* ✅ Button text dynamic */}
            {loading
              ? (tab === 'login' ? 'Signing in…' : 'Registering…')
              : (tab === 'login' ? 'Sign In →' : 'Create Account →')
            }
          </button>
        </form>

      </div>
    </div>
  );
}