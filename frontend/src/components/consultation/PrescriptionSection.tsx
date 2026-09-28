import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Pill,
  Search,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { masterDataService } from '../../services/masterDataService';
import { useToast } from '../../hooks/useToast';
import type {
  Medicine,
  MedicineFrequency,
  MedicineDosage,
  MedicineInstruction,
} from '../../types/masterData';
import type { PrescriptionItem } from '../../types/consultation';

export interface PrescriptionSectionProps {
  prescriptions: PrescriptionItem[];
  onChange: (prescriptions: PrescriptionItem[]) => void;
  errors?: Record<string, string>;
}

// Common duration presets in days
const DURATION_PRESETS = [3, 5, 7, 10, 14, 21, 30, 60, 90];

// Standard dosage options
const STANDARD_DOSAGES = [
  { value: '1 tablet', label: '1 tablet (ایک گولی)' },
  { value: '½ tablet', label: '½ tablet (آدھی گولی)' },
  { value: '¼ tablet', label: '¼ tablet (ایک چوتھائی گولی)' },
  { value: '1½ tablets', label: '1½ tablets (ڈیڑھ گولی)' },
  { value: '2 tablets', label: '2 tablets (دو گولیاں)' },
  { value: '1 capsule', label: '1 capsule (ایک کیپسول)' },
  { value: '2 capsules', label: '2 capsules (دو کیپسول)' },
  { value: '5 ml', label: '5 ml (1 چمچ شربت)' },
  { value: '10 ml', label: '10 ml (2 چمچ شربت)' },
  { value: '15 ml', label: '15 ml (3 چمچ شربت)' },
  { value: '1 drop', label: '1 drop (ایک قطرہ)' },
  { value: '2 drops', label: '2 drops (دو قطرے)' },
  { value: '2 puffs', label: '2 puffs (دو پف)' },
  { value: '1 sachet', label: '1 sachet (ایک ساشے)' },
  { value: '1 injection', label: '1 injection (ایک انجکشن)' },
];

// Standard Urdu frequency options
const STANDARD_FREQUENCIES = [
  { urdu: 'صبح و شام', english: 'Morning & Evening (BD)', value: 'صبح و شام' },
  { urdu: 'صبح، دوپہر، شام', english: 'Morning, Noon, Evening (TDS)', value: 'صبح، دوپہر، شام' },
  { urdu: 'صبح', english: 'Morning only (OD Morning)', value: 'صبح' },
  { urdu: 'شام', english: 'Evening only', value: 'شام' },
  { urdu: 'رات', english: 'Night / Bedtime (OD Night)', value: 'رات' },
  { urdu: 'دوپہر', english: 'Afternoon only', value: 'دوپہر' },
  { urdu: 'صبح و رات', english: 'Morning & Night', value: 'صبح و رات' },
  { urdu: 'دوپہر و شام', english: 'Afternoon & Evening', value: 'دوپہر و شام' },
  { urdu: 'دوپہر و رات', english: 'Afternoon & Night', value: 'دوپہر و رات' },
  { urdu: 'صبح، دوپہر، رات', english: 'Morning, Noon, Night', value: 'صبح، دوپہر، رات' },
  { urdu: 'صبح، شام، رات', english: 'Morning, Evening, Night', value: 'صبح، شام، رات' },
  { urdu: 'صبح، دوپہر، شام، رات', english: 'Four times a day (QDS)', value: 'صبح، دوپہر، شام، رات' },
  { urdu: 'روزانہ ایک بار', english: 'Once daily', value: 'روزانہ ایک بار' },
  { urdu: 'روزانہ دو بار', english: 'Twice daily', value: 'روزانہ دو بار' },
  { urdu: 'روزانہ تین بار', english: 'Three times daily', value: 'روزانہ تین بار' },
  { urdu: 'ہر 8 گھنٹے بعد', english: 'Every 8 hours', value: 'ہر 8 گھنٹے بعد' },
  { urdu: 'ہر 12 گھنٹے بعد', english: 'Every 12 hours', value: 'ہر 12 گھنٹے بعد' },
  { urdu: 'ہر 24 گھنٹے بعد', english: 'Every 24 hours', value: 'ہر 24 گھنٹے بعد' },
  { urdu: 'حسبِ ضرورت', english: 'As needed (SOS / PRN)', value: 'حسبِ ضرورت' },
];

