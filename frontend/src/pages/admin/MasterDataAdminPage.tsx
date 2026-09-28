import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Activity,
  UserCheck,
  Stethoscope,
  FlaskConical,
  Pill,
  Clock,
  Scale,
  FileCheck,
  CalendarClock,
  Search,
  Plus,
  Edit2,
  Power,
  Filter,
  CheckCircle2,
  XCircle,
  ShieldAlert,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonTable } from '../../components/ui/LoadingSkeleton';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { MasterDataAdminModal } from '../../components/clinical/MasterDataAdminModal';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { masterDataService } from '../../services/masterDataService';
import type { MasterDataCategoryKey, MasterDataItem } from '../../types/masterData';

interface CategoryTab {
  key: MasterDataCategoryKey;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const CATEGORY_TABS: CategoryTab[] = [
  {
    key: 'symptoms',
    label: 'Symptoms',
    shortLabel: 'Symptoms',
    icon: Activity,
    description: 'Neurological symptoms and clinical presentations for consultations.',
  },
  {
    key: 'patient-states',
    label: 'Patient States / Conditions',
    shortLabel: 'States',
    icon: UserCheck,
    description: 'Clinical state descriptors (Stable, Improving, Acute, Post-operative, etc.).',
  },
  {
    key: 'neurological-examinations',
    label: 'Neurological Examination Options',
    shortLabel: 'Neuro Exam',
    icon: Stethoscope,
    description: 'Motor, tone, MRC 0-5 strength, reflexes, cranial nerves, sensory & signs.',
  },
  {
    key: 'diagnostic-tests',
    label: 'Diagnostic Tests',
    shortLabel: 'Diagnostics',
    icon: FlaskConical,
    description: 'Laboratory blood tests, imaging (MRI/CT), neurophysiology, and cardiology.',
  },
  {
    key: 'medicines',
    label: 'Medicines Catalog',
    shortLabel: 'Medicines',
    icon: Pill,
    description: 'Formulary items with generic names, strengths, and dosage forms.',
  },
  {
    key: 'frequencies',
    label: 'Medicine Frequencies',
    shortLabel: 'Frequencies',
    icon: Clock,
    description: 'Prescription frequencies with local Urdu & Roman Urdu terminology.',
  },
  {
    key: 'dosages',
    label: 'Dosage Options',
    shortLabel: 'Dosages',
    icon: Scale,
    description: 'Prescription dosage values and fractions (¼, ½, 1, ایک، آدھی).',
  },
  {
    key: 'instructions',
    label: 'Medicine Instructions',
    shortLabel: 'Instructions',
    icon: FileCheck,
    description: 'Prescription administration directions in Urdu (کھانے کے بعد، خالی پیٹ).',
  },
  {
    key: 'follow-ups',
    label: 'Follow-Up Options',
    shortLabel: 'Follow-ups',
    icon: CalendarClock,
    description: 'Standard clinical recall durations (1 ہفتے بعد، 1 ماہ بعد).',
  },
];

export const MasterDataAdminPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const canManage = user?.role === 'ADMIN' || user?.role === 'DOCTOR';

  const categoryFromUrl = (searchParams.get('category') as MasterDataCategoryKey) || 'symptoms';
  const initialCategory = CATEGORY_TABS.some((t) => t.key === categoryFromUrl)
    ? categoryFromUrl
    : 'symptoms';

  const [activeCategory, setActiveCategory] = useState<MasterDataCategoryKey>(initialCategory);
  const [items, setItems] = useState<MasterDataItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [subCategoryFilter, setSubCategoryFilter] = useState('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MasterDataItem | null>(null);

  // Status toggle confirmation
  const [statusConfirmItem, setStatusConfirmItem] = useState<MasterDataItem | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Fetch items
  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const activeParam =
        statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : null;

      const response = await masterDataService.getItems<MasterDataItem>(activeCategory, {
        search: searchQuery,
        category: subCategoryFilter !== 'all' ? subCategoryFilter : undefined,
        is_active: activeParam,
        page_size: 300,
        sort_by: 'sort_order',
        sort_order: 'asc',
      });

      setItems(response.items || []);
      setTotalCount(response.total || 0);
    } catch {
      toastError('Failed to load clinical master data');
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, searchQuery, statusFilter, subCategoryFilter, toastError]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Reset filters when switching category
  const handleCategoryChange = (key: MasterDataCategoryKey) => {
    setActiveCategory(key);
    setSearchParams({ category: key });
    setSearchQuery('');
    setStatusFilter('all');
    setSubCategoryFilter('all');
  };

