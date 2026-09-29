import React from 'react';
import { AdminMasterDataView } from '../../components/admin/AdminMasterDataView';

export const AdminDiagnosticTestsPage: React.FC = () => {
  return (
    <AdminMasterDataView
      categoryKey="diagnostic-tests"
      title="Diagnostic Tests Master Data"
      subtitle="Laboratory blood panels, neuroimaging (MRI/CT), electrophysiology (EEG/EMG), and Doppler ultrasound."
      itemNameSingular="Diagnostic Test"
      hasCategory={true}
      categoriesList={[
        'Imaging',
        'Laboratory',
        'Electrophysiology',
        'Cardiovascular',
      ]}
    />
  );
};