// Standard Urdu instruction options
const STANDARD_INSTRUCTIONS = [
  { urdu: 'کھانے کے بعد', english: 'After meals', value: 'کھانے کے بعد' },
  { urdu: 'کھانے سے پہلے', english: 'Before meals', value: 'کھانے سے پہلے' },
  { urdu: 'کھانے کے ساتھ', english: 'With food / meals', value: 'کھانے کے ساتھ' },
  { urdu: 'خالی پیٹ', english: 'Empty stomach', value: 'خالی پیٹ' },
  { urdu: 'صبح نہار منہ', english: 'Morning empty stomach', value: 'صبح نہار منہ' },
  { urdu: 'سونے سے پہلے', english: 'At bedtime', value: 'سونے سے پہلے' },
  { urdu: 'صبح ناشتے کے بعد', english: 'After breakfast', value: 'صبح ناشتے کے بعد' },
  { urdu: 'رات کھانے کے بعد', english: 'After dinner', value: 'رات کھانے کے بعد' },
  { urdu: 'پانی کے ساتھ', english: 'With water', value: 'پانی کے ساتھ' },
  { urdu: 'دودھ کے ساتھ', english: 'With milk', value: 'دودھ کے ساتھ' },
  { urdu: 'درد کی صورت میں حسب ضرورت', english: 'As needed for pain', value: 'درد کی صورت میں حسب ضرورت' },
  { urdu: 'سر درد کی صورت میں حسب ضرورت', english: 'As needed for headache', value: 'سر درد کی صورت میں حسب ضرورت' },
  { urdu: 'دوا اچانک بند نہ کریں', english: 'Do not stop suddenly', value: 'دوا اچانک بند نہ کریں' },
  { urdu: 'ڈاکٹر کی ہدایت کے مطابق', english: 'As advised by doctor', value: 'ڈاکٹر کی ہدایت کے مطابق' },
];

