import React from 'react';
import { AdminMasterDataView } from '../../components/admin/AdminMasterDataView';

export const AdminSymptomsPage: React.FC = () => {
  return (
    <AdminMasterDataView
      categoryKey="symptoms"
      title="Symptoms Master Data"
      subtitle="Predefined neurological symptoms and chief complaints available in doctor consultation pickers."
      itemNameSingular="Symptom"
      hasCategory={true}
      categoriesList={[
        'General',
        'Motor',
        'Sensory',
        'Cognitive',
        'Speech',
        'Visual',
        'Cranial Nerve',
        'Stroke-related',
        'Pain',
        'Vestibular',
      ]}
    />
  );
};
