// components/detail/PermissionAvatars.jsx
import React, { useState, useRef, useEffect } from 'react';
import axios from '../../../utils/axiosConfig';

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const COLORS = [
  '#8b5cf6', '#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#ec4899'
];

export default function PermissionAvatars({ collaborators = [], rfqId, onInviteClick }) {
  const [openIdx, setOpenIdx] = useState(null);
  const [showCopied, setShowCopied] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { 
      if (ref.current && !ref.current.contains(e.target)) setOpenIdx(null); 
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInvite = async () => {
    if (!rfqId) {
      console.error('Missing rfqId in PermissionAvatars');
      alert('Error: Trip ID not found. Please refresh the page.');
      return;
    }
    try {
      const res = await axios.post(`/api/rfqs/${rfqId}/invite`);
      if (!res.data?.success || !res.data?.inviteCode) {
        throw new Error(res.data?.message || 'Failed to get invite code');
      }
      const { inviteCode } = res.data;
      const inviteUrl = `${window.location.origin}/join/${inviteCode}`;
      await navigator.clipboard.writeText(inviteUrl);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
      if (onInviteClick) onInviteClick(inviteUrl);
    } catch (err) {
      console.error('Invite failed:', err);
      const msg = err.response?.data?.message || err.message;
      alert(`Failed to generate invite link: ${msg}`);
    }
  };

  return (
    <div ref={ref} style={{ display:'flex', alignItems:'center', gap: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {collaborators.map((u, i) => (
          <div
            key={u.uid || i}
            style={{ position:'relative', zIndex: collaborators.length - i }}
            onMouseEnter={() => setOpenIdx(i)}
            onMouseLeave={() => setOpenIdx(null)}
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
          >
            <div style={{
              width:'28px', height:'28px', borderRadius:'50%',
              background: COLORS[i % COLORS.length], color:'#fff',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'11px', fontWeight:700,
              border:'2px solid #fff',
              marginRight: i < collaborators.length - 1 ? '-8px' : '0',
              cursor:'pointer',
              transition:'transform 0.15s',
              transform: openIdx === i ? 'scale(1.18)' : 'scale(1)',
              boxShadow: openIdx === i ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
              userSelect: 'none',
            }}>
              {getInitials(u.name)}
            </div>
            {openIdx === i && (
              <div style={{
                position:'absolute', top:'34px', left:'50%', transform:'translateX(-50%)',
                background:'#1f2937', color:'#fff',
                borderRadius:'9px', padding:'8px 11px',
                fontSize:'11px', whiteSpace:'nowrap',
                zIndex: 9999,
                boxShadow:'0 4px 16px rgba(0,0,0,0.22)',
              }}>
                <div style={{
                  position:'absolute', top:'-5px', left:'50%', transform:'translateX(-50%)',
                  width:0, height:0,
                  borderLeft:'5px solid transparent', borderRight:'5px solid transparent',
                  borderBottom:'5px solid #1f2937',
                }} />
                <div style={{ fontWeight:700, fontSize:'11px', marginBottom:'4px', color:'#f9fafb' }}>{u.name}</div>
                <div style={{ fontSize:'10px', color: '#9ca3af', marginBottom: '6px' }}>{u.email}</div>
                <span style={{
                  fontSize:'9px', fontWeight:600,
                  background: u.role === 'admin' ? '#ede9fe' : '#dbeafe', 
                  color: u.role === 'admin' ? '#5b21b6' : '#1e40af',
                  padding:'1px 6px', borderRadius:'4px',
                  display:'inline-block',
                  textTransform: 'capitalize'
                }}>
                  {u.role || 'Editor'}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleInvite}
        title="Invite collaborators"
        style={{
          width: '28px', height: '28px', borderRadius: '50%',
          border: '1px dashed #cbd5e1', background: '#f8fafc',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.2s',
          color: '#64748b', fontSize: '18px', padding: 0,
          position: 'relative'
        }}
        onMouseEnter={(e) => { e.target.style.borderColor = '#94a3b8'; e.target.style.background = '#f1f5f9'; }}
        onMouseLeave={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.background = '#f8fafc'; }}
      >
        +
        {showCopied && (
          <div style={{
            position: 'absolute', top: '-30px', left: '50%', transform: 'translateX(-50%)',
            background: '#10b981', color: '#fff', fontSize: '10px', padding: '4px 8px',
            borderRadius: '4px', whiteSpace: 'nowrap', fontWeight: 600
          }}>
            Link Copied!
          </div>
        )}
      </button>
    </div>
  );
}