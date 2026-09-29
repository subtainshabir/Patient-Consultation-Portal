import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Stethoscope,
  Search,
  X,
  Calendar,
  User,
  Pill,
  Activity,
  Eye,
  Edit3,
  Clock,
  Printer,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Loader2,
  CalendarClock,
} from 'lucide-react';

import { consultationService } from '../../services/consultationService';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonTable } from '../../components/ui/LoadingSkeleton';
import { PrescriptionReportModal } from '../../components/consultation/PrescriptionReportModal';
import { ConsultationDetailModal } from '../../components/consultation/ConsultationDetailModal';
import { cn } from '../../utils/cn';

export const ConsultationsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSearch = searchParams.get('q') || '';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [page, setPage] = useState(initialPage);

  // Modals for report preview and quick view
  const [reportModalConsultationId, setReportModalConsultationId] = useState<string | null>(null);
  const [detailModalConsultationId, setDetailModalConsultationId] = useState<string | null>(null);

  // Debounce search input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Sync URL search parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (page > 1) params.set('page', page.toString());
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, page, setSearchParams]);

  // Fetch paginated consultations
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['consultations-list', debouncedSearch, page],
    queryFn: () =>
      consultationService.getAllConsultations({
        search: debouncedSearch,
        page,
        page_size: 15,
      }),
  });

  const consultations = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.total_pages || 1;

  const handleClearSearch = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setPage(1);
  };

  const getFollowUpBadgeClass = (status?: string | null) => {
    switch (status) {
      case 'Overdue':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Scheduled':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'As Needed':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12">
      {/* ─── Page Header ─── */}
      <PageHeader
        title="Clinical Consultations"
        description="Search, review previous records, print prescriptions, and track follow-ups."
        breadcrumbs={[
          { label: 'Doctor Portal', href: '/dashboard' },
          { label: 'Consultations' },
        ]}
        actions={
          <Button
            variant="primary"
            onClick={() => navigate('/patients')}
            leftIcon={<UserPlus className="w-4 h-4" />}
            id="new-consultation-btn"
          >
            New Consultation
          </Button>
        }
      />

      {/* ─── Search & Filter Bar ─── */}
      <Card className="p-4 bg-white shadow-sm border-navy-100">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-navy-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by consultation ID, patient name, ID, or phone..."
              className="w-full pl-10 pr-9 py-2 text-xs border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 placeholder:text-navy-400"
              id="consultations-search-input"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-navy-400 hover:text-navy-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-navy-500 self-end sm:self-center">
            {isFetching && (
              <span className="flex items-center gap-1.5 text-medical-600 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Updating...</span>
              </span>
            )}
            <span>
              Showing <strong className="text-navy-800">{consultations.length}</strong> of{' '}
              <strong className="text-navy-800">{total}</strong> records
            </span>
          </div>
        </div>
      </Card>

      {/* ─── Consultations Table / Cards ─── */}
      {isLoading ? (
        <Card className="p-6">
          <SkeletonTable rows={8} columns={6} />
        </Card>
      ) : consultations.length === 0 ? (
        <Card className="p-12 text-center">
          <EmptyState
            icon={Stethoscope}
            title={debouncedSearch ? 'No consultations match your search' : 'No consultations recorded yet'}
            description={
              debouncedSearch
                ? `No clinical records found matching "${debouncedSearch}". Try a different keyword or clear the search.`
                : 'Start a consultation by selecting a patient from the patient directory.'
            }
            action={
              debouncedSearch ? (
                <Button variant="outline" size="sm" onClick={handleClearSearch}>
                  Clear Search
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/patients')}
                  leftIcon={<UserPlus className="w-4 h-4" />}
                >
                  Select Patient to Consult
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <Card className="overflow-hidden border border-navy-200 shadow-sm">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs text-navy-800">
              <thead className="bg-navy-50/70 border-b border-navy-200/80 text-navy-600 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th scope="col" className="px-5 py-3">Consultation</th>
                  <th scope="col" className="px-5 py-3">Patient</th>
                  <th scope="col" className="px-5 py-3">Clinical Findings</th>
                  <th scope="col" className="px-5 py-3">Prescription & Tests</th>
                  <th scope="col" className="px-5 py-3">Follow-Up</th>
                  <th scope="col" className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100 bg-white">
                {consultations.map((c) => (
                  <tr
                    key={c.consultation_id}
                    className="hover:bg-navy-50/40 transition-colors group"
                  >
                    {/* Consultation ID & Date */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-navy-950 group-hover:text-medical-700 transition-colors">
                          {c.consultation_id}
                        </span>
                        <span className="text-[11px] text-navy-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-navy-400" />
                          {new Date(c.consultation_date).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Patient Details */}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col">
                        <Link
                          to={`/patients/${c.patient_unique_id}`}
                          className="font-semibold text-navy-900 hover:text-medical-600 transition-colors flex items-center gap-1.5"
                        >
                          <User className="w-3.5 h-3.5 text-navy-400" />
                          <span>{c.patient_name}</span>
                        </Link>
                        <span className="font-mono text-[11px] text-navy-500 pl-5">
                          {c.patient_unique_id}
                        </span>
                      </div>
                    </td>

                    {/* Clinical Summary & Vitals */}
                    <td className="px-5 py-3.5 max-w-xs">
                      <div className="space-y-1">
                        {c.symptoms_summary && c.symptoms_summary.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {c.symptoms_summary.slice(0, 2).map((s, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded bg-medical-50 text-medical-800 text-[10px] font-medium border border-medical-200"
                              >
                                {s}
                              </span>
                            ))}
                            {c.symptoms_summary.length > 2 && (
                              <span className="px-1 py-0.5 rounded bg-navy-100 text-navy-600 text-[10px] font-medium">
                                +{c.symptoms_summary.length - 2} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-navy-400 italic">No symptoms noted</span>
                        )}

                        {c.has_vitals && c.bp_formatted && (
                          <div className="flex items-center gap-1 text-[11px] text-navy-600">
                            <Activity className="w-3 h-3 text-emerald-600" />
                            <span>BP: {c.bp_formatted}</span>
                            {c.pulse_rate && <span>• Pulse: {c.pulse_rate} bpm</span>}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Prescriptions & Diagnostic Tests */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex flex-col gap-1 text-[11px]">
                        <span className="inline-flex items-center gap-1 font-medium text-navy-800">
                          <Pill className="w-3.5 h-3.5 text-indigo-600" />
                          <span>
                            {c.prescription_count || 0}{' '}
                            {c.prescription_count === 1 ? 'Medicine' : 'Medicines'}
                          </span>
                        </span>
                        {Boolean(c.diagnostic_test_count && c.diagnostic_test_count > 0) && (
                          <span className="text-navy-500 pl-4">
                            {c.diagnostic_test_count} Tests Ordered
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Follow-Up Status */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border w-fit',
                            getFollowUpBadgeClass(c.follow_up_status)
                          )}
                        >
                          <Clock className="w-3 h-3" />
                          <span>{c.follow_up_status || 'No Follow-Up'}</span>
                        </span>
                        {c.follow_up_period && (
                          <span className="text-[11px] font-urdu text-navy-600 pl-1">
                            {c.follow_up_period}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Action Buttons */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Report & Print PDF */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReportModalConsultationId(c.consultation_id)}
                          title="Print / View PDF Prescription Report"
                          className="text-navy-600 hover:text-navy-950 hover:bg-navy-100"
                        >
                          <Printer className="w-3.5 h-3.5 text-navy-700" />
                          <span className="sr-only">Print</span>
                        </Button>

                        {/* Edit Consultation */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate(
                              `/patients/${c.patient_unique_id}/consultations/${c.consultation_id}/edit`
                            )
                          }
                          title="Edit Consultation"
                          className="text-navy-600 hover:text-navy-950 hover:bg-navy-100"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                          <span className="sr-only">Edit</span>
                        </Button>

                        {/* Open Consultation Page */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigate(
                              `/patients/${c.patient_unique_id}/consultations/${c.consultation_id}`
                            )
                          }
                          className="text-xs text-navy-800"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          <span>View</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-navy-100">
            {consultations.map((c) => (
              <div key={c.consultation_id} className="p-4 space-y-3 bg-white">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-navy-950">
                      {c.consultation_id}
                    </span>
                    <div className="text-[11px] text-navy-500 mt-0.5">
                      {new Date(c.consultation_date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>

                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                      getFollowUpBadgeClass(c.follow_up_status)
                    )}
                  >
                    {c.follow_up_status || 'No Follow-Up'}
                  </span>
                </div>

                {/* Patient */}
                <div className="bg-navy-50/60 p-2.5 rounded-lg text-xs">
                  <div className="font-semibold text-navy-900">{c.patient_name}</div>
                  <div className="font-mono text-[11px] text-navy-500">{c.patient_unique_id}</div>
                </div>

                {/* Summary */}
                <div className="flex flex-wrap gap-2 text-xs text-navy-700">
                  <span className="flex items-center gap-1">
                    <Pill className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{c.prescription_count || 0} Meds</span>
                  </span>
                  {c.bp_formatted && (
                    <span className="flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{c.bp_formatted}</span>
                    </span>
                  )}
                  {c.follow_up_period && (
                    <span className="flex items-center gap-1 font-urdu text-navy-600">
                      <CalendarClock className="w-3.5 h-3.5 text-navy-400" />
                      <span>{c.follow_up_period}</span>
                    </span>
                  )}
                </div>

                {/* Mobile Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-navy-100">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setReportModalConsultationId(c.consultation_id)}
                    leftIcon={<Printer className="w-3.5 h-3.5" />}
                  >
                    Print
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() =>
                      navigate(
                        `/patients/${c.patient_unique_id}/consultations/${c.consultation_id}/edit`
                      )
                    }
                    leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() =>
                      navigate(
                        `/patients/${c.patient_unique_id}/consultations/${c.consultation_id}`
                      )
                    }
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* ─── Pagination Bar ─── */}
          {totalPages > 1 && (
            <div className="px-5 py-3.5 bg-navy-50/40 border-t border-navy-200/80 flex items-center justify-between text-xs text-navy-600">
              <span>
                Page <strong className="text-navy-900">{page}</strong> of{' '}
                <strong className="text-navy-900">{totalPages}</strong>
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ─── Prescription Report & PDF Modal ─── */}
      <PrescriptionReportModal
        consultationId={reportModalConsultationId}
        isOpen={!!reportModalConsultationId}
        onClose={() => setReportModalConsultationId(null)}
      />

      {/* ─── Quick View Consultation Detail Modal ─── */}
      <ConsultationDetailModal
        consultationId={detailModalConsultationId}
        isOpen={!!detailModalConsultationId}
        onClose={() => setDetailModalConsultationId(null)}
        allConsultations={consultations}
      />
    </div>
  );
};
