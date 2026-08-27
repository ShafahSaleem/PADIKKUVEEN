import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const PRESET_ICONS = ['🟨', '🟧', '🟫', '🟩', '⚛️', '🔴', '⚙️', '🐍', '☕', '🦀', '🌐', '📚', '🤖', '🔒'];

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📚',
    enabled: true,
  });
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories?all=true');
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      icon: '📚',
      enabled: true,
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      description: cat.description || '',
      icon: cat.icon || '📚',
      enabled: cat.enabled !== false,
    });
    setModalOpen(true);
  };

  const handleToggleStatus = async (cat) => {
    try {
      const updatedStatus = !cat.enabled;
      await api.put(`/categories/${cat._id}`, { enabled: updatedStatus });
      setCategories((prev) =>
        prev.map((c) => (c._id === cat._id ? { ...c, enabled: updatedStatus } : c))
      );
      toast.success(`Category ${updatedStatus ? 'enabled' : 'disabled'}`);
    } catch (err) {
      console.error('Failed to toggle category status:', err);
      toast.error(err.response?.data?.message || 'Failed to update category status');
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      return;
    }
    try {
      await api.delete(`/categories/${cat._id}`);
      setCategories((prev) => prev.filter((c) => c._id !== cat._id));
      toast.success('Category deleted successfully');
    } catch (err) {
      console.error('Failed to delete category:', err);
      const msg =
        err.response?.data?.message ||
        'This category contains exams. Please move or remove those exams before deleting the category.';
      toast.error(msg, { duration: 5000 });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setSaving(true);
    try {
      if (editingCategory) {
        const res = await api.put(`/categories/${editingCategory._id}`, formData);
        setCategories((prev) =>
          prev.map((c) => (c._id === editingCategory._id ? res.data.category : c))
        );
        toast.success('Category updated successfully');
      } else {
        const res = await api.post('/categories', formData);
        setCategories((prev) => [...prev, res.data.category]);
        toast.success('Category created successfully');
      }
      setModalOpen(false);
    } catch (err) {
      console.error('Failed to save category:', err);
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 bg-[#EEF3FB] min-h-[calc(100vh-4rem)] space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1B3A6B]/30">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0A1628]">
            Manage Exam Categories
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            Organize subjects and control exam categorizations available to students
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin-dashboard"
            className="px-4 py-2.5 bg-white hover:bg-[#EEF3FB] text-[#0A1628] text-xs font-bold rounded-xl border border-[#1B3A6B]/20 transition-colors"
          >
            ← Admin Dashboard
          </Link>
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 bg-gradient-to-r from-[#0F2044] to-[#1B3A6B] hover:from-[#0A1628] hover:to-[#0F2044] text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5"
          >
            <span>➕</span> Add Category
          </button>
        </div>
      </div>

      {/* Categories Table Card */}
      <div className="bg-white border border-[#1B3A6B]/20 rounded-3xl p-6 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-gray-500">
            <div className="w-12 h-12 border-4 border-[#1B3A6B] border-t-[#4A9EE8] rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm font-semibold text-[#1B3A6B]">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <h3 className="text-lg font-bold text-[#0A1628]">No Categories Found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Create your first subject category to organize examination topics.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-[#1B3A6B] text-white text-xs font-bold rounded-xl shadow hover:bg-[#0F2044] transition-colors"
            >
              + Create Category
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-left text-sm">
              <thead className="bg-[#EEF3FB] text-[#0A1628] font-bold uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-5 py-3.5 rounded-l-xl">Category</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[#0A1628]">
                {categories.map((cat) => (
                  <tr key={cat._id} className="hover:bg-[#EEF3FB]/60 transition-colors">
                    <td className="px-5 py-4 font-bold">
                      <p className="text-sm font-extrabold text-[#0A1628]">{cat.name}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            cat.enabled
                              ? 'bg-[#D6E4F7] text-[#1B3A6B] border border-[#1B3A6B]/30'
                              : 'bg-gray-100 text-gray-500 border border-gray-200'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              cat.enabled ? 'bg-[#1B3A6B]' : 'bg-gray-400'
                            }`}
                          ></span>
                        {cat.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleToggleStatus(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                          cat.enabled
                            ? 'bg-[#EEF3FB] hover:bg-[#D6E4F7] text-[#1B3A6B] border border-[#1B3A6B]/20'
                            : 'bg-green-50 hover:bg-green-100 text-[#2E7D32] border border-green-200'
                        }`}
                      >
                        {cat.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(cat)}
                        className="px-3 py-1.5 bg-[#EEF3FB] hover:bg-[#D6E4F7] text-[#1B3A6B] rounded-xl text-xs font-bold transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-[#C62828] rounded-xl text-xs font-bold transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#1B3A6B]/20 max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 text-[#0A1628]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-xl font-extrabold text-[#0A1628]">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Python"
                  required
                  className="w-full px-4 py-3 bg-white border border-[#1B3A6B]/30 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4A9EE8]"
                />
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-[#EEF3FB] border border-[#1B3A6B]/20 rounded-2xl">
                <div>
                  <p className="text-xs font-bold text-[#0A1628]">Active Status</p>
                  <p className="text-[11px] text-gray-500">Allow students to see and filter exams by this category</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B3A6B]"></div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#0F2044] to-[#1B3A6B] hover:from-[#0A1628] hover:to-[#0F2044] text-white font-bold rounded-xl text-xs shadow transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingCategory ? 'Update Category' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
