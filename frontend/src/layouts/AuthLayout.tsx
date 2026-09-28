import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-navy-50 flex flex-col justify-center items-center py-8 px-4 sm:px-6 lg:px-8">
      <Outlet />
    </div>
  );
};
