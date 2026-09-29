import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  Upload,
  Trash2,
  Building,
  User,
  Image as ImageIcon,
  FileText,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../hooks/useToast';
import { adminService } from '../../services/adminService';
import type { ClinicSettingUpdate } from '../../types/admin';

export const AdminSettingsPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoBlobUrl, setLogoBlobUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState<ClinicSettingUpdate>({
    doctor_name: '',
    doctor_name_urdu: '',
    doctor_title: 'Dr.',
    specialization: '',
    specialization_urdu: '',
    qualifications: '',
    registration_no: '',
    clinic_name: '',
    clinic_name_urdu: '',
    clinic_subtitle: '',
    clinic_phone: '',
    clinic_email: '',
    clinic_address: '',
  });

  // Load Settings
  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getSettings();
      setFormData({
        doctor_name: data.doctor_name || '',
        doctor_name_urdu: data.doctor_name_urdu || '',
        doctor_title: data.doctor_title || 'Dr.',
        specialization: data.specialization || '',
        specialization_urdu: data.specialization_urdu || '',
        qualifications: data.qualifications || '',
        registration_no: data.registration_no || '',
        clinic_name: data.clinic_name || '',
        clinic_name_urdu: data.clinic_name_urdu || '',
        clinic_subtitle: data.clinic_subtitle || '',
        clinic_phone: data.clinic_phone || '',
        clinic_email: data.clinic_email || '',
        clinic_address: data.clinic_address || '',
      });

      if (data.has_logo) {
        try {
          const blobUrl = await adminService.getLogoBlobUrl();
          setLogoBlobUrl(blobUrl);
        } catch {
          // logo blob load failed silently
        }
      } else {
        setLogoBlobUrl(null);
      }
    } catch {
      toastError('Failed to load clinic settings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Save Settings
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await adminService.updateSettings(formData);
      success('Clinic and doctor settings updated successfully.');
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message || 'Failed to save settings.';
      toastError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Logo File Change
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toastError('Invalid file type. Supported formats: PNG, JPEG, WebP.');
      return;
    }

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toastError('File size exceeds the 5MB limit.');
      return;
    }

    setIsUploadingLogo(true);
    try {
      await adminService.uploadLogo(file);
      success('Clinic logo uploaded and applied to prescription reports.');
      // Refresh blob url
      const blobUrl = await adminService.getLogoBlobUrl();
      setLogoBlobUrl(blobUrl);
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message || 'Failed to upload clinic logo.';
      toastError(msg);
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Remove Logo
  const handleRemoveLogo = async () => {
    if (!window.confirm('Remove the clinic logo from reports?')) return;
    try {
      await adminService.removeLogo();
      setLogoBlobUrl(null);
      success('Clinic logo removed.');
    } catch {
      toastError('Failed to remove clinic logo.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Doctor & Clinic Settings"
        description="Configure official practice credentials, clinic contact info, and logo used across the portal and generated PDF prescription reports."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Information Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Doctor Profile Card */}
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-3.5 px-5">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Doctor Information & Credentials
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Doctor Name (English) */}
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">
                      Doctor Full Name (English) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.doctor_name || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, doctor_name: e.target.value })
                      }
                      placeholder="e.g. Dr. Abdul Rauf"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  {/* Doctor Name (Urdu) */}
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 text-right block">
                      ڈاکٹر کا نام (اردو)
                    </label>
                    <input
                      type="text"
                      dir="rtl"
                      value={formData.doctor_name_urdu || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, doctor_name_urdu: e.target.value })
                      }
                      placeholder="مثلاً ڈاکٹر عبد الرؤف"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-urdu text-base text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  {/* Specialization (English) */}
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">
                      Specialization / Clinical Role *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.specialization || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, specialization: e.target.value })
                      }
                      placeholder="e.g. Consultant Neurologist"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  {/* Specialization (Urdu) */}
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 text-right block">
                      شعبہ تخصص (اردو)
                    </label>
                    <input
                      type="text"
                      dir="rtl"
                      value={formData.specialization_urdu || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, specialization_urdu: e.target.value })
                      }
                      placeholder="مثلاً کنسلٹنٹ نیورولوجسٹ"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-urdu text-base text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  {/* Qualifications */}
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">
                      Medical Qualifications *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.qualifications || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, qualifications: e.target.value })
                      }
                      placeholder="e.g. MBBS, FCPS (Neurology)"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  {/* PMC / Registration No */}
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">
                      PMC / PMDC Registration Number
                    </label>
                    <input
                      type="text"
                      value={formData.registration_no || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, registration_no: e.target.value })
                      }
                      placeholder="e.g. PMC 45892-P"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Clinic Details Card */}
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-3.5 px-5">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-600" />
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Clinic Details & Contact Information
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Clinic Name (English) */}
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Clinic Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.clinic_name || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, clinic_name: e.target.value })
                      }
                      placeholder="e.g. Dr. Rauf Neurology Clinic"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  {/* Clinic Name (Urdu) */}
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 text-right block">
                      کلینک کا نام (اردو)
                    </label>
                    <input
                      type="text"
                      dir="rtl"
                      value={formData.clinic_name_urdu || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, clinic_name_urdu: e.target.value })
                      }
                      placeholder="مثلاً ڈاکٹر رؤف نیورولوجی کلینک"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-urdu text-base text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  {/* Subtitle */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-semibold text-slate-700">
                      Clinic Header Subtitle / Tagline
                    </label>
                    <input
                      type="text"
                      value={formData.clinic_subtitle || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, clinic_subtitle: e.target.value })
                      }
                      placeholder="e.g. NEUROLOGY & BRAIN CARE CENTER"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">
                      Official Contact Phone *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.clinic_phone || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, clinic_phone: e.target.value })
                      }
                      placeholder="0300-1234567"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">
                      Official Contact Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.clinic_email || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, clinic_email: e.target.value })
                      }
                      placeholder="clinic@domain.com"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  {/* Address */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-semibold text-slate-700">
                      Clinic Physical Address *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={formData.clinic_address || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, clinic_address: e.target.value })
                      }
                      placeholder="e.g. Main Boulevard, Rawalpindi / Lahore, Pakistan"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSaving || isLoading}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white min-w-32 shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        {/* Right 1 Column: Logo Management & Live Header Preview */}
        <div className="space-y-6">
          {/* Logo Management Card */}
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-3.5 px-5">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <CardTitle className="text-sm font-bold text-slate-900">
                  Clinic Logo
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              <p className="text-slate-500">
                Uploaded logo appears automatically in the top header of generated A4 consultation PDF reports.
              </p>

              {/* Logo Preview or Empty State */}
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50/60 flex flex-col items-center justify-center min-h-[140px]">
                {logoBlobUrl ? (
                  <div className="space-y-3">
                    <img
                      src={logoBlobUrl}
                      alt="Clinic Logo Preview"
                      className="max-h-20 max-w-full object-contain mx-auto rounded shadow-xs bg-white p-1"
                    />
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        className="text-xs"
                      >
                        Change Logo
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveLogo}
                        disabled={isUploadingLogo}
                        className="text-xs text-rose-600 hover:bg-rose-50 border-rose-200"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-full bg-slate-200/80 text-slate-500 flex items-center justify-center mx-auto">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-medium text-slate-700">No logo uploaded</p>
                    <p className="text-[10px] text-slate-400">PNG, JPEG or WebP (max 5MB)</p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingLogo}
                      className="bg-emerald-600 hover:bg-emerald-700 text-xs"
                    >
                      {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
                    </Button>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </CardContent>
          </Card>

          {/* Live Header Preview Card */}
          <Card className="border-slate-200/80 shadow-xs bg-slate-900 text-slate-200">
            <CardHeader className="border-b border-slate-800 py-3 px-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <CardTitle className="text-xs font-bold text-white uppercase tracking-wider">
                  Live Report Header Preview
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-[11px]">
              <div className="bg-white text-slate-900 p-3 rounded-lg shadow-sm space-y-2">
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    {logoBlobUrl ? (
                      <img
                        src={logoBlobUrl}
                        alt="Logo"
                        className="w-8 h-8 object-contain rounded"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400">
                        Rx
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-xs text-navy-900 leading-tight">
                        {formData.clinic_name || 'Clinic Name'}
                      </p>
                      <p className="text-[9px] text-slate-500">
                        {formData.clinic_subtitle || 'Center of Excellence'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-[9px] text-slate-500">
                    <p>{formData.clinic_phone || 'Phone'}</p>
                    <p>{formData.clinic_email || 'Email'}</p>
                  </div>
                </div>

                <div className="pt-1">
                  <p className="font-bold text-xs text-slate-800">
                    {formData.doctor_name || 'Doctor Name'}
                  </p>
                  <p className="text-[10px] text-slate-600">
                    {formData.specialization || 'Specialization'} —{' '}
                    {formData.qualifications || 'Qualifications'}
                  </p>
                  {formData.registration_no && (
                    <p className="text-[9px] text-slate-400">
                      PMC: {formData.registration_no}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-[10px] text-slate-400 text-center">
                This header automatically formats on every Phase 8 prescription PDF report.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
