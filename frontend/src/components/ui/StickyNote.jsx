import React from 'react';
import { Maximize2 } from 'lucide-react';

const colors = [
  'bg-amber-100/95 border-amber-200 text-amber-900', 
  'bg-sky-100/95 border-sky-200 text-sky-900',
  'bg-emerald-100/95 border-emerald-200 text-emerald-900',
  'bg-rose-100/95 border-rose-200 text-rose-900',
  'bg-fuchsia-100/95 border-fuchsia-200 text-fuchsia-900'
];

export default function StickyNote({ title, value, onChange, colorIndex = 0, onExpand }) {
  const colorClass = colors[colorIndex % colors.length];

  return (
    <div className={`relative flex flex-col p-5 rounded-2xl border ${colorClass} shadow-sm hover:shadow-md transition-all h-full min-h-[180px] group`}>
       {/* Maximize Button */}
       {onExpand && (
         <button 
           onClick={onExpand} 
           className="absolute top-3.5 right-3.5 p-1.5 rounded-lg hover:bg-black/10 text-black/40 hover:text-black/70 transition-colors z-10 opacity-0 group-hover:opacity-100"
           title="View at large scale"
         >
           <Maximize2 className="w-4 h-4" />
         </button>
       )}

       {/* Top subtle highlight */}
       <div className="absolute top-0 left-0 w-full h-8 opacity-40 bg-gradient-to-b from-white to-transparent rounded-t-2xl pointer-events-none" />
       
       {/* Visual Pin */}
       <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-8 h-2.5 bg-black/10 rounded-full blur-[2px]"></div>
       <div className="absolute top-2 left-1/2 -translate-x-1/2 w-6 h-1.5 bg-white/60 border border-white/50 rounded-full shadow-sm"></div>

       <h3 className="font-bold text-[13px] mb-2.5 opacity-70 mt-3 tracking-wider uppercase font-sans border-b border-black/5 pb-1">{title}</h3>
       
       <textarea 
         value={value}
         onChange={(e) => onChange(e.target.value)}
         className="flex-1 w-full bg-transparent border-none outline-none resize-none custom-scrollbar text-[15px] leading-relaxed font-medium placeholder:text-black/30"
         placeholder="Empty note..."
         spellCheck="false"
       />
    </div>
  );
}
