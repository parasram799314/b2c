// components/detail/GroupChatBox.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';

// ─── Emoji Picker Data ────────────────────────────────────────────────────────
const EMOJIS = ['👍','❤️','😂','😮','😢','🎉','✈️','🏨','🗺️','💰','👌','🔥'];

// ─── Typing Indicator ─────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 0' }}>
      {[0,1,2].map(i => (
        <span key={i} style={{
          width: '5px', height: '5px', borderRadius: '50%', background: '#9ca3af',
          display: 'inline-block',
          animation: 'typingBounce 1.2s ease-in-out infinite',
          animationDelay: `${i * 0.18}s`,
        }} />
      ))}
      <style>{`@keyframes typingBounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
    </span>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg, isOwn, user, showAvatar, onReact, reactions }) {
  const [showReactions, setShowReactions] = useState(false);
  const reactionRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (reactionRef.current && !reactionRef.current.contains(e.target)) setShowReactions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: isOwn ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      gap: '8px',
      marginBottom: '14px',
      padding: '0 4px',
      position: 'relative',
    }}>
      {/* Avatar */}
      {!isOwn && (
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%',
          background: user?.avatarBg || '#8b5cf6',
          color: '#fff', fontSize: '11px', fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, opacity: showAvatar ? 1 : 0,
          border: '2px solid #fff',
          boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
        }}>
          {user?.initial}
        </div>
      )}

      <div style={{ maxWidth: '70%', position: 'relative' }}>
        {/* Sender name */}
        {!isOwn && showAvatar && (
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', marginBottom: '3px', paddingLeft: '2px' }}>
            {user?.name}
          </div>
        )}

        {/* Bubble */}
        <div
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
          ref={reactionRef}
          style={{
            background: isOwn ? 'rgb(247,190,57)' : '#fff',
            color: isOwn ? '#1a1a1a' : '#111827',
            padding: '10px 14px',
            borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            fontSize: '13px', lineHeight: '1.5', fontWeight: 500,
            boxShadow: isOwn
              ? '0 4px 14px rgba(247,190,57,0.32)'
              : '0 2px 8px rgba(0,0,0,0.08)',
            border: isOwn ? 'none' : '1px solid #f1f5f9',
            position: 'relative',
            cursor: 'default',
          }}
        >
          {msg.text}

          {/* Time */}
          <div style={{
            fontSize: '9px', color: isOwn ? 'rgba(0,0,0,0.45)' : '#9ca3af',
            marginTop: '4px', textAlign: 'right', fontWeight: 600,
          }}>
            {msg.time}
          </div>

          {/* Reaction Picker — on hover */}
          {showReactions && (
            <div style={{
              position: 'absolute',
              [isOwn ? 'left' : 'right']: 0,
              bottom: 'calc(100% + 6px)',
              background: '#fff', borderRadius: '24px',
              padding: '5px 8px',
              display: 'flex', gap: '3px',
              boxShadow: '0 6px 24px rgba(0,0,0,0.14)',
              border: '1px solid #f1f5f9',
              zIndex: 50,
              whiteSpace: 'nowrap',
            }}>
              {EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={(e) => { e.stopPropagation(); onReact(msg.id, emoji); setShowReactions(false); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '16px', lineHeight: 1, padding: '2px',
                    borderRadius: '6px', transition: 'transform 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.35)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reactions display */}
        {reactions && reactions.length > 0 && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '3px',
            marginTop: '4px', justifyContent: isOwn ? 'flex-end' : 'flex-start',
          }}>
            {Object.entries(
              reactions.reduce((acc, r) => { acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc; }, {})
            ).map(([emoji, count]) => (
              <span key={emoji} style={{
                background: '#f9fafb', border: '1px solid #e5e7eb',
                borderRadius: '12px', padding: '1px 6px',
                fontSize: '11px', fontWeight: 700, color: '#374151',
              }}>
                {emoji} {count > 1 ? count : ''}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main GroupChatBox ────────────────────────────────────────────────────────
export default function GroupChatBox({ rfq, socket, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [typingUsers, setTypingUsers] = useState([]); // [{userId, name}]
  const [reactions, setReactions] = useState({}); // { msgId: [{userId, emoji}] }
  const [showOnline, setShowOnline] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unread, setUnread] = useState(0);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const displayTripId = rfq?.rfqId || rfq?._id || 'demo-trip';

  // Load local profile
  const savedProfileStr = localStorage.getItem('tp_profile');
  let localProfile = {};
  if (savedProfileStr) {
    try {
      localProfile = JSON.parse(savedProfileStr);
    } catch (e) {
      console.error(e);
    }
  }

  const COLORS = ['#8b5cf6', '#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#ec4899'];
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Derive Chat Users from RFQ Collaborators
  const collaborators = rfq?.collaborators || [];
  let chatUsers = collaborators.map((c, idx) => ({
    id: c.uid || c.email || String(idx),
    name: c.name,
    permission: c.role === 'admin' ? 'Admin' : c.role === 'editor' ? 'Can Edit' : 'View Only',
    avatarBg: COLORS[idx % COLORS.length],
    initial: getInitials(c.name),
    email: c.email
  }));

  if (chatUsers.length === 0) {
    const fallbackName = rfq?.travelerName || localProfile?.fullName || 'Trushant Shah';
    chatUsers = [
      {
        id: 'admin-user',
        name: fallbackName,
        permission: 'Admin',
        avatarBg: '#8b5cf6',
        initial: getInitials(fallbackName),
        email: rfq?.travelerEmail || ''
      }
    ];
  }

  // Resolve current logged in sender
  const localName = localProfile?.fullName || '';
  const localEmail = localProfile?.email || '';
  let activeUser = chatUsers.find(u => u.email === localEmail || u.name === localName);
  if (!activeUser) {
    activeUser = chatUsers[0];
  }

  // Listen to socket events
  useEffect(() => {
    if (!socket) return;

    // Join room
    socket.emit('join_trip', displayTripId);

    const handleChatHistory = ({ messages: history }) => {
      setMessages(history);
    };

    const handleReceiveMessage = ({ message }) => {
      setMessages(prev => {
        if (prev.find(m => m.id === message.id)) return prev;
        return [...prev, message];
      });

      if (isMinimized) {
        setUnread(prev => prev + 1);
      }
    };

    const handleTyping = ({ userId, userName, isTyping }) => {
      if (isTyping) {
        setTypingUsers(prev => {
          if (prev.find(u => u.userId === userId)) return prev;
          return [...prev, { userId, name: userName }];
        });
      } else {
        setTypingUsers(prev => prev.filter(u => u.userId !== userId));
      }
    };

    const handleReceiveReaction = ({ msgId, userId, emoji }) => {
      setReactions(prev => {
        const existing = prev[msgId] || [];
        const alreadyReacted = existing.find(r => r.userId === userId && r.emoji === emoji);
        if (alreadyReacted) {
          return { ...prev, [msgId]: existing.filter(r => !(r.userId === userId && r.emoji === emoji)) };
        }
        return { ...prev, [msgId]: [...existing, { userId, emoji }] };
      });
    };

    socket.on('chat_history', handleChatHistory);
    socket.on('receive_chat_message', handleReceiveMessage);
    socket.on('typing', handleTyping);
    socket.on('receive_reaction', handleReceiveReaction);

    return () => {
      socket.off('chat_history', handleChatHistory);
      socket.off('receive_chat_message', handleReceiveMessage);
      socket.off('typing', handleTyping);
      socket.off('receive_reaction', handleReceiveReaction);
    };
  }, [socket, displayTripId, isMinimized]);

  // Auto scroll to bottom
  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;

    const newMsg = {
      id: String(Date.now()),
      userId: activeUser.id,
      userName: activeUser.name,
      text,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setShowEmoji(false);

    // Emit via socket
    if (socket) {
      socket.emit('send_chat_message', { tripId: displayTripId, message: newMsg });
      
      // Stop typing indicator immediately
      socket.emit('typing', {
        tripId: displayTripId,
        userId: activeUser.id,
        userName: activeUser.name,
        isTyping: false
      });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  }, [inputText, activeUser, displayTripId, socket]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    
    // Emit typing status
    if (socket) {
      socket.emit('typing', {
        tripId: displayTripId,
        userId: activeUser.id,
        userName: activeUser.name,
        isTyping: true
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', {
          tripId: displayTripId,
          userId: activeUser.id,
          userName: activeUser.name,
          isTyping: false
        });
      }, 2000);
    }
  };

  const handleReact = (msgId, emoji) => {
    if (socket) {
      socket.emit('react_to_message', {
        tripId: displayTripId,
        msgId,
        userId: activeUser.id,
        emoji
      });
    }

    setReactions(prev => {
      const existing = prev[msgId] || [];
      const alreadyReacted = existing.find(r => r.userId === activeUser.id && r.emoji === emoji);
      if (alreadyReacted) {
        return { ...prev, [msgId]: existing.filter(r => !(r.userId === activeUser.id && r.emoji === emoji)) };
      }
      return { ...prev, [msgId]: [...existing, { userId: activeUser.id, emoji }] };
    });
  };

  // Filter messages for search
  const filteredMessages = searchText
    ? messages.filter(m => m.text.toLowerCase().includes(searchText.toLowerCase()))
    : messages;

  // Group messages by sender (show avatar only on last consecutive msg)
  const getShowAvatar = (index) => {
    const msg = filteredMessages[index];
    const next = filteredMessages[index + 1];
    return !next || next.userId !== msg.userId;
  };

  if (isMinimized) {
    return (
      <div
        onClick={() => { setIsMinimized(false); setUnread(0); }}
        style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          background: 'rgb(247,190,57)',
          borderRadius: '20px', padding: '10px 18px',
          display: 'flex', alignItems: 'center', gap: '10px',
          cursor: 'pointer', boxShadow: '0 8px 30px rgba(247,190,57,0.45)',
          userSelect: 'none',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="#1a1a1a" opacity="0.85"/>
        </svg>
        <span style={{ fontSize: '13px', fontWeight: 800, color: '#1a1a1a' }}>Group Chat</span>
        {unread > 0 && (
          <span style={{
            background: '#dc2626', color: '#fff',
            borderRadius: '12px', padding: '1px 7px',
            fontSize: '11px', fontWeight: 800,
          }}>
            {unread}
          </span>
        )}
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9998,
      width: '360px',
      height: '520px',
      background: '#fff',
      borderRadius: '20px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
      border: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      animation: 'chatSlideUp 0.28s cubic-bezier(0.22,1,0.36,1)',
    }}>
      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .chat-input::placeholder { color: #9ca3af; }
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        background: '#fff',
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: '10px',
        flexShrink: 0,
        borderBottom: '1px solid #f1f5f9',
      }}>
        {/* Group Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '12px',
            background: 'rgb(247,190,57)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="9" cy="7" r="4" stroke="#1a1a1a" strokeWidth="2"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{
            position: 'absolute', bottom: '-2px', right: '-2px',
            width: '10px', height: '10px', borderRadius: '50%',
            background: '#22c55e', border: '2px solid #fff',
          }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 900, color: '#111827' }}>Trip Group Chat</div>
          <div
            style={{ fontSize: '10px', fontWeight: 600, color: '#9ca3af', cursor: 'pointer' }}
            onClick={() => setShowOnline(v => !v)}
          >
            {chatUsers.length} members • <span style={{ color: '#16a34a' }}>{chatUsers.length} online</span>
          </div>
        </div>

        {/* Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setSearchOpen(v => !v)}
            style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: searchOpen ? 'rgb(247,190,57)' : '#f3f4f6',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke={searchOpen ? '#fff' : '#6b7280'} strokeWidth="2.5"/>
              <path d="M16.5 16.5L21 21" stroke={searchOpen ? '#fff' : '#6b7280'} strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: '#f3f4f6', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', color: '#6b7280', lineHeight: 1,
              transition: 'background 0.15s',
            }}
          >
            –
          </button>
          <button
            onClick={onClose}
            style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: '#f3f4f6', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '15px', fontWeight: 800, color: '#6b7280',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#dc2626'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#6b7280'; }}
          >
            ×
          </button>
        </div>
      </div>

      {/* ── Online Members Dropdown ── */}
      {showOnline && (
        <div style={{
          background: '#fafafa', borderBottom: '1px solid #f1f5f9',
          padding: '10px 16px', flexShrink: 0,
          display: 'flex', gap: '10px', flexWrap: 'wrap',
        }}>
          {chatUsers.map(u => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '22px', height: '22px', borderRadius: '50%',
                background: u.avatarBg, color: '#fff',
                fontSize: '9px', fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}>
                {u.initial}
                <span style={{ position: 'absolute', bottom: '-1px', right: '-1px', width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', border: '1.5px solid #fafafa' }} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#374151' }}>{u.name.split(' ')[0]}</span>
              <span style={{ fontSize: '9px', color: '#9ca3af' }}>{u.permission}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Search Bar ── */}
      {searchOpen && (
        <div style={{ padding: '8px 14px', borderBottom: '1px solid #f1f5f9', flexShrink: 0, background: '#fafafa' }}>
          <input
            autoFocus
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="Search messages..."
            className="chat-input"
            style={{
              width: '100%', fontSize: '12px', border: '1px solid #e5e7eb',
              borderRadius: '8px', padding: '7px 12px', outline: 'none',
              background: '#fff', boxSizing: 'border-box', color: '#111827',
            }}
          />
        </div>
      )}

      {/* ── Messages Area ── */}
      <div
        className="chat-scroll"
        style={{
          flex: 1, overflowY: 'auto',
          padding: '16px 12px 8px',
          background: '#f8fafc',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Date separator */}
        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
          <span style={{
            fontSize: '10px', fontWeight: 700, color: '#9ca3af',
            background: '#fff', padding: '3px 12px', borderRadius: '12px',
            border: '1px solid #e5e7eb',
          }}>Today</span>
        </div>

        {filteredMessages.map((msg, idx) => {
          const user = chatUsers.find(u => u.id === msg.userId || u.name === msg.userName);
          const isOwn = msg.userId === activeUser.id || msg.userName === activeUser.name;
          return (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isOwn={isOwn}
              user={user}
              showAvatar={getShowAvatar(idx)}
              onReact={handleReact}
              reactions={reactions[msg.id] || []}
            />
          );
        })}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '12px', padding: '0 4px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: chatUsers.find(u => u.id === typingUsers[0].userId)?.avatarBg || '#8b5cf6',
              color: '#fff', fontSize: '11px', fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #fff', boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
            }}>
              {chatUsers.find(u => u.id === typingUsers[0].userId)?.initial}
            </div>
            <div style={{
              background: '#fff', borderRadius: '18px 18px 18px 4px',
              padding: '10px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
              border: '1px solid #f1f5f9',
            }}>
              <TypingDots />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Emoji Picker ── */}
      {showEmoji && (
        <div style={{
          background: '#fff', borderTop: '1px solid #f1f5f9',
          padding: '10px 14px', flexShrink: 0,
          display: 'flex', flexWrap: 'wrap', gap: '6px',
        }}>
          {EMOJIS.map(emoji => (
            <button
              key={emoji}
              onClick={() => { setInputText(prev => prev + emoji); setShowEmoji(false); inputRef.current?.focus(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', padding: '2px', lineHeight: 1, borderRadius: '6px', transition: 'transform 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.3)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* ── Input Area ── */}
      <div style={{
        padding: '10px 14px 14px',
        borderTop: '1px solid #f1f5f9',
        background: '#fff', flexShrink: 0,
      }}>
        {/* Active user indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          marginBottom: '8px', fontSize: '10px', color: '#9ca3af', fontWeight: 600,
        }}>
          <div style={{
            width: '16px', height: '16px', borderRadius: '50%',
            background: activeUser.avatarBg, color: '#fff',
            fontSize: '8px', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {activeUser.initial}
          </div>
          Sending as <span style={{ color: '#374151', fontWeight: 700 }}>{activeUser.name}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Emoji button */}
          <button
            onClick={() => setShowEmoji(v => !v)}
            style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: showEmoji ? 'rgb(247,190,57)' : '#f3f4f6',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', flexShrink: 0, transition: 'background 0.15s',
            }}
          >
            😊
          </button>

          {/* Text Input */}
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              ref={inputRef}
              rows={1}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="chat-input"
              style={{
                width: '100%', resize: 'none', overflowY: 'hidden',
                fontSize: '13px', border: '1.5px solid #e5e7eb',
                borderRadius: '12px', padding: '9px 14px',
                outline: 'none', fontFamily: 'inherit', lineHeight: '1.4',
                color: '#111827', background: '#fafafa',
                boxSizing: 'border-box', transition: 'border-color 0.15s',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgb(247,190,57)'; }}
              onBlur={e  => { e.target.style.borderColor = '#e5e7eb'; }}
            />
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            style={{
              width: '36px', height: '36px', borderRadius: '12px',
              background: inputText.trim() ? 'rgb(247,190,57)' : '#f3f4f6',
              border: 'none', cursor: inputText.trim() ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all 0.15s',
              boxShadow: inputText.trim() ? '0 4px 12px rgba(247,190,57,0.4)' : 'none',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke={inputText.trim() ? '#1a1a1a' : '#9ca3af'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}