// components/detail/ViewAttachmentsModal.jsx
// ─── Slide-in drawer: shows all notes + attachments from every plan item ──────

import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Helpers ──────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return '';
  try {
    const dt = new Date(d + (d.includes('T') ? '' : 'T00:00:00'));
    return dt.toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return d;
  }
};

const getResolvedDate = (item) => {
  let d = '';
  if (item.type === 'flight')     d = item.depDate    || item.date || '';
  if (item.type === 'hotel')      d = item.checkIn    || item.date || '';
  if (item.type === 'transfer')   d = item.pickupDate || item.date || '';
  if (item.type === 'attraction') d = item.date || '';
  if (item.type === 'other')      d = item.date || '';
  if (!d && item.id) {
    const parts = item.id.split('_');
    const last  = parts[parts.length - 1];
    if (/^\d{4}-\d{2}-\d{2}$/.test(last)) d = last;
  }
  return d;
};

const TYPE_META = {
  flight:     { icon: '✈️', label: 'Flight'     },
  hotel:      { icon: '🏨', label: 'Hotel'      },
  attraction: { icon: '🗺️', label: 'Attraction' },
  transfer:   { icon: '🚗', label: 'Transfer'   },
  other:      { icon: '📌', label: 'Activity'   },
};

const IMG_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

const isImageFile = (name = '') =>
  IMG_EXTS.includes((name.split('.').pop() || '').toLowerCase());

// ─── File icon by extension ────────────────────────────────────
function FileIcon({ name = '' }) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (IMG_EXTS.includes(ext))               return <span style={{ fontSize: 18 }}>🖼️</span>;
  if (ext === 'pdf')                         return <span style={{ fontSize: 18 }}>📄</span>;
  if (['doc', 'docx'].includes(ext))        return <span style={{ fontSize: 18 }}>📝</span>;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return <span style={{ fontSize: 18 }}>📊</span>;
  return <span style={{ fontSize: 18 }}>📎</span>;
}

