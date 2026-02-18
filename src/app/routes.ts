import { createBrowserRouter } from 'react-router';
import { ProtectedLayout } from '../components/layout/protected-layout';
import { LoginPage } from '../pages/auth/login';
import { InviteAcceptPage } from '../pages/auth/invite-accept';
import { Dashboard } from '../pages/dashboard';
import { AssetsList } from '../pages/assets/assets-list';
import { AssetDetail } from '../pages/assets/asset-detail';
import { AssetForm } from '../pages/assets/asset-form';
import { AssetAssignForm } from '../pages/assets/asset-assign-form';
import { TicketsList } from '../pages/tickets/tickets-list';
import { TicketDetail } from '../pages/tickets/ticket-detail';
import { TicketForm } from '../pages/tickets/ticket-form';

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: LoginPage,
  },
  {
    path: '/invite/:token',
    Component: InviteAcceptPage,
  },
  {
    path: '/',
    Component: ProtectedLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: 'dashboard', Component: Dashboard },
      { path: 'assets', Component: AssetsList },
      { path: 'assets/new', Component: AssetForm },
      { path: 'assets/:id', Component: AssetDetail },
      { path: 'assets/:id/edit', Component: AssetForm },
      { path: 'assets/:id/assign', Component: AssetAssignForm },
      { path: 'tickets', Component: TicketsList },
      { path: 'tickets/new', Component: TicketForm },
      { path: 'tickets/:id', Component: TicketDetail },
      {
        path: 'categories',
        lazy: async () => {
          const { CategoriesPage } = await import('../pages/categories');
          return { Component: CategoriesPage };
        },
      },
      {
        path: 'team',
        lazy: async () => {
          const { TeamPage } = await import('../pages/team');
          return { Component: TeamPage };
        },
      },
      {
        path: 'settings',
        lazy: async () => {
          const { SettingsPage } = await import('../pages/settings');
          return { Component: SettingsPage };
        },
      },
    ],
  },
]);
