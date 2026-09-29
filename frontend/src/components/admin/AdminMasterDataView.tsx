import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Power,
  PowerOff,
  Filter,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { PageHeader } from '../ui/PageHeader';
import { EmptyState } from '../ui/EmptyState';
import { SkeletonTable } from '../ui/LoadingSkeleton';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import { useToast } from '../../hooks/useToast';
import { adminService } from '../../services/adminService';
import type {
  MasterDataCategoryKey,
  MasterDataItem,
  MasterDataQueryParams,
} from '../../types/masterData';

interface AdminMasterDataViewProps {
  categoryKey: MasterDataCategoryKey;
  title: string;
  subtitle: string;
  itemNameSingular: string;
  categoriesList?: string[];
  hasUrduLabel?: boolean;
  hasCategory?: boolean;
  hasItemName?: boolean;
  hasStrengthAndForm?: boolean;
  hasRomanUrdu?: boolean;
}

export const AdminMasterDataView: React.FC<AdminMasterDataViewProps> = ({
  categoryKey,
  title,
  subtitle,
  itemNameSingular,
  categoriesList = [],
  hasUrduLabel = false,
  hasCategory = false,
  hasItemName = false,
  hasStrengthAndForm = false,
  hasRomanUrdu = false,
}) => {
  const { success, error: toastError } = useToast();

  const [items, setItems] = useState<MasterDataItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterDataItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form input states
  const [formData, setFormData] = useState({
    name: '',
    urdu_label: '',
    roman_urdu: '',
    category: '',
    item_name: '',
    generic_name: '',
    strength: '',
    form: 'Tablet',
    description: '',
    sort_order: 0,
  });

  // Status toggle confirmation
  const [statusConfirmItem, setStatusConfirmItem] = useState<MasterDataItem | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Fetch Items from Admin API
  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const activeParam =
        statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : null;

      const params: MasterDataQueryParams = {
        search: searchQuery,
        category: selectedSubCategory !== 'all' ? selectedSubCategory : undefined,
        is_active: activeParam,
        page_size: 500,
        sort_by: hasCategory ? 'category' : 'sort_order',
        sort_order: 'asc',
      };

      const response = await adminService.getItems<MasterDataItem>(categoryKey, params);
      setItems(response.items || []);
      setTotalCount(response.total || 0);
    } catch {
      toastError(`Failed to load ${title.toLowerCase()}`);
    } finally {
      setIsLoading(false);
    }
  }, [categoryKey, searchQuery, statusFilter, selectedSubCategory, hasCategory, title, toastError]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Dynamically extract categories from items if list is not fixed
  const dynamicCategories = useMemo(() => {
    if (categoriesList.length > 0) return categoriesList;
    const catSet = new Set<string>();
    items.forEach((it) => {
      const anyIt = it as unknown as Record<string, unknown>;
      if (anyIt.category && typeof anyIt.category === 'string') {
        catSet.add(anyIt.category);
      }
    });
    return Array.from(catSet).sort();
  }, [items, categoriesList]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      urdu_label: '',
      roman_urdu: '',
      category: dynamicCategories[0] || 'General',
      item_name: '',
      generic_name: '',
      strength: '',
      form: 'Tablet',
      description: '',
      sort_order: (items.length + 1) * 1,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: MasterDataItem) => {
    const anyIt = item as unknown as Record<string, unknown>;
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      urdu_label: typeof anyIt.urdu_label === 'string' ? anyIt.urdu_label : '',
      roman_urdu: typeof anyIt.roman_urdu === 'string' ? anyIt.roman_urdu : '',
      category: typeof anyIt.category === 'string' ? anyIt.category : 'General',
      item_name: typeof anyIt.item_name === 'string' ? anyIt.item_name : '',
      generic_name: typeof anyIt.generic_name === 'string' ? anyIt.generic_name : '',
      strength: typeof anyIt.strength === 'string' ? anyIt.strength : '',
      form: typeof anyIt.form === 'string' ? anyIt.form : 'Tablet',
      description: item.description || '',
      sort_order: item.sort_order ?? 0,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Save (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Option name cannot be empty.');
      return;
    }
    if (hasUrduLabel && !formData.urdu_label.trim()) {
      setFormError('Urdu label is required for prescription formatting.');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    const payload: Record<string, unknown> = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      sort_order: Number(formData.sort_order) || 0,
    };

    if (hasCategory) payload.category = formData.category.trim();
    if (hasItemName) payload.item_name = formData.item_name.trim() || null;
    if (hasUrduLabel) payload.urdu_label = formData.urdu_label.trim();
    if (hasRomanUrdu) payload.roman_urdu = formData.roman_urdu.trim() || null;
    if (hasStrengthAndForm) {
      payload.generic_name = formData.generic_name.trim() || null;
      payload.strength = formData.strength.trim() || null;
      payload.form = formData.form.trim();
    }

    try {
      if (editingItem) {
        await adminService.updateItem(categoryKey, editingItem.id, payload);
        success(`"${formData.name}" updated successfully.`);
      } else {
        await adminService.createItem(categoryKey, payload);
        success(`"${formData.name}" added successfully.`);
      }
      setIsModalOpen(false);
      fetchItems();
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ||
        'Failed to save option. Please check for duplicate names.';
      setFormError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Status Toggle
  const handleToggleStatus = async () => {
    if (!statusConfirmItem) return;
    setIsTogglingStatus(true);
    try {
      const newStatus = !statusConfirmItem.is_active;
      await adminService.setItemStatus(categoryKey, statusConfirmItem.id, newStatus);
      success(
        `"${statusConfirmItem.name}" has been ${newStatus ? 'activated' : 'deactivated'}.`
      );
      setStatusConfirmItem(null);
      fetchItems();
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message || 'Failed to update status.';
      toastError(msg);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title={title}
        description={subtitle}
        actions={
          <Button
            variant="primary"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add {itemNameSingular}</span>
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${title.toLowerCase()}...`}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50/80 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Sub-Category Filter if applicable */}
        {hasCategory && dynamicCategories.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedSubCategory}
              onChange={(e) => setSelectedSubCategory(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">All Categories</option>
              {dynamicCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Active/Inactive Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusFilter === 'active'
                ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active Only
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusFilter === 'inactive'
                ? 'bg-white text-slate-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Master Data Table */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <SkeletonTable rows={8} columns={4} />
          </div>
        ) : items.length === 0 ? (
          <div className="p-10">
            <EmptyState
              title={`No ${title.toLowerCase()} found`}
              description={
                searchQuery
                  ? `No matching items found for "${searchQuery}". Try adjusting your search or filter.`
                  : `No ${title.toLowerCase()} configured yet. Click the button below to add your first option.`
              }
              action={
                <Button variant="primary" onClick={handleOpenAdd} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add {itemNameSingular}
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Name / Label</th>
                  {hasUrduLabel && <th className="py-3 px-4 text-right">Urdu Translation</th>}
                  {hasCategory && <th className="py-3 px-4">Category</th>}
                  {hasItemName && <th className="py-3 px-4">Item / Examination Area</th>}
                  {hasStrengthAndForm && <th className="py-3 px-4">Generic & Form</th>}
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const anyIt = item as unknown as Record<string, unknown>;
                  const urdu = typeof anyIt.urdu_label === 'string' ? anyIt.urdu_label : null;
                  const cat = typeof anyIt.category === 'string' ? anyIt.category : null;
                  const itName = typeof anyIt.item_name === 'string' ? anyIt.item_name : null;
                  const genName = typeof anyIt.generic_name === 'string' ? anyIt.generic_name : null;
                  const formVal = typeof anyIt.form === 'string' ? anyIt.form : null;
                  const strengthVal = typeof anyIt.strength === 'string' ? anyIt.strength : null;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        !item.is_active ? 'bg-slate-50/40 text-slate-400' : ''
                      }`}
                    >
                      {/* Name & Description */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <span>{item.name}</span>
                          {typeof anyIt.roman_urdu === 'string' && anyIt.roman_urdu ? (
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({anyIt.roman_urdu})
                            </span>
                          ) : null}
                        </div>
                        {item.description && (
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">
                            {item.description}
                          </p>
                        )}
                      </td>

                      {/* Urdu Label with RTL */}
                      {hasUrduLabel && (
                        <td className="py-3 px-4 text-right">
                          {urdu ? (
                            <span
                              className="font-bold text-sm text-slate-800 font-urdu inline-block px-2 py-0.5 rounded bg-emerald-50/80 border border-emerald-100 text-right"
                              dir="rtl"
                            >
                              {urdu}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      )}

                      {/* Category */}
                      {hasCategory && (
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                            <Tag className="w-2.5 h-2.5 text-slate-400" />
                            {cat || 'General'}
                          </span>
                        </td>
                      )}

                      {/* Item Name */}
                      {hasItemName && (
                        <td className="py-3 px-4 font-medium text-slate-600">
                          {itName || 'General'}
                        </td>
                      )}

                      {/* Generic & Strength & Form */}
                      {hasStrengthAndForm && (
                        <td className="py-3 px-4">
                          <div className="text-slate-700 font-medium">
                            {genName || 'Generic'} {strengthVal ? `• ${strengthVal}` : ''}
                          </div>
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-medium">
                            {formVal || 'Tablet'}
                          </span>
                        </td>
                      )}

                      {/* Status Badge */}
                      <td className="py-3 px-4">
                        {item.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 h-auto text-slate-600 hover:text-slate-900 border-slate-200"
                            title="Edit Option"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setStatusConfirmItem(item)}
                            className={`p-1.5 h-auto border-slate-200 ${
                              item.is_active
                                ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50'
                                : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                            }`}
                            title={item.is_active ? 'Deactivate Option' : 'Activate Option'}
                          >
                            {item.is_active ? (
                              <PowerOff className="w-3.5 h-3.5" />
                            ) : (
                              <Power className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add / Edit Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem ? `Edit ${itemNameSingular}` : `Add New ${itemNameSingular}`}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Name Input */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">
                  {itemNameSingular} Name (English / Code) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={`e.g. ${itemNameSingular} name`}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Urdu Label if applicable */}
              {hasUrduLabel && (
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 flex items-center justify-between">
                    <span>Urdu Label (اردو نام / ہدایت) *</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Printed on prescription
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    dir="rtl"
                    value={formData.urdu_label}
                    onChange={(e) => setFormData({ ...formData, urdu_label: e.target.value })}
                    placeholder="اردو میں لکھیں"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-urdu text-base text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Roman Urdu if applicable */}
              {hasRomanUrdu && (
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    Roman Urdu (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.roman_urdu}
                    onChange={(e) => setFormData({ ...formData, roman_urdu: e.target.value })}
                    placeholder="e.g. Subah aur Sham"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Category selector if applicable */}
              {hasCategory && (
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Category *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      list="category-suggestions"
                      placeholder="Category name"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <datalist id="category-suggestions">
                      {dynamicCategories.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>
                </div>
              )}

              {/* Examination Item Name if applicable */}
              {hasItemName && (
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    Examination Area / Limb / Nerve
                  </label>
                  <input
                    type="text"
                    value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                    placeholder="e.g. Right Upper Limb, Biceps Reflex, General Tone"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Medicine specific fields: Generic Name, Strength, Form */}
              {hasStrengthAndForm && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-semibold text-slate-700">Generic Active Ingredient</label>
                    <input
                      type="text"
                      value={formData.generic_name}
                      onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                      placeholder="e.g. Levetiracetam"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Strength</label>
                    <input
                      type="text"
                      value={formData.strength}
                      onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                      placeholder="e.g. 500mg"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-3">
                    <label className="font-semibold text-slate-700">Form *</label>
                    <select
                      value={formData.form}
                      onChange={(e) => setFormData({ ...formData, form: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                      <option value="Tablet">Tablet</option>
                      <option value="Capsule">Capsule</option>
                      <option value="Syrup">Syrup</option>
                      <option value="Injection">Injection</option>
                      <option value="Drops">Drops</option>
                      <option value="Inhaler">Inhaler</option>
                      <option value="Suspension">Suspension</option>
                      <option value="Cream">Cream / Ointment</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Description / Clinical notes */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Description / Clinical Notes</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional explanatory note"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-24"
                >
                  {isSaving ? 'Saving...' : editingItem ? 'Save Changes' : `Add ${itemNameSingular}`}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Status Toggle */}
      <ConfirmationDialog
        isOpen={Boolean(statusConfirmItem)}
        title={statusConfirmItem?.is_active ? `Deactivate "${statusConfirmItem?.name}"?` : `Activate "${statusConfirmItem?.name}"?`}
        message={
          statusConfirmItem?.is_active
            ? `This option will no longer appear in new doctor consultations. Historical consultations that already used this option will remain completely intact and unchanged.`
            : `This option will be restored and become visible in new doctor consultation dropdowns.`
        }
        confirmLabel={statusConfirmItem?.is_active ? 'Deactivate Option' : 'Activate Option'}
        isDestructive={Boolean(statusConfirmItem?.is_active)}
        isLoading={isTogglingStatus}
        onConfirm={handleToggleStatus}
        onClose={() => setStatusConfirmItem(null)}
      />
    </div>
  );
};
