// components/ShareModal.jsx
import { useState, useRef, useEffect } from 'react';

export default function ShareModal({ isOpen, onClose, planItems, rfq, grandTotal }) {
  const [shareMethod, setShareMethod] = useState('whatsapp');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const generateShareLink = () => {
    const baseUrl = window.location.origin;
    const planData = {
      rfqId: rfq._id,
      destinations: rfq.destinations?.map(d => d.destination).join(', '),
      totalAmount: grandTotal,
      items: planItems.length,
      timestamp: new Date().toISOString()
    };
    const encoded = btoa(JSON.stringify(planData));
    return `${baseUrl}/shared-plan/${encoded}`;
  };

  const generateShareText = () => {
    const destinations = rfq.destinations?.map(d => d.destination).join(', ') || 'Multiple Destinations';
    const text = `🌍 *Travel Plan - ${destinations}*\n\n` +
                `📅 *Trip Duration:* ${rfq.destinations?.length || 1} days\n` +
                `🎯 *Total Items:* ${planItems.length}\n` +
                `💰 *Total Cost:* ₹${Math.round(grandTotal).toLocaleString('en-IN')}\n\n` +
                `*Plan Includes:*\n`;
    
    const typeCount = {};
    planItems.forEach(item => {
      typeCount[item.type] = (typeCount[item.type] || 0) + 1;
    });
    
    Object.entries(typeCount).forEach(([type, count]) => {
      const emoji = { flight: '✈️', hotel: '🏨', transport: '🚗', attraction: '🗺️', other: '📋' }[type] || '📋';
      const label = { flight: 'Flights', hotel: 'Hotels', transport: 'Transport', attraction: 'Attractions', other: 'Other' }[type] || type;
      text += `${emoji} ${label}: ${count}\n`;
    });
    
    text += `\n🔗 *View Full Plan:* ${generateShareLink()}\n\n` +
            (customMessage || `Book your dream trip with TravPlatforms! 🎉`);
    
    return text;
  };

  const handleShare = () => {
    const shareText = generateShareText();
    
    switch (shareMethod) {
      case 'whatsapp':
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(whatsappUrl, '_blank');
        break;
        
      case 'email':
        const subject = encodeURIComponent(`Travel Plan - ${rfq.destinations?.map(d => d.destination).join(', ') || 'Trip'}`);
        const body = encodeURIComponent(shareText);
        window.location.href = `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
        break;
        
      case 'link':
        navigator.clipboard.writeText(generateShareLink());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        break;
        
      case 'copy':
        navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        break;
    }
  };

  const shareOptions = [
    { id: 'whatsapp', label: 'WhatsApp', icon: '📱', color: '#25D366' },
    { id: 'email', label: 'Email', icon: '📧', color: '#EA4335' },
    { id: 'link', label: 'Copy Link', icon: '🔗', color: '#1DA1F2' },
    { id: 'copy', label: 'Copy Text', icon: '📋', color: '#6B7280' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Share Travel Plan</h2>
              <p className="text-sm text-gray-500 mt-1">Share your complete itinerary</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Plan Summary */}
        <div className="p-6 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">Plan Summary</span>
            <span className="text-xs bg-gold-100 text-gold-700 px-2 py-1 rounded-full font-medium">
              {planItems.length} items
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Destinations:</span>
              <span className="font-medium text-gray-900">
                {rfq.destinations?.map(d => d.destination).join(', ') || '—'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Cost:</span>
              <span className="font-bold text-gold-600">₹{Math.round(grandTotal).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Share Options */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {shareOptions.map(option => (
              <button
                key={option.id}
                onClick={() => setShareMethod(option.id)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  shareMethod === option.id
                    ? 'border-gold-400 bg-gold-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{option.icon}</div>
                <div className="text-xs font-medium text-gray-700">{option.label}</div>
              </button>
            ))}
          </div>

          {/* Email Input (only for email method) */}
          {shareMethod === 'email' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Email
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
              />
            </div>
          )}

          {/* Custom Message */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Message (Optional)
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add a personal message..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent resize-none"
            />
          </div>

          {/* Share Button */}
          <button
            onClick={handleShare}
            disabled={shareMethod === 'email' && !recipientEmail}
            className="w-full py-3 bg-gold-500 hover:bg-gold-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            {copied ? '✅ Copied!' : `Share via ${shareOptions.find(o => o.id === shareMethod)?.label}`}
          </button>

          {/* Preview */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs font-medium text-gray-700 mb-2">Preview:</div>
            <div className="text-xs text-gray-600 line-clamp-3">
              {generateShareText().substring(0, 150)}...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
