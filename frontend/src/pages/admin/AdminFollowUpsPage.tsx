import React from 'react';
import { AdminMasterDataView } from '../../components/admin/AdminMasterDataView';

export const AdminFollowUpsPage: React.FC = () => {
  return (
    <AdminMasterDataView
      categoryKey="follow-ups"
      title="Follow-Up Durations"
      subtitle="Standardized clinical recall periods with Urdu labels (1 ہفتے بعد، 2 ہفتے بعد، 1 ماہ بعد)."
      itemNameSingular="Follow-Up Option"
      hasUrduLabel={true}
    />
  );
};
