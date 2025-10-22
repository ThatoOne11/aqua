import { formatDate } from '@angular/common';
import { CoaExportButtonComponent } from '@shared-components/coa-export-button/coa-export-button.component';
import { ViewCoaDashboard } from '@shared-components/view-coa-dashoard-button/view-coa-dashboard-button';
import { ColDef } from 'ag-grid-community';

export function getFileUploadColDefs(): ColDef[] {
  return [
    {
      headerName: 'Client',
      field: 'clientName',
      filter: true,
      sortable: true,
    },
    {
      headerName: 'Site',
      field: 'siteName',
      filter: true,
      sortable: true,
    },
    {
      headerName: 'Date Uploaded',
      field: 'dateUploaded',
      filter: false,
      sortable: true,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return formatDate(params.value, 'dd/MM/yyyy', 'en-US');
      },
    },
    {
      headerName: 'File Name',
      field: 'fileName',
      filter: true,
      sortable: true,
    },
    {
      headerName: 'No. of Readings',
      field: 'numReadings',
      filter: false,
      sortable: true,
    },
    {
      headerName: 'Uploaded By',
      field: 'uploadedBy',
      filter: true,
      sortable: true,
    },
    {
      headerName: 'Dashboard',
      field: 'id',
      filter: false,
      sortable: false,
      cellRenderer: ViewCoaDashboard,
    },
    {
      headerName: 'Download CSV',
      filter: false,
      sortable: false,
      cellRenderer: CoaExportButtonComponent,
    },
  ];
}
