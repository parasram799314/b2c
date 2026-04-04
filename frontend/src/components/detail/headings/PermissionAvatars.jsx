// components/detail/PermissionAvatars.jsx
import React, { useState, useRef, useEffect } from 'react';

const DUMMY_USERS = [
  { initial: 'T', name: 'Trushant Shah', permission: 'Admin',    permBg: '#ede9fe', permColor: '#5b21b6', avatarBg: '#8b5cf6' },
  { initial: 'R', name: 'Rahul Mehta',   permission: 'Can Edit', permBg: '#dbeafe', permColor: '#1e40af', avatarBg: '#0ea5e9' },
  { initial: 'P', name: 'Priya Nair',    permission: 'View Only',permBg: '#d1fae5', permColor: '#065f46', avatarBg: '#f59e0b' },
];

export default function PermissionAvatars() {
  const [openIdx, setOpenIdx] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { 
      if (ref.current && !ref.current.contains(e.target)) setOpenIdx(null); 
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ display:'flex', alignItems:'center' }}>
      {DUMMY_USERS.map((u, i) => (
        <div
          key={i}
          style={{ position:'relative', zIndex: DUMMY_USERS.length - i }}
          onMouseEnter={() => setOpenIdx(i)}
          onMouseLeave={() => setOpenIdx(null)}
          onClick={() => setOpenIdx(openIdx === i ? null : i)}
        >
          <div style={{
            width:'26px', height:'26px', borderRadius:'50%',
            background: u.avatarBg, color:'#fff',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'10px', fontWeight:700,
            border:'2px solid #fff',
            marginRight: i < DUMMY_USERS.length - 1 ? '-6px' : '0',
            cursor:'pointer',
            transition:'transform 0.15s',
            transform: openIdx === i ? 'scale(1.18)' : 'scale(1)',
            boxShadow: openIdx === i ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
            userSelect: 'none',
          }}>
            {u.initial}
          </div>
          {openIdx === i && (
            <div style={{
              position:'absolute', top:'32px', left:'50%', transform:'translateX(-50%)',
              background:'#1f2937', color:'#fff',
              borderRadius:'9px', padding:'8px 11px',
              fontSize:'11px', whiteSpace:'nowrap',
              zIndex:9999, pointerEvents:'none',
              boxShadow:'0 4px 16px rgba(0,0,0,0.22)',
            }}>
              <div style={{
                position:'absolute', top:'-5px', left:'50%', transform:'translateX(-50%)',
                width:0, height:0,
                borderLeft:'5px solid transparent', borderRight:'5px solid transparent',
                borderBottom:'5px solid #1f2937',
              }} />
              <div style={{ fontWeight:700, fontSize:'11px', marginBottom:'5px', color:'#f9fafb' }}>{u.name}</div>
              <span style={{
                fontSize:'10px', fontWeight:600,
                background: u.permBg, color: u.permColor,
                padding:'2px 8px', borderRadius:'4px',
                display:'inline-block',
              }}>
                {u.permission}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}