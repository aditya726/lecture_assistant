import React from 'react';
import { Maximize2, Sparkles } from 'lucide-react';

const colors = [
  { border: 'border-[#d97757]/25', text: 'text-[#f0b39e]', line: 'bg-[#d97757]/35' },
  { border: 'border-[#7ea389]/25', text: 'text-[#b9d0be]', line: 'bg-[#7ea389]/35' },
  { border: 'border-[#b89b67]/25', text: 'text-[#dfc8a1]', line: 'bg-[#b89b67]/35' },
  { border: 'border-[#9d8fb5]/25', text: 'text-[#cabfd8]', line: 'bg-[#9d8fb5]/35' },
  { border: 'border-[#b77a74]/25', text: 'text-[#dfb1ad]', line: 'bg-[#b77a74]/35' },
];

export default function StickyNote({ title, value, onChange, colorIndex = 0, onExpand }) {
  const colorClass = colors[colorIndex % colors.length];

  return (
    <div className="p-[1px] rounded-[24px] h-full relative group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40">
       <div className={`relative flex flex-col p-6 rounded-[23px] bg-[#181b21]/90 backdrop-blur-xl border ${colorClass.border} h-full min-h-[180px]`}>
          
          {/* Maximize Button */}
          {onExpand && (
            <button 
              onClick={onExpand} 
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors z-10 opacity-0 group-hover:opacity-100 border border-white/5"
              title="View at large scale"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}

          {/* Visual Pin Replacement (Glowing Dot) */}
           <div className={`absolute top-0 inset-x-0 h-px ${colorClass.line}`} />
          
          <div className="flex items-center gap-2 mb-4 mt-1 border-b border-white/10 pb-3">
             <Sparkles className={`w-4 h-4 opacity-70 ${colorClass.text}`} />
             <h3 className={`font-bold text-[13px] opacity-90 tracking-wider uppercase font-sans ${colorClass.text}`}>{title}</h3>
          </div>
          
          <textarea 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 w-full bg-transparent border-none outline-none resize-none custom-scrollbar text-[14px] leading-relaxed font-medium placeholder:text-white/20 text-[rgba(240,244,255,0.85)]"
            placeholder="Write your note..."
            spellCheck="false"
          />
       </div>
    </div>
  );
}
