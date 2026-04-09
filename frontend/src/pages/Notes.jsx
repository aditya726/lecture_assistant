import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import StickyNote from '../components/ui/StickyNote';
import { Loader2, BookOpen, X, Sparkles, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../workspace.css';

export default function Notes() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flattenedNotes, setFlattenedNotes] = useState([]);
  const [expandedNote, setExpandedNote] = useState(null);

  const boardRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await api.get('/sessions/');
      const sessions = res.data;
      
      const extractedNotes = [];
      let globalIndex = 0;

      sessions.forEach(session => {
        if (!session.key_points || session.key_points.length === 0) return;
        
        const sessionDate = new Date(session.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

        if (session.key_points && session.key_points.length > 0) {
           const combinedKp = session.key_points.map(kp => `- ${kp}`).join('\n\n');
           extractedNotes.push({
              id: `kp-${session._id}`,
              sessionId: session._id,
              sessionObj: session,
              type: 'key_point_group',
              index: null,
              title: `${session.title || 'Untitled'} (${sessionDate})`,
              content: combinedKp,
              colorIndex: globalIndex++
           });
        }
      });
      
      setFlattenedNotes(extractedNotes);
    } catch (err) {
      setError("Failed to load notes. " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const syncToApi = async (sessionId, sessionObj) => {
     try {
       const payload = {
         title: sessionObj.title,
         transcript: sessionObj.transcript,
         summary: sessionObj.summary,
         key_points: sessionObj.key_points,
         tags: sessionObj.tags || {},
         related_resources: sessionObj.related_resources || []
       };
       await api.put(`/sessions/${sessionId}`, payload);
     } catch (err) {
       console.error("Failed to sync note update to backend", err);
     }
  };

  const debouncedSync = (sessionId, sessionObj) => {
     if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
     saveTimeoutRef.current = setTimeout(() => {
        syncToApi(sessionId, sessionObj);
     }, 1500);
  };

  const handleNoteChange = (noteId, newContent) => {
     setFlattenedNotes(prev => {
        const next = [...prev];
        const noteIndex = next.findIndex(n => n.id === noteId);
        if (noteIndex === -1) return prev;
        
        const note = next[noteIndex];
        note.content = newContent;
        
        if (note.type === 'summary') {
           note.sessionObj.summary = newContent;
        } else {
           note.sessionObj.key_points = newContent
              .split('\n')
              .map(line => line.replace(/^[\-•]\s*/, '').trim())
              .filter(line => line.length > 0);
        }

        debouncedSync(note.sessionId, note.sessionObj);

        return next;
     });
  };

  if (loading) {
    return (
      <div className="workspace-layout flex h-[calc(100vh-56px)] items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#d97757] opacity-80" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-layout overflow-y-auto w-full h-[calc(100vh-56px)] custom-scrollbar pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 h-full flex flex-col">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="mb-8 shrink-0"
        >
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
             <div className="bg-[#d97757]/12 p-2.5 rounded-xl border border-[#d97757]/28">
               <Layers className="w-7 h-7 text-[#f0b39e]" /> 
             </div>
             Knowledge Board
          </h1>
          <p className="text-muted-foreground mt-2 font-medium max-w-2xl">
            A unified collection of key insights and summaries extracted from all your past sessions. Drag to organize, edit freely, and review seamlessly.
          </p>
        </motion.div>
        
        {error && (
           <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-xl bg-red-500/10 text-red-400 text-sm mb-6 border border-red-500/20 font-medium flex items-center gap-3"
           >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {error}
           </motion.div>
        )}

        {/* Board Area */}
        <div ref={boardRef} className="flex-1 relative">
           {flattenedNotes.length === 0 ? (
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }}
               className="h-full flex flex-col items-center justify-center text-muted-foreground/50 mt-10"
             >
               <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mb-6 shadow-2xl">
                 <BookOpen className="w-10 h-10 opacity-30" />
               </div>
               <p className="text-xl font-semibold text-foreground/70">Your board is empty</p>
               <p className="mt-2 text-sm font-medium">Process a lecture in your Workspace to generate smart sticky notes.</p>
             </motion.div>
           ) : (
             <motion.div 
               className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 content-start"
               initial="hidden" animate="visible"
               variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
             >
                {flattenedNotes.map((note, index) => (
                  <motion.div 
                    key={note.id}
                    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                    drag
                    dragConstraints={boardRef}
                    dragElastic={0.1}
                    dragMomentum={false}
                    whileDrag={{ scale: 1.05, zIndex: 50 }}
                    style={{ zIndex: 10 + index }}
                    className="w-full h-[280px] cursor-grab active:cursor-grabbing relative"
                  >
                    <StickyNote 
                      title={note.title}
                      value={note.content}
                      onChange={(val) => handleNoteChange(note.id, val)}
                      colorIndex={note.colorIndex}
                      onExpand={() => setExpandedNote(note)}
                    />
                  </motion.div>
                ))}
             </motion.div>
           )}
        </div>

        {/* Expanded Note Modal */}
        <AnimatePresence>
          {expandedNote && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="w-full max-w-4xl h-[85vh] bg-[#181b21] rounded-[32px] shadow-2xl flex flex-col overflow-hidden border border-white/10 relative"
              >
                {/* Decorative glow inside modal */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#d97757]/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02] relative z-10">
                   <div className="flex items-center gap-3">
                     <div className="bg-[#d97757]/20 p-2 rounded-xl">
                       <Sparkles className="w-5 h-5 text-[#f0b39e]" />
                     </div>
                     <h2 className="font-bold text-lg text-[#f4f1ed] tracking-wide">{expandedNote.title}</h2>
                   </div>
                   <button 
                     onClick={() => setExpandedNote(null)} 
                     className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-muted-foreground hover:text-red-400 border border-white/5 transition-all"
                   >
                      <X className="w-5 h-5" />
                   </button>
                </div>

                <div className="flex-1 p-8 relative z-10">
                  <textarea
                    value={expandedNote.content}
                    onChange={(e) => {
                       const val = e.target.value;
                       setExpandedNote(prev => ({...prev, content: val}));
                       handleNoteChange(expandedNote.id, val);
                    }}
                    className="w-full h-full bg-transparent border-none outline-none resize-none custom-scrollbar text-[18px] leading-[1.8] font-medium placeholder:text-white/20 text-[#ece3dc]/90"
                    spellCheck="false"
                    placeholder="Empty note..."
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
