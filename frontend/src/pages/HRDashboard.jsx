import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../role-auth/role-auth/src/context/AuthContext';

const Y = 'rgb(247,190,57)';
const YLight = 'rgba(247,190,57,0.12)';

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, color = 'currentColor', strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const Icons = {
  Users:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Shield:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Budget:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  Check:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  Activity: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Edit:     () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Back:     () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>,
  Search:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/></svg>,
  Wrench:   () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
};

// ── Avatar ────────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  { bg: '#dbeafe', color: '#1e40af' },
  { bg: '#d1fae5', color: '#065f46' },
  { bg: '#fef3c7', color: '#92400e' },
  { bg: '#ede9fe', color: '#5b21b6' },
  { bg: '#fce7f3', color: '#9d174d' },
  { bg: '#e0f2fe', color: '#0369a1' },
];

function Avatar({ name, email, size = 32 }) {
  const str = name || email || '?';
  const initials = str.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || str[0]?.toUpperCase();
  const idx = str.charCodeAt(0) % AVATAR_COLORS.length;
  const { bg, color } = AVATAR_COLORS[idx];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, letterSpacing: '-0.02em',
    }}>
      {initials}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ label, type = 'default' }) {
  const styles = {
    default:  { bg: '#f3f4f6', color: '#4b5563', border: '#e5e7eb' },
    success:  { bg: '#dcfce7', color: '#166534', border: '#86efac' },
    warning:  { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
    info:     { bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe' },
    danger:   { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
    purple:   { bg: '#ede9fe', color: '#5b21b6', border: '#ddd6fe' },
  };
  const s = styles[type] || styles.default;
  return (
    <span style={{
      fontSize: '11px', fontWeight: 600, padding: '3px 8px',
      borderRadius: '6px', background: s.bg, color: s.color,
      border: `1px solid ${s.border}`, display: 'inline-block', whiteSpace: 'nowrap',
    }}>{label}</span>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }) {
  return (
    <div style={{
      background: '#f9fafb', borderRadius: '12px', padding: '14px 16px',
      border: '1px solid #f3f4f6',
    }}>
      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '26px', fontWeight: 800, color: '#111827', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>{sub}</div>
    </div>
  );
}

// ── Nav Item ──────────────────────────────────────────────────────────────────
function NavItem({ icon: IconComp, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
      padding: '9px 12px', borderRadius: '10px', border: '1px solid',
      borderColor: active ? '#e5e7eb' : 'transparent',
      background: active ? '#fff' : 'transparent',
      color: active ? '#111827' : '#6b7280',
      fontSize: '13px', fontWeight: active ? 700 : 500,
      cursor: 'pointer', textAlign: 'left',
      boxShadow: active ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
      transition: 'all 0.15s',
    }}>
      <IconComp />
      {label}
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────────────
//  TAB 1 — Users & Roles
// ────────────────────────────────────────────────────────────────────────────
function UsersTab({ users, loading, onRoleChange, onAssignManager, onFixNames }) {
  const [search, setSearch] = useState('');
  const managers = users.filter(u => u.role === 'manager');
  const filtered = users.filter(u =>
    (u.name || u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const roleType = r => r === 'hr' ? 'warning' : r === 'manager' ? 'info' : 'default';

  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid #f3f4f6',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px',
      }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>Users & Role Management</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Assign roles and reporting managers</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
              <Icons.Search />
            </div>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search users..."
              style={{
                paddingLeft: '34px', paddingRight: '12px', paddingTop: '7px', paddingBottom: '7px',
                border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px',
                background: '#f9fafb', color: '#111827', outline: 'none', width: '200px',
              }}
            />
          </div>
          <button
            onClick={onFixNames}
            style={{
              padding: '7px 14px', borderRadius: '8px', background: '#f0f9ff',
              color: '#0369a1', border: '1px solid #bae6fd', fontSize: '12px',
              fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
            }}
          >
            <Icons.Wrench /> Fix Names
          </button>
        </div>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            {['User', 'Email', 'Role', 'Manager', 'Policy', 'Actions'].map(h => (
              <th key={h} style={{
                padding: '10px 16px', fontSize: '11px', fontWeight: 700,
                color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Loading users…</td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>No users found</td></tr>
          ) : filtered.map(u => (
            <tr key={u.uid} style={{ borderBottom: '1px solid #f9fafb' }}
              onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

              <td style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Avatar name={u.name} email={u.email} size={32} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{u.name || 'N/A'}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>UID: {u.uid?.slice(-6)}</div>
                  </div>
                </div>
              </td>

              <td style={{ padding: '12px 16px', fontSize: '13px', color: '#4b5563' }}>{u.email}</td>

              <td style={{ padding: '12px 16px' }}>
                <select
                  value={u.role}
                  onChange={e => onRoleChange(u.uid, e.target.value)}
                  style={{
                    padding: '5px 8px', borderRadius: '7px', border: '1px solid #e5e7eb',
                    fontSize: '12px', fontWeight: 600, background: '#fff', cursor: 'pointer',
                    color: '#111827', outline: 'none',
                  }}
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="hr">HR</option>
                </select>
              </td>

              <td style={{ padding: '12px 16px' }}>
                {(u.role === 'employee' || u.role === 'manager') ? (
                  <select
                    value={u.managerId || ''}
                    onChange={e => onAssignManager(u.uid, e.target.value)}
                    style={{
                      padding: '5px 8px', borderRadius: '7px', border: '1px solid #e5e7eb',
                      fontSize: '12px', background: '#fff', width: '160px', color: '#111827', outline: 'none',
                    }}
                  >
                    <option value="">None Assigned</option>
                    {managers.filter(m => m.uid !== u.uid).map(m => (
                      <option key={m.uid} value={m.uid}>{m.name || m.email}</option>
                    ))}
                  </select>
                ) : (
                  <span style={{ fontSize: '12px', color: '#d1d5db' }}>—</span>
                )}
              </td>

              <td style={{ padding: '12px 16px' }}>
                <Badge
                  label={u.role === 'hr' ? 'Admin' : u.role === 'manager' ? 'Premium' : 'Standard'}
                  type={roleType(u.role)}
                />
              </td>

              <td style={{ padding: '12px 16px' }}>
                <button style={{
                  width: '28px', height: '28px', borderRadius: '7px',
                  border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280',
                }}>
                  <Icons.Edit />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
//  TAB 2 — Travel Policies
// ────────────────────────────────────────────────────────────────────────────
const POLICIES = [
  {
    id: 1, name: 'Standard Employee Policy', active: true,
    desc: 'Economy class · Max ₹50,000/trip · 3-star hotels',
    users: 1, assignedTo: 'Employees',
  },
  {
    id: 2, name: 'Manager Premium Policy', active: true,
    desc: 'Business class · Max ₹1,50,000/trip · 4–5 star hotels',
    users: 2, assignedTo: 'Managers',
  },
  {
    id: 3, name: 'International Travel Policy', active: false,
    desc: 'Business class · Visa support · Travel insurance required',
    users: 0, assignedTo: 'All users',
  },
];

function PoliciesTab() {
  const [policies, setPolicies] = useState(POLICIES);
  const [activeSubTab, setActiveSubTab] = useState('all');

  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid #f3f4f6',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>Travel Policies</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Set per-user or global travel rules</div>
        </div>
        <button style={{
          padding: '7px 14px', borderRadius: '8px', background: Y,
          color: '#1a1a1a', border: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
        }}>
          + Add Policy
        </button>
      </div>

      {/* Sub tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #f3f4f6', padding: '0 20px', background: '#fff' }}>
        {['all', 'by-user', 'by-dept'].map(t => {
          const labels = { all: 'All Policies', 'by-user': 'By User', 'by-dept': 'By Department' };
          const active = activeSubTab === t;
          return (
            <button key={t} onClick={() => setActiveSubTab(t)} style={{
              padding: '10px 14px', fontSize: '13px', fontWeight: active ? 700 : 500,
              color: active ? '#111827' : '#6b7280', cursor: 'pointer', border: 'none',
              background: 'transparent', borderBottom: `2px solid ${active ? Y : 'transparent'}`,
              marginBottom: '-1px', transition: 'all 0.15s',
            }}>{labels[t]}</button>
          );
        })}
      </div>

      <div>
        {policies.map((p, i) => (
          <div key={p.id} style={{
            padding: '16px 20px',
            borderBottom: i < policies.length - 1 ? '1px solid #f9fafb' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '3px' }}>{p.name}</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>{p.desc}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                  {p.users > 0 ? `${p.users} user${p.users > 1 ? 's' : ''} · ` : ''}{p.assignedTo}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Badge label={p.active ? 'Active' : 'Draft'} type={p.active ? 'success' : 'default'} />
              <button style={{
                width: '28px', height: '28px', borderRadius: '7px',
                border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280',
              }}>
                <Icons.Edit />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
//  TAB 3 — Budget Limits
// ────────────────────────────────────────────────────────────────────────────
const BUDGETS = [
  { name: 'Trushant', email: 'trushant@gmail.com', role: 'employee', monthly: 50000, perTrip: 20000, used: 12400 },
  { name: 'Vinay', email: 'vinay@gmail.com', role: 'manager', monthly: 150000, perTrip: 75000, used: 142000 },
  { name: 'sandeepdubliya80', email: 'sandeepdubliya80@gmail.com', role: 'manager', monthly: 150000, perTrip: 75000, used: 35000 },
];

function BudgetTab() {
  const fmt = n => '₹' + Number(n).toLocaleString('en-IN');
  const pct = (used, total) => Math.min(100, Math.round((used / total) * 100));

  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid #f3f4f6',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>Budget Limits</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Per-user monthly and per-trip limits</div>
        </div>
        <button style={{
          padding: '7px 14px', borderRadius: '8px', background: Y,
          color: '#1a1a1a', border: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
        }}>
          + Set Limit
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            {['User', 'Role', 'Monthly Limit', 'Per Trip', 'Used This Month', 'Status'].map(h => (
              <th key={h} style={{
                padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: '#6b7280',
                textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {BUDGETS.map((b, i) => {
            const p = pct(b.used, b.monthly);
            const nearLimit = p >= 80;
            return (
              <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Avatar name={b.name} email={b.email} size={30} />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{b.name}</span>
                  </div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <Badge label={b.role === 'manager' ? 'Manager' : 'Employee'} type={b.role === 'manager' ? 'info' : 'default'} />
                </td>
                <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 600, color: '#111827' }}>{fmt(b.monthly)}</td>
                <td style={{ padding: '14px 16px', fontSize: '13px', color: '#4b5563' }}>{fmt(b.perTrip)}</td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: nearLimit ? '#b45309' : '#111827', marginBottom: '4px' }}>
                    {fmt(b.used)}
                    <span style={{ fontWeight: 400, fontSize: '11px', color: '#9ca3af', marginLeft: '4px' }}>({p}%)</span>
                  </div>
                  <div style={{ height: '4px', background: '#f3f4f6', borderRadius: '2px', width: '120px' }}>
                    <div style={{
                      height: '100%', borderRadius: '2px', width: `${p}%`,
                      background: nearLimit ? '#f59e0b' : '#10b981', transition: 'width 0.3s',
                    }} />
                  </div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <Badge label={nearLimit ? 'Near limit' : 'Within limit'} type={nearLimit ? 'warning' : 'success'} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
//  TAB 4 — Approvals
// ────────────────────────────────────────────────────────────────────────────
const APPROVALS = [
  { trip: 'London Trip', id: 'TRIP-HASBFW', by: 'Trushant', amount: 45995, manager: 'Vinay', date: 'Today', status: 'pending' },
  { trip: 'Mumbai Conference', id: 'TRIP-M2391', by: 'Vinay', amount: 18500, manager: 'sandeepdubliya80', date: 'Yesterday', status: 'pending' },
];

function ApprovalsTab() {
  const [approvals, setApprovals] = useState(APPROVALS);
  const fmt = n => '₹' + Number(n).toLocaleString('en-IN');

  const handle = (id, action) => {
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: action } : a));
  };

  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>Pending Approvals</div>
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Budget approval requests from employees</div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            {['Trip', 'Requested By', 'Amount', 'Manager', 'Submitted', 'Action'].map(h => (
              <th key={h} style={{
                padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: '#6b7280',
                textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {approvals.map((a, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }}
              onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <td style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{a.trip}</div>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>{a.id}</div>
              </td>
              <td style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Avatar name={a.by} size={26} />
                  <span style={{ fontSize: '13px', color: '#374151' }}>{a.by}</span>
                </div>
              </td>
              <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: '#111827' }}>{fmt(a.amount)}</td>
              <td style={{ padding: '14px 16px', fontSize: '13px', color: '#4b5563' }}>{a.manager}</td>
              <td style={{ padding: '14px 16px', fontSize: '12px', color: '#9ca3af' }}>{a.date}</td>
              <td style={{ padding: '14px 16px' }}>
                {a.status === 'pending' ? (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => handle(a.id, 'approved')} style={{
                      fontSize: '11px', padding: '5px 10px', borderRadius: '7px',
                      background: '#dcfce7', color: '#166534', border: '1px solid #86efac', cursor: 'pointer', fontWeight: 700,
                    }}>Approve</button>
                    <button onClick={() => handle(a.id, 'rejected')} style={{
                      fontSize: '11px', padding: '5px 10px', borderRadius: '7px',
                      background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', cursor: 'pointer', fontWeight: 700,
                    }}>Reject</button>
                  </div>
                ) : (
                  <Badge label={a.status === 'approved' ? 'Approved' : 'Rejected'} type={a.status === 'approved' ? 'success' : 'danger'} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
//  TAB 5 — Activity Log
// ────────────────────────────────────────────────────────────────────────────
const LOGS = [
  { action: 'Role changed', detail: 'Trushant → Employee', by: 'Sandeep Dubliya', time: '2 min ago', type: 'info' },
  { action: 'Manager assigned', detail: 'Vinay → Trushant', by: 'Sandeep Dubliya', time: '5 min ago', type: 'default' },
  { action: 'Policy created', detail: 'Standard Employee Policy', by: 'Sandeep Dubliya', time: '1 hr ago', type: 'success' },
  { action: 'Budget approval sent', detail: 'London Trip · ₹45,995', by: 'Trushant', time: '2 hr ago', type: 'warning' },
  { action: 'Role changed', detail: 'sandeepdubliya80 → Manager', by: 'Sandeep Dubliya', time: '3 hr ago', type: 'info' },
];

function ActivityTab() {
  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>Activity Log</div>
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>All HR actions and changes</div>
      </div>
      <div>
        {LOGS.map((log, i) => (
          <div key={i} style={{
            padding: '14px 20px', borderBottom: i < LOGS.length - 1 ? '1px solid #f9fafb' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0,
                background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icons.Activity />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{log.action}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>{log.detail}</div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>By {log.by}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <Badge label={log.action.split(' ')[0]} type={log.type} />
              <span style={{ fontSize: '11px', color: '#9ca3af', minWidth: '60px', textAlign: 'right' }}>{log.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
//  MAIN HRDashboard
// ────────────────────────────────────────────────────────────────────────────
export default function HRDashboard({ onBack }) {
  const { user: currentUser, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('users');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/users');
      if (res.data?.success) setUsers(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (uid, newRole) => {
    try {
      await axios.patch(`/api/users/${uid}/role`, { role: newRole });
      fetchUsers();
    } catch (err) {
      alert('Failed to update role: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAssignManager = async (uid, managerId) => {
    try {
      await axios.patch(`/api/users/${uid}/assign-manager`, { managerId });
      fetchUsers();
    } catch (err) {
      alert('Failed to assign manager: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleFixNames = async () => {
    try {
      const res = await axios.patch('/api/users/fix-names');
      alert(`Done! ${res.data?.updated ?? 0} names updated.`);
      fetchUsers();
    } catch (err) {
      alert('Fix names failed: ' + (err.response?.data?.message || err.message));
    }
  };

  // Stats
  const totalUsers  = users.length;
  const managers    = users.filter(u => u.role === 'manager').length;
  const employees   = users.filter(u => u.role === 'employee').length;

  const navItems = [
    { id: 'users',     label: 'Users & Roles',    icon: Icons.Users    },
    { id: 'policy',    label: 'Travel Policies',  icon: Icons.Shield   },
    { id: 'budget',    label: 'Budget Limits',    icon: Icons.Budget   },
    { id: 'approvals', label: 'Approvals',        icon: Icons.Check    },
    { id: 'activity',  label: 'Activity Log',     icon: Icons.Activity },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Segoe UI', sans-serif" }}>

      {/* ── Navbar ── */}
      <div style={{
        background: Y, padding: '10px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12"/>
            <path d="M14.05 2a9 9 0 0 1 8 7.94"/>
            <path d="M2 6l3 3-3 3"/>
          </svg>
          <span style={{ fontSize: '14px', fontWeight: 800, color: '#1a1a1a' }}>TravPlatforms</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>
            {currentUser?.displayName || currentUser?.email}
          </span>
          <div style={{
            width: '30px', height: '30px', borderRadius: '50%', background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 800, color: '#374151', cursor: 'pointer',
          }}>
            {(currentUser?.displayName || currentUser?.email || 'U')[0].toUpperCase()}
            {(currentUser?.displayName || '').split(' ')[1]?.[0]?.toUpperCase() || ''}
          </div>
        </div>
      </div>

      {/* ── Sub bar ── */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e5e7eb',
        padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onBack} style={{
            width: '32px', height: '32px', borderRadius: '10px', background: '#f1f5f9',
            border: '1px solid #e5e7eb', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569',
          }}>
            <Icons.Back />
          </button>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#111827' }}>HR Dashboard</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '1px' }}>Manage users, roles & policies</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '12px', fontWeight: 700, padding: '5px 12px', borderRadius: '8px',
            background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a',
          }}>HR Administrator</span>
          <button onClick={logout} style={{
            padding: '7px 14px', borderRadius: '8px', background: '#fee2e2',
            color: '#dc2626', border: '1px solid #fecaca', fontWeight: 700, cursor: 'pointer', fontSize: '13px',
          }}>Logout</button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{
          margin: '16px 24px 0', padding: '12px 16px', background: '#fef2f2',
          border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '13px',
        }}>{error}</div>
      )}

      {/* ── Main layout ── */}
      <div style={{ display: 'flex', gap: '16px', padding: '20px 24px', alignItems: 'flex-start' }}>

        {/* Left sidebar */}
        <div style={{ width: '200px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '4px 12px 6px' }}>
            Management
          </div>
          {navItems.slice(0, 3).map(n => (
            <NavItem key={n.id} icon={n.icon} label={n.label} active={activeTab === n.id} onClick={() => setActiveTab(n.id)} />
          ))}
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '10px 12px 6px' }}>
            Reports
          </div>
          {navItems.slice(3).map(n => (
            <NavItem key={n.id} icon={n.icon} label={n.label} active={activeTab === n.id} onClick={() => setActiveTab(n.id)} />
          ))}
        </div>

        {/* Right content */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
            <StatCard label="Total Users" value={totalUsers} sub={`${managers} managers · ${employees} employees`} />
            <StatCard label="Active Policies" value="3" sub="1 pending approval" />
            <StatCard label="Pending Approvals" value="2" sub="Budget requests" />
            <StatCard label="Trips This Month" value="7" sub="3 approved" />
          </div>

          {/* Tab content */}
          {activeTab === 'users'     && <UsersTab users={users} loading={loading} onRoleChange={handleRoleChange} onAssignManager={handleAssignManager} onFixNames={handleFixNames} />}
          {activeTab === 'policy'    && <PoliciesTab />}
          {activeTab === 'budget'    && <BudgetTab />}
          {activeTab === 'approvals' && <ApprovalsTab />}
          {activeTab === 'activity'  && <ActivityTab />}
        </div>
      </div>
    </div>
  );
}