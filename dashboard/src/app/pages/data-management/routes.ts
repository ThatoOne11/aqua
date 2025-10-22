import { Routes } from '@angular/router';
import { DataManagementViewAll } from '@data-management/components/data-management-view-all/data-management-view-all';
import { ReviewUpload } from './components/review-upload/review-upload';

export const DATA_MANAGEMENT_ROUTES: Routes = [
  {
    path: '',
    component: DataManagementViewAll,
  },
  {
    path: 'review/:id',
    component: ReviewUpload,
  },
];
