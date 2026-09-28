import type { Gender } from '../types/patient';

export interface GenderOption {
  value: Gender;
  label: string;
}

export const GENDER_OPTIONS: GenderOption[] = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
  { value: 'Prefer not to specify', label: 'Prefer not to specify' },
];

export const PAKISTANI_CNIC_REGEX = /^\d{5}-?\d{7}-?\d{1}$/;
export const MOBILE_NUMBER_REGEX = /^(\+92|0)?3\d{2}-?\d{7}$|^(\+?\d{10,15})$/;
