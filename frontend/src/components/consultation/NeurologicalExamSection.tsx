import React, { useState } from 'react';
import {
  Brain,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ChevronsDownUp,
  ChevronsUpDown,
  Zap,
  Activity,
  Compass,
  Move,
  Smile,
  Eye,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { ClinicalSelect } from '../clinical/ClinicalSelect';
import { cn } from '../../utils/cn';
import type { ConsultationExamination } from '../../types/consultation';

export interface NeurologicalExamSectionProps {
  examinations: ConsultationExamination[];
  onChangeExaminations: (exams: ConsultationExamination[]) => void;
  powerText: string;
  onChangePowerText: (power: string) => void;
}

export const NeurologicalExamSection: React.FC<NeurologicalExamSectionProps> = ({
  examinations,
  onChangeExaminations,
  powerText,
  onChangePowerText,
}) => {
  const [isSectionOpen, setIsSectionOpen] = useState(true);

  // 6 Structured Groups (Section 10)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    motor: true,
    reflexes: true,
    cranial: false,
    coordination_gait: false,
    sensory: false,
    mental_higher: false,
  });

  const toggleGroup = (groupKey: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const expandAll = () => {
    setOpenGroups({
      motor: true,
      reflexes: true,
      cranial: true,
      coordination_gait: true,
      sensory: true,
      mental_higher: true,
    });
  };

  const collapseAll = () => {
    setOpenGroups({
      motor: false,
      reflexes: false,
      cranial: false,
      coordination_gait: false,
      sensory: false,
      mental_higher: false,
    });
  };

  // Helper to find an exam item or return a default empty item
  const getItem = (category: string, itemName: string): ConsultationExamination => {
    const found = examinations.find(
      (e) =>
        e.category.toLowerCase() === category.toLowerCase() &&
        e.item_name.toLowerCase() === itemName.toLowerCase()
    );
    return found || {
      category,
      item_name: itemName,
      status: 'Done',
      finding: '',
      observation: '',
    };
  };

  // Helper to update an exam item
  const updateItem = (
    category: string,
    itemName: string,
    updates: Partial<ConsultationExamination>
  ) => {
    const existingIndex = examinations.findIndex(
      (e) =>
        e.category.toLowerCase() === category.toLowerCase() &&
        e.item_name.toLowerCase() === itemName.toLowerCase()
    );

    if (existingIndex >= 0) {
      const updated = [...examinations];
      updated[existingIndex] = {
        ...updated[existingIndex],
        ...updates,
      };
      onChangeExaminations(updated);
    } else {
      const newItem: ConsultationExamination = {
        category,
        item_name: itemName,
        status: 'Done',
        finding: '',
        observation: '',
        ...updates,
      };
      onChangeExaminations([...examinations, newItem]);
    }
  };

  // Predefined MRC muscle strength grades
  const strengthGrades = [
    { value: '5/5', label: '5/5 — Normal power' },
    { value: '4/5', label: '4/5 — Active movement against resistance' },
    { value: '3/5', label: '3/5 — Active movement against gravity' },
    { value: '2/5', label: '2/5 — Movement with gravity eliminated' },
    { value: '1/5', label: '1/5 — Trace flicker or muscle contraction' },
    { value: '0/5', label: '0/5 — Complete paralysis (no contraction)' },
  ];

  // Helper to render an examination row with Status [Done / Not Done], finding dropdown, and optional observation
  const renderExamRow = (
    category: string,
    itemName: string,
    label: string,
    optionsConfig: {
      useMasterData?: boolean;
      masterCategory?: string;
      masterItemName?: string;
      staticOptions?: { value: string; label: string }[];
      placeholder?: string;
    }
  ) => {
    const current = getItem(category, itemName);
    const isDone = current.status === 'Done';

    return (
      <div className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-slate-300 dark:hover:border-slate-700 transition-colors space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <span>{label}</span>
          </div>

          {/* Assessment Status Toggle */}
          <div className="flex items-center gap-1 self-start sm:self-auto bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => updateItem(category, itemName, { status: 'Done' })}
              className={cn(
                'px-2 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1',
                isDone
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Done</span>
            </button>
            <button
              type="button"
              onClick={() =>
                updateItem(category, itemName, { status: 'Not Done', finding: '' })
              }
              className={cn(
                'px-2 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1',
                !isDone
                  ? 'bg-slate-700 dark:bg-slate-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              <XCircle className="w-3 h-3" />
              <span>Not Done</span>
            </button>
          </div>
        </div>

        {/* Clinical Finding & Notes: only enabled when Done */}
        {isDone ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Finding Dropdown */}
            <div>
              {optionsConfig.useMasterData ? (
                <ClinicalSelect
                  categoryKey="neurological-examinations"
                  categoryFilter={optionsConfig.masterCategory}
                  itemNameFilter={optionsConfig.masterItemName}
                  placeholder={optionsConfig.placeholder || 'Select finding...'}
                  value={current.finding ?? ''}
                  onChange={(val, item) =>
                    updateItem(category, itemName, {
                      finding: val,
                      finding_id: item?.id ?? null,
                    })
                  }
                  allowAddNew={true}
                />
              ) : (
                <Select
                  id={`select-${category}-${itemName}`}
                  placeholder={optionsConfig.placeholder || 'Select finding...'}
                  value={current.finding ?? ''}
                  onChange={(e) => updateItem(category, itemName, { finding: e.target.value })}
                  options={optionsConfig.staticOptions || []}
                />
              )}
            </div>

            {/* Optional Observation Notes */}
            <div>
              <Input
                placeholder="Optional observation / notes..."
                value={current.observation ?? ''}
                onChange={(e) => updateItem(category, itemName, { observation: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>
        ) : (
          <div className="py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-400 dark:text-slate-500 italic">
            Examination marked as Not Done. No clinical finding documented.
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              Neurological Examination
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Structured clinical examination organized into 6 logical clinical systems
            </p>
          </div>
        </div>

        {/* Global Expand / Collapse All buttons & Section Toggle */}
        <div className="flex items-center gap-2">
          {isSectionOpen && (
            <>
              <button
                type="button"
                onClick={expandAll}
                className="text-xs font-semibold text-primary-700 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-950/50 border border-primary-200/80 dark:border-primary-800/80 transition-colors"
              >
                <ChevronsUpDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Expand All</span>
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <ChevronsDownUp className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Collapse All</span>
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setIsSectionOpen((prev) => !prev)}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label={isSectionOpen ? "Collapse Neurological Examination" : "Expand Neurological Examination"}
          >
            <ChevronDown className={cn("w-5 h-5 transition-transform duration-200", isSectionOpen && "rotate-180")} />
          </button>
        </div>
      </CardHeader>

      {isSectionOpen && (
        <CardContent className="p-4 sm:p-6 space-y-4 animate-in fade-in duration-150">
        {/* ─── GROUP 1: Motor Examination (Section 10) ─── */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={() => toggleGroup('motor')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/70 transition-colors"
          >
            <div className="flex items-center gap-2.5 font-bold text-sm text-slate-900 dark:text-slate-100">
              <Zap className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span>1. Motor Examination</span>
              <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                (Power, Motor Functions, Tone, Strength, SLR)
              </span>
            </div>
            {openGroups.motor ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {openGroups.motor && (
            <div className="p-4 pt-0 space-y-3.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              {/* Doctor Requested Separate Power Field */}
              <div className="p-3.5 rounded-xl bg-primary-50/40 dark:bg-primary-950/30 border border-primary-200/80 dark:border-primary-800/60 space-y-1.5 mt-3">
                <label htmlFor="doctor_power_field" className="block text-xs font-bold text-slate-900 dark:text-slate-100">
                  Power (Doctor Request Field)
                </label>
                <Input
                  id="doctor_power_field"
                  placeholder="e.g. 5/5 all limbs, or Right Upper: 4/5, Left Lower: 3/5..."
                  value={powerText}
                  onChange={(e) => onChangePowerText(e.target.value)}
                />
              </div>

              {/* Motor Functions */}
              {renderExamRow('Motor Examination', 'Motor Functions', 'Motor Functions', {
                useMasterData: true,
                masterCategory: 'Motor Functions',
                placeholder: 'Normal, Weakness, Hemiparesis...',
              })}

              {/* Muscle Tone */}
              {renderExamRow('Motor Examination', 'Muscle Tone', 'Muscle Tone', {
                useMasterData: true,
                masterCategory: 'Muscle Tone',
                placeholder: 'Normal, Hypotonia, Hypertonia, Spastic...',
              })}

              {/* Muscle Strength Assessment (MRC Scale 0/5 – 5/5) */}
              <div className="pt-1">
                <span className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Muscle Strength (MRC Scale 0/5 – 5/5)
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {renderExamRow('Motor Examination', 'Right Upper Limb', 'Muscle Strength — Right Upper Limb', {
                    staticOptions: strengthGrades,
                    placeholder: 'Select grade (e.g. 5/5)...',
                  })}
                  {renderExamRow('Motor Examination', 'Left Upper Limb', 'Muscle Strength — Left Upper Limb', {
                    staticOptions: strengthGrades,
                    placeholder: 'Select grade (e.g. 5/5)...',
                  })}
                  {renderExamRow('Motor Examination', 'Right Lower Limb', 'Muscle Strength — Right Lower Limb', {
                    staticOptions: strengthGrades,
                    placeholder: 'Select grade (e.g. 5/5)...',
                  })}
                  {renderExamRow('Motor Examination', 'Left Lower Limb', 'Muscle Strength — Left Lower Limb', {
                    staticOptions: strengthGrades,
                    placeholder: 'Select grade (e.g. 5/5)...',
                  })}
                </div>
              </div>

              {/* Straight Leg Raise (SLR) Left & Right (Section 10) */}
              <div className="pt-1">
                <span className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Straight Leg Raise (SLR)
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {renderExamRow('SLR', 'SLR - Left', 'SLR — Left Leg', {
                    useMasterData: true,
                    masterCategory: 'SLR',
                    placeholder: 'Negative, Positive, Limited, Painful...',
                  })}
                  {renderExamRow('SLR', 'SLR - Right', 'SLR — Right Leg', {
                    useMasterData: true,
                    masterCategory: 'SLR',
                    placeholder: 'Negative, Positive, Limited, Painful...',
                  })}
                </div>
              </div>

              {/* Muscle Wasting & Abnormal Movements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {renderExamRow('Muscle Wasting', 'Muscle Wasting', 'Muscle Wasting / Bulk', {
                  useMasterData: true,
                  masterCategory: 'Muscle Wasting',
                  placeholder: 'None, Mild, Moderate, Severe, Focal...',
                })}
                {renderExamRow('Abnormal Movements', 'Abnormal Movements', 'Abnormal / Involuntary Movements', {
                  useMasterData: true,
                  masterCategory: 'Abnormal Movements',
                  placeholder: 'None, Tremor, Chorea, Dystonia, Myoclonus...',
                })}
              </div>
            </div>
          )}
        </div>

        {/* ─── GROUP 2: Reflexes (Section 10) ─── */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={() => toggleGroup('reflexes')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/70 transition-colors"
          >
            <div className="flex items-center gap-2.5 font-bold text-sm text-slate-900 dark:text-slate-100">
              <Activity className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span>2. Reflexes</span>
              <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                (Deep Tendon Reflexes, Plantar Response)
              </span>
            </div>
            {openGroups.reflexes ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {openGroups.reflexes && (
            <div className="p-4 pt-0 space-y-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {renderExamRow('Reflexes', 'Reflexes', 'Reflexes (Deep Tendon)', {
                  useMasterData: true,
                  masterCategory: 'Reflexes',
                  placeholder: 'Normal (+2), Reduced (+1), Brisk (+3)...',
                })}
                {renderExamRow('Plantar Response', 'Plantar Response', 'Plantar Response (Babinski)', {
                  useMasterData: true,
                  masterCategory: 'Plantar Response',
                  placeholder: 'Flexor (Normal), Extensor (Babinski +)...',
                })}
              </div>
            </div>
          )}
        </div>

        {/* ─── GROUP 3: Cranial Nerves (Section 10) ─── */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={() => toggleGroup('cranial')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/70 transition-colors"
          >
            <div className="flex items-center gap-2.5 font-bold text-sm text-slate-900 dark:text-slate-100">
              <Eye className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span>3. Cranial Nerves</span>
              <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                (Pupillary Reaction, Facial Sensation, Swallowing, CN I–XII, Eye)
              </span>
            </div>
            {openGroups.cranial ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {openGroups.cranial && (
            <div className="p-4 pt-0 space-y-3.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              {/* Primary Key Cranial Findings from Prompt */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                {renderExamRow('Pupils', 'Pupillary Reaction', 'Pupillary Reaction', {
                  useMasterData: true,
                  masterCategory: 'Pupils',
                  placeholder: 'Normal, Reactive, Sluggish, Anisocoria...',
                })}
                {renderExamRow('Facial Sensation', 'Facial Sensation', 'Facial Sensation (Trigeminal V)', {
                  useMasterData: true,
                  masterCategory: 'Facial Sensation',
                  placeholder: 'Normal, Decreased, Loss of sensation...',
                })}
                {renderExamRow('Swallowing Function', 'Swallowing Function', 'Swallowing Function', {
                  useMasterData: true,
                  masterCategory: 'Swallowing Function',
                  placeholder: 'Normal, Impaired, Dysphagia...',
                })}
              </div>

              {/* Fundoscopy */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {renderExamRow('Fundoscopy', 'Fundoscopy', 'Fundoscopic Examination', {
                  useMasterData: true,
                  masterCategory: 'Fundoscopy',
                  placeholder: 'Normal, Abnormal, Papilledema, Hemorrhage...',
                })}
              </div>

              {/* Detailed CN I through CN XII Matrix */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Individual Cranial Nerves (CN I – CN XII)
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { num: 'I', name: 'Olfactory (Smell)' },
                    { num: 'II', name: 'Optic (Visual Acuity & Fields)' },
                    { num: 'III', name: 'Oculomotor (Pupil & Eye Movement)' },
                    { num: 'IV', name: 'Trochlear (Down & In Gaze)' },
                    { num: 'V', name: 'Trigeminal (Facial Sensation & Mastication)' },
                    { num: 'VI', name: 'Abducens (Lateral Gaze)' },
                    { num: 'VII', name: 'Facial (Facial Muscles & Taste)' },
                    { num: 'VIII', name: 'Vestibulocochlear (Hearing & Balance)' },
                    { num: 'IX', name: 'Glossopharyngeal (Palatal Sensation & Gag)' },
                    { num: 'X', name: 'Vagus (Voice & Palate Elevation)' },
                    { num: 'XI', name: 'Accessory (Trapezius & SCM Power)' },
                    { num: 'XII', name: 'Hypoglossal (Tongue Protrusion)' },
                  ].map((cnItem) => (
                    <div key={cnItem.num}>
                      {renderExamRow('Cranial Nerves', `CN ${cnItem.num}`, `CN ${cnItem.num} — ${cnItem.name}`, {
                        useMasterData: true,
                        masterCategory: 'Cranial Nerves',
                        placeholder: 'Normal, Impaired, Weak...',
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── GROUP 4: Coordination & Gait (Section 10) ─── */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={() => toggleGroup('coordination_gait')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/70 transition-colors"
          >
            <div className="flex items-center gap-2.5 font-bold text-sm text-slate-900 dark:text-slate-100">
              <Move className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span>4. Coordination & Gait</span>
              <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                (Gait & Balance, Coordination, Romberg, Nystagmus, Cerebellar)
              </span>
            </div>
            {openGroups.coordination_gait ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {openGroups.coordination_gait && (
            <div className="p-4 pt-0 space-y-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {renderExamRow('Gait & Balance', 'Gait & Balance', 'Gait & Balance', {
                  useMasterData: true,
                  masterCategory: 'Gait & Balance',
                  placeholder: 'Normal, Unsteady, Ataxic, Shuffling...',
                })}
                {renderExamRow('Coordination', 'Coordination', 'Coordination (Finger-Nose, Heel-Shin)', {
                  useMasterData: true,
                  masterCategory: 'Coordination',
                  placeholder: 'Normal, Dysmetria, Ataxia...',
                })}
                {renderExamRow('Romberg Test', 'Romberg Test', 'Romberg Test', {
                  useMasterData: true,
                  masterCategory: 'Romberg Test',
                  placeholder: 'Negative, Positive, Unable to perform...',
                })}
                {renderExamRow('Nystagmus', 'Nystagmus', 'Nystagmus', {
                  useMasterData: true,
                  masterCategory: 'Nystagmus',
                  placeholder: 'Absent, Present, Horizontal...',
                })}
                {renderExamRow('Cerebellar Function', 'Cerebellar Function', 'Cerebellar Signs & Function', {
                  useMasterData: true,
                  masterCategory: 'Cerebellar Function',
                  placeholder: 'Normal, Impaired, Dysdiadochokinesia...',
                })}
              </div>
            </div>
          )}
        </div>

        {/* ─── GROUP 5: Sensory Examination (Section 10) ─── */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={() => toggleGroup('sensory')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/70 transition-colors"
          >
            <div className="flex items-center gap-2.5 font-bold text-sm text-slate-900 dark:text-slate-100">
              <Compass className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span>5. Sensory Examination</span>
              <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                (Pain, Vibration, Temperature, Proprioception, Joint Position, Sharp/Dull)
              </span>
            </div>
            {openGroups.sensory ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {openGroups.sensory && (
            <div className="p-4 pt-0 space-y-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {renderExamRow('Sensory Examination', 'Pain Sensation', 'Pain Sensation (Pinprick)', {
                  useMasterData: true,
                  masterCategory: 'Sensory Examination',
                  placeholder: 'Normal, Hypesthesia, Absent...',
                })}
                {renderExamRow('Sensory Examination', 'Vibration', 'Vibration Sense (128Hz Tuning Fork)', {
                  useMasterData: true,
                  masterCategory: 'Sensory Examination',
                  placeholder: 'Normal, Reduced, Absent...',
                })}
                {renderExamRow('Sensory Examination', 'Temperature', 'Temperature Sensation', {
                  useMasterData: true,
                  masterCategory: 'Sensory Examination',
                  placeholder: 'Normal, Reduced, Absent...',
                })}
                {renderExamRow('Sensory Examination', 'Proprioception', 'Proprioception / Joint Position Sense', {
                  useMasterData: true,
                  masterCategory: 'Sensory Examination',
                  placeholder: 'Normal, Impaired, Absent...',
                })}
                {renderExamRow('Sensory Examination', 'Sharp/Dull', 'Sharp / Dull Discrimination', {
                  useMasterData: true,
                  masterCategory: 'Sensory Examination',
                  placeholder: 'Normal, Impaired...',
                })}
              </div>
            </div>
          )}
        </div>

        {/* ─── GROUP 6: Mental & Higher Functions (Section 10) ─── */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={() => toggleGroup('mental_higher')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/70 transition-colors"
          >
            <div className="flex items-center gap-2.5 font-bold text-sm text-slate-900 dark:text-slate-100">
              <Smile className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span>6. Mental & Higher Functions</span>
              <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                (Mental Status, Speech Assessment)
              </span>
            </div>
            {openGroups.mental_higher ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {openGroups.mental_higher && (
            <div className="p-4 pt-0 space-y-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {renderExamRow('Mental Status', 'Mental Status', 'Mental Status / Consciousness', {
                  useMasterData: true,
                  masterCategory: 'Mental Status',
                  placeholder: 'Alert, Oriented, Confused, Drowsy...',
                })}
                {renderExamRow('Speech Assessment', 'Speech Assessment', 'Speech Assessment', {
                  useMasterData: true,
                  masterCategory: 'Speech Assessment',
                  placeholder: 'Normal, Dysarthria, Aphasia, Slurred...',
                })}
              </div>

              {/* Meningeal Signs optional sub-item */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Meningeal Signs
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {renderExamRow('Meningeal Signs', 'Neck Rigidity', 'Neck Rigidity', {
                    useMasterData: true,
                    masterCategory: 'Meningeal Signs',
                    placeholder: 'Negative, Positive, Limited...',
                  })}
                  {renderExamRow('Meningeal Signs', 'Kernig Sign', 'Kernig Sign', {
                    useMasterData: true,
                    masterCategory: 'Meningeal Signs',
                    placeholder: 'Negative, Positive...',
                  })}
                  {renderExamRow('Meningeal Signs', 'Brudzinski Sign', 'Brudzinski Sign', {
                    useMasterData: true,
                    masterCategory: 'Meningeal Signs',
                    placeholder: 'Negative, Positive...',
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      )}
    </Card>
  );
};
