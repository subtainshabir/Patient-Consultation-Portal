import React from 'react';
import { AdminMasterDataView } from '../../components/admin/AdminMasterDataView';

export const AdminInstructionsPage: React.FC = () => {
  return (
    <AdminMasterDataView
      categoryKey="instructions"
      title="Medicine Instructions"
      subtitle="Prescription administration instructions in Urdu (کھانے کے بعد، خالی پیٹ، سونے سے پہلے)."
      itemNameSingular="Instruction"
      hasUrduLabel={true}
    />
  );
};
