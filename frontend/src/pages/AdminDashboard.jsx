// pages/AdminDashboard.jsx
import { useEffect, useState, useCallback } from 'react';
import axios from '../utils/axiosConfig';
import { useAuth } from '../role-auth/role-auth/src/context/AuthContext';
import HeaderProfileMenu from '../components/detail/headings/HeaderProfileMenu';
import TripVoucherModal from '../components/detail/headings/TripVoucherModal';

// ── Helpers ──────────────────────────────────────────────────
const fmt = (n) =>
  n >= 10_00_000
    ? `₹${(n / 10_00_000).toFixed(1)}L`
    : n >= 1000
    ? `₹${(n / 1000).toFixed(1)}K`
    : `₹${n}`;

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const STATUS_COLOR = {
  pending:  { bg: '#FFF3CD', text: '#856404', dot: '#F0A500' },
  approved: { bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
  rejected: { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
  draft:    { bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' },
  sent:     { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' },
};

const ROLE_COLOR = { hr: '#7C3AED', manager: '#0EA5E9', employee: '#10B981' };

const pill = (label, map) => {
  const c = map[label] || { bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20,
      background: c.bg, color: c.text, fontSize: 12, fontWeight: 600,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />
      {label}
    </span>
  );
};

// ── Mini Bar Chart ────────────────────────────────────────────
function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80, paddingTop: 8 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, color: '#64748B' }}>{d.count}</span>
          <div style={{
            width: '100%', borderRadius: '4px 4px 0 0',
            background: 'linear-gradient(180deg, #6366F1, #818CF8)',
            height: `${(d.count / max) * 52}px`,
            minHeight: 4,
            transition: 'height 0.6s ease',
          }} />
          <span style={{ fontSize: 10, color: '#94A3B8', whiteSpace: 'nowrap' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Donut Chart (pure CSS + SVG) ──────────────────────────────
function DonutChart({ segments }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  const R = 36, C = 2 * Math.PI * R;
  return (
    <div style={{ position: 'relative', width: 90, height: 90 }}>
      <svg viewBox="0 0 90 90" style={{ transform: 'rotate(-90deg)' }}>
        {segments.map((seg, i) => {
          const frac = seg.value / total;
          const dash = frac * C;
          const gap = C - dash;
          const el = (
            <circle key={i}
              cx="45" cy="45" r={R}
              fill="none" strokeWidth="14"
              stroke={seg.color}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset * C}
            />
          );
          offset += frac;
          return el;
        })}
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#1E293B' }}>{total}</span>
        <span style={{ fontSize: 9, color: '#94A3B8' }}>total</span>
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '20px 24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)',
      display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 160,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: color + '18', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 22, flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: color, fontWeight: 600, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────
function SectionHead({ title, count, onSearch, searchVal, actions }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1E293B' }}>
        {title} {count !== undefined && <span style={{ color: '#94A3B8', fontWeight: 400, fontSize: 13 }}>({count})</span>}
      </h3>
      <div style={{ flex: 1 }} />
      {onSearch && (
        <input
          value={searchVal} onChange={(e) => onSearch(e.target.value)}
          placeholder="Search…"
          style={{
            border: '1px solid #E2E8F0', borderRadius: 8, padding: '6px 12px',
            fontSize: 13, color: '#1E293B', outline: 'none', background: '#F8FAFC',
            width: 200,
          }}
        />
      )}
      {actions}
    </div>
  );
}

// ── Table ─────────────────────────────────────────────────────
function Table({ cols, rows, emptyMsg = 'No data' }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c.key} style={{
                textAlign: 'left', padding: '10px 14px',
                borderBottom: '2px solid #F1F5F9',
                color: '#94A3B8', fontWeight: 600, fontSize: 11,
                textTransform: 'uppercase', letterSpacing: '0.05em',
                background: '#FAFBFC', whiteSpace: 'nowrap',
              }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={cols.length} style={{ padding: 32, textAlign: 'center', color: '#CBD5E1' }}>
                {emptyMsg}
              </td>
            </tr>
          ) : rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {cols.map((c) => (
                <td key={c.key} style={{ padding: '12px 14px', color: '#334155', verticalAlign: 'middle' }}>
                  {c.render ? c.render(row) : row[c.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Modal wrapper ─────────────────────────────────────────────
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: 28,
        width: '100%', maxWidth: 480, boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
        maxHeight: '90vh', overflowY: 'auto',
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1E293B' }}>{title}</h3>
          <button onClick={onClose} style={{
            marginLeft: 'auto', background: '#F1F5F9', border: 'none',
            borderRadius: 8, width: 32, height: 32, cursor: 'pointer',
            fontSize: 16, color: '#64748B',
          }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Tab Button ────────────────────────────────────────────────
function Tab({ label, active, onClick, badge }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
      fontWeight: 600, fontSize: 13, transition: 'all 0.15s',
      background: active ? '#6366F1' : 'transparent',
      color: active ? '#fff' : '#64748B',
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      {label}
      {badge > 0 && (
        <span style={{
          background: active ? 'rgba(255,255,255,0.25)' : '#EF4444',
          color: '#fff', borderRadius: 20, fontSize: 10, fontWeight: 700,
          padding: '1px 6px',
        }}>{badge}</span>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function AdminDashboard({ onBack }) {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [userSearch, setUserSearch] = useState('');
  const [tripSearch, setTripSearch] = useState('');
  const [tripFilter, setTripFilter] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('');

  // Modals
  const [roleModal, setRoleModal] = useState(null); // user object
  const [budgetModal, setBudgetModal] = useState(null);
  const [roleVal, setRoleVal] = useState('');
  const [annualVal, setAnnualVal] = useState('');
  const [perTripVal, setPerTripVal] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Voucher View
  const [viewVoucher, setViewVoucher] = useState(null); // { rfq, planItems, name }

  // ── Fetch all data ──────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [s, u, t, a] = await Promise.all([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/users'),
        axios.get('/api/admin/trips'),
        axios.get('/api/admin/approvals'),
      ]);
      setStats(s.data.data);
      setUsers(u.data.data || []);
      setTrips(t.data.data || []);
      setApprovals(a.data.data || []);
    } catch (e) {
      console.error('[AdminDashboard] Load error:', e);
      const status = e.response?.status;
      const data = e.response?.data;
      const msg = data?.message || data?.error || e.message || 'Failed to load data';
      setError(status ? `Error ${status}: ${msg}` : msg);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Save role ───────────────────────────────────────────────
  const saveRole = async () => {
    setSaving(true);
    try {
      await axios.patch(`/api/admin/users/${roleModal.uid}/role`, { role: roleVal });
      setSaveMsg('Role updated!');
      setUsers((prev) => prev.map((u) => u.uid === roleModal.uid ? { ...u, role: roleVal } : u));
      setTimeout(() => { setRoleModal(null); setSaveMsg(''); }, 900);
    } catch { setSaveMsg('Error saving'); }
    setSaving(false);
  };

  // ── Save budget ─────────────────────────────────────────────
  const saveBudget = async () => {
    setSaving(true);
    try {
      await axios.patch(`/api/admin/users/${budgetModal.uid}/budget`, {
        annualBudget: Number(annualVal),
        perTripLimit: Number(perTripVal),
      });
      setSaveMsg('Budget updated!');
      setUsers((prev) => prev.map((u) =>
        u.uid === budgetModal.uid
          ? { ...u, profile: { ...u.profile, annualBudget: Number(annualVal), perTripLimit: Number(perTripVal) } }
          : u
      ));
      setTimeout(() => { setBudgetModal(null); setSaveMsg(''); }, 900);
    } catch { setSaveMsg('Error saving'); }
    setSaving(false);
  };

  // ── Derived filtered lists ──────────────────────────────────
  const filteredUsers = users.filter((u) => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').includes(q);
  });

  const filteredTrips = trips.filter((t) => {
    if (tripFilter && t.reviewStatus !== tripFilter) return false;
    if (!tripSearch) return true;
    const q = tripSearch.toLowerCase();
    return (t.tripName || '').toLowerCase().includes(q) ||
      (t.createdByName || '').toLowerCase().includes(q) ||
      (t.rfqId || '').toLowerCase().includes(q);
  });

  const filteredApprovals = approvals.filter((a) =>
    approvalFilter ? a.status === approvalFilter : true
  );

  // ── Monthly chart data ──────────────────────────────────────
  const chartData = stats?.monthlyTrips?.map((m) => ({
    label: MONTH_NAMES[(m._id.month || 1) - 1],
    count: m.count,
  })) || [];

  // ── Approval donut segments ─────────────────────────────────
  const donutSegments = [
    { value: stats?.pendingApprovals || 0, color: '#F0A500' },
    { value: stats?.approvedApprovals || 0, color: '#10B981' },
    { value: stats?.rejectedApprovals || 0, color: '#EF4444' },
  ];

  // ── Styles ──────────────────────────────────────────────────
  const card = {
    background: '#fff', borderRadius: 16, padding: 24,
    boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)',
  };

  const inputStyle = {
    width: '100%', border: '1.5px solid #E2E8F0', borderRadius: 10,
    padding: '10px 14px', fontSize: 14, color: '#1E293B', outline: 'none',
    background: '#F8FAFC', boxSizing: 'border-box',
  };

  const btnPrimary = {
    background: '#6366F1', color: '#fff', border: 'none',
    borderRadius: 10, padding: '10px 22px', fontWeight: 700,
    fontSize: 14, cursor: 'pointer',
  };

  // ── Loading / Error states ──────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚙️</div>
        <p style={{ color: '#64748B', fontWeight: 500 }}>Loading Admin Dashboard…</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ ...card, maxWidth: 400, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>⚠️</div>
        <p style={{ color: '#EF4444', fontWeight: 600 }}>{error}</p>
        <button onClick={loadAll} style={{ ...btnPrimary, marginTop: 12 }}>Retry</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── NAVBAR (Top Bar) ── */}
      <header className="w-full z-30 sticky top-0" style={{ backgroundColor: 'rgb(247, 190, 57)', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2" style={{ cursor: 'pointer' }} onClick={onBack}>
            <img src="https://travplatforms.com/images/logo3.png" alt="TravPlatforms" style={{ height: '35px', objectFit: 'contain' }} />
          </div>
          
          <HeaderProfileMenu
            user={user}
            onLogout={logout}
            onOpenAdminDashboard={() => {}} 
            activeProfile="business"
            onSwitchProfile={() => {}}
          />
        </div>
      </header>

      {/* ── SUBBAR (Action Bar) ── */}
      <div style={{ 
        background: '#fff', 
        borderBottom: '1px solid #E2E8F0', 
        padding: '10px 32px',
        position: 'sticky',
        top: '59px', // Height of header
        zIndex: 20,
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}>
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Back Button */}
            <button onClick={onBack} style={{
              background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px',
              width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#475569', transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>

            <span style={{
              background: '#6366F1', color: '#fff',
              fontSize: '11px', fontWeight: 800, padding: '4px 12px', borderRadius: '20px',
              letterSpacing: '0.05em', boxShadow: '0 2px 4px rgba(99, 102, 241, 0.2)'
            }}>ADMIN PANEL</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={loadAll} style={{
              background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px',
              padding: '7px 16px', cursor: 'pointer', fontSize: '12px',
              color: '#475569', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#cbd5e1'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '28px 32px', maxWidth: 1280, margin: '0 auto' }}>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 4, background: '#fff', padding: 5,
          borderRadius: 14, width: 'fit-content', marginBottom: 28,
          boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
        }}>
          <Tab label="📊 Overview"  active={tab === 'overview'}  onClick={() => setTab('overview')} />
          <Tab label="👥 Users"     active={tab === 'users'}     onClick={() => setTab('users')}    badge={users.length} />
          <Tab label="✈️ Trips"     active={tab === 'trips'}     onClick={() => setTab('trips')}    badge={trips.length} />
          <Tab label="💰 Approvals" active={tab === 'approvals'} onClick={() => setTab('approvals')} badge={stats?.pendingApprovals} />
        </div>

        {/* ════════════════ OVERVIEW TAB ════════════════ */}
        {tab === 'overview' && (
          <div>
            {/* Stat Cards */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
              <StatCard icon="👥" label="Total Users"       value={stats.totalUsers}        color="#6366F1" sub={`${stats.roleMap?.hr || 0} HR · ${stats.roleMap?.manager || 0} Managers`} />
              <StatCard icon="✈️" label="Total Trips"       value={stats.totalTrips}         color="#0EA5E9" sub={`${stats.tripStatusMap?.draft || 0} drafts`} />
              <StatCard icon="⏳" label="Pending Approvals" value={stats.pendingApprovals}   color="#F0A500" />
              <StatCard icon="💸" label="Total Spend"       value={fmt(stats.totalSpend)}    color="#10B981" sub={`${stats.approvedApprovals} approved`} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, flexWrap: 'wrap' }}>

              {/* Monthly chart */}
              <div style={{ ...card, gridColumn: '1 / 3' }}>
                <SectionHead title="Trips per Month" />
                {chartData.length > 0
                  ? <BarChart data={chartData} />
                  : <p style={{ color: '#CBD5E1', textAlign: 'center', padding: 24 }}>No data</p>
                }
              </div>

              {/* Approvals donut */}
              <div style={card}>
                <SectionHead title="Approvals" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <DonutChart segments={donutSegments} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { label: 'Pending',  val: stats.pendingApprovals,  color: '#F0A500' },
                      { label: 'Approved', val: stats.approvedApprovals, color: '#10B981' },
                      { label: 'Rejected', val: stats.rejectedApprovals, color: '#EF4444' },
                    ].map((x) => (
                      <div key={x.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, background: x.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: '#64748B' }}>{x.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', marginLeft: 'auto' }}>{x.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Destinations */}
              <div style={{ ...card, gridColumn: '1 / 2' }}>
                <SectionHead title="Top Destinations" />
                {(stats.topDestinations || []).map((d, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 0', borderBottom: i < 4 ? '1px solid #F1F5F9' : 'none',
                  }}>
                    <span style={{
                      width: 24, height: 24, borderRadius: 8,
                      background: '#EEF2FF', color: '#6366F1',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700,
                    }}>{i + 1}</span>
                    <span style={{ flex: 1, fontSize: 14, color: '#334155', fontWeight: 500 }}>{d._id}</span>
                    <span style={{
                      background: '#F8FAFC', borderRadius: 8, padding: '2px 10px',
                      fontSize: 12, fontWeight: 700, color: '#6366F1',
                    }}>{d.count} trips</span>
                  </div>
                ))}
                {!stats.topDestinations?.length && <p style={{ color: '#CBD5E1', textAlign: 'center', padding: 16 }}>No data</p>}
              </div>

              {/* Role breakdown */}
              <div style={{ ...card, gridColumn: '2 / 4' }}>
                <SectionHead title="User Roles" />
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {Object.entries(stats.roleMap || {}).map(([role, count]) => (
                    <div key={role} style={{
                      flex: 1, minWidth: 100, borderRadius: 14,
                      background: ROLE_COLOR[role] + '12',
                      border: `1.5px solid ${ROLE_COLOR[role]}30`,
                      padding: '16px 20px', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 28, fontWeight: 800, color: ROLE_COLOR[role] }}>{count}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'capitalize', marginTop: 2 }}>{role}s</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ════════════════ USERS TAB ════════════════ */}
        {tab === 'users' && (
          <div style={card}>
            <SectionHead
              title="All Users"
              count={filteredUsers.length}
              onSearch={setUserSearch}
              searchVal={userSearch}
            />
            <Table
              cols={[
                { key: 'name', label: 'Name', render: (u) => (
                  <div>
                    <div style={{ fontWeight: 600, color: '#1E293B' }}>{u.name || '—'}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>{u.email}</div>
                  </div>
                )},
                { key: 'role',  label: 'Role',       render: (u) => pill(u.role, Object.fromEntries(Object.entries(ROLE_COLOR).map(([k,v]) => [k, { bg: v+'15', text: v, dot: v }]))) },
                { key: 'dept',  label: 'Department',  render: (u) => u.profile?.department || '—' },
                { key: 'trips', label: 'Trips',        render: (u) => (
                  <span style={{ fontWeight: 700, color: '#6366F1' }}>{u.tripCount}</span>
                )},
                { key: 'budget', label: 'Per-Trip Limit', render: (u) => (
                  u.profile?.perTripLimit ? fmt(u.profile.perTripLimit) : '—'
                )},
                { key: 'tokens', label: 'AI Tokens', render: (u) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 60, height: 6, borderRadius: 3, background: '#F1F5F9', overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%', borderRadius: 3, background: '#6366F1',
                        width: `${Math.min(100, ((u.chatTokens?.used || 0) / 2000) * 100)}%`,
                      }} />
                    </div>
                    <span style={{ fontSize: 11, color: '#64748B' }}>{u.chatTokens?.used || 0}/2000</span>
                  </div>
                )},
                { key: 'actions', label: 'Actions', render: (u) => (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { setRoleModal(u); setRoleVal(u.role); }} style={{
                      background: '#EEF2FF', color: '#6366F1', border: 'none',
                      borderRadius: 7, padding: '5px 10px', cursor: 'pointer',
                      fontWeight: 600, fontSize: 12,
                    }}>Role</button>
                    <button onClick={() => {
                      setBudgetModal(u);
                      setAnnualVal(u.profile?.annualBudget || '');
                      setPerTripVal(u.profile?.perTripLimit || '');
                    }} style={{
                      background: '#ECFDF5', color: '#10B981', border: 'none',
                      borderRadius: 7, padding: '5px 10px', cursor: 'pointer',
                      fontWeight: 600, fontSize: 12,
                    }}>Budget</button>
                  </div>
                )},
              ]}
              rows={filteredUsers}
              emptyMsg="No users found"
            />
          </div>
        )}

        {/* ════════════════ TRIPS TAB ════════════════ */}
        {tab === 'trips' && (
          <div style={card}>
            <SectionHead
              title="All Trips"
              count={filteredTrips.length}
              onSearch={setTripSearch}
              searchVal={tripSearch}
              actions={
                <select
                  value={tripFilter}
                  onChange={(e) => setTripFilter(e.target.value)}
                  style={{
                    border: '1px solid #E2E8F0', borderRadius: 8,
                    padding: '6px 12px', fontSize: 13, color: '#334155',
                    background: '#F8FAFC', cursor: 'pointer', outline: 'none',
                  }}
                >
                  <option value="">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              }
            />
            <Table
              cols={[
                { key: 'rfqId',   label: 'ID',     render: (t) => (
                  <span style={{ fontFamily: 'monospace', background: '#F1F5F9', padding: '2px 8px', borderRadius: 6, fontSize: 12 }}>
                    {t.rfqId || t._id?.slice(-6) || '—'}
                  </span>
                )},
                { key: 'tripName', label: 'Trip Name', render: (t) => (
                  <div style={{ fontWeight: 600, color: '#1E293B' }}>{t.tripName || 'Untitled'}</div>
                )},
                { key: 'destinations', label: 'Destinations', render: (t) => (
                  <span style={{ color: '#64748B', fontSize: 12 }}>
                    {t.destinations?.map((d) => d.destination).join(', ') || '—'}
                  </span>
                )},
                { key: 'createdByName', label: 'Employee' },
                { key: 'budget',  label: 'Budget',  render: (t) => t.budget ? fmt(t.budget) : '—' },
                { key: 'reviewStatus', label: 'Status', render: (t) => pill(t.reviewStatus || 'draft', STATUS_COLOR) },
                { key: 'createdAt', label: 'Created', render: (t) => (
                  <span style={{ color: '#94A3B8', fontSize: 12 }}>
                    {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                  </span>
                )},
                { key: 'actions', label: 'Action', render: (t) => (
                  <button
                    onClick={() => setViewVoucher({ rfq: t, planItems: t.planItems || [], name: t.createdByName })}
                    style={{
                      background: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD',
                      borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    🎫 Voucher
                  </button>
                )}
              ]}
              rows={filteredTrips}
              emptyMsg="No trips found"
            />
          </div>
        )}

        {/* ════════════════ APPROVALS TAB ════════════════ */}
        {tab === 'approvals' && (
          <div style={card}>
            <SectionHead
              title="Budget Approvals"
              count={filteredApprovals.length}
              actions={
                <select
                  value={approvalFilter}
                  onChange={(e) => setApprovalFilter(e.target.value)}
                  style={{
                    border: '1px solid #E2E8F0', borderRadius: 8,
                    padding: '6px 12px', fontSize: 13, color: '#334155',
                    background: '#F8FAFC', cursor: 'pointer', outline: 'none',
                  }}
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              }
            />
            <Table
              cols={[
                { key: 'tripName',        label: 'Trip',         render: (a) => (
                  <div>
                    <div style={{ fontWeight: 600, color: '#1E293B' }}>{a.tripName || 'Untitled'}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>{a.rfqId}</div>
                  </div>
                )},
                { key: 'requestedByName', label: 'Requested By' },
                { key: 'assignedToName',  label: 'Manager' },
                { key: 'budget',          label: 'Budget',    render: (a) => fmt(a.budget || 0) },
                { key: 'grandTotal',      label: 'Total',     render: (a) => (
                  <span style={{ fontWeight: 700, color: a.grandTotal > a.budget ? '#EF4444' : '#10B981' }}>
                    {fmt(a.grandTotal || 0)}
                  </span>
                )},
                { key: 'status',  label: 'Status', render: (a) => pill(a.status, STATUS_COLOR) },
                { key: 'sentAt',  label: 'Sent On', render: (a) => (
                  <span style={{ color: '#94A3B8', fontSize: 12 }}>
                    {a.sentAt ? new Date(a.sentAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                  </span>
                )},
                { key: 'managerComment', label: 'Comment', render: (a) => (
                  a.managerComment
                    ? <span style={{ fontSize: 12, color: '#64748B', fontStyle: 'italic' }}>"{a.managerComment}"</span>
                    : <span style={{ color: '#CBD5E1', fontSize: 12 }}>—</span>
                )},
                { key: 'actions', label: 'Action', render: (a) => (
                   <button
                    onClick={async () => {
                      // We need the full RFQ object for the voucher. Approvals usually have rfqId.
                      // Let's try to find it in the trips list if available.
                      const fullRfq = trips.find(t => t.rfqId === a.rfqId || t._id === a.rfqId);
                      if (fullRfq) {
                        setViewVoucher({ rfq: fullRfq, planItems: fullRfq.planItems || [], name: a.requestedByName });
                      } else {
                        // Fallback: build a mini rfq object from approval data
                        setViewVoucher({ rfq: a, planItems: a.planItems || [], name: a.requestedByName });
                      }
                    }}
                    style={{
                      background: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD',
                      borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    🎫 Voucher
                  </button>
                )}
              ]}
              rows={filteredApprovals}
              emptyMsg="No approvals found"
            />
          </div>
        )}
      </div>

      {/* ── Role Modal ── */}
      <Modal open={!!roleModal} onClose={() => setRoleModal(null)} title={`Change Role — ${roleModal?.name || roleModal?.email}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>New Role</label>
            <select value={roleVal} onChange={(e) => setRoleVal(e.target.value)} style={{ ...inputStyle }}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="hr">HR (Admin)</option>
            </select>
          </div>
          {saveMsg && <p style={{ color: saveMsg.includes('Error') ? '#EF4444' : '#10B981', margin: 0, fontSize: 13, fontWeight: 600 }}>{saveMsg}</p>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setRoleModal(null)} style={{
              background: '#F1F5F9', border: 'none', borderRadius: 10,
              padding: '10px 20px', cursor: 'pointer', fontWeight: 600, color: '#64748B',
            }}>Cancel</button>
            <button onClick={saveRole} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : 'Save Role'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Budget Modal ── */}
      <Modal open={!!budgetModal} onClose={() => setBudgetModal(null)} title={`Set Budget — ${budgetModal?.name || budgetModal?.email}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Annual Budget (₹)</label>
            <input type="number" value={annualVal} onChange={(e) => setAnnualVal(e.target.value)} style={inputStyle} placeholder="e.g. 500000" />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Per Trip Limit (₹)</label>
            <input type="number" value={perTripVal} onChange={(e) => setPerTripVal(e.target.value)} style={inputStyle} placeholder="e.g. 100000" />
          </div>
          {saveMsg && <p style={{ color: saveMsg.includes('Error') ? '#EF4444' : '#10B981', margin: 0, fontSize: 13, fontWeight: 600 }}>{saveMsg}</p>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setBudgetModal(null)} style={{
              background: '#F1F5F9', border: 'none', borderRadius: 10,
              padding: '10px 20px', cursor: 'pointer', fontWeight: 600, color: '#64748B',
            }}>Cancel</button>
            <button onClick={saveBudget} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : 'Save Budget'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Trip Voucher Modal ── */}
      <TripVoucherModal
        open={!!viewVoucher}
        onClose={() => setViewVoucher(null)}
        rfq={viewVoucher?.rfq}
        planItems={viewVoucher?.planItems}
        userName={viewVoucher?.name}
      />
    </div>
  );
}