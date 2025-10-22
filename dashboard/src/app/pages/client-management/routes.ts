import { Routes } from '@angular/router';
import { ClientManagementViewAll } from '@client-management/components/client-management-view-all/client-management-view-all';
import { ClientManagementSettingClient } from './components/client-management-settings/client-management-settings-client';
import { clientDashboardGuard } from '@core/guards/client-dashboard.guard';
import { DashboardComponent } from '../client-dashboard/client-dashboard';

export const CLIENT_MANAGEMENT_ROUTES: Routes = [
  {
    path: '',
    component: ClientManagementViewAll,
  },
  {
    path: 'add',
    component: ClientManagementSettingClient,
  },

  // route for viewing client details
  {
    path: `dashboard/:id`,
    component: DashboardComponent,
    canActivate: [clientDashboardGuard],
  },
  //TODO: route for settings button on client details page
  {
    path: 'settings/:id',
    component: ClientManagementSettingClient,
  },
];
