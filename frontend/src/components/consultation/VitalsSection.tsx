import React, { useState } from 'react';
import { Activity, HelpCircle, ChevronDown, ChevronUp, Scale } from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import type { ConsultationVitals } from '../../types/consultation';

export interface VitalsSectionProps {
  vitals: ConsultationVitals;
  onChange: (vitals: ConsultationVitals) => void;
  errors?: Record<string, string>;
}

export const VitalsSection: React.FC<VitalsSectionProps> = ({
  vitals,
  onChange,
  errors = {},
}) => {
  const [showExtendedVitals, setShowExtendedVitals] = useState(false);
  const [showNihssHelp, setShowNihssHelp] = useState(false);

  const updateField = (field: keyof ConsultationVitals, value: unknown) => {
    onChange({
      ...vitals,
      [field]: value,
    });
  };

  const handleNumberInput = (field: keyof ConsultationVitals, rawValue: string, isFloat = false) => {
    if (rawValue === '') {
      updateField(field, null);
      return;
    }
    const parsed = isFloat ? parseFloat(rawValue) : parseInt(rawValue, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      updateField(field, parsed);
    }
  };

  // Familiar BP representation
  const bpRepresentation =
    vitals.systolic_bp && vitals.diastolic_bp
      ? `${vitals.systolic_bp} / ${vitals.diastolic_bp} mmHg`
      : vitals.systolic_bp
      ? `${vitals.systolic_bp} / -- mmHg`
      : vitals.diastolic_bp
      ? `-- / ${vitals.diastolic_bp} mmHg`
      : 'Not recorded';

  // Auto-calculate BMI if weight and height are provided
  const calculateBmi = (weightKg?: number | null, heightCm?: number | null) => {
    if (!weightKg || !heightCm || heightCm <= 0) return null;
    const heightM = heightCm / 100;
    const bmiVal = weightKg / (heightM * heightM);
    return Math.round(bmiVal * 10) / 10;
  };

  const autoBmi = calculateBmi(vitals.weight_kg, vitals.height_cm);

  return (
    <Card className="border-navy-200 shadow-sm">
      <CardHeader className="pb-3 border-b border-navy-100 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-medical-50 text-medical-700 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-navy-950">Vital Signs</CardTitle>
            <p className="text-xs text-navy-500">Record baseline physiological measurements</p>
          </div>
        </div>

        {/* Familiar BP live indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-medical-50 border border-medical-200">
          <span className="text-[11px] font-semibold text-medical-800">Blood Pressure:</span>
          <span className="text-xs font-mono font-bold text-medical-950">{bpRepresentation}</span>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-6">
        {/* Core Vitals Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Systolic BP */}
          <div>
            <Input
              label="Systolic BP"
              id="systolic_bp"
              type="number"
              placeholder="e.g. 120"
              value={vitals.systolic_bp ?? ''}
              onChange={(e) => handleNumberInput('systolic_bp', e.target.value)}
              rightElement={<span className="text-xs text-navy-400 font-medium">mmHg</span>}
              error={errors.systolic_bp}
              min={40}
              max={300}
            />
          </div>

          {/* Diastolic BP */}
          <div>
            <Input
              label="Diastolic BP"
              id="diastolic_bp"
              type="number"
              placeholder="e.g. 80"
              value={vitals.diastolic_bp ?? ''}
              onChange={(e) => handleNumberInput('diastolic_bp', e.target.value)}
              rightElement={<span className="text-xs text-navy-400 font-medium">mmHg</span>}
              error={errors.diastolic_bp}
              min={20}
              max={200}
            />
          </div>

          {/* Pulse Rate */}
          <div>
            <Input
              label="Pulse Rate"
              id="pulse_rate"
              type="number"
              placeholder="e.g. 72"
              value={vitals.pulse_rate ?? ''}
              onChange={(e) => handleNumberInput('pulse_rate', e.target.value)}
              rightElement={<span className="text-xs text-navy-400 font-medium">bpm</span>}
              error={errors.pulse_rate}
              min={20}
              max={250}
            />
          </div>

          {/* Temperature */}
          <div>
            <Input
              label="Temperature"
              id="temperature"
              type="number"
              step="0.1"
              placeholder="e.g. 36.7"
              value={vitals.temperature ?? ''}
              onChange={(e) => handleNumberInput('temperature', e.target.value, true)}
              rightElement={<span className="text-xs text-navy-400 font-medium">°C</span>}
              error={errors.temperature}
              min={25}
              max={45}
            />
          </div>

          {/* Oxygen Saturation */}
          <div>
            <Input
              label="Oxygen Saturation"
              id="oxygen_saturation"
              type="number"
              placeholder="e.g. 98"
              value={vitals.oxygen_saturation ?? ''}
              onChange={(e) => handleNumberInput('oxygen_saturation', e.target.value)}
              rightElement={<span className="text-xs text-navy-400 font-medium">%</span>}
              error={errors.oxygen_saturation}
              min={40}
              max={100}
            />
          </div>

          {/* NIHSS Score with info tooltip */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="nihss_score" className="text-xs font-semibold text-navy-800 flex items-center gap-1">
                NIHSS Score
                <button
                  type="button"
                  onClick={() => setShowNihssHelp((prev) => !prev)}
                  className="text-navy-400 hover:text-medical-600 transition-colors focus:outline-hidden"
                  aria-label="NIHSS information"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </label>
            </div>
            <Input
              id="nihss_score"
              type="number"
              placeholder="0 – 42"
              value={vitals.nihss_score ?? ''}
              onChange={(e) => handleNumberInput('nihss_score', e.target.value)}
              error={errors.nihss_score}
              min={0}
              max={42}
            />
          </div>
        </div>

        {/* NIHSS Help Popover / Banner */}
        {showNihssHelp && (
          <div className="p-3 bg-medical-50/70 border border-medical-200 rounded-xl text-xs text-navy-700 space-y-1 animate-in fade-in duration-150">
            <div className="font-bold text-medical-900 flex items-center justify-between">
              <span>National Institutes of Health Stroke Scale (NIHSS)</span>
              <button
                type="button"
                onClick={() => setShowNihssHelp(false)}
                className="text-navy-400 hover:text-navy-700"
              >
                ✕
              </button>
            </div>
            <p className="text-navy-600 leading-relaxed">
              Standard neurological score from <strong>0 to 42</strong> assessing stroke severity.
              0 indicates no stroke symptoms; 1–4 mild; 5–15 moderate; 16–20 moderate to severe; 21–42 severe stroke.
            </p>
          </div>
        )}

        {/* Extensible Additional Vitals (Section 12) */}
        <div className="pt-2 border-t border-navy-100">
          <button
            type="button"
            onClick={() => setShowExtendedVitals((prev) => !prev)}
            className="flex items-center gap-2 text-xs font-semibold text-navy-600 hover:text-medical-700 transition-colors"
          >
            <Scale className="w-3.5 h-3.5 text-medical-600" />
            <span>{showExtendedVitals ? 'Hide Additional Vitals' : '+ Add Additional Vitals (Respiratory, Weight, BMI, Glucose)'}</span>
            {showExtendedVitals ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showExtendedVitals && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4 pt-3 border-t border-navy-100/70 animate-in fade-in duration-150">
              <Input
                label="Respiratory Rate"
                id="respiratory_rate"
                type="number"
                placeholder="e.g. 16"
                value={vitals.respiratory_rate ?? ''}
                onChange={(e) => handleNumberInput('respiratory_rate', e.target.value)}
                rightElement={<span className="text-xs text-navy-400 font-medium">/min</span>}
                min={5}
                max={80}
              />

              <Input
                label="Weight"
                id="weight_kg"
                type="number"
                step="0.1"
                placeholder="e.g. 70.5"
                value={vitals.weight_kg ?? ''}
                onChange={(e) => handleNumberInput('weight_kg', e.target.value, true)}
                rightElement={<span className="text-xs text-navy-400 font-medium">kg</span>}
                min={1}
                max={500}
              />

              <Input
                label="Height"
                id="height_cm"
                type="number"
                placeholder="e.g. 172"
                value={vitals.height_cm ?? ''}
                onChange={(e) => handleNumberInput('height_cm', e.target.value, true)}
                rightElement={<span className="text-xs text-navy-400 font-medium">cm</span>}
                min={20}
                max={250}
              />

              <div>
                <label className="block text-xs font-semibold text-navy-800 mb-1.5">
                  BMI (Body Mass Index)
                </label>
                <div className="h-10 px-3.5 flex items-center justify-between rounded-xl bg-navy-50 border border-navy-200 text-xs font-mono font-medium text-navy-900">
                  <span>{autoBmi !== null ? `${autoBmi} kg/m²` : 'Auto-calculated'}</span>
                </div>
              </div>

              <Input
                label="Blood Glucose"
                id="blood_glucose"
                type="number"
                placeholder="e.g. 110"
                value={vitals.blood_glucose ?? ''}
                onChange={(e) => handleNumberInput('blood_glucose', e.target.value, true)}
                rightElement={<span className="text-xs text-navy-400 font-medium">mg/dL</span>}
                min={10}
                max={1000}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
