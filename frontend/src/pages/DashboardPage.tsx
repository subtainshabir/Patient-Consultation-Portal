import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { patientService } from '../services/patientService';
import {
  Users,
  CalendarCheck,
  CalendarClock,
  Clock,
  UserPlus,
  Stethoscope,
  Search,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';

import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '../components/ui/Dialog';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { SearchableSelect, type SearchableOption } from '../components/ui/SearchableSelect';
import { MultiSelect, type MultiSelectOption } from '../components/ui/MultiSelect';
import { ResponsiveTable } from '../components/ui/ResponsiveTable';
import { Input } from '../components/ui/Input';

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  phaseBadge: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  phaseBadge,
}) => {
  return (
    <Card className="hover:shadow-card-hover transition-all duration-200">
      <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">{title}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-navy-950 tracking-tight">{value}</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-medical-50 text-medical-700 border border-medical-200/60 shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <div className="pt-3 border-t border-navy-100/70 flex items-center justify-between text-xs text-navy-500">
          <span className="truncate">{description}</span>
          <span className="shrink-0 px-2 py-0.5 rounded-full bg-navy-100 text-navy-600 font-semibold text-[10px]">
            {phaseBadge}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError, info, warning } = useToast();
  const navigate = useNavigate();

  // Test states for Component Foundation Interactive Showcase
  const [isDemoDialogOpen, setIsDemoDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedSearchItem, setSelectedSearchItem] = useState('');
  const [selectedMultiItems, setSelectedMultiItems] = useState<string[]>(['symptom_1', 'symptom_2']);
  const [showFoundationShowcase, setShowFoundationShowcase] = useState(true);

  // Live real patient statistics from database
  const { data: patientStats } = useQuery({
    queryKey: ['dashboard-patient-stats'],
    queryFn: () => patientService.getPatients({ page: 1, page_size: 1 }),
  });

  // Sample master-data options for SearchableSelect & MultiSelect demonstration
  const sampleMedicineOptions: SearchableOption[] = [
    { value: 'med_1', label: 'Levetiracetam 500mg', category: 'Antiepileptic', description: 'Tablets / Oral' },
    { value: 'med_2', label: 'Pregabalin 75mg', category: 'Neuropathic Pain', description: 'Capsules' },
    { value: 'med_3', label: 'Gabapentin 300mg', category: 'Anticonvulsant', description: 'Capsules' },
    { value: 'med_4', label: 'Topiramate 50mg', category: 'Migraine Prophylaxis', description: 'Tablets' },
    { value: 'med_5', label: 'Sodium Valproate 500mg', category: 'Antiepileptic', description: 'CR Tablets' },
  ];

  const sampleSymptomOptions: MultiSelectOption[] = [
    { value: 'symptom_1', label: 'Severe Throbbing Headache', category: 'Cranial' },
    { value: 'symptom_2', label: 'Episodes of Dizziness / Vertigo', category: 'Vestibular' },
    { value: 'symptom_3', label: 'Focal Motor Seizures', category: 'Epilepsy' },
    { value: 'symptom_4', label: 'Bilateral Tremors', category: 'Movement' },
    { value: 'symptom_5', label: 'Peripheral Numbness & Tingling', category: 'Sensory' },
  ];

  const sampleTableData = [
    { id: 'SYS-01', component: 'Authentication & JWT', status: 'Operational', phase: 'Phase 1' },
    { id: 'SYS-02', component: 'Responsive Shell & Drawer', status: 'Operational', phase: 'Phase 1' },
    { id: 'SYS-03', component: 'PostgreSQL DB Architecture', status: 'Connected / Ready', phase: 'Phase 1' },
    { id: 'SYS-04', component: 'Patient Registry & Profiles', status: 'Operational', phase: 'Phase 2' },
  ];

  const tableColumns = [
    { key: 'id', header: 'Module ID' },
    { key: 'component', header: 'System Component' },
    {
      key: 'status',
      header: 'Status',
      render: (item: (typeof sampleTableData)[0]) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            item.status === 'Operational'
              ? 'bg-emerald-100 text-emerald-800'
              : item.status.includes('Ready')
              ? 'bg-medical-100 text-medical-800'
              : 'bg-navy-100 text-navy-700'
          }`}
        >
          {item.status}
        </span>
      ),
    },
    { key: 'phase', header: 'Target Phase' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ─── PAGE HEADER & GREETING (Section 20) ─── */}
      <PageHeader
        title={`Welcome back, ${user?.full_name || 'Dr. Rauf'}`}
        description="Here is an overview of your clinic portal. System foundation is active and prepared for clinical modules."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Dashboard' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFoundationShowcase((prev) => !prev)}
              leftIcon={<Layers className="w-4 h-4 text-medical-600" />}
            >
              {showFoundationShowcase ? 'Hide Component Workbench' : 'UI Component Workbench'}
            </Button>
          </div>
        }
      />

      {/* ─── STATISTICS CARDS (Section 21 - No Fake Clinical Data) ─── */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          Clinic Statistics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Patients"
            value={patientStats ? patientStats.total.toString() : '0'}
            description={
              patientStats && patientStats.total > 0
                ? `${patientStats.total} registered in clinical directory`
                : 'No patients registered yet'
            }
            icon={Users}
            phaseBadge="Active"
          />
          <StatCard
            title="Today's Consultations"
            value="—"
            description="Consultation module available in Phase 3"
            icon={CalendarCheck}
            phaseBadge="Phase 3"
          />
          <StatCard
            title="Upcoming Follow-ups"
            value="—"
            description="Appointment scheduling in future phase"
            icon={CalendarClock}
            phaseBadge="Phase 3"
          />
          <StatCard
            title="Recent Patients"
            value={patientStats && patientStats.total > 0 ? `${Math.min(patientStats.total, 5)}` : '—'}
            description={
              patientStats && patientStats.total > 0
                ? 'Active patient records on file'
                : 'Patient history available in Phase 2'
            }
            icon={Clock}
            phaseBadge="Active"
          />
        </div>
      </section>

      {/* ─── QUICK ACTIONS AREA (Section 22) ─── */}
      <section aria-labelledby="quick-actions-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="quick-actions-heading" className="text-base font-bold text-navy-950 tracking-tight">
            Quick Actions
          </h2>
          <span className="text-xs text-navy-500">Clinical workflows & registry</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Action 1: Register Patient */}
          <Card className="hover:border-medical-300 transition-all group">
            <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-medical-50 border border-medical-200 text-medical-700 flex items-center justify-center shrink-0 group-hover:bg-medical-600 group-hover:text-white transition-colors">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-navy-900">Register Patient</h3>
                  <p className="text-xs text-navy-500 mt-0.5 leading-relaxed">
                    Create unique Patient ID, record basic demographics and contact details.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/patients/new')}
                className="w-full justify-between group-hover:border-medical-500"
              >
                <span>Register Patient</span>
                <span className="text-[10px] uppercase font-bold text-medical-700 bg-medical-50 px-1.5 py-0.5 rounded">
                  Active
                </span>
              </Button>
            </CardContent>
          </Card>

          {/* Action 2: New Consultation */}
          <Card className="hover:border-medical-300 transition-all group">
            <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-medical-50 border border-medical-200 text-medical-700 flex items-center justify-center shrink-0 group-hover:bg-medical-600 group-hover:text-white transition-colors">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-navy-900">New Consultation</h3>
                  <p className="text-xs text-navy-500 mt-0.5 leading-relaxed">
                    Select a patient from the directory to start a clinical consultation.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/patients')}
                className="w-full justify-between group-hover:border-medical-500"
              >
                <span>Select Patient</span>
                <span className="text-[10px] uppercase font-bold text-navy-400">Phase 3</span>
              </Button>
            </CardContent>
          </Card>

          {/* Action 3: Search Patient */}
          <Card className="hover:border-medical-300 transition-all group">
            <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-medical-50 border border-medical-200 text-medical-700 flex items-center justify-center shrink-0 group-hover:bg-medical-600 group-hover:text-white transition-colors">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-navy-900">Search Patient</h3>
                  <p className="text-xs text-navy-500 mt-0.5 leading-relaxed">
                    Fast lookup by Patient ID (DRN-XXXXXX), CNIC, mobile, or name.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/patients')}
                className="w-full justify-between group-hover:border-medical-500"
              >
                <span>Search Directory</span>
                <span className="text-[10px] uppercase font-bold text-medical-700 bg-medical-50 px-1.5 py-0.5 rounded">
                  Active
                </span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ─── RECENT ACTIVITY EMPTY STATE (Section 23) ─── */}
      <section aria-labelledby="activity-heading" className="space-y-3">
        <h2 id="activity-heading" className="text-base font-bold text-navy-950 tracking-tight">
          Recent Clinical Activity
        </h2>
        <EmptyState
          icon={Activity}
          title="No recent activity"
          description="Patient and consultation activity will appear here once clinical registrations begin in Phase 2."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => info('Clinical activity tracking is activated in Phase 2.', 'Information')}
            >
              Learn about Phase 2
            </Button>
          }
        />
      </section>

      {/* ─── REUSABLE UI COMPONENT FOUNDATION WORKBENCH ─── */}
      {showFoundationShowcase && (
        <section aria-labelledby="workbench-heading" className="space-y-4 pt-4 border-t border-navy-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-medical-50 border border-medical-200 text-medical-800 text-xs font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                Phase 1 Specification Verification
              </div>
              <h2 id="workbench-heading" className="text-lg font-bold text-navy-950 tracking-tight">
                Reusable Component Architecture Workbench
              </h2>
            </div>
            <p className="text-xs text-navy-500 max-w-sm">
              Verify Buttons, Inputs, SearchableSelect (+ Add manually), MultiSelect chips, Dialogs,
              Confirmation, Toasts, and Responsive Table.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Searchable Select & MultiSelect Foundation (Sections 25 & 26) */}
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Clinical Select Primitives</CardTitle>
                  <CardDescription>
                    Architecture for future Master Data (Medicines, Symptoms, Tests, Dosages)
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* SearchableSelect with "+ Add manually" */}
                <SearchableSelect
                  label="Searchable Select Foundation (e.g. Medicine Selection)"
                  placeholder="Search clinical medicines..."
                  options={sampleMedicineOptions}
                  value={selectedSearchItem}
                  onChange={(val) => setSelectedSearchItem(val)}
                  onAddNew={(query) => {
                    info(`Opening manual custom entry for: "${query}"`, 'Manual Clinical Entry');
                  }}
                  addNewLabel="+ Enter medicine manually"
                  helperText="Supports live filtering, item selection, and '+ Add manually' fallback (Section 25 & 53)."
                />

                {/* MultiSelect with Removable Chips */}
                <MultiSelect
                  label="Multi-Select Foundation (e.g. Symptoms / Findings)"
                  placeholder="Select symptoms..."
                  options={sampleSymptomOptions}
                  values={selectedMultiItems}
                  onChange={(vals) => setSelectedMultiItems(vals)}
                  onAddNew={(query) => {
                    info(`Custom symptom request: "${query}"`, 'Manual Entry');
                  }}
                  addNewLabel="+ Add custom symptom"
                  helperText="Removable chips/tags with keyboard & touch accessibility (Section 26)."
                />
              </CardContent>
            </Card>

            {/* Modal, Dialog & Toast Notification Triggers (Sections 32, 33, 34) */}
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Dialogs & Notification Primitives</CardTitle>
                  <CardDescription>
                    Accessible modal overlays, destructive confirmation, and toast messages
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-navy-600 leading-relaxed">
                  Test the accessible modal dialogs and non-blocking toast notifications:
                </p>

                {/* Dialog buttons */}
                <div className="flex flex-wrap gap-2.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDemoDialogOpen(true)}
                  >
                    Open Accessible Dialog
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsConfirmDialogOpen(true)}
                  >
                    Test Confirmation Dialog
                  </Button>
                </div>

                {/* Toast Notification Buttons */}
                <div className="pt-3 border-t border-navy-100">
                  <p className="text-xs font-semibold text-navy-700 mb-2">Toast Notifications (Section 32):</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => success('Successfully saved.', 'Record Saved')}
                      className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                    >
                      Success Toast
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => toastError('Unable to save changes.', 'Operation Failed')}
                      className="bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200"
                    >
                      Error Toast
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => info('This feature will be available in a future phase.', 'Information')}
                      className="bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200"
                    >
                      Info Toast
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => warning('Please review patient vitals before submitting.', 'Clinical Caution')}
                      className="bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                    >
                      Warning Toast
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Responsive Table Demonstration (Section 44) */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Responsive Table Foundation (Section 44)</CardTitle>
                <CardDescription>
                  Renders standard table on desktop and transforms automatically into comfortable cards on mobile
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveTable
                columns={tableColumns}
                data={sampleTableData}
                keyExtractor={(item) => item.id}
                mobileLayout="cards"
              />
            </CardContent>
          </Card>
        </section>
      )}

      {/* ─── ACCESSIBLE DEMO DIALOG (Section 33) ─── */}
      <Dialog isOpen={isDemoDialogOpen} onClose={() => setIsDemoDialogOpen(false)}>
        <DialogHeader
          title="Clinical Component Dialog"
          description="Accessible modal component with keyboard ESC handling, backdrop blur, and focus management."
          onClose={() => setIsDemoDialogOpen(false)}
        />
        <DialogContent className="space-y-4">
          <p className="text-sm text-navy-700 leading-relaxed">
            This reusable dialog component will be utilized in later phases for custom medicine entry,
            dosage adjustments, patient notes, and clinical actions.
          </p>
          <Input
            label="Sample Clinical Field"
            placeholder="e.g. Additional clinical remark"
            helperText="Accessible form field within modal dialog."
          />
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDemoDialogOpen(false)}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setIsDemoDialogOpen(false);
              success('Dialog action completed.');
            }}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </Dialog>

      {/* ─── CONFIRMATION DIALOG (Section 34) ─── */}
      <ConfirmationDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={() => {
          setIsConfirmDialogOpen(false);
          warning('Confirmation action registered.', 'Action Confirmed');
        }}
        title="Are you sure?"
        message="This action cannot be undone. In later phases, this confirmation pattern will protect critical clinical records."
        confirmLabel="Confirm Action"
        cancelLabel="Cancel"
        isDestructive={true}
      />
    </div>
  );
};
