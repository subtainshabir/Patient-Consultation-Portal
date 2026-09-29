import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Settings,
  ArrowRight,
  Database,
  Users,
  ClipboardList,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { adminService } from '../../services/adminService';
import { useToast } from '../../hooks/useToast';
import type { AdminDashboardStats } from '../../types/admin';

interface DashboardCategoryCard {
  key: string;
  name: string;
  route: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
  bgColor: string;
}

const DASHBOARD_CARDS: DashboardCategoryCard[] = [
  {
    key: 'symptoms',
    name: 'Symptoms',
    route: '/admin/symptoms',
    icon: Activity,
    description: 'Neurological symptoms & complaints',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
  },
  {
    key: 'patient_states',
    name: 'Patient States',
    route: '/admin/patient-states',
    icon: UserCheck,
    description: 'Clinical condition descriptors',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  {
    key: 'medicines',
    name: 'Medicines',
    route: '/admin/medicines',
    icon: Pill,
    description: 'Prescription catalog & strengths',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  {
    key: 'frequencies',
    name: 'Frequencies',
    route: '/admin/frequencies',
    icon: Clock,
    description: 'Urdu & English dosing intervals',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  {
    key: 'dosages',
    name: 'Dosages',
    route: '/admin/dosages',
    icon: Scale,
    description: 'Fractions & dosage quantities',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    key: 'instructions',
    name: 'Instructions',
    route: '/admin/instructions',
    icon: FileCheck,
    description: 'Urdu administration directions',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
  {
    key: 'diagnostic_tests',
    name: 'Diagnostic Tests',
    route: '/admin/diagnostic-tests',
    icon: FlaskConical,
    description: 'Labs, imaging & neurophysiology',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    key: 'neurological_examinations',
    name: 'Neurological Exams',
    route: '/admin/neurological-examinations',
    icon: Stethoscope,
    description: 'Motor, sensory & cranial nerve signs',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
  },
  {
    key: 'follow_ups',
    name: 'Follow-Up Options',
    route: '/admin/follow-ups',
    icon: CalendarClock,
    description: 'Standard recall intervals',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
  },
];

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { error: toastError } = useToast();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch {
      toastError('Failed to load admin statistics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Title & Refresh */}
      <PageHeader
        title="Admin Dashboard"
        description="Manage master data options, dropdown values, and clinic configuration used by the doctor portal."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStats}
              disabled={isLoading}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Stats</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/admin/settings')}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Clinic Settings</span>
            </Button>
          </div>
        }
      />

      {/* Top Level Summary Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Active Master Options</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {isLoading ? '...' : stats?.total_active_items ?? 0}
              </h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                Available in dropdowns
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Inactive Options</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {isLoading ? '...' : stats?.total_inactive_items ?? 0}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Hidden from new dropdowns
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Consultations</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {isLoading ? '...' : stats?.total_consultations ?? 0}
              </h3>
              <p className="text-[11px] text-blue-600 font-medium mt-0.5">
                Historical records preserved
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Patients</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {isLoading ? '...' : stats?.total_patients ?? 0}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Registered clinical patients
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 9 Master Data Category Management Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Master Data Dropdowns Control
            </h2>
            <p className="text-xs text-slate-500">
              Select a category to view, add, edit, or deactivate dropdown options.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DASHBOARD_CARDS.map((card) => {
            const Icon = card.icon;
            const categoryData = stats?.categories?.[card.key];
            const activeCount = categoryData?.active ?? 0;
            const inactiveCount = categoryData?.inactive ?? 0;

            return (
              <Card
                key={card.key}
                className="hover:border-slate-300 transition-all duration-150 cursor-pointer group shadow-xs hover:shadow-sm"
                onClick={() => navigate(card.route)}
              >
                <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${card.bgColor} ${card.color} flex items-center justify-center shrink-0 shadow-inner`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {card.name}
                        </h3>
                        <p className="text-xs text-slate-500">{card.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      {isLoading ? (
                        <div className="h-4 w-16 bg-slate-100 animate-pulse rounded" />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            {activeCount} active
                          </span>
                          {inactiveCount > 0 && (
                            <span className="text-[11px] text-slate-400">
                              • {inactiveCount} inactive
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 group-hover:translate-x-0.5 transition-transform">
                      <span>Manage</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Historical Data Architecture Banner */}
      <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-slate-200 border-none shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Historical Consultation Integrity Guard
                </h3>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Deactivating an option in the Admin Portal hides it from <strong>new consultations</strong> without corrupting or altering past consultations. Historical records and saved reports retain their exact values.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/medicines')}
                className="text-white border-slate-700 hover:bg-slate-700 text-xs"
              >
                Medicines Master
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/admin/symptoms')}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs border-none"
              >
                Symptoms Master
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
