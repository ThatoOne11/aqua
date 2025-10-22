import { formatDate } from '@angular/common';
import { ColDef } from 'ag-grid-community';

export function getUploadInfoColDefs(): ColDef[] {
  return [
    {
      headerName: 'Username',
      field: 'coa_username',
      filter: false,
      sortable: false,
    },
    {
      headerName: 'Client',
      field: 'client_name',
      filter: false,
      sortable: false,
    },
    {
      headerName: 'Site Name',
      field: 'site_name',
      filter: false,
      sortable: false,
    },
    {
      headerName: 'Project Manager',
      field: 'coa_project_manager',
      filter: false,
      sortable: false,
    },
    {
      headerName: 'Job Reference',
      field: 'coa_job_reference',
      filter: false,
      sortable: false,
    },
    {
      headerName: 'Team Leader',
      field: 'coa_team_leader',
      filter: false,
      sortable: false,
    },
    {
      headerName: 'Date',
      field: 'coa_reading_date',
      filter: false,
      sortable: false,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return formatDate(params.value, 'dd-MMM-yy', 'en-US');
      },
    },
    {
      headerName: 'ZetaSafe Client ID',
      field: 'coa_zeta_safe_client_id',
      filter: false,
      sortable: false,
    },
    {
      headerName: 'ZetaSafe Client API',
      field: 'coa_zeta_safe_client_api',
      filter: false,
      sortable: false,
    },
  ];
}