export const PrescriptionSection: React.FC<PrescriptionSectionProps> = ({
  prescriptions,
  onChange,
  errors = {},
}) => {
  const { success } = useToast();

  // Master data lists
  const [masterMedicines, setMasterMedicines] = useState<Medicine[]>([]);
  const [masterFrequencies, setMasterFrequencies] = useState<MedicineFrequency[]>([]);
  const [masterDosages, setMasterDosages] = useState<MedicineDosage[]>([]);
  const [masterInstructions, setMasterInstructions] = useState<MedicineInstruction[]>([]);

  // Active search row index and per-row state
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
  const [searchQueries, setSearchQueries] = useState<Record<number, string>>({});
  const [customDosageModes, setCustomDosageModes] = useState<Record<number, boolean>>({});
  const [customFrequencyModes, setCustomFrequencyModes] = useState<Record<number, boolean>>({});
  const [customInstructionModes, setCustomInstructionModes] = useState<Record<number, boolean>>({});

  const searchInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const searchDropdownRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Fetch clinical master data
  const fetchMasterData = useCallback(async () => {
    try {
      const [medsRes, freqsRes, dosagesRes, instrsRes] = await Promise.all([
        masterDataService.getMedicines({ is_active: true, page_size: 300, sort_by: 'name' }),
        masterDataService.getFrequencies({ is_active: true, page_size: 100 }),
        masterDataService.getDosages({ is_active: true, page_size: 100 }),
        masterDataService.getInstructions({ is_active: true, page_size: 100 }),
      ]);
      setMasterMedicines(medsRes.items || []);
      setMasterFrequencies(freqsRes.items || []);
      setMasterDosages(dosagesRes.items || []);
      setMasterInstructions(instrsRes.items || []);
    } catch {
      // Non-blocking fallback
    }
  }, []);

  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  // Click outside to close active search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (activeSearchIndex !== null) {
        const dropdown = searchDropdownRefs.current[activeSearchIndex];
        const input = searchInputRefs.current[activeSearchIndex];
        if (
          dropdown &&
          !dropdown.contains(e.target as Node) &&
          input &&
          !input.contains(e.target as Node)
        ) {
          setActiveSearchIndex(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeSearchIndex]);

  // Add a new empty prescription item
  const handleAddMedicine = () => {
    const newItem: PrescriptionItem = {
      medicine_name: '',
      frequency_name: 'صبح و شام',
      dosage: '1 tablet',
      duration_days: 7,
      instruction_name: 'کھانے کے بعد',
      custom_instruction: null,
      sort_order: prescriptions.length,
    };
    const updated = [...prescriptions, newItem];
    onChange(updated);

    // Open search for new item and focus it
    const newIdx = updated.length - 1;
    setActiveSearchIndex(newIdx);
    setSearchQueries((prev) => ({ ...prev, [newIdx]: '' }));
    setTimeout(() => {
      searchInputRefs.current[newIdx]?.focus();
    }, 50);
  };

  // Remove a prescription item
  const handleRemoveMedicine = (index: number) => {
    const updated = prescriptions.filter((_, idx) => idx !== index);
    // Re-index sort_order
    const reordered = updated.map((item, idx) => ({ ...item, sort_order: idx }));
    onChange(reordered);
    if (activeSearchIndex === index) {
      setActiveSearchIndex(null);
    }
  };

  // Update a field in a specific prescription item
  const handleUpdateItem = (index: number, updates: Partial<PrescriptionItem>) => {
    const updated = prescriptions.map((item, idx) => {
      if (idx === index) {
        return { ...item, ...updates };
      }
      return item;
    });
    onChange(updated);
  };

  // Select a master data medicine for a specific prescription row
  const handleSelectMedicine = (index: number, med: Medicine) => {
    handleUpdateItem(index, {
      medicine_id: med.id,
      medicine_name: med.name,
    });
    setActiveSearchIndex(null);
    setSearchQueries((prev) => ({ ...prev, [index]: '' }));
  };

  // Create a new medicine on the fly and select it
  const handleCreateCustomMedicine = async (index: number, rawName: string) => {
    const trimmed = rawName.trim();
    if (!trimmed) return;

    // Duplicate check: normalized whitespace and case-insensitive
    const normalized = trimmed.toLowerCase();
    const existing = masterMedicines.find(
      (m) => m.name.trim().toLowerCase() === normalized
    );

    if (existing) {
      // Select the existing medicine without creating duplicate
      handleSelectMedicine(index, existing);
      success(`Selected existing master medicine "${existing.name}".`);
      return;
    }

    try {
      const created = await masterDataService.createItem<Medicine>('medicines', {
        name: trimmed,
        form: 'Tablet',
        is_active: true,
      });

      // Add to local master medicines list
      setMasterMedicines((prev) => [...prev, created]);
      handleSelectMedicine(index, created);
      success(`Added "${created.name}" to medicine master data and prescription.`);
    } catch {
      // If master data creation fails (e.g. offline/network), still allow selecting as custom name
      handleUpdateItem(index, {
        medicine_id: null,
        medicine_name: trimmed,
      });
      setActiveSearchIndex(null);
      setSearchQueries((prev) => ({ ...prev, [index]: '' }));
      success(`Prescribed "${trimmed}".`);
    }
  };

  // Filter medicines for active row search query
  const getFilteredMedicines = (query: string): Medicine[] => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return masterMedicines.slice(0, 15);
    }
    return masterMedicines
      .filter((m) => {
        const nameMatch = m.name.toLowerCase().includes(q);
        const genericMatch = m.generic_name
          ? m.generic_name.toLowerCase().includes(q)
          : false;
        return nameMatch || genericMatch;
      })
      .slice(0, 15);
  };

  return (
    <Card className="border-medical-200 shadow-sm overflow-hidden" id="prescription-section">
      <CardHeader className="bg-gradient-to-r from-medical-50/80 via-white to-navy-50/50 border-b border-medical-100 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-medical-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base sm:text-lg font-bold text-navy-950">
                  Prescription
                </CardTitle>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-medical-100 text-medical-800 border border-medical-200">
                  {prescriptions.length} {prescriptions.length === 1 ? 'Medicine' : 'Medicines'}
                </span>
              </div>
              <p className="text-xs text-navy-500 mt-0.5">
                Searchable medicines, local Urdu frequencies, standard dosages, and duration in days
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleAddMedicine}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-sm font-semibold shrink-0"
            id="add-medicine-btn"
          >
            + Add Medicine
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-5 bg-navy-50/20">
        {/* Prescription List */}
        {prescriptions.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-xl border-2 border-dashed border-navy-200 bg-white space-y-3">
            <div className="w-12 h-12 rounded-full bg-medical-50 text-medical-600 flex items-center justify-center mx-auto">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-navy-800">No medicines prescribed yet</h4>
              <p className="text-xs text-navy-500 max-w-md mx-auto mt-1">
                Add medicines to this consultation with doctor-friendly Urdu frequencies, flexible dosages, and treatment duration.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddMedicine}
              leftIcon={<Plus className="w-4 h-4" />}
              className="mt-2 text-medical-700 border-medical-300 hover:bg-medical-50"
            >
              Add First Medicine
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((item, index) => {
              const currentQuery = searchQueries[index] ?? '';
              const isSearchOpen = activeSearchIndex === index;
              const filteredMedicines = getFilteredMedicines(currentQuery);
              const hasExactMatch = masterMedicines.some(
                (m) => m.name.trim().toLowerCase() === currentQuery.trim().toLowerCase()
              );
              const isCustomDosage =
                customDosageModes[index] ||
                (!STANDARD_DOSAGES.some((d) => d.value === item.dosage) &&
                  !masterDosages.some((d) => d.name === item.dosage) &&
                  Boolean(item.dosage));
              const isCustomFrequency =
                customFrequencyModes[index] ||
                (!STANDARD_FREQUENCIES.some((f) => f.value === item.frequency_name) &&
                  !masterFrequencies.some(
                    (f) => f.name === item.frequency_name || f.urdu_label === item.frequency_name
                  ) &&
                  Boolean(item.frequency_name));
              const isCustomInstruction =
                customInstructionModes[index] ||
                (!STANDARD_INSTRUCTIONS.some((ins) => ins.value === item.instruction_name) &&
                  !masterInstructions.some(
                    (ins) => ins.name === item.instruction_name || ins.urdu_label === item.instruction_name
                  ) &&
                  Boolean(item.instruction_name));

              const rowErrorMedicine = errors[`prescriptions.${index}.medicine_name`];
              const rowErrorFrequency = errors[`prescriptions.${index}.frequency_name`];
              const rowErrorDosage = errors[`prescriptions.${index}.dosage`];
              const rowErrorDuration = errors[`prescriptions.${index}.duration_days`];

              return (
                <div
                  key={index}
                  className="rounded-xl border border-navy-200/90 bg-white p-4 sm:p-5 shadow-sm transition-all hover:border-medical-300 space-y-4"
                >
                  {/* Card Header: Medicine Number & Remove */}
                  <div className="flex items-center justify-between pb-3 border-b border-navy-100">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-medical-100 text-medical-800 text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-sm font-bold text-navy-950">
                        {item.medicine_name ? (
                          <span className="text-medical-800">{item.medicine_name}</span>
                        ) : (
                          <span className="text-navy-400 italic">Select Medicine</span>
                        )}
                      </span>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMedicine(index)}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 px-2 text-xs"
                      aria-label={`Remove medicine ${index + 1}`}
                      title="Remove medicine"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      <span>Remove</span>
                    </Button>
                  </div>

                  {/* Responsive Grid Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
                    {/* 1. Medicine Searchable Field (Columns: 4 on lg) */}
                    <div className="lg:col-span-4 relative space-y-1">
                      <label className="block text-xs font-semibold text-navy-700">
                        Medicine <span className="text-rose-500">*</span>
                      </label>

                      {item.medicine_name && !isSearchOpen ? (
                        <div className="flex items-center justify-between p-2.5 rounded-lg border border-medical-200 bg-medical-50/50 text-xs text-navy-900">
                          <div className="flex items-center gap-2 min-w-0">
                            <Pill className="w-4 h-4 text-medical-600 shrink-0" />
                            <span className="font-bold truncate">{item.medicine_name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSearchIndex(index);
                              setSearchQueries((prev) => ({
                                ...prev,
                                [index]: item.medicine_name,
                              }));
                              setTimeout(() => {
                                searchInputRefs.current[index]?.focus();
                              }, 50);
                            }}
                            className="text-xs text-medical-700 hover:text-medical-800 font-semibold underline shrink-0 ml-2"
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="relative">
                            <input
                              ref={(el) => {
                                searchInputRefs.current[index] = el;
                              }}
                              type="text"
                              value={currentQuery}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSearchQueries((prev) => ({ ...prev, [index]: val }));
                                setActiveSearchIndex(index);
                              }}
                              onFocus={() => {
                                setActiveSearchIndex(index);
                                if (!currentQuery && item.medicine_name) {
                                  setSearchQueries((prev) => ({
                                    ...prev,
                                    [index]: item.medicine_name,
                                  }));
                                }
                              }}
                              placeholder="Search medicine (e.g. Gabapentin)..."
                              className={`w-full rounded-lg border pl-8 pr-3 py-2 text-xs focus:ring-2 focus:ring-medical-500 focus:outline-none transition-colors ${
                                rowErrorMedicine
                                  ? 'border-rose-400 bg-rose-50/30'
                                  : 'border-navy-200 hover:border-navy-300'
                              }`}
                            />
                            <Search className="w-4 h-4 text-navy-400 absolute left-2.5 top-2.5" />
                          </div>

                          {/* Search Dropdown */}
                          {isSearchOpen && (
                            <div
                              ref={(el) => {
                                searchDropdownRefs.current[index] = el;
                              }}
                              className="absolute z-30 left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-xl border border-navy-200 bg-white shadow-xl text-xs py-1"
                            >
                              {filteredMedicines.length > 0 ? (
                                <>
                                  <div className="px-3 py-1.5 text-[11px] font-semibold text-navy-400 uppercase tracking-wider bg-navy-50/60 border-b border-navy-100">
                                    Available Medicines
                                  </div>
                                  {filteredMedicines.map((med) => (
                                    <button
                                      key={med.id}
                                      type="button"
                                      onClick={() => handleSelectMedicine(index, med)}
                                      className="w-full text-left px-3 py-2 hover:bg-medical-50 flex items-center justify-between border-b border-navy-50 last:border-0 transition-colors"
                                    >
                                      <div>
                                        <div className="font-semibold text-navy-900">
                                          {med.name}
                                        </div>
                                        {(med.generic_name || med.strength || med.form) && (
                                          <div className="text-[11px] text-navy-500">
                                            {med.generic_name && <span>{med.generic_name} • </span>}
                                            {med.strength && <span>{med.strength} • </span>}
                                            <span>{med.form}</span>
                                          </div>
                                        )}
                                      </div>
                                      {item.medicine_id === med.id && (
                                        <Check className="w-4 h-4 text-medical-600" />
                                      )}
                                    </button>
                                  ))}
                                </>
                              ) : (
                                <div className="p-3 text-center text-navy-500">
                                  No medicine found for "{currentQuery}".
                                </div>
                              )}

                              {/* Manual Add Medicine Option */}
                              {currentQuery.trim() && !hasExactMatch && (
                                <div className="p-2 border-t border-navy-100 bg-medical-50/40">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCreateCustomMedicine(index, currentQuery)
                                    }
                                    className="w-full py-1.5 px-3 rounded-lg bg-medical-600 hover:bg-medical-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>+ Add "{currentQuery.trim()}" to Master Data</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {rowErrorMedicine && (
                        <p className="text-[11px] text-rose-600 flex items-center gap-1 mt-0.5">
                          <AlertCircle className="w-3 h-3" />
                          {rowErrorMedicine}
                        </p>
                      )}
                    </div>

                    {/* 2. Frequency with Urdu Options (Columns: 3 on lg) */}
                    <div className="lg:col-span-3 space-y-1">
                      <label className="block text-xs font-semibold text-navy-700">
                        Frequency (تعدد) <span className="text-rose-500">*</span>
                      </label>

                      {isCustomFrequency ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={item.frequency_name}
                              onChange={(e) =>
                                handleUpdateItem(index, { frequency_name: e.target.value })
                              }
                              placeholder="Enter custom frequency..."
                              className="w-full rounded-lg border border-navy-200 px-3 py-2 text-xs focus:ring-2 focus:ring-medical-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setCustomFrequencyModes((prev) => ({ ...prev, [index]: false }));
                                handleUpdateItem(index, { frequency_name: 'صبح و شام' });
                              }}
                              className="text-[11px] text-navy-500 hover:text-navy-700 underline px-1 shrink-0"
                              title="Back to standard frequency list"
                            >
                              Standard
                            </button>
                          </div>
                        </div>
                      ) : (
                        <select
                          value={item.frequency_name}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '__custom__') {
                              setCustomFrequencyModes((prev) => ({ ...prev, [index]: true }));
                              handleUpdateItem(index, { frequency_name: '' });
                            } else {
                              handleUpdateItem(index, { frequency_name: val });
                            }
                          }}
                          className={`w-full rounded-lg border px-3 py-2 text-xs focus:ring-2 focus:ring-medical-500 focus:outline-none bg-white font-medium ${
                            rowErrorFrequency
                              ? 'border-rose-400 bg-rose-50/30'
                              : 'border-navy-200 hover:border-navy-300'
                          }`}
                        >
                          <optgroup label="Urdu Frequencies (اردو)">
                            {STANDARD_FREQUENCIES.map((freq) => (
                              <option key={freq.value} value={freq.value}>
                                {freq.urdu} — {freq.english}
                              </option>
                            ))}
                          </optgroup>
                          {masterFrequencies.length > 0 && (
                            <optgroup label="Master Data Frequencies">
                              {masterFrequencies.map((f) => (
                                <option key={f.id} value={f.urdu_label || f.name}>
                                  {f.urdu_label ? `${f.urdu_label} (${f.name})` : f.name}
                                </option>
                              ))}
                            </optgroup>
                          )}
                          <option value="__custom__">+ Custom Frequency...</option>
                        </select>
                      )}

                      {rowErrorFrequency && (
                        <p className="text-[11px] text-rose-600 flex items-center gap-1 mt-0.5">
                          <AlertCircle className="w-3 h-3" />
                          {rowErrorFrequency}
                        </p>
                      )}
                    </div>

                    {/* 3. Dosage (Columns: 2 on lg) */}
                    <div className="lg:col-span-2 space-y-1">
                      <label className="block text-xs font-semibold text-navy-700">
                        Dosage (مقدار خوراک) <span className="text-rose-500">*</span>
                      </label>

                      {isCustomDosage ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={item.dosage}
                              onChange={(e) =>
                                handleUpdateItem(index, { dosage: e.target.value })
                              }
                              placeholder="e.g. 250 mg"
                              className="w-full rounded-lg border border-navy-200 px-3 py-2 text-xs focus:ring-2 focus:ring-medical-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setCustomDosageModes((prev) => ({ ...prev, [index]: false }));
                                handleUpdateItem(index, { dosage: '1 tablet' });
                              }}
                              className="text-[11px] text-navy-500 hover:text-navy-700 underline px-1 shrink-0"
                              title="Back to standard dosages"
                            >
                              Standard
                            </button>
                          </div>
                        </div>
                      ) : (
                        <select
                          value={item.dosage}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '__custom__') {
                              setCustomDosageModes((prev) => ({ ...prev, [index]: true }));
                              handleUpdateItem(index, { dosage: '' });
                            } else {
                              handleUpdateItem(index, { dosage: val });
                            }
                          }}
                          className={`w-full rounded-lg border px-3 py-2 text-xs focus:ring-2 focus:ring-medical-500 focus:outline-none bg-white font-medium ${
                            rowErrorDosage
                              ? 'border-rose-400 bg-rose-50/30'
                              : 'border-navy-200 hover:border-navy-300'
                          }`}
                        >
                          <optgroup label="Standard Dosages">
                            {STANDARD_DOSAGES.map((d) => (
                              <option key={d.value} value={d.value}>
                                {d.label}
                              </option>
                            ))}
                          </optgroup>
                          {masterDosages.length > 0 && (
                            <optgroup label="Master Data Dosages">
                              {masterDosages.map((d) => (
                                <option key={d.id} value={d.name}>
                                  {d.name} {d.urdu_label ? `(${d.urdu_label})` : ''}
                                </option>
                              ))}
                            </optgroup>
                          )}
                          <option value="__custom__">+ Custom Dosage...</option>
                        </select>
                      )}

                      {rowErrorDosage && (
                        <p className="text-[11px] text-rose-600 flex items-center gap-1 mt-0.5">
                          <AlertCircle className="w-3 h-3" />
                          {rowErrorDosage}
                        </p>
                      )}
                    </div>

                    {/* 4. Duration (Columns: 3 on lg) */}
                    <div className="lg:col-span-3 space-y-1">
                      <label className="block text-xs font-semibold text-navy-700">
                        Duration (مدت) <span className="text-rose-500">*</span>
                      </label>

                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            min="1"
                            max="365"
                            value={item.duration_days || ''}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              handleUpdateItem(index, {
                                duration_days: isNaN(val) ? 0 : val,
                              });
                            }}
                            className={`w-full rounded-lg border px-3 py-2 text-xs focus:ring-2 focus:ring-medical-500 focus:outline-none ${
                              rowErrorDuration
                                ? 'border-rose-400 bg-rose-50/30'
                                : 'border-navy-200 hover:border-navy-300'
                            }`}
                          />
                        </div>
                        <span className="text-xs text-navy-500 font-semibold shrink-0">days</span>
                      </div>

                      {/* Quick Duration Preset Pills */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {DURATION_PRESETS.map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => handleUpdateItem(index, { duration_days: d })}
                            className={`px-1.5 py-0.5 text-[10px] font-semibold rounded transition-colors ${
                              item.duration_days === d
                                ? 'bg-medical-600 text-white shadow-xs'
                                : 'bg-navy-100/80 text-navy-700 hover:bg-navy-200'
                            }`}
                          >
                            {d}d
                          </button>
                        ))}
                      </div>

                      {rowErrorDuration && (
                        <p className="text-[11px] text-rose-600 flex items-center gap-1 mt-0.5">
                          <AlertCircle className="w-3 h-3" />
                          {rowErrorDuration}
                        </p>
                      )}
                    </div>

                    {/* 5. Instructions (Urdu / Doctor Notes) (Full width across 12 cols) */}
                    <div className="lg:col-span-12 space-y-1 pt-1 border-t border-navy-50">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-navy-700">
                          Instructions (ہدایات)
                        </label>
                        {!isCustomInstruction && (
                          <button
                            type="button"
                            onClick={() =>
                              setCustomInstructionModes((prev) => ({ ...prev, [index]: true }))
                            }
                            className="text-[11px] text-medical-700 hover:text-medical-800 underline font-semibold"
                          >
                            + Custom note / instructions
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <select
                          value={item.instruction_name || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '__custom__') {
                              setCustomInstructionModes((prev) => ({ ...prev, [index]: true }));
                            } else {
                              handleUpdateItem(index, { instruction_name: val });
                            }
                          }}
                          className="w-full rounded-lg border border-navy-200 hover:border-navy-300 px-3 py-2 text-xs focus:ring-2 focus:ring-medical-500 focus:outline-none bg-white font-medium"
                        >
                          <option value="">No special instruction (اختیاری)</option>
                          <optgroup label="Urdu Instructions (اردو ہدایات)">
                            {STANDARD_INSTRUCTIONS.map((ins) => (
                              <option key={ins.value} value={ins.value}>
                                {ins.urdu} ({ins.english})
                              </option>
                            ))}
                          </optgroup>
                          {masterInstructions.length > 0 && (
                            <optgroup label="Master Data Instructions">
                              {masterInstructions.map((ins) => (
                                <option key={ins.id} value={ins.urdu_label || ins.name}>
                                  {ins.urdu_label ? `${ins.urdu_label} (${ins.name})` : ins.name}
                                </option>
                              ))}
                            </optgroup>
                          )}
                          <option value="__custom__">+ Custom Instruction...</option>
                        </select>

                        {(isCustomInstruction || item.custom_instruction) && (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={item.custom_instruction || ''}
                              onChange={(e) =>
                                handleUpdateItem(index, { custom_instruction: e.target.value })
                              }
                              placeholder="Additional instructions / خصوصی ہدایات..."
                              className="w-full rounded-lg border border-navy-200 px-3 py-2 text-xs focus:ring-2 focus:ring-medical-500 focus:outline-none"
                            />
                            {isCustomInstruction && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomInstructionModes((prev) => ({
                                    ...prev,
                                    [index]: false,
                                  }));
                                  handleUpdateItem(index, { custom_instruction: null });
                                }}
                                className="text-[11px] text-navy-400 hover:text-navy-600 px-1 shrink-0"
                                title="Hide custom input"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Another Medicine Button */}
        {prescriptions.length > 0 && (
          <div className="flex justify-start pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddMedicine}
              leftIcon={<Plus className="w-4 h-4 text-medical-600" />}
              className="border-medical-300 text-medical-700 hover:bg-medical-50 font-semibold"
            >
              + Add Another Medicine
            </Button>
          </div>
        )}

        {/* On-Screen Clinical Prescription Preview */}
        {prescriptions.length > 0 && (
          <div className="mt-6 rounded-xl border border-medical-200 bg-gradient-to-br from-medical-50/40 via-white to-navy-50/30 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-medical-100 pb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-medical-700" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900">
                  Prescription Summary Preview
                </h4>
              </div>
              <span className="text-[11px] text-navy-500 font-medium">
                On-screen summary • PDF printing in Phase 8
              </span>
            </div>

            <ol className="divide-y divide-navy-100 text-xs text-navy-800 space-y-2">
              {prescriptions.map((item, idx) => (
                <li key={idx} className="pt-2 first:pt-0 flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-navy-950 font-mono">
                        {idx + 1}. {item.medicine_name || '(Unnamed Medicine)'}
                      </span>
                      <span className="font-medium px-2 py-0.5 rounded bg-white border border-navy-200 text-navy-700 text-[11px]">
                        {item.dosage || '1 tablet'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-navy-600">
                      <span className="font-semibold text-medical-800" dir="rtl">
                        تعدد: {item.frequency_name || 'صبح و شام'}
                      </span>
                      <span className="text-navy-300">•</span>
                      <span>
                        مدت: <strong className="text-navy-900">{item.duration_days || 7} days</strong>
                      </span>
                      {item.instruction_name && (
                        <>
                          <span className="text-navy-300">•</span>
                          <span className="text-navy-700" dir="rtl">
                            ہدایت: {item.instruction_name}
                          </span>
                        </>
                      )}
                      {item.custom_instruction && (
                        <>
                          <span className="text-navy-300">•</span>
                          <span className="italic text-navy-600">
                            "{item.custom_instruction}"
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
