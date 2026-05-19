// components/detail/ChecklistTab.jsx
import { useState } from 'react';
import axios from '../../utils/axiosConfig';

const PRIORITY_COLORS = {
  high:   'bg-red-50 text-red-600 border-red-100',
  medium: 'bg-yellow-50 text-yellow-600 border-yellow-100',
  low:    'bg-gray-50 text-gray-400 border-gray-100',
};

const TAG_STYLES = {
  not_required: 'bg-green-50 text-green-600 border-green-200',
  on_arrival:   'bg-blue-50 text-blue-600 border-blue-200',
  required:     'bg-red-50 text-red-600 border-red-200',
};

export default function ChecklistTab({ rfq, onUpdate }) {
  const [saving, setSaving] = useState(null); // itemId being saved

  const checklist = rfq?.checklist || [];
  const stats     = rfq?.checklistStats || { total: 0, completed: 0, highPriority: 0 };
  const visaInfo  = rfq?.visaInfo;

  const handleCheck = async (categoryIndex, itemId, checked) => {
    setSaving(itemId);
    try {
      const res = await axios.patch(`/api/rfqs/${rfq._id}/checklist`, {
        categoryIndex,
        itemId,
        checked,
      });
      if (res.data?.data && onUpdate) onUpdate(res.data.data);
    } catch (err) {
      console.error('Checklist update failed:', err);
    }
    setSaving(null);
  };

  const progressPct = stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4">
        <div className="font-bold text-base text-gray-900 mb-0.5">📋 Travel Checklist</div>
        <div className="text-xs text-gray-400">Check off items as you prepare for your trip</div>
      </div>

      {/* Visa info banner */}
      {visaInfo && (
        <div className={`mb-4 rounded-xl border px-4 py-3 flex items-start gap-3 ${
          visaInfo.required
            ? 'bg-red-50 border-red-200'
            : 'bg-green-50 border-green-200'
        }`}>
          <span className="text-xl flex-shrink-0">{visaInfo.required ? '🛂' : '✅'}</span>
          <div>
            <div className={`text-xs font-bold ${visaInfo.required ? 'text-red-700' : 'text-green-700'}`}>
              Visa Information
            </div>
            <div className={`text-xs mt-0.5 ${visaInfo.required ? 'text-red-600' : 'text-green-600'}`}>
              {visaInfo.label || (visaInfo.visaType === 'visa_free' ? 'Visa not required' : 'Check requirements')}
            </div>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-5 bg-white border border-gray-100 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-700">Overall Progress</span>
          <span className="text-xs font-bold text-gold-600">{stats.completed}/{stats.total}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gold-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
          <span>{progressPct}% complete</span>
          {stats.highPriority > 0 && (
            <span className="text-red-500 font-semibold">⚠️ {stats.highPriority} urgent remaining</span>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-col gap-4">
        {checklist.map((category, catIdx) => {
          const doneCount = category.items.filter(i => i.checked).length;
          return (
            <div key={catIdx} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              {/* Category header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-base">{category.emoji}</span>
                  <span className="text-xs font-bold text-gray-800">{category.category}</span>
                </div>
                <span className="text-xs text-gray-400 font-medium">
                  {doneCount}/{category.items.length}
                </span>
              </div>

              {/* Items */}
              <div className="divide-y divide-gray-50">
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                      item.checked ? 'bg-green-50/50' : 'bg-white'
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => handleCheck(catIdx, item.id, !item.checked)}
                      disabled={saving === item.id}
                      className={`w-5 h-5 rounded flex-shrink-0 mt-0.5 border-2 flex items-center justify-center transition-all ${
                        item.checked
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-gold-400'
                      } ${saving === item.id ? 'opacity-50' : ''}`}
                    >
                      {saving === item.id ? (
                        <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                      ) : item.checked ? (
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : null}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-semibold flex items-center gap-2 flex-wrap ${
                        item.checked ? 'text-gray-400 line-through' : 'text-gray-800'
                      }`}>
                        {item.label}
                        {/* Priority badge */}
                        {item.priority === 'high' && !item.checked && (
                          <span className={`text-xs border rounded-full px-1.5 py-0.5 font-semibold no-underline ${PRIORITY_COLORS.high}`}>
                            urgent
                          </span>
                        )}
                        {/* Tag badge */}
                        {item.tag && (
                          <span className={`text-xs border rounded-full px-1.5 py-0.5 font-semibold no-underline ${
                            TAG_STYLES[item.tag] || 'bg-gray-50 text-gray-400 border-gray-100'
                          }`}>
                            {item.tag === 'not_required' ? '✅ Not required'
                              : item.tag === 'on_arrival' ? '🛬 On arrival'
                              : item.tag === 'required' ? '⚠️ Required'
                              : item.tag}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <div className={`text-xs mt-0.5 leading-relaxed ${
                          item.checked ? 'text-gray-300' : 'text-gray-400'
                        }`}>
                          {item.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {checklist.length === 0 && (
        <div className="text-center py-10 text-gray-300 text-sm">
          <div className="text-3xl mb-2">📋</div>
          Checklist not generated yet. Try regenerating the itinerary.
        </div>
      )}
    </div>
  );
}