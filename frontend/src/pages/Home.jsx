import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import { Mic, Upload, ExternalLink, HelpCircle, X, Loader2, BookOpen, Tag as TagIcon, Zap } from 'lucide-react';
import MarkdownRenderer from '../components/MarkdownRenderer';
import AudioRecorder from '../components/AudioRecorder';

export default function Home() {
  const [transcript, setTranscript] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState(null);
  const [resources, setResources] = useState([]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const [selectedText, setSelectedText] = useState('');
  const [doubtExplanation, setDoubtExplanation] = useState(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [showDoubtModal, setShowDoubtModal] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('audio_file', file);

      const res = await fetch('http://localhost:8000/api/v1/ai/transcribe-audio', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Transcription failed');
      const data = await res.json();

      const newTranscript = data.transcription;
      setTranscript(newTranscript);
      await processLecture(newTranscript);
    } catch (err) {
      setError(`Upload Error: ${err.message}`);
      setIsProcessing(false);
    }
  };

  const handleMicTranscription = async (newText) => {
    setTranscript(newText);
    await processLecture(newText);
  };

  const processLecture = async (text) => {
    if (!text.trim()) return;
    setIsProcessing(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:8000/api/v1/ai/process-lecture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, context: "" })
      });
      if (!res.ok) throw new Error('Failed to process lecture');
      const data = await res.json();

      // Construct notes combining summary and key_points
      let combinedNotes = `## Summary\n${data.summary}\n\n`;
      if (data.key_points && data.key_points.length > 0) {
        combinedNotes += `### Key Points\n` + data.key_points.map(p => `- ${p}`).join('\n');
      }

      setNotes(combinedNotes);
      setTags(data.tags);
      setResources(data.related_resources || []);
    } catch (err) {
      setError(`Processing Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Track selection
  const handleSelectionChange = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim() !== '') {
      setSelectedText(selection.toString().trim());
    }
  };

  const handleDoubtNow = async () => {
    if (!selectedText) return;
    setShowDoubtModal(true);
    setIsExplaining(true);
    setDoubtExplanation(null);

    try {
      const res = await fetch('http://localhost:8000/api/v1/ai/explain-doubt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: selectedText, context: transcript })
      });
      if (!res.ok) throw new Error('Failed to get explanation');
      const data = await res.json();
      setDoubtExplanation(data.explanation);
    } catch (err) {
      setDoubtExplanation(`Error: ${err.message}`);
    } finally {
      setIsExplaining(false);
    }
  };

  const resetWorkspace = () => {
    setTranscript('');
    setNotes('');
    setTags(null);
    setResources([]);
    setSelectedText('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-4 md:p-6 lg:p-8 overflow-hidden bg-background relative isolate">
      {/* Modern subtle ambient glow backgrounds */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/10 blur-[100px]" />
      </div>

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 px-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2 drop-shadow-sm">
            <Zap className="h-6 w-6 text-primary" />
            Lecture Workspace
          </h1>
          <p className="text-muted-foreground mt-1.5 font-medium">Real-time transcripts, smart notes, tags & doubts.</p>
        </div>

        <div className="flex items-center gap-3">
          <AudioRecorder
            onTranscriptionComplete={(text) => handleMicTranscription(text)}
            onError={(msg) => setError(msg)}
          />

          <div>
            <input
              type="file"
              accept="audio/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="modern-button flex items-center gap-2 px-5 py-2.5 rounded-full bg-card/80 backdrop-blur-md border border-border/50 text-foreground hover:bg-muted text-sm font-semibold shadow-sm transition-all"
            >
              <Upload className="w-4 h-4 text-muted-foreground" />
              Upload Audio
            </button>
          </div>

          {(transcript || notes) && (
            <button
              onClick={resetWorkspace}
              className="modern-button px-5 py-2.5 rounded-full text-sm font-semibold text-destructive/90 bg-destructive/10 hover:bg-destructive/20 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Main Split View */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">

        {/* Left Pane: Transcript */}
        <div className="modern-glass flex flex-col overflow-hidden rounded-2xl relative">
          <div className="px-5 py-4 border-b border-border/40 bg-muted/20 flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Mic className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground text-sm tracking-wide">Live Transcript</h2>
            {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary ml-2" />}
          </div>
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar text-foreground leading-relaxed text-[15px]">
            {transcript ? (
              <div className="whitespace-pre-wrap">{transcript}</div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/60 text-center px-8">
                <Mic className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-medium text-lg text-foreground/50">Ready to transcribe</p>
                <p className="text-sm mt-1">Start recording or upload an audio file</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Notes & Insights */}
        <div className="flex flex-col gap-4 overflow-hidden">

          {/* Tags & Resources (Top part of right pane) */}
          <AnimatePresence>
            {(tags || resources.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3 shrink-0"
              >
                {tags && (
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs font-semibold text-muted-foreground mr-1 uppercase">Tags:</span>
                    {tags.subject && <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">{Array.isArray(tags.subject) ? tags.subject.join(', ') : tags.subject}</span>}
                    {tags.topic && <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-500 border border-purple-500/20">{Array.isArray(tags.topic) ? tags.topic.join(', ') : tags.topic}</span>}
                    {tags.difficulty && <span className="px-3 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-500 border border-rose-500/20">{Array.isArray(tags.difficulty) ? tags.difficulty.join(', ') : tags.difficulty}</span>}
                  </div>
                )}

                {resources && resources.length > 0 && (
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs font-semibold text-muted-foreground mr-1 uppercase">Resources:</span>
                    {resources.map((res, i) => (
                      <a
                        key={i}
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(res)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-card border border-input text-foreground hover:bg-card/80 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {res}
                      </a>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notes Container */}
          <div className="modern-glass flex-1 flex flex-col overflow-hidden rounded-2xl relative shadow-sm">
            <div className="px-5 py-4 border-b border-border/40 bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-emerald-500/10">
                  <BookOpen className="w-4 h-4 text-emerald-500" />
                </div>
                <h2 className="font-semibold text-foreground text-sm tracking-wide">Organized Notes</h2>
              </div>

              {/* Floating Doubt Now button trigger */}
              <AnimatePresence>
                {selectedText && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={handleDoubtNow}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Doubt Now
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            <div
              className="flex-1 p-6 overflow-y-auto custom-scrollbar text-[15px]"
              onMouseUp={handleSelectionChange}
              onKeyUp={handleSelectionChange}
            >
              {notes ? (
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <MarkdownRenderer content={notes} />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/60 text-center px-8">
                  <BookOpen className="w-12 h-12 mb-4 opacity-20" />
                  <p className="font-medium text-lg text-foreground/50">No notes yet</p>
                  <p className="text-sm mt-1">Notes will generate automatically</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Doubt Explanation Modal */}
      <AnimatePresence>
        {showDoubtModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-border/50 flex flex-col max-h-[85vh]"
            >
              <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between bg-muted/30">
                <h3 className="font-semibold text-[17px] text-foreground flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <HelpCircle className="w-4 h-4 text-primary" />
                  </div>
                  Doubt Resolved
                </h3>
                <button onClick={() => setShowDoubtModal(false)} className="text-muted-foreground hover:text-foreground p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-background/50">
                <div className="mb-6 p-4 rounded-xl bg-card border border-border/50 text-[15px] italic text-muted-foreground shadow-sm relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl opacity-80" />
                  "{selectedText}"
                </div>

                {isExplaining ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                    <p className="font-medium">Formulating your explanation...</p>
                  </div>
                ) : (
                  <div className="prose prose-slate dark:prose-invert max-w-none text-[15px] leading-relaxed">
                    <MarkdownRenderer content={doubtExplanation || "No explanation available."} />
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
