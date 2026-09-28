import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  UserPlus,
  Search,
  X,
  Users,
  ChevronRight,
  Phone,
  Loader2,
} from 'lucide-react';

import { patientService } from '../../services/patientService';
import type { Patient } from '../../types/patient';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonTable } from '../../components/ui/LoadingSkeleton';
import { cn } from '../../utils/cn';

export const PatientListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSearch = searchParams.get('q') || '';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const initialStatus = searchParams.get('status') || 'active'; // 'active' | 'all' | 'inactive'
  const initialGender = searchParams.get('gender') || 'all';
  const initialSort = searchParams.get('sort') || 'newest';

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [page, setPage] = useState(initialPage);
  const [statusFilter, setStatusFilter] = useState<'active' | 'all' | 'inactive'>(
    initialStatus as 'active' | 'all' | 'inactive'
  );
  const [genderFilter, setGenderFilter] = useState<string>(initialGender);
  const [sortOption, setSortOption] = useState<string>(initialSort);

  // Debounce search query (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to first page on search change
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Sync URL search params
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (page > 1) params.set('page', page.toString());
    if (statusFilter !== 'active') params.set('status', statusFilter);
    if (genderFilter !== 'all') params.set('gender', genderFilter);
    if (sortOption !== 'newest') params.set('sort', sortOption);
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, page, statusFilter, genderFilter, sortOption, setSearchParams]);

  const isActiveParam =
    statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : null;

  // Derive sort_by and sort_order from sortOption
  const sortMap: Record<string, { by: string; order: 'asc' | 'desc' }> = {
    newest: { by: 'created_at', order: 'desc' },
    oldest: { by: 'created_at', order: 'asc' },
    name_asc: { by: 'full_name', order: 'asc' },
    name_desc: { by: 'full_name', order: 'desc' },
  };
  const activeSort = sortMap[sortOption] || sortMap.newest;

  // TanStack Query for patients
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['patients', debouncedSearch, page, statusFilter, genderFilter, sortOption],
    queryFn: () =>
      patientService.getPatients({
        search: debouncedSearch,
        page,
        page_size: 10,
        is_active: isActiveParam,
        gender: genderFilter !== 'all' ? genderFilter : undefined,
        sort_by: activeSort.by,
        sort_order: activeSort.order,
      }),
  });

  const patients = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.total_pages || 1;

  const handleClearSearch = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setStatusFilter('active');
    setGenderFilter('all');
    setSortOption('newest');
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ─── PAGE HEADER (Section 13) ─── */}
      <PageHeader
        title="Patients"
        description="Manage registered patients and access their comprehensive consultation history."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Patients' }]}
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/patients/new')}
            leftIcon={<UserPlus className="w-4 h-4" />}
            className="shadow-sm"
          >
            Register New Patient
          </Button>
        }
      />

      {/* ─── SEARCH & FILTER BAR (Section 11, 12, 28, 44 & 45) ─── */}
      <Card className="p-4 shadow-sm border-navy-200/80 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Prominent Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-navy-400">
              {isFetching ? (
                <Loader2 className="w-4 h-4 animate-spin text-medical-600" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search patient by name, ID (e.g. DRN-000001), mobile, or CNIC..."
              className={cn(
                'w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border bg-navy-50/50 text-navy-900 transition-colors',
                'placeholder:text-navy-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500',
                'border-navy-200'
              )}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-navy-400 hover:text-navy-700"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter Tabs (Section 45) */}
          <div className="inline-flex rounded-xl bg-navy-100 p-1 shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => {
                setStatusFilter('active');
                setPage(1);
              }}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                statusFilter === 'active'
                  ? 'bg-white text-navy-950 shadow-sm'
                  : 'text-navy-600 hover:text-navy-950'
              )}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setPage(1);
              }}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                statusFilter === 'all'
                  ? 'bg-white text-navy-950 shadow-sm'
                  : 'text-navy-600 hover:text-navy-950'
              )}
            >
              All Records
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('inactive');
                setPage(1);
              }}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                statusFilter === 'inactive'
                  ? 'bg-white text-navy-950 shadow-sm'
                  : 'text-navy-600 hover:text-navy-950'
              )}
            >
              Deactivated
            </button>
          </div>
        </div>

        {/* Secondary Filter Row: Gender Filter + Useful Sorting (Section 28 & 45) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-navy-100 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Gender Filter (Section 45) */}
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-navy-500">Gender:</span>
              <select
                value={genderFilter}
                onChange={(e) => {
                  setGenderFilter(e.target.value);
                  setPage(1);
                }}
                className="py-1 px-2.5 rounded-lg border border-navy-200 bg-white text-navy-800 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-medical-500"
              >
                <option value="all">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to specify">Prefer not to specify</option>
              </select>
            </div>

            {/* Sorting Dropdown (Section 28) */}
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-navy-500">Sort by:</span>
              <select
                value={sortOption}
                onChange={(e) => {
                  setSortOption(e.target.value);
                  setPage(1);
                }}
                className="py-1 px-2.5 rounded-lg border border-navy-200 bg-white text-navy-800 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-medical-500"
              >
                <option value="newest">Newest registered</option>
                <option value="oldest">Oldest registered</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
              </select>
            </div>
          </div>

          {(searchTerm || statusFilter !== 'active' || genderFilter !== 'all' || sortOption !== 'newest') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-medical-700 hover:text-medical-900 font-semibold hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </Card>

      {/* ─── DATA DISPLAY: TABLE (Desktop) & CARDS (Mobile) ─── */}
      {isLoading ? (
        <SkeletonTable rows={6} columns={6} />
      ) : error ? (
        <Card className="p-8 text-center bg-rose-50/40 border-rose-200">
          <p className="text-sm font-semibold text-rose-900">Failed to load patients.</p>
          <p className="text-xs text-rose-700 mt-1 mb-4">
            An error occurred while connecting to the clinic database.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try Again
          </Button>
        </Card>
      ) : patients.length === 0 ? (
        /* Empty State */
        debouncedSearch ? (
          <EmptyState
            icon={Search}
            title="No patients found"
            description={`We couldn't find any patient matching "${debouncedSearch}".`}
            action={
              <Button variant="outline" size="sm" onClick={handleClearSearch}>
                Clear Search
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Users}
            title="No patients registered yet"
            description="Patients registered in the system will appear here. Begin by registering Dr. Rauf's first neurology patient."
            action={
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/patients/new')}
                leftIcon={<UserPlus className="w-4 h-4" />}
              >
                Register First Patient
              </Button>
            }
          />
        )
      ) : (
        <div className="space-y-4">
          {/* DESKTOP TABLE VIEW (Section 14) */}
          <div className="hidden md:block bg-white rounded-2xl border border-navy-200/90 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-navy-50/80 border-b border-navy-200/80 text-navy-700 text-xs font-semibold uppercase tracking-wider">
                    <th scope="col" className="px-5 py-3.5">
                      Patient ID
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Full Name
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Age
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Gender
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Mobile Number
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      CNIC
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Status
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-100/80 text-sm">
                  {patients.map((patient: Patient) => (
                    <tr
                      key={patient.patient_id}
                      onClick={() => navigate(`/patients/${patient.patient_id}`)}
                      className="hover:bg-navy-50/60 transition-colors cursor-pointer group"
                    >
                      {/* Patient ID */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-md bg-medical-50 text-medical-800 border border-medical-200/70">
                          {patient.patient_id}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="px-5 py-3.5 font-semibold text-navy-950 whitespace-nowrap">
                        {patient.full_name}
                      </td>

                      {/* Age */}
                      <td className="px-5 py-3.5 text-navy-700 whitespace-nowrap">
                        {patient.age} yrs
                      </td>

                      {/* Gender */}
                      <td className="px-5 py-3.5 text-navy-700 whitespace-nowrap">
                        {patient.gender}
                      </td>

                      {/* Mobile */}
                      <td className="px-5 py-3.5 font-mono text-navy-700 whitespace-nowrap">
                        {patient.mobile_number}
                      </td>

                      {/* CNIC */}
                      <td className="px-5 py-3.5 font-mono text-xs text-navy-500 whitespace-nowrap">
                        {patient.cnic || '—'}
                      </td>

                      {/* Status (Section 25) */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold',
                            patient.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          )}
                        >
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              patient.is_active ? 'bg-emerald-500' : 'bg-rose-500'
                            )}
                          />
                          {patient.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/patients/${patient.patient_id}`);
                          }}
                          rightIcon={
                            <ChevronRight className="w-4 h-4 text-navy-400 group-hover:text-medical-600 group-hover:translate-x-0.5 transition-all" />
                          }
                          className="text-medical-700 font-medium hover:bg-medical-50"
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE CARDS VIEW (Section 15) */}
          <div className="md:hidden flex flex-col gap-3">
            {patients.map((patient: Patient) => (
              <Card
                key={patient.patient_id}
                onClick={() => navigate(`/patients/${patient.patient_id}`)}
                className="hover:border-medical-300 transition-all cursor-pointer active:scale-[0.99]"
              >
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-md bg-medical-50 text-medical-800 border border-medical-200">
                      {patient.patient_id}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold',
                        patient.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      )}
                    >
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          patient.is_active ? 'bg-emerald-500' : 'bg-rose-500'
                        )}
                      />
                      {patient.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-navy-950">{patient.full_name}</h3>
                    <p className="text-xs text-navy-500 mt-0.5">
                      {patient.age} years • {patient.gender}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-navy-100 text-xs text-navy-600">
                    <div className="flex items-center gap-1.5 font-mono">
                      <Phone className="w-3.5 h-3.5 text-navy-400" />
                      <span>{patient.mobile_number}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/patients/${patient.patient_id}`);
                      }}
                      rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                      className="py-1 px-2.5 text-xs text-medical-700"
                    >
                      View Patient
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ─── PAGINATION BAR ─── */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <p className="text-xs text-navy-500">
                Showing{' '}
                <span className="font-semibold text-navy-800">
                  {(page - 1) * 10 + 1}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-navy-800">
                  {Math.min(page * 10, total)}
                </span>{' '}
                of <span className="font-semibold text-navy-800">{total}</span> patients
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isFetching}
                >
                  Previous
                </Button>
                <span className="text-xs font-semibold px-2 text-navy-700">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isFetching}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
