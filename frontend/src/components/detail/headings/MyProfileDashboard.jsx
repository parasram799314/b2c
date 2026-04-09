import { useState, useEffect } from 'react';

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconClose = ({ size = 15, color = '#555' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconUser = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const IconBriefcase = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
  </svg>
);
const IconSave = ({ size = 15, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
  </svg>
);
const IconChevronLeft = ({ size = 18, color = '#555' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const DocIcon = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);
const PinIcon = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z" /><circle cx="12" cy="11" r="3" />
  </svg>
);
const RupeeIcon = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);
const AlertIcon = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
    <line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const TeamIcon = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const PolicyIcon = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const CardIcon = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const ic = '#b8860b';

// ─── Reusable Field ───────────────────────────────────────────────────────────
function Field({ label, value, onChange, type = 'text', options, placeholder, readOnly, span2 }) {
  const base = {
    width: '100%', padding: '9px 12px', borderRadius: '8px',
    border: '1.5px solid #e8e8e8', fontSize: '13px', color: '#1a1a1a',
    background: readOnly ? '#f9f9f9' : '#fff',
    outline: 'none', boxSizing: 'border-box',
    fontFamily: "'DM Sans','Outfit','Segoe UI',sans-serif",
    transition: 'border 0.15s',
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', gridColumn: span2 ? '1 / -1' : undefined }}>
      <label style={{ fontSize: '11px', fontWeight: 700, color: '#999', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
        {label}
      </label>
      {options ? (
        <select value={value} onChange={e => onChange(e.target.value)} style={{ ...base, cursor: 'pointer' }}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type} value={value} readOnly={readOnly}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder || ''}
          style={base}
          onFocus={e => { if (!readOnly) e.target.style.border = '1.5px solid rgb(247,190,57)'; }}
          onBlur={e => { e.target.style.border = '1.5px solid #e8e8e8'; }}
        />
      )}
    </div>
  );
}

// ─── Section Block ────────────────────────────────────────────────────────────
function Section({ icon, title, children }) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '9px',
        paddingBottom: '10px', borderBottom: '1.5px solid #f0f0f0', marginBottom: '16px',
      }}>
        <span style={{
          width: '30px', height: '30px', borderRadius: '8px',
          background: 'rgba(247,190,57,0.14)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>{icon}</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#111', letterSpacing: '-0.2px' }}>{title}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        {children}
      </div>
    </div>
  );
}

