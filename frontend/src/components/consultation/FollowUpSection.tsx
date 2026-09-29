import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, Calendar, Clock, FileText, X, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { masterDataService } from '../../services/masterDataService';
import type { FollowUpOption } from '../../types/masterData';

export interface FollowUpSectionProps {
  followUpOptionId: number | null;
  followUpPeriod: string | null;
  followUpDate: string | null;
  followUpInstructions: string | null;
  onChangeOption: (optionId: number | null, periodName: string | null) => void;
  onChangeDate: (date: string | null) => void;
  onChangeInstructions: (instructions: string) => void;
}

export const FollowUpSection: React.FC<FollowUpSectionProps> = ({
  followUpOptionId,
  followUpPeriod,
  followUpDate,
  followUpInstructions,
  onChangeOption,
  onChangeDate,
  onChangeInstructions,
}) => {
  // Fetch follow up options from master data
  const { data: followUpsData, isLoading } = useQuery({
    queryKey: ['master-data-follow-ups'],
    queryFn: () => masterDataService.getFollowUps({ is_active: true, page_size: 50 }),
    staleTime: 5 * 60 * 1000,
  });

  const followUpOptions: FollowUpOption[] = followUpsData?.items || [];

  // Helper to calculate date offset from today
  const calculateTargetDate = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const handleSelectOption = (opt: FollowUpOption) => {
    const isCurrentlySelected = followUpOptionId === opt.id || followUpPeriod === opt.urdu_label || followUpPeriod === opt.name;
    if (isCurrentlySelected) {
      // Unselect
      onChangeOption(null, null);
      onChangeDate(null);
      return;
    }

    const periodLabel = opt.urdu_label || opt.name;
    onChangeOption(opt.id, periodLabel);

    // Auto-calculate suggested date based on common periods
    const lowerName = opt.name.toLowerCase();
    if (lowerName.includes('1 week')) {
      onChangeDate(calculateTargetDate(7));
    } else if (lowerName.includes('2 week')) {
      onChangeDate(calculateTargetDate(14));
    } else if (lowerName.includes('3 week')) {
      onChangeDate(calculateTargetDate(21));
    } else if (lowerName.includes('1 month')) {
      onChangeDate(calculateTargetDate(30));
    } else if (lowerName.includes('2 month')) {
      onChangeDate(calculateTargetDate(60));
    } else if (lowerName.includes('3 month')) {
      onChangeDate(calculateTargetDate(90));
    } else if (lowerName.includes('6 month')) {
      onChangeDate(calculateTargetDate(180));
    } else if (lowerName.includes('as needed') || opt.urdu_label?.includes('ضرورت')) {
      onChangeDate(null);
    }
  };

  const handleClear = () => {
    onChangeOption(null, null);
    onChangeDate(null);
    onChangeInstructions('');
  };

  const hasFollowUp = Boolean(followUpPeriod || followUpDate || (followUpInstructions && followUpInstructions.trim()));

  return (
    <Card className="border-navy-200 shadow-sm">
      <CardHeader className="pb-3 border-b border-navy-100 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-medical-50 text-medical-700 flex items-center justify-center">
            <CalendarClock className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-navy-950 flex items-center gap-2">
              <span>Follow-Up Management</span>
              {hasFollowUp && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-medical-50 text-medical-800 border border-medical-200">
                  Configured
                </span>
              )}
            </CardTitle>
            <p className="text-xs text-navy-500">
              Schedule patient return visit, select follow-up timeframe, and document instructions
            </p>
          </div>
        </div>

        {hasFollowUp && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-rose-50"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear Follow-Up</span>
          </button>
        )}
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* Quick Follow-Up Period Options */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-navy-800">
              Select Follow-Up Period (Master Data)
            </label>
            <span className="text-[11px] text-navy-400">Click to select standard period</span>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 py-3 text-xs text-navy-500">
              <Clock className="w-4 h-4 animate-spin text-medical-600" />
              <span>Loading follow-up periods...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {followUpOptions.map((opt) => {
                const isSelected =
                  followUpOptionId === opt.id ||
                  followUpPeriod === opt.urdu_label ||
                  followUpPeriod === opt.name;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(opt)}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all text-left flex flex-col justify-between gap-1 ${
                      isSelected
                        ? 'bg-medical-700 text-white border-medical-800 shadow-xs ring-2 ring-medical-500/20'
                        : 'bg-white hover:bg-navy-50 text-navy-800 border-navy-200 hover:border-navy-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-[11px] font-semibold ${isSelected ? 'text-medical-100' : 'text-navy-500'}`}>
                        {opt.name}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span
                      className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-medical-800'}`}
                      dir="rtl"
                    >
                      {opt.urdu_label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Exact Date & Custom Period Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-navy-100">
          {/* Exact Follow-Up Date */}
          <div>
            <label htmlFor="follow-up-date-input" className="block text-xs font-semibold text-navy-800 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-medical-600" />
              <span>Exact Follow-Up Date (Optional)</span>
            </label>
            <input
              id="follow-up-date-input"
              type="date"
              value={followUpDate || ''}
              onChange={(e) => onChangeDate(e.target.value || null)}
              className="w-full px-3.5 py-2 text-xs font-mono text-navy-900 bg-white border border-navy-200 rounded-xl focus:outline-hidden focus:border-medical-500 focus:ring-1 focus:ring-medical-500 transition-colors"
            />
            <p className="text-[11px] text-navy-400 mt-1">
              Specifies the exact appointment target date for the patient calendar
            </p>
          </div>

          {/* Custom Follow-Up Period Description */}
          <div>
            <label htmlFor="follow-up-period-input" className="block text-xs font-semibold text-navy-800 mb-1.5">
              Follow-Up Timeframe Label
            </label>
            <input
              id="follow-up-period-input"
              type="text"
              placeholder="e.g. 1 ہفتے بعد / 2 weeks later / حسبِ ضرورت"
              value={followUpPeriod || ''}
              onChange={(e) => onChangeOption(followUpOptionId, e.target.value || null)}
              className="w-full px-3.5 py-2 text-xs text-navy-900 bg-white border border-navy-200 rounded-xl focus:outline-hidden focus:border-medical-500 focus:ring-1 focus:ring-medical-500 transition-colors"
            />
            <p className="text-[11px] text-navy-400 mt-1">
              Selected timeframe displayed on patient profile and prescription
            </p>
          </div>
        </div>

        {/* Follow-Up Instructions (Section 10) */}
        <div className="pt-2 border-t border-navy-100">
          <label htmlFor="follow-up-instructions-input" className="block text-xs font-semibold text-navy-800 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-medical-600" />
            <span>Follow-Up Instructions (Optional)</span>
          </label>
          <textarea
            id="follow-up-instructions-input"
            rows={3}
            placeholder="e.g. Return with MRI Brain report and blood test results. Follow up earlier if headache or seizures worsen..."
            value={followUpInstructions || ''}
            onChange={(e) => onChangeInstructions(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs text-navy-900 bg-white border border-navy-200 rounded-xl placeholder:text-navy-400 focus:outline-hidden focus:border-medical-500 focus:ring-1 focus:ring-medical-500 transition-colors leading-relaxed"
          />
          <div className="flex items-center justify-between text-[11px] text-navy-400 mt-1">
            <span>Special instructions or test prerequisites for the next visit</span>
            <span>{followUpInstructions ? `${followUpInstructions.length} chars` : 'Optional'}</span>
          </div>
        </div>

        {/* Status Preview Card */}
        {hasFollowUp && (
          <div className="p-3.5 rounded-xl bg-medical-50/60 border border-medical-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-navy-900">Follow-Up Scheduled:</span>
              {followUpPeriod && (
                <span className="font-bold text-medical-900 font-mono">
                  {followUpPeriod}
                </span>
              )}
              {followUpDate && (
                <span className="text-navy-700">
                  (Target Date: <strong>{new Date(followUpDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>)
                </span>
              )}
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Scheduled
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
