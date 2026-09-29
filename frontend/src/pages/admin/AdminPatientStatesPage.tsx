import React from 'react';
import { AdminMasterDataView } from '../../components/admin/AdminMasterDataView';

export const AdminPatientStatesPage: React.FC = () => {
  return (
    <AdminMasterDataView
      categoryKey="patient-states"
      title="Patient States Master Data"
      subtitle="Standardized clinical status descriptors (Stable, Acute, Improving, Post-stroke, etc.)."
      itemNameSingular="Patient State"
    />
  );
};
