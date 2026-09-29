import React from 'react';
import { AdminMasterDataView } from '../../components/admin/AdminMasterDataView';

export const AdminMedicinesPage: React.FC = () => {
  return (
    <AdminMasterDataView
      categoryKey="medicines"
      title="Medicines Catalog"
      subtitle="Prescription formulary items with generic ingredients, strengths, and dosage forms. Doctor manual entry remains supported."
      itemNameSingular="Medicine"
      hasStrengthAndForm={true}
    />
  );
};
