import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  ExternalLink,
  HelpCircle,
  Loader2,
  Menu,
  Mic,
  MoreHorizontal,
  Plus,
  RefreshCcw,
  Sparkles,
  Upload,
} from "lucide-react";

import AudioRecorder from "../components/AudioRecorder";
import MarkdownRenderer from "../components/MarkdownRenderer";
import api from "../services/api";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { Input } from "../components/ui/input";
import { Separator } from "../components/ui/separator";
import { Skeleton } from "../components/ui/skeleton";
import { Textarea } from "../components/ui/textarea";

const defaultGroups = ["Today", "Yesterday", "Previous 7 Days", "Previous 30 Days", "Older"];

const reveal = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

export default function Home() {
  const [transcript, setTranscript] = useState("");
  const [notes, setNotes] = useState("");
  const [summaryText, setSummaryText] = useState("");
  const [keyPointsList, setKeyPointsList] = useState([]);
  const [tags, setTags] = useState(null);
  const [resources, setResources] = useState([]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedText, setSelectedText] = useState("");
  const [doubtExplanation, setDoubtExplanation] = useState(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [showDoubtModal, setShowDoubtModal] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  const fileInputRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await api.get("/sessions/");
      setSessions(res.data);
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    }
  };

  const groupSessions = () => {
    const groups = defaultGroups.reduce((acc, key) => ({ ...acc, [key]: [] }), {});
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    sessions.forEach((session) => {
      const date = new Date(session.created_at);
      date.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(Math.abs(now - date) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) groups.Today.push(session);
      else if (diffDays === 1) groups.Yesterday.push(session);
      else if (diffDays <= 7) groups["Previous 7 Days"].push(session);
      else if (diffDays <= 30) groups["Previous 30 Days"].push(session);
      else groups.Older.push(session);
    });

    return Object.entries(groups).filter(([, list]) => list.length > 0);
  };

  const loadSession = (session) => {
    setTranscript(session.transcript || "");
    setNotes(session.summary || "");
    setSummaryText(session.summary || "");
    setKeyPointsList(session.key_points || []);
    setTags(session.tags || null);
    setResources(session.related_resources || []);
    setCurrentSessionId(session._id);
    setSelectedText("");
  };

  const saveSession = async (transStr, sumStr, kpArr, tagsObj, resArr) => {
    try {
      const title = tagsObj?.topic
        ? Array.isArray(tagsObj.topic)
          ? tagsObj.topic[0]
          : tagsObj.topic
        : `${transStr.split(" ").slice(0, 5).join(" ")}...`;

      const payload = {
        title: title || "Untitled Session",
        transcript: transStr,
        summary: sumStr,
        key_points: kpArr,
        tags: tagsObj || {},
        related_resources: resArr || [],
      };

      if (currentSessionId) {
        await api.put(`/sessions/${currentSessionId}`, payload);
      } else {
        const res = await api.post("/sessions/", payload);
        setCurrentSessionId(res.data._id);
      }
      fetchSessions();
    } catch (err) {
      console.error("Failed to save session:", err);
    }
  };

  const debouncedSave = (newSummary, newKeyPoints) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveSession(transcript, newSummary, newKeyPoints, tags, resources);
    }, 1200);
  };

  const handleSummaryChange = (value) => {
    setSummaryText(value);
    debouncedSave(value, keyPointsList);
  };

  const handleKeyPointChange = (index, value) => {
    const next = [...keyPointsList];
    next[index] = value;
    setKeyPointsList(next);
    debouncedSave(summaryText, next);
  };

  const deleteSession = async (id) => {
    if (!window.confirm("Delete this session?")) return;
    try {
      await api.delete(`/sessions/${id}`);
      if (currentSessionId === id) resetWorkspace(true);
      fetchSessions();
    } catch (err) {
      console.error(err);
    }
  };

  const saveRenameSession = async (id) => {
    if (!editTitle.trim()) {
      setEditingSessionId(null);
      return;
    }

    try {
      await api.put(`/sessions/${id}`, { title: editTitle });
      setEditingSessionId(null);
      fetchSessions();
    } catch (err) {
      console.error(err);
    }
  };

  const processLecture = async (text) => {
    if (!text?.trim()) return;
    setIsProcessing(true);
    setError(null);

    try {
      const res = await api.post("/ai/process-lecture", { text, context: "" });
      const data = res.data;
      setNotes(data.summary || "");
      setSummaryText(data.summary || "");
      setKeyPointsList(data.key_points || []);
      setTags(data.tags || null);

      let finalResources = data.related_resources || [];
      try {
        let optimalQuery = "educational overview";

        if (data.tags?.topic && data.tags.topic !== "Unknown") {
          optimalQuery = Array.isArray(data.tags.topic) ? data.tags.topic[0] : data.tags.topic;
          if (data.tags.subject && data.tags.subject !== "General") {
            const subject = Array.isArray(data.tags.subject) ? data.tags.subject[0] : data.tags.subject;
            optimalQuery = `${subject} ${optimalQuery}`;
          }
        } else if (data.related_resources?.length > 0) {
          optimalQuery = data.related_resources[0];
        } else if (data.key_points?.length > 0) {
          optimalQuery = data.key_points[0];
        } else if (data.summary) {
          optimalQuery = data.summary.split(".")[0].trim();
        }

        let ragRes = await api.post("/recommendations/recommend", { summary: optimalQuery });
        let recs = ragRes.data?.recommended_resources || [];

        if (recs.length === 0) {
          await api.post("/recommendations/ingest", { query: optimalQuery, max_per_source: 3 });
          ragRes = await api.post("/recommendations/recommend", { summary: optimalQuery });
          recs = ragRes.data?.recommended_resources || [];
        }

        if (recs.length > 0) finalResources = recs;
      } catch (err) {
        console.error("RAG pipeline error:", err);
      }

      setResources(finalResources);
      await saveSession(text, data.summary || "", data.key_points || [], data.tags, finalResources);
    } catch (err) {
      setError(`Processing error: ${err.response?.data?.detail || err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    resetWorkspace(true);
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("audio_file", file);

      const res = await api.post("/ai/transcribe-audio", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newTranscript = res.data?.transcription || res.data?.text || res.data?.transcript;
      if (!newTranscript || typeof newTranscript !== "string") {
        throw new Error("Server returned an empty or invalid transcription.");
      }

      setTranscript(newTranscript);
      await processLecture(newTranscript);
    } catch (err) {
      setError(`Upload failed: ${err.response?.data?.detail || err.message}`);
      setIsProcessing(false);
    }
  };

  const handleMicTranscription = async (newText) => {
    if (!currentSessionId) resetWorkspace(true);
    if (!newText?.trim()) return;
    setTranscript(newText);
    await processLecture(newText);
  };

  const handleSelectionChange = () => {
    const selection = window.getSelection();
    if (selection?.toString().trim()) setSelectedText(selection.toString().trim());
  };

  const handleDoubtNow = async () => {
    if (!selectedText) return;
    setShowDoubtModal(true);
    setIsExplaining(true);
    setDoubtExplanation(null);

    try {
      const res = await api.post("/ai/explain-doubt", { text: selectedText, context: transcript });
      setDoubtExplanation(res.data.explanation);
    } catch (err) {
      setDoubtExplanation(`Error: ${err.response?.data?.detail || err.message}`);
    } finally {
      setIsExplaining(false);
    }
  };

  const resetWorkspace = (forceNew = false) => {
    setTranscript("");
    setNotes("");
    setSummaryText("");
    setKeyPointsList([]);
    setTags(null);
    setResources([]);
    setSelectedText("");
    setError(null);
    if (forceNew) setCurrentSessionId(null);
  };

  return (
    <div className="premium-shell relative space-y-4">
      <motion.div variants={reveal} initial="hidden" animate="show">
        <Card className="glass-panel">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setIsSidebarOpen((prev) => !prev)} aria-label="Toggle sessions panel">
                <Menu className="h-4 w-4" />
              </Button>
              <div>
                <p className="text-sm font-semibold">Lecture Studio</p>
                <p className="text-xs text-muted-foreground">Capture audio, generate insights, refine knowledge.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {currentSessionId && <Badge className="rounded-full bg-cyan-500/80 text-white">Auto-saved</Badge>}
              <AudioRecorder onTranscriptionComplete={handleMicTranscription} onError={setError} />

              <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
                <Upload className="mr-2 h-4 w-4" />
                Upload audio
              </Button>

              {(transcript || notes) && (
                <Button variant="ghost" onClick={() => resetWorkspace(true)}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {error && (
        <Card className="border-destructive/40 bg-destructive/10">
          <CardContent className="p-3 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className={`grid gap-4 ${isSidebarOpen ? "xl:grid-cols-[280px_0.78fr_1.22fr]" : "xl:grid-cols-[0.9fr_1.35fr]"}`}>
        {isSidebarOpen && (
          <motion.div variants={reveal} initial="hidden" animate="show">
            <Card className="glass-panel h-[calc(100vh-14rem)] overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Sessions</CardTitle>
                  <Button size="icon" variant="ghost" onClick={() => resetWorkspace(true)} aria-label="Create session">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>Timeline grouped by recency.</CardDescription>
              </CardHeader>
              <CardContent className="custom-scrollbar h-[calc(100%-6rem)] space-y-4 overflow-y-auto">
                {sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sessions yet. Start with a live recording.</p>
                ) : (
                  groupSessions().map(([groupName, list]) => (
                    <div key={groupName} className="space-y-1.5">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">{groupName}</p>
                      {list.map((session) => (
                        <div key={session._id} className="rounded-xl border border-white/15 bg-background/40 p-1 dark:border-white/10">
                          {editingSessionId === session._id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && saveRenameSession(session._id)}
                                autoFocus
                                className="h-8"
                              />
                              <Button size="sm" onClick={() => saveRenameSession(session._id)}>
                                Save
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Button
                                variant={currentSessionId === session._id ? "secondary" : "ghost"}
                                className="h-8 flex-1 justify-start truncate rounded-lg"
                                onClick={() => loadSession(session)}
                              >
                                {session.title || "Untitled Session"}
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="glass-panel">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditingSessionId(session._id);
                                      setEditTitle(session.title || "Untitled Session");
                                    }}
                                  >
                                    Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive" onClick={() => deleteSession(session._id)}>
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div variants={reveal} initial="hidden" animate="show" transition={{ delay: 0.05 }}>
          <Card className="glass-panel h-[calc(100vh-14rem)] overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mic className="h-4 w-4 text-cyan-300" />
                Live Transcript Stream
              </CardTitle>
              <CardDescription>Primary source from recording or uploaded audio.</CardDescription>
            </CardHeader>
            <CardContent className="custom-scrollbar h-[calc(100%-6.2rem)] overflow-y-auto">
              {isProcessing && !transcript ? (
                <div className="space-y-2">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-4/5" />
                </div>
              ) : transcript ? (
                <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{transcript}</p>
              ) : (
                <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
                  Start recording or upload an audio file to generate transcript.
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={reveal} initial="hidden" animate="show" transition={{ delay: 0.1 }}>
          <Card className="glass-panel glow-ring h-[calc(100vh-12.2rem)] overflow-hidden border-cyan-300/25 dark:border-cyan-300/20">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Sparkles className="h-5 w-5 text-cyan-300" />
                    Insight Composer
                  </CardTitle>
                  <CardDescription className="text-sm">Generated summary, key points, and resources.</CardDescription>
                </div>
                {selectedText && (
                  <Button size="sm" variant="secondary" onClick={handleDoubtNow} className="rounded-full">
                    <HelpCircle className="mr-1 h-4 w-4" />
                    Doubt now
                  </Button>
                )}
              </div>

              {(tags || resources.length > 0) && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {tags?.subject && <Badge variant="outline">{Array.isArray(tags.subject) ? tags.subject.join(", ") : tags.subject}</Badge>}
                  {tags?.topic && <Badge className="bg-cyan-500/80 text-white">{Array.isArray(tags.topic) ? tags.topic.join(", ") : tags.topic}</Badge>}
                  {tags?.difficulty && <Badge className="bg-violet-500/80 text-white">{Array.isArray(tags.difficulty) ? tags.difficulty.join(", ") : tags.difficulty}</Badge>}
                </div>
              )}
            </CardHeader>

            <CardContent className="custom-scrollbar h-[calc(100%-7rem)] space-y-4 overflow-y-auto bg-gradient-to-b from-cyan-500/5 via-transparent to-violet-500/5" onMouseUp={handleSelectionChange} onKeyUp={handleSelectionChange}>
              {isProcessing && !summaryText && !keyPointsList.length ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-4/5" />
                </div>
              ) : !summaryText && !keyPointsList.length && !notes ? (
                <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
                  Your generated summary and key points will appear here.
                </div>
              ) : (
                <>
                  {summaryText && (
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Lecture summary</p>
                      <Textarea value={summaryText} onChange={(e) => handleSummaryChange(e.target.value)} className="min-h-[260px] resize-y text-sm leading-7" />
                    </div>
                  )}

                  {keyPointsList.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Key points</p>
                      {keyPointsList.map((point, index) => (
                        <Textarea key={`kp-${index}`} value={point} onChange={(e) => handleKeyPointChange(index, e.target.value)} className="min-h-[96px] resize-y" />
                      ))}
                    </div>
                  )}

                  {!summaryText && !keyPointsList.length && notes && (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <MarkdownRenderer content={notes} />
                    </div>
                  )}

                  {resources.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Recommended resources</p>
                        <div className="grid gap-2">
                          {resources.map((resource, index) =>
                            typeof resource === "string" ? (
                              <a
                                key={index}
                                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(resource)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-background/50 p-2 text-sm transition-colors hover:bg-muted/60 dark:border-white/10"
                              >
                                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                {resource}
                              </a>
                            ) : (
                              <a
                                key={index}
                                href={resource.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-background/50 p-2 text-sm transition-colors hover:bg-muted/60 dark:border-white/10"
                                title={resource.description || resource.title}
                              >
                                <BookOpen className="h-4 w-4 text-primary" />
                                {resource.title}
                              </a>
                            )
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Dialog open={showDoubtModal} onOpenChange={setShowDoubtModal}>
        <DialogContent className="glass-panel max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI Doubt Resolver</DialogTitle>
            <DialogDescription>Context-aware explanation generated from your selected text.</DialogDescription>
          </DialogHeader>

          <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            <blockquote className="rounded-xl border-l-4 border-cyan-400 bg-muted/60 p-3 text-sm italic text-muted-foreground">
              {selectedText}
            </blockquote>

            {isExplaining ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Formulating explanation...
              </div>
            ) : (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <MarkdownRenderer content={doubtExplanation || "No explanation available."} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
