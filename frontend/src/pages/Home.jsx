/**
 * Home.jsx — Lecture Assistant Workspace
 * Premium SaaS-style split-panel dashboard
 * Logic preserved; UI completely redesigned
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, Upload, ExternalLink, HelpCircle, X, Loader2,
  BookOpen, Zap, Menu, Plus, MoreVertical, Edit2, Trash2,
  Check, Square, History, AlignLeft, Sparkles
} from 'lucide-react';
import MarkdownRenderer from '../components/MarkdownRenderer';
import AudioRecorder from '../components/AudioRecorder';
import api from '../services/api';
import StickyNote from '../components/ui/StickyNote';
import '../workspace.css';

/* ──────────────────────────────────────
   Panel Loading Overlay
────────────────────────────────────── */
function PanelLoading({ show }) {
  if (!show) return null;
  return (
    <div className="ws-panel-loading">
      <div className="ws-panel-loading__spinner" />
      <div className="ws-panel-loading__dots">
        <div className="ws-panel-loading__dot" />
        <div className="ws-panel-loading__dot" />
        <div className="ws-panel-loading__dot" />
      </div>
      <span className="ws-panel-loading__text">AI is processing your lecture…</span>
    </div>
  );
}

/* ──────────────────────────────────────
   Empty State
────────────────────────────────────── */
function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="ws-empty">
      <Icon size={44} className="ws-empty__icon" />
      <p className="ws-empty__title">{title}</p>
      <p className="ws-empty__sub">{subtitle}</p>
    </div>
  );
}

