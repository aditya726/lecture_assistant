import { useState, useEffect } from 'react';
import api from '../services/api';
import { FileText, Plus, Trash2, Edit, Save, X } from 'lucide-react';

export default function Texts() {
  const [texts, setTexts] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

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
        alert('Text updated successfully');
      } else {
        await api.post('/texts/', { title, content });
        alert('Text created successfully');
      }
      setTitle('');
      setContent('');
      setEditingId(null);
      fetchTexts();
    } catch (error) {
      alert(error.response?.data?.detail || 'Operation failed');
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
      alert('Text deleted successfully');
      fetchTexts();
    } catch (error) {
      alert('Failed to delete text');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Text Documents</h1>
        <p className="text-gray-600">Create and manage your text documents</p>
      </div>

      {/* Create/Edit Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          {editingId ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {editingId ? 'Edit Text' : 'Create New Text'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter content..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
              required
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {loading ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Texts Grid */}
      {texts.length === 0 ? (
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No texts yet</p>
          <p className="text-gray-400 text-sm">Create your first text document above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {texts.map((text) => (
            <div key={text._id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="mb-3">
                <div className="flex items-start gap-2 mb-1">
                  <FileText className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <h3 className="font-semibold text-gray-900 break-words">{text.title}</h3>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(text.created_at).toLocaleString()}
                </p>
              </div>
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">{text.content}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(text)}
                  className="flex-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center justify-center gap-1"
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(text._id)}
                  className="flex-1 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
