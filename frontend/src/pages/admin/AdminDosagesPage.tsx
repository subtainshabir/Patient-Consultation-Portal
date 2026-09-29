import React from 'react';
import { AdminMasterDataView } from '../../components/admin/AdminMasterDataView';

export const AdminDosagesPage: React.FC = () => {
  return (
    <AdminMasterDataView
      categoryKey="dosages"
      title="Medicine Dosages"
      subtitle="Prescription dosage quantities, fractions (¼, ½, 1, 1½, 2), and Urdu representations."
      itemNameSingular="Dosage Option"
      hasUrduLabel={true}
    />
  );
};
