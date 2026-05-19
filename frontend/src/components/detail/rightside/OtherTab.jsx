// components/detail/OtherTab.jsx
// ─── Replace the existing OtherTab function in DetailPage.jsx with this file ───
import React, { useState } from 'react';
import { Icons } from '../../../ui/icons';

const CATEGORIES = [
  { id: 'Flight',     label: 'Flight',     icon: <Icons.Plane className="w-4 h-4" /> },
  { id: 'Hotel',      label: 'Hotel',      icon: <Icons.Hotel className="w-4 h-4" /> },
  { id: 'Attraction', label: 'Attraction', icon: <Icons.MapPin className="w-4 h-4" /> },
  { id: 'Transfer',   label: 'Transfer',   icon: <Icons.Car className="w-4 h-4" /> },
  { id: 'Food',       label: 'Food',       icon: <Icons.Utensils className="w-4 h-4" /> },
  { id: 'Other',      label: 'Other',      icon: <Icons.More className="w-4 h-4" /> },
];


function OtherTab({ onAddToPlan }) {
  const [form, setForm] = useState({
    itemName: '',
    category: '',
    otherCategory: '',
    date: '',
    startTime: '',
    endTime: '',
    amount: '',
    referenceId: '',
    note: '',
    isPaid: false,
  });

  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));
  const touch = (key) => setTouched(p => ({ ...p, [key]: true }));

  const isValid = form.itemName.trim() && form.category;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (!isValid) return;

    const finalCategory = form.category === 'Other' ? (form.otherCategory || 'Other') : form.category;

    onAddToPlan({
      id: 'other_' + Date.now(),
      type: 'other',
      name: form.itemName.trim(),
      category: finalCategory,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      duration: form.startTime && form.endTime ? `${form.startTime} - ${form.endTime}` : '',
      price: form.amount,
      referenceId: form.referenceId.trim(),
      note: form.note.trim(),
        status: form.isPaid ? 'paid' : 'pending', 
    });

    // Reset form
    setForm({ itemName:'', category:'', otherCategory:'', date:'', startTime:'', endTime:'', amount:'', referenceId:'', note:'' });
    setTouched({});
    setSubmitted(false);
  };

  // ── Shared input style ──
  const inputStyle = (key) => ({
    width: '100%',
    fontSize: '13px',
    border: `1.5px solid ${(submitted || touched[key]) && !form[key] && ['itemName','category'].includes(key) ? '#fca5a5' : '#e5e7eb'}`,
    borderRadius: '10px',
    padding: '9px 12px',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#111827',
    background: '#fafafa',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  });

  const labelStyle = {
    display: 'block',
    fontSize: '10px',
    fontWeight: 800,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    marginBottom: '5px',
  };

  const fieldWrap = { marginBottom: '14px' };

  return (
    <div style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827', marginBottom: '2px' }}>Add Activity</div>
        <div style={{ fontSize: '11px', color: '#9ca3af' }}>Add custom items to your travel plan</div>
      </div>

      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e5e7eb', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <form onSubmit={handleSubmit}>

          {/* ITEM NAME */}
          <div style={fieldWrap}>
            <label style={labelStyle}>Item Name <span style={{ color: '#ef4444' }}>*</span></label>
            <input
              type="text"
              value={form.itemName}
              onChange={e => set('itemName', e.target.value)}
              onBlur={() => touch('itemName')}
              placeholder="e.g. City Bus Tour, Entry Ticket..."
              style={inputStyle('itemName')}
              onFocus={e => { e.target.style.borderColor = 'rgb(247,190,57)'; e.target.style.boxShadow = '0 0 0 3px rgba(247,190,57,0.12)'; }}
              onBlurCapture={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
            />
            {(submitted || touched.itemName) && !form.itemName && (
              <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '3px', fontWeight: 600 }}>Item name is required</div>
            )}
          </div>
{/* ITEM CATEGORY - Yahan se REPLACE karein */}
          <div style={fieldWrap}>
            <label style={labelStyle}>Item Category <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => { set('category', cat.id); if (cat.id !== 'Other') set('otherCategory', ''); }}
                  style={{
                    padding: '10px 4px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    border: form.category === cat.id ? '2px solid rgb(247,190,57)' : '1.5px solid #e5e7eb',
                    background: form.category === cat.id ? '#fef9c3' : '#fff',
                    color: form.category === cat.id ? '#92400e' : '#6b7280',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
            {(submitted || touched.category) && !form.category && (
              <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '5px', fontWeight: 600 }}>Please select a category</div>
            )}
          </div>
          {/* Yahan tak REPLACE khatam */}

          {/* OTHER CATEGORY (conditionally shown) */}
          {form.category === 'Other' && (
            <div style={{ ...fieldWrap, marginTop: '-6px', paddingLeft: '8px', borderLeft: '3px solid rgb(247,190,57)' }}>
              <label style={labelStyle}>Specify Other</label>
              <input
                type="text"
                value={form.otherCategory}
                onChange={e => set('otherCategory', e.target.value)}
                placeholder="e.g. Spa, Cruise, Safari..."
                style={inputStyle('otherCategory')}
                onFocus={e => { e.target.style.borderColor = 'rgb(247,190,57)'; e.target.style.boxShadow = '0 0 0 3px rgba(247,190,57,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          )}

          {/* DATE */}
          <div style={fieldWrap}>
            <label style={labelStyle}>Date</label>
            <input
              type="date"
              value={form.date}
              onChange={e => set('date', e.target.value)}
              style={inputStyle('date')}
              onFocus={e => { e.target.style.borderColor = 'rgb(247,190,57)'; e.target.style.boxShadow = '0 0 0 3px rgba(247,190,57,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {/* START TIME & END TIME (side by side) */}
          <div style={{ ...fieldWrap, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={labelStyle}>Start Time</label>
              <input
                type="time"
                value={form.startTime}
                onChange={e => set('startTime', e.target.value)}
                style={inputStyle('startTime')}
                onFocus={e => { e.target.style.borderColor = 'rgb(247,190,57)'; e.target.style.boxShadow = '0 0 0 3px rgba(247,190,57,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <div>
              <label style={labelStyle}>End Time</label>
              <input
                type="time"
                value={form.endTime}
                onChange={e => set('endTime', e.target.value)}
                style={inputStyle('endTime')}
                onFocus={e => { e.target.style.borderColor = 'rgb(247,190,57)'; e.target.style.boxShadow = '0 0 0 3px rgba(247,190,57,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          {/* AMOUNT */}
          <div style={fieldWrap}>
            <label style={labelStyle}>Amount (₹)</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                fontSize: '13px', fontWeight: 700, color: '#9ca3af',
              }}>₹</span>
              <input
                type="number"
                value={form.amount}
                onChange={e => set('amount', e.target.value)}
                placeholder="0"
                min="0"
                style={{ ...inputStyle('amount'), paddingLeft: '26px' }}
                onFocus={e => { e.target.style.borderColor = 'rgb(247,190,57)'; e.target.style.boxShadow = '0 0 0 3px rgba(247,190,57,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          {/* REFERENCE ID */}
          <div style={fieldWrap}>
            <label style={labelStyle}>Reference ID</label>
            <input
              type="text"
              value={form.referenceId}
              onChange={e => set('referenceId', e.target.value)}
              placeholder="Booking ID, Ticket no., PNR..."
              style={inputStyle('referenceId')}
              onFocus={e => { e.target.style.borderColor = 'rgb(247,190,57)'; e.target.style.boxShadow = '0 0 0 3px rgba(247,190,57,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          {/* PAID / UNPAID TOGGLE */}
<div style={{ 
  marginBottom: '14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 14px',
  borderRadius: '10px',
  border: `1.5px solid ${form.isPaid ? '#86efac' : '#e5e7eb'}`,
  background: form.isPaid ? '#f0fdf4' : '#fafafa',
  cursor: 'pointer',
  transition: 'all 0.15s',
}}
  onClick={() => set('isPaid', !form.isPaid)}
>
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <span style={{ fontSize: '14px' }}>{form.isPaid ? '✅' : '🟡'}</span>
    <div>
      <div style={{ fontSize: '12px', fontWeight: 700, color: form.isPaid ? '#16a34a' : '#92400e' }}>
        {form.isPaid ? 'Paid' : 'Unpaid'}
      </div>
      <div style={{ fontSize: '10px', color: '#9ca3af' }}>
        {form.isPaid ? 'This item has been paid' : 'Payment is pending'}
      </div>
    </div>
  </div>
  {/* Toggle Switch */}
  <div style={{
    width: '36px', height: '20px',
    borderRadius: '10px',
    background: form.isPaid ? '#22c55e' : '#d1d5db',
    position: 'relative',
    transition: 'background 0.2s',
    flexShrink: 0,
  }}>
    <div style={{
      position: 'absolute',
      top: '2px',
      left: form.isPaid ? '18px' : '2px',
      width: '16px', height: '16px',
      borderRadius: '50%',
      background: '#fff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      transition: 'left 0.2s',
    }} />
  </div>
</div>

          {/* NOTE */}
          <div style={fieldWrap}>
            <label style={labelStyle}>Note</label>
            <textarea
              value={form.note}
              onChange={e => set('note', e.target.value)}
              placeholder="Any additional notes, reminders..."
              rows={3}
              style={{
                ...inputStyle('note'),
                resize: 'vertical',
                minHeight: '72px',
                fontFamily: 'inherit',
                lineHeight: '1.5',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgb(247,190,57)'; e.target.style.boxShadow = '0 0 0 3px rgba(247,190,57,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              background: isValid ? 'rgb(247,190,57)' : '#f3f4f6',
              color: isValid ? '#1a1a1a' : '#9ca3af',
              border: 'none',
              borderRadius: '11px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: isValid ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s, transform 0.1s',
              marginTop: '4px',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={e => { if (isValid) e.currentTarget.style.transform = 'scale(1.01)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            + Add to Plan
          </button>

        </form>
      </div>
    </div>
  );
}

export default OtherTab;