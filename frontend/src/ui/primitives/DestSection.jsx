// ui/primitives/DestSection.jsx
// Wrapper used in tabs to group content per destination
import React, { useState } from "react";
import axios from "axios";
export default function DestSection({ name, nights, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-6">
      {/* Section header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 mb-3 group"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-2 h-2 bg-gold-400 rounded-full flex-shrink-0" />
          <span className="font-bold text-sm text-gray-800 truncate">{name}</span>
          {nights != null && (
            <span className="text-xs text-gray-400 font-medium flex-shrink-0">
              · {nights} night{nights !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <span className={`text-gray-300 text-xs transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {open && <div>{children}</div>}
    </div>
  );
}
