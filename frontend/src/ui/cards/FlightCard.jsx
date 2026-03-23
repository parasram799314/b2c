'use client';
import React, { useState, useEffect } from 'react';

// ─── Logo helper ─────────────────────────────────────────────────────────────
// Supports both IATA codes ("AI", "6E") and full names ("Air India", "IndiGo")
const IATA_LOGO_MAP = {
    'AI':  'AI',   // Air India
    'IX':  'IX',   // Air India Express
    '6E':  '6E',   // IndiGo
    'SG':  'SG',   // SpiceJet
    'QP':  'QP',   // Akasa Air
    'UK':  'UK',   // Vistara
    'G8':  'G8',   // Go First / GoAir
    'I5':  'I5',   // Air Asia India
    'EK':  'EK',   // Emirates
    'QR':  'QR',   // Qatar Airways
    'EY':  'EY',   // Etihad
    'LH':  'LH',   // Lufthansa
    'BA':  'BA',   // British Airways
    'SQ':  'SQ',   // Singapore Airlines
    'TK':  'TK',   // Turkish Airlines
    '9W':  '9W',   // Jet Airways
    'HR':  null,   // Hahn Air (kiwi)
    '9I':  null,   // Alliance Air (kiwi)
};

const WEGO_BASE = 'https://assets.wego.com/image/upload/h_240,c_fill,f_auto,fl_lossy,q_auto:best,g_auto/v20260217/flights/airlines_square/';
const KIWI_BASE = 'https://images.kiwi.com/airlines/64/';

const IATA_TO_DISPLAY_NAME = {
  AI: 'Air India', IX: 'Air India Express', '6E': 'IndiGo', SG: 'SpiceJet',
  UK: 'Vistara', QP: 'Akasa Air', EK: 'Emirates', QR: 'Qatar Airways', EY: 'Etihad',
};

const getLogoUrl = (airlineName = '') => {
    const raw = airlineName.trim();
    const upper = raw.toUpperCase();
    const n = raw.toLowerCase();

    // 1. Exact IATA code match (e.g. "AI", "6E", "SG")
    if (IATA_LOGO_MAP.hasOwnProperty(upper)) {
        const code = IATA_LOGO_MAP[upper];
        if (code) return `${WEGO_BASE}${code}.png`;
        if (upper === 'HR') return `${KIWI_BASE}HR.png`;
        if (upper === '9I') return `${KIWI_BASE}9I.png`;
    }

    // 2. Name-based fallback
    if (n.includes('air india express') || n.includes('ai express')) return `${WEGO_BASE}IX.png`;
    if (n.includes('air india'))                                      return `${WEGO_BASE}AI.png`;
    if (n.includes('indigo'))                                         return `${WEGO_BASE}6E.png`;
    if (n.includes('spicejet'))                                       return `${WEGO_BASE}SG.png`;
    if (n.includes('akasa'))                                          return `${WEGO_BASE}QP.png`;
    if (n.includes('vistara'))                                        return `${WEGO_BASE}UK.png`;
    if (n.includes('go first') || n.includes('go air'))               return `${WEGO_BASE}G8.png`;
    if (n.includes('emirates'))                                       return `${WEGO_BASE}EK.png`;
    if (n.includes('qatar'))                                          return `${WEGO_BASE}QR.png`;
    if (n.includes('etihad'))                                         return `${WEGO_BASE}EY.png`;
    if (n.includes('lufthansa'))                                      return `${WEGO_BASE}LH.png`;
    if (n.includes('british'))                                        return `${WEGO_BASE}BA.png`;
    if (n.includes('singapore'))                                      return `${WEGO_BASE}SQ.png`;
    if (n.includes('turkish'))                                        return `${WEGO_BASE}TK.png`;
    if (n.includes('sojourn'))                                        return '/logos/SojournAir.png';
    if (n.includes('hahn'))                                           return `${KIWI_BASE}HR.png`;
    if (n.includes('alliance'))                                       return `${KIWI_BASE}9I.png`;

    // 3. Last resort — try wego directly with the code (works for most airlines)
    if (/^[A-Z0-9]{2,3}$/.test(upper)) return `${WEGO_BASE}${upper}.png`;

    return null;
};

