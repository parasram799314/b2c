// components/detail/PermissionAvatars.jsx
import React, { useState, useRef, useEffect } from 'react';
import axios from '../../../utils/axiosConfig';
import { FaWhatsapp, FaFacebook, FaTwitter, FaLinkedin, FaEnvelope, FaCopy, FaCheck } from 'react-icons/fa';

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const COLORS = [
  '#8b5cf6', '#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#ec4899'
];

export default function PermissionAvatars({ collaborators = [], rfqId, onInviteClick }) {
  const [openIdx, setOpenIdx] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { 
      if (ref.current && !ref.current.contains(e.target)) setOpenIdx(null); 
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowModal(false);
    };
    if (showModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  const handleInvite = async () => {
    if (!rfqId) {
      console.error('Missing rfqId in PermissionAvatars');
      alert('Error: Trip ID not found. Please refresh the page.');
      return;
    }

    if (inviteUrl) {
      setShowModal(true);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`/api/rfqs/${rfqId}/invite`);
      if (!res.data?.success || !res.data?.inviteCode) {
        throw new Error(res.data?.message || 'Failed to get invite code');
      }
      const { inviteCode } = res.data;
      const url = `${window.location.origin}/join/${inviteCode}`;
      setInviteUrl(url);
      setShowModal(true);
      if (onInviteClick) onInviteClick(url);
    } catch (err) {
      console.error('Invite failed:', err);
      const msg = err.response?.data?.message || err.message;
      alert(`Failed to generate invite link: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const shareText = "Hey! Join me to collaborate and plan our travel itinerary together:";
  const shareSubject = "Collaborate with me on my travel itinerary";
  const shareBody = "Hey! Join me to collaborate and plan our travel itinerary together:";

  const socialShares = [
    {
      name: 'WhatsApp',
      icon: <FaWhatsapp />,
      bg: '#25D366',
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + inviteUrl)}`
    },
    {
      name: 'Facebook',
      icon: <FaFacebook />,
      bg: '#1877F2',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteUrl)}`
    },
    {
      name: 'Twitter',
      icon: <FaTwitter />,
      bg: '#1DA1F2',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(inviteUrl)}`
    },
    {
      name: 'LinkedIn',
      icon: <FaLinkedin />,
      bg: '#0077B5',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(inviteUrl)}`
    },
    {
      name: 'Email',
      icon: <FaEnvelope />,
      bg: '#EA4335',
      href: `mailto:?subject=${encodeURIComponent(shareSubject)}&body=${encodeURIComponent(shareBody + '\n\n' + inviteUrl)}`
    }
  ];

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
        disabled={loading}
        title="Invite collaborators"
        style={{
          width: '28px', height: '28px', borderRadius: '50%',
          border: '1px dashed #cbd5e1', background: '#f8fafc',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
          color: '#64748b', fontSize: '18px', padding: 0,
          position: 'relative'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.background = '#f1f5f9'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; }}
      >
        {loading ? '...' : '+'}
      </button>

      {/* Share / Invite Modal */}
      {showModal && (
        <div 
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 100000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'
          }} 
          onClick={() => setShowModal(false)}
        >
          <style>{`
            @keyframes modalFadeIn {
              from { opacity: 0; transform: scale(0.95); }
              to { opacity: 1; transform: scale(1); }
            }
          `}</style>
          <div 
            style={{
              background: '#fff', borderRadius: '16px', width: '90%', maxWidth: '450px', padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', gap: '20px',
              position: 'relative', animation: 'modalFadeIn 0.2s ease-out', boxSizing: 'border-box'
            }} 
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  background: '#e0e7ff', color: '#4f46e5', width: '36px', height: '36px',
                  borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px'
                }}>
                  👥
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Invite Collaborators</h3>
                  <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Share link to plan the trip together in real-time</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#94a3b8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px',
                  borderRadius: '50%', transition: 'all 0.2s'
                }} 
                onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#94a3b8'; }}
              >
                ✕
              </button>
            </div>

            {/* URL Display and Copy Section */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                Collaboration Link
              </label>
              <div style={{
                display: 'flex', alignItems: 'center', background: '#f8fafc',
                border: '1px solid #e2e8f0', borderRadius: '10px', padding: '4px 4px 4px 12px',
                gap: '8px'
              }}>
                <input 
                  type="text" 
                  readOnly 
                  value={inviteUrl} 
                  onClick={e => e.target.select()}
                  style={{
                    flex: 1, background: 'none', border: 'none', outline: 'none',
                    fontSize: '13px', color: '#334155', fontFamily: 'monospace',
                    textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap'
                  }}
                />
                <button 
                  onClick={handleCopy}
                  style={{
                    background: '#4f46e5', color: '#fff', border: 'none',
                    borderRadius: '8px', padding: '8px 16px', display: 'flex',
                    alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600,
                    cursor: 'pointer', transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#4338ca'}
                  onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}
                >
                  {showCopied ? <FaCheck /> : <FaCopy />}
                  {showCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Separator */}
            <div style={{ display: 'flex', alignItems: 'center', textAlign: 'center', margin: '4px 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#cbd5e1' }} />
              <span style={{ padding: '0 10px', fontSize: '10px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Or Share Via
              </span>
              <div style={{ flex: 1, height: '1px', background: '#cbd5e1' }} />
            </div>

            {/* Social Share Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', width: '100%' }}>
              {socialShares.map(item => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Share on ${item.name}`}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: '6px', textDecoration: 'none', cursor: 'pointer'
                  }}
                >
                  <div 
                    style={{
                      width: '42px', height: '42px', borderRadius: '50%',
                      background: item.bg, color: '#fff', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                      transition: 'transform 0.2s, filter 0.2s',
                      boxShadow: `0 4px 6px -1px ${item.bg}33`
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.filter = 'brightness(0.9)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'none'; }}
                  >
                    {item.icon}
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>{item.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}