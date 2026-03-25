import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import StickyNote from '../components/ui/StickyNote';
import { Loader2, BookOpen, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Notes() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flattenedNotes, setFlattenedNotes] = useState([]);
  const [expandedNote, setExpandedNote] = useState(null);

  const boardRef = useRef(null);

  // For saving edits
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

        // Add Key Point Notes (Combined)
        if (session.key_points && session.key_points.length > 0) {
           const combinedKp = session.key_points.map(kp => `• ${kp}`).join('\n\n');
           extractedNotes.push({
              id: `kp-${session._id}`,
              sessionId: session._id,
              sessionObj: session,
              type: 'key_point_group',
              index: null,
              title: `${session.title || 'Untitled'} (${sessionDate}) - Key Points`,
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
        
        // Update the underlying session object payload
        if (note.type === 'summary') {
           note.sessionObj.summary = newContent;
        } else {
           // Parse the visually bulleted block back into a clean string array for the db
           note.sessionObj.key_points = newContent
              .split('\n')
              .map(line => line.replace(/^•\s*/, '').trim())
              .filter(line => line.length > 0);
        }

        // Trigger debounced backend save
        debouncedSync(note.sessionId, note.sessionObj);

        return next;
     });
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
      <div className="mb-8 shrink-0">
         <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-xl">
               <BookOpen className="w-7 h-7 text-primary" /> 
            </div>
            Smart Notes Board
         </h1>
         <p className="text-muted-foreground mt-2 font-medium">All your summaries and key points from past lectures, gathered in one interactive board.</p>
      </div>
      
      {error && (
         <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm mb-6 border border-destructive/20 font-medium">
            {error}
         </div>
      )}

      <div ref={boardRef} className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pb-10 relative">
         {flattenedNotes.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-muted-foreground/60 text-center">
             <BookOpen className="w-16 h-16 mb-4 opacity-20" />
             <p className="text-xl font-semibold text-foreground/50">Your board is empty</p>
             <p className="mt-2 text-sm font-medium">Process a lecture in your Workspace to generate smart sticky notes.</p>
           </div>
         ) : (
           <div className="flex flex-wrap gap-8 p-4 content-start">
              {flattenedNotes.map(note => (
                <motion.div 
                  key={note.id}
                  drag
                  dragConstraints={boardRef}
                  dragElastic={0.1}
                  dragMomentum={false}
                  whileDrag={{ scale: 1.05, zIndex: 50, shadow: "0px 10px 20px rgba(0,0,0,0.15)" }}
                  className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.33%-1.5rem)] xl:w-[calc(25%-1.5rem)] h-[280px] cursor-grab active:cursor-grabbing relative"
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
           </div>
         )}
      </div>

      <AnimatePresence>
        {expandedNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-full max-w-4xl h-[85vh] bg-background rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-border"
            >
              <div className="flex items-center justify-between p-5 border-b border-border bg-muted/30">
                 <h2 className="font-bold text-lg opacity-80 uppercase tracking-wide">{expandedNote.title}</h2>
                 <button onClick={() => setExpandedNote(null)} className="p-2 rounded-xl bg-muted hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              <div className="flex-1 p-8 bg-card relative">
                <textarea
                  value={expandedNote.content}
                  onChange={(e) => {
                     const val = e.target.value;
                     setExpandedNote(prev => ({...prev, content: val}));
                     handleNoteChange(expandedNote.id, val);
                  }}
                  className="w-full h-full bg-transparent border-none outline-none resize-none custom-scrollbar text-[20px] leading-relaxed font-medium placeholder:text-black/30"
                  spellCheck="false"
                  placeholder="Empty note..."
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
