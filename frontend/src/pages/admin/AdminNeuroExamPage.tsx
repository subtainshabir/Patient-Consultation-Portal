import React from 'react';
import { AdminMasterDataView } from '../../components/admin/AdminMasterDataView';

export const AdminNeuroExamPage: React.FC = () => {
  return (
    <AdminMasterDataView
      categoryKey="neurological-examinations"
      title="Neurological Examination Options"
      subtitle="Predefined clinical options organized by examination category: Motor Functions, Tone, MRC Strength, Reflexes, Cranial Nerves, Sensory, and Balance."
      itemNameSingular="Examination Option"
      hasCategory={true}
      hasItemName={true}
      categoriesList={[
        'Motor Functions',
        'Muscle Tone',
        'Muscle Strength',
        'SLR',
        'Reflexes',
        'Plantar Response',
        'Pupils',
        'Speech Assessment',
        'Gait & Balance',
        'Coordination',
        'Sensory Examination',
        'Cranial Nerves',
        'Mental Status',
        'Cerebellar Function',
        'Muscle Wasting',
        'Abnormal Movements',
        'Romberg Test',
        'Nystagmus',
        'Fundoscopy',
        'Meningeal Signs',
        'Swallowing Function',
        'Facial Sensation',
      ]}
    />
  );
};
