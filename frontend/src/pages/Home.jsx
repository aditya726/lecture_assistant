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
    <div className="flex flex-col h-[calc(100vh-4rem)] p-4 md:p-6 lg:p-8 overflow-hidden bg-background">

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Zap className="h-6 w-6 text-amber-400" />
            Lecture Workspace
          </h1>
          <p className="text-muted-foreground mt-1">Real-time transcripts, smart notes, tags & doubts.</p>
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
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-input text-foreground hover:bg-card/80 transition-colors disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span className="text-sm font-medium">Upload Audio</span>
            </button>
          </div>

          {(transcript || notes) && (
            <button
              onClick={resetWorkspace}
              className="px-4 py-2 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
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
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">

        {/* Left Pane: Transcript */}
        <GlassCard className="flex flex-col overflow-hidden border-border/50 bg-card/40">
          <div className="p-4 border-b border-border/50 bg-card/60 flex items-center gap-2">
            <Mic className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground text-sm uppercase tracking-wider">Live Transcript</h2>
            {isProcessing && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground ml-2" />}
          </div>
          <div className="flex-1 p-5 overflow-y-auto custom-scrollbar whitespace-pre-wrap text-foreground italic leading-relaxed text-sm md:text-base">
            {transcript || (
              <span className="text-muted-foreground">
                Start recording or upload an audio file to see the transcript here...
              </span>
            )}
          </div>
        </GlassCard>

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
          <GlassCard className="flex-1 flex flex-col overflow-hidden border-border/50 bg-card/40 relative">
            <div className="p-4 border-b border-border/50 bg-card/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-500" />
                <h2 className="font-semibold text-foreground text-sm uppercase tracking-wider">Organized Notes</h2>
              </div>

              {/* Floating Doubt Now button trigger */}
              <AnimatePresence>
                {selectedText && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={handleDoubtNow}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Doubt Now
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            <div
              className="flex-1 p-5 overflow-y-auto custom-scrollbar text-base"
              onMouseUp={handleSelectionChange}
              onKeyUp={handleSelectionChange}
            >
              {notes ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <MarkdownRenderer content={notes} />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center">
                  <BookOpen className="w-12 h-12 mb-4 opacity-20" />
                  <p>AI generated notes will appear here.</p>
                  <p className="text-sm mt-2 opacity-70">Highlight any text here later to ask a doubt!</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Doubt Explanation Modal */}
      <AnimatePresence>
        {showDoubtModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-border flex flex-col max-h-[85vh]"
            >
              <div className="p-4 border-b border-border flex items-center justify-between bg-indigo-500/10">
                <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-indigo-500" />
                  Doubt Resolved
                </h3>
                <button onClick={() => setShowDoubtModal(false)} className="text-muted-foreground hover:text-foreground p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto custom-scrollbar flex-1 bg-background">
                <div className="mb-4 p-3 rounded-lg bg-card border border-border text-sm italic text-foreground/80 border-l-4 border-l-indigo-500">
                  "{selectedText}"
                </div>

                {isExplaining ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
                    <p>Generating a simple explanation...</p>
                  </div>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
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
