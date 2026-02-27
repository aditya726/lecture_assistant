import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { FileText, Plus, Trash2, Edit, Save, X } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import { motion } from 'framer-motion';
import { useToast } from '../components/ui/toast';

export default function Texts() {
  const [texts, setTexts] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [savedTick, setSavedTick] = useState(false);
  const saveTimerRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTexts();
  }, []);

  const fetchTexts = async () => {
    try {
      const response = await api.get('/texts/');
      setTexts(response.data);
    } catch (error) {
      alert('Failed to fetch texts');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        await api.put(`/texts/${editingId}`, { title, content });
        toast({ title: 'Saved', description: 'Text updated successfully' });
      } else {
        await api.post('/texts/', { title, content });
        toast({ title: 'Saved', description: 'Text created successfully' });
      }
      setTitle('');
      setContent('');
      setEditingId(null);
      fetchTexts();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Operation failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (text) => {
    setEditingId(text._id);
    setTitle(text.title);
    setContent(text.content);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this text?')) return;
    try {
      await api.delete(`/texts/${id}`);
      toast({ title: 'Deleted', description: 'Text deleted successfully' });
      fetchTexts();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete text', variant: 'destructive' });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
  };

  // Draft autosave to localStorage and gentle backend autosave after pause
  useEffect(() => {
    // Restore draft when entering component
    const draftKey = editingId ? `draft:text:${editingId}` : 'draft:text:new';
    const draft = localStorage.getItem(draftKey);
    if (draft) {
      try {
        const data = JSON.parse(draft);
        if (!editingId) {
          setTitle((t) => (t ? t : data.title || ''));
          setContent((c) => (c ? c : data.content || ''));
        }
      } catch { }
    }
  }, [editingId]);

  useEffect(() => {
    const draftKey = editingId ? `draft:text:${editingId}` : 'draft:text:new';
    localStorage.setItem(draftKey, JSON.stringify({ title, content }));

    // Debounced backend autosave when editing existing note
    if (editingId) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        try {
          await api.put(`/texts/${editingId}`, { title, content });
          setSavedTick(true);
          setTimeout(() => setSavedTick(false), 1200);
        } catch (e) {
          // silent fail; user can manually save
        }
      }, 1200);
    }

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [title, content, editingId]);

  const filteredTexts = texts.filter(t => {
    const q = query.toLowerCase();
    return !q || t.title?.toLowerCase().includes(q) || t.content?.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 rounded-3xl relative">
      {/* Background glow for the notes section */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 to-accent/5 rounded-3xl" />

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          Saved Texts
        </h1>
        <p className="text-muted-foreground mt-1.5 font-medium">Manage your extracted text clips and personal notes</p>
        <div className="mt-6 flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes..."
            className="modern-input w-full max-w-md px-4 py-2.5 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm"
          />
        </div>
      </div>

      {/* Create/Edit Form */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <GlassCard className="p-6 mb-10 modern-glass border border-white/20 bg-card/60">
          <h2 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              {editingId ? <Edit className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-primary" />}
            </div>
            {editingId ? 'Edit Text' : 'Create New Text'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground/80 mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title..."
                className="modern-input w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground/80 mb-2">Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter content..."
                className="modern-input custom-scrollbar w-full px-4 py-3 rounded-xl border border-border bg-background/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 h-32 resize-none shadow-sm"
                required
              />
              {editingId && (
                <div className="mt-2 text-xs font-medium text-muted-foreground">
                  {savedTick ? 'Autosaved ✅' : 'Autosave active...'}
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="modern-button px-5 py-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 font-semibold shadow-md"
              >
                {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {loading ? 'Saving...' : editingId ? 'Update Note' : 'Create Note'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="modern-button px-5 py-2.5 rounded-full border border-border bg-background text-foreground hover:bg-muted flex items-center gap-2 font-semibold shadow-sm"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              )}
            </div>
          </form>
        </GlassCard>
      </motion.div>

      {/* Texts Grid */}
      {texts.length === 0 ? (
        <div className="p-16 text-center border-2 border-dashed border-border/60 rounded-3xl bg-card/30">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-xl font-bold text-foreground/70">No notes yet</p>
          <p className="text-sm mt-2 text-muted-foreground">Create your first note above to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTexts.map((text) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              key={text._id}
              className="modern-glass rounded-2xl p-5 flex flex-col h-64 border border-border/50 hover:shadow-lg transition-all duration-300"
            >
              <div className="mb-3 border-b border-border/50 pb-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5">
                    <FileText className="w-4 h-4 flex-shrink-0" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[16px] text-foreground line-clamp-1">{text.title}</h3>
                    <p className="text-[11px] font-medium text-muted-foreground mt-1 uppercase tracking-wider">
                      {new Date(text.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-[14px] text-foreground/80 leading-relaxed mb-4 line-clamp-5 flex-1 break-words">
                {text.content}
              </p>
              <div className="flex items-center gap-2 pt-3 border-t border-border/30 mt-auto">
                <button
                  onClick={() => handleEdit(text)}
                  className="modern-button flex-1 py-2 text-[13px] font-semibold rounded-xl bg-secondary/80 text-secondary-foreground hover:bg-secondary transition-colors flex justify-center items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(text._id)}
                  className="modern-button flex-1 py-2 text-[13px] font-semibold rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors flex justify-center items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
