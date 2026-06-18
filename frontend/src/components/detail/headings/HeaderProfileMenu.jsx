import { useState, useRef, useEffect } from 'react';
import MyProfileDashboard from './MyProfileDashboard';


// ─── Inline SVG Icons ─────────────────────────────────────────────────────────
const IconUser = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconBriefcase = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
  </svg>
);
const IconLogOut = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconShield = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconSettings = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>
  </svg>
);
const IconSync = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/>
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>
  </svg>
);
const IconCheck = ({ size = 12, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 12 4 9"/>
  </svg>
);
const IconClose = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

// ─── Main Component ───────────────────────────────────────────────────────────
/**
 * HeaderProfileMenu — Chrome-style professional profile popup
 *
 * Props:
 *  - user              : { displayName, email, role }
 *  - onLogout          : () => void
 *  - onOpenHRDashboard : () => void  (shown only when role === 'hr')
 *  - activeProfile     : 'business' | 'personal'
 *  - onSwitchProfile   : (type) => void
 */
export default function HeaderProfileMenu({
  user,
  onLogout,
  onOpenHRDashboard,
  onOpenAdminDashboard,
  activeProfile = 'business',
  onSwitchProfile,
}) {
  const [open, setOpen] = useState(false);
  const [showMyProfile, setShowMyProfile] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isHR      = user?.role === 'hr';
  const isManager = user?.role === 'manager';
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const email       = user?.email || '';
  const initials    = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = () => {
    setOpen(false);
    if (window.confirm('Are you sure you want to logout?')) onLogout?.();
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>

      {/* ── Trigger button — initials avatar ── */}
      <button
        onClick={() => setOpen(v => !v)}
        title={displayName}
        style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: 'linear-gradient(135deg, rgb(247,190,57) 0%, #d9920a 100%)',
          border: open ? '2.5px solid rgba(0,0,0,0.2)' : '2.5px solid rgba(255,255,255,0.75)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontWeight: 800, color: '#1a1a1a',
          boxShadow: open ? '0 0 0 3px rgba(247,190,57,0.45)' : '0 1px 5px rgba(0,0,0,0.18)',
          transition: 'all 0.18s ease', flexShrink: 0,
          letterSpacing: '-0.3px',
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.boxShadow = '0 0 0 3px rgba(247,190,57,0.35)'; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.boxShadow = '0 1px 5px rgba(0,0,0,0.18)'; }}
      >
        {initials}
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 12px)', right: 0,
          width: '304px',
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.06)',
          border: '1px solid #e4e4e4',
          overflow: 'hidden',
          zIndex: 3000,
          fontFamily: "'DM Sans','Outfit','Segoe UI',sans-serif",
          animation: 'tpChromeIn 0.18s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
            @keyframes tpChromeIn {
              from { opacity:0; transform:translateY(-10px) scale(0.96); }
              to   { opacity:1; transform:translateY(0) scale(1); }
            }
            .tpm-item { display:flex; align-items:center; width:100%; gap:12px; padding:10px 16px; background:transparent; border:none; cursor:pointer; text-align:left; box-sizing:border-box; transition:background 0.12s; }
            .tpm-item:hover { background:#f5f5f5 !important; }
            .tpm-item:active { background:#ebebeb !important; }
          `}</style>

          {/* ── TOP SECTION: big avatar, name, email, quick actions ── */}
          <div style={{
            padding: '22px 20px 18px',
            background: 'linear-gradient(170deg, #fffcf0 0%, #fff9e6 100%)',
            borderBottom: '1px solid #f3f4f6',
            textAlign: 'center',
            position: 'relative',
          }}>
            {/* X close button top-right */}
            <button
              onClick={() => setOpen(false)}
              style={{
                position: 'absolute', top: '10px', right: '10px',
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'rgba(0,0,0,0.04)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
            >
              <IconClose size={13} color="#666" />
            </button>

            {/* Large Avatar */}
            <div style={{
              width: '76px', height: '76px', borderRadius: '50%', margin: '0 auto 14px',
              background: 'linear-gradient(135deg, rgb(247,190,57) 0%, #d9920a 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px', fontWeight: 800, color: '#1a1a1a',
              letterSpacing: '-1px',
              boxShadow: '0 0 0 4px #fff, 0 4px 18px rgba(247,190,57,0.4)',
            }}>
              {initials}
            </div>

            {/* Name */}
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#111', letterSpacing: '-0.3px', marginBottom: '4px' }}>
              {displayName}
            </div>

            {/* Email */}
            <div style={{ fontSize: '12.5px', color: '#666', marginBottom: '12px', letterSpacing: '0.01em' }}>
              {email}
            </div>

            {/* Role pill */}
            {user?.role && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '4px 12px', borderRadius: '20px', marginBottom: '16px',
                background: isHR ? '#111827' : isManager ? '#1565c0' : 'rgba(247,190,57,0.22)',
                color: (isHR || isManager) ? '#fff' : '#7a5200',
                fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              }}>
                {isHR && <IconShield size={9} color="#fff" />}
                {user.role}
              </div>
            )}

            {/* Quick icon row — like Chrome's key/card/location icons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              {[
                { icon: <IconSync size={15} color="#444" />,      label: 'Sync on'       },
                { icon: <IconBriefcase size={15} color="#444" />, label: 'Work profile'  },
                { icon: <IconSettings size={15} color="#444" />,  label: 'Preferences'   },
              ].map(({ icon, label }) => (
                <button
                  key={label}
                  title={label}
                  style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.88)',
                    border: '1px solid rgba(0,0,0,0.08)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.13)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.88)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)'; }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* ── HR Admin Panel ── */}
          {isHR && (
            <>
              <button className="tpm-item" onClick={() => { setOpen(false); onOpenHRDashboard?.(); }}>
                <span style={{
                  width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
                  background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <IconShield size={16} color="#fff" />
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>Admin Panel</div>
                  <div style={{ fontSize: '11px', color: '#999', marginTop: '1px' }}>Manage employees & trips</div>
                </div>
                <IconChevronRight />
              </button>
              <button className="tpm-item" onClick={() => { setOpen(false); onOpenAdminDashboard?.(); }}>
  <span style={{
    width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
    background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  </span>
  <div style={{ flex: 1 }}>
    <div style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>Admin Dashboard</div>
    <div style={{ fontSize: '11px', color: '#999', marginTop: '1px' }}>Stats, users, approvals</div>
  </div>
</button>
              <div style={{ height: '1px', background: '#f0f0f0' }} />
            </>
          )}

          {/* ── Switch Profile heading ── */}
          <div style={{
            padding: '10px 16px 5px',
            fontSize: '10px', fontWeight: 700, color: '#b0b0b0',
            letterSpacing: '0.09em', textTransform: 'uppercase',
          }}>
            Switch Profile
          </div>

          {/* My Profile  */}
          <ProfileRow
            icon={<IconBriefcase size={15} color={activeProfile === 'business' ? '#1a1a1a' : '#777'} />}
            iconBg={activeProfile === 'business' ? 'rgb(247,190,57)' : '#f0f0f0'}
            iconShadow={activeProfile === 'business' ? 'rgba(247,190,57,0.45)' : 'transparent'}
            label="My Profile"
            sublabel="Work travel & expenses"
            active={activeProfile === 'business'}
            checkBg="rgb(247,190,57)"
            checkColor="#1a1a1a"
           onClick={() => { setOpen(false); setShowMyProfile(true); }}
          />

         
          <div style={{ height: '1px', background: '#f0f0f0', margin: '4px 0' }} />

          {/* Logout */}
          <button className="tpm-item" onClick={handleLogout} style={{ padding: '11px 16px 14px' }}>
            <span style={{
              width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
              background: '#fff0f0', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconLogOut size={16} color="#e53935" />
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#e53935' }}>Close & Logout</span>
          </button>
        </div>
      )}
      {showMyProfile && (
        <MyProfileDashboard
          user={user}
          onClose={() => setShowMyProfile(false)}
          onSave={(type, data) => console.log('Saved:', type, data)}
        />
      )}

    </div>
  );
}

// ─── ProfileRow sub-component ─────────────────────────────────────────────────
function ProfileRow({ icon, iconBg, iconShadow, label, sublabel, active, checkBg, checkColor, onClick }) {
  return (
    <button
      className="tpm-item"
      onClick={onClick}
      style={{ background: active ? '#fafafa' : 'transparent', padding: '9px 16px' }}
    >
      <span style={{
        width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
        background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
        boxShadow: active ? `0 3px 10px ${iconShadow}` : 'none',
      }}>
        {icon}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: active ? 700 : 500, color: active ? '#111' : '#444' }}>
          {label}
        </div>
        <div style={{ fontSize: '11px', color: '#999', marginTop: '1px' }}>{sublabel}</div>
      </div>
      {active && (
        <span style={{
          width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
          background: checkBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 2px 8px ${checkBg}66`,
        }}>
          <IconCheck size={10} color={checkColor} />
        </span>
      )}
    </button>
  );
}