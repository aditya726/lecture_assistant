import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Loader2, Sparkles, StickyNote as StickyNoteIcon } from "lucide-react";

import api from "../services/api";
import StickyNote from "../components/ui/StickyNote";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";

const reveal = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

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
      const res = await api.get("/sessions/");
      const sessions = res.data;
      const extractedNotes = [];

      sessions.forEach((session) => {
        if (!session.key_points?.length) return;

        const sessionDate = new Date(session.created_at).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });

        const combinedKp = session.key_points.map((kp) => `- ${kp}`).join("\n\n");
        extractedNotes.push({
          id: `kp-${session._id}`,
          sessionId: session._id,
          sessionObj: session,
          title: `${session.title || "Untitled"} (${sessionDate})`,
          content: combinedKp,
        });
      });

      setFlattenedNotes(extractedNotes);
    } catch (err) {
      setError(`Failed to load notes. ${err.response?.data?.detail || err.message}`);
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
        related_resources: sessionObj.related_resources || [],
      };
      await api.put(`/sessions/${sessionId}`, payload);
    } catch (err) {
      console.error("Failed to sync note update", err);
    }
  };

  const debouncedSync = (sessionId, sessionObj) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => syncToApi(sessionId, sessionObj), 1200);
  };

  const handleNoteChange = (noteId, newContent) => {
    setFlattenedNotes((prev) => {
      const next = [...prev];
      const noteIndex = next.findIndex((note) => note.id === noteId);
      if (noteIndex === -1) return prev;

      const note = next[noteIndex];
      note.content = newContent;
      note.sessionObj.key_points = newContent
        .split("\n")
        .map((line) => line.replace(/^[\-•]\s*/, "").trim())
        .filter((line) => line.length > 0);

      debouncedSync(note.sessionId, note.sessionObj);
      return next;
    });
  };

  if (loading) {
    return (
      <Card className="glass-panel">
        <CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading notes board...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="premium-shell space-y-4">
      <motion.div variants={reveal} initial="hidden" animate="show">
        <Card className="glass-panel overflow-hidden">
          <CardHeader className="relative">
            <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-violet-500/20 blur-2xl" />
            <CardTitle className="flex items-center gap-2 text-xl">
              <StickyNoteIcon className="h-5 w-5 text-violet-300" />
              Knowledge Board
            </CardTitle>
            <CardDescription>Curate and edit key insights from every lecture session in one premium canvas.</CardDescription>
          </CardHeader>
        </Card>
      </motion.div>

      {error && (
        <Card className="border-destructive/40 bg-destructive/10">
          <CardContent className="p-3 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <motion.div
        ref={boardRef}
        variants={reveal}
        initial="hidden"
        animate="show"
        transition={{ delay: 0.05 }}
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {flattenedNotes.length === 0 ? (
          <Card className="glass-panel col-span-full">
            <CardContent className="grid place-items-center gap-2 py-16 text-center text-muted-foreground">
              <BookOpen className="h-8 w-8" />
              <p>Your board is empty. Process a lecture to generate note cards.</p>
            </CardContent>
          </Card>
        ) : (
          flattenedNotes.map((note, idx) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.03 }}
              className={idx % 2 === 0 ? "float-up" : "float-down"}
            >
              <StickyNote
                title={note.title}
                value={note.content}
                onChange={(value) => handleNoteChange(note.id, value)}
                onExpand={() => setExpandedNote(note)}
              />
            </motion.div>
          ))
        )}
      </motion.div>

      <Dialog open={!!expandedNote} onOpenChange={(open) => !open && setExpandedNote(null)}>
        <DialogContent className="glass-panel max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-300" />
              {expandedNote?.title}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            value={expandedNote?.content || ""}
            onChange={(e) => {
              const value = e.target.value;
              setExpandedNote((prev) => (prev ? { ...prev, content: value } : prev));
              if (expandedNote) handleNoteChange(expandedNote.id, value);
            }}
            className="custom-scrollbar min-h-[60vh] resize-none"
            placeholder="Empty note"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