// ─── Payment Method Block ─────────────────────────────────────────────────────
function PaymentSection() {
  return (
    <Section icon={<CardIcon color={ic} />} title="Payment Method">
      <div style={{
        gridColumn: '1 / -1',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
      }}>
        <div style={{
          padding: '13px 16px', borderRadius: '10px',
          border: '2px solid rgb(247,190,57)',
          background: 'rgba(247,190,57,0.07)', cursor: 'pointer',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#1a1a1a' }}>Personal Card</div>
          <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>**** **** **** 4242</div>
        </div>
        <div style={{
          padding: '13px 16px', borderRadius: '10px',
          border: '1.5px dashed #e0e0e0',
          background: '#fafafa', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span style={{ fontSize: '12px', color: '#bbb' }}>Add payment method</span>
        </div>
      </div>
    </Section>
  );
}

// ─── Account Profile Form ─────────────────────────────────────────────────────
function AccountProfileForm({ 
  data, setData, isPhoneVerified, setIsPhoneVerified, 
  showOtpInput, setShowOtpInput, otp, setOtp 
}) {

  const s = k => v => setData(p => ({ ...p, [k]: v }));
  return (
    <>
      <Section icon={<IconUser size={14} color={ic} />} title="Personal Info">
        <Field label="Full Name" value={data.fullName} onChange={s('fullName')} placeholder="John Doe" />
        <Field label="Gender" value={data.gender} onChange={s('gender')} options={['Male', 'Female', 'Non-binary', 'Prefer not to say']} />
        <Field label="Email" value={data.invoiceEmail}  readOnly={true} onChange={s('invoiceEmail')} type="email" placeholder="billing@email.com" />
      
<div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
  <label style={{ fontSize: '11px', fontWeight: 700, color: '#999', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
    Phone Number
  </label>
  <div style={{ display: 'flex', gap: '8px' }}>
    <input
      type="tel"
      value={data.phone}
      onChange={(e) => setData(prev => ({ ...prev, phone: e.target.value }))}
      disabled={isPhoneVerified}
      placeholder="+91 9000000000"
      style={{
        flex: 1, padding: '9px 12px', borderRadius: '8px',
        border: isPhoneVerified ? '1.5px solid #22c55e' : '1.5px solid #e8e8e8', 
        fontSize: '13px', background: isPhoneVerified ? '#f0fff4' : '#fff',
        outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit'
      }}
    />
    {!isPhoneVerified && !showOtpInput && (
      <button 
        onClick={() => setShowOtpInput(true)}
        style={{
          padding: '0 15px', borderRadius: '8px', border: 'none',
          background: '#b8860b', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer'
        }}
      >
        Send OTP
      </button>
    )}
  </div>

  {showOtpInput && !isPhoneVerified && (
    <div style={{ display: 'flex', gap: '8px', marginTop: '6px', animation: 'mpFadeIn 0.3s' }}>
      <input
        type="text"
        placeholder="Enter 4-digit OTP"
        maxLength={4}
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        style={{
          flex: 1, padding: '9px 12px', borderRadius: '8px',
          border: '1.5px solid rgb(247,190,57)', fontSize: '13px', outline: 'none'
        }}
      />
      <button 
        onClick={() => {
           // Dummy Logic: 1234 enter karne par verify ho jayega
           if(otp === "1234") {
             setIsPhoneVerified(true);
             setShowOtpInput(false);
           } else {
             alert("Incorrect OTP! Try 1234");
           }
        }}
        style={{
          padding: '0 15px', borderRadius: '8px', border: 'none',
          background: '#22c55e', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer'
        }}
      >
        Verify
      </button>
    </div>
  )}

  {isPhoneVerified && (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: 700 }}>Phone Verified</span>
    </div>
  )}
</div>
      </Section>

      <Section icon={<DocIcon color={ic} />} title="Identity & Travel Docs">
        <Field label="Passport Number" value={data.passportNo} onChange={s('passportNo')} placeholder="A1234567" />
        <Field label="Passport Expiry" value={data.passportExpiry} onChange={s('passportExpiry')} type="date" />
        <Field label="Nationality" value={data.nationality} onChange={s('nationality')} placeholder="Indian" />
        <Field label="Date of Birth" value={data.dob} onChange={s('dob')} type="date" />
      </Section>

      

      <Section icon={<AlertIcon color={ic} />} title="Emergency Contact">
        <Field label="Emergency Contact Name" value={data.emergencyName} onChange={s('emergencyName')} placeholder="Jane Doe" />
        <Field label="Emergency Phone" value={data.emergencyPhone} onChange={s('emergencyPhone')} type="tel" placeholder="+91 9000000000" />
      </Section>
    </>
  );
}

function TravelPreferencesPanel({ data, setData }) {
  const s = k => v => setData(p => ({ ...p, [k]: v }));
  return (
    <>
      <Section icon={<PinIcon color={ic} />} title="Flight & Hotel Preferences">
        <Field label="Preferred Flight Class" value={data.flightClass} onChange={s('flightClass')} options={['Economy', 'Premium Economy', 'Business', 'First Class']} />
        <Field label="Seat Preference" value={data.seatPreference} onChange={s('seatPreference')} options={['Window', 'Aisle', 'Middle', 'No Preference']} />
        <Field label="Meal Preference" value={data.mealPreference} onChange={s('mealPreference')} options={['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Jain', 'No Preference']} />
        <Field label="Flight Keywords" value={data.flightKeywords} onChange={s('flightKeywords')} placeholder="e.g. direct, morning, no layover" />
        <Field label="Preferred Hotel Type" value={data.hotelType} onChange={s('hotelType')} options={['Budget', 'Standard', 'Deluxe', 'Luxury']} />
        <Field label="Room Type" value={data.roomType} onChange={s('roomType')} options={['Non-Smoking', 'Smoking']} />
        <Field label="Other Hotel Preferences" value={data.hotelOtherPrefs} onChange={s('hotelOtherPrefs')} placeholder="e.g. higher floor, swimming pool..." span2 />
      </Section>

      <Section icon={<CardIcon color={ic} />} title="Car & Loyalty Numbers">
        <Field label="Preferred Car Rental" value={data.carRental} onChange={s('carRental')} options={['Economy', 'Compact', 'SUV', 'Luxury', 'No Preference']} />
        <Field label="Known Traveler No. (TSA)" value={data.knownTravelerNo} onChange={s('knownTravelerNo')} placeholder="KTN1234567" />
        <Field label="Frequent Flyer Number" value={data.frequentFlyer} onChange={s('frequentFlyer')} placeholder="FF-XXXX-XXXX" />
        <Field label="Hotel Loyalty Number" value={data.hotelLoyalty} onChange={s('hotelLoyalty')} placeholder="HLN-XXXX" />
      </Section>
    </>
  );
}




// ─── Default Profile — Personal Sub-form ────────────────────────────────────
function PersonalProfileForm({ data, setData }) {
  const s = k => v => setData(p => ({ ...p, [k]: v }));
  return (
    <>
      <Section icon={<IconUser size={14} color={ic} />} title="Personal Details">
        <Field label="Email for Invoicing" value={data.invoiceEmail} onChange={s('invoiceEmail')} type="email" placeholder="billing@email.com" />
        <Field label="Phone" value={data.phone} onChange={s('phone')} type="tel" placeholder="+91 9000000000" />
      </Section>
      <PaymentSection />
    </>
  );
}

// ─── Default Profile — Business Sub-form ─────────────────────────────────────
function BusinessProfileForm({ data, setData }) {
  const s = k => v => setData(p => ({ ...p, [k]: v }));
  return (
    <>
      <Section icon={<IconBriefcase size={14} color={ic} />} title="Work Details">
        <Field label="Employee ID" value={data.employeeId} onChange={s('employeeId')} readOnly placeholder="EMP-001" />
        <Field label="Department" value={data.department} onChange={s('department')} placeholder="Engineering" />
        <Field label="Designation" value={data.designation} onChange={s('designation')} placeholder="Senior Developer" />
        <Field label="Reporting Manager" value={data.reportingManager} onChange={s('reportingManager')} placeholder="Manager Name" />
        <Field label="Cost Center / Project Code" value={data.costCenter} onChange={s('costCenter')} placeholder="CC-2024-ENG" />
      </Section>

      <PaymentSection />

      <Section icon={<RupeeIcon color={ic} />} title="Budget & Policy">
        <Field label="Annual Travel Budget (₹)" value={data.annualBudget} onChange={s('annualBudget')} type="number" placeholder="500000" />
        <Field label="Per Trip Limit (₹)" value={data.perTripLimit} onChange={s('perTripLimit')} type="number" placeholder="50000" />
      </Section>

      <Section icon={<TeamIcon color={ic} />} title="Team Members">
        <div style={{ gridColumn: '1 / -1' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#999', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Account Delegates
          </div>
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '8px',
            padding: '12px 14px', borderRadius: '10px',
            border: '1.5px solid #e8e8e8', background: '#fafafa',
          }}>
            {[
              { name: 'Priya Sharma', email: 'priya@company.com', role: 'Admin' },
              { name: 'Rahul Mehta', email: 'rahul@company.com', role: 'Viewer' },
            ].map((d, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 10px', borderRadius: '8px', background: '#fff',
                border: '1px solid #f0f0f0',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '50%',
                    background: 'rgba(247,190,57,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 700, color: '#b8860b',
                  }}>
                    {d.name.split(' ').map(w => w[0]).join('')}
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#1a1a1a' }}>{d.name}</div>
                    <div style={{ fontSize: '11px', color: '#aaa' }}>{d.email}</div>
                  </div>
                </div>
                <span style={{
                  fontSize: '10px', fontWeight: 700, color: '#b8860b',
                  background: 'rgba(247,190,57,0.15)', padding: '3px 9px', borderRadius: '20px',
                }}>{d.role}</span>
              </div>
            ))}
            <button style={{
              marginTop: '4px', padding: '8px', borderRadius: '8px',
              border: '1.5px dashed #e0e0e0', background: 'transparent',
              fontSize: '12px', color: '#bbb', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              fontFamily: "'DM Sans','Outfit','Segoe UI',sans-serif",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add delegate
            </button>
          </div>
        </div>
      </Section>

      <Section icon={<PolicyIcon color={ic} />} title="Business Policy">
        <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { label: 'Flight Policy', desc: 'Economy class for domestic, Business for international > 6hrs' },
            { label: 'Hotel Policy', desc: 'Max ₹8,000/night domestic · ₹15,000/night international' },
            { label: 'Cars Policy', desc: 'Sedan or below for local travel · SUV allowed for team trips' },
          ].map((p, i) => (
            <div key={i} style={{
              padding: '12px 16px', borderRadius: '10px',
              border: '1.5px solid #f0f0f0', background: '#fafafa',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px',
            }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#1a1a1a' }}>{p.label}</div>
                <div style={{ fontSize: '11px', color: '#aaa', marginTop: '3px' }}>{p.desc}</div>
              </div>
              <button style={{
                flexShrink: 0, padding: '4px 10px', borderRadius: '6px',
                border: '1px solid #e0e0e0', background: '#fff',
                fontSize: '11px', color: '#666', cursor: 'pointer',
                fontFamily: "'DM Sans','Outfit','Segoe UI',sans-serif",
              }}>Edit</button>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

// ─── Default Profile Wrapper (Personal / Business sub-tabs) ──────────────────
function DefaultProfilePanel({ personalData, setPersonalData, businessData, setBusinessData }) {
  const [subTab, setSubTab] = useState('personal');

  return (
    <>
      {/* Sub-tab selector */}
      <div style={{
        display: 'flex', gap: '8px',
        padding: '14px 26px 0',
        borderBottom: '1px solid #f5f5f5',
        flexShrink: 0,
      }}>
        {[
          { id: 'personal', label: 'Personal Profile', icon: <IconUser size={13} color={subTab === 'personal' ? '#1a1a1a' : '#aaa'} /> },
          { id: 'business', label: 'Business Profile', icon: <IconBriefcase size={13} color={subTab === 'business' ? '#1a1a1a' : '#aaa'} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 16px 9px',
              borderRadius: '0',
              border: 'none',
              borderBottom: subTab === tab.id ? '2.5px solid rgb(247,190,57)' : '2.5px solid transparent',
              background: 'transparent',
              fontSize: '12.5px',
              fontWeight: subTab === tab.id ? 700 : 500,
              color: subTab === tab.id ? '#1a1a1a' : '#aaa',
              cursor: 'pointer',
              fontFamily: "'DM Sans','Outfit','Segoe UI',sans-serif",
              transition: 'all 0.15s',
              marginBottom: '-1px',
            }}
          >
            {tab.icon}
            {tab.label}
            {subTab === tab.id && (
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: 'rgb(247,190,57)',
                boxShadow: '0 0 5px rgba(247,190,57,0.6)',
                marginLeft: '2px',
              }} />
            )}
          </button>
        ))}
      </div>

      {/* Sub-tab content header */}
      <div style={{ padding: '14px 26px 11px', borderBottom: '1px solid #f5f5f5', flexShrink: 0 }}>
        <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#111', letterSpacing: '-0.3px' }}>
          {subTab === 'personal' ? 'Personal Profile' : 'Business Profile'}
        </div>
        <div style={{ fontSize: '12px', color: '#bbb', marginTop: '2px' }}>
          {subTab === 'personal'
            ? 'Your personal invoicing details & payment method'
            : 'Your work details, corporate travel preferences, team & policy'}
        </div>
      </div>

      {/* Scrollable form */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px 10px' }}>
        {subTab === 'personal'
          ? <PersonalProfileForm data={personalData} setData={setPersonalData} />
          : <BusinessProfileForm data={businessData} setData={setBusinessData} />
        }
      </div>
    </>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function MyProfileDashboard({ user, onClose, onSave }) {
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [activeTab, setActiveTab] = useState('account');
  const [saved, setSaved] = useState(false);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  // Consolidation: Single state for the entire profile
  const [profileData, setProfileData] = useState({
    fullName: displayName,
    gender: 'Male',
    invoiceEmail: user?.email || '',
    phone: '',
    passportNo: '', passportExpiry: '', nationality: 'Indian', dob: '',
    flightClass: 'Economy', seatPreference: 'Window', mealPreference: 'Vegetarian',
    flightKeywords: '',
    hotelType: 'Standard', roomType: 'Non-Smoking', hotelOtherPrefs: '',
    carRental: 'No Preference',
    knownTravelerNo: '', frequentFlyer: '', hotelLoyalty: '',
    emergencyName: '', emergencyPhone: '',
    employeeId: '', department: '', designation: '', reportingManager: '', costCenter: '',
    annualBudget: '', perTripLimit: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (!user || typeof user.getIdToken !== 'function') return;
        const token = await user.getIdToken(); 
        
        const res = await fetch('/api/users/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();

        if (result.success && result.data && result.data.profile) {
          const dbProfile = result.data.profile;
          setProfileData(prev => ({ 
            ...prev, 
            ...dbProfile, 
            fullName: result.data.name || dbProfile.fullName || prev.fullName 
          }));
        }
      } catch (err) {
        console.error("Profile load error:", err);
      }
    };

    if (user) loadProfile();
  }, [user]);

  const handleSave = async () => {
    try {
      if (!user || typeof user.getIdToken !== 'function') {
        alert("Authentication error. Please login again.");
        return;
      }
      const token = await user.getIdToken();
      
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      const result = await res.json();

      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2200);
        if (onSave) onSave('success', profileData);
      } else {
        alert("Save failed: " + result.message);
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Error saving profile. Please try again.");
    }
  };

  const NAV = [
    {
      id: 'account',
      label: 'My Account',
      icon: (active) => <IconUser size={15} color={active ? '#1a1a1a' : '#999'} />,
      desc: 'Personal info & documents',
    },
    {
      id: 'default',
      label: 'Profiles',
      icon: (active) => <IconBriefcase size={15} color={active ? '#1a1a1a' : '#999'} />,
      desc: 'Personal & business settings',
    },
     {
    id: 'preferences',
    label: 'Preferences',
    icon: (active) => <PinIcon color={active ? '#1a1a1a' : '#999'} />,
    desc: 'Travel details & needs',
  },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 4000,
      background: 'rgba(0,0,0,0.22)', backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans','Outfit','Segoe UI',sans-serif",
      animation: 'mpFadeIn 0.2s ease',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes mpFadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes mpSlideIn { from { opacity:0; transform:translateY(16px) scale(0.98) } to { opacity:1; transform:translateY(0) scale(1) } }
        .mp-nav-btn { display:flex; align-items:center; gap:11px; width:100%; padding:10px 14px; border:none; cursor:pointer; border-radius:10px; text-align:left; box-sizing:border-box; transition:background 0.13s; font-family:inherit; }
        .mp-nav-btn:hover { background:#f0f0f0 !important; }
        ::-webkit-scrollbar { width:4px } ::-webkit-scrollbar-thumb { background:#ddd; border-radius:8px }
      `}</style>

      <div style={{
        width: '920px', maxWidth: '95vw',
        height: '88vh', maxHeight: '700px',
        background: '#fff',
        borderRadius: '18px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.16), 0 4px 20px rgba(0,0,0,0.07)',
        display: 'flex', flexDirection: 'column',
        animation: 'mpSlideIn 0.24s cubic-bezier(0.16,1,0.3,1)',
        overflow: 'hidden',
      }}>

        {/* ── Top Bar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '15px 22px',
          borderBottom: '1px solid #f0f0f0',
          background: '#fff',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
            <button
              onClick={onClose}
              style={{
                width: '32px', height: '32px', borderRadius: '8px',
                border: '1.5px solid #e8e8e8', background: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              <IconChevronLeft size={16} color="#555" />
            </button>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#111', letterSpacing: '-0.4px' }}>Settings</div>
              <div style={{ fontSize: '11.5px', color: '#aaa', marginTop: '1px' }}>Manage your personal & business information</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '9px',
              padding: '5px 13px 5px 7px',
              borderRadius: '24px', border: '1.5px solid #f0f0f0', background: '#fafafa',
            }}>
              <div style={{
                width: '26px', height: '26px', borderRadius: '50%',
                background: 'linear-gradient(135deg, rgb(247,190,57) 0%, #c47f06 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.5px',
              }}>{initials}</div>
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#333' }}>{displayName}</span>
            </div>
            <button
              onClick={onClose}
              style={{
                width: '30px', height: '30px', borderRadius: '50%', border: 'none',
                background: '#f5f5f5', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#ebebeb'}
              onMouseLeave={e => e.currentTarget.style.background = '#f5f5f5'}
            >
              <IconClose size={13} color="#555" />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

          {/* LEFT SIDEBAR */}
          <div style={{
            width: '210px', flexShrink: 0,
            borderRight: '1px solid #f0f0f0',
            padding: '18px 10px',
            display: 'flex', flexDirection: 'column', gap: '3px',
            background: '#fafafa',
          }}>
            <div style={{
              fontSize: '10px', fontWeight: 700, color: '#c0c0c0',
              letterSpacing: '0.09em', textTransform: 'uppercase',
              padding: '0 6px 10px',
            }}>Profile</div>

            {NAV.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  className="mp-nav-btn"
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    background: isActive ? '#fff' : 'transparent',
                    boxShadow: isActive ? '0 1px 5px rgba(0,0,0,0.07)' : 'none',
                    border: isActive ? '1.5px solid #efefef' : '1.5px solid transparent',
                  }}
                >
                  <span style={{
                    width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
                    background: isActive ? 'rgba(247,190,57,0.16)' : '#efefef',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {item.icon(isActive)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '13px', fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#111' : '#777', whiteSpace: 'nowrap',
                    }}>{item.label}</div>
                    <div style={{ fontSize: '10.5px', color: '#bbb', marginTop: '1px', whiteSpace: 'nowrap' }}>
                      {item.desc}
                    </div>
                  </div>
                  {isActive && (
                    <span style={{
                      width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                      background: 'rgb(247,190,57)',
                      boxShadow: '0 0 6px rgba(247,190,57,0.6)',
                    }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* RIGHT CONTENT */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

           {/* Header Area: Tab ke hisab se Title change hoga */}


{/* Main Content Area: Teenon tabs ka logic yahan hai */}
<div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px 10px' }}>
  {activeTab === 'account' && (
    <AccountProfileForm 
      data={profileData} 
      setData={setProfileData}
      isPhoneVerified={isPhoneVerified}
      setIsPhoneVerified={setIsPhoneVerified}
      showOtpInput={showOtpInput}
      setShowOtpInput={setShowOtpInput}
      otp={otp}
      setOtp={setOtp}
    />
  )}

  {activeTab === 'preferences' && (
    <TravelPreferencesPanel 
      data={profileData} 
      setData={setProfileData} 
    />
  )}

  {activeTab === 'default' && (
    <DefaultProfilePanel
      personalData={profileData}
      setPersonalData={setProfileData}
      businessData={profileData}
      setBusinessData={setProfileData}
    />
  )}
</div>

            {/* Footer */}
            <div style={{
              padding: '12px 26px',
              borderTop: '1px solid #f0f0f0',
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '11px',
              background: '#fff', flexShrink: 0,
            }}>
              {saved && (
                <span style={{
                  fontSize: '12.5px', color: '#22c55e', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Saved successfully!
                </span>
              )}
              <button
                onClick={onClose}
                style={{
                  padding: '8px 18px', borderRadius: '9px', border: '1.5px solid #e8e8e8',
                  background: '#fff', fontSize: '13px', fontWeight: 600, color: '#666',
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: '8px 20px', borderRadius: '9px', border: 'none',
                  background: 'rgb(247,190,57)',
                  fontSize: '13px', fontWeight: 700, color: '#1a1a1a',
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: '7px',
                  boxShadow: '0 4px 14px rgba(247,190,57,0.4)',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <IconSave size={14} color="#1a1a1a" />
               {/* Line 531 ko badal kar ye likh dein */}
Save {activeTab === 'account' ? 'Account' : activeTab === 'preferences' ? 'Preferences' : 'Default'} Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}