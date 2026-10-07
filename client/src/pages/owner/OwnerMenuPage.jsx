// client/src/pages/owner/OwnerMenuPage.jsx
import { useState, useEffect, useCallback } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Search,
  Sparkles,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  RefreshCw,
  Tag,
  Check,
  X,
  Clock,
} from 'lucide-react';
import { ownerService } from '../../services/ownerService';
import { menuService } from '../../services/menuService';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';
import LoadingState from '../../components/common/LoadingState';
import toast from 'react-hot-toast';

export default function OwnerMenuPage() {
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    name: '',
    categoryId: '',
    price: '',
    isVegetarian: true,
    description: '',
    preparationTimeMins: 15,
  });
  const [saving, setSaving] = useState(false);

  const fetchMenu = useCallback(async () => {
    try {
      setLoading(true);
      const rest = await ownerService.getRestaurant();
      setRestaurant(rest);
      const menuData = await menuService.getMenu(rest.id);
      setMenu(menuData.data);
    } catch (err) {
      console.error('Failed to load menu', err);
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const categories = menu?.categories || [];
  const allItems = menu?.allItems || [];

  const filteredItems = allItems.filter((item) => {
    if (activeCategory !== 'All' && String(item.category_id) !== String(activeCategory)) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleToggle = async (item) => {
    try {
      await menuService.toggleAvailability(item.id);
      const nextStatus = !item.is_available;
      toast.success(`${item.name} is now ${nextStatus ? 'AVAILABLE' : 'UNAVAILABLE (86ed)'}`);
      setMenu((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          allItems: prev.allItems.map((i) =>
            i.id === item.id ? { ...i, is_available: nextStatus ? 1 : 0 } : i
          ),
          categories: prev.categories.map((c) => ({
            ...c,
            items: c.items.map((i) =>
              i.id === item.id ? { ...i, is_available: nextStatus ? 1 : 0 } : i
            ),
          })),
        };
      });
    } catch (err) {
      toast.error('Failed to toggle item availability');
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm({
      name: '',
      categoryId: categories[0]?.id || '',
      price: '',
      isVegetarian: true,
      description: '',
      preparationTimeMins: 15,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      categoryId: item.category_id,
      price: item.price,
      isVegetarian: Boolean(item.is_vegetarian),
      description: item.description || '',
      preparationTimeMins: item.preparation_time_mins || 15,
    });
    setModalOpen(true);
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      setSaving(true);
      await menuService.createCategory({ name: newCatName.trim() });
      toast.success(`Category "${newCatName.trim()}" created`);
      setNewCatName('');
      setCatModalOpen(false);
      fetchMenu();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to create category');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price || !form.categoryId) {
      toast.error('Please provide name, category, and price');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        categoryId: Number(form.categoryId),
        price: Number(form.price),
        isVegetarian: Boolean(form.isVegetarian),
        description: form.description.trim(),
        preparationTimeMins: Number(form.preparationTimeMins) || 15,
      };

      if (editingItem) {
        await menuService.updateItem(editingItem.id, payload);
        toast.success(`Updated ${form.name}`);
      } else {
        await menuService.createItem(payload);
        toast.success(`Added ${form.name} to menu`);
      }

      setModalOpen(false);
      fetchMenu();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to save menu item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to remove "${item.name}" from your menu?`)) return;
    try {
      await menuService.deleteItem(item.id);
      toast.success(`Removed ${item.name}`);
      fetchMenu();
    } catch (err) {
      toast.error('Failed to delete menu item');
    }
  };

  return (
    <div className="animate-fade-in space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title={`Menu Management ${restaurant?.name ? `• ${restaurant.name}` : ''}`}
        subtitle="Manage food items, pricing, veg/non-veg tags, and live availability for customers."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="btn-primary text-xs py-2 px-3 inline-flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Add Menu Item</span>
            </button>
            <button
              type="button"
              onClick={() => setCatModalOpen(true)}
              className="btn-outline text-xs py-2 px-3 inline-flex items-center gap-1.5"
            >
              <Tag size={13} />
              <span>Add Category</span>
            </button>
            <button
              type="button"
              onClick={fetchMenu}
              disabled={loading}
              className="btn-outline text-xs py-2 px-3 inline-flex items-center gap-1.5"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {/* Search and Filters */}
      <div className="card p-4 border border-surface-border space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search menu items by name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 text-xs w-full"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
          <button
            type="button"
            onClick={() => setActiveCategory('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === 'All'
                ? 'bg-brand text-surface-bg'
                : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
            }`}
          >
            All Items ({allItems.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCategory(String(c.id))}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === String(c.id)
                  ? 'bg-brand text-surface-bg'
                  : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
              }`}
            >
              {c.name} ({c.items?.length || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items Grid */}
      {loading ? (
        <LoadingState message="Loading restaurant menu..." />
      ) : filteredItems.length === 0 ? (
        <div className="card p-12 text-center text-text-muted text-sm border border-surface-border">
          No menu items found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`card p-4 border border-surface-border space-y-3 flex flex-col justify-between transition-all ${
                !item.is_available ? 'opacity-60 bg-surface-card/60' : ''
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-3.5 h-3.5 border flex items-center justify-center rounded-sm ${
                          item.is_vegetarian
                            ? 'border-emerald-500'
                            : 'border-rose-500'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            item.is_vegetarian ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                      </span>
                      <h3 className="font-bold text-sm text-text-primary">{item.name}</h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-text-muted font-mono uppercase bg-surface-elevated px-1.5 py-0.5 rounded">
                        {item.category_name}
                      </span>
                      {item.preparation_time_mins && (
                        <span className="text-[10px] text-text-muted font-mono flex items-center gap-0.5 bg-surface-elevated px-1.5 py-0.5 rounded">
                          <Clock size={10} />
                          {item.preparation_time_mins}m
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="font-mono font-bold text-base text-brand">
                    ₹{item.price}
                  </span>
                </div>

                {item.description && (
                  <p className="text-xs text-text-secondary line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Actions & Live Toggle */}
              <div className="pt-3 border-t border-surface-border/50 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleToggle(item)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold border transition-all inline-flex items-center gap-1.5 ${
                    item.is_available
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${item.is_available ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  <span>{item.is_available ? 'Available' : 'Unavailable'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 rounded-lg bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors"
                    title="Edit item"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="p-1.5 rounded-lg bg-surface-elevated text-text-secondary hover:text-rose-400 transition-colors"
                    title="Delete item"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Item Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary">Item Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Butter Naan, Paneer Tikka"
                className="input text-xs w-full"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Category</label>
                <select
                  required
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="input text-xs w-full"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Price (₹)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="249"
                  className="input text-xs w-full font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Prep (mins)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="180"
                  value={form.preparationTimeMins}
                  onChange={(e) => setForm({ ...form, preparationTimeMins: e.target.value })}
                  placeholder="15"
                  className="input text-xs w-full font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isVegCheck"
                checked={form.isVegetarian}
                onChange={(e) => setForm({ ...form, isVegetarian: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-500 bg-surface-elevated border-surface-border"
              />
              <label htmlFor="isVegCheck" className="text-xs font-medium text-text-primary">
                Vegetarian Item
              </label>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary">Description</label>
              <textarea
                rows="3"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Fresh ingredients, tender and cooked in clay oven..."
                className="input text-xs w-full"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="btn-outline text-xs py-2 px-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary text-xs py-2 px-4"
              >
                {saving ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Category Modal */}
      {catModalOpen && (
        <Modal
          isOpen={catModalOpen}
          onClose={() => setCatModalOpen(false)}
          title="Create New Menu Category"
        >
          <form onSubmit={handleCreateCategory} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary">Category Name</label>
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Clay Oven Starters, Traditional Rice"
                className="input text-xs w-full"
              />
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCatModalOpen(false)}
                className="btn-outline text-xs py-2 px-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary text-xs py-2 px-4"
              >
                {saving ? 'Creating...' : 'Create Category'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
