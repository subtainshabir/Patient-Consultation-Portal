import React, { useState } from 'react';
import {
  Brain,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ChevronsDownUp,
  ChevronsUpDown,
  Eye,
  Activity,
  Zap,
  Move,
  Compass,
  Smile,
  ShieldAlert,
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
  // Collapsible panels state: default motor open
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    motor: true,
    reflexes: false,
    cranial: false,
    sensory: false,
    coordination: false,
    gait: false,
    mental: false,
    special: false,
    eye: false,
    other: false,
  });

  const toggleSection = (sectionKey: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const expandAll = () => {
    setOpenSections({
      motor: true,
      reflexes: true,
      cranial: true,
      sensory: true,
      coordination: true,
      gait: true,
      mental: true,
      special: true,
      eye: true,
      other: true,
    });
  };

  const collapseAll = () => {
    setOpenSections({
      motor: false,
      reflexes: false,
      cranial: false,
      sensory: false,
      coordination: false,
      gait: false,
      mental: false,
      special: false,
      eye: false,
      other: false,
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

  // Predefined MRC muscle strength grades (Section 22)
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
      <div className="p-3.5 rounded-xl border border-navy-100 bg-white hover:border-navy-200 transition-colors space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="font-semibold text-xs text-navy-900 flex items-center gap-1.5">
            <span>{label}</span>
          </div>

          {/* Assessment Status Toggle (Section 44) */}
          <div className="flex items-center gap-1 self-start sm:self-auto bg-navy-50 p-0.5 rounded-lg border border-navy-200/70">
            <button
              type="button"
              onClick={() => updateItem(category, itemName, { status: 'Done' })}
              className={cn(
                'px-2 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1',
                isDone
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-navy-600 hover:text-navy-900'
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
                  ? 'bg-navy-700 text-white shadow-xs'
                  : 'text-navy-500 hover:text-navy-800'
              )}
            >
              <XCircle className="w-3 h-3" />
              <span>Not Done</span>
            </button>
          </div>
        </div>

        {/* Clinical Finding & Notes: only enabled when Done (Section 44) */}
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
          <div className="py-1 px-2 rounded-lg bg-navy-50/60 text-[11px] text-navy-400 italic">
            Examination marked as Not Done. No clinical finding documented.
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="border-navy-200 shadow-sm">
      <CardHeader className="pb-3 border-b border-navy-100 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-medical-50 text-medical-700 flex items-center justify-center">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-navy-950">Neurological Examination</CardTitle>
            <p className="text-xs text-navy-500">Structured examination matrix organized by clinical subsystems</p>
          </div>
        </div>

        {/* Global Expand / Collapse All buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="text-xs font-semibold text-medical-700 hover:text-medical-800 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-medical-50 border border-medical-200/60 transition-colors"
          >
            <ChevronsUpDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Expand All</span>
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="text-xs font-semibold text-navy-600 hover:text-navy-800 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-navy-100 border border-navy-200 transition-colors"
          >
            <ChevronsDownUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Collapse All</span>
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {/* ─── 1. Motor Examination ─── */}
        <div className="border border-navy-200 rounded-xl overflow-hidden bg-navy-50/30">
          <button
            type="button"
            onClick={() => toggleSection('motor')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-navy-100/50 transition-colors"
          >
            <div className="flex items-center gap-2.5 font-bold text-sm text-navy-950">
              <Zap className="w-4 h-4 text-medical-600" />
              <span>1. Motor Examination</span>
            </div>
            {openSections.motor ? (
              <ChevronDown className="w-4 h-4 text-navy-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-navy-400" />
            )}
          </button>

          {openSections.motor && (
            <div className="p-4 pt-0 space-y-3.5 border-t border-navy-100 bg-white">
              {/* Doctor Requested Separate Power Field (Section 45) */}
              <div className="p-3.5 rounded-xl bg-medical-50/40 border border-medical-200 space-y-1.5">
                <label htmlFor="doctor_power_field" className="block text-xs font-bold text-navy-900">
                  Power (Doctor Request Field)
                </label>
                <Input
                  id="doctor_power_field"
                  placeholder="e.g. 5/5 all limbs, or Right Upper: 4/5, Left Lower: 3/5..."
                  value={powerText}
                  onChange={(e) => onChangePowerText(e.target.value)}
                />
              </div>

              {/* General Motor Functions (Section 20) */}
              {renderExamRow('Motor Examination', 'Motor Functions', 'Motor Functions', {
                useMasterData: true,
                masterCategory: 'Motor Functions',
                placeholder: 'Normal, Weakness, Hemiparesis...',
              })}

              {/* Muscle Tone (Section 21) */}
              {renderExamRow('Motor Examination', 'Muscle Tone', 'Muscle Tone', {
                useMasterData: true,
                masterCategory: 'Muscle Tone',
                placeholder: 'Normal, Hypotonia, Hypertonia, Spastic...',
              })}

              {/* Structured Muscle Strength Matrix (Section 22) */}
              <div className="pt-2">
                <span className="block text-xs font-bold text-navy-900 mb-2">
                  Muscle Strength Assessment (MRC Scale 0/5 – 5/5)
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {renderExamRow('Motor Examination', 'Right Upper Limb', 'Right Upper Limb', {
                    staticOptions: strengthGrades,
                    placeholder: 'Select grade (e.g. 5/5)...',
                  })}
                  {renderExamRow('Motor Examination', 'Left Upper Limb', 'Left Upper Limb', {
                    staticOptions: strengthGrades,
                    placeholder: 'Select grade (e.g. 5/5)...',
                  })}
                  {renderExamRow('Motor Examination', 'Right Lower Limb', 'Right Lower Limb', {
                    staticOptions: strengthGrades,
                    placeholder: 'Select grade (e.g. 5/5)...',
                  })}
                  {renderExamRow('Motor Examination', 'Left Lower Limb', 'Left Lower Limb', {
                    staticOptions: strengthGrades,
                    placeholder: 'Select grade (e.g. 5/5)...',
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── 2. Reflexes & Plantar ─── */}
        <div className="border border-navy-200 rounded-xl overflow-hidden bg-navy-50/30">
          <button
            type="button"
            onClick={() => toggleSection('reflexes')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-navy-100/50 transition-colors"
          >
            <div className="flex items-center gap-2.5 font-bold text-sm text-navy-950">
              <Activity className="w-4 h-4 text-medical-600" />
              <span>2. Reflexes & Plantar Response</span>
            </div>
            {openSections.reflexes ? (
              <ChevronDown className="w-4 h-4 text-navy-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-navy-400" />
            )}
          </button>

          {openSections.reflexes && (
            <div className="p-4 pt-0 space-y-3 border-t border-navy-100 bg-white">
              {/* Deep Tendon Reflexes (Section 24) */}
              {renderExamRow('Reflexes', 'Reflexes', 'Deep Tendon Reflexes', {
                useMasterData: true,
                masterCategory: 'Reflexes',
                placeholder: 'Normal (+2), Reduced (+1), Brisk (+3)...',
              })}

              {/* Plantar Response (Section 25) */}
              {renderExamRow('Plantar Response', 'Plantar Response', 'Plantar Response (Babinski)', {
                useMasterData: true,
                masterCategory: 'Plantar Response',
                placeholder: 'Flexor (Normal), Extensor (Babinski +)...',
              })}
            </div>
          )}
        </div>

        {/* ─── 3. Cranial Nerves ─── */}
        <div className="border border-navy-200 rounded-xl overflow-hidden bg-navy-50/30">
          <button
            type="button"
            onClick={() => toggleSection('cranial')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-navy-100/50 transition-colors"
          >
            <div className="flex items-center gap-2.5 font-bold text-sm text-navy-950">
              <Brain className="w-4 h-4 text-medical-600" />
              <span>3. Cranial Nerves (CN I – CN XII)</span>
            </div>
            {openSections.cranial ? (
              <ChevronDown className="w-4 h-4 text-navy-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-navy-400" />
            )}
          </button>

          {openSections.cranial && (
            <div className="p-4 pt-0 space-y-3 border-t border-navy-100 bg-white">
              <p className="text-xs text-navy-500 mb-2">
                Evaluate cranial nerves I through XII individually. Select finding or mark Not Done.
              </p>
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
                ].map((cn) => {
                  const itemKey = `CN ${cn.num}`;
                  return (
                    <div key={cn.num}>
                      {renderExamRow('Cranial Nerves', itemKey, `CN ${cn.num} — ${cn.name}`, {
                        useMasterData: true,
                        masterCategory: 'Cranial Nerves',
                        placeholder: 'Normal, Impaired, Weak...',
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ─── 4. Sensory Examination ─── */}
        <div className="border border-navy-200 rounded-xl overflow-hidden bg-navy-50/30">
          <button
            type="button"
            onClick={() => toggleSection('sensory')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-navy-100/50 transition-colors"
          >
            <div className="flex items-center gap-2.5 font-bold text-sm text-navy-950">
              <Zap className="w-4 h-4 text-medical-600" />
              <span>4. Sensory Examination</span>
            </div>
            {openSections.sensory ? (
              <ChevronDown className="w-4 h-4 text-navy-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-navy-400" />
            )}
          </button>

          {openSections.sensory && (
            <div className="p-4 pt-0 space-y-3 border-t border-navy-100 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

        {/* ─── 5. Coordination & Cerebellar ─── */}
        <div className="border border-navy-200 rounded-xl overflow-hidden bg-navy-50/30">
          <button
            type="button"
            onClick={() => toggleSection('coordination')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-navy-100/50 transition-colors"
          >
            <div className="flex items-center gap-2.5 font-bold text-sm text-navy-950">
              <Compass className="w-4 h-4 text-medical-600" />
              <span>5. Coordination & Cerebellar Function</span>
            </div>
            {openSections.coordination ? (
              <ChevronDown className="w-4 h-4 text-navy-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-navy-400" />
            )}
          </button>

          {openSections.coordination && (
            <div className="p-4 pt-0 space-y-3 border-t border-navy-100 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {renderExamRow('Coordination', 'Coordination', 'Coordination (Finger-Nose, Heel-Shin)', {
                  useMasterData: true,
                  masterCategory: 'Coordination',
                  placeholder: 'Normal, Dysmetria, Ataxia...',
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

        {/* ─── 6. Gait & Balance ─── */}
        <div className="border border-navy-200 rounded-xl overflow-hidden bg-navy-50/30">
          <button
            type="button"
            onClick={() => toggleSection('gait')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-navy-100/50 transition-colors"
          >
            <div className="flex items-center gap-2.5 font-bold text-sm text-navy-950">
              <Move className="w-4 h-4 text-medical-600" />
              <span>6. Gait & Balance</span>
            </div>
            {openSections.gait ? (
              <ChevronDown className="w-4 h-4 text-navy-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-navy-400" />
            )}
          </button>

          {openSections.gait && (
            <div className="p-4 pt-0 space-y-3 border-t border-navy-100 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {renderExamRow('Gait & Balance', 'Gait & Balance', 'Gait & Balance Evaluation', {
                  useMasterData: true,
                  masterCategory: 'Gait & Balance',
                  placeholder: 'Normal, Unsteady, Ataxic, Shuffling...',
                })}
                {renderExamRow('Romberg Test', 'Romberg Test', 'Romberg Test', {
                  useMasterData: true,
                  masterCategory: 'Romberg Test',
                  placeholder: 'Negative, Positive, Unable to perform...',
                })}
              </div>
            </div>
          )}
        </div>

        {/* ─── 7. Mental Status & Speech ─── */}
        <div className="border border-navy-200 rounded-xl overflow-hidden bg-navy-50/30">
          <button
            type="button"
            onClick={() => toggleSection('mental')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-navy-100/50 transition-colors"
          >
            <div className="flex items-center gap-2.5 font-bold text-sm text-navy-950">
              <Smile className="w-4 h-4 text-medical-600" />
              <span>7. Mental Status & Speech</span>
            </div>
            {openSections.mental ? (
              <ChevronDown className="w-4 h-4 text-navy-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-navy-400" />
            )}
          </button>

          {openSections.mental && (
            <div className="p-4 pt-0 space-y-3 border-t border-navy-100 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            </div>
          )}
        </div>

        {/* ─── 8. Special Tests & Meningeal Signs ─── */}
        <div className="border border-navy-200 rounded-xl overflow-hidden bg-navy-50/30">
          <button
            type="button"
            onClick={() => toggleSection('special')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-navy-100/50 transition-colors"
          >
            <div className="flex items-center gap-2.5 font-bold text-sm text-navy-950">
              <ShieldAlert className="w-4 h-4 text-medical-600" />
              <span>8. Special Tests & Meningeal Signs</span>
            </div>
            {openSections.special ? (
              <ChevronDown className="w-4 h-4 text-navy-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-navy-400" />
            )}
          </button>

          {openSections.special && (
            <div className="p-4 pt-0 space-y-3 border-t border-navy-100 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {renderExamRow('SLR', 'SLR - Left', 'Straight Leg Raise (SLR) — Left', {
                  useMasterData: true,
                  masterCategory: 'SLR',
                  placeholder: 'Negative, Positive, Limited, Painful...',
                })}
                {renderExamRow('SLR', 'SLR - Right', 'Straight Leg Raise (SLR) — Right', {
                  useMasterData: true,
                  masterCategory: 'SLR',
                  placeholder: 'Negative, Positive, Limited, Painful...',
                })}
                {renderExamRow('Meningeal Signs', 'Brudzinski Sign', 'Brudzinski Sign', {
                  useMasterData: true,
                  masterCategory: 'Meningeal Signs',
                  placeholder: 'Negative, Positive...',
                })}
                {renderExamRow('Meningeal Signs', 'Kernig Sign', 'Kernig Sign', {
                  useMasterData: true,
                  masterCategory: 'Meningeal Signs',
                  placeholder: 'Negative, Positive...',
                })}
                {renderExamRow('Meningeal Signs', 'Neck Rigidity', 'Neck Rigidity / Flexion Resistance', {
                  useMasterData: true,
                  masterCategory: 'Meningeal Signs',
                  placeholder: 'Negative, Positive, Limited...',
                })}
              </div>
            </div>
          )}
        </div>

        {/* ─── 9. Eye & Fundoscopy ─── */}
        <div className="border border-navy-200 rounded-xl overflow-hidden bg-navy-50/30">
          <button
            type="button"
            onClick={() => toggleSection('eye')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-navy-100/50 transition-colors"
          >
            <div className="flex items-center gap-2.5 font-bold text-sm text-navy-950">
              <Eye className="w-4 h-4 text-medical-600" />
              <span>9. Eye & Fundoscopic Examination</span>
            </div>
            {openSections.eye ? (
              <ChevronDown className="w-4 h-4 text-navy-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-navy-400" />
            )}
          </button>

          {openSections.eye && (
            <div className="p-4 pt-0 space-y-3 border-t border-navy-100 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {renderExamRow('Pupils', 'Pupillary Reaction', 'Pupillary Reaction', {
                  useMasterData: true,
                  masterCategory: 'Pupils',
                  placeholder: 'Normal, Reactive, Sluggish, Anisocoria...',
                })}
                {renderExamRow('Nystagmus', 'Nystagmus', 'Nystagmus', {
                  useMasterData: true,
                  masterCategory: 'Nystagmus',
                  placeholder: 'Absent, Present, Horizontal...',
                })}
                {renderExamRow('Fundoscopy', 'Fundoscopy', 'Fundoscopic Examination', {
                  useMasterData: true,
                  masterCategory: 'Fundoscopy',
                  placeholder: 'Normal, Abnormal, Papilledema, Hemorrhage...',
                })}
              </div>
            </div>
          )}
        </div>

        {/* ─── 10. Other Findings ─── */}
        <div className="border border-navy-200 rounded-xl overflow-hidden bg-navy-50/30">
          <button
            type="button"
            onClick={() => toggleSection('other')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-navy-100/50 transition-colors"
          >
            <div className="flex items-center gap-2.5 font-bold text-sm text-navy-950">
              <Activity className="w-4 h-4 text-medical-600" />
              <span>10. Other Neurological Findings</span>
            </div>
            {openSections.other ? (
              <ChevronDown className="w-4 h-4 text-navy-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-navy-400" />
            )}
          </button>

          {openSections.other && (
            <div className="p-4 pt-0 space-y-3 border-t border-navy-100 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                {renderExamRow('Facial Sensation', 'Facial Sensation', 'Facial Sensation (Trigeminal V1-V3)', {
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
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
