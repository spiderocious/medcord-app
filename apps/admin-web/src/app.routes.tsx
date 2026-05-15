import { Route, Routes } from 'react-router-dom';

import { ROUTES } from '@solon/core';

import { AdminHome } from '@features/dashboard/admin-home.tsx';

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.ADMIN_HOME} element={<AdminHome />} />
      <Route path="*" element={<AdminHome />} />
    </Routes>
  );
}