// ─── Image Thumbnail Grid ──────────────────────────────────────
function ImageGrid({ files, onPreview }) {
  const imgFiles = files.filter(f => isImageFile(f.name) && (f.dataUrl || f.url));
  if (!imgFiles.length) return null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
        gap: '8px',
        marginBottom: imgFiles.length < files.length ? '8px' : '0',
      }}
    >
      {imgFiles.map((file, i) => (
        <div
          key={i}
          onClick={() => onPreview(file)}
          style={{
            position: 'relative',
            borderRadius: '10px',
            overflow: 'hidden',
            aspectRatio: '1 / 1',
            cursor: 'pointer',
            border: '2px solid #e5e7eb',
            background: '#f3f4f6',
            transition: 'border-color 0.15s, transform 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgb(247,190,57)';
            e.currentTarget.style.transform   = 'scale(1.04)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.transform   = 'scale(1)';
          }}
        >
          <img
            src={file.dataUrl || file.url}
            alt={file.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {/* Magnify overlay */}
          <div
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.28)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0)'; }}
          >
            <span style={{ fontSize: '18px', pointerEvents: 'none', opacity: 0.9 }}>🔍</span>
          </div>
          {/* File name tooltip */}
          <div
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'rgba(0,0,0,0.55)',
              padding: '3px 5px',
              fontSize: '9px', fontWeight: 700, color: '#fff',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            {file.name}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Single item row ───────────────────────────────────────────
function AttachmentItemRow({ item, onPreview }) {
  const [expanded, setExpanded] = useState(true);

  const meta         = TYPE_META[item.type] || { icon: '📌', label: item.type };
  const titleText    = item.type === 'flight'
    ? `${item.fromAirport || item.from || ''} → ${item.toAirport || item.to || ''}`
    : item.hotelName || item.name || item.type;
  const resolvedDate = getResolvedDate(item);
  const attachments  = item.attachments || [];
  const note         = item.userNote || item.note || '';
  const hasContent   = !!(note || attachments.length);
  const nonImgFiles  = attachments.filter(f => !isImageFile(f.name));

  const handleFileClick = (file) => {
    if (file.url) {
      window.open(file.url, '_blank', 'noopener,noreferrer');
    } else if (file.dataUrl) {
      const a = document.createElement('a');
      a.href     = file.dataUrl;
      a.download = file.name || 'file';
      a.click();
    }
  };

  return (
    <div
      style={{
        border: '1.5px solid #e5e7eb', borderRadius: '14px',
        overflow: 'hidden', background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      {/* ── Item Header ── */}
      <div
        onClick={() => setExpanded(v => !v)}
        style={{
          padding: '12px 16px', display: 'flex', alignItems: 'center',
          gap: '10px', cursor: 'pointer',
          background: expanded ? '#fafafa' : '#fff',
          borderBottom: expanded && hasContent ? '1px solid #f3f4f6' : 'none',
          transition: 'background 0.15s',
        }}
      >
        <div
          style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: '#f3f4f6', border: '1px solid #e5e7eb',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', flexShrink: 0,
          }}
        >
          {meta.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '13px', fontWeight: 800, color: '#111827',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            {titleText}
          </div>
          <div
            style={{
              fontSize: '11px', color: '#94a3b8', marginTop: '2px',
              display: 'flex', gap: '8px', alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: '9px', fontWeight: 700, padding: '1px 6px',
                borderRadius: '4px', background: '#f3f4f6', color: '#6b7280',
                textTransform: 'uppercase',
              }}
            >
              {meta.label}
            </span>
            {resolvedDate && <span>{fmtDate(resolvedDate)}</span>}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {note && (
            <span
              style={{
                fontSize: '10px', fontWeight: 700, padding: '2px 8px',
                borderRadius: '20px', background: '#fef9c3', color: '#92400e',
              }}
            >
              📝 Note
            </span>
          )}
          {attachments.length > 0 && (
            <span
              style={{
                fontSize: '10px', fontWeight: 700, padding: '2px 8px',
                borderRadius: '20px', background: '#dbeafe', color: '#1e40af',
              }}
            >
              📎 {attachments.length}
            </span>
          )}
          {!hasContent && (
            <span style={{ fontSize: '11px', color: '#d1d5db' }}>—</span>
          )}
          <div
            style={{
              width: '24px', height: '24px', borderRadius: '6px',
              border: '1px solid #e5e7eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="3">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      {expanded && hasContent && (
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Note */}
          {note && (
            <div
              style={{
                background: '#fffbeb', border: '1px solid #fde68a',
                borderRadius: '10px', padding: '10px 14px',
              }}
            >
              <div
                style={{
                  fontSize: '10px', fontWeight: 700, color: '#92400e',
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px',
                }}
              >
                📝 Note
              </div>
              <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                {note}
              </div>
            </div>
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '10px', fontWeight: 700, color: '#6b7280',
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px',
                }}
              >
                📎 Attachments ({attachments.length})
              </div>

              {/* Image grid */}
              <ImageGrid files={attachments} onPreview={onPreview} />

              {/* Non-image files */}
              {nonImgFiles.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {nonImgFiles.map((file, fi) => (
                    <div
                      key={fi}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '8px 12px', borderRadius: '10px',
                        border: '1px solid #e5e7eb', background: '#f9fafb',
                        cursor: file.url || file.dataUrl ? 'pointer' : 'default',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => {
                        if (file.url || file.dataUrl)
                          e.currentTarget.style.background = '#f1f5f9';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = '#f9fafb';
                      }}
                      onClick={() => handleFileClick(file)}
                    >
                      <FileIcon name={file.name} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '12px', fontWeight: 700, color: '#111827',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}
                        >
                          {file.name || `File ${fi + 1}`}
                        </div>
                        {file.size && (
                          <div style={{ fontSize: '10px', color: '#9ca3af' }}>
                            {(file.size / 1024).toFixed(1)} KB
                          </div>
                        )}
                      </div>
                      {(file.url || file.dataUrl) && (
                        <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>
                          ⬇ Download
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {expanded && !hasContent && (
        <div style={{ padding: '12px 16px', fontSize: '12px', color: '#d1d5db', fontStyle: 'italic' }}>
          No notes or attachments added.
        </div>
      )}
    </div>
  );
}

// ─── Image Preview Modal ───────────────────────────────────────
function ImagePreview({ file, onClose }) {
  useEffect(() => {
    if (!file) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [file, onClose]);

  if (!file) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        animation: 'fadeInBg 0.18s ease',
      }}
    >
      <style>{`
        @keyframes fadeInBg  { from { opacity: 0; }              to { opacity: 1; } }
        @keyframes zoomInImg { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          maxWidth: '90vw',
          animation: 'zoomInImg 0.2s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <img
          src={file.dataUrl || file.url}
          alt={file.name}
          style={{
            maxWidth: '88vw', maxHeight: '78vh',
            borderRadius: '14px', objectFit: 'contain',
            boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
            display: 'block',
          }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '-14px', right: '-14px',
            width: '32px', height: '32px', borderRadius: '50%',
            background: '#fff', border: 'none', cursor: 'pointer',
            fontSize: '14px', fontWeight: 800, color: '#374151',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#fee2e2';
            e.currentTarget.style.color      = '#dc2626';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.color      = '#374151';
          }}
        >
          ✕
        </button>
      </div>

      {/* File name + download */}
      <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span
          style={{
            fontSize: '12px', color: '#94a3b8', fontWeight: 600,
            maxWidth: '260px', overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
        >
          {file.name}
        </span>
        {file.dataUrl && (
          <a
            href={file.dataUrl}
            download={file.name || 'image'}
            onClick={e => e.stopPropagation()}
            style={{
              fontSize: '11px', fontWeight: 700, color: '#fff',
              background: 'rgba(255,255,255,0.15)',
              padding: '5px 14px', borderRadius: '20px',
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.25)',
              transition: 'background 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.28)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
          >
            ⬇ Download
          </a>
        )}
      </div>

      {/* Hint */}
      <div style={{ marginTop: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
        Click anywhere or press Esc to close
      </div>
    </div>
  );
}

// ─── Main ViewAttachmentsModal ─────────────────────────────────
export default function ViewAttachmentsModal({ planItems = [], onClose }) {
  const [search,      setSearch]      = useState('');
  const [filterType,  setFilterType]  = useState('all');
  const [previewFile, setPreviewFile] = useState(null);
  const drawerRef = useRef(null);

  // Stable close handler to avoid stale closures
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Close on outside click (only when no preview is open)
  useEffect(() => {
    const handler = (e) => {
      if (
        !previewFile &&
        drawerRef.current &&
        !drawerRef.current.contains(e.target)
      ) {
        handleClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [handleClose, previewFile]);

  // Close drawer on Escape (preview has its own Escape handler)
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && !previewFile) handleClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleClose, previewFile]);

  const baseItems        = planItems.filter(p => !p._isHotelContinuation);
  const totalNotes       = baseItems.filter(p => p.userNote || p.note).length;
  const totalAttachments = baseItems.reduce((s, p) => s + (p.attachments?.length || 0), 0);

  const filtered = baseItems.filter(item => {
    const note        = item.userNote || item.note || '';
    const attachments = item.attachments || [];
    const title       = item.type === 'flight'
      ? `${item.from || ''} ${item.to || ''} ${item.airline || ''}`
      : item.hotelName || item.name || '';

    if (filterType === 'withNote' && !note)             return false;
    if (filterType === 'withFile' && !attachments.length) return false;
    if (search && !title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const FILTER_TABS = [
    { id: 'all',      label: `All (${baseItems.length})`   },
    { id: 'withNote', label: `Notes (${totalNotes})`       },
    { id: 'withFile', label: `Files (${totalAttachments})` },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9990,
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 9991,
          width: '420px', maxWidth: '95vw',
          background: '#fff',
          display: 'flex', flexDirection: 'column',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
          animation: 'slideInRight 0.25s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
        `}</style>

        {/* ── Header ── */}
        <div
          style={{
            padding: '16px 20px', borderBottom: '1px solid #f3f4f6',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#fff', flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: '#111827' }}>
              Notes & Attachments
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
              {totalNotes} note{totalNotes !== 1 ? 's' : ''} · {totalAttachments} file{totalAttachments !== 1 ? 's' : ''} across {baseItems.length} items
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: '#f3f4f6', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', color: '#6b7280', fontWeight: 700,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#fee2e2';
              e.currentTarget.style.color      = '#dc2626';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.color      = '#6b7280';
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Search + Filter ── */}
        <div
          style={{
            padding: '12px 20px', borderBottom: '1px solid #f3f4f6',
            flexShrink: 0, background: '#fafafa',
          }}
        >
          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <svg
              style={{
                position: 'absolute', left: '10px', top: '50%',
                transform: 'translateY(-50%)', pointerEvents: 'none',
              }}
              width="13" height="13" viewBox="0 0 24 24" fill="none"
            >
              <circle cx="11" cy="11" r="7" stroke="#9ca3af" strokeWidth="2" />
              <path d="M16.5 16.5L21 21" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search items..."
              style={{
                width: '100%', fontSize: '12px',
                border: '1px solid #e5e7eb', borderRadius: '10px',
                padding: '7px 30px 7px 30px',
                outline: 'none', boxSizing: 'border-box', background: '#fff',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgb(247,190,57)'; }}
              onBlur={e  => { e.target.style.borderColor = '#e5e7eb'; }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute', right: '8px', top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#9ca3af', fontSize: '12px',
                }}
              >
                ✕
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {FILTER_TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setFilterType(t.id)}
                style={{
                  padding: '4px 12px', borderRadius: '20px',
                  fontSize: '11px', fontWeight: 700,
                  border: filterType === t.id
                    ? '1.5px solid rgb(247,190,57)'
                    : '1px solid #e5e7eb',
                  background: filterType === t.id ? '#fef9c3' : '#fff',
                  color: filterType === t.id ? '#92400e' : '#6b7280',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── List ── */}
        <div
          style={{
            flex: 1, overflowY: 'auto', padding: '16px 20px',
            display: 'flex', flexDirection: 'column', gap: '10px',
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '40px', marginBottom: '14px' }}>
                {totalNotes === 0 && totalAttachments === 0 ? '📭' : '🔍'}
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#374151', marginBottom: '6px' }}>
                {totalNotes === 0 && totalAttachments === 0
                  ? 'No notes or attachments yet'
                  : 'No results found'}
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', lineHeight: '1.5' }}>
                {totalNotes === 0 && totalAttachments === 0
                  ? 'Open any plan item, click "Add notes", type a note or attach a file, then save.'
                  : 'Try a different search or filter.'}
              </div>
            </div>
          ) : (
            filtered.map(item => (
              <AttachmentItemRow
                key={item.id}
                item={item}
                onPreview={setPreviewFile}
              />
            ))
          )}
        </div>

        {/* ── Footer ── */}
        {(totalNotes > 0 || totalAttachments > 0) && (
          <div
            style={{
              padding: '12px 20px', borderTop: '1px solid #f3f4f6',
              background: '#fafafa', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600 }}>
              Showing {filtered.length} of {baseItems.length} items
            </div>
            <button
              onClick={handleClose}
              style={{
                padding: '7px 18px', borderRadius: '10px',
                background: 'rgb(247,190,57)', border: 'none',
                fontSize: '12px', fontWeight: 800, color: '#1a1a1a',
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        )}
      </div>

      {/* Image preview */}
      {previewFile && (
        <ImagePreview
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </>
  );
}