import React from 'react';
import { Maximize2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

// Premium dark gradients instead of pastel post-it colors
const colors = [
  'from-blue-500/10 to-blue-500/5 border-blue-500/20 text-blue-100 accent-blue-500', 
  'from-purple-500/10 to-purple-500/5 border-purple-500/20 text-purple-100 accent-purple-500',
  'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 text-emerald-100 accent-emerald-500',
  'from-pink-500/10 to-pink-500/5 border-pink-500/20 text-pink-100 accent-pink-500',
  'from-orange-500/10 to-orange-500/5 border-orange-500/20 text-orange-100 accent-orange-500'
];

export default function StickyNote({ title, value, onChange, colorIndex = 0, onExpand }) {
  const colorClass = colors[colorIndex % colors.length];

  return (
    <div className="p-[1px] rounded-[24px] h-full relative group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50">
       {/* Background gradient border effect */}
       <div className={`absolute inset-0 rounded-[24px] bg-gradient-to-br ${colorClass.split(' ').slice(0, 2).join(' ')} opacity-50 blur-sm group-hover:opacity-100 transition-opacity`} />
       
       <div className={`relative flex flex-col p-6 rounded-[23px] bg-[#0d121c]/90 backdrop-blur-xl border ${colorClass} h-full min-h-[180px]`}>
          
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
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          
          <div className="flex items-center gap-2 mb-4 mt-1 border-b border-white/10 pb-3">
             <Sparkles className={`w-4 h-4 opacity-70 ${colorClass.split(' ').find(c => c.startsWith('text-'))}`} />
             <h3 className={`font-bold text-[13px] opacity-90 tracking-wider uppercase font-sans ${colorClass.split(' ').find(c => c.startsWith('text-'))}`}>{title}</h3>
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
