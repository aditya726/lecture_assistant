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
      } catch {}
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

  const noteColors = ['note-yellow','note-blue','note-green','note-purple']
  const noteRotations = ['note-rotate-1','note-rotate-2','note-rotate-3','note-rotate-4','note-rotate-5']

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 fridge-bg rounded-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{fontFamily:'Schoolbell'}}>Sticky Notes</h1>
        <p className="text-gray-700">Pin your ideas like fridge notes</p>
        <div className="mt-4 flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes..."
            className="sketchy-input w-full max-w-md px-4 py-2 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* Create/Edit Form */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <GlassCard className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            {editingId ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {editingId ? 'Edit Text' : 'Create New Text'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title..."
                className="sketchy-input w-full px-4 py-2 rounded-lg border border-white/15 bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter content..."
                className="sketchy-input w-full px-4 py-2 rounded-lg border border-white/15 bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/40 h-32"
                required
              />
              {editingId && (
                <div className="mt-2 text-xs text-white/70">
                  {savedTick ? 'Autosaved' : 'Autosave active'}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="sketchy-button px-4 py-2 rounded-xl bg-white/90 text-gray-900 hover:bg-white disabled:opacity-50 flex items-center gap-2"
              >
                {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {loading ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="sketchy-button px-4 py-2 rounded-xl border border-white/15 bg-white/10 text-white hover:bg-white/15 flex items-center gap-2"
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
        <div className="p-12 text-center">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg">No notes yet</p>
          <p className="text-sm text-muted-foreground">Create your first sticky note above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTexts.map((text, idx) => {
            const color = noteColors[idx % noteColors.length]
            const rot = noteRotations[idx % noteRotations.length]
            return (
              <div key={text._id} className={`${rot}`}>
                <div className={`sticky-note ${color}`}>
                  <div className="note-tape" />
                  <div className="mb-2" style={{fontFamily:'Gloria Hallelujah'}}>
                    <div className="flex items-start gap-2 mb-1">
                      <FileText className="w-5 h-5 opacity-70 mt-0.5 flex-shrink-0" />
                      <h3 className="font-semibold break-words">{text.title}</h3>
                    </div>
                    <p className="text-xs opacity-70">
                      {new Date(text.created_at).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm mb-4 line-clamp-6" style={{fontFamily:'Schoolbell'}}>{text.content}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(text)}
                      className="sketchy-button px-3 py-1.5 text-sm rounded-xl border bg-white/50 text-foreground hover:bg-white"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(text._id)}
                      className="sketchy-button px-3 py-1.5 text-sm rounded-xl bg-red-500/70 text-white hover:bg-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}