  // Sub-categories list for current category
  const availableSubCategories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => {
      const anyIt = it as unknown as Record<string, unknown>;
      if (anyIt.category && typeof anyIt.category === 'string') {
        set.add(anyIt.category);
      }
    });
    return Array.from(set).sort();
  }, [items]);

  const activeTabMeta = useMemo(
    () => CATEGORY_TABS.find((t) => t.key === activeCategory) || CATEGORY_TABS[0],
    [activeCategory]
  );

  // Handle open create/edit modal
  const handleOpenAdd = () => {
    if (!canManage) return;
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MasterDataItem) => {
    if (!canManage) return;
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  // Status toggle (Deactivate / Activate)
  const handleToggleStatus = async () => {
    if (!canManage || !statusConfirmItem) return;
    setIsTogglingStatus(true);
    try {
      const newStatus = !statusConfirmItem.is_active;
      await masterDataService.setItemStatus(activeCategory, statusConfirmItem.id, newStatus);
      success(
        `Option "${statusConfirmItem.name}" has been ${newStatus ? 'activated' : 'deactivated'}`
      );
      setStatusConfirmItem(null);
      fetchItems();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Failed to change status';
      toastError(msg);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Clinical Master Data & Dropdowns"
        description="Centralized catalog of clinical options, symptoms, neurological examination findings, diagnostic tests, and prescriptions."
        actions={
          canManage ? (
            <Button
              variant="primary"
              onClick={handleOpenAdd}
              className="flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add {activeTabMeta.shortLabel} Option</span>
            </Button>
          ) : undefined
        }
      />

      {/* Read-only warning for staff */}
      {!canManage && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            <strong>Read-only access:</strong> You are browsing clinical master data. Adding and editing clinical options is reserved for Doctors and Administrators.
          </span>
        </div>
      )}

      {/* 9 Category Navigation Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1.5 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeCategory === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleCategoryChange(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm ring-1 ring-teal-600'
                    : 'text-navy-700 hover:text-teal-700 hover:bg-slate-100/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Overview Card & Filters */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-teal-50 text-teal-700 rounded-lg">
                <activeTabMeta.icon className="w-5 h-5" />
              </span>
              <div>
                <CardTitle className="text-base text-navy-900">{activeTabMeta.label}</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">{activeTabMeta.description}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-navy-900 bg-slate-100 px-2 py-1 rounded-md">
              {totalCount} Total Options
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Controls Bar: Search, Status Filter, SubCategory Filter */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTabMeta.shortLabel.toLowerCase()}...`}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50/60 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:bg-white focus:ring-1 focus:ring-teal-500 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* SubCategory Filter (if items have category) */}
              {availableSubCategories.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={subCategoryFilter}
                    onChange={(e) => setSubCategoryFilter(e.target.value)}
                    aria-label="Filter by Sub-Category"
                    className="text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 text-navy-800"
                  >
                    <option value="all">All Sub-Categories</option>
                    {availableSubCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status Segmented Buttons */}
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                {(['all', 'active', 'inactive'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                      statusFilter === st
                        ? 'bg-white text-navy-900 shadow-sm font-semibold'
                        : 'text-slate-600 hover:text-navy-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Master Data Items Content */}
          {isLoading ? (
            <div className="py-4">
              <SkeletonTable rows={6} columns={5} />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title={`No ${activeTabMeta.shortLabel} Options Found`}
              description={
                searchQuery
                  ? `No matching options for "${searchQuery}". You can add it as a new clinical option.`
                  : `No clinical master options found in this category.`
              }
              action={
                canManage ? (
                  <Button variant="primary" onClick={handleOpenAdd} className="mt-2 text-xs">
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add New {activeTabMeta.shortLabel}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/80 text-navy-700 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4">Option Name</th>
                      <th className="py-3 px-4">Clinical Category / Specifics</th>
                      <th className="py-3 px-4 text-center">Sort Order</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {items.map((item, idx) => {
                      const anyItem = item as unknown as Record<string, unknown>;
                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50/70 transition-colors ${
                            !item.is_active ? 'bg-slate-50/40 opacity-70' : ''
                          }`}
                        >
                          <td className="py-3 px-4 text-center text-xs text-slate-400 font-mono">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 font-medium text-navy-900">
                            <div className="flex flex-col">
                              <span>{item.name}</span>
                              {item.description && (
                                <span className="text-xs text-slate-400 font-normal mt-0.5 line-clamp-1">
                                  {item.description}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-600">
                            {/* Category Specific Badges */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              {anyItem.category ? (
                                <span className="px-2 py-0.5 bg-sky-50 text-sky-800 rounded font-medium border border-sky-100">
                                  {String(anyItem.category)}
                                </span>
                              ) : null}
                              {anyItem.item_name ? (
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 rounded font-medium border border-indigo-100">
                                  {String(anyItem.item_name)}
                                </span>
                              ) : null}
                              {anyItem.generic_name ? (
                                <span className="text-slate-500 italic">
                                  Generic: {String(anyItem.generic_name)}
                                </span>
                              ) : null}
                              {anyItem.strength ? (
                                <span className="px-1.5 py-0.5 bg-slate-100 text-navy-700 rounded font-mono text-[11px]">
                                  {String(anyItem.strength)}
                                </span>
                              ) : null}
                              {anyItem.form ? (
                                <span className="px-1.5 py-0.5 bg-teal-50 text-teal-800 rounded text-[11px]">
                                  {String(anyItem.form)}
                                </span>
                              ) : null}
                              {anyItem.urdu_label ? (
                                <span
                                  dir="rtl"
                                  className="px-2 py-0.5 bg-amber-50 text-amber-900 font-bold rounded border border-amber-100 font-urdu text-sm"
                                >
                                  {String(anyItem.urdu_label)}
                                </span>
                              ) : null}
                              {anyItem.roman_urdu ? (
                                <span className="text-slate-400 text-[11px]">
                                  ({String(anyItem.roman_urdu)})
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-xs text-slate-500">
                            {item.sort_order}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {item.is_active ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                                <XCircle className="w-3 h-3 text-slate-400" />
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {canManage ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleOpenEdit(item)}
                                  className="h-8 px-2.5 text-xs text-navy-700 hover:text-teal-700 hover:bg-teal-50"
                                >
                                  <Edit2 className="w-3.5 h-3.5 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setStatusConfirmItem(item)}
                                  className={`h-8 px-2.5 text-xs ${
                                    item.is_active
                                      ? 'text-rose-600 hover:bg-rose-50'
                                      : 'text-teal-600 hover:bg-teal-50'
                                  }`}
                                >
                                  <Power className="w-3.5 h-3.5 mr-1" />
                                  {item.is_active ? 'Deactivate' : 'Activate'}
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">View only</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="block md:hidden space-y-3">
                {items.map((item) => {
                  const anyItem = item as unknown as Record<string, unknown>;
                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border border-slate-200 bg-white space-y-2.5 shadow-sm ${
                        !item.is_active ? 'opacity-75 bg-slate-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-sm text-navy-900">{item.name}</h4>
                          {item.description && (
                            <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                          )}
                        </div>
                        {item.is_active ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                            Inactive
                          </span>
                        )}
                      </div>

                      {/* Detail tags */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        {anyItem.category ? (
                          <span className="px-2 py-0.5 bg-sky-50 text-sky-800 rounded font-medium">
                            {String(anyItem.category)}
                          </span>
                        ) : null}
                        {anyItem.item_name ? (
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 rounded font-medium">
                            {String(anyItem.item_name)}
                          </span>
                        ) : null}
                        {anyItem.strength ? (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-navy-700 rounded font-mono">
                            {String(anyItem.strength)}
                          </span>
                        ) : null}
                        {anyItem.form ? (
                          <span className="px-1.5 py-0.5 bg-teal-50 text-teal-800 rounded">
                            {String(anyItem.form)}
                          </span>
                        ) : null}
                        {anyItem.urdu_label ? (
                          <span
                            dir="rtl"
                            className="px-2 py-0.5 bg-amber-50 text-amber-900 font-bold rounded"
                          >
                            {String(anyItem.urdu_label)}
                          </span>
                        ) : null}
                        <span className="text-[11px] text-slate-400 ml-auto">
                          Order: {item.sort_order}
                        </span>
                      </div>

                      {/* Actions */}
                      {canManage && (
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleOpenEdit(item)}
                            className="h-8 text-xs flex-1"
                          >
                            <Edit2 className="w-3.5 h-3.5 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant={item.is_active ? 'destructive' : 'primary'}
                            onClick={() => setStatusConfirmItem(item)}
                            className="h-8 text-xs flex-1"
                          >
                            <Power className="w-3.5 h-3.5 mr-1" />
                            {item.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Admin Add/Edit Modal */}
      <MasterDataAdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categoryKey={activeCategory}
        editItem={selectedItem}
        onSaved={() => fetchItems()}
      />

      {/* Confirmation Dialog for Soft Deactivation / Activation */}
      <ConfirmationDialog
        isOpen={!!statusConfirmItem}
        title={statusConfirmItem?.is_active ? 'Deactivate Clinical Option' : 'Activate Clinical Option'}
        message={
          statusConfirmItem?.is_active
            ? `Are you sure you want to deactivate "${statusConfirmItem?.name}"? It will no longer appear in new consultations, but historical consultations will preserve this clinical record.`
            : `Are you sure you want to activate "${statusConfirmItem?.name}"? It will become immediately available in new consultations.`
        }
        confirmLabel={statusConfirmItem?.is_active ? 'Deactivate Option' : 'Activate Option'}
        isDestructive={!!statusConfirmItem?.is_active}
        isLoading={isTogglingStatus}
        onConfirm={handleToggleStatus}
        onClose={() => setStatusConfirmItem(null)}
      />
    </div>
  );
};
