// ============================================================
//  LoginPage.jsx
//  Simple email+password form. Role automatically detect hoti hai
//  DUMMY_USERS array se (AuthContext.jsx mein define hai).
// ============================================================
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Y = 'rgb(247,190,57)';   // brand yellow

export default function LoginPage() {
  const { login, error, setError } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    login(email, password);
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
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        {/* Demo hint */}
        <div style={{
          marginTop: 22, padding: '12px 14px',
          background: '#f8fafc', borderRadius: 12,
          border: '1px dashed #e2e8f0', fontSize: 12, color: '#475569',
        }}>
          
       
        </div>
      </div>
    </div>
  );
}
