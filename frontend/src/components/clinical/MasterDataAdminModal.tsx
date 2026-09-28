import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useToast } from '../../hooks/useToast';
import { masterDataService } from '../../services/masterDataService';
import type { MasterDataCategoryKey, MasterDataItem } from '../../types/masterData';

interface MasterDataAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryKey: MasterDataCategoryKey;
  editItem?: MasterDataItem | null;
  onSaved: (item: MasterDataItem, isEdit: boolean) => void;
}

interface FormValues {
  name: string;
  category?: string;
  item_name?: string;
  generic_name?: string;
  strength?: string;
  form?: string;
  urdu_label?: string;
  roman_urdu?: string;
  sort_order: number;
  is_active: boolean | string;
  description?: string;
}

export const MasterDataAdminModal: React.FC<MasterDataAdminModalProps> = ({
  isOpen,
  onClose,
  categoryKey,
  editItem,
  onSaved,
}) => {
  const { success, error: toastError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: '',
      category: 'General',
      form: 'Tablet',
      sort_order: 0,
      is_active: 'true',
    },
  });

  const categoryTitles: Record<MasterDataCategoryKey, string> = {
    symptoms: 'Symptom',
    'patient-states': 'Patient State',
    'neurological-examinations': 'Neurological Exam Option',
    'diagnostic-tests': 'Diagnostic Test',
    medicines: 'Medicine',
    frequencies: 'Medicine Frequency',
    dosages: 'Medicine Dosage',
    instructions: 'Medicine Instruction',
    'follow-ups': 'Follow-Up Option',
  };

  const itemTitle = categoryTitles[categoryKey] || 'Clinical Master Item';

  useEffect(() => {
    if (isOpen) {
      if (editItem) {
        const anyItem = editItem as unknown as Record<string, unknown>;
        reset({
          name: editItem.name || '',
          category: (anyItem.category as string) || 'General',
          item_name: (anyItem.item_name as string) || '',
          generic_name: (anyItem.generic_name as string) || '',
          strength: (anyItem.strength as string) || '',
          form: (anyItem.form as string) || 'Tablet',
          urdu_label: (anyItem.urdu_label as string) || '',
          roman_urdu: (anyItem.roman_urdu as string) || '',
          sort_order: editItem.sort_order || 0,
          is_active: editItem.is_active ? 'true' : 'false',
          description: editItem.description || '',
        });
      } else {
        reset({
          name: '',
          category: 'General',
          item_name: '',
          generic_name: '',
          strength: '',
          form: 'Tablet',
          urdu_label: '',
          roman_urdu: '',
          sort_order: 0,
          is_active: 'true',
          description: '',
        });
      }
    }
  }, [isOpen, editItem, reset]);

  const onSubmit = async (data: FormValues) => {
    if (!data.name.trim()) return;
    setIsSubmitting(true);
    try {
      const isActiveBool =
        typeof data.is_active === 'boolean' ? data.is_active : data.is_active === 'true';

      const payload: Record<string, unknown> = {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        sort_order: Number(data.sort_order) || 0,
        is_active: isActiveBool,
      };

      if (categoryKey === 'symptoms' || categoryKey === 'diagnostic-tests') {
        payload.category = data.category?.trim() || 'General';
      } else if (categoryKey === 'neurological-examinations') {
        payload.category = data.category?.trim() || 'General Motor';
        payload.item_name = data.item_name?.trim() || null;
      } else if (categoryKey === 'medicines') {
        payload.generic_name = data.generic_name?.trim() || null;
        payload.strength = data.strength?.trim() || null;
        payload.form = data.form?.trim() || 'Tablet';
      } else if (
        categoryKey === 'frequencies' ||
        categoryKey === 'instructions' ||
        categoryKey === 'follow-ups'
      ) {
        payload.urdu_label = data.urdu_label?.trim() || data.name.trim();
        if (categoryKey === 'frequencies') {
          payload.roman_urdu = data.roman_urdu?.trim() || null;
        }
      } else if (categoryKey === 'dosages') {
        payload.urdu_label = data.urdu_label?.trim() || null;
      }

      let saved: MasterDataItem;
      if (editItem) {
        saved = await masterDataService.updateItem<MasterDataItem>(
          categoryKey,
          editItem.id,
          payload
        );
        success(`${itemTitle} updated successfully`);
        onSaved(saved, true);
      } else {
        saved = await masterDataService.createItem<MasterDataItem>(categoryKey, payload);
        success(`New ${itemTitle} added successfully`);
        onSaved(saved, false);
      }
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        `Failed to save ${itemTitle.toLowerCase()}`;
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} maxWidth="lg">
      <DialogHeader
        title={editItem ? `Edit ${itemTitle}` : `Add New ${itemTitle}`}
        description={`Configure clinical options for ${itemTitle.toLowerCase()} in consultations.`}
        onClose={onClose}
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent className="space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Item Name */}
          <Input
            label={`${itemTitle} Name`}
            required
            placeholder="e.g. Headache, 5/5, Paracetamol, etc."
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
          />

          {/* Symptoms Categories */}
          {categoryKey === 'symptoms' && (
            <Select
              label="Symptom Category"
              required
              {...register('category')}
              options={[
                { value: 'General', label: 'General' },
                { value: 'Pain', label: 'Pain' },
                { value: 'Motor', label: 'Motor' },
                { value: 'Sensory', label: 'Sensory' },
                { value: 'Cognitive', label: 'Cognitive' },
                { value: 'Speech', label: 'Speech' },
                { value: 'Visual', label: 'Visual' },
                { value: 'Vestibular', label: 'Vestibular' },
                { value: 'Cranial Nerve', label: 'Cranial Nerve' },
                { value: 'Stroke-related', label: 'Stroke-related' },
                { value: 'Other', label: 'Other' },
              ]}
            />
          )}

          {/* Diagnostic Test Categories */}
          {categoryKey === 'diagnostic-tests' && (
            <Select
              label="Test Category"
              required
              {...register('category')}
              options={[
                { value: 'Laboratory', label: 'Laboratory' },
                { value: 'Imaging', label: 'Imaging' },
                { value: 'Electrophysiology', label: 'Electrophysiology' },
                { value: 'Cardiovascular', label: 'Cardiovascular' },
                { value: 'Other', label: 'Other' },
              ]}
            />
          )}

          {/* Neurological Exam specific */}
          {categoryKey === 'neurological-examinations' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Examination Category"
                required
                {...register('category')}
                options={[
                  { value: 'Motor Functions', label: 'Motor Functions' },
                  { value: 'Muscle Tone', label: 'Muscle Tone' },
                  { value: 'Muscle Strength MRC', label: 'Muscle Strength MRC' },
                  { value: 'Straight Leg Raise (SLR)', label: 'Straight Leg Raise (SLR)' },
                  { value: 'Reflexes', label: 'Reflexes' },
                  { value: 'Plantar Response', label: 'Plantar Response' },
                  { value: 'Pupillary Reaction', label: 'Pupillary Reaction' },
                  { value: 'Speech Assessment', label: 'Speech Assessment' },
                  { value: 'Gait & Balance', label: 'Gait & Balance' },
                  { value: 'Coordination', label: 'Coordination' },
                  { value: 'Sensory Examination', label: 'Sensory Examination' },
                  { value: 'Cranial Nerves', label: 'Cranial Nerves' },
                  { value: 'Mental Status', label: 'Mental Status' },
                  { value: 'Cerebellar Function', label: 'Cerebellar Function' },
                  { value: 'Muscle Wasting', label: 'Muscle Wasting' },
                  { value: 'Abnormal Movements', label: 'Abnormal Movements' },
                  { value: 'Romberg Test', label: 'Romberg Test' },
                  { value: 'Nystagmus', label: 'Nystagmus' },
                  { value: 'Fundoscopy', label: 'Fundoscopy' },
                  { value: 'Meningeal Signs', label: 'Meningeal Signs' },
                  { value: 'Swallowing Function', label: 'Swallowing Function' },
                  { value: 'Neck & Hip Flexion', label: 'Neck & Hip Flexion' },
                  { value: 'General Examination', label: 'General Examination' },
                ]}
              />

              <Input
                label="Specific Item / Limb / Nerve"
                placeholder="e.g. Right Upper Limb, CN VII - Facial"
                {...register('item_name')}
              />
            </div>
          )}

          {/* Medicines specific */}
          {categoryKey === 'medicines' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Generic Name"
                placeholder="e.g. Paracetamol, Levetiracetam"
                {...register('generic_name')}
              />
              <Input
                label="Strength"
                placeholder="e.g. 500mg, 100mg"
                {...register('strength')}
              />
              <Select
                label="Form"
                required
                {...register('form')}
                options={[
                  { value: 'Tablet', label: 'Tablet' },
                  { value: 'Capsule', label: 'Capsule' },
                  { value: 'Syrup', label: 'Syrup' },
                  { value: 'Injection', label: 'Injection' },
                  { value: 'Drops', label: 'Drops' },
                  { value: 'Cream', label: 'Cream' },
                  { value: 'Inhaler', label: 'Inhaler' },
                  { value: 'Suspension', label: 'Suspension' },
                  { value: 'Other', label: 'Other' },
                ]}
              />
            </div>
          )}

          {/* Urdu Terminology (Frequencies, Instructions, Follow-ups, Dosages) */}
          {(categoryKey === 'frequencies' ||
            categoryKey === 'instructions' ||
            categoryKey === 'follow-ups' ||
            categoryKey === 'dosages') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Urdu Label (اردو)"
                placeholder="e.g. صبح و شام، کھانے کے بعد"
                dir="rtl"
                {...register('urdu_label')}
              />
              {categoryKey === 'frequencies' && (
                <Input
                  label="Roman Urdu (Optional)"
                  placeholder="e.g. Subah aur Sham"
                  {...register('roman_urdu')}
                />
              )}
            </div>
          )}

          {/* Sort order & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Sort Order"
              type="number"
              placeholder="0 (Lower shows first)"
              {...register('sort_order')}
            />
            <Select
              label="Status"
              {...register('is_active')}
              options={[
                { value: 'true', label: 'Active (Available in Consultations)' },
                { value: 'false', label: 'Inactive (Disabled / Historical Only)' },
              ]}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-navy-700">
              Clinical Notes / Description (Optional)
            </label>
            <textarea
              {...register('description')}
              rows={2}
              placeholder="Optional notes or clinical clarification..."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </DialogContent>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {editItem ? 'Save Changes' : 'Create Option'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
};