/* ──────────────────────────────────────
   Sidebar
────────────────────────────────────── */
function Sidebar({
  isOpen,
  sessions,
  currentSessionId,
  groupSessions,
  loadSession,
  resetWorkspace,
  editingSessionId,
  editTitle,
  setEditTitle,
  saveRenameSession,
  setEditingSessionId,
  startEditingSession,
  deleteSession,
  openMenuId,
  setOpenMenuId,
}) {
  return (
    <aside className={`ws-sidebar ${isOpen ? '' : 'ws-sidebar--collapsed'}`} aria-label="Session history">
      {/* Header */}
      <div className="ws-sidebar__header">
        <span className="ws-sidebar__title">
          <History size={13} className="ws-sidebar__title-icon" />
          Past Sessions
        </span>
        <button
          className="ws-sidebar__new-btn"
          onClick={() => resetWorkspace(true)}
          title="New Session"
          id="sidebar-new-session-btn"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Session List */}
      <div className="ws-sidebar__body">
        {sessions.length === 0 ? (
          <p className="ws-sidebar__empty">
            No sessions yet.<br />
            Generate notes to save your first session.
          </p>
        ) : (
          groupSessions().map(([groupName, groupItems]) => (
            <div key={groupName} className="flex flex-col gap-1">
              <p className="ws-sidebar__group-label">{groupName}</p>

              {groupItems.map((s) => (
                <div key={s._id} className="ws-session-item">
                  {/* Inline rename input */}
                  {editingSessionId === s._id ? (
                    <div className="ws-session-edit">
                      <input
                        className="ws-session-edit__input"
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveRenameSession(s._id)}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        className="ws-session-edit__btn"
                        onClick={(e) => saveRenameSession(s._id, e)}
                        style={{ color: '#34d399' }}
                      >
                        <Check size={13} />
                      </button>
                      <button
                        className="ws-session-edit__btn"
                        onClick={(e) => { e.stopPropagation(); setEditingSessionId(null); }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        id={`session-${s._id}`}
                        className={`ws-session-btn ${currentSessionId === s._id ? 'ws-session-btn--active' : ''}`}
                        onClick={() => loadSession(s)}
                      >
                        <span className="ws-session-btn__text">
                          {s.title || 'Untitled Session'}
                        </span>
                      </button>

                      {/* 3-dot menu trigger */}
                      <button
                        className="ws-session-more"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === s._id ? null : s._id);
                        }}
                        aria-label="Session options"
                      >
                        <MoreVertical size={13} />
                      </button>

                      {/* Context menu */}
                      <AnimatePresence>
                        {openMenuId === s._id && (
                          <motion.div
                            className="ws-session-menu"
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            transition={{ duration: 0.12 }}
                          >
                            <button
                              className="ws-session-menu__item"
                              onClick={(e) => startEditingSession(s, e)}
                            >
                              <Edit2 size={12} /> Rename
                            </button>
                            <button
                              className="ws-session-menu__item ws-session-menu__item--danger"
                              onClick={(e) => deleteSession(s._id, e)}
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

/* ──────────────────────────────────────
   MAIN EXPORT — Workspace Page
────────────────────────────────────── */
export default function Home() {
  /* ── State (unchanged logic) ── */
  const [transcript, setTranscript] = useState('');
  const [notes, setNotes] = useState('');
  const [summaryText, setSummaryText] = useState('');
  const [keyPointsList, setKeyPointsList] = useState([]);
  const [tags, setTags] = useState(null);
  const [resources, setResources] = useState([]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const [selectedText, setSelectedText] = useState('');
  const [doubtExplanation, setDoubtExplanation] = useState(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [showDoubtModal, setShowDoubtModal] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);

  const fileInputRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  /* ── Effects ── */
  useEffect(() => {
    fetchSessions();
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  /* ── Debounced save ── */
  const debouncedSave = (newSummary, newKeyPoints) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveSession(transcript, newSummary, newKeyPoints, tags, resources);
    }, 1500);
  };

  const handleSummaryChange = (newVal) => {
    setSummaryText(newVal);
    debouncedSave(newVal, keyPointsList);
  };

  const handleKeyPointChange = (index, newVal) => {
    const newKp = [...keyPointsList];
    newKp[index] = newVal;
    setKeyPointsList(newKp);
    debouncedSave(summaryText, newKp);
  };

  /* ── Session CRUD ── */
  const fetchSessions = async () => {
    try {
      const res = await api.get('/sessions/');
      setSessions(res.data);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  };

  const groupSessions = () => {
    const groups = {
      'Today': [],
      'Yesterday': [],
      'Previous 7 Days': [],
      'Previous 30 Days': [],
      'Older': [],
    };
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    sessions.forEach((s) => {
      const date = new Date(s.created_at);
      date.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(Math.abs(now - date) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) groups['Today'].push(s);
      else if (diffDays === 1) groups['Yesterday'].push(s);
      else if (diffDays <= 7) groups['Previous 7 Days'].push(s);
      else if (diffDays <= 30) groups['Previous 30 Days'].push(s);
      else groups['Older'].push(s);
    });
    return Object.entries(groups).filter(([, items]) => items.length > 0);
  };

  const deleteSession = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this session?')) return;
    try {
      await api.delete(`/sessions/${id}`);
      if (currentSessionId === id) resetWorkspace(true);
      fetchSessions();
    } catch (err) {
      console.error(err);
    }
  };

  const startEditingSession = (session, e) => {
    e.stopPropagation();
    setEditingSessionId(session._id);
    setEditTitle(session.title || 'Untitled Session');
    setOpenMenuId(null);
  };

  const saveRenameSession = async (id, e) => {
    if (e) e.stopPropagation();
    if (!editTitle.trim()) { setEditingSessionId(null); return; }
    try {
      await api.put(`/sessions/${id}`, { title: editTitle });
      setEditingSessionId(null);
      fetchSessions();
    } catch (err) {
      console.error(err);
    }
  };

  const loadSession = (session) => {
    setTranscript(session.transcript || '');
    setNotes(session.summary || '');
    setSummaryText(session.summary || '');
    setKeyPointsList(session.key_points || []);
    setTags(session.tags || null);
    setResources(session.related_resources || []);
    setCurrentSessionId(session._id);
    setSelectedText('');
  };

  const saveSession = async (transStr, sumStr, kpArr, tagsObj, resArr) => {
    try {
      const title = (tagsObj && tagsObj.topic)
        ? (Array.isArray(tagsObj.topic) ? tagsObj.topic[0] : tagsObj.topic)
        : (transStr.split(' ').slice(0, 5).join(' ') + '...');
      const payload = {
        title: title || 'Untitled Session',
        transcript: transStr,
        summary: sumStr,
        key_points: kpArr,
        tags: tagsObj || {},
        related_resources: resArr || [],
      };
      if (currentSessionId) {
        await api.put(`/sessions/${currentSessionId}`, payload);
      } else {
        const res = await api.post('/sessions/', payload);
        setCurrentSessionId(res.data._id);
      }
      fetchSessions();
    } catch (err) {
      console.error('Failed to save session:', err);
    }
  };

  /* ── File / Audio Handlers ── */
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    resetWorkspace(true);
    setIsProcessing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('audio_file', file);
      const res = await api.post('/ai/transcribe-audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const newTranscript = res.data?.transcription || res.data?.text || res.data?.transcript;
      
      if (!newTranscript || typeof newTranscript !== 'string') {
        throw new Error('Server returned an empty or invalid response. This is typically caused by an AWS/Nginx Timeout (504) or an EC2 Out-Of-Memory crash (502) during deployment.');
      }

      setTranscript(newTranscript);
      await processLecture(newTranscript);
    } catch (err) {
      setError(`Upload Failed: ${err.response?.data?.detail || err.message}`);
      setIsProcessing(false);
    }
  };

  const handleMicTranscription = async (newText) => {
    if (!currentSessionId) resetWorkspace(true);
    if (!newText || typeof newText !== 'string' || !newText.trim()) return;
    setTranscript(newText);
    await processLecture(newText);
  };

  const processLecture = async (text) => {
    if (!text || typeof text !== 'string' || !text.trim()) return;
    setIsProcessing(true);
    setError(null);
    try {
      const res = await api.post('/ai/process-lecture', { text, context: '' });
      const data = res.data;
      setNotes(data.summary || '');
      setSummaryText(data.summary || '');
      setKeyPointsList(data.key_points || []);
      setTags(data.tags);

      // RAG pipeline
      let finalResources = data.related_resources || [];
      try {
        let optimalQuery = '';
        if (data.tags?.topic && data.tags.topic !== 'Unknown') {
          optimalQuery = Array.isArray(data.tags.topic) ? data.tags.topic[0] : data.tags.topic;
          if (data.tags.subject && data.tags.subject !== 'General') {
            optimalQuery = (Array.isArray(data.tags.subject) ? data.tags.subject[0] : data.tags.subject) + ' ' + optimalQuery;
          }
        } else if (data.related_resources?.length > 0) {
          optimalQuery = data.related_resources[0];
        } else if (data.key_points?.length > 0) {
          optimalQuery = data.key_points[0];
        } else if (data.summary) {
          optimalQuery = data.summary.split('.')[0].trim();
        } else {
          optimalQuery = 'educational overview';
        }

        let ragRes = await api.post('/recommendations/recommend', { summary: optimalQuery });
        let recs = ragRes.data?.recommended_resources || [];
        if (recs.length === 0) {
          await api.post('/recommendations/ingest', { query: optimalQuery, max_per_source: 3 });
          ragRes = await api.post('/recommendations/recommend', { summary: optimalQuery });
          recs = ragRes.data?.recommended_resources || [];
        }
        if (recs.length > 0) finalResources = recs;
      } catch (err) {
        console.error('RAG pipeline error:', err);
      }

      setResources(finalResources);
      await saveSession(text, data.summary || '', data.key_points || [], data.tags, finalResources);
    } catch (err) {
      setError(`Processing Error: ${err.response?.data?.detail || err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  /* ── Text selection / Doubt ── */
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
      const res = await api.post('/ai/explain-doubt', { text: selectedText, context: transcript });
      setDoubtExplanation(res.data.explanation);
    } catch (err) {
      setDoubtExplanation(`Error: ${err.response?.data?.detail || err.message}`);
    } finally {
      setIsExplaining(false);
    }
  };

  const resetWorkspace = (forceNew = false) => {
    setTranscript('');
    setNotes('');
    setSummaryText('');
    setKeyPointsList([]);
    setTags(null);
    setResources([]);
    setSelectedText('');
    if (forceNew) setCurrentSessionId(null);
  };

  /* ──────────────────────────────────────
     RENDER
  ────────────────────────────────────── */
  return (
    <div className="ws-root">
      {/* Ambient background glow */}
      <div className="ws-ambient" aria-hidden="true" />

      {/* ── Left Sidebar ── */}
      <Sidebar
        isOpen={isSidebarOpen}
        sessions={sessions}
        currentSessionId={currentSessionId}
        groupSessions={groupSessions}
        loadSession={loadSession}
        resetWorkspace={resetWorkspace}
        editingSessionId={editingSessionId}
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        saveRenameSession={saveRenameSession}
        setEditingSessionId={setEditingSessionId}
        startEditingSession={startEditingSession}
        deleteSession={deleteSession}
        openMenuId={openMenuId}
        setOpenMenuId={setOpenMenuId}
      />

      {/* ── Main Area ── */}
      <div className="ws-main">

        {/* ── Top Bar ── */}
        <header className="ws-topbar" role="banner">
          <div className="ws-topbar__left">
            {/* Sidebar toggle */}
            <button
              className="ws-topbar__toggle"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label="Toggle sidebar"
              id="topbar-sidebar-toggle"
            >
              <Menu size={17} />
            </button>

            {/* Title */}
            <div className="ws-topbar__title-wrap">
              <h1 className="ws-topbar__title">
                <Zap size={17} className="ws-topbar__title-icon" />
                Workspace
              </h1>
              <p className="ws-topbar__subtitle">
                Real-time transcription · Smart notes · AI doubt resolution
              </p>
            </div>
          </div>

          {/* Right controls */}
          <div className="ws-topbar__right">
            {/* Saved indicator */}
            {currentSessionId && (
              <span className="ws-badge-saved" id="workspace-saved-badge">
                Auto-saved
              </span>
            )}

            {/* Audio Recorder — wraps existing component */}
            <AudioRecorder
              onTranscriptionComplete={(text) => handleMicTranscription(text)}
              onError={(msg) => setError(msg)}
            />

            {/* Upload audio */}
            <>
              <input
                type="file"
                accept="audio/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                id="upload-audio-btn"
                className="ws-toolbar-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                <Upload size={14} />
                <span>Upload Audio</span>
              </button>
            </>

            {/* Reset */}
            {(transcript || notes) && (
              <button
                id="workspace-reset-btn"
                className="ws-toolbar-btn ws-toolbar-btn--danger"
                onClick={() => resetWorkspace(true)}
                title="Clear workspace"
              >
                <X size={14} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </header>

        {/* ── Error Banner ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="ws-error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              role="alert"
            >
              <span>{error}</span>
              <button className="ws-error__close" onClick={() => setError(null)} aria-label="Dismiss error">
                <X size={15} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Split Panels ── */}
        <div className="ws-panels">

          {/* ───── LEFT PANEL: Transcript ───── */}
          <motion.div
            className="ws-panel"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div className="ws-panel__header">
              <div className="ws-panel__header-left">
                <div className="ws-panel__icon ws-panel__icon--blue">
                  <Mic size={15} />
                </div>
                <h2 className="ws-panel__title">Live Transcript</h2>
              </div>
              {isProcessing && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#818cf8' }}>
                  <Loader2 size={13} style={{ animation: 'ws-spin 0.75s linear infinite' }} />
                  Processing…
                </div>
              )}
            </div>

            {/* Body */}
            <div className="ws-panel__body" style={{ position: 'relative' }}>
              <PanelLoading show={isProcessing && !transcript} />
              {transcript ? (
                <div className="ws-transcript-display">{transcript}</div>
              ) : (
                <EmptyState
                  icon={Mic}
                  title="Ready to transcribe"
                  subtitle="Start recording or upload an audio file to begin"
                />
              )}
            </div>
          </motion.div>

          {/* ───── RIGHT PANEL: Notes ───── */}
          <motion.div
            className="ws-panel"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div className="ws-panel__header">
              <div className="ws-panel__header-left">
                <div className="ws-panel__icon ws-panel__icon--emerald">
                  <Sparkles size={15} />
                </div>
                <h2 className="ws-panel__title">Generated Notes</h2>
              </div>

              {/* Doubt resolution trigger */}
              <AnimatePresence>
                {selectedText && (
                  <motion.button
                    className="ws-doubt-btn"
                    id="doubt-now-btn"
                    onClick={handleDoubtNow}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.18 }}
                  >
                    <HelpCircle size={13} />
                    Doubt Now
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Tags + Resources strip */}
            <AnimatePresence>
              {(tags || resources.length > 0) && (
                <motion.div
                  className="ws-meta-strip"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {/* Tags */}
                  {tags && (
                    <>
                      {tags.subject && (
                        <span className="ws-tag ws-tag--subject">
                          {Array.isArray(tags.subject) ? tags.subject.join(', ') : tags.subject}
                        </span>
                      )}
                      {tags.topic && (
                        <span className="ws-tag ws-tag--topic">
                          {Array.isArray(tags.topic) ? tags.topic.join(', ') : tags.topic}
                        </span>
                      )}
                      {tags.difficulty && (
                        <span className="ws-tag ws-tag--difficulty">
                          {Array.isArray(tags.difficulty) ? tags.difficulty.join(', ') : tags.difficulty}
                        </span>
                      )}
                    </>
                  )}

                  {/* Resources */}
                  {resources.map((res, i) =>
                    typeof res === 'string' ? (
                      <a
                        key={i}
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(res)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="ws-resource"
                      >
                        <ExternalLink size={11} />
                        <span className="ws-resource__text">{res}</span>
                      </a>
                    ) : (
                      <a
                        key={i}
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="ws-resource"
                        title={res.description || res.title}
                      >
                        {res.type === 'video'
                          ? <ExternalLink size={11} style={{ color: '#f87171' }} />
                          : <BookOpen size={11} style={{ color: '#60a5fa' }} />
                        }
                        <span className="ws-resource__text">{res.title}</span>
                      </a>
                    )
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Notes body */}
            <div
              className="ws-panel__body"
              style={{ position: 'relative' }}
              onMouseUp={handleSelectionChange}
              onKeyUp={handleSelectionChange}
            >
              <PanelLoading show={isProcessing && !summaryText && !keyPointsList.length} />

              {!isProcessing && !summaryText && !keyPointsList.length && !notes ? (
                <EmptyState
                  icon={AlignLeft}
                  title="Your AI-generated notes will appear here"
                  subtitle="Run transcription or paste text to generate structured notes"
                />
              ) : (
                <div className="ws-notes-inner">
                  {/* Summary block */}
                  {summaryText && (
                    <motion.div
                      className="ws-summary-block"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35 }}
                    >
                      <div className="ws-summary-block__label">
                        <BookOpen size={12} /> Lecture Summary
                      </div>
                      <p className="ws-summary-block__text">{summaryText}</p>
                    </motion.div>
                  )}

                  {/* Sticky key-point notes */}
                  {keyPointsList.length > 0 && (
                    <motion.div
                      className="ws-stickies"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                    >
                      {keyPointsList.map((kp, idx) => (
                        <StickyNote
                          key={`note-${idx}`}
                          title={`Key Point ${idx + 1}`}
                          value={kp}
                          onChange={(val) => handleKeyPointChange(idx, val)}
                          colorIndex={idx + 1}
                        />
                      ))}
                    </motion.div>
                  )}

                  {/* Fallback markdown if only raw notes */}
                  {!summaryText && !keyPointsList.length && notes && (
                    <div className="prose prose-invert max-w-none" style={{ fontSize: '0.9rem' }}>
                      <MarkdownRenderer content={notes} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ──────────── Doubt Resolution Modal ──────────── */}
      <AnimatePresence>
        {showDoubtModal && (
          <motion.div
            className="ws-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowDoubtModal(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="doubt-modal-title"
          >
            <motion.div
              className="ws-modal"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            >
              {/* Modal header */}
              <div className="ws-modal__header">
                <div className="ws-modal__title" id="doubt-modal-title">
                  <div className="ws-modal__title-icon">
                    <HelpCircle size={15} />
                  </div>
                  AI Doubt Resolver
                </div>
                <button
                  className="ws-modal__close"
                  onClick={() => setShowDoubtModal(false)}
                  aria-label="Close modal"
                  id="doubt-modal-close"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Modal body */}
              <div className="ws-modal__body">
                {/* Quoted text */}
                <blockquote className="ws-doubt-quote">
                  "{selectedText}"
                </blockquote>

                {/* Answer */}
                {isExplaining ? (
                  <div className="ws-doubt-loading">
                    <div className="ws-doubt-loading__spinner" />
                    <p className="ws-doubt-loading__text">Formulating explanation…</p>
                  </div>
                ) : (
                  <div className="ws-doubt-answer">
                    <MarkdownRenderer content={doubtExplanation || 'No explanation available.'} />
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