// ─── One flight row ───────────────────────────────────────────────────────────
function FlightRow({ fData, isMobile = false }) {
    const [imgErr, setImgErr] = useState(false);
    const logoSrc = fData.logo || getLogoUrl(fData.airline || '');
    const depTime = fData.departureTime ?? fData.depTime ?? '';
    const arrTime = fData.arrivalTime ?? fData.arrTime ?? '';

    return (
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '12px' : '0' }}>

            {/* Airline logo + name + number */}
            <div style={{ 
                width: isMobile ? '100%' : '150px', 
                flexShrink: 0, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                marginBottom: isMobile ? '8px' : '0'
            }}>
                <div style={{
                    width: isMobile ? '40px' : '46px', 
                    height: isMobile ? '40px' : '46px', 
                    borderRadius: '10px',
                    background: '#fff5f0', border: '1px solid #ffe4d6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, overflow: 'hidden'
                }}>
                    {logoSrc && !imgErr
                        ? <img src={logoSrc} alt={fData.airline}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            onError={() => setImgErr(true)} />
                        : <span style={{ fontSize: isMobile ? '18px' : '20px' }}>✈</span>
                    }
                </div>
                <div>
                    <div style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>
                        {IATA_TO_DISPLAY_NAME[fData.airline] || fData.airline}
                    </div>
                    <div style={{ fontSize: isMobile ? '10px' : '11px', color: '#9ca3af', marginTop: '2px' }}>
                        {fData.flightNumber}
                    </div>
                </div>
            </div>

            {/* Route: dep ← dotted line → arr */}
            <div style={{ 
                flex: 1, 
                display: 'flex', 
                alignItems: 'center', 
                padding: isMobile ? '0' : '0 12px', 
                gap: '6px',
                width: isMobile ? '100%' : 'auto'
            }}>

                {/* Departure */}
                <div style={{ minWidth: isMobile ? '60px' : '72px' }}>
                    <div style={{ fontSize: isMobile ? '18px' : '21px', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
                        {depTime}
                    </div>
                    <div style={{ fontSize: isMobile ? '11px' : '12px', marginTop: '4px', color: '#374151', fontWeight: 600 }}>
                        {fData.fromAirport || fData.from}
                        {(fData.terminalFrom || fData.terminalDep) && (
                            <span style={{ color: '#ef4444', fontWeight: 700, marginLeft: '4px' }}>
                                T{fData.terminalFrom || fData.terminalDep}
                            </span>
                        )}
                    </div>
                </div>

                {/* Duration + dotted line + stop label */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: isMobile ? '10px' : '11px', color: '#6b7280', marginBottom: '5px', fontWeight: 500 }}>
                        {fData.duration}
                    </span>
                    <div style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                        <div style={{ flex: 1, borderBottom: '1.5px dashed #d1d5db' }} />
                        <span style={{ margin: '0 6px', fontSize: isMobile ? '12px' : '13px', color: '#9ca3af' }}>✈</span>
                        <div style={{ flex: 1, borderBottom: '1.5px dashed #d1d5db' }} />
                    </div>
                    <span style={{
                        fontSize: isMobile ? '10px' : '11px', fontWeight: 700, marginTop: '5px',
                        color: Number(fData.stops) === 0 ? '#16a34a' : '#f59e0b'
                    }}>
                        {Number(fData.stops) === 0
                            ? 'Non-stop'
                            : `${fData.stops} Stop${Number(fData.stops) > 1 ? 's' : ''}`}
                    </span>
                </div>

                {/* Arrival */}
                <div style={{ minWidth: isMobile ? '60px' : '72px', textAlign: 'right' }}>
                    <div style={{ fontSize: isMobile ? '18px' : '21px', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
                        {arrTime}
                        {(fData.nextDayArrival || fData.nextDay) && (
                            <sup style={{ fontSize: isMobile ? '10px' : '11px', color: '#F7BE39', marginLeft: '2px' }}>+1</sup>
                        )}
                    </div>
                    <div style={{ fontSize: isMobile ? '11px' : '12px', marginTop: '4px', color: '#374151', fontWeight: 600 }}>
                        {fData.toAirport || fData.to}
                        {(fData.terminalTo || fData.terminalArr) && (
                            <span style={{ color: '#ef4444', fontWeight: 700, marginLeft: '4px' }}>
                                T{fData.terminalTo || fData.terminalArr}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── FlightCard ───────────────────────────────────────────────────────────────
// Props:
//   flight        – flight data object (required)
//   onSelect      – callback(flight, returnFlight?) when Book is clicked (required)
//   isSelected    – boolean, highlights the card
//   isRoundTrip   – boolean
//   returnFlight  – optional paired return flight object
//
const FlightCard = ({ flight, onSelect, onAdd, isSelected, inPlan, isRoundTrip, returnFlight }) => {
    const [isSaved, setIsSaved] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const isAddMode = Boolean(onAdd);

    // Detect mobile screen size
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const totalPrice = returnFlight
        ? (Number(flight.price) + Number(returnFlight.price))
        : Number(flight.price);

    const handleCardClick = () => {
        if (onAdd && !inPlan) onAdd(flight);
        else if (onSelect) onSelect(flight, returnFlight);
    };

    const handleShare = async (e) => {
        e.stopPropagation();
        const text = `Flight ${flight.from}→${flight.to} ₹${Math.round(totalPrice).toLocaleString('en-IN')}`;
        try {
            if (navigator.share) await navigator.share({ title: text, url: window.location.href });
            else await navigator.clipboard.writeText(text);
        } catch { /* ignore */ }
    };

    return (
        <>
            <div
                onClick={handleCardClick}
                style={{
                    background: isSelected ? '#fffdf5' : '#fff',
                    border: `1px solid ${isSelected ? '#F7BE39' : '#e5e7eb'}`,
                    borderRadius: '14px',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.18s, border-color 0.18s',
                    boxShadow: isSelected
                        ? '0 0 0 3px rgba(247,190,57,0.2)'
                        : '0 1px 4px rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                    marginBottom: 0,
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.1)'; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}
            >
                {/* ── Main row: flight info + price ── */}
                <div style={{
                    display: 'flex',
                    alignItems: isMobile ? 'stretch' : 'center',
                    padding: isMobile ? '12px' : '14px 16px 12px',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? '12px' : '0'
                }}>

                    {/* Flight rows */}
                    <div style={{
                        flex: 1,
                        minWidth: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: returnFlight ? '12px' : 0
                    }}>
                        <FlightRow fData={flight} isMobile={isMobile} />
                        {returnFlight && (
                            <>
                                <div style={{ height: '1px', background: '#f3f4f6' }} />
                                <FlightRow fData={returnFlight} isMobile={isMobile} />
                            </>
                        )}
                    </div>

                    {/* Price + Action button */}
                    <div style={{
                        flexShrink: 0,
                        borderLeft: isMobile ? 'none' : '1px solid #f3f4f6',
                        borderTop: isMobile ? '1px solid #f3f4f6' : 'none',
                        paddingLeft: isMobile ? '0' : '18px',
                        marginLeft: isMobile ? '0' : '12px',
                        paddingTop: isMobile ? '12px' : '0',
                        display: 'flex',
                        flexDirection: isMobile ? 'row' : 'column',
                        alignItems: isMobile ? 'center' : 'flex-end',
                        justifyContent: isMobile ? 'space-between' : 'flex-start',
                        gap: isMobile ? '12px' : '8px',
                        minWidth: isMobile ? 'auto' : '120px'
                    }}>
                        <div style={{
                            fontSize: isMobile ? '20px' : '22px',
                            fontWeight: 800,
                            color: '#111827',
                            letterSpacing: '-0.5px',
                            lineHeight: 1,
                            textAlign: isMobile ? 'left' : 'right'
                        }}>
                            {(flight.currency === 'USD' ? '$' : '₹')}{Math.round(totalPrice).toLocaleString('en-IN')}
                        </div>
                        {inPlan ? (
                            <span style={{
                                padding: isMobile ? '6px 12px' : '8px 12px',
                                borderRadius: '8px',
                                background: '#dcfce7',
                                color: '#16a34a',
                                fontSize: isMobile ? '11px' : '12px',
                                fontWeight: 700,
                                whiteSpace: 'nowrap'
                            }}>✓ In Plan</span>
                        ) : (
                            <button
                                onClick={e => { e.stopPropagation(); handleCardClick(); }}
                                style={{
                                    background: '#F7BE39',
                                    color: '#1a1a1a',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: isMobile ? '8px 16px' : '9px 0',
                                    fontSize: isMobile ? '12px' : '13px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    width: isMobile ? 'auto' : '100%',
                                    minWidth: isMobile ? '100px' : 'auto',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '5px',
                                    boxShadow: '0 2px 8px rgba(247,190,57,0.4)',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#e6ad2a'}
                                onMouseLeave={e => e.currentTarget.style.background = '#F7BE39'}
                            >
                                {isAddMode ? 'Add to Plan' : 'Book'} <span style={{ fontSize: '14px' }}>⇒</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Bottom row: baggage icons + heart + share + flight details ── */}
                <div style={{
                    borderTop: '1px solid #f3f4f6',
                    padding: isMobile ? '8px 12px' : '7px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: isMobile ? 'wrap' : 'nowrap',
                    gap: isMobile ? '8px' : '0'
                }}>
                    {/* Baggage icons */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        order: isMobile ? 2 : 1
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}
                            title={`Check-in: ${flight.baggage?.iB || '15 Kg'}`}>
                            <span style={{ fontSize: '13px' }}>🧳</span>
                            <span style={{
                                width: '14px', height: '14px', borderRadius: '50%',
                                background: '#dcfce7', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: '8px', color: '#16a34a', fontWeight: 900
                            }}>✓</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }} title="Seat selection">
                            <span style={{ fontSize: '13px' }}>🔒</span>
                            <span style={{
                                width: '14px', height: '14px', borderRadius: '50%',
                                background: '#fee2e2', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: '8px', color: '#dc2626', fontWeight: 900
                            }}>✕</span>
                        </div>
                        {flight.isMealIncluded && (
                            <span style={{ fontSize: '13px' }} title="Meal">🍽️</span>
                        )}
                    </div>

                    {/* Actions */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: isMobile ? '8px' : '14px',
                        order: isMobile ? 1 : 2
                    }}>
                        <button
                            onClick={e => { e.stopPropagation(); setIsSaved(v => !v); }}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                fontSize: '16px', lineHeight: 1, padding: 0,
                                color: isSaved ? '#e91e63' : '#d1d5db', transition: 'color 0.15s',
                            }}
                        >{isSaved ? '♥' : '♡'}</button>

                        <button
                            onClick={handleShare}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                fontSize: '15px', lineHeight: 1, padding: 0,
                                color: '#d1d5db', transition: 'color 0.15s',
                            }}
                        >⤴</button>

                        <button
                            onClick={e => { e.stopPropagation(); setDetailsOpen(true); }}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                fontSize: isMobile ? '11px' : '12px',
                                fontWeight: 700,
                                color: '#1d4ed8',
                                padding: 0,
                                whiteSpace: isMobile ? 'nowrap' : 'normal'
                            }}>
                            {isMobile ? 'Details' : 'Flight Details'}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Details Modal ── */}
            {detailsOpen && (
                <div onClick={() => setDetailsOpen(false)} style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(0,0,0,0.45)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
                }}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: '#fff', borderRadius: '20px',
                        boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
                        width: '100%', maxWidth: '460px', overflow: 'hidden',
                    }}>
                        {/* Modal header */}
                        <div style={{
                            background: '#F7BE39', padding: '16px 20px',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                            <span style={{ fontWeight: 700, fontSize: '15px', color: '#1a1a1a' }}>Flight Details</span>
                            <button onClick={() => setDetailsOpen(false)} style={{
                                width: '28px', height: '28px', borderRadius: '50%',
                                background: 'rgba(0,0,0,0.12)', border: 'none', cursor: 'pointer',
                                fontSize: '14px', color: '#1a1a1a',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>✕</button>
                        </div>

                        {/* Modal body */}
                        <div style={{ padding: '20px' }}>
                            {[flight, returnFlight].filter(Boolean).map((f, idx) => (
                                <div key={idx}>
                                    {returnFlight && (
                                        <div style={{
                                            fontSize: '10px', fontWeight: 700, color: '#9ca3af',
                                            textTransform: 'uppercase', letterSpacing: '0.1em',
                                            marginBottom: '10px', marginTop: idx > 0 ? '20px' : 0,
                                        }}>{idx === 0 ? '↗ Onward' : '↙ Return'}</div>
                                    )}

                                    {/* Airline info */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                                        <div style={{
                                            width: '46px', height: '46px', borderRadius: '12px',
                                            background: '#fff5f0', border: '1px solid #ffe4d6',
                                            overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <img
                                                src={f.logo || getLogoUrl(f.airline || '')}
                                                alt={f.airline}
                                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                onError={e => e.target.style.display = 'none'}
                                            />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>{f.airline}</div>
                                            <div style={{ fontSize: '12px', color: '#9ca3af' }}>{f.flightNumber}</div>
                                        </div>
                                    </div>

                                    {/* Route info box */}
                                    <div style={{
                                        background: '#f9fafb', borderRadius: '12px', padding: '16px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        marginBottom: '14px',
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px' }}>Departure</div>
                                            <div style={{ fontSize: '22px', fontWeight: 800, color: '#111' }}>{f.departureTime}</div>
                                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                                                {f.from}
                                                {(f.terminalFrom || f.terminalDep) && (
                                                    <span style={{ color: '#ef4444', marginLeft: '3px' }}>
                                                        T{f.terminalFrom || f.terminalDep}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '3px' }}>{f.duration}</div>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <div style={{ width: '36px', height: '1.5px', background: '#d1d5db' }} />
                                                <span style={{ margin: '0 4px', fontSize: '12px' }}>✈</span>
                                                <div style={{ width: '36px', height: '1.5px', background: '#d1d5db' }} />
                                            </div>
                                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', marginTop: '3px' }}>
                                                {Number(f.stops) === 0 ? 'Non-stop' : `${f.stops} Stop(s)`}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px' }}>Arrival</div>
                                            <div style={{ fontSize: '22px', fontWeight: 800, color: '#111' }}>{f.arrivalTime}</div>
                                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                                                {f.to}
                                                {(f.terminalTo || f.terminalArr) && (
                                                    <span style={{ color: '#ef4444', marginLeft: '3px' }}>
                                                        T{f.terminalTo || f.terminalArr}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Baggage info */}
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        {[
                                            { label: '🧳 Check-in', val: f.baggage?.iB || '15 Kg' },
                                            { label: '💼 Cabin',    val: f.baggage?.cB || '7 Kg' },
                                        ].map(b => (
                                            <div key={b.label} style={{
                                                flex: 1, background: '#f9fafb',
                                                borderRadius: '10px', padding: '10px 12px',
                                            }}>
                                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#374151', marginBottom: '3px' }}>{b.label}</div>
                                                <div style={{ fontSize: '12px', color: '#6b7280' }}>{b.val}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {idx === 0 && returnFlight && (
                                        <div style={{ height: '1px', background: '#f3f4f6', margin: '16px 0' }} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default FlightCard;