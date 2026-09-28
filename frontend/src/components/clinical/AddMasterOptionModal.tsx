import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { PlusCircle } from 'lucide-react';
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useToast } from '../../hooks/useToast';
import { masterDataService } from '../../services/masterDataService';
import type { MasterDataCategoryKey, MasterDataItem } from '../../types/masterData';

interface AddMasterOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryKey: MasterDataCategoryKey;
  initialName?: string;
  onItemCreated?: (item: MasterDataItem) => void;
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
  description?: string;
}

export const AddMasterOptionModal: React.FC<AddMasterOptionModalProps> = ({
  isOpen,
  onClose,
  categoryKey,
  initialName = '',
  onItemCreated,
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
      name: initialName,
      category: 'General',
      form: 'Tablet',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        name: initialName,
        category: 'General',
        form: 'Tablet',
      });
    }
  }, [isOpen, initialName, reset]);

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

  const currentTitle = categoryTitles[categoryKey] || 'Clinical Option';

  const onSubmit = async (data: FormValues) => {
    if (!data.name.trim()) return;
    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        sort_order: 0,
        is_active: true,
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
        categoryKey === 'dosages' ||
        categoryKey === 'instructions' ||
        categoryKey === 'follow-ups'
      ) {
        payload.urdu_label = data.urdu_label?.trim() || data.name.trim();
        if (categoryKey === 'frequencies') {
          payload.roman_urdu = data.roman_urdu?.trim() || null;
        }
      }

      const created = await masterDataService.createItem<MasterDataItem>(categoryKey, payload);
      success(`${currentTitle} "${created.name}" created successfully.`, 'Option Added');
      onItemCreated?.(created);
      onClose();
    } catch (err: unknown) {
      toastError(
        err instanceof Error ? err.message : `Failed to add ${currentTitle.toLowerCase()}.`,
        'Error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} maxWidth="md">
      <DialogHeader
        title={`Add New ${currentTitle}`}
        description={`Create a permanent custom ${currentTitle.toLowerCase()} option for clinical consultations.`}
        onClose={onClose}
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent className="space-y-4">
          {/* Option Name */}
          <Input
            label={`${currentTitle} Name`}
            id="name"
            placeholder={`Enter ${currentTitle.toLowerCase()} name...`}
            required
            error={errors.name?.message}
            {...register('name', { required: 'Name is required' })}
          />

          {/* Conditional Category for Symptoms */}
          {categoryKey === 'symptoms' && (
            <Select
              label="Symptom Category"
              id="category"
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
              {...register('category')}
            />
          )}

          {/* Conditional Category for Diagnostic Tests */}
          {categoryKey === 'diagnostic-tests' && (
            <Select
              label="Test Category"
              id="category"
              options={[
                { value: 'Laboratory', label: 'Laboratory' },
                { value: 'Imaging', label: 'Imaging (MRI / CT / X-Ray)' },
                { value: 'Electrophysiology', label: 'Electrophysiology (EEG / EMG / NCV)' },
                { value: 'Cardiovascular', label: 'Cardiovascular' },
                { value: 'General', label: 'General' },
                { value: 'Other', label: 'Other' },
              ]}
              {...register('category')}
            />
          )}

          {/* Conditional Fields for Neurological Examination */}
          {categoryKey === 'neurological-examinations' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Examination Category"
                id="category"
                placeholder="e.g. Motor Functions, Reflexes"
                required
                {...register('category', { required: 'Category is required' })}
              />
              <Input
                label="Specific Item (Optional)"
                id="item_name"
                placeholder="e.g. Right Upper Limb, CN VII"
                {...register('item_name')}
              />
            </div>
          )}

          {/* Conditional Fields for Medicines */}
          {categoryKey === 'medicines' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Generic Name (Formula)"
                  id="generic_name"
                  placeholder="e.g. Levetiracetam"
                  {...register('generic_name')}
                />
                <Input
                  label="Strength / Dosage"
                  id="strength"
                  placeholder="e.g. 500mg, 10mg/5ml"
                  {...register('strength')}
                />
              </div>
              <Select
                label="Dosage Form"
                id="form"
                options={[
                  { value: 'Tablet', label: 'Tablet' },
                  { value: 'Capsule', label: 'Capsule' },
                  { value: 'Syrup', label: 'Syrup' },
                  { value: 'Injection', label: 'Injection' },
                  { value: 'Drops', label: 'Drops' },
                  { value: 'Cream / Ointment', label: 'Cream / Ointment' },
                  { value: 'Inhaler / Spray', label: 'Inhaler / Spray' },
                  { value: 'Other', label: 'Other' },
                ]}
                {...register('form')}
              />
            </div>
          )}

          {/* Conditional Urdu Fields for Frequencies, Instructions, Follow-up, Dosages */}
          {(categoryKey === 'frequencies' ||
            categoryKey === 'instructions' ||
            categoryKey === 'follow-ups' ||
            categoryKey === 'dosages') && (
            <div className="space-y-4">
              <Input
                label="Urdu Label / Translation"
                id="urdu_label"
                placeholder="e.g. صبح و شام, کھانے کے بعد"
                helperText="Local Urdu phrasing for the prescription printout."
                {...register('urdu_label')}
              />
              {categoryKey === 'frequencies' && (
                <Input
                  label="Roman Urdu (Optional)"
                  id="roman_urdu"
                  placeholder="e.g. Subah aur Sham"
                  {...register('roman_urdu')}
                />
              )}
            </div>
          )}

          {/* Description */}
          <Input
            label="Clinical Description / Notes (Optional)"
            id="description"
            placeholder="Clinical context or instructions..."
            {...register('description')}
          />
        </DialogContent>

        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Add {currentTitle}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
};
