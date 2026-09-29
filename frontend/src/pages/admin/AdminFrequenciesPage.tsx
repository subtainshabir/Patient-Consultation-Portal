import React from 'react';
import { AdminMasterDataView } from '../../components/admin/AdminMasterDataView';

export const AdminFrequenciesPage: React.FC = () => {
  return (
    <AdminMasterDataView
      categoryKey="frequencies"
      title="Medicine Frequencies"
      subtitle="Prescription dosage intervals with bilingual Urdu labels and Roman Urdu equivalents."
      itemNameSingular="Frequency"
      hasUrduLabel={true}
      hasRomanUrdu={true}
    />
  );
};
